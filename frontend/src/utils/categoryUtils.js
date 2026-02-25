const normalize = (value = '') =>
    String(value)
        .trim()
        .toLowerCase()
        .replace(/&/g, ' and ')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();

const matchesName = (left, right) => {
    const leftNormalized = normalize(left);
    const rightNormalized = normalize(right);
    if (!leftNormalized || !rightNormalized) return false;
    if (leftNormalized === rightNormalized) return true;

    // Small singular/plural tolerance for category labels.
    if (leftNormalized.endsWith('s') && leftNormalized.slice(0, -1) === rightNormalized) return true;
    if (rightNormalized.endsWith('s') && rightNormalized.slice(0, -1) === leftNormalized) return true;

    return false;
};

const toIdSet = (...values) => {
    const set = new Set();
    values.flat().forEach((value) => {
        if (value === undefined || value === null) return;
        const normalizedValue = String(value).trim();
        if (normalizedValue) set.add(normalizedValue);
    });
    return set;
};

const setHasAny = (set, candidates = []) => {
    for (const candidate of candidates) {
        if (candidate === undefined || candidate === null) continue;
        if (set.has(String(candidate).trim())) return true;
    }
    return false;
};

export const resolveCategoryPath = (categories, products, baseCategoryName, subPathStr) => {
    const decodedBaseCategoryName = decodeURIComponent(baseCategoryName || '');

    // 1. Find Base Category
    let current = categories.find((c) => matchesName(c.name, decodedBaseCategoryName));
    if (!current) return null;

    const breadcrumbs = [current];
    const baseCategoryIds = toIdSet(current.id, current._id);

    // 2. Traverse Sub Path if exists
    if (subPathStr) {
        const segments = subPathStr.split('/').filter(Boolean); // "Mobiles", "Samsung"
        for (const segment of segments) {
            if (current.subCategories) {
                const decodedSegment = decodeURIComponent(segment);
                const found = current.subCategories.find((s) =>
                    matchesName(typeof s === 'string' ? s : s.name, decodedSegment)
                );
                if (found) {
                    current = typeof found === 'string' ? { name: found, subCategories: [] } : found;
                    breadcrumbs.push(current);
                }
            }
        }
    }

    // 3. Filter Products
    const filteredProducts = products.filter((p) => {
        const productCategoryName = typeof p.category === 'string' ? p.category : p.category?.name;
        const productPathIds = Array.isArray(p.categoryPath) ? p.categoryPath : [];
        const productTagValues = Array.isArray(p.tags) ? p.tags : [];

        const matchesBaseById =
            setHasAny(baseCategoryIds, [p.categoryId]) ||
            productPathIds.some((pathValue) => setHasAny(baseCategoryIds, [pathValue]));

        const matchesBaseByName =
            matchesName(productCategoryName, breadcrumbs[0].name) ||
            productTagValues.some((tag) => matchesName(tag, breadcrumbs[0].name));

        if (!matchesBaseById && !matchesBaseByName) return false;

        if (breadcrumbs.length > 1) {
            const currentName = current?.name;
            const targetSubCategoryIds = toIdSet(current?.id, current?._id);

            const productSubCategories = Array.isArray(p.subCategories) ? p.subCategories : [];
            const productSubCategory = p.subCategory;

            const matchesSubById =
                productSubCategories.some((sub) =>
                    setHasAny(targetSubCategoryIds, [
                        typeof sub === 'string' ? sub : sub?.id,
                        typeof sub === 'string' ? sub : sub?._id
                    ])
                ) ||
                setHasAny(targetSubCategoryIds, [productSubCategory?.id, productSubCategory?._id]);

            const matchesSubByName =
                productSubCategories.some((sub) => matchesName(typeof sub === 'string' ? sub : sub?.name, currentName)) ||
                matchesName(productSubCategory?.name, currentName) ||
                productTagValues.some((tag) => matchesName(tag, currentName));

            const normalizedCurrentName = normalize(currentName);
            const matchesSubByProductName =
                normalizedCurrentName && normalize(p.name).includes(normalizedCurrentName);

            return matchesSubById || matchesSubByName || matchesSubByProductName;
        }

        return true;
    });

    return {
        data: current,
        breadcrumbs,
        products: filteredProducts,
        isLeaf: !current.subCategories || current.subCategories.length === 0
    };
};
