import { withVisibility } from '../utils/productVisibility.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import SubCategory from '../models/SubCategory.js';

// @desc    Global search across products, categories, and subcategories
// @route   GET /api/search
// @access  Public
export const globalSearch = async (req, res) => {
    try {
        // Plain text only: the raw query used to become a regular expression,
        // so a crafted pattern could tie up the database and "(" caused a 500.
        const keyword = (Array.isArray(req.query.q) ? req.query.q[0] : String(req.query.q ?? '')).trim().slice(0, 80);

        if (!keyword) {
            return res.json({ products: [], categories: [], subCategories: [] });
        }

        const regex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

        // Parallel execution for better performance
        const [products, categories, subCategories] = await Promise.all([
            Product.find(withVisibility(req, {
                $or: [
                    { name: regex },
                    { brand: regex },
                    { shortDescription: regex }
                ]
            }))
            .populate('subCategories', 'isActive')
            .select('id name image price brand category categoryId subCategories discount')
            .limit(5)
            .maxTimeMS(3000),

            Category.find({ name: regex, active: true })
            .select('id name icon active')
            .limit(3)
            .maxTimeMS(3000),

            SubCategory.find({ name: regex, isActive: true })
            .populate('category', 'name active')
            .select('name category isActive')
            .limit(3)
            .maxTimeMS(3000)
        ]);

        // Filter products locally to ensure their category and subcategories are active
        // This is necessary because some products might have inactive categories but match the search query
        const activeCategories = await Category.find({ active: true }).select('id');
        const activeCategoryIds = new Set(activeCategories.map(c => c.id));
        
        const activeSubCategories = await SubCategory.find({ isActive: true }).select('_id');
        const activeSubCategoryIds = new Set(activeSubCategories.map(s => s._id.toString()));

        const filteredProducts = products.filter(p => {
            // Check category
            if (!activeCategoryIds.has(p.categoryId)) return false;
            
            // Check subcategories (if any)
            if (p.subCategories && p.subCategories.length > 0) {
                return p.subCategories.some(sub => activeSubCategoryIds.has(sub._id?.toString() || sub.toString()));
            }
            
            return true;
        });

        // Filter subcategories locally to ensure their parent category is active
        const filteredSubCategories = subCategories.filter(s => s.category && s.category.active);

        res.json({
            products: filteredProducts,
            categories,
            subCategories: filteredSubCategories
        });

    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ message: 'Search failed' });
    }
};
