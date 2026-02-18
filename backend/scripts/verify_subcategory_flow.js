import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from '../models/Category.js';
import SubCategory from '../models/SubCategory.js';
import Product from '../models/Product.js';
import connectDB from '../config/db.js';

dotenv.config();

const verifyFlow = async () => {
    try {
        await connectDB();
        console.log('Database Connected');

        // 1. Create a Category
        const category = await Category.create({
            id: 999,
            name: 'Test Category',
            icon: 'test_icon'
        });
        console.log('Category Created:', category._id);

        // 2. Create a SubCategory
        const subCategory = await SubCategory.create({
            name: 'Test SubCategory',
            category: category._id,
            description: 'Testing hierarchy'
        });
        console.log('SubCategory Created:', subCategory._id);

        // 3. Create a Product linked to SubCategory
        const product = await Product.create({
            id: 99999,
            name: 'Test Product',
            price: 100,
            category: category.name,
            categoryId: category.id,
            subCategory: subCategory._id
        });
        console.log('Product Created:', product._id);

        // 4. Verify Retrieval
        const fetchedSubCategory = await SubCategory.findById(subCategory._id).populate('category');
        console.log('Fetched SubCategory Parent:', fetchedSubCategory.category.name);

        const fetchedProduct = await Product.findById(product._id).populate('subCategory');
        console.log('Fetched Product SubCategory:', fetchedProduct.subCategory.name);

        console.log('Verification Successful!');

        // Cleanup
        await Product.deleteOne({ _id: product._id });
        await SubCategory.deleteOne({ _id: subCategory._id });
        await Category.deleteOne({ _id: category._id });
        console.log('Cleanup Done');

        process.exit();
    } catch (error) {
        console.error('Verification Failed:', error);
        process.exit(1);
    }
};

verifyFlow();
