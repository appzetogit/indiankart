import { useState, useEffect } from 'react';
import API from '../services/api';
import { DISPOSABLE_CACHE_PREFIX, purgeDisposableCache } from '../utils/safeStorage';

const CACHE_TTL_MS = 5 * 60 * 1000;
const PERSISTED_CACHE_PREFIX = DISPOSABLE_CACHE_PREFIX;
// Every product seen used to be written to localStorage, twice, and never
// evicted: one visit to Home stored ~1,800 entries (~3.7M chars). On phones
// that filled the quota, and the login's own writes then threw after the
// server had accepted the OTP. Single products now stay in memory only, and
// any entry too large to be worth persisting is skipped.
const MAX_PERSISTED_ENTRY_CHARS = 200 * 1024;
const isMemoryOnlyKey = (key) => String(key).startsWith('product:');

// Clear what earlier versions left behind on customers' devices.
purgeDisposableCache(`${PERSISTED_CACHE_PREFIX}product:`);
const cacheStore = new Map();
const inflightStore = new Map();

// Anything that lists products is kept briefly, so a product hidden in admin
// drops off customers' screens within about a minute.
const PRODUCT_LIST_CACHE_TTL_MS = 60 * 1000;
const ttlFor = (key) => (/^(products|home-sections|banners)/.test(String(key || '')) ? PRODUCT_LIST_CACHE_TTL_MS : CACHE_TTL_MS);
const isCacheFresh = (entry, key) => entry && (Date.now() - entry.timestamp) < ttlFor(key);

const readPersistedCache = (key) => {
    try {
        const raw = localStorage.getItem(`${PERSISTED_CACHE_PREFIX}${key}`);
        if (!raw) return null;

        const parsed = JSON.parse(raw);
        if (!isCacheFresh(parsed, key)) {
            localStorage.removeItem(`${PERSISTED_CACHE_PREFIX}${key}`);
            return null;
        }

        return parsed.data ?? null;
    } catch {
        return null;
    }
};

const readCache = (key) => {
    const entry = cacheStore.get(key);
    if (isCacheFresh(entry, key)) return entry.data;

    const persisted = readPersistedCache(key);
    if (persisted !== null) {
        cacheStore.set(key, { data: persisted, timestamp: Date.now() });
        return persisted;
    }

    return null;
};

const writeCache = (key, data) => {
    const payload = { data, timestamp: Date.now() };
    cacheStore.set(key, payload);
    if (isMemoryOnlyKey(key)) return data;
    try {
        const serialized = JSON.stringify(payload);
        if (serialized.length > MAX_PERSISTED_ENTRY_CHARS) return data;
        localStorage.setItem(`${PERSISTED_CACHE_PREFIX}${key}`, serialized);
    } catch {
        // Ignore quota issues; in-memory cache is still available.
    }
    return data;
};

const getOrFetch = async (key, fetcher) => {
    const cached = readCache(key);
    if (cached !== null) return cached;

    if (inflightStore.has(key)) {
        return inflightStore.get(key);
    }

    const request = (async () => {
        const data = await fetcher();
        return writeCache(key, data);
    })().finally(() => {
        inflightStore.delete(key);
    });

    inflightStore.set(key, request);
    return request;
};

const normalizeProduct = (product) => {
    if (!product) return product;
    if (product.skus && Array.isArray(product.skus) && product.skus.length > 0) {
        const firstSku = product.skus[0];
        return {
            ...product,
            price: firstSku.price ?? product.price,
            originalPrice: firstSku.originalPrice ?? product.originalPrice ?? firstSku.price ?? product.price
        };
    }
    return product;
};

const rememberProduct = (product) => {
    if (!product) return;
    const normalized = normalizeProduct(product);

    const keys = [normalized.id, normalized._id]
        .filter(Boolean)
        .map((value) => `product:${String(value)}`);

    keys.forEach((key) => writeCache(key, normalized));
};

const rememberProductList = (products) => {
    if (!Array.isArray(products)) return;
    products.forEach(rememberProduct);
};

export const prefetchProductById = async (id) => {
    if (!id) return null;

    const key = `product:${String(id)}`;

    try {
        const product = await getOrFetch(key, async () => {
            const { data } = await API.get(`/products/${id}`);
            return data;
        });
        rememberProduct(product);
        return product;
    } catch {
        return null;
    }
};

export const useProducts = (options = {}) => {
    const { enabled = true, lite = false } = options;
    const cacheKey = lite ? 'products-lite' : 'products';
    const initialProducts = readCache(cacheKey) || [];
    const [products, setProducts] = useState(initialProducts);
    const [loading, setLoading] = useState(enabled && initialProducts.length === 0);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!enabled) {
            setLoading(false);
            return;
        }

        let active = true;
        const liteQuery = lite ? '?lite=true' : '';

        const fetchProducts = async () => {
            try {
                const data = await getOrFetch(cacheKey, async () => {
                    const { data } = await API.get(`/products${liteQuery}`);
                    return Array.isArray(data) ? data.map(normalizeProduct) : data;
                });

                rememberProductList(data);

                if (!active) return;
                setProducts(data);
                setError(null);
            } catch (err) {
                if (!active) return;
                setError(err.message);
            } finally {
                if (active) setLoading(false);
            }
        };

        fetchProducts();

        return () => {
            active = false;
        };
    }, [enabled, lite]);

    return { products, loading, error };
};

