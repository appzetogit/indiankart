import HeaderConfig from '../models/HeaderConfig.js';

// @desc    Get header configuration
// @route   GET /api/header
// @access  Public
export const getHeaderConfig = async (req, res) => {
    try {
        let config = await HeaderConfig.findOne().populate({
            path: 'categories',
            populate: { path: 'subCategories' }
        });
        
        if (!config) {
            // First time: keep empty until admin selects categories in Header Settings.
            config = await HeaderConfig.create({ categories: [] });
            config = await HeaderConfig.findById(config._id).populate({
                path: 'categories',
                populate: { path: 'subCategories' }
            });
        }
        res.json(config);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update header configuration
// @route   PUT /api/header
// @access  Private/Admin
export const updateHeaderConfig = async (req, res) => {
    try {
        const { categories } = req.body; // Array of Category IDs

        let config = await HeaderConfig.findOne();

        if (config) {
            config.categories = categories;
            await config.save();
        } else {
            config = await HeaderConfig.create({ categories });
        }
        
        // Return populated config
        const updatedConfig = await HeaderConfig.findById(config._id).populate({
            path: 'categories',
            populate: { path: 'subCategories' }
        });
        res.json(updatedConfig);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
