import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from './models/Admin.js';
import connectDB from './config/db.js';

dotenv.config();

const upsertAdmin = async () => {
    try {
        await connectDB();

        const username = 'admin';
        const email = 'admin@flipkart.com'.toLowerCase();
        const password = '123456';
        const name = 'Admin User';

        // Remove old admin accounts so only the current credential remains.
        await Admin.deleteMany({ $and: [{ email: { $ne: email } }, { username: { $ne: username } }] });

        const existingAdmin = await Admin.findOne({ $or: [{ email }, { username }] });

        if (existingAdmin) {
            existingAdmin.password = password; // Hashing happens in pre-save
            existingAdmin.name = name;
            existingAdmin.username = username;
            existingAdmin.email = email;
            await existingAdmin.save();
            console.log('Admin user updated successfully.');
        } else {
            await Admin.create({
                name,
                username,
                email,
                password,
                role: 'superadmin'
            });
            console.log('Admin user created successfully.');
        }

        await mongoose.connection.close();
        process.exit();
    } catch (error) {
        console.error('Error upserting admin:', error.message);
        process.exit(1);
    }
};

upsertAdmin();
