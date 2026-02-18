import Product from '../models/Product.js';

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res) => {
    try {
        const { category, subcategory, all, pageNumber, limit } = req.query;
        let filter = {};

        if (all !== 'true') {
            // Always filter by active categories and subcategories for public requests
            const Category = (await import('../models/Category.js')).default;
            const SubCategory = (await import('../models/SubCategory.js')).default;

            const activeCategories = await Category.find({ active: true }).select('id');
            const activeCategoryIds = activeCategories.map(c => c.id);

            filter.categoryId = { $in: activeCategoryIds };

            if (subcategory) {
                const subCat = await SubCategory.findOne({ name: subcategory, isActive: true });
                if (subCat) {
                    filter.subCategories = subCat._id;
                } else {
                    return res.json([]);
                }
            } else {
                 const activeSubCategories = await SubCategory.find({ isActive: true }).select('_id');
                 const activeSubCategoryIds = activeSubCategories.map(s => s._id);
                 
                 filter.$or = [
                     { subCategories: { $exists: false } },
                     { subCategories: { $size: 0 } },
                     { subCategories: { $in: activeSubCategoryIds } }
                 ];
            }
        }

        if (category) {
            filter.category = category;
        }

        // Pagination Logic
        if (pageNumber || limit) {
            const pageSize = Number(limit) || 12;
            const page = Number(pageNumber) || 1;

            const count = await Product.countDocuments(filter);
            const products = await Product.find(filter)
                .populate('subCategories', 'name isActive')
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
        const products = await Product.find(filter)
            .populate('subCategories', 'name isActive')
            .sort({ createdAt: -1 });
            
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
        let image = req.body.image;
        if (req.files && req.files.image) {
            image = req.files.image[0].path;
        }

        let images = req.body.images || [];
        if (!Array.isArray(images)) {
            images = [images];
        }
        
        if (req.files && req.files.images) {
            const uploadedImages = req.files.images.map(file => file.path);
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

        if (req.files && req.files.variant_images) {
             const variantFiles = req.files.variant_images;
             if (Array.isArray(variantHeadings)) {
                variantHeadings = variantHeadings.map(vh => ({
                    ...vh,
                    options: vh.options.map(opt => {
                        const newOpt = { ...opt };
                        // Handle single primary background image
                        if (opt.image && typeof opt.image === 'string' && opt.image.startsWith('VARIANT_INDEX::')) {
                            const idx = parseInt(opt.image.split('::')[1]);
                            if (variantFiles[idx]) {
                                newOpt.image = variantFiles[idx].path;
                            }
                        }
                        // Handle multiple images array
                        if (Array.isArray(opt.images)) {
                            newOpt.images = opt.images.map(img => {
                                if (typeof img === 'string' && img.startsWith('VARIANT_INDEX::')) {
                                    const idx = parseInt(img.split('::')[1]);
                                    return variantFiles[idx] ? variantFiles[idx].path : img;
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
            if (Array.isArray(description)) {
                description = description.map(desc => {
                    if (desc.image && typeof desc.image === 'string' && desc.image.startsWith('DESCRIPTION_INDEX::')) {
                        const idx = parseInt(desc.image.split('::')[1]);
                        if (descFiles[idx]) {
                             return { ...desc, image: descFiles[idx].path };
                        }
                    }
                    return desc;
                });
            }
        }

        const product = new Product({
            id: body.id || Date.now(),
            name: body.name,
            brand: body.brand,
            price: Number(body.price),
            originalPrice: Number(body.originalPrice),
            discount: body.discount,
            image,
            images,
            category: body.category || 'Uncategorized',
            categoryId: body.categoryId ? Number(body.categoryId) : undefined,
            subCategories: parseJSON(body.subCategories) || [], // Handle multiple subcategories
            categoryPath: parseJSON(body.categoryPath),
            highlights: parseJSON(body.highlights),
            description,
            stock: Number(body.stock),
            variantHeadings,
            skus: parseJSON(body.skus),
            deliveryDays: Number(body.deliveryDays),
            specifications: parseJSON(body.specifications) || [],
            warranty: parseJSON(body.warranty),
            returnPolicy: parseJSON(body.returnPolicy)
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
        console.log('Update Product ID:', req.params.id);
        console.log('Update Body:', JSON.stringify(req.body, null, 2)); // improved logging

        const product = await Product.findOne({ id: req.params.id });

        if (product) {
            let image = req.body.image;
            if (req.files && req.files.image) {
                image = req.files.image[0].path;
            }

            let images = req.body.images || [];
             if (!Array.isArray(images)) {
                images = [images];
            }

            if (req.files && req.files.images) {
                const uploadedImages = req.files.images.map(file => file.path);
                images = [...images, ...uploadedImages];
            }
             
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
            if (updateData.skus) updateData.skus = parseJSON(updateData.skus);
            if (updateData.warranty) updateData.warranty = parseJSON(updateData.warranty);
            if (updateData.returnPolicy) updateData.returnPolicy = parseJSON(updateData.returnPolicy);
            
            if (updateData.variantHeadings) {
                let variantHeadings = parseJSON(updateData.variantHeadings);
                if (req.files && req.files.variant_images) {
                     const variantFiles = req.files.variant_images;
                     if (Array.isArray(variantHeadings)) {
                         variantHeadings = variantHeadings.map(vh => ({
                             ...vh,
                             options: vh.options.map(opt => {
                                 const newOpt = { ...opt };
                                 // Handle single primary background image
                                 if (opt.image && typeof opt.image === 'string' && opt.image.startsWith('VARIANT_INDEX::')) {
                                     const idx = parseInt(opt.image.split('::')[1]);
                                     if (variantFiles[idx]) {
                                         newOpt.image = variantFiles[idx].path;
                                     }
                                 }
                                 // Handle multiple images array
                                 if (Array.isArray(opt.images)) {
                                     newOpt.images = opt.images.map(img => {
                                         if (typeof img === 'string' && img.startsWith('VARIANT_INDEX::')) {
                                             const idx = parseInt(img.split('::')[1]);
                                             return variantFiles[idx] ? variantFiles[idx].path : img;
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
                    if (Array.isArray(description)) {
                        description = description.map(desc => {
                            if (desc.image && typeof desc.image === 'string' && desc.image.startsWith('DESCRIPTION_INDEX::')) {
                                const idx = parseInt(desc.image.split('::')[1]);
                                if (descFiles[idx]) {
                                    return { ...desc, image: descFiles[idx].path };
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

            if (image) updateData.image = image;
            if (images.length > 0) updateData.images = images;

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
            const { stock, skus } = req.body;

            if (stock !== undefined) {
                product.stock = Number(stock);
            }

            if (skus !== undefined && Array.isArray(skus)) {
                // In Mongoose, replacing a Map-based subdocument array requires caution.
                // However, since we are sending the full skus array from frontend, 
                // we can update it. We need to mark it modified if it's a complex type.
                product.skus = skus;
                product.markModified('skus');
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
