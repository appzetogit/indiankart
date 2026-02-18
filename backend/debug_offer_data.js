
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from './models/Category.js';
import Product from './models/Product.js';
import Offer from './models/Offer.js';

dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const runDebug = async () => {
    await connectDB();

    console.log('\n--- CATEGORIES ---');
    const categories = await Category.find({});
    // Create map for easy lookup
    const catMap = {};
    categories.forEach(c => {
        console.log(`Name: "${c.name}", ID: ${c.id}, _id: ${c._id}`);
        catMap[c._id.toString()] = c;
    });

    console.log('\n--- OFFERS (Big Billion) ---');
    const offers = await Offer.find({ title: { $regex: 'Big Billion', $options: 'i' } }).populate('linkedCategories');
    
    if (offers.length === 0) {
        console.log('No "Big Billion" offer found.');
    } else {
        offers.forEach(o => {
            console.log(`Offer: "${o.title}"`);
            console.log('Linked Categories:');
            o.linkedCategories.forEach(lc => {
                console.log(`  - Name: "${lc.name}", ID: ${lc.id}, _id: ${lc._id}`);
            });
        });
    }

    console.log('\n--- CHECKING PRODUCTS FOR MOBILE CATEGORIES ---');
    const mobileCats = categories.filter(c => c.name.toLowerCase().includes('mobile'));
    if (mobileCats.length > 0) {
        for (const cat of mobileCats) {
            const count = await Product.countDocuments({ categoryId: cat.id });
            console.log(`Products with categoryId ${cat.id} (${cat.name}): ${count}`);
            
            // Debug: show one product if count > 0
            if (count > 0) {
                const p = await Product.findOne({ categoryId: cat.id });
                console.log(`  Example Product: "${p.name}", CategoryId: ${p.categoryId}, Category: "${p.category}"`);
            } else {
                 // Check if products exist for string name?
                 const countByName = await Product.countDocuments({ category: cat.name });
                 console.log(`  Products with category name "${cat.name}": ${countByName}`);
            }
        }
    } else {
        console.log('No categories with "mobile" in name found.');
    }

    process.exit();
};

runDebug();
