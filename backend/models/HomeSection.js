import mongoose from 'mongoose';

const homeSectionSchema = mongoose.Schema({
    id: { type: String, required: true, unique: true }, // 'trending', 'featured' etc or UUID
    title: { type: String, required: true },
    subtitle: { type: String },
    products: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Product' 
    }]
}, {
    timestamps: true,
});

const HomeSection = mongoose.model('HomeSection', homeSectionSchema);
export default HomeSection;
