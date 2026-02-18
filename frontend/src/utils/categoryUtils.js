export const resolveCategoryPath = (categories, products, baseCategoryName, subPathStr) => {
    // 1. Find Base Category
    let current = categories.find(c => c.name.toLowerCase() === baseCategoryName?.toLowerCase());
    if (!current) return null;

    const breadcrumbs = [current];

    // 2. Traverse Sub Path if exists
    if (subPathStr) {
        const segments = subPathStr.split('/').filter(Boolean); // "Mobiles", "Samsung"
        for (const segment of segments) {
            if (current.subCategories) {
                const decodedSegment = decodeURIComponent(segment);
                const found = current.subCategories.find(s => 
                    (typeof s === 'string' ? s : s.name).toLowerCase() === decodedSegment.toLowerCase()
                );
                if (found) {
                    current = typeof found === 'string' ? { name: found, subCategories: [] } : found;
                    breadcrumbs.push(current);
                }
            }
        }
    }

    // 3. Filter Products
    const filteredProducts = products.filter(p => {
        const normalize = (s) => (s || '').toLowerCase().replace(/s$/, ''); // Basic singularization
        
        const baseNameNorm = normalize(breadcrumbs[0].name);
        const productCatNorm = normalize(p.category);
        
        const matchesBase = productCatNorm === baseNameNorm || 
                           (p.tags && p.tags.some(tag => normalize(tag) === baseNameNorm));
        
        if (!matchesBase) return false;

        if (breadcrumbs.length > 1) {
            const currentNameNorm = normalize(current.name);
            // Check new subCategories field (populated)
            if (p.subCategories && p.subCategories.some(sub => normalize(sub.name) === currentNameNorm)) return true;
            if (normalize(p.subCategory?.name) === currentNameNorm) return true; // Fallback for old data
            
            if (p.tags) {
                return p.tags.some(tag => normalize(tag) === currentNameNorm);
            }
            return p.name?.toLowerCase().includes(currentNameNorm);
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
