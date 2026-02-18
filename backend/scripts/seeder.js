
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import HomeSection from '../models/HomeSection.js';
import User from '../models/User.js';
import Banner from '../models/Banner.js';
import Admin from '../models/Admin.js';
import connectDB from '../config/db.js';

dotenv.config();

const categories = [
    {
        id: 1,
        name: "For You",
        icon: "grid_view",
        bannerImage: "https://rukminim1.flixcart.com/fk-p-flap/1600/270/image/aa1b23763c2c4d6a.jpg?q=20",
        bannerAlt: "Republic Day Sale"
    },
    {
        id: 2,
        name: "Fashion",
        icon: "checkroom",
        bannerImage: "https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=600&auto=format&fit=crop",
        bannerAlt: "Fashion Sale"
    },
    {
        id: 3,
        name: "Mobiles",
        icon: "smartphone",
        bannerImage: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=600&auto=format&fit=crop",
        bannerAlt: "Mobile Deals"
    },
    {
        id: 4,
        name: "Beauty",
        icon: "face",
        bannerImage: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?q=80&w=600&auto=format&fit=crop",
        bannerAlt: "Beauty Sale"
    },
    {
        id: 5,
        name: "Electronics",
        icon: "laptop",
        bannerImage: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=600&auto=format&fit=crop",
        bannerAlt: "Tech Sale"
    },
    {
        id: 6,
        name: "Home",
        icon: "home",
        bannerImage: "https://images.unsplash.com/photo-1484154218962-a1c002085aa9?q=80&w=600&auto=format&fit=crop",
        bannerAlt: "Home & Kitchen Sale"
    },
    { id: 7, name: "Grocery", icon: "shopping_basket" },
    {
        id: 8,
        name: "Appliances",
        icon: "kitchen",
        bannerImage: "https://images.unsplash.com/photo-1556910103-1c02745a30bf?q=80&w=600&auto=format&fit=crop",
        bannerAlt: "Appliances Sale"
    },
    {
        id: 9,
        name: "Toys",
        icon: "sports_esports",
        bannerImage: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?q=80&w=600",
    },
    {
        id: 10,
        name: "Flights",
        icon: "flight",
        bannerImage: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=600",
    }
];

