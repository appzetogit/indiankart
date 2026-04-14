import mongoose from 'mongoose';

const productSchema = mongoose.Schema({
    id: { type: Number, required: true, unique: true }, // Keeping manual ID for sync with frontend data logic (Date.now())
    name: { type: String, required: true },
    brand: { type: String },
    subcategoryBrand: { type: String },
    price: { type: Number, required: true },
    originalPrice: { type: Number },
    discount: { type: String },
    rating: { type: Number, default: 5, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0, min: 0 },
    viewCount: { type: Number, default: 0, min: 0 },
    viewStatsByState: [{
        state: { type: String, trim: true },
        count: { type: Number, default: 0, min: 0 }
    }],
    image: { type: String }, // Primary image
    images: [{ type: String }], // Gallery images
    category: { type: String, required: true }, // Main category name (Legacy/Display)
    categoryId: { type: Number }, // Main category ID (Legacy)
    subCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SubCategory' }], // Multiple Hierarchical References
    categoryPath: [{ type: String }], // Array of category IDs (breadcrumbs) - Supports both Number and ObjectId strings
    
    // Description & Meta
    tags: [{ type: String }],
    highlights: [{ // Structured highlights with sections
        heading: { type: String },
        points: [{ type: String }]
    }],
    
    // Product Description (Headings with Bullet Points)
    description: [{
        heading: { type: String },
        points: [{ type: String }],
        content: { type: String }, // Paragraph text
        image: { type: String } // Image URL/Path
    }],
    deliveryDays: { type: Number, default: 5 },

    // Specifications (Optional grouped key-value specs)
    specifications: [{
        groupName: { type: String },
        specs: [{
            key: { type: String },
            value: { type: String }
        }]
    }],

    // Warranty & Returns
    warranty: {
        summary: { type: String }, // e.g. "1 Year Brand Warranty"
        covered: { type: String }, // e.g. "Manufacturing Defects"
        notCovered: { type: String } // e.g. "Physical Damage"
    },
    returnPolicy: {
        days: { type: Number, default: 7 },
        description: { type: String } // e.g. "Returns accepted for damaged/defective items only"
    },

    // Inventory & Variants
    stock: { type: Number, default: 0, min: 0 },
    maxOrderQuantity: { type: Number, default: 1, min: 1 },
    variantLabel: { type: String }, // 'Size', 'Color' etc.
    variantHeadings: [{
        id: { type: Number },
        name: { type: String },
        hasImage: { type: Boolean, default: false },
        options: [{
            name: { type: String },
            image: { type: String },
            images: [{ type: String }]
        }]
    }],
    skus: [{
        combination: { type: Map, of: String }, // e.g. { Color: "Red", Size: "M" }
        price: { type: Number, default: 0, min: 0 },
        originalPrice: { type: Number, default: 0, min: 0 },
        stock: { type: Number, default: 0, min: 0 }
    }],
    
    // Legacy fields if needed
    b2bEnabled: { type: Boolean, default: false, index: true },
    colors: [{ type: String }], 
    sizes: [{ type: String }]

}, {
    timestamps: true,
});

// Query-path indexes for category listing pages.
productSchema.index({ categoryId: 1, createdAt: -1 });
productSchema.index({ category: 1, createdAt: -1 });
productSchema.index({ subCategories: 1, createdAt: -1 });
productSchema.index({ tags: 1 });

const Product = mongoose.model('Product', productSchema);

export default Product;
