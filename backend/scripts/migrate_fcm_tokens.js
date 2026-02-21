import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';

dotenv.config();

const run = async () => {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/ecom_db';
        await mongoose.connect(mongoUri);
        console.log('MongoDB connected');

        const users = await User.find({
            fcmToken: { $exists: true, $ne: null },
            $or: [
                { fcmTokenWeb: { $exists: false } },
                { fcmTokenWeb: null },
                { fcmTokenWeb: '' }
            ]
        }).select('_id fcmToken');

        if (users.length === 0) {
            console.log('No users require migration.');
            return;
        }

        const ops = users.map((u) => ({
            updateOne: {
                filter: { _id: u._id },
                update: { $set: { fcmTokenWeb: u.fcmToken } }
            }
        }));

        const result = await User.bulkWrite(ops);
        console.log(`Matched: ${users.length}, Updated: ${result.modifiedCount}`);
    } catch (error) {
        console.error('Migration failed:', error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
};

run();
