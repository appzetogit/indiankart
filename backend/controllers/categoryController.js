import Category from '../models/Category.js';
import SubCategory from '../models/SubCategory.js';
import Product from '../models/Product.js';
import { uploadBufferToCloudinary } from '../utils/cloudinaryUpload.js';

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const exactNameRegex = (name) => new RegExp(`^${escapeRegex(name)}$`, 'i');

// @desc    Fetch all categories
// @route   GET /api/categories
// @access  Public
export const getCategories = async (req, res) => {
    try {
        const query = req.query.all === 'true' ? {} : { active: true };
        const lite = req.query.lite === 'true' || req.query.lite === '1';

        const baseProjection = lite
            ? 'id name icon active createdAt'
            : 'id name icon active createdAt b2bEnabled';

        const categories = await Category.find(query)
            .select(baseProjection)
            .populate({
                path: 'subCategories',
                match: { isActive: true },
                select: lite ? 'id name isActive category' : 'name isActive category'
            })
            .lean();

        const response = categories.map((cat) => ({
            ...cat,
            children: (cat.subCategories || []).map((sub) => ({
                ...sub,
                id: sub._id,
                active: sub.isActive
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
        const normalizedName = req.body.name?.trim();

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
        if (req.files?.icon?.[0]?.buffer) {
            const uploadedIcon = await uploadBufferToCloudinary(
                req.files.icon[0].buffer,
                { folder: 'ecom_uploads/categories' }
            );
            icon = uploadedIcon.secure_url;
        }

        const category = new Category({
            id: Date.now(),
            name: normalizedName,
            icon,
            b2bEnabled: req.body.b2bEnabled !== undefined ? String(req.body.b2bEnabled).toLowerCase() === 'true' : false,
            active: req.body.active !== undefined ? String(req.body.active).toLowerCase() === 'true' : true
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

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

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
        if (req.files?.icon?.[0]?.buffer) {
            const uploadedIcon = await uploadBufferToCloudinary(
                req.files.icon[0].buffer,
                { folder: 'ecom_uploads/categories' }
            );
            icon = uploadedIcon.secure_url;
        }

        category.name = requestedName || category.name;
        if (icon) category.icon = icon;
        if (req.body.b2bEnabled !== undefined) {
            category.b2bEnabled = String(req.body.b2bEnabled).toLowerCase() === 'true';
        }
        if (req.body.active !== undefined) {
            category.active = String(req.body.active).toLowerCase() === 'true';
        }

        const updatedCategory = await category.save();
        res.json(updatedCategory);
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

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

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
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
