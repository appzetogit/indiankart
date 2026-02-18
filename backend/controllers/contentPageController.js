import ContentPage from '../models/ContentPage.js';

// @desc    Get all content pages
// @route   GET /api/pages
// @access  Public
export const getPages = async (req, res) => {
    try {
        const pages = await ContentPage.find({});
        res.json(pages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single page by key
// @route   GET /api/pages/:key
// @access  Public
export const getPageByKey = async (req, res) => {
    try {
        const page = await ContentPage.findOne({ pageKey: req.params.key });
        if (page) {
            res.json(page);
        } else {
            res.status(404).json({ message: 'Page not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update/Create page content
// @route   POST /api/pages (or PUT /:key)
// @access  Private/Admin
export const updatePageContent = async (req, res) => {
    try {
        const { pageKey, content } = req.body;
        
        let page = await ContentPage.findOne({ pageKey });

        if (page) {
            page.content = content;
            page.updatedAt = Date.now();
            await page.save();
        } else {
            page = await ContentPage.create({
                pageKey,
                content,
                lastUpdated: Date.now()
            });
        }
        res.json(page);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
