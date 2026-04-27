import legacyCategoryPageData from '../modules/user/data/categoryPageData';
import API from '../services/api';

export const CATEGORY_PAGE_BUILDER_STORAGE_KEY = 'category-page-builder-catalog-v2';
const LEGACY_CATEGORY_PAGE_BUILDER_STORAGE_KEY = 'category-page-builder-dummy-catalog-v1';
const CATEGORY_PAGE_BUILDER_IDB_NAME = 'indiankart-category-page-builder';
const CATEGORY_PAGE_BUILDER_IDB_STORE = 'catalog';
const CATEGORY_PAGE_BUILDER_IDB_KEY = 'catalog-v2';
const INDEXED_DB_POINTER = '__indexed_db__';
const CATEGORY_PAGE_BUILDER_SERVER_FIELD = 'categoryPageCatalog';

const normalizeText = (value) => String(value || '').trim();
const normalizeKey = (value) => normalizeText(value).toLowerCase();

const makeLocalId = (prefix, seed) => {
    const cleanSeed = normalizeKey(seed).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return `${prefix}-${cleanSeed || 'item'}`;
};

const toArray = (value) => (Array.isArray(value) ? value : []);

const normalizeDesktopImageItemsPerRow = (value) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return '';
    const rounded = Math.round(parsed);
    if (rounded < 1) return '';
    return Math.min(6, rounded);
};

const sanitizeSectionForWidthDrivenImages = (section = {}) => {
    if (!section || typeof section !== 'object') return section;
    const { imageHeight, ...rest } = section;
    return {
        ...rest,
        desktopImageItemsPerRow: normalizeDesktopImageItemsPerRow(rest.desktopImageItemsPerRow),
        items: toArray(rest.items)
    };
};

const sanitizeCategoryPageCatalog = (catalog = []) => {
    return toArray(catalog).map((entry) => ({
        ...entry,
        pageSections: toArray(entry?.pageSections).map((section) => sanitizeSectionForWidthDrivenImages(section))
    }));
};

const getCategoryId = (category) => String(category?.id || category?._id || normalizeKey(category?.name) || '');
const getCategoryDbId = (category) => String(category?._id || category?.dbId || category?.id || '');

const getCategoryChildren = (category) => {
    const directChildren = toArray(category?.children);
    if (directChildren.length > 0) return directChildren;
    return toArray(category?.subCategories);
};

const getSubCategoryImage = (subCategory) => normalizeText(
    subCategory?.image ||
    subCategory?.imageUrl ||
    subCategory?.thumbnail ||
    subCategory?.icon
);

const normalizeSubCategory = (subCategory, fallback = {}) => ({
    id: String(subCategory?.id || subCategory?._id || fallback?.id || makeLocalId('sub', subCategory?.name || fallback?.name)),
    name: normalizeText(subCategory?.name || fallback?.name),
    image: getSubCategoryImage(subCategory) || normalizeText(fallback?.image)
});

const buildCategoryStrip = (subCategories = [], existingStrip = {}) => {
    const existingItems = new Map(
        toArray(existingStrip?.items).map((item, index) => [
            String(item?.subCategoryId || ''),
            {
                id: String(item?.id || makeLocalId('strip', `${item?.subCategoryId || index}`)),
                subCategoryId: String(item?.subCategoryId || ''),
                isActive: item?.isActive !== false,
                order: Number(item?.order) || index + 1
            }
        ])
    );

    const items = subCategories.map((subCategory, index) => {
        const existing = existingItems.get(String(subCategory.id));
        return existing || {
            id: makeLocalId('strip', subCategory.name || subCategory.id),
            subCategoryId: String(subCategory.id),
            isActive: true,
            order: index + 1
        };
    });

    return {
        isActive: existingStrip?.isActive !== false,
        items: items
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map((item, index) => ({ ...item, order: index + 1 }))
    };
};

