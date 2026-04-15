import mongoose from 'mongoose';

const brandSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    image: {
        type: String
    },
    subcategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubCategory',
        required: true,
        index: true
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    }
}, {
    timestamps: true
});

brandSchema.index({ subcategory: 1, name: 1 }, { unique: true });

const Brand = mongoose.model('Brand', brandSchema);

export default Brand;
