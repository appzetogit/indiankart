import mongoose from 'mongoose';

const contentPageSchema = mongoose.Schema({
    pageKey: { type: String, required: true, unique: true }, // 'privacyPolicy', 'aboutUs', 'seoContent'
    title: { type: String, default: '' },
    content: { type: String, default: '' },
    showInMobileProfile: { type: Boolean, default: false },
    lastUpdated: { type: Date, default: Date.now }
}, {
    timestamps: true,
});

const ContentPage = mongoose.model('ContentPage', contentPageSchema);
export default ContentPage;
