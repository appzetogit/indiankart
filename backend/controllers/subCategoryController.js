import SubCategory from '../models/SubCategory.js';
import Category from '../models/Category.js';

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const exactNameRegex = (name) => new RegExp(`^${escapeRegex(name)}$`, 'i');

// @desc    Get all subcategories
// @route   GET /api/subcategories
// @access  Public
export const getSubCategories = async (req, res) => {
    try {
        const subCategories = await SubCategory.find({})
            .populate('category', 'name');
        res.json(subCategories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get subcategories by category ID
// @route   GET /api/subcategories/category/:categoryId
// @access  Public
export const getSubCategoriesByCategory = async (req, res) => {
    try {
        const subCategories = await SubCategory.find({ category: req.params.categoryId })
            .populate('category', 'name');
        res.json(subCategories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a subcategory
// @route   POST /api/subcategories
// @access  Private/Admin
export const createSubCategory = async (req, res) => {
    try {
        const { name, category, image } = req.body;
        const normalizedName = name?.trim();

        if (!normalizedName) {
            return res.status(400).json({ message: 'Subcategory name is required' });
        }

        const nameRegex = exactNameRegex(normalizedName);
        const existingSubCategory = await SubCategory.findOne({ name: nameRegex }).select('_id');
        if (existingSubCategory) {
            return res.status(409).json({ message: 'A subcategory with this name already exists' });
        }

        const existingCategory = await Category.findOne({ name: nameRegex }).select('_id');
        if (existingCategory) {
            return res.status(409).json({ message: 'This name is already used by a category' });
        }

        const categoryExists = await Category.findById(category);
        if (!categoryExists) {
            return res.status(404).json({ message: 'Parent category not found' });
        }

        const subCategory = new SubCategory({
            name: normalizedName,
            category,
            parentSubCategory: null,
            image
        });

        const createdSubCategory = await subCategory.save();
        await createdSubCategory.populate('category', 'name');
        res.status(201).json(createdSubCategory);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a subcategory
// @route   DELETE /api/subcategories/:id
// @access  Private/Admin
export const deleteSubCategory = async (req, res) => {
    try {
        const subCategory = await SubCategory.findById(req.params.id);

        if (subCategory) {
            await subCategory.deleteOne();
            res.json({ message: 'Subcategory removed' });
        } else {
            res.status(404).json({ message: 'Subcategory not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a subcategory
// @route   PUT /api/subcategories/:id
// @access  Private/Admin
export const updateSubCategory = async (req, res) => {
    try {
        const { name, image, isActive, category } = req.body;
        const subCategory = await SubCategory.findById(req.params.id);

        if (subCategory) {
            const requestedName = name?.trim();

            if (requestedName && requestedName.toLowerCase() !== String(subCategory.name || '').trim().toLowerCase()) {
                const nameRegex = exactNameRegex(requestedName);

                const conflictingSubCategory = await SubCategory.findOne({
                    _id: { $ne: subCategory._id },
                    name: nameRegex
                }).select('_id');
                if (conflictingSubCategory) {
                    return res.status(409).json({ message: 'A subcategory with this name already exists' });
                }

                const conflictingCategory = await Category.findOne({ name: nameRegex }).select('_id');
                if (conflictingCategory) {
                    return res.status(409).json({ message: 'This name is already used by a category' });
                }
            }

            const resolvedCategory = category ?? subCategory.category;

            subCategory.name = requestedName || subCategory.name;
            subCategory.image = image || subCategory.image;
            if (isActive !== undefined) subCategory.isActive = isActive;
            if (resolvedCategory !== undefined) subCategory.category = resolvedCategory;
            subCategory.parentSubCategory = null;

            const updatedSubCategory = await subCategory.save();
            await updatedSubCategory.populate('category', 'name');
            res.json(updatedSubCategory);
        } else {
            res.status(404).json({ message: 'Subcategory not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
