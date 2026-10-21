import Product from '../models/Product.js';

// Orders keep the name a product had when it was bought (orderItems.name).
// Everywhere orders are shown, the product's current name is used instead so a
// rename shows up in order history, admin lists, invoices and exports. The
// stored snapshot is left untouched and is the fallback for deleted products.

export const getProductNameMap = async (productIds = null) => {
    const filter = productIds ? { id: { $in: productIds } } : {};
    const products = await Product.find(filter).select('id name').lean();
    return new Map(products.map((product) => [Number(product.id), product.name]));
};

export const applyCurrentProductNamesSync = (orders = [], nameMap) => {
    for (const order of orders) {
        for (const item of order?.orderItems || []) {
            const currentName = nameMap.get(Number(item?.product));
            if (currentName) item.name = currentName;
        }
    }
    return orders;
};

// Mutates the orders in memory only; call right before sending them, never before a save.
export const applyCurrentProductNames = async (orders = []) => {
    const productIds = [...new Set(
        orders.flatMap((order) => (order?.orderItems || []).map((item) => Number(item?.product)))
            .filter(Number.isFinite)
    )];
    if (!productIds.length) return orders;
    return applyCurrentProductNamesSync(orders, await getProductNameMap(productIds));
};

// Ids of products currently named like the search, so admin order search finds
// orders by a product's new name too.
export const findProductIdsByName = async (searchRegex) => {
    const products = await Product.find({ name: searchRegex }).select('id').limit(500).lean();
    return products.map((product) => Number(product.id));
};
