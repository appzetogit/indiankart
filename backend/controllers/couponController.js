import Coupon from '../models/Coupon.js';

// @desc    Get all coupons & offers
// @route   GET /api/coupons
// @access  Private/Admin
export const getCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find({});
        res.json(coupons);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create coupon/offer
// @route   POST /api/coupons
// @access  Private/Admin
export const createCoupon = async (req, res) => {
    try {
        const {
            type, // 'percentage', 'flat' OR 'Bank Offer' etc.
            title,
            description,
            active,
            isOffer, // boolean to distinguish
            code,
            value,
            minPurchase,
            maxDiscount,
            expiryDate,
            userSegment,
            applicableCategory,
            usageCount,
            terms
        } = req.body;

        const coupon = new Coupon({
            type,
            title,
            description,
            active,
            isOffer: isOffer || false,
            code,
            value,
            minPurchase,
            maxDiscount,
            expiryDate,
            userSegment,
            applicableCategory,
            usageCount: usageCount || 0,
            terms
        });

        const createdCoupon = await coupon.save();
        res.status(201).json(createdCoupon);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update coupon status
// @route   PUT /api/coupons/:id
// @access  Private/Admin
export const updateCouponStatus = async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id);
        if (coupon) {
            coupon.active = req.body.active !== undefined ? req.body.active : coupon.active;
            const updatedCoupon = await coupon.save();
            res.json(updatedCoupon);
        } else {
            res.status(404).json({ message: 'Coupon not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update full coupon details
// @route   PUT /api/coupons/update/:id
// @access  Private/Admin
export const updateCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id);
        if (coupon) {
            const {
                type, title, description, active, isOffer, code, 
                value, minPurchase, maxDiscount, expiryDate, 
                userSegment, applicableCategory, terms
            } = req.body;

            coupon.type = type || coupon.type;
            coupon.title = title || coupon.title;
            coupon.description = description || coupon.description;
            if (active !== undefined) coupon.active = active;
            if (isOffer !== undefined) coupon.isOffer = isOffer;
            coupon.code = code || coupon.code;
            coupon.value = value !== undefined ? value : coupon.value;
            coupon.minPurchase = minPurchase !== undefined ? minPurchase : coupon.minPurchase;
            coupon.maxDiscount = maxDiscount !== undefined ? maxDiscount : coupon.maxDiscount;
            coupon.expiryDate = expiryDate || coupon.expiryDate;
            coupon.userSegment = userSegment || coupon.userSegment;
            coupon.applicableCategory = applicableCategory || coupon.applicableCategory;
            coupon.terms = terms || coupon.terms;

            const updatedCoupon = await coupon.save();
            res.json(updatedCoupon);
        } else {
            res.status(404).json({ message: 'Coupon not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete coupon
// @route   DELETE /api/coupons/:id
// @access  Private/Admin
export const deleteCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id);
        if (coupon) {
            await coupon.deleteOne();
            res.json({ message: 'Coupon removed' });
        } else {
            res.status(404).json({ message: 'Coupon not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
