import express from 'express'; // Reload trigger 5
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

dotenv.config();

import connectDB from './config/db.js';

import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
// ... existing imports ...

// ... middleware ...

import productRoutes from './routes/productRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import returnRoutes from './routes/returnRoutes.js';
import couponRoutes from './routes/couponRoutes.js';
import reelRoutes from './routes/reelRoutes.js';
import bannerRoutes from './routes/bannerRoutes.js';
import homeSectionRoutes from './routes/homeSectionRoutes.js';
import contentPageRoutes from './routes/contentPageRoutes.js';
import subCategoryRoutes from './routes/subCategoryRoutes.js';
import homeLayoutRoutes from './routes/homeLayoutRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import pinCodeRoutes from './routes/pinCodeRoutes.js';
import bankOfferRoutes from './routes/bankOfferRoutes.js';
import settingRoutes from './routes/settingRoutes.js';
import offerRoutes from './routes/offerRoutes.js';

import notificationRoutes from './routes/notificationRoutes.js';
import sellerRequestRoutes from './routes/sellerRequestRoutes.js';
import footerRoutes from './routes/footerRoutes.js';
import headerRoutes from './routes/headerRoutes.js';


const app = express();

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    : ['http://localhost:5173', 'http://127.0.0.1:5173', 'https://flipkart-6t6p.vercel.app'];

app.use(cors({
    origin: function (origin, callback) {
        // allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        const isAllowed = allowedOrigins.includes(origin) || origin.endsWith('.vercel.app');

        if (isAllowed) {
            callback(null, true);
        } else {
            console.log('CORS blocked origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));
app.use(express.json());
app.use(cookieParser());

// Connect to Database
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/reels', reelRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/home-sections', homeSectionRoutes);
app.use('/api/pages', contentPageRoutes);
app.use('/api/subcategories', subCategoryRoutes);
app.use('/api/home-layout', homeLayoutRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/pincodes', pinCodeRoutes);
app.use('/api/bank-offers', bankOfferRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/seller-requests', sellerRequestRoutes);
app.use('/api/footer', footerRoutes);
app.use('/api/header', headerRoutes);

app.get('/', (req, res) => {
    res.send('API is running...');
});

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on port ${PORT}`);
    });
}

export default app;
