import Reel from '../models/Reel.js';

// @desc    Get all reels
// @route   GET /api/reels
// @access  Public (for app) / Private (Admin) -> Using Admin controller for now
export const getReels = async (req, res) => {
    try {
        const reels = await Reel.find({});
        res.json(reels);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create reel
// @route   POST /api/reels
// @access  Private/Admin
export const createReel = async (req, res) => {
    try {
        const { productLink, active } = req.body;
        let videoUrl = req.body.videoUrl;

        if (req.file) {
            videoUrl = req.file.path;
        }

        const reel = new Reel({
            videoUrl,
            productLink,
            active: active !== undefined ? (active === 'true' || active === true) : true,
            views: 0,
            likes: 0
        });
        const createdReel = await reel.save();
        res.status(201).json(createdReel);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update reel
// @route   PUT /api/reels/:id
// @access  Private/Admin
export const updateReel = async (req, res) => {
    try {
        const reel = await Reel.findById(req.params.id);
        if (reel) {
            let videoUrl = req.body.videoUrl;
            if (req.file) {
                videoUrl = req.file.path;
            }

            reel.videoUrl = videoUrl || reel.videoUrl;
            reel.productLink = req.body.productLink || reel.productLink;
            if (req.body.active !== undefined) {
                reel.active = req.body.active === 'true' || req.body.active === true;
            }
            
            const updatedReel = await reel.save();
            res.json(updatedReel);
        } else {
            res.status(404).json({ message: 'Reel not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete reel
// @route   DELETE /api/reels/:id
// @access  Private/Admin
export const deleteReel = async (req, res) => {
    try {
        const reel = await Reel.findById(req.params.id);
        if (reel) {
            await reel.deleteOne();
            res.json({ message: 'Reel removed' });
        } else {
            res.status(404).json({ message: 'Reel not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
