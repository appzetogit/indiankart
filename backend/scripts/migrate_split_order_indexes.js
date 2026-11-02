import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Order from '../models/Order.js';

dotenv.config();

// A checkout now creates one order per cart line, all sharing one payment.
// The old indexes allowed only one order per payment id, so they are replaced
// with ones unique per (payment id, groupIndex). Run once, before deploying.
const OLD_INDEXES = [
    'transactionId_1',
    'paymentResult.razorpay_payment_id_1',
    'paymentResult.razorpay_order_id_1'
];

const run = async () => {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/ecom_db';
        await mongoose.connect(mongoUri);
        console.log('MongoDB connected');

        const existing = new Set((await Order.collection.indexes()).map((index) => index.name));
        for (const name of OLD_INDEXES) {
            if (!existing.has(name)) {
                console.log(`Index ${name} not present, skipping`);
                continue;
            }
            await Order.collection.dropIndex(name);
            console.log(`Dropped ${name}`);
        }

        await Order.createIndexes();
        console.log('Order indexes created from schema');
    } catch (error) {
        console.error('Migration failed:', error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
};

run();