export const useProduct = (id) => {
    const key = id ? `product:${String(id)}` : null;
    const cachedProduct = key ? readCache(key) : null;
    const [product, setProduct] = useState(cachedProduct);
    const [loading, setLoading] = useState(!cachedProduct);
    const [error, setError] = useState(null);
    const [unavailable, setUnavailable] = useState(false);

    useEffect(() => {
        let active = true;
        setUnavailable(false);

        const fetchProduct = async () => {
            if (!id) {
                setLoading(false);
                return;
            }

            try {
                // Product detail should always revalidate from API so stock/price
                // updates from admin are reflected immediately on PDP.
                const { data: rawData } = await API.get(`/products/${id}`);
                const productData = normalizeProduct(rawData);

                rememberProduct(productData);

                if (!active) return;
                setProduct(productData);
                setError(null);
            } catch (err) {
                if (!active) return;
                if (err?.response?.status === 404) {
                    // Hidden or removed: never keep showing a cached copy.
                    cacheStore.delete(key);
                    setProduct(null);
                    setUnavailable(true);
                }
                setError(err.message);
            } finally {
                if (active) setLoading(false);
            }
        };

        fetchProduct();

        return () => {
            active = false;
        };
    }, [id]);

    return { product, loading, error, unavailable };
};

export const useCategories = (options = {}) => {
    const { forceRefresh = false, lite = false } = options;
    const cacheKey = lite ? 'categories-lite' : 'categories';
    const initialCategories = forceRefresh ? [] : (readCache(cacheKey) || []);
    const [categories, setCategories] = useState(initialCategories);
    const [loading, setLoading] = useState(initialCategories.length === 0);
    const [error, setError] = useState(null);

    useEffect(() => {
        let active = true;
        const endpoint = lite ? '/categories?lite=true' : '/categories';

        const fetchCategories = async () => {
            try {
                const data = forceRefresh
                    ? await (async () => {
                        const { data } = await API.get(endpoint);
                        writeCache(cacheKey, data);
                        return data;
                    })()
                    : await getOrFetch(cacheKey, async () => {
                        const { data } = await API.get(endpoint);
                        return data;
                    });

                if (!active) return;
                setCategories(data);
                setError(null);
            } catch (err) {
                if (!active) return;
                setError(err.message);
            } finally {
                if (active) setLoading(false);
            }
        };

        fetchCategories();

        return () => {
            active = false;
        };
    }, [forceRefresh, lite]);

    return { categories, loading, error };
};

export const useHomeSections = () => {
    const initialSections = readCache('home-sections') || [];
    const [sections, setSections] = useState(initialSections);
    const [loading, setLoading] = useState(initialSections.length === 0);
    const [error, setError] = useState(null);

    useEffect(() => {
        let active = true;

        const fetchSections = async () => {
            try {
                const data = await getOrFetch('home-sections', async () => {
                    const { data } = await API.get('/home-sections');
                    return data;
                });

                const sectionProducts = data.flatMap((section) =>
                    Array.isArray(section.products) ? section.products.map(normalizeProduct) : []
                );
                rememberProductList(sectionProducts);

                if (!active) return;
                setSections(data);
                setError(null);
            } catch (err) {
                if (!active) return;
                setError(err.message);
            } finally {
                if (active) setLoading(false);
            }
        };

        fetchSections();

        return () => {
            active = false;
        };
    }, []);

    return { sections, loading, error };
};

export const useBanners = () => {
    const initialBanners = readCache('banners') || [];
    const [banners, setBanners] = useState(initialBanners);
    const [loading, setLoading] = useState(initialBanners.length === 0);
    const [error, setError] = useState(null);

    useEffect(() => {
        let active = true;

        const fetchBanners = async () => {
            try {
                const { data } = await API.get('/banners');
                writeCache('banners', data);

                if (!active) return;
                setBanners(data);
                setError(null);
            } catch (err) {
                if (!active) return;
                setError(err.message);
            } finally {
                if (active) setLoading(false);
            }
        };

        fetchBanners();

        return () => {
            active = false;
        };
    }, []);

    return { banners, loading, error };
};

export const useHomeLayout = () => {
    const initialLayout = readCache('home-layout') || [];
    const [layout, setLayout] = useState(initialLayout);
    const [loading, setLoading] = useState(initialLayout.length === 0);
    const [error, setError] = useState(null);

    useEffect(() => {
        let active = true;

        const fetchLayout = async () => {
            try {
                const items = await getOrFetch('home-layout', async () => {
                    const { data } = await API.get('/home-layout');
                    return data.items || [];
                });

                if (!active) return;
                setLayout(items);
                setError(null);
            } catch (err) {
                if (!active) return;
                setError(err.message);
            } finally {
                if (active) setLoading(false);
            }
        };

        fetchLayout();

        return () => {
            active = false;
        };
    }, []);

    return { layout, loading, error };
};
export const useSubCategoriesByCategory = (categoryId) => {
    const normalizedCategoryId = String(categoryId || '').trim();
    const cacheKey = normalizedCategoryId ? `sub-categories:${normalizedCategoryId}` : null;
    const initialData = cacheKey ? (readCache(cacheKey) || []) : [];
    const [subCategories, setSubCategories] = useState(initialData);
    const [loading, setLoading] = useState(Boolean(normalizedCategoryId) && initialData.length === 0);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!normalizedCategoryId || !cacheKey) {
            setSubCategories([]);
            setLoading(false);
            setError(null);
            return;
        }
        let active = true;

        const fetchSubs = async () => {
            try {
                const data = await getOrFetch(cacheKey, async () => {
                    const { data } = await API.get(`/subcategories/category/${normalizedCategoryId}`);
                    return data;
                });

                if (!active) return;
                setSubCategories(data);
                setError(null);
            } catch (err) {
                if (!active) return;
                setError(err.message);
            } finally {
                if (active) setLoading(false);
            }
        };

        fetchSubs();
        return () => { active = false; };
    }, [cacheKey, normalizedCategoryId]);

    return { subCategories, loading, error };
};
