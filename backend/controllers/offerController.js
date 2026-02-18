import Offer from '../models/Offer.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import SubCategory from '../models/SubCategory.js';

// @desc    Get all offers
// @route   GET /api/offers
// @access  Public
export const getOffers = async (req, res) => {
    try {
        const { isActive } = req.query;
        
        const filter = {};
        if (isActive !== undefined) {
            filter.isActive = isActive === 'true';
        }

        const offers = await Offer.find(filter)
            .populate('linkedCategories', 'name icon id')
            .populate('linkedSubCategories', 'name image')
            .sort({ priority: -1, createdAt: -1 });

        res.json(offers);
    } catch (error) {
        console.error('Get offers error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get active offers
// @route   GET /api/offers/active
// @access  Public
export const getActiveOffers = async (req, res) => {
    try {
        const now = new Date();
        
        const offers = await Offer.find({
            isActive: true,
            startDate: { $lte: now },
            endDate: { $gte: now }
        })
            .populate('linkedCategories', 'name icon id')
            .populate('linkedSubCategories', 'name image')
            .sort({ priority: -1, createdAt: -1 });

        res.json(offers);
    } catch (error) {
        console.error('Get active offers error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get offer by ID
// @route   GET /api/offers/:id
// @access  Public
export const getOfferById = async (req, res) => {
    try {
        const offer = await Offer.findById(req.params.id)
            .populate('linkedCategories', 'name icon id')
            .populate('linkedSubCategories', 'name image category');

        if (!offer) {
            return res.status(404).json({ message: 'Offer not found' });
        }

        res.json(offer);
    } catch (error) {
        console.error('Get offer by ID error:', error);
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid offer ID' });
        }
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create new offer
// @route   POST /api/offers
// @access  Private/Admin
export const createOffer = async (req, res) => {
    try {
        const {
            title,
            description,
            discountType,
            discountValue,
            linkedProducts,
            linkedCategories,
            linkedSubCategories,
            startDate,
            endDate,
            isActive,
            priority,
            bannerImage,
            termsAndConditions
        } = req.body;

        // Validate required fields
        if (!title || !discountType || !discountValue || !startDate || !endDate) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Validate that at least one link type is provided
        if ((!linkedProducts || linkedProducts.length === 0) &&
            (!linkedCategories || linkedCategories.length === 0) &&
            (!linkedSubCategories || linkedSubCategories.length === 0)) {
            return res.status(400).json({ message: 'At least one product, category, or subcategory must be linked' });
        }

        const offer = new Offer({
            title,
            description,
            discountType,
            discountValue,
            linkedProducts: linkedProducts || [],
            linkedCategories: linkedCategories || [],
            linkedSubCategories: linkedSubCategories || [],
            startDate,
            endDate,
            isActive: isActive !== undefined ? isActive : true,
            priority: priority || 0,
            bannerImage,
            termsAndConditions
        });

        const createdOffer = await offer.save();
        
        // Populate before returning
        const populatedOffer = await Offer.findById(createdOffer._id)
            .populate('linkedCategories', 'name icon id')
            .populate('linkedSubCategories', 'name image');

        res.status(201).json(populatedOffer);
    } catch (error) {
        console.error('Create offer error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update offer
// @route   PUT /api/offers/:id
// @access  Private/Admin
export const updateOffer = async (req, res) => {
    try {
        const offer = await Offer.findById(req.params.id);

        if (!offer) {
            return res.status(404).json({ message: 'Offer not found' });
        }

        const {
            title,
            description,
            discountType,
            discountValue,
            linkedProducts,
            linkedCategories,
            linkedSubCategories,
            startDate,
            endDate,
            isActive,
            priority,
            bannerImage,
            termsAndConditions
        } = req.body;

        // Update fields
        offer.title = title || offer.title;
        offer.description = description !== undefined ? description : offer.description;
        offer.discountType = discountType || offer.discountType;
        offer.discountValue = discountValue !== undefined ? discountValue : offer.discountValue;
        offer.startDate = startDate || offer.startDate;
        offer.endDate = endDate || offer.endDate;
        offer.isActive = isActive !== undefined ? isActive : offer.isActive;
        offer.priority = priority !== undefined ? priority : offer.priority;
        offer.bannerImage = bannerImage !== undefined ? bannerImage : offer.bannerImage;
        offer.termsAndConditions = termsAndConditions !== undefined ? termsAndConditions : offer.termsAndConditions;

        // Update linked items - allow all types
        if (linkedProducts !== undefined) {
            offer.linkedProducts = linkedProducts;
        }
        if (linkedCategories !== undefined) {
            offer.linkedCategories = linkedCategories;
        }
        if (linkedSubCategories !== undefined) {
            offer.linkedSubCategories = linkedSubCategories;
        }

        const updatedOffer = await offer.save();
        
        // Populate before returning
        const populatedOffer = await Offer.findById(updatedOffer._id)
            .populate('linkedCategories', 'name icon id')
            .populate('linkedSubCategories', 'name image');

        res.json(populatedOffer);
    } catch (error) {
        console.error('Update offer error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete offer
// @route   DELETE /api/offers/:id
// @access  Private/Admin
export const deleteOffer = async (req, res) => {
    try {
        const offer = await Offer.findById(req.params.id);

        if (!offer) {
            return res.status(404).json({ message: 'Offer not found' });
        }

        await offer.deleteOne();
        res.json({ message: 'Offer deleted successfully' });
    } catch (error) {
        console.error('Delete offer error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Toggle offer status
// @route   PUT /api/offers/:id/toggle
// @access  Private/Admin
export const toggleOfferStatus = async (req, res) => {
    try {
        const offer = await Offer.findById(req.params.id);

        if (!offer) {
            return res.status(404).json({ message: 'Offer not found' });
        }

        offer.isActive = !offer.isActive;
        const updatedOffer = await offer.save();

        res.json(updatedOffer);
    } catch (error) {
        console.error('Toggle offer status error:', error);
        res.status(500).json({ message: error.message });
    }
};
