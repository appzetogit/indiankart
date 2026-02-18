import mongoose from 'mongoose';

const orderSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    orderItems: [
        {
            name: { type: String, required: true },
            qty: { type: Number, required: true },
            image: { type: String, required: true },
            price: { type: Number, required: true },
            variant: { type: Object }, // To store dynamic variants like { Weight: "1kg" }
            serialNumber: { type: String }, // For Admin to add Serial/IMEI when packing
            serialType: { type: String, default: 'Serial Number' }, // 'Serial Number' or 'IMEI'
            product: {
                type: Number, // Using Number ID for now
                required: true,
                ref: 'Product',
            },
            status: { type: String }, // Item-level status (e.g., 'Return Requested', 'Returned')
        },
    ],
    shippingAddress: {
        name: { type: String }, // Snapshot of user name
        email: { type: String }, // Snapshot of user email
        phone: { type: String }, // Snapshot of user phone
        street: { type: String, required: true },
        city: { type: String, required: true },
        postalCode: { type: String, required: true },
        country: { type: String, required: true },
    },
    paymentMethod: {
        type: String,
        required: true,
        default: 'COD',
    },
    paymentResult: {
        id: { type: String },
        status: { type: String },
        update_time: { type: String },
        email_address: { type: String },
        razorpay_order_id: { type: String },
        card_network: { type: String },
        card_last4: { type: String },
        card_type: { type: String },
    },
    itemsPrice: { type: Number, required: true, default: 0.0 },
    taxPrice: { type: Number, required: true, default: 0.0 },
    shippingPrice: { type: Number, required: true, default: 0.0 },
    totalPrice: { type: Number, required: true, default: 0.0 },
    isPaid: { type: Boolean, required: true, default: false },
    paidAt: { type: Date },
    isDelivered: { type: Boolean, required: true, default: false },
    deliveredAt: { type: Date },
    
    // OTP Delivery
    deliveryOtp: { type: String },
    deliveryOtpExpiresAt: { type: Date },
    deliveryOtpVerified: { type: Boolean, default: false },
    invoiceEnabled: { type: Boolean, default: false },
    
    // Order IDs
    displayId: { type: String, unique: true },
    transactionId: { type: String },

    // Order Status
    status: { 
        type: String, 
        default: 'Pending',
        enum: ['Pending', 'Confirmed', 'Packed', 'Dispatched', 'Out for Delivery', 'Delivered', 'Cancelled', 'Cancellation Requested']
    },
}, {
    timestamps: true,
});

const Order = mongoose.model('Order', orderSchema);

export default Order;
