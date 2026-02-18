import Banner from '../models/Banner.js';
import { uploadBufferToCloudinary } from '../utils/cloudinaryUpload.js';

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
            const uploadedSlideUrls = await Promise.all(
                slideFiles.map(file =>
                    uploadBufferToCloudinary(file.buffer, { folder: 'ecom_uploads/banners' })
                )
            );
            if (Array.isArray(slides)) {
                slides = slides.map(slide => {
                    if (slide.imageUrl && slide.imageUrl.startsWith('SLIDE_IMG_INDEX::')) {
                        const idx = parseInt(slide.imageUrl.split('::')[1]);
                        if (uploadedSlideUrls[idx]) {
                             return { ...slide, imageUrl: uploadedSlideUrls[idx].secure_url };
                        }
                    }
                    return slide;
                });
            }
        }

        // Handle Hero Image
        if (req.files && req.files.hero_image && req.files.hero_image[0]?.buffer) {
            const uploadedHero = await uploadBufferToCloudinary(
                req.files.hero_image[0].buffer,
                { folder: 'ecom_uploads/banners' }
            );
            content.imageUrl = uploadedHero.secure_url;
        }

        // Handle Background Image
        if (req.files && req.files.background_image && req.files.background_image[0]?.buffer) {
            const uploadedBg = await uploadBufferToCloudinary(
                req.files.background_image[0].buffer,
                { folder: 'ecom_uploads/banners' }
            );
            content.backgroundImageUrl = uploadedBg.secure_url;
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
                    const uploadedSlideUrls = await Promise.all(
                        slideFiles.map(file =>
                            uploadBufferToCloudinary(file.buffer, { folder: 'ecom_uploads/banners' })
                        )
                    );
                    if (Array.isArray(slides)) {
                        slides = slides.map(slide => {
                            if (slide.imageUrl && slide.imageUrl.startsWith('SLIDE_IMG_INDEX::')) {
                                const idx = parseInt(slide.imageUrl.split('::')[1]);
                                if (uploadedSlideUrls[idx]) {
                                    return { ...slide, imageUrl: uploadedSlideUrls[idx].secure_url };
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

                if (req.files && req.files.hero_image && req.files.hero_image[0]?.buffer) {
                    const uploadedHero = await uploadBufferToCloudinary(
                        req.files.hero_image[0].buffer,
                        { folder: 'ecom_uploads/banners' }
                    );
                    content.imageUrl = uploadedHero.secure_url;
                } else if (req.body.hero_image_url) {
                    // Start of fallback if image url is passed directly
                     content.imageUrl = req.body.hero_image_url;
                }

                if (req.files && req.files.background_image && req.files.background_image[0]?.buffer) {
                    const uploadedBg = await uploadBufferToCloudinary(
                        req.files.background_image[0].buffer,
                        { folder: 'ecom_uploads/banners' }
                    );
                    content.backgroundImageUrl = uploadedBg.secure_url;
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
