import Category from '../models/Category.js';
import SubCategory from '../models/SubCategory.js';
import Product from '../models/Product.js';
import { uploadBufferToCloudinary } from '../utils/cloudinaryUpload.js';

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const exactNameRegex = (name) => new RegExp(`^${escapeRegex(name)}$`, 'i');

const normalizeSmallBanners = (rawValue, fallbackAlt = '') => {
    if (!rawValue) return [];

    let parsed = rawValue;
    if (typeof rawValue === 'string') {
        try {
            parsed = JSON.parse(rawValue);
        } catch {
            parsed = [];
        }
    }

    if (!Array.isArray(parsed)) return [];

    return parsed
        .map((item) => {
            if (typeof item === 'string') {
                return { image: item, alt: fallbackAlt };
            }

            if (item && typeof item === 'object' && item.image) {
                return {
                    image: item.image,
                    alt: item.alt || fallbackAlt,
                    title: String(item.title || '').trim(),
                    redirectLink: String(item.redirectLink || '').trim()
                };
            }

            return null;
        })
        .filter(Boolean);
};

// @desc    Fetch all categories
// @route   GET /api/categories
// @access  Public
export const getCategories = async (req, res) => {
    try {
        const query = req.query.all === 'true' ? {} : { active: true };
        const lite = req.query.lite === 'true' || req.query.lite === '1';

        let categories = [];
        const baseProjection = 'id name icon bannerImage bannerAlt smallBanners secondaryBannerTitle secondaryBanners active createdAt';
        
        if (lite) {
            categories = await Category.find(query)
                .select(baseProjection)
                .populate({
                    path: 'subCategories',
                    match: { isActive: true },
                    select: 'id name isActive category'
                })
                .lean();
        } else {
            // For admin/others, we still want subcategories but maybe not the full banner arrays if they're huge
            categories = await Category.find(query)
                .select(`${baseProjection} b2bEnabled`)
                .populate({
                    path: 'subCategories',
                    match: { isActive: true },
                    select: 'name isActive category' // Exclude image from subcaps to keep list lite
                })
                .lean();
        }

        const response = categories.map(cat => ({
            ...cat,
            children: (cat.subCategories || []).map(sub => ({
                ...sub,
                id: sub._id, // Map _id to id for subcategories
                active: sub.isActive // Map isActive to active for subcategories
            }))
        }));

        res.json(response);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single category by ID
// @route   GET /api/categories/:id
// @access  Public
export const getCategoryById = async (req, res) => {
    try {
        const category = await Category.findOne({ id: req.params.id })
            .populate('subCategories')
            .lean();
            
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.json(category);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create category
// @route   POST /api/categories
// @access  Private/Admin
export const createCategory = async (req, res) => {
    try {
        const { name, bannerAlt } = req.body;
        let { subCategories } = req.body;
        const normalizedName = name?.trim();
        const allowBannerData = String(req.body.allowBannerData || '').toLowerCase() === 'true';
        const parseNewSmallBannersMeta = () => {
            try {
                const parsed = JSON.parse(req.body.newSmallBannersMeta || '[]');
                return Array.isArray(parsed) ? parsed : [];
            } catch {
                return [];
            }
        };
        const parseNewSecondaryBannersMeta = () => {
            try {
                const parsed = JSON.parse(req.body.newSecondaryBannersMeta || '[]');
                return Array.isArray(parsed) ? parsed : [];
            } catch {
                return [];
            }
        };

        if (!normalizedName) {
            return res.status(400).json({ message: 'Category name is required' });
        }

        const nameRegex = exactNameRegex(normalizedName);
        const existingCategory = await Category.findOne({ name: nameRegex }).select('_id');
        if (existingCategory) {
            return res.status(409).json({ message: 'A category with this name already exists' });
        }

        const existingSubCategory = await SubCategory.findOne({ name: nameRegex }).select('_id');
        if (existingSubCategory) {
            return res.status(409).json({ message: 'This name is already used by a subcategory' });
        }

        let icon = req.body.icon;
        let bannerImage = req.body.bannerImage;
        const smallBanners = allowBannerData
            ? normalizeSmallBanners(req.body.smallBanners, normalizedName)
            : [];
        const secondaryBanners = allowBannerData
            ? normalizeSmallBanners(req.body.secondaryBanners, normalizedName)
            : [];
        const secondaryBannerTitle = allowBannerData ? String(req.body.secondaryBannerTitle || '').trim() : '';
        const newSmallBannersMeta = allowBannerData ? parseNewSmallBannersMeta() : [];
        const newSecondaryBannersMeta = allowBannerData ? parseNewSecondaryBannersMeta() : [];

        if (req.files) {
            if (req.files.icon && req.files.icon[0]?.buffer) {
                const uploadedIcon = await uploadBufferToCloudinary(
                    req.files.icon[0].buffer,
                    { folder: 'ecom_uploads/categories' }
                );
                icon = uploadedIcon.secure_url;
            }
            if (req.files.bannerImage && req.files.bannerImage[0]?.buffer) {
                const uploadedBanner = await uploadBufferToCloudinary(
                    req.files.bannerImage[0].buffer,
                    { folder: 'ecom_uploads/categories' }
                );
                bannerImage = uploadedBanner.secure_url;
            }
            if (allowBannerData && Array.isArray(req.files.smallBanners)) {
                for (let index = 0; index < req.files.smallBanners.length; index += 1) {
                    const file = req.files.smallBanners[index];
                    if (!file?.buffer) continue;
                    const uploadedSmallBanner = await uploadBufferToCloudinary(
                        file.buffer,
                        { folder: 'ecom_uploads/categories/small-banners' }
                    );
                    const meta = newSmallBannersMeta[index] || {};
                    smallBanners.push({
                        image: uploadedSmallBanner.secure_url,
                        alt: normalizedName,
                        title: String(meta.title || '').trim(),
                        redirectLink: String(meta.redirectLink || '').trim()
                    });
                }
            }
            if (allowBannerData && Array.isArray(req.files.secondaryBanners)) {
                for (let index = 0; index < req.files.secondaryBanners.length; index += 1) {
                    const file = req.files.secondaryBanners[index];
                    if (!file?.buffer) continue;
                    const uploadedSecondaryBanner = await uploadBufferToCloudinary(
                        file.buffer,
                        { folder: 'ecom_uploads/categories/secondary-banners' }
                    );
                    const meta = newSecondaryBannersMeta[index] || {};
                    secondaryBanners.push({
                        image: uploadedSecondaryBanner.secure_url,
                        alt: normalizedName,
                        title: String(meta.title || '').trim(),
                        redirectLink: String(meta.redirectLink || '').trim()
                    });
                }
            }
        }
        
        const category = new Category({
            id: Date.now(), // Fallback for simple ID
            name: normalizedName,
            icon,
            bannerImage,
            bannerAlt,
            smallBanners: smallBanners.slice(0, 20),
            secondaryBannerTitle,
            secondaryBanners: secondaryBanners.slice(0, 30),
            b2bEnabled: req.body.b2bEnabled !== undefined ? String(req.body.b2bEnabled).toLowerCase() === 'true' : false,
            active: req.body.active !== undefined ? req.body.active : true
        });

        const createdCategory = await category.save();
        res.status(201).json(createdCategory);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private/Admin
export const updateCategory = async (req, res) => {
    try {
        const category = await Category.findOne({ id: req.params.id });

        if (category) {
            const requestedName = req.body.name?.trim();

            if (requestedName && requestedName.toLowerCase() !== String(category.name || '').trim().toLowerCase()) {
                const nameRegex = exactNameRegex(requestedName);

                const conflictingCategory = await Category.findOne({
                    _id: { $ne: category._id },
                    name: nameRegex
                }).select('_id');
                if (conflictingCategory) {
                    return res.status(409).json({ message: 'A category with this name already exists' });
                }

                const conflictingSubCategory = await SubCategory.findOne({ name: nameRegex }).select('_id');
                if (conflictingSubCategory) {
                    return res.status(409).json({ message: 'This name is already used by a subcategory' });
                }
            }

            let icon = req.body.icon;
            let bannerImage = req.body.bannerImage;
            const smallBanners = normalizeSmallBanners(
                req.body.smallBanners,
                requestedName || category.name
            );
            const secondaryBanners = normalizeSmallBanners(
                req.body.secondaryBanners,
                requestedName || category.name
            );
            const secondaryBannerTitle = String(req.body.secondaryBannerTitle || '').trim();
            let newSmallBannersMeta = [];
            try {
                const parsedMeta = JSON.parse(req.body.newSmallBannersMeta || '[]');
                newSmallBannersMeta = Array.isArray(parsedMeta) ? parsedMeta : [];
            } catch {
                newSmallBannersMeta = [];
            }
            let newSecondaryBannersMeta = [];
            try {
                const parsedMeta = JSON.parse(req.body.newSecondaryBannersMeta || '[]');
                newSecondaryBannersMeta = Array.isArray(parsedMeta) ? parsedMeta : [];
            } catch {
                newSecondaryBannersMeta = [];
            }

            if (req.files) {
                if (req.files.icon && req.files.icon[0]?.buffer) {
                    const uploadedIcon = await uploadBufferToCloudinary(
                        req.files.icon[0].buffer,
                        { folder: 'ecom_uploads/categories' }
                    );
                    icon = uploadedIcon.secure_url;
                }
                if (req.files.bannerImage && req.files.bannerImage[0]?.buffer) {
                    const uploadedBanner = await uploadBufferToCloudinary(
                        req.files.bannerImage[0].buffer,
                        { folder: 'ecom_uploads/categories' }
                    );
                    bannerImage = uploadedBanner.secure_url;
                }
                if (Array.isArray(req.files.smallBanners)) {
                    for (let index = 0; index < req.files.smallBanners.length; index += 1) {
                        const file = req.files.smallBanners[index];
                        if (!file?.buffer) continue;
                        const uploadedSmallBanner = await uploadBufferToCloudinary(
                            file.buffer,
                            { folder: 'ecom_uploads/categories/small-banners' }
                        );
                        const meta = newSmallBannersMeta[index] || {};
                        smallBanners.push({
                            image: uploadedSmallBanner.secure_url,
                            alt: requestedName || category.name,
                            title: String(meta.title || '').trim(),
                            redirectLink: String(meta.redirectLink || '').trim()
                        });
                    }
                }
                if (Array.isArray(req.files.secondaryBanners)) {
                    for (let index = 0; index < req.files.secondaryBanners.length; index += 1) {
                        const file = req.files.secondaryBanners[index];
                        if (!file?.buffer) continue;
                        const uploadedSecondaryBanner = await uploadBufferToCloudinary(
                            file.buffer,
                            { folder: 'ecom_uploads/categories/secondary-banners' }
                        );
                        const meta = newSecondaryBannersMeta[index] || {};
                        secondaryBanners.push({
                            image: uploadedSecondaryBanner.secure_url,
                            alt: requestedName || category.name,
                            title: String(meta.title || '').trim(),
                            redirectLink: String(meta.redirectLink || '').trim()
                        });
                    }
                }
            }

            category.name = requestedName || category.name;
            if (icon) category.icon = icon;
            if (bannerImage) category.bannerImage = bannerImage;
            category.bannerAlt = req.body.bannerAlt || category.bannerAlt;
            if (req.body.smallBanners !== undefined || req.files?.smallBanners) {
                category.smallBanners = smallBanners.slice(0, 20);
            }
            category.secondaryBannerTitle = secondaryBannerTitle;
            if (req.body.secondaryBanners !== undefined || req.files?.secondaryBanners) {
                category.secondaryBanners = secondaryBanners.slice(0, 30);
            }
            if (req.body.b2bEnabled !== undefined) {
                category.b2bEnabled = String(req.body.b2bEnabled).toLowerCase() === 'true';
            }
            if (req.body.active !== undefined) category.active = req.body.active;

            const updatedCategory = await category.save();
            res.json(updatedCategory);
        } else {
            res.status(404).json({ message: 'Category not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
export const deleteCategory = async (req, res) => {
    try {
        const category = await Category.findOne({ id: req.params.id });

        if (category) {
            const subCategories = await SubCategory.find({ category: category._id }).select('_id').lean();
            const subCategoryIds = subCategories.map((subCategory) => subCategory._id);
            const categoryName = String(category.name || '').trim();
            const productDeleteFilters = [];

            if (subCategoryIds.length > 0) {
                productDeleteFilters.push({ subCategories: { $in: subCategoryIds } });
            }

            if (category.id !== undefined && category.id !== null) {
                productDeleteFilters.push({ categoryId: category.id });
            }

            if (categoryName) {
                productDeleteFilters.push({ category: exactNameRegex(categoryName) });
            }

            if (productDeleteFilters.length > 0) {
                await Product.deleteMany({ $or: productDeleteFilters });
            }

            if (subCategoryIds.length > 0) {
                await SubCategory.deleteMany({ category: category._id });
            }

            await category.deleteOne();
            res.json({
                message: 'Category removed',
                deletedSubCategories: subCategoryIds.length
            });
        } else {
            res.status(404).json({ message: 'Category not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
