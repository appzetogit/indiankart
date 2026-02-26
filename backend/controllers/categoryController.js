import Category from '../models/Category.js';
import SubCategory from '../models/SubCategory.js';
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
                    alt: item.alt || fallbackAlt
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
        
        // Populate virtual 'subCategories'
        const categories = await Category.find(query)
            .populate('subCategories')
            .lean({ virtuals: true }); // Ensure virtuals are included in lean result

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

// @desc    Create category
// @route   POST /api/categories
// @access  Private/Admin
export const createCategory = async (req, res) => {
    try {
        const { name, bannerAlt } = req.body;
        let { subCategories } = req.body;
        const normalizedName = name?.trim();

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
        const smallBanners = normalizeSmallBanners(req.body.smallBanners, normalizedName);

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
                for (const file of req.files.smallBanners) {
                    if (!file?.buffer) continue;
                    const uploadedSmallBanner = await uploadBufferToCloudinary(
                        file.buffer,
                        { folder: 'ecom_uploads/categories/small-banners' }
                    );
                    smallBanners.push({
                        image: uploadedSmallBanner.secure_url,
                        alt: normalizedName
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
                    for (const file of req.files.smallBanners) {
                        if (!file?.buffer) continue;
                        const uploadedSmallBanner = await uploadBufferToCloudinary(
                            file.buffer,
                            { folder: 'ecom_uploads/categories/small-banners' }
                        );
                        smallBanners.push({
                            image: uploadedSmallBanner.secure_url,
                            alt: requestedName || category.name
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
            await category.deleteOne();
            res.json({ message: 'Category removed' });
        } else {
            res.status(404).json({ message: 'Category not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