const products = [
    {
        id: 1,
        name: "Kvinner Casual Regular Fit Tops",
        brand: "Kvinner",
        price: 360,
        originalPrice: 1999,
        discount: "81% off",
        rating: 4.2,
        image: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?q=80&w=300",
        category: "Fashion",
        tags: ["Fashion", "Top Wear", "T-Shirts"]
    },
    {
        id: 2,
        name: "The Souled Store Cotton T-Shirt",
        brand: "The Souled Store",
        price: 499,
        originalPrice: 1799,
        discount: "72% off",
        rating: 4.3,
        image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=300",
        category: "Fashion",
        tags: ["Fashion", "Top Wear", "T-Shirts"]
    },
    {
        id: 20,
        name: "Men Slim Fit Blue Jeans",
        brand: "Roadster",
        price: 699,
        originalPrice: 2499,
        discount: "72% off",
        rating: 4.0,
        image: "https://rukminim1.flixcart.com/image/612/612/xif0q/jean/d/5/4/32-21160366-roadster-original-imag5g88qj3z3k22-bb.jpeg?q=70",
        category: "Fashion",
        tags: ["Fashion", "Bottoms", "Jeans"]
    },
    {
        id: 21,
        name: "Women Printed Kurta",
        brand: "Mokshi",
        price: 450,
        originalPrice: 1499,
        discount: "70% off",
        rating: 4.1,
        image: "https://rukminim1.flixcart.com/image/612/612/xif0q/kurta/2/y/o/s-ku657-mokshi-original-imagm5wzbg7x6l3h.jpeg?q=70",
        category: "Fashion",
        tags: ["Fashion", "Ethnic"]
    },
    {
        id: 22,
        name: "Running Shoes for Men",
        brand: "ASIAN",
        price: 899,
        originalPrice: 2999,
        discount: "70% off",
        rating: 3.9,
        image: "https://rukminim1.flixcart.com/image/612/612/xif0q/shoe/s/a/k/-original-imaggcax25d8z5e6.jpeg?q=70",
        category: "Fashion",
        tags: ["Fashion", "Footwear"]
    },
    {
        id: 301,
        name: "Formal Blue Shirt",
        brand: "US Polo Association",
        price: 899,
        originalPrice: 1999,
        discount: "55% off",
        rating: 4.2,
        image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=300",
        category: "Fashion",
        tags: ["Fashion", "Top Wear", "Shirts"]
    },
    {
        id: 302,
        name: "Casual Black Trousers",
        brand: "Peter England",
        price: 1299,
        originalPrice: 2499,
        discount: "48% off",
        rating: 4.1,
        image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=300",
        category: "Fashion",
        tags: ["Fashion", "Bottoms", "Trousers"]
    },
    {
        id: 303,
        name: "Gold Plated Party Designer Stone Stud For Women",
        brand: "SOHI",
        price: 1750,
        originalPrice: 3500,
        discount: "50% off",
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1616530940355-351fabd9524b?q=80&w=300",
        category: "Fashion",
        tags: ["Fashion", "Jewelry", "Earrings"]
    },
    {
        id: 3,
        name: "Acer Iconia Tab i8 - 4 GB RAM | 64 GB ROM",
        brand: "Acer",
        price: 9990,
        originalPrice: 21999,
        discount: "55% off",
        rating: 4.3,
        image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?q=80&w=300&auto=format&fit=crop",
        category: "Electronics",
        tags: ["Electronics", "Tablet"]
    },
    {
        id: 23,
        name: "HP Laptop 15s Ryzen 5",
        brand: "HP",
        price: 39999,
        originalPrice: 47123,
        discount: "16% off",
        rating: 4.4,
        image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=300&auto=format&fit=crop",
        category: "Electronics",
        tags: ["Electronics", "Laptops"]
    },
    {
        id: 101,
        name: "Canon Pixma MG2577s All-in-One Inkjet Printer",
        brand: "Canon",
        price: 3099,
        originalPrice: 4500,
        discount: "31% off",
        rating: 4.1,
        image: "https://cdn-icons-png.flaticon.com/512/3616/3616899.png",
        category: "Electronics",
        tags: ["Electronics", "Printers"]
    },
    {
        id: 102,
        name: "Samsung 24 inch Full HD IPS Panel Monitor",
        brand: "Samsung",
        price: 8999,
        originalPrice: 14000,
        discount: "35% off",
        rating: 4.5,
        image: "https://cdn-icons-png.flaticon.com/512/5700/5700806.png",
        category: "Electronics",
        tags: ["Electronics", "Monitors"]
    },
    {
        id: 103,
        name: "Mi 3i 20000 mAh Power Bank",
        brand: "Xiaomi",
        price: 1699,
        originalPrice: 2199,
        discount: "22% off",
        rating: 4.3,
        image: "https://cdn-icons-png.flaticon.com/512/9655/9655189.png",
        category: "Electronics",
        tags: ["Electronics", "Power Banks"]
    },
    {
        id: 104,
        name: "TP-Link Archer C6 Router",
        brand: "TP-Link",
        price: 2499,
        originalPrice: 4999,
        discount: "50% off",
        rating: 4.4,
        image: "https://cdn-icons-png.flaticon.com/512/2885/2885417.png",
        category: "Electronics",
        tags: ["Electronics", "Routers"]
    },
    {
        id: 4,
        name: "Smart Phone X - 8GB RAM | 128GB Storage",
        brand: "SmartX",
        price: 18499,
        originalPrice: 25999,
        discount: "28% off",
        rating: 4.6,
        image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=300",
        category: "Mobiles",
        tags: ["Mobiles", "5G Phones"]
    },
    {
        id: 24,
        name: "Apple iPhone 14 (Blue, 128 GB)",
        brand: "Apple",
        price: 58999,
        originalPrice: 69900,
        discount: "15% off",
        rating: 4.6,
        image: "https://rukminim1.flixcart.com/image/312/312/xif0q/mobile/k/u/6/-original-imaghxen343entpp.jpeg?q=70",
        category: "Mobiles",
        tags: ["Mobiles", "iPhone", "Apple"]
    },
    {
        id: 25,
        name: "Mamaearth Rosemary Hair Fall Control Kit",
        price: 515,
        originalPrice: 1031,
        discount: "50% off",
        rating: 4.2,
        image: "https://rukminim1.flixcart.com/image/612/612/xif0q/shampoo/j/x/o/-original-imagm5y2j5j5z5e6.jpeg?q=70",
        category: "Beauty",
        brand: "Mamaearth",
        tags: ["Beauty", "Hair"]
    },
    {
        id: 5,
        name: "Daawat Biryani Basmati Rice",
        price: 76,
        originalPrice: 125,
        discount: "39% off",
        rating: 4.1,
        image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?q=80&w=300&auto=format&fit=crop",
        category: "Grocery"
    },
    {
        id: 6,
        name: "Thums Up Soft Drink 750ml",
        price: 35,
        originalPrice: 40,
        discount: "12% off",
        rating: 4.3,
        image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=300&auto=format&fit=crop",
        category: "Grocery"
    },
    {
        id: 14,
        brand: "AIMIL",
        name: "Amynity Plus Syrup | Natural Immunity Booster | (200 ml)",
        price: 277,
        originalPrice: 351,
        discount: "21% off",
        rating: 2.5,
        image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=300&auto=format&fit=crop",
        category: "Health"
    },
    {
        id: 201,
        name: "Samsung Galaxy S24 Ultra",
        brand: "Samsung",
        price: 124999,
        originalPrice: 134999,
        discount: "7% off",
        rating: 4.8,
        image: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?q=80&w=300",
        category: "Electronics",
        tags: ["Mobiles", "Samsung", "Electronics"]
    }
];

