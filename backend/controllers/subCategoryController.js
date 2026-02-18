import SubCategory from '../models/SubCategory.js';
import Category from '../models/Category.js';

// @desc    Get all subcategories
// @route   GET /api/subcategories
// @access  Public
export const getSubCategories = async (req, res) => {
    try {
        const subCategories = await SubCategory.find({}).populate('category', 'name');
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
        const subCategories = await SubCategory.find({ category: req.params.categoryId }).populate('category', 'name');
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
        const { name, category, description, image } = req.body;

        const categoryExists = await Category.findById(category);
        if (!categoryExists) {
            return res.status(404).json({ message: 'Parent category not found' });
        }

        const subCategory = new SubCategory({
            name,
            category,
            description,
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
        const { name, description, image, isActive, category } = req.body;
        const subCategory = await SubCategory.findById(req.params.id);

        if (subCategory) {
            subCategory.name = name || subCategory.name;
            subCategory.description = description || subCategory.description;
            subCategory.image = image || subCategory.image;
            if (isActive !== undefined) subCategory.isActive = isActive;
            if (category !== undefined) subCategory.category = category;

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
