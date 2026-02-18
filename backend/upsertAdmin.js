import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from './models/Admin.js';
import connectDB from './config/db.js';

dotenv.config();

const upsertAdmin = async () => {
    try {
        await connectDB();

        const email = 'admin@flipkart.comm'.toLowerCase();
        const password = 'admin123';
        const name = 'Admin User';

        const existingAdmin = await Admin.findOne({ email });

        if (existingAdmin) {
            existingAdmin.password = password; // Hashing happens in pre-save
            existingAdmin.name = name;
            await existingAdmin.save();
            console.log('Admin user updated successfully.');
        } else {
            await Admin.create({
                name,
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