const homeSections = [
    {
        id: 'fashion_value_deals',
        title: 'Best Value Deals on Fashion',
        products: [
            { name: 'Kvinner Top', image: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?q=80&w=300', discount: '81% off', category: 'Fashion' },
            { name: 'Souled Store T-Shirt', image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=300', discount: '72% off', category: 'Fashion' },
            { name: 'Roadster Jeans', image: 'https://rukminim1.flixcart.com/image/612/612/xif0q/jean/d/5/4/32-21160366-roadster-original-imag5g88qj3z3k22-bb.jpeg?q=70', discount: '72% off', category: 'Fashion' },
            { name: 'Mokshi Kurta', image: 'https://rukminim1.flixcart.com/image/612/612/xif0q/kurta/2/y/o/s-ku657-mokshi-original-imagm5wzbg7x6l3h.jpeg?q=70', discount: '70% off', category: 'Fashion' }
        ]
    },
    {
        id: 'interesting_finds',
        title: 'Interesting finds',
        products: [
            { title: 'Best Picks', tag: 'Under ₹399', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=300' },
            { title: 'Top Collection', tag: 'Special offer', image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=300' },
            { title: 'Wedding Special', tag: 'Grab Now', image: 'https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?q=80&w=300' },
            { title: 'Designer Wear', tag: 'New Arrivals', image: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?q=80&w=300' }
        ]
    }
];


const seedData = async () => {
    try {
        await connectDB();

        // Clear existing data
        await Product.deleteMany({});
        await Category.deleteMany({});
        await HomeSection.deleteMany({});
        await User.deleteMany({ email: 'admin@flipkart.com' }); // Clear legacy admin from Users
        await Admin.deleteMany({}); // Clear Admins

        console.log('Old data cleared.');

        // Create Admin User
        await Admin.create({
            name: 'Admin User',
            email: 'admin@flipkart.com'.toLowerCase(),
            password: 'admin123',
            role: 'superadmin'
        });
        console.log('Admin User Created');

        // Insert Categories
        await Category.insertMany(categories);
        console.log(`${categories.length} Categories seeded.`);

        // Insert Products
        await Product.insertMany(products);
        console.log(`${products.length} Products seeded.`);

        // Insert Home Sections
        await HomeSection.insertMany(homeSections);
        console.log(`${homeSections.length} Home Sections seeded.`);

        // Clear existing banners
        await Banner.deleteMany({});

        // Create Hero Banner
        await Banner.create({
            section: 'HomeHero',
            type: 'hero',
            active: true,
            content: {
                brand: 'Vivo',
                brandTag: 'Flipkart Unique',
                title: 'T4 Pro 5G | Steal deal',
                subtitle: 'From ₹4,250/M*',
                description: 'Flagship level 3X periscope zoom',
                imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAEBqorOw1nzFs235FA4-dgkHZlzxDMvInFBJdBP7ewPqElzT6CiyiNpMe3H3RetbNb_otxAGe_FJCozdna8wHncQ7sWuSpieB7tsIvPQz8oywlQSkC1NweH_Z4sNHAURspBlnUsojvCexz5qWuLqFSm5iMDTRse2oZDetSu1E9ZFpESOKoOwpE3wJPNFFzz49DStNPsES1OY9eRw-uL2ELze3zys5Mkv_V0Z8PFX0HGBB-Pivq8Yzvw0UHFbiyIWiYL_0c6Ie4YkB2',
                badgeText: '3X Periscope Camera',
                offerText: 'Flat ₹3,000 Instant Discount*',
                offerBank: 'HDFC BANK'
            }
        });
        console.log('Hero Banner Created');

        console.log('Database Seeding Completed Successfully!');
        process.exit();
    } catch (error) {
        console.error(`Error with seeding: ${error.message}`);
        process.exit(1);
    }
};

seedData();
