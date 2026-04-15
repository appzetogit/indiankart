import Product from '../models/Product.js';
import Category from '../models/Category.js';
import SubCategory from '../models/SubCategory.js';
import { uploadBufferToCloudinary } from '../utils/cloudinaryUpload.js';

const ACTIVE_CACHE_TTL_MS = 2 * 60 * 1000;
let activeVisibilityCache = {
    fetchedAt: 0,
    categories: [],
    subCategories: []
};

const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getActiveVisibilityData = async () => {
    const now = Date.now();
    if (
        activeVisibilityCache.fetchedAt > 0 &&
        (now - activeVisibilityCache.fetchedAt) < ACTIVE_CACHE_TTL_MS
    ) {
        return activeVisibilityCache;
    }

    const [categories, subCategories] = await Promise.all([
        Category.find({ active: true }).select('_id id name').lean(),
        SubCategory.find({ isActive: true }).select('_id name category').lean()
    ]);

    activeVisibilityCache = {
        fetchedAt: now,
        categories,
        subCategories
    };

    return activeVisibilityCache;
};

const getListProjection = (lite = false) => {
    if (!lite) return null;
    // Exclude heavy PDP-only fields for category/listing pages.
    // Removed 'images' (array) to reduce payload size as listing pages only need the primary 'image' (thumbnail).
    return 'id name brand subcategoryBrand price originalPrice discount rating ratingCount viewCount image category categoryId tags ram skus stock maxOrderQuantity createdAt';
};

const normalizeSubCategoryIds = (value) => {
    const source = Array.isArray(value) ? value : [value];
    return [...new Set(
        source
            .map((item) => {
                if (!item) return '';
                if (typeof item === 'string') return item;
                return String(item._id || item.id || item);
            })
            .map((id) => String(id || '').trim())
            .filter(Boolean)
    )];
};

const normalizeMaxOrderQuantity = (value) => {
    if (value === undefined || value === null || value === '') return 1;
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return 1;
    return Math.floor(parsed);
};

const normalizeViewState = (value = '') => {
    const trimmed = String(value || '').trim();
    if (!trimmed) return 'Unknown';

    const normalized = trimmed
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');

    const compact = normalized.toLowerCase().replace(/[^a-z]/g, '');
    if (['unknown', 'na', 'none', 'null', 'undefined', 'notavailable'].includes(compact)) {
        return 'Unknown';
    }

    return normalized;
};

const isUnknownViewState = (value = '') => normalizeViewState(value) === 'Unknown';

const getSortedStateBreakdown = (entries = []) => (
    (Array.isArray(entries) ? entries : [])
        .map((entry) => ({
            state: String(entry?.state || '').trim() || 'Unknown',
            count: Number(entry?.count || 0)
        }))
        .filter((entry) => entry.count > 0)
        .sort((a, b) => {
            const aUnknown = isUnknownViewState(a.state) ? 1 : 0;
            const bUnknown = isUnknownViewState(b.state) ? 1 : 0;
            if (aUnknown !== bUnknown) return aUnknown - bUnknown;
            return b.count - a.count || a.state.localeCompare(b.state);
        })
);

const pickTopViewState = (stateBreakdown = []) => (
    stateBreakdown.find((entry) => !isUnknownViewState(entry?.state)) || stateBreakdown[0] || null
);

