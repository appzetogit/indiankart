import mongoose from 'mongoose';
import SubCategory from './backend/models/SubCategory.js';
import Category from './backend/models/Category.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: './backend/.env' });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/indiakart';

async function audit() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const totalSubs = await SubCategory.countDocuments({});
        console.log('Total subcategories:', totalSubs);

        const base64Subs = await SubCategory.find({ image: { $regex: /^data:image/ } });
        console.log('Subcategories with Base64 images:', base64Subs.length);

        if (base64Subs.length > 0) {
            let totalBytes = 0;
            base64Subs.forEach(s => { totalBytes += (s.image || '').length; });
            console.log('Total Base64 data size:', (totalBytes / 1024 / 1024).toFixed(2), 'MB');
            
            const first = base64Subs[0];
            console.log(`Example: ${first.name} (${(first.image.length / 1024 / 1024).toFixed(2)} MB)`);
        }

        const statsPerCategory = await SubCategory.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 }, base64Count: { $sum: { $cond: [{ $regexMatch: { input: '$image', regex: /^data:image/ } }, 1, 0 ] } } } }
        ]);
        
        console.log('\nStats per Category ID:');
        statsPerCategory.forEach(s => {
            console.log(`ID: ${s._id} | Subs: ${s.count} | Base64: ${s.base64Count}`);
        });

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

audit();
