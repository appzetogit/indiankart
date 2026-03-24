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

const footerQuickLinkSchema = new mongoose.Schema({
    label: {
        type: String,
        required: true,
        trim: true
    },
    icon: {
        type: String,
        default: 'help'
    },
    pageKey: {
        type: String,
        default: ''
    },
    url: {
        type: String,
        default: ''
    },
    isExternal: {
        type: Boolean,
        default: false
    }
}, { _id: false });

const footerConfigSchema = new mongoose.Schema({
    sections: [footerSectionSchema],
    quickLinks: [footerQuickLinkSchema],
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
    becomeSellerPageKey: String,
    becomeSellerUrl: String,
    advertisePageKey: String,
    advertiseUrl: String,
    giftCardsPageKey: String,
    giftCardsUrl: String,
    helpCenterPageKey: String
    ,
    helpCenterUrl: String
}, {
    timestamps: true
});

const FooterConfig = mongoose.model('FooterConfig', footerConfigSchema);

export default FooterConfig;