const getKnownStateBreakdown = (entries = []) => (
    getSortedStateBreakdown(entries).filter((entry) => !isUnknownViewState(entry?.state))
);

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res) => {
    try {
        const { category, subcategory, all, pageNumber, limit, search, keyword, lite } = req.query;
        let filter = {};
        const searchTerm = String(search || keyword || '').trim();
        const categoryTerm = decodeURIComponent(String(category || '').trim());
        const subCategoryTerm = decodeURIComponent(String(subcategory || '').trim());
        const isLite = lite === 'true' || lite === '1';
        const projection = getListProjection(isLite);

        if (all !== 'true') {
            // Always filter by active categories and subcategories for public requests.
            const { categories: activeCategories, subCategories: activeSubCategories } = await getActiveVisibilityData();
            const activeCategoryIds = activeCategories.map(c => c.id);
            const activeSubCategoryIds = activeSubCategories.map(s => s._id);
            let matchedCategory = null;

            filter.categoryId = { $in: activeCategoryIds };

            if (categoryTerm) {
                const normalizedCategory = categoryTerm.toLowerCase();
                matchedCategory = activeCategories.find(
                    (cat) => String(cat?.name || '').trim().toLowerCase() === normalizedCategory
                );

                if (matchedCategory) {
                    // Support legacy products that may have category name but missing/incorrect categoryId.
                    const categoryRegex = new RegExp(`^${escapeRegex(categoryTerm)}$`, 'i');
                    filter.$and = [
                        ...(filter.$and || []),
                        {
                            $or: [
                                { categoryId: matchedCategory.id },
                                { category: categoryRegex }
                            ]
                        }
                    ];
                    delete filter.categoryId;
                } else {
                    filter.category = new RegExp(`^${escapeRegex(categoryTerm)}$`, 'i');
                }
            }

            if (subCategoryTerm) {
                const normalizedSubcategory = subCategoryTerm.toLowerCase();
                const subRegex = new RegExp(`^${escapeRegex(subCategoryTerm)}$`, 'i');
                const nameRegex = new RegExp(escapeRegex(subCategoryTerm), 'i');
                const scopedSubCategories = matchedCategory
                    ? activeSubCategories.filter((sub) => String(sub.category) === String(matchedCategory._id))
                    : activeSubCategories;

                let subCat = scopedSubCategories.find(
                    (sub) => String(sub?.name || '').trim().toLowerCase() === normalizedSubcategory
                );

                if (!subCat && !matchedCategory) {
                    subCat = activeSubCategories.find(
                        (sub) => String(sub?.name || '').trim().toLowerCase() === normalizedSubcategory
                    );
                }

                if (subCat) {
                    // Keep strict subCategory match when available, but also allow
                    // legacy product mappings where VIVO-like values are in brand/tags/name.
                    filter.$and = [
                        ...(filter.$and || []),
                        {
                            $or: [
                                { subCategories: subCat._id },
                                { subCategories: String(subCat._id) },
                                { subCategory: subCat._id },
                                { 'subCategory._id': subCat._id },
                                { tags: subRegex },
                                { brand: subRegex },
                                { subcategoryBrand: subRegex },
                                { name: nameRegex }
                            ]
                        }
                    ];
                } else {
                    // Fallback for data where brand names are encoded in tags/name instead of subCategories.
                    filter.$and = [
                        ...(filter.$and || []),
                        {
                            $or: [
                                { tags: subRegex },
                                { brand: subRegex },
                                { subcategoryBrand: subRegex },
                                { name: nameRegex }
                            ]
                        }
                    ];
                }
            } else {
                filter.$or = [
                    { subCategories: { $exists: false } },
                    { subCategories: { $size: 0 } },
                    { subCategories: { $in: activeSubCategoryIds } }
                ];
            }
        }

        if (all === 'true' && categoryTerm) {
            filter.category = new RegExp(`^${escapeRegex(categoryTerm)}$`, 'i');
        }

        if (searchTerm) {
            const searchPattern = searchTerm
                .split(/\s+/)
                .filter(Boolean)
                .map((part) => escapeRegex(part))
                .join('\\s*');
            const regex = new RegExp(searchPattern, 'i');
            const searchFilter = {
                $or: [
                    { name: regex },
                    { brand: regex },
                    { category: regex }
                ]
            };
            filter = Object.keys(filter).length > 0
                ? { $and: [filter, searchFilter] }
                : searchFilter;
        }

        // Pagination Logic
        if (pageNumber || limit) {
            const pageSize = Number(limit) || 12;
            const page = Number(pageNumber) || 1;

            const count = await Product.countDocuments(filter);
            let productQuery = Product.find(filter);
            if (projection) productQuery = productQuery.select(projection);
            if (!isLite) {
                productQuery = productQuery.populate('subCategories', 'name isActive');
            } else {
                productQuery = productQuery.lean();
            }

            const products = await productQuery
                .sort({ createdAt: -1 })
                .limit(pageSize)
                .skip(pageSize * (page - 1));

            return res.json({ 
                products, 
                page, 
                pages: Math.ceil(count / pageSize), 
                total: count 
            });
        } 

        // Default behavior (No pagination) - Backward Compatibility
        let productQuery = Product.find(filter);
        if (projection) productQuery = productQuery.select(projection);
        if (!isLite) {
            productQuery = productQuery.populate('subCategories', 'name isActive');
        } else {
            productQuery = productQuery.lean();
        }

        const products = await productQuery.sort({ createdAt: -1 });
            
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
export const getProductById = async (req, res) => {
    try {
        const { all } = req.query;
        const product = await Product.findOne({ id: req.params.id }).populate('subCategories', 'name isActive');
        
        if (product) {
            if (all !== 'true') {
                const Category = (await import('../models/Category.js')).default;
                const category = await Category.findOne({ id: product.categoryId });
                
                if (!category || !category.active) {
                    return res.status(404).json({ message: 'Product not found (category inactive)' });
                }

                if (product.subCategories && product.subCategories.length > 0) {
                    const hasActiveSub = product.subCategories.some(sub => sub.isActive);
                    if (!hasActiveSub) {
                        return res.status(404).json({ message: 'Product not found (subcategories inactive)' });
                    }
                }
            }

            res.json(product);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
export const createProduct = async (req, res) => {
    try {
        const normalizeSkus = (rawSkus) => {
            if (!Array.isArray(rawSkus)) return [];
            return rawSkus.map(sku => ({
                ...sku,
                stock: Math.max(0, Number(sku?.stock) || 0),
                price: Math.max(0, Number(sku?.price) || 0),
                originalPrice: Math.max(0, Number(sku?.originalPrice) || 0)
            }));
        };

        const deriveFromSkus = (skus) => {
            if (!Array.isArray(skus) || skus.length === 0) return null;
            const bestSku = skus.reduce((best, current) => {
                if (!best) return current;
                return Number(current.price) < Number(best.price) ? current : best;
            }, null);
            return {
                stock: skus.reduce((sum, sku) => sum + (Number(sku.stock) || 0), 0),
                price: bestSku ? Number(bestSku.price) || 0 : 0,
                originalPrice: bestSku ? Math.max(Number(bestSku.originalPrice) || 0, Number(bestSku.price) || 0) : 0
            };
        };

        let image = req.body.image;
        if (req.files && req.files.image && req.files.image[0]?.buffer) {
            const uploadedMain = await uploadBufferToCloudinary(
                req.files.image[0].buffer,
                { folder: 'ecom_uploads/products' }
            );
            image = uploadedMain.secure_url;
        }

        let images = req.body.images || [];
        if (!Array.isArray(images)) {
            images = [images];
        }
        
        if (req.files && req.files.images) {
            const uploadedImagesResults = await Promise.all(
                req.files.images.map(file =>
                    uploadBufferToCloudinary(file.buffer, { folder: 'ecom_uploads/products' })
                )
            );
            const uploadedImages = uploadedImagesResults.map(r => r.secure_url);
            images = [...images, ...uploadedImages];
        }
        images = images.filter(img => img);

        const parseJSON = (data) => {
            if (Array.isArray(data)) {
                // Handle duplicate FormData entries (strings representing JSON)
                if (data.length > 0 && typeof data[0] === 'string' && (data[0].trim().startsWith('[') || data[0].trim().startsWith('{'))) {
                    return parseJSON(data[data.length - 1]);
                }
                return data;
            }
            if (typeof data === 'string') {
                try { return JSON.parse(data); } catch (e) { return data; }
            }
            return data;
        };

        const body = req.body;
        let variantHeadings = parseJSON(body.variantHeadings);
        const parsedSkus = normalizeSkus(parseJSON(body.skus));
        const derivedSkuValues = deriveFromSkus(parsedSkus);

        if (req.files && req.files.variant_images) {
            const variantFiles = req.files.variant_images;
            const uploadedVariantResults = await Promise.all(
                variantFiles.map(file =>
                    uploadBufferToCloudinary(file.buffer, { folder: 'ecom_uploads/products/variants' })
                )
            );
            const variantUrls = uploadedVariantResults.map(r => r.secure_url);
            if (Array.isArray(variantHeadings)) {
                variantHeadings = variantHeadings.map(vh => ({
                    ...vh,
                    options: vh.options.map(opt => {
                        const newOpt = { ...opt };
                        // Handle single primary background image
                        if (opt.image && typeof opt.image === 'string' && opt.image.startsWith('VARIANT_INDEX::')) {
                            const idx = parseInt(opt.image.split('::')[1]);
                            if (variantUrls[idx]) {
                                newOpt.image = variantUrls[idx];
                            }
                        }
                        // Handle multiple images array
                        if (Array.isArray(opt.images)) {
                            newOpt.images = opt.images.map(img => {
                                if (typeof img === 'string' && img.startsWith('VARIANT_INDEX::')) {
                                    const idx = parseInt(img.split('::')[1]);
                                    return variantUrls[idx] ? variantUrls[idx] : img;
                                }
                                return img;
                            });
                        }
                        return newOpt;
                    })
                }));
            }
        }

        let description = parseJSON(body.description);
        if (req.files && req.files.description_images) {
            const descFiles = req.files.description_images;
            const uploadedDescResults = await Promise.all(
                descFiles.map(file =>
                    uploadBufferToCloudinary(file.buffer, { folder: 'ecom_uploads/products/descriptions' })
                )
            );
            const descUrls = uploadedDescResults.map(r => r.secure_url);
            if (Array.isArray(description)) {
                description = description.map(desc => {
                    if (desc.image && typeof desc.image === 'string' && desc.image.startsWith('DESCRIPTION_INDEX::')) {
                        const idx = parseInt(desc.image.split('::')[1]);
                        if (descUrls[idx]) {
                             return { ...desc, image: descUrls[idx] };
                        }
                    }
                    return desc;
                });
            }
        }

        const resolvedCategoryId = body.categoryId ? Number(body.categoryId) : undefined;
        const selectedCategory = Number.isFinite(resolvedCategoryId)
            ? await Category.findOne({ id: resolvedCategoryId }).select('_id id name').lean()
            : null;

        if (!selectedCategory) {
            return res.status(400).json({ message: 'Valid category is required.' });
        }

        const subCategoryCountForCategory = await SubCategory.countDocuments({ category: selectedCategory._id });
        if (subCategoryCountForCategory === 0) {
            return res.status(400).json({ message: 'No subcategory exists for selected category. Please create subcategory first.' });
        }

        const normalizedSubCategories = normalizeSubCategoryIds(parseJSON(body.subCategories));
        if (normalizedSubCategories.length === 0) {
            return res.status(400).json({ message: 'Subcategory is mandatory.' });
        }

        const validSubCategories = await SubCategory.find({
            _id: { $in: normalizedSubCategories },
            category: selectedCategory._id
        }).select('_id').lean();

        if (validSubCategories.length !== normalizedSubCategories.length) {
            return res.status(400).json({ message: 'Selected subcategory does not belong to selected category.' });
        }

        const product = new Product({
            id: body.id || Date.now(),
            name: body.name,
            brand: body.brand,
            subcategoryBrand: String(body.subcategoryBrand || '').trim(),
            price: derivedSkuValues ? derivedSkuValues.price : Number(body.price),
            originalPrice: derivedSkuValues ? derivedSkuValues.originalPrice : Number(body.originalPrice),
            discount: body.discount,
            image,
            images,
            category: body.category || selectedCategory.name || 'Uncategorized',
            categoryId: resolvedCategoryId,
            subCategories: normalizedSubCategories,
            categoryPath: parseJSON(body.categoryPath),
            highlights: parseJSON(body.highlights),
            description,
            stock: derivedSkuValues ? derivedSkuValues.stock : Number(body.stock),
            maxOrderQuantity: normalizeMaxOrderQuantity(body.maxOrderQuantity),
            variantHeadings,
            skus: parsedSkus,
            deliveryDays: Number(body.deliveryDays),
            specifications: parseJSON(body.specifications) || [],
            warranty: parseJSON(body.warranty),
            returnPolicy: parseJSON(body.returnPolicy),
            b2bEnabled: body.b2bEnabled !== undefined ? String(body.b2bEnabled).toLowerCase() === 'true' : false
        });


        const createdProduct = await product.save();
        res.status(201).json(createdProduct);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
export const updateProduct = async (req, res) => {
    try {
        const normalizeSkus = (rawSkus) => {
            if (!Array.isArray(rawSkus)) return [];
            return rawSkus.map(sku => ({
                ...sku,
                stock: Math.max(0, Number(sku?.stock) || 0),
                price: Math.max(0, Number(sku?.price) || 0),
                originalPrice: Math.max(0, Number(sku?.originalPrice) || 0)
            }));
        };

        const deriveFromSkus = (skus) => {
            if (!Array.isArray(skus) || skus.length === 0) return null;
            const bestSku = skus.reduce((best, current) => {
                if (!best) return current;
                return Number(current.price) < Number(best.price) ? current : best;
            }, null);
            return {
                stock: skus.reduce((sum, sku) => sum + (Number(sku.stock) || 0), 0),
                price: bestSku ? Number(bestSku.price) || 0 : 0,
                originalPrice: bestSku ? Math.max(Number(bestSku.originalPrice) || 0, Number(bestSku.price) || 0) : 0
            };
        };

        console.log('Update Product ID:', req.params.id);
        console.log('Update Body:', JSON.stringify(req.body, null, 2)); // improved logging

        const product = await Product.findOne({ id: req.params.id });

        if (product) {
            let image = req.body.image;
            if (req.files && req.files.image && req.files.image[0]?.buffer) {
                const uploadedMain = await uploadBufferToCloudinary(
                    req.files.image[0].buffer,
                    { folder: 'ecom_uploads/products' }
                );
                image = uploadedMain.secure_url;
            }
            const hasImageFieldInBody = Object.prototype.hasOwnProperty.call(req.body, 'image');
            const hasUploadedMainImage = Boolean(req.files && req.files.image && req.files.image.length > 0);

            const hasImagesFieldInBody = Object.prototype.hasOwnProperty.call(req.body, 'images');
            const hasUploadedGalleryImages = Boolean(req.files && req.files.images && req.files.images.length > 0);

            let images = req.body.images || [];
            if (!Array.isArray(images)) {
                images = [images];
            }

            if (req.files && req.files.images) {
                const uploadedImagesResults = await Promise.all(
                    req.files.images.map(file =>
                        uploadBufferToCloudinary(file.buffer, { folder: 'ecom_uploads/products' })
                    )
                );
                const uploadedImages = uploadedImagesResults.map(r => r.secure_url);
                images = [...images, ...uploadedImages];
            }
            images = images.filter(Boolean);
             
            const parseJSON = (data) => {
                if (Array.isArray(data)) {
                    // Handle duplicate FormData entries (strings representing JSON)
                    if (data.length > 0 && typeof data[0] === 'string' && (data[0].trim().startsWith('[') || data[0].trim().startsWith('{'))) {
                        return parseJSON(data[data.length - 1]);
                    }
                    return data;
                }
                if (typeof data === 'string') {
                    try { return JSON.parse(data); } catch (e) { return data; }
                }
                return data;
            };

            // Prepare update object
            const updateData = { ...req.body };
            
            // Parse complex fields
            if (updateData.categoryPath) updateData.categoryPath = parseJSON(updateData.categoryPath);
            if (updateData.highlights) {
                let highlights = parseJSON(updateData.highlights);
                // Filter to ensure only valid highlights with heading and points
                if (Array.isArray(highlights)) {
                    highlights = highlights.map(h => ({
                        ...h,
                        points: h.points ? h.points.filter(p => p && p.toString().trim().length > 0) : []
                    })).filter(h => (h.heading && h.heading.trim().length > 0) || h.points.length > 0);
                }
                updateData.highlights = highlights;
            }
            if (updateData.skus) {
                updateData.skus = normalizeSkus(parseJSON(updateData.skus));
                const derivedSkuValues = deriveFromSkus(updateData.skus);
                if (derivedSkuValues) {
                    updateData.stock = derivedSkuValues.stock;
                    updateData.price = derivedSkuValues.price;
                    updateData.originalPrice = derivedSkuValues.originalPrice;
                }
            }
            if (updateData.warranty) updateData.warranty = parseJSON(updateData.warranty);
            if (updateData.returnPolicy) updateData.returnPolicy = parseJSON(updateData.returnPolicy);
            
            if (updateData.variantHeadings) {
                let variantHeadings = parseJSON(updateData.variantHeadings);
                if (req.files && req.files.variant_images) {
                    const variantFiles = req.files.variant_images;
                    const uploadedVariantResults = await Promise.all(
                        variantFiles.map(file =>
                            uploadBufferToCloudinary(file.buffer, { folder: 'ecom_uploads/products/variants' })
                        )
                    );
                    const variantUrls = uploadedVariantResults.map(r => r.secure_url);
                    if (Array.isArray(variantHeadings)) {
                        variantHeadings = variantHeadings.map(vh => ({
                            ...vh,
                            options: vh.options.map(opt => {
                                const newOpt = { ...opt };
                                // Handle single primary background image
                                if (opt.image && typeof opt.image === 'string' && opt.image.startsWith('VARIANT_INDEX::')) {
                                    const idx = parseInt(opt.image.split('::')[1]);
                                    if (variantUrls[idx]) {
                                        newOpt.image = variantUrls[idx];
                                    }
                                }
                                // Handle multiple images array
                                if (Array.isArray(opt.images)) {
                                    newOpt.images = opt.images.map(img => {
                                        if (typeof img === 'string' && img.startsWith('VARIANT_INDEX::')) {
                                            const idx = parseInt(img.split('::')[1]);
                                            return variantUrls[idx] ? variantUrls[idx] : img;
                                        }
                                        return img;
                                    });
                                }
                                return newOpt;
                            })
                        }));
                    }
                }
                updateData.variantHeadings = variantHeadings;
            }

            if (updateData.description) {
                let description = parseJSON(updateData.description);
                if (req.files && req.files.description_images) {
                    const descFiles = req.files.description_images;
                    const uploadedDescResults = await Promise.all(
                        descFiles.map(file =>
                            uploadBufferToCloudinary(file.buffer, { folder: 'ecom_uploads/products/descriptions' })
                        )
                    );
                    const descUrls = uploadedDescResults.map(r => r.secure_url);
                    if (Array.isArray(description)) {
                        description = description.map(desc => {
                            if (desc.image && typeof desc.image === 'string' && desc.image.startsWith('DESCRIPTION_INDEX::')) {
                                const idx = parseInt(desc.image.split('::')[1]);
                                if (descUrls[idx]) {
                                    return { ...desc, image: descUrls[idx] };
                                }
                            }
                            return desc;
                        });
                    }
                }
                updateData.description = description;
            }

            // Safe Number Casting
            const safeNum = (val, prev) => {
                if (val === undefined || val === null || val === '') return undefined;
                const num = Number(val);
                return isNaN(num) ? prev : num;
            };

            if (updateData.price !== undefined) updateData.price = safeNum(updateData.price, product.price);
            if (updateData.originalPrice !== undefined) updateData.originalPrice = safeNum(updateData.originalPrice, product.originalPrice);
            if (updateData.stock !== undefined) updateData.stock = safeNum(updateData.stock, product.stock);
            if (updateData.deliveryDays !== undefined) updateData.deliveryDays = safeNum(updateData.deliveryDays, product.deliveryDays);
            if (updateData.maxOrderQuantity !== undefined) {
                updateData.maxOrderQuantity = normalizeMaxOrderQuantity(updateData.maxOrderQuantity);
            }
            if (updateData.b2bEnabled !== undefined) {
                updateData.b2bEnabled = String(updateData.b2bEnabled).toLowerCase() === 'true';
            }
            if (updateData.subcategoryBrand !== undefined) {
                updateData.subcategoryBrand = String(updateData.subcategoryBrand || '').trim();
            }

            // Fix: Cast categoryId to Number safely
            if (updateData.categoryId !== undefined) {
                const catId = Number(updateData.categoryId);
                updateData.categoryId = isNaN(catId) ? undefined : catId;
            }

            if (updateData.subCategories !== undefined) {
                 updateData.subCategories = parseJSON(updateData.subCategories) || [];
            }

            if (updateData.specifications !== undefined) {
                updateData.specifications = parseJSON(updateData.specifications) || [];
            }

            const resolvedCategoryId = updateData.categoryId !== undefined
                ? Number(updateData.categoryId)
                : Number(product.categoryId);

            if (!Number.isFinite(resolvedCategoryId)) {
                return res.status(400).json({ message: 'Valid category is required.' });
            }

            const selectedCategory = await Category.findOne({ id: resolvedCategoryId }).select('_id id name').lean();
            if (!selectedCategory) {
                return res.status(400).json({ message: 'Valid category is required.' });
            }

            const subCategoryCountForCategory = await SubCategory.countDocuments({ category: selectedCategory._id });
            if (subCategoryCountForCategory === 0) {
                return res.status(400).json({ message: 'No subcategory exists for selected category. Please create subcategory first.' });
            }

            const finalSubCategories = normalizeSubCategoryIds(
                updateData.subCategories !== undefined ? updateData.subCategories : product.subCategories
            );
            if (finalSubCategories.length === 0) {
                return res.status(400).json({ message: 'Subcategory is mandatory.' });
            }

            const validSubCategories = await SubCategory.find({
                _id: { $in: finalSubCategories },
                category: selectedCategory._id
            }).select('_id').lean();

            if (validSubCategories.length !== finalSubCategories.length) {
                return res.status(400).json({ message: 'Selected subcategory does not belong to selected category.' });
            }

            updateData.categoryId = resolvedCategoryId;
            updateData.subCategories = finalSubCategories;
            if (!updateData.category) {
                updateData.category = selectedCategory.name;
            }

            // Update thumbnail even when empty, if client explicitly sent the field.
            if (hasImageFieldInBody || hasUploadedMainImage) updateData.image = image || '';
            // Update gallery even when empty, if client explicitly sent the field.
            if (hasImagesFieldInBody || hasUploadedGalleryImages) updateData.images = images;

            // Update fields
            Object.assign(product, updateData);
            
            const updatedProduct = await product.save();
            res.json(updatedProduct);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        console.error('Update Product Fatal Error:', error);
        res.status(500).json({ 
            message: error.message, 
            stack: error.stack 
        });
    }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findOne({ id: req.params.id });

        if (product) {
            await product.deleteOne();
            res.json({ message: 'Product removed' });
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// @desc    Update product stock
// @route   PUT /api/products/:id/stock
// @access  Private/Admin
export const updateProductStock = async (req, res) => {
    try {
        const product = await Product.findOne({ id: req.params.id });

        if (product) {
            const { stock, skus, maxOrderQuantity } = req.body;

            if (stock !== undefined) {
                product.stock = Math.max(0, Number(stock) || 0);
            }

            if (skus !== undefined && Array.isArray(skus)) {
                const normalizedSkus = skus.map((sku) => ({
                    ...sku,
                    stock: Math.max(0, Number(sku?.stock) || 0),
                    price: Math.max(0, Number(sku?.price) || 0),
                    originalPrice: Math.max(0, Number(sku?.originalPrice) || 0)
                }));

                product.skus = normalizedSkus;
                product.markModified('skus');

                // Keep parent stock in sync with variant stock sum.
                product.stock = normalizedSkus.reduce((sum, sku) => sum + (Number(sku.stock) || 0), 0);
            }

            if (maxOrderQuantity !== undefined) {
                product.maxOrderQuantity = normalizeMaxOrderQuantity(maxOrderQuantity);
            }

            const updatedProduct = await product.save();
            res.json(updatedProduct);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        console.error('Update Stock Error:', error);
        res.status(400).json({ message: error.message });
    }
};

// @desc    Increment product view count
// @route   POST /api/products/:id/view
// @access  Public
export const incrementProductView = async (req, res) => {
    try {
        const product = await Product.findOne({ id: req.params.id });

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const normalizedState = normalizeViewState(req.body?.state);
        const existingStateEntry = Array.isArray(product.viewStatsByState)
            ? product.viewStatsByState.find((entry) => normalizeViewState(entry?.state) === normalizedState)
            : null;

        product.viewCount = Number(product.viewCount || 0) + 1;

        if (existingStateEntry) {
            existingStateEntry.count = Number(existingStateEntry.count || 0) + 1;
            existingStateEntry.state = normalizedState;
        } else {
            product.viewStatsByState.push({ state: normalizedState, count: 1 });
        }

        // --- Daily Stats tracking ---
        const todayDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const existingDailyEntry = Array.isArray(product.dailyViewStats)
            ? product.dailyViewStats.find((entry) => entry.date === todayDate)
            : null;

        if (existingDailyEntry) {
            existingDailyEntry.views = (Number(existingDailyEntry.views) || 0) + 1;
            // Simulate visitors logic: 1 visitor for every ~1.5 views on average for demo purposes
            if (Math.random() > 0.4) {
                existingDailyEntry.visitors = (Number(existingDailyEntry.visitors) || 0) + 1;
            }
        } else {
            if (!product.dailyViewStats) product.dailyViewStats = [];
            product.dailyViewStats.push({
                date: todayDate,
                views: 1,
                visitors: 1
            });
        }

        // Keep only last 365 days of daily stats to avoid too much document bloat
        if (product.dailyViewStats.length > 365) {
            product.dailyViewStats = product.dailyViewStats.slice(-365);
        }

        await product.save();

        const stateBreakdown = getSortedStateBreakdown(product.viewStatsByState);
        const topState = pickTopViewState(stateBreakdown);

        res.json({
            id: product.id,
            name: product.name,
            viewCount: product.viewCount,
            topState
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get product view insights by state
// @route   GET /api/products/:id/view-insights
// @access  Private/Admin
export const getProductViewInsights = async (req, res) => {
    try {
        const product = await Product.findOne({ id: req.params.id })
            .select('id name image brand category viewCount viewStatsByState dailyViewStats')
            .lean();

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const stateBreakdown = getKnownStateBreakdown(product.viewStatsByState);
        const preferredTopState = pickTopViewState(stateBreakdown);
        const topState = preferredTopState
            ? {
                ...preferredTopState,
                share: product.viewCount > 0
                    ? Number(((preferredTopState.count / Number(product.viewCount || 0)) * 100).toFixed(1))
                    : 0
            }
            : null;

        const dailyStats = Array.isArray(product.dailyViewStats) ? product.dailyViewStats : [];

        return res.json({
            id: product.id,
            name: product.name,
            image: product.image,
            brand: product.brand,
            category: product.category,
            viewCount: Number(product.viewCount || 0),
            topState,
            stateBreakdown,
            dailyStats: dailyStats.slice(-365)
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// @desc    Generate shareable link with meta tags for social media
// @route   GET /api/products/share/:id
// @access  Public
export const shareProduct = async (req, res) => {
    try {
        const product = await Product.findOne({ id: req.params.id });
        if (!product) {
            return res.status(404).send('Product not found');
        }

        // Configuration
        const frontendBaseUrl = 'https://www.indiankart.in';
        const frontendUrl = `${frontendBaseUrl}/product/${product.id}`;
        const title = product.name;
        const description = `Check out ${product.name} only on Indian Kart. Best prices and deals!`;
        const image = product.image;

        // Rich Preview HTML
        res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    
    <!-- Social Media Meta Tags -->
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:url" content="${frontendUrl}" />
    <meta property="og:type" content="product" />
    <meta property="og:site_name" content="Indian Kart" />
    
    <!-- Twitter Tags -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${image}" />

    <!-- Fallback Redirect -->
    <meta http-equiv="refresh" content="0;url=${frontendUrl}">
    
    <style>
        body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f8f9fa; }
        .loader { border: 4px solid #f3f3f3; border-top: 4px solid #2874f0; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .content { text-align: center; margin-left: 15px; }
    </style>
</head>
<body>
    <div class="loader"></div>
    <div class="content">
        <p>Redirecting to <strong>Indian Kart</strong>...</p>
    </div>
    <script>
        // Primary Redirect
        window.location.href = "${frontendUrl}";
    </script>
</body>
</html>`);
    } catch (error) {
        console.error('Share Resolver Error:', error);
        res.status(500).send('Error generating share link');
    }
};