const buildLegacyCatalog = () => {
    return Object.entries(legacyCategoryPageData || {}).map(([key, entry]) => {
        const displayName = normalizeText(entry?.categoryName) || key.charAt(0).toUpperCase() + key.slice(1);
        const legacyQuickLinks = toArray(entry?.quickLinks).map((item) => ({
            id: String(item?.id || makeLocalId('sub', item?.targetName || item?.name)),
            name: normalizeText(item?.targetName || item?.name),
            image: normalizeText(item?.image)
        })).filter((item) => item.name);

        const heroSection = toArray(entry?.heroSlides).length > 0 ? {
            id: makeLocalId('section', `${displayName}-hero`),
            sectionKind: 'image',
            isActive: true,
            order: 1,
            title: '',
            description: '',
            sectionLink: '',
            showArrow: false,
            backgroundType: 'color',
            backgroundColor: '#ffffff',
            backgroundImage: '',
            mediaDisplay: 'carousel',
            items: toArray(entry.heroSlides).map((slide, index) => ({
                id: makeLocalId('item', `${displayName}-hero-${index + 1}`),
                itemType: 'image',
                image: normalizeText(slide?.image),
                title: '',
                description: '',
                link: normalizeText(slide?.redirectLink)
            }))
        } : null;

        const scrollSection = toArray(entry?.scrollSection?.images).length > 0 ? {
            id: makeLocalId('section', `${displayName}-scroll`),
            sectionKind: 'image',
            isActive: true,
            order: heroSection ? 2 : 1,
            title: normalizeText(entry?.scrollSection?.title),
            description: '',
            sectionLink: '',
            showArrow: false,
            backgroundType: 'color',
            backgroundColor: '#ffffff',
            backgroundImage: '',
            mediaDisplay: 'scroll',
            items: toArray(entry.scrollSection.images).map((item, index) => ({
                id: makeLocalId('item', `${displayName}-scroll-${index + 1}`),
                itemType: 'image',
                image: normalizeText(item?.image),
                title: '',
                description: '',
                link: normalizeText(item?.redirectLink)
            }))
        } : null;

        return {
            id: makeLocalId('category', displayName),
            dbId: '',
            name: displayName,
            subCategories: legacyQuickLinks,
            products: [],
            categoryStrip: buildCategoryStrip(legacyQuickLinks),
            pageSections: [heroSection, scrollSection].filter(Boolean)
        };
    });
};

const legacyCatalog = buildLegacyCatalog();

export const readCategoryPageCatalog = () => {
    if (typeof window === 'undefined') return legacyCatalog;

    try {
        const stored = window.localStorage.getItem(CATEGORY_PAGE_BUILDER_STORAGE_KEY);
        const legacyStored = window.localStorage.getItem(LEGACY_CATEGORY_PAGE_BUILDER_STORAGE_KEY);
        const source = stored || legacyStored;
        if (!source) return legacyCatalog;

        const parsed = JSON.parse(source);
        return Array.isArray(parsed) && parsed.length > 0 ? sanitizeCategoryPageCatalog(parsed) : legacyCatalog;
    } catch {
        return legacyCatalog;
    }
};

const openCategoryPageBuilderDb = () => new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB unavailable'));
        return;
    }

    const request = window.indexedDB.open(CATEGORY_PAGE_BUILDER_IDB_NAME, 1);

    request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(CATEGORY_PAGE_BUILDER_IDB_STORE)) {
            db.createObjectStore(CATEGORY_PAGE_BUILDER_IDB_STORE);
        }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB'));
});

const readCatalogFromIndexedDb = async () => {
    const db = await openCategoryPageBuilderDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(CATEGORY_PAGE_BUILDER_IDB_STORE, 'readonly');
        const store = transaction.objectStore(CATEGORY_PAGE_BUILDER_IDB_STORE);
        const request = store.get(CATEGORY_PAGE_BUILDER_IDB_KEY);

        request.onsuccess = () => {
            const result = request.result;
            resolve(Array.isArray(result) && result.length > 0 ? result : legacyCatalog);
        };
        request.onerror = () => reject(request.error || new Error('Failed to read IndexedDB catalog'));
        transaction.oncomplete = () => db.close();
    });
};

