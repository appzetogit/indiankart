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

const SubCategory = mongoose.model('SubCategory', subCategorySchema);

export default SubCategory;
