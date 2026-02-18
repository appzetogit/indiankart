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
}, {
    timestamps: true,
});

const Setting = mongoose.model('Setting', settingSchema);

export default Setting;
