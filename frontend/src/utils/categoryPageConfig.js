import legacyCategoryPageData from '../modules/user/data/categoryPageData';

export const CATEGORY_PAGE_BUILDER_STORAGE_KEY = 'category-page-builder-catalog-v2';
const LEGACY_CATEGORY_PAGE_BUILDER_STORAGE_KEY = 'category-page-builder-dummy-catalog-v1';

const normalizeText = (value) => String(value || '').trim();
const normalizeKey = (value) => normalizeText(value).toLowerCase();

const makeLocalId = (prefix, seed) => {
    const cleanSeed = normalizeKey(seed).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return `${prefix}-${cleanSeed || 'item'}`;
};

const toArray = (value) => (Array.isArray(value) ? value : []);

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
        return Array.isArray(parsed) && parsed.length > 0 ? parsed : legacyCatalog;
    } catch {
        return legacyCatalog;
    }
};

export const writeCategoryPageCatalog = (catalog) => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(CATEGORY_PAGE_BUILDER_STORAGE_KEY, JSON.stringify(catalog));
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
        const subCategories = getCategoryChildren(category)
            .map((item) => normalizeSubCategory(item, existingSubCategoryMap.get(normalizeKey(item?.name))))
            .filter((item) => item.name);

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
    if (baseItems.length === 0) return [];
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
