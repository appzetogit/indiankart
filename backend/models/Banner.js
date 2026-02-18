import mongoose from 'mongoose';

const bannerSchema = mongoose.Schema({
    section: { type: String, required: true }, // 'All', 'Electronics', 'HomeHero', etc.
    type: { type: String, default: 'slides', enum: ['slides', 'hero', 'card', 'product_feature'] }, 
    active: { type: Boolean, default: true },
    
    // For 'slides' type
    slides: [{
        imageUrl: { type: String },
        link: { type: String },
        linkedProduct: { type: mongoose.Schema.Types.Mixed }, // Store minimal product info or ID
        linkedOffer: { type: mongoose.Schema.Types.ObjectId, ref: 'Offer' }, // Link to offer
        targetType: { type: String, enum: ['product', 'offer', 'url'], default: 'product' }
    }],

    // For 'hero' type
    content: {
        brand: String,
        brandTag: String,
        title: String,
        subtitle: String,
        description: String,
        imageUrl: String,
        badgeText: String,
        offerText: String,
        offerBank: String,
        backgroundColor: String, // Optional gradient/color class
        backgroundImageUrl: String, 
        textColor: String,
        textAlign: { type: String, enum: ['left', 'center', 'right'], default: 'left' },
        verticalAlign: { type: String, enum: ['top', 'center', 'bottom'], default: 'center' },
        imageAlign: { type: String, enum: ['left', 'right', 'center', 'none'], default: 'right' },
        buttonText: String,
        // Custom positioning
        useCustomPosition: { type: Boolean, default: false },
        textPosition: {
            x: { type: Number, min: 0, max: 100, default: 10 }, // percentage
            y: { type: Number, min: 0, max: 100, default: 50 }  // percentage
        },
        imagePosition: {
            x: { type: Number, min: 0, max: 100, default: 70 }, // percentage
            y: { type: Number, min: 0, max: 100, default: 50 }  // percentage
        },
        // Featured products to display in banner
        featuredProducts: [{
            productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
            position: {
                x: { type: Number, min: 0, max: 100 }, // percentage
                y: { type: Number, min: 0, max: 100 }  // percentage
            }
        }],
        link: { type: String },
        linkedProduct: { type: mongoose.Schema.Types.Mixed },
        linkedOffer: { type: mongoose.Schema.Types.ObjectId, ref: 'Offer' },
        targetType: { type: String, enum: ['product', 'offer', 'url'], default: 'product' }
    }
}, {
    timestamps: true,
});

const Banner = mongoose.model('Banner', bannerSchema);
export default Banner;
