import mongoose from 'mongoose';

const subCategorySchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    image: {
        type: String,
    },
    description: {
        type: String,
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true,
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
});

const SubCategory = mongoose.model('SubCategory', subCategorySchema);

export default SubCategory;
