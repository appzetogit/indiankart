import HomeSection from '../models/HomeSection.js';
import HomeLayout from '../models/HomeLayout.js';

// @desc    Get all home sections
// @route   GET /api/home-sections
// @access  Public (App) / Private (Admin)
export const getHomeSections = async (req, res) => {
    try {
        const { all } = req.query;
        const sections = await HomeSection.find({}).populate({
            path: 'products',
            populate: {
                path: 'subCategories',
                select: 'isActive'
            }
        });

        if (all === 'true') {
            return res.json(sections);
        }

        // Further filter products in each section based on category/subcategory status
        const Category = (await import('../models/Category.js')).default;
        const activeCategories = await Category.find({ active: true }).select('id');
        const activeCategoryIds = new Set(activeCategories.map(c => c.id));

        const SubCategory = (await import('../models/SubCategory.js')).default;
        const activeSubCategories = await SubCategory.find({ isActive: true }).select('_id');
        const activeSubCategoryIds = new Set(activeSubCategories.map(s => s._id.toString()));

        const filteredSections = sections.map(section => {
            const sectionObj = section.toObject();
            sectionObj.products = (sectionObj.products || []).filter(p => {
                if (!p) return false;
                
                // Only filter out if we have a categoryId and it is NOT in the active list
                if (p.categoryId !== undefined && p.categoryId !== null) {
                    if (!activeCategoryIds.has(p.categoryId)) return false;
                }
                
                // Only filter out if it has subcategories and NONE are active
                if (p.subCategories && p.subCategories.length > 0) {
                    const hasActiveSub = p.subCategories.some(sub => {
                        const subId = sub._id?.toString() || sub.toString();
                        return activeSubCategoryIds.has(subId);
                    });
                    if (!hasActiveSub) return false;
                }
                
                return true;
            });
            return sectionObj;
        });

        res.json(filteredSections);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create/Update home section
// @route   POST /api/home-sections (or PUT)
// @access  Private/Admin
export const createHomeSection = async (req, res) => {
    // This might be used to initialize, but usually we just update existing
    try {
        const { id, title, subtitle, products } = req.body;
        const section = new HomeSection({
            id: id || Date.now().toString(),
            title,
            subtitle,
            products: products || []
        });
        const createdSection = await section.save();
        res.status(201).json(createdSection);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update home section (title, id, subtitle or products)
// @route   PUT /api/home-sections/:id
// @access  Private/Admin
export const updateHomeSection = async (req, res) => {
    try {
        const sectionId = req.params.id;
        const section = await HomeSection.findOne({ id: sectionId });

        if (section) {
            const oldId = section.id;
            const newId = req.body.id;

            section.title = req.body.title || section.title;
            section.subtitle = req.body.subtitle !== undefined ? req.body.subtitle : section.subtitle;
            
            if (newId && newId !== oldId) {
                section.id = newId;
            }

            if (req.body.products) {
                section.products = req.body.products;
            }

            const updatedSection = await section.save();

            // If ID changed, update HomeLayout references
            if (newId && newId !== oldId) {
                await HomeLayout.updateMany(
                    { "items.referenceId": oldId, "items.type": "section" },
                    { $set: { "items.$[elem].referenceId": newId } },
                    { arrayFilters: [{ "elem.referenceId": oldId, "elem.type": "section" }] }
                );
            }

            await updatedSection.populate({
                path: 'products',
                populate: {
                    path: 'subCategories',
                    select: 'isActive'
                }
            });
            res.json(updatedSection);
        } else {
            res.status(404).json({ message: 'Section not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete home section
// @route   DELETE /api/home-sections/:id
// @access  Private/Admin
export const deleteHomeSection = async (req, res) => {
    try {
        const section = await HomeSection.findOne({ id: req.params.id });
        if (section) {
            await section.deleteOne();
            res.json({ message: 'Section removed' });
        } else {
            res.status(404).json({ message: 'Section not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
