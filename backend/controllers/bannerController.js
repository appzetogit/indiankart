import Banner from '../models/Banner.js';

// @desc    Get all banners
// @route   GET /api/banners
// @access  Public (for App) / Private (Admin)
export const getBanners = async (req, res) => {
    try {
        const { all } = req.query;
        const query = all === 'true' ? {} : { active: true };
        const banners = await Banner.find(query)
            .populate('slides.linkedOffer')
            .populate('content.linkedOffer')
            .populate('content.featuredProducts.productId');
        res.json(banners);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create banner
// @route   POST /api/banners
// @access  Private/Admin
export const createBanner = async (req, res) => {
    try {
        const { section, active, type } = req.body;
        let { slides, content } = req.body;
        
        // Parse JSON fields
        if (typeof slides === 'string') {
            try { slides = JSON.parse(slides); } catch (e) {}
        }
        if (typeof content === 'string') {
            try { content = JSON.parse(content); } catch (e) {}
        }

        // Sanitize linkedOffer in slides
        if (Array.isArray(slides)) {
            slides = slides.map(slide => ({
                ...slide,
                linkedOffer: slide.linkedOffer || null
            }));
        }

        // Sanitize linkedOffer in content
        if (content && content.linkedOffer === "") {
            content.linkedOffer = null;
        }

        // Handle Slides Images
        if (req.files && req.files.slide_images) {
            const slideFiles = req.files.slide_images;
            if (Array.isArray(slides)) {
                slides = slides.map(slide => {
                    if (slide.imageUrl && slide.imageUrl.startsWith('SLIDE_IMG_INDEX::')) {
                        const idx = parseInt(slide.imageUrl.split('::')[1]);
                        const file = slideFiles.find(f => f.fieldname === 'slide_images' && f.originalname === slide.originalName); 
                        if (slideFiles[idx]) {
                             return { ...slide, imageUrl: slideFiles[idx].path };
                        }
                    }
                    return slide;
                });
            }
        }

        // Handle Hero Image
        if (req.files && req.files.hero_image) {
            content.imageUrl = req.files.hero_image[0].path;
        }

        // Handle Background Image
        if (req.files && req.files.background_image) {
            content.backgroundImageUrl = req.files.background_image[0].path;
        }

        const banner = new Banner({
            section,
            type: type || 'slides',
            active: active !== undefined ? active : true,
            slides: slides || [],
            content: content || {}
        });
        const createdBanner = await banner.save();
        res.status(201).json(createdBanner);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update banner
// @route   PUT /api/banners/:id
// @access  Private/Admin
export const updateBanner = async (req, res) => {
    try {
        const banner = await Banner.findById(req.params.id);
        if (banner) {
             banner.section = req.body.section || banner.section;
             banner.type = req.body.type || banner.type;
             
             let slides = req.body.slides;
             let content = req.body.content;

             if (slides) {
                 if (typeof slides === 'string') {
                    try { slides = JSON.parse(slides); } catch (e) {}
                 }

                 // Sanitize linkedOffer
                 if (Array.isArray(slides)) {
                     slides = slides.map(s => ({...s, linkedOffer: s.linkedOffer || null}));
                 }

                 if (req.files && req.files.slide_images) {
                    const slideFiles = req.files.slide_images;
                    if (Array.isArray(slides)) {
                        slides = slides.map(slide => {
                            if (slide.imageUrl && slide.imageUrl.startsWith('SLIDE_IMG_INDEX::')) {
                                const idx = parseInt(slide.imageUrl.split('::')[1]);
                                if (slideFiles[idx]) {
                                    return { ...slide, imageUrl: slideFiles[idx].path };
                                }
                            }
                            return slide;
                        });
                    }
                }
                banner.slides = slides;
             }

             if (content) {
                if (typeof content === 'string') {
                    try { content = JSON.parse(content); } catch (e) {}
                }
                
                // Sanitize linkedOffer
                if (content.linkedOffer === "") content.linkedOffer = null;

                if (req.files && req.files.hero_image) {
                    content.imageUrl = req.files.hero_image[0].path;
                } else if (req.body.hero_image_url) {
                    // Start of fallback if image url is passed directly
                     content.imageUrl = req.body.hero_image_url;
                }

                if (req.files && req.files.background_image) {
                    content.backgroundImageUrl = req.files.background_image[0].path;
                } else if (req.body.background_image_url) {
                    content.backgroundImageUrl = req.body.background_image_url;
                }
                
                // Merge content or replace? Replace feels safer for now as form sends full object
                // But if fields are missing in update, they might get lost. 
                // Let's assume frontend sends full content object.
                banner.content = { ...banner.content, ...content };
             }

             banner.active = req.body.active !== undefined ? req.body.active : banner.active;
             
             const updatedBanner = await banner.save();
             res.json(updatedBanner);
        } else {
            res.status(404).json({ message: 'Banner not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete banner
// @route   DELETE /api/banners/:id
// @access  Private/Admin
export const deleteBanner = async (req, res) => {
    try {
        const banner = await Banner.findById(req.params.id);
        if (banner) {
            await banner.deleteOne();
            res.json({ message: 'Banner removed' });
        } else {
            res.status(404).json({ message: 'Banner not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
