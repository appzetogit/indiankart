import mongoose from 'mongoose';

const contentPageSchema = mongoose.Schema({
    pageKey: { type: String, required: true, unique: true }, // 'privacyPolicy', 'aboutUs', 'seoContent'
    content: { type: String, default: '' },
    lastUpdated: { type: Date, default: Date.now }
}, {
    timestamps: true,
});

const ContentPage = mongoose.model('ContentPage', contentPageSchema);
export default ContentPage;
