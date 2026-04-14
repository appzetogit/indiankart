import Brand from '../models/Brand.js';
import SubCategory from '../models/SubCategory.js';
import { uploadBufferToCloudinary } from '../utils/cloudinaryUpload.js';

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const exactNameRegex = (name) => new RegExp(`^${escapeRegex(name)}$`, 'i');

const brandPopulate = [
    {
        path: 'subcategory',
        select: 'name category isActive',
        populate: { path: 'category', select: 'name active' }
    }
];

// @desc    Get all brands
// @route   GET /api/brands
// @access  Public
export const getBrands = async (req, res) => {
    try {
        const brands = await Brand.find({})
            .populate(brandPopulate)
            .select('name image subcategory isActive createdAt updatedAt')
            .sort({ createdAt: -1 })
            .lean();

        res.json(brands);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get brands by subcategory ID
// @route   GET /api/brands/subcategory/:subcategoryId
// @access  Public
export const getBrandsBySubCategory = async (req, res) => {
    try {
        const brands = await Brand.find({ subcategory: req.params.subcategoryId })
            .populate(brandPopulate)
            .select('name image subcategory isActive createdAt updatedAt')
            .sort({ createdAt: -1 })
            .lean();

        res.json(brands);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a brand
// @route   POST /api/brands
// @access  Private/Admin
export const createBrand = async (req, res) => {
    try {
        const { name, subcategory } = req.body;
        const normalizedName = name?.trim();
        let image = req.body.image;

        if (!normalizedName) {
            return res.status(400).json({ message: 'Brand name is required' });
        }

        if (!subcategory) {
            return res.status(400).json({ message: 'Subcategory is required' });
        }

        const subcategoryExists = await SubCategory.findById(subcategory).select('_id');
        if (!subcategoryExists) {
            return res.status(404).json({ message: 'Parent subcategory not found' });
        }

        const nameRegex = exactNameRegex(normalizedName);
        const existingBrand = await Brand.findOne({
            subcategory,
            name: nameRegex
        }).select('_id');

        if (existingBrand) {
            return res.status(409).json({ message: 'A brand with this name already exists in selected subcategory' });
        }

        if (req.file) {
            const uploaded = await uploadBufferToCloudinary(req.file.buffer, {
                folder: 'ecom_uploads/brands'
            });
            image = uploaded.secure_url;
        }

        const brand = new Brand({
            name: normalizedName,
            image,
            subcategory
        });

        const createdBrand = await brand.save();
        await createdBrand.populate(brandPopulate);
        res.status(201).json(createdBrand);
    } catch (error) {
        if (error?.code === 11000) {
            return res.status(409).json({ message: 'A brand with this name already exists in selected subcategory' });
        }
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a brand
// @route   PUT /api/brands/:id
// @access  Private/Admin
export const updateBrand = async (req, res) => {
    try {
        const { name, image, subcategory, isActive } = req.body;
        const brand = await Brand.findById(req.params.id);

        if (!brand) {
            return res.status(404).json({ message: 'Brand not found' });
        }

        const nextSubcategory = subcategory ?? brand.subcategory;
        if (nextSubcategory) {
            const subcategoryExists = await SubCategory.findById(nextSubcategory).select('_id');
            if (!subcategoryExists) {
                return res.status(404).json({ message: 'Parent subcategory not found' });
            }
        }

        const requestedName = name?.trim();
        const nextName = requestedName || brand.name;
        const isNameChanged = requestedName && requestedName.toLowerCase() !== String(brand.name || '').trim().toLowerCase();
        const isSubcategoryChanged = subcategory && String(subcategory) !== String(brand.subcategory);

        if (isNameChanged || isSubcategoryChanged) {
            const nameRegex = exactNameRegex(nextName);
            const conflictingBrand = await Brand.findOne({
                _id: { $ne: brand._id },
                subcategory: nextSubcategory,
                name: nameRegex
            }).select('_id');

            if (conflictingBrand) {
                return res.status(409).json({ message: 'A brand with this name already exists in selected subcategory' });
            }
        }

        if (req.file) {
            const uploaded = await uploadBufferToCloudinary(req.file.buffer, {
                folder: 'ecom_uploads/brands'
            });
            brand.image = uploaded.secure_url;
        } else if (image !== undefined) {
            brand.image = image;
        }

        brand.name = nextName;
        brand.subcategory = nextSubcategory;
        if (isActive !== undefined) brand.isActive = isActive;

        const updatedBrand = await brand.save();
        await updatedBrand.populate(brandPopulate);
        res.json(updatedBrand);
    } catch (error) {
        if (error?.code === 11000) {
            return res.status(409).json({ message: 'A brand with this name already exists in selected subcategory' });
        }
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a brand
// @route   DELETE /api/brands/:id
// @access  Private/Admin
export const deleteBrand = async (req, res) => {
    try {
        const brand = await Brand.findById(req.params.id);

        if (!brand) {
            return res.status(404).json({ message: 'Brand not found' });
        }

        await brand.deleteOne();
        res.json({ message: 'Brand removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
