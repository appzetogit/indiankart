import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './models/Product.js';
import Category from './models/Category.js';

dotenv.config();

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const categories = await Category.find({});
        console.log('Categories Status:');
        categories.forEach(c => {
            console.log(`- ${c.name} (id: ${c.id}, _id: ${c._id}): Active=${c.active}`);
        });
        
        const products = await Product.find({ 
            $or: [
                { category: /mobile/i },
                { tags: /mobile/i }
            ]
        });
        console.log('\nMobile Products:');
        products.forEach(p => {
            console.log(`- ${p.name}: Category="${p.category}", CategoryId=${p.categoryId}, Price=${p.price}`);
        });
        
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
