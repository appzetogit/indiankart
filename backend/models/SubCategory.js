import mongoose from 'mongoose';

const subCategorySchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    image: {
        type: String,
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true,
        index: true,
    },
    parentSubCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubCategory',
        default: null
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    }
}, {
    timestamps: true,
});

subCategorySchema.index({ category: 1, isActive: 1, createdAt: -1 });
subCategorySchema.index({ createdAt: -1 });

const SubCategory = mongoose.model('SubCategory', subCategorySchema);

export default SubCategory;
