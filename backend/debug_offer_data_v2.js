
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

    console.log('\n--- TARGETED DEBUG: Offer ID 6982ee66df74f2cd663b0d62 ---');
    let offers = await Offer.find({ _id: '6982ee66df74f2cd663b0d62' }).populate('linkedCategories');
    
    if (offers.length === 0) {
        console.log('Offer ID not found. Searching by title regex "Big"...');
        offers = await Offer.find({ title: { $regex: 'Big', $options: 'i' } }).populate('linkedCategories');
    }

    if (offers.length === 0) {
        console.log('No offers found. Listing ALL offer titles:');
        const all = await Offer.find({}, 'title');
        all.forEach(a => console.log(`- "${a.title}" (${a._id})`));
        process.exit();
    }

    for (const offer of offers) {
        console.log(`\nOFFER: "${offer.title}" (ID: ${offer._id})`);
        console.log(`ApplicableTo: ${offer.applicableTo}`);
        
        if (offer.linkedCategories.length === 0) {
            console.log('  No linked categories.');
            continue;
        }

        console.log(`  Linked Categories (${offer.linkedCategories.length}):`);
        for (const cat of offer.linkedCategories) {
            console.log(`    - Name: "${cat.name}"`);
            console.log(`      ObjectId: ${cat._id}`);
            console.log(`      Numeric ID: ${cat.id}`);
            
            // Count products
            const countId = await Product.countDocuments({ categoryId: cat.id });
            const countName = await Product.countDocuments({ category: cat.name });
            console.log(`      Products by ID (${cat.id}): ${countId}`);
            console.log(`      Products by Name ("${cat.name}"): ${countName}`);
            
            if (countId === 0 && countName > 0) {
                console.log('      [WARNING] Products exist by Name but not by ID. Mismatch?');
                const sample = await Product.findOne({ category: cat.name });
                console.log(`      Sample Product ID: ${sample.categoryId}`);
            }
        }
    }

    process.exit();
};

runDebug();
