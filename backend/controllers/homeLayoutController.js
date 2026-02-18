import HomeLayout from '../models/HomeLayout.js';

// @desc    Get homepage layout (creates default if not exists)
// @route   GET /api/home-layout
// @access  Public
export const getHomeLayout = async (req, res) => {
    try {
        let layout = await HomeLayout.findOne({ isMain: true });
        
        if (!layout) {
            // Create default empty layout
            layout = await HomeLayout.create({
                isMain: true,
                items: []
            });
        }
        
        res.json(layout);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update homepage layout order
// @route   PUT /api/home-layout
// @access  Private/Admin
export const updateHomeLayout = async (req, res) => {
    try {
        const { items } = req.body;
        
        let layout = await HomeLayout.findOne({ isMain: true });
        
        if (layout) {
            layout.items = items;
            const updatedLayout = await layout.save();
            res.json(updatedLayout);
        } else {
            const newLayout = await HomeLayout.create({
                isMain: true,
                items
            });
            res.json(newLayout);
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