const writeCatalogToIndexedDb = async (catalog) => {
    const db = await openCategoryPageBuilderDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(CATEGORY_PAGE_BUILDER_IDB_STORE, 'readwrite');
        const store = transaction.objectStore(CATEGORY_PAGE_BUILDER_IDB_STORE);
        store.put(catalog, CATEGORY_PAGE_BUILDER_IDB_KEY);

        transaction.oncomplete = () => {
            db.close();
            resolve();
        };
        transaction.onerror = () => reject(transaction.error || new Error('Failed to write IndexedDB catalog'));
    });
};

let catalogCachePromise = null;

export const readCategoryPageCatalogAsync = async () => {
    if (catalogCachePromise) return catalogCachePromise;

    catalogCachePromise = (async () => {
        try {
            const { data } = await API.get('/settings');
            const serverCatalog = data?.[CATEGORY_PAGE_BUILDER_SERVER_FIELD];
            if (Array.isArray(serverCatalog) && serverCatalog.length >= 0) {
                if (typeof window !== 'undefined') {
                    try {
                        const serialized = JSON.stringify(serverCatalog);
                        window.localStorage.setItem(CATEGORY_PAGE_BUILDER_STORAGE_KEY, serialized);
                        try {
                            await writeCatalogToIndexedDb(serverCatalog);
                        } catch {
                            // Ignore IndexedDB mirror failure.
                        }
                    } catch {
                        // Ignore local mirror issues.
                    }
                }
                const sanitizedServerCatalog = sanitizeCategoryPageCatalog(serverCatalog);
                return sanitizedServerCatalog.length > 0 ? sanitizedServerCatalog : legacyCatalog;
            }
        } catch {
            // Fallback to local/offline catalog below.
        }

        const localCatalog = sanitizeCategoryPageCatalog(readCategoryPageCatalog());
        if (localCatalog !== legacyCatalog) {
            return localCatalog;
        }

        if (typeof window === 'undefined') return legacyCatalog;

        try {
            const stored = window.localStorage.getItem(CATEGORY_PAGE_BUILDER_STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed?.storage === INDEXED_DB_POINTER) {
                    return await readCatalogFromIndexedDb();
                }
            }
        } catch {
            return legacyCatalog;
        }

        try {
            return await readCatalogFromIndexedDb();
        } catch {
            return legacyCatalog;
        }
    })();

    return catalogCachePromise;
};

export const writeCategoryPageCatalog = async (catalog) => {
    catalogCachePromise = null; // Invalidate cache
    if (typeof window === 'undefined') return;

    const sanitizedCatalog = sanitizeCategoryPageCatalog(catalog);

    try {
        await API.put('/settings', {
            [CATEGORY_PAGE_BUILDER_SERVER_FIELD]: sanitizedCatalog
        });
    } catch {
        // Continue with local persistence fallback.
    }

    const serialized = JSON.stringify(sanitizedCatalog);

    try {
        window.localStorage.setItem(CATEGORY_PAGE_BUILDER_STORAGE_KEY, serialized);
        try {
            await writeCatalogToIndexedDb(sanitizedCatalog);
        } catch {
            // LocalStorage save succeeded, so IndexedDB mirror failure can be ignored.
        }
        window.dispatchEvent(new CustomEvent('category-page-builder-updated'));
        return;
    } catch (error) {
        await writeCatalogToIndexedDb(sanitizedCatalog);
        try {
            window.localStorage.removeItem(CATEGORY_PAGE_BUILDER_STORAGE_KEY);
            window.localStorage.setItem(
                CATEGORY_PAGE_BUILDER_STORAGE_KEY,
                JSON.stringify({
                    storage: INDEXED_DB_POINTER,
                    updatedAt: Date.now()
                })
            );
        } catch {
            // IndexedDB already has the actual payload.
        }
        window.dispatchEvent(new CustomEvent('category-page-builder-updated'));
        return;
    }
};

