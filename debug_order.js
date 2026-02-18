import mongoose from 'mongoose';
import Order from './backend/models/Order.js';
import dotenv from 'dotenv';
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

const debugOrder = async () => {
    await connectDB();
    const orderId = '6981c65b866b9f3c9587e685';
    // If the ID given by user is not a valid ObjectId (it looks a bit short/different? standard is 24 hex chars. 
    // 6981c65b866b9f3c9587e685 is 24 chars. It is valid.)
    
    try {
        // We might need to handle the case if the ID in the URL was actually an Order ID or something else.
        // But let's try to query it.
        // Wait, 6981... is 24 chars.
        
        const order = await Order.findById(orderId);
        if (order) {
            console.log('Order Found:');
            console.log('Order Status:', order.status);
            console.log('Order Items:');
            order.orderItems.forEach((item, index) => {
                console.log(`Item ${index + 1}:`);
                console.log(`  Name: ${item.name}`);
                console.log(`  Status: '${item.status}'`); // Quote to see if empty string or undefined
                console.log(`  ProductID: ${item.product}`);
                console.log(`  _id: ${item._id}`);
            });
        } else {
            console.log('Order NOT found with this ID.');
            // Let's list last 5 orders to see valid IDs
            const orders = await Order.find().sort({ createdAt: -1 }).limit(5);
            console.log('Last 5 Orders:');
            orders.forEach(o => console.log(`- ${o._id} : ${o.createdAt}`));
        }
    } catch (err) {
        console.error(err);
    }
    process.exit();
};

debugOrder();
