import mongoose from 'mongoose';

const offerSchema = mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    discountType: {
        type: String,
        enum: ['percentage', 'flat'],
        required: true,
        default: 'percentage'
    },
    discountValue: {
        type: Number,
        required: true,
        min: 0
    },
    linkedProducts: [{
        type: Number, // Product ID is Number type
        ref: 'Product'
    }],
    linkedCategories: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    }],
    linkedSubCategories: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubCategory'
    }],
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    priority: {
        type: Number,
        default: 0
    },
    bannerImage: {
        type: String
    },
    termsAndConditions: {
        type: String
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for applicableTo
offerSchema.virtual('applicableTo').get(function() {
    if (this.linkedProducts && this.linkedProducts.length > 0) return 'product';
    if (this.linkedCategories && this.linkedCategories.length > 0) return 'category';
    if (this.linkedSubCategories && this.linkedSubCategories.length > 0) return 'subcategory';
    return null;
});

// Index for efficient querying
offerSchema.index({ isActive: 1, startDate: 1, endDate: 1 });

const Offer = mongoose.model('Offer', offerSchema);

export default Offer;
