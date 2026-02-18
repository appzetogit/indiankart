
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from './backend/models/Category.js';
import Product from './backend/models/Product.js';
import Offer from './backend/models/Offer.js';

dotenv.config({ path: './backend/.env' });

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
        console.log('No "Big Billion" offer found. Listing all offers with linked categories:');
        const allOffers = await Offer.find({ linkedCategories: { $not: { $size: 0 } } }).populate('linkedCategories');
        allOffers.forEach(o => {
             console.log(`Offer: "${o.title}"`);
             console.log('Linked Categories:');
             o.linkedCategories.forEach(lc => {
                 console.log(`  - Name: "${lc.name}", ID: ${lc.id}, _id: ${lc._id}`);
             });
        });
    } else {
        offers.forEach(o => {
            console.log(`Offer: "${o.title}"`);
            console.log('Linked Categories:');
            o.linkedCategories.forEach(lc => {
                console.log(`  - Name: "${lc.name}", ID: ${lc.id}, _id: ${lc._id}`);
            });
        });
    }

    console.log('\n--- PRODUCTS (First 20) ---');
    const products = await Product.find({}).limit(20);
    products.forEach(p => {
        console.log(`Name: "${p.name}", CategoryId: ${p.categoryId}, CategoryName: "${p.category}"`);
    });

    // Check strict match for "mobile" or "mobiles"
    const mobileCats = categories.filter(c => c.name.toLowerCase().includes('mobile'));
    if (mobileCats.length > 0) {
        console.log('\n--- CHECKING PRODUCTS FOR MOBILE CATEGORIES ---');
        for (const cat of mobileCats) {
            const count = await Product.countDocuments({ categoryId: cat.id });
            console.log(`Products with categoryId ${cat.id} (${cat.name}): ${count}`);
        }
    }

    process.exit();
};

runDebug();
