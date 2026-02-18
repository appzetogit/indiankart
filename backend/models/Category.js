import mongoose from 'mongoose';

const categorySchema = mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    icon: { type: String },
    bannerImage: { type: String },
    bannerAlt: { type: String },
    bannerImage: { type: String },
    bannerAlt: { type: String },
    active: { type: Boolean, default: true },
    // subCategories removed - now using separate SubCategory model
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Reverse populate with virtuals
categorySchema.virtual('subCategories', {
    ref: 'SubCategory',
    localField: '_id',
    foreignField: 'category',
    justOne: false
});

const Category = mongoose.model('Category', categorySchema);

export default Category;
