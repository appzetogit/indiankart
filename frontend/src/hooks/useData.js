import { useState, useEffect } from 'react';
import API from '../services/api';

const CACHE_TTL_MS = 5 * 60 * 1000;
const PERSISTED_CACHE_PREFIX = 'ik-cache-v1:';
const cacheStore = new Map();
const inflightStore = new Map();

const isCacheFresh = (entry) => entry && (Date.now() - entry.timestamp) < CACHE_TTL_MS;

const readPersistedCache = (key) => {
    try {
        const raw = localStorage.getItem(`${PERSISTED_CACHE_PREFIX}${key}`);
        if (!raw) return null;

        const parsed = JSON.parse(raw);
        if (!isCacheFresh(parsed)) {
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
    if (isCacheFresh(entry)) return entry.data;

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
    try {
        localStorage.setItem(`${PERSISTED_CACHE_PREFIX}${key}`, JSON.stringify(payload));
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

const rememberProduct = (product) => {
    if (!product) return;

    const keys = [product.id, product._id]
        .filter(Boolean)
        .map((value) => `product:${String(value)}`);

    keys.forEach((key) => writeCache(key, product));
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
    const { enabled = true } = options;
    const initialProducts = readCache('products') || [];
    const [products, setProducts] = useState(initialProducts);
    const [loading, setLoading] = useState(enabled && initialProducts.length === 0);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!enabled) {
            setLoading(false);
            return;
        }

        let active = true;

        const fetchProducts = async () => {
            try {
                const data = await getOrFetch('products', async () => {
                    const { data } = await API.get('/products');
                    return data;
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
    }, [enabled]);

    return { products, loading, error };
};

export const useProduct = (id) => {
    const key = id ? `product:${String(id)}` : null;
    const cachedProduct = key ? readCache(key) : null;
    const [product, setProduct] = useState(cachedProduct);
    const [loading, setLoading] = useState(!cachedProduct);
    const [error, setError] = useState(null);

    useEffect(() => {
        let active = true;

        const fetchProduct = async () => {
            if (!id) {
                setLoading(false);
                return;
            }

            try {
                const productData = await getOrFetch(`product:${String(id)}`, async () => {
                    const { data } = await API.get(`/products/${id}`);
                    return data;
                });

                rememberProduct(productData);

                if (!active) return;
                setProduct(productData);
                setError(null);
            } catch (err) {
                if (!active) return;
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

    return { product, loading, error };
};

export const useCategories = () => {
    const initialCategories = readCache('categories') || [];
    const [categories, setCategories] = useState(initialCategories);
    const [loading, setLoading] = useState(initialCategories.length === 0);
    const [error, setError] = useState(null);

    useEffect(() => {
        let active = true;

        const fetchCategories = async () => {
            try {
                const data = await getOrFetch('categories', async () => {
                    const { data } = await API.get('/categories');
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
    }, []);

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
                    Array.isArray(section.products) ? section.products : []
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
                const data = await getOrFetch('banners', async () => {
                    const { data } = await API.get('/banners');
                    return data;
                });

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
