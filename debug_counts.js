import mongoose from 'mongoose';
import '../backend/models/Category.js';
import '../backend/models/SubCategory.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), 'backend', '.env') });

const Category = mongoose.model('Category');
const SubCategory = mongoose.model('SubCategory');

async function checkCounts() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const catCount = await Category.countDocuments();
        const subCatCount = await SubCategory.countDocuments();

        console.log(`Categories: ${catCount}`);
        console.log(`SubCategories: ${subCatCount}`);

        if (catCount > 0) {
           const firstCat = await Category.findOne();
           console.log('First Category:', JSON.stringify(firstCat, null, 2));
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkCounts();
