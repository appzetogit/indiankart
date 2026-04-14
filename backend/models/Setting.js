import mongoose from 'mongoose';

const settingSchema = mongoose.Schema({
    sellerName: { type: String, required: true, default: 'My Store' },
    sellerAddress: { type: String, required: true, default: 'Store Address' },
    gstNumber: { type: String, default: '' },
    panNumber: { type: String, default: '' },
    logoUrl: { type: String, default: '' },
    signatureUrl: { type: String, default: '' },
    contactEmail: { type: String, default: '' },
    contactPhone: { type: String, default: '' },
    fssai: { type: String, default: '' },
    shippingCharge: { type: Number, default: 40 },
    freeShippingThreshold: { type: Number, default: 500 },
    minShippingOrderAmount: { type: Number, default: 0 },
    maxShippingOrderAmount: { type: Number, default: 499 },
    razorpayKeyId: { type: String, default: '' },
    razorpayKeySecret: { type: String, default: '', select: false },
    deliveryApi: { type: String, default: '' },
    delhiveryClientName: { type: String, default: '' },
    delhiveryPickupLocation: { type: String, default: '' },
    delhiveryToken: { type: String, default: '', select: false },
    ekartBaseUrl: { type: String, default: '' },
    ekartTrackingBaseUrl: { type: String, default: '' },
    ekartClientName: { type: String, default: '' },
    ekartPickupLocation: { type: String, default: '' },
    ekartUsername: { type: String, default: '' },
    ekartPassword: { type: String, default: '', select: false },
    ekartApiKey: { type: String, default: '', select: false },
    ekartCreateShipmentPath: { type: String, default: '/api/v1/shipments' },
    ekartTrackingPath: { type: String, default: '/api/v1/shipments/tracking' },
    ekartCancelPath: { type: String, default: '/api/v1/shipments/cancel' },
    categoryPageCatalog: { type: [mongoose.Schema.Types.Mixed], default: [] },
    subCategoryPageCatalog: { type: [mongoose.Schema.Types.Mixed], default: [] },
}, {
    timestamps: true,
});

const Setting = mongoose.model('Setting', settingSchema);

export default Setting;