export const mergeCategoryPageCatalogWithCategories = (catalog, categories = []) => {
    const existingEntries = new Map(
        toArray(catalog).map((entry) => [normalizeKey(entry?.name), entry])
    );

    if (!Array.isArray(categories) || categories.length === 0) {
        return toArray(catalog);
    }

    const merged = categories.map((category) => {
        const categoryName = normalizeText(category?.name);
        const existing = existingEntries.get(normalizeKey(categoryName)) || {};
        const existingSubCategoryMap = new Map(
            toArray(existing?.subCategories).map((item) => [normalizeKey(item?.name), item])
        );
        const incomingSubCategories = getCategoryChildren(category)
            .map((item) => normalizeSubCategory(item, existingSubCategoryMap.get(normalizeKey(item?.name))))
            .filter((item) => item.name);
        const subCategories = incomingSubCategories.length > 0
            ? incomingSubCategories
            : toArray(existing?.subCategories);

        return {
            ...existing,
            id: getCategoryId(category) || String(existing?.id || makeLocalId('category', categoryName)),
            dbId: getCategoryDbId(category) || String(existing?.dbId || ''),
            name: categoryName,
            subCategories,
            products: toArray(existing?.products),
            categoryStrip: buildCategoryStrip(subCategories, existing?.categoryStrip),
            pageSections: toArray(existing?.pageSections)
                .map((section, index) => ({ ...section, order: Number(section?.order) || index + 1 }))
                .sort((a, b) => (a.order || 0) - (b.order || 0))
        };
    });

    const knownKeys = new Set(categories.map((category) => normalizeKey(category?.name)));
    const extras = toArray(catalog).filter((entry) => !knownKeys.has(normalizeKey(entry?.name)));

    return [...merged, ...extras];
};

export const getCategoryPageConfig = (categoryName, categories = []) => {
    const mergedCatalog = mergeCategoryPageCatalogWithCategories(readCategoryPageCatalog(), categories);
    return mergedCatalog.find((entry) => normalizeKey(entry?.name) === normalizeKey(categoryName)) || null;
};

export const getCategoryStripItems = (categoryConfig) => {
    if (!categoryConfig?.categoryStrip?.isActive) return [];

    const subCategoryMap = new Map(
        toArray(categoryConfig?.subCategories).map((item) => [String(item?.id), item])
    );

    return toArray(categoryConfig?.categoryStrip?.items)
        .filter((item) => item?.isActive !== false)
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map((item) => subCategoryMap.get(String(item?.subCategoryId)))
        .filter(Boolean)
        .map((subCategory) => ({
            id: subCategory.id,
            name: subCategory.name,
            image: subCategory.image,
            targetName: subCategory.name
        }));
};

export const getOrderedCategorySubCategories = (categoryConfig, detailedSubCategories = []) => {
    const baseItems = toArray(categoryConfig?.subCategories);
    if (baseItems.length === 0) {
        if (!Array.isArray(detailedSubCategories) || detailedSubCategories.length === 0) return [];
        return detailedSubCategories
            .map((item) => normalizeSubCategory(item))
            .filter((item) => item.name);
    }
    if (!Array.isArray(detailedSubCategories) || detailedSubCategories.length === 0) return baseItems;

    const detailedById = new Map(
        detailedSubCategories.map((item) => [String(item?.id || item?._id || ''), item])
    );
    const detailedByName = new Map(
        detailedSubCategories.map((item) => [normalizeKey(item?.name), item])
    );

    const ordered = baseItems.map((item) => {
        const detailed = detailedById.get(String(item?.id || ''))
            || detailedByName.get(normalizeKey(item?.name));

        return detailed ? normalizeSubCategory(detailed, item) : item;
    });

    const usedNames = new Set(ordered.map((item) => normalizeKey(item?.name)));
    const extras = detailedSubCategories
        .filter((item) => !usedNames.has(normalizeKey(item?.name)))
        .map((item) => normalizeSubCategory(item));

    return [...ordered, ...extras];
};
