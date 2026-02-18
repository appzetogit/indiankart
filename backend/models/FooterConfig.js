import mongoose from 'mongoose';

const footerSectionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    links: [{
        label: { type: String, required: true },
        pageKey: { type: String }, // Links to ContentPage.pageKey
        url: { type: String }, // For external or specific links
        isExternal: { type: Boolean, default: false }
    }]
});

const footerConfigSchema = new mongoose.Schema({
    sections: [footerSectionSchema],
    mailAddress: {
        type: String,
        default: ''
    },
    officeAddress: {
        type: String,
        default: ''
    },
    cinNumber: {
        type: String,
        default: ''
    },
    copyrightText: {
        type: String,
        default: '© 2007-2024 YourStore.com'
    },
    socialLinks: {
        facebook: String,
        twitter: String,
        youtube: String,
        instagram: String
    },
    advertisePageKey: String,
    giftCardsPageKey: String,
    helpCenterPageKey: String
}, {
    timestamps: true
});

const FooterConfig = mongoose.model('FooterConfig', footerConfigSchema);

export default FooterConfig;
