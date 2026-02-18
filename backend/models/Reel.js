import mongoose from 'mongoose';

const reelSchema = mongoose.Schema({
    videoUrl: { type: String, required: true },
    productLink: { type: String }, // Can be productName or actual link, frontend uses it as label
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    active: { type: Boolean, default: true }
}, {
    timestamps: true,
});

const Reel = mongoose.model('Reel', reelSchema);
export default Reel;
