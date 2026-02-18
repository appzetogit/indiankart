import BankOffer from '../models/BankOffer.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import SubCategory from '../models/SubCategory.js';

// @desc    Create a new bank offer
// @route   POST /api/bank-offers
// @access  Private/Admin
const createBankOffer = async (req, res) => {
    const {
        offerName,
        description,
        bankName,
        discountType,
        discountValue,
        minOrderValue,
        maxDiscount,
        isUniversal,
        applicableCategories,
        applicableSubCategories,
        applicableProducts
    } = req.body;

    if (!offerName || !bankName || !discountValue) {
        return res.status(400).json({ message: 'Please provide required fields' });
    }

    const bankOffer = await BankOffer.create({
        offerName,
        description,
        bankName,
        discountType,
        discountValue,
        minOrderValue,
        maxDiscount,
        isUniversal: isUniversal || false,
        applicableCategories: applicableCategories || [],
        applicableSubCategories: applicableSubCategories || [],
        applicableProducts: applicableProducts || []
    });

    if (bankOffer) {
        res.status(201).json(bankOffer);
    } else {
        res.status(400).json({ message: 'Invalid offer data' });
    }
};

// @desc    Get all bank offers
// @route   GET /api/bank-offers
// @access  Private/Admin (or Public if needed for checkout)
const getBankOffers = async (req, res) => {
    const offers = await BankOffer.find({}).sort({ createdAt: -1 });
    res.json(offers);
};

// @desc    Delete a bank offer
// @route   DELETE /api/bank-offers/:id
// @access  Private/Admin
const deleteBankOffer = async (req, res) => {
    const offer = await BankOffer.findById(req.params.id);

    if (offer) {
        await offer.deleteOne();
        res.json({ message: 'Bank Offer removed' });
    } else {
        res.status(404).json({ message: 'Offer not found' });
    }
};

// @desc    Update a bank offer status
// @route   PUT /api/bank-offers/:id/status
// @access  Private/Admin
const updateBankOfferStatus = async (req, res) => {
    const offer = await BankOffer.findById(req.params.id);

    if (offer) {
        offer.isActive = !offer.isActive;
        const updatedOffer = await offer.save();
        res.json(updatedOffer);
    } else {
        res.status(404).json({ message: 'Offer not found' });
    }
};

// @desc    Get bank offers applicable to a specific product
// @route   GET /api/bank-offers/product/:productId
// @access  Public
const getBankOffersForProduct = async (req, res) => {
    try {
        const { productId } = req.params; // This is the numeric ID from URL

        // 1. Fetch Product
        const product = await Product.findOne({ id: productId });
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // 2. Fetch Category ID (ObjectId)
        // Product has 'categoryId' (Number). Category model has 'id' (Number) and '_id' (ObjectId).
        let categoryObjectId = null;
        if (product.categoryId) {
            const category = await Category.findOne({ id: product.categoryId });
            if (category) {
                categoryObjectId = category._id;
            }
        }

        // 3. Fetch All Active Offers
        const hasSubCategories = product.subCategories && product.subCategories.length > 0;
        
        // Optimize query? Or fetch all and filter in memory?
        // Filtering in memory is safer given the complex logic.
        const allOffers = await BankOffer.find({ isActive: true });

        const applicableOffers = allOffers.filter(offer => {
            // A. Universal
            if (offer.isUniversal) return true;

            // B. Product Specific
            // offer.applicableProducts is Array of ObjectIds. product._id is ObjectId.
            if (offer.applicableProducts && offer.applicableProducts.some(id => id.toString() === product._id.toString())) {
                return true;
            }

            // C. Category Specific
            if (categoryObjectId && offer.applicableCategories && offer.applicableCategories.some(id => id.toString() === categoryObjectId.toString())) {
                return true;
            }

            // D. SubCategory Specific
            if (hasSubCategories && offer.applicableSubCategories && offer.applicableSubCategories.length > 0) {
                 // product.subCategories is array of ObjectIds
                 const productSubCatIds = product.subCategories.map(id => id.toString());
                 const offerSubCatIds = offer.applicableSubCategories.map(id => id.toString());
                 // Check intersection
                 if (productSubCatIds.some(id => offerSubCatIds.includes(id))) {
                     return true;
                 }
            }

            return false;
        });

        res.json(applicableOffers);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error checking offers' });
    }
};

export {
    createBankOffer,
    getBankOffers,
    deleteBankOffer,
    updateBankOfferStatus,
    getBankOffersForProduct
};
