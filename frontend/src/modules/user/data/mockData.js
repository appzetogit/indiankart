export const categories = [
    {
        id: 1,
        name: "For You",
        icon: "grid_view",
        bannerImage: "https://rukminim1.flixcart.com/fk-p-flap/1600/270/image/aa1b23763c2c4d6a.jpg?q=20",
        bannerAlt: "Republic Day Sale",
        subCategories: [] // Home doesn't have same subcats usually
    },
    {
        id: 2,
        name: "Fashion",
        icon: "checkroom",
        bannerImage: "https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=600&auto=format&fit=crop",
        bannerAlt: "Fashion Sale",
        secondaryBannerImage: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=600&auto=format&fit=crop",
        subCategories: [
            {
                name: "Top Wear",
                image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=150&auto=format&fit=crop",
                bannerImage: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=600&auto=format&fit=crop",
                bannerAlt: "Top Wear Sale",
                secondaryBannerImage: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=600&auto=format&fit=crop",
                banners: [
                    { id: 1, image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1000&auto=format&fit=crop", alt: "T-Shirts Sale" },
                    { id: 2, image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=600&auto=format&fit=crop", alt: "Jackets Offer" }
                ],
                subCategories: [
                    {
                        name: "T-Shirts",
                        image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=150&auto=format&fit=crop",
                        bannerImage: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=600&auto=format&fit=crop",
                        bannerAlt: "T-Shirts Collection",
                        banners: [
                            { id: 1, image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=1000&auto=format&fit=crop", alt: "Graphic Tees" }
                        ]
                    },
                    { name: "Shirts", image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=150&auto=format&fit=crop" },
                    { name: "Jackets", image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=150&auto=format&fit=crop" }
                ]
            },
            {
                name: "Bottoms",
                image: "https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?q=80&w=150&auto=format&fit=crop",
                bannerImage: "https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?q=80&w=600&auto=format&fit=crop",
                bannerAlt: "Bottoms Sale",
                banners: [
                    { id: 1, image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=1000&auto=format&fit=crop", alt: "Jeans Fest" }
                ],
                subCategories: [
                    { name: "Jeans", image: "https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?q=80&w=150&auto=format&fit=crop" },
                    { name: "Trousers", image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=150&auto=format&fit=crop" },
                    { name: "Shorts", image: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?q=80&w=150&auto=format&fit=crop" }
                ]
            },
            { name: "Footwear", image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=150&auto=format&fit=crop" },
            { name: "Ethnic", image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=150&auto=format&fit=crop" },
            { name: "Watches", image: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?q=80&w=150&auto=format&fit=crop" },
            { name: "Bags", image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=150&auto=format&fit=crop" },
        ]
    },
    {
        id: 3,
        name: "Mobiles",
        icon: "smartphone",
        bannerImage: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=600&auto=format&fit=crop",
        bannerAlt: "Mobile Deals",
        secondaryBannerImage: "https://images.unsplash.com/photo-1596742578443-7682e525c489?q=80&w=600&auto=format&fit=crop",
        subCategories: [
            {
                name: "5G Phones",
                image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=150&auto=format&fit=crop",
                bannerImage: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=600&auto=format&fit=crop",
                bannerAlt: "5G Revolution",
                banners: [
                    { id: 1, image: "https://images.unsplash.com/photo-1605236453806-6ff36851218e?q=80&w=1000&auto=format&fit=crop", alt: "Latest 5G Mobiles" }
                ]
            },
            { name: "Realme", image: "https://images.unsplash.com/photo-1605236453806-6ff36851218e?q=80&w=150&auto=format&fit=crop" },
            { name: "iPhone", image: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?q=80&w=150&auto=format&fit=crop" },
            { name: "Samsung", image: "https://images.unsplash.com/photo-1610945415295-d9baf130d50a?q=80&w=150&auto=format&fit=crop" },
            { name: "Vivo", image: "https://images.unsplash.com/photo-1580910051074-3eb6948865c5?q=80&w=150&auto=format&fit=crop" },
            { name: "Xiaomi", image: "https://images.unsplash.com/photo-1512054502232-10a0a035d672?q=80&w=150&auto=format&fit=crop" },
        ]
    },
    {
        id: 4,
        name: "Beauty",
        icon: "face",
        bannerImage: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?q=80&w=600&auto=format&fit=crop",
        bannerAlt: "Beauty Sale",
        secondaryBannerImage: "https://images.unsplash.com/photo-1522335789203-abd1aaccd158?q=80&w=600&auto=format&fit=crop",
        subCategories: [
            { name: "Makeup", image: "https://images.unsplash.com/photo-1522335789203-abd1aaccd158?q=80&w=150&auto=format&fit=crop" },
            { name: "Skin", image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=150&auto=format&fit=crop" },
            { name: "Hair", image: "https://images.unsplash.com/photo-1522337660859-02fbefca4702?q=80&w=150&auto=format&fit=crop" },
            { name: "Fragrance", image: "https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=150&auto=format&fit=crop" },
            { name: "Baby", image: "https://images.unsplash.com/photo-1519689680058-324335c77eba?q=80&w=150&auto=format&fit=crop" },
            { name: "Men", image: "https://images.unsplash.com/photo-1621607512214-68297480165e?q=80&w=150&auto=format&fit=crop" },
        ]
    },
    {
        id: 5,
        name: "Electronics",
        icon: "laptop",
        bannerImage: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=600&auto=format&fit=crop",
        bannerAlt: "Tech Sale",
        deals: [
            { name: "OnePlus BW Z3", offer: "Just ₹1,299", image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=300&auto=format&fit=crop" },
            { name: "Moto Pad 60 Pro", offer: "From ₹22,499*", image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?q=80&w=300&auto=format&fit=crop" },
            { name: "Apple Watch S11", offer: "From ₹37,999", image: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?q=80&w=300&auto=format&fit=crop" },
            { name: "Bajaj Pulsar 125", offer: "From ₹68,999*", image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=300&auto=format&fit=crop" },
            { name: "Havells styling", offer: "From ₹599", image: "https://images.unsplash.com/photo-1621607512214-68297480165e?q=80&w=300&auto=format&fit=crop" },
            { name: "Canon Pixma", offer: "From ₹3,199*", image: "https://cdn-icons-png.flaticon.com/512/3616/3616899.png" },
            { name: "HP mouse", offer: "From ₹229", image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?q=80&w=300&auto=format&fit=crop" },
            { name: "MagSafe covers", offer: "From ₹129", image: "https://cdn-icons-png.flaticon.com/512/15525/15525049.png" },
            { name: "Dell Ryzen 5", offer: "Just ₹38,999*", image: "https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?q=80&w=300&auto=format&fit=crop" },
        ],
        scrollDeals: [
            { name: "HP pendrives", offer: "From ₹599*", image: "https://cdn-icons-png.flaticon.com/512/2888/2888716.png" },
            { name: "Huawei Watch GT 6", offer: "From ₹17,999", image: "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?q=80&w=300&auto=format&fit=crop" },
            { name: "Hair Styling", offer: "From ₹499", image: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?q=80&w=300&auto=format&fit=crop" },
            { name: "Gaming Mouse", offer: "From ₹899", image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?q=80&w=300&auto=format&fit=crop" },
            { name: "Keyboards", offer: "From ₹1299", image: "https://images.unsplash.com/photo-1587829741301-308231c8e052?q=80&w=300&auto=format&fit=crop" },
        ],
        banners: [
            { id: 1, image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=1000&auto=format&fit=crop", alt: "Republic Day Sale" },
            { id: 2, image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=600&auto=format&fit=crop", alt: "Tech Sale" },
            { id: 3, image: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?q=80&w=600&auto=format&fit=crop", alt: "Special Offer" }
        ],
        subCategories: [
            {
                name: "Mobiles",
                image: "https://images.unsplash.com/photo-1596558450255-7c0b7be9d56a?q=80&w=150",
                subCategories: [
                    { name: "Samsung", image: "https://cdn-icons-png.flaticon.com/512/5969/5969116.png" },
                    { name: "Apple", image: "https://cdn-icons-png.flaticon.com/512/731/731985.png" },
                    { name: "Realme", image: "https://cdn-icons-png.flaticon.com/512/882/882731.png" },
                    { name: "Vivo", image: "https://cdn-icons-png.flaticon.com/512/882/882704.png" },
                    { name: "Oppo", image: "https://cdn-icons-png.flaticon.com/512/882/882746.png" },
                ]
            },
            { name: "New launches", image: "https://cdn-icons-png.flaticon.com/512/1067/1067357.png" },
            { name: "Audio", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=150&auto=format&fit=crop" },
            { name: "Wearables", image: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?q=80&w=150&auto=format&fit=crop" },
            { name: "Grooming", image: "https://images.unsplash.com/photo-1621607512214-68297480165e?q=80&w=150&auto=format&fit=crop" },
            { name: "2 Wheelers", image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=150&auto=format&fit=crop" },
            { name: "Cameras", image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=150&auto=format&fit=crop" },
            { name: "Laptops", image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=150&auto=format&fit=crop" },
            { name: "Tablet", image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?q=80&w=150&auto=format&fit=crop" },
            { name: "ITPeripherals", image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=150&auto=format&fit=crop" },
            { name: "PC accessories", image: "https://images.unsplash.com/photo-1587829741301-308231c8e052?q=80&w=150&auto=format&fit=crop" },
            { name: "Mobile cases", image: "https://images.unsplash.com/photo-1601593346740-9256127726df?q=80&w=150&auto=format&fit=crop" },
            { name: "Chargers", image: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?q=80&w=150&auto=format&fit=crop" },
            { name: "Power Banks", image: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?q=80&w=150&auto=format&fit=crop" },
            { name: "Storage", image: "https://images.unsplash.com/photo-1597852074816-d933c7d2b988?q=80&w=150&auto=format&fit=crop" },
            { name: "Printers", image: "https://images.unsplash.com/photo-1612815154858-60aa4c4603e1?q=80&w=150&auto=format&fit=crop" },
            { name: "Monitors", image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=150&auto=format&fit=crop" },
            { name: "Routers", image: "https://images.unsplash.com/photo-1544197150-b99a580bbcbf?q=80&w=150&auto=format&fit=crop" },
            { name: "Projectors", image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=150&auto=format&fit=crop" },
            { name: "Smart Lighting", image: "https://images.unsplash.com/photo-1550989460-0adf9ea622e2?q=80&w=150&auto=format&fit=crop" },
            { name: "Calculators", image: "https://images.unsplash.com/photo-1587145820266-9917d3665a4f?q=80&w=150&auto=format&fit=crop" },
        ]
    },
    {
        id: 6,
        name: "Home",
        icon: "home",
        bannerImage: "https://images.unsplash.com/photo-1484154218962-a1c002085aa9?q=80&w=600&auto=format&fit=crop",
        bannerAlt: "Home & Kitchen Sale",
        secondaryBannerImage: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?q=80&w=600&auto=format&fit=crop",
        subCategories: [
            { name: "Shop now", image: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?q=80&w=150&auto=format&fit=crop" },
            { name: "Lighting", image: "https://images.unsplash.com/photo-1540932296774-7ddac6055589?q=80&w=150&auto=format&fit=crop" },
            { name: "Wall decor", image: "https://images.unsplash.com/photo-1582201968431-a0c541579d58?q=80&w=150&auto=format&fit=crop" },
            { name: "Blankets", image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b91d?q=80&w=150&auto=format&fit=crop" },
            { name: "Mattresses", image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70d04?q=80&w=150&auto=format&fit=crop" },
            { name: "Cookware", image: "https://images.unsplash.com/photo-1583394838336-acd977736f90?q=80&w=150&auto=format&fit=crop" },
            { name: "Sofas", image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=150&auto=format&fit=crop" },
            { name: "Bedsheets", image: "https://images.unsplash.com/photo-1522771753035-1a5b6562f36c?q=80&w=150&auto=format&fit=crop" },
            { name: "Utilities", image: "https://images.unsplash.com/photo-1584622050111-993a426fbf0a?q=80&w=150&auto=format&fit=crop" },
            { name: "Bathroom", image: "https://images.unsplash.com/photo-1584622050111-993a426fbf0a?q=80&w=150&auto=format&fit=crop" },
        ]
    },
    { id: 7, name: "Grocery", icon: "shopping_basket" },
    {
        id: 8,
        name: "Appliances",
        icon: "kitchen",
        bannerImage: "https://images.unsplash.com/photo-1556910103-1c02745a30bf?q=80&w=600&auto=format&fit=crop",
        bannerAlt: "Appliances Sale",
        subCategories: [
            { name: "TVs", image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?q=80&w=150" },
            { name: "Washing Machines", image: "https://images.unsplash.com/photo-1626806819282-2c1dc01a5e0c?q=80&w=150" },
            { name: "ACs", image: "https://images.unsplash.com/photo-1534033620953-e381d6d3765e?q=80&w=150" }
        ]
    },
    {
        id: 9,
        name: "Toys",
        icon: "sports_esports",
        bannerImage: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?q=80&w=600",
        subCategories: []
    },
    {
        id: 10,
        name: "Flights",
        icon: "flight",
        bannerImage: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=600",
        subCategories: []
    },
];

export const secondaryCategories = [
    { id: 1, name: "Grocery", icon: "shopping_cart", color: "bg-pink-100" },
    { id: 2, name: "For GenZ", icon: "bolt", color: "bg-orange-100" },
    { id: 3, name: "Gift Cards", icon: "redeem", color: "bg-blue-100" },
    { id: 4, name: "Sell Phone", icon: "phonelink_setup", color: "bg-green-100" },
    { id: 5, name: "BLACK", icon: "dark_mode", color: "bg-gray-100" },
    { id: 6, name: "SuperCoin", icon: "stars", color: "bg-yellow-100" },
];

export const products = [
    // Fashion - 6 items
    {
        id: 1,
        name: "Kvinner Casual Regular Fit Tops",
        brand: "Kvinner",
        price: 360,
        originalPrice: 1999,
        discount: "81% off",
        rating: 4.2,
        buyAt: 340,
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
        buyAt: 474,
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

    // Electronics - 4 items
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

    // Mobiles - 4 items
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
        ram: "8 GB",
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
        ram: "6 GB",
        tags: ["Mobiles", "iPhone", "Apple"]
    },

    // Beauty - 4 items (Matching the screenshot types)
    {
        id: 25,
        name: "Mamaearth Rosemary Hair Fall Control Kit",
        price: 515,
        originalPrice: 1031,
        discount: "50% off",
        rating: 4.2,
        ratingCount: "(20,731)",
        image: "https://rukminim1.flixcart.com/image/612/612/xif0q/shampoo/j/x/o/-original-imagm5y2j5j5z5e6.jpeg?q=70",
        category: "Beauty",
        brand: "Mamaearth",
        tags: ["Beauty", "Hair"]
    },
    {
        id: 26,
        name: "The Plant Fix Plix Rosemary Hair Spray",
        price: 179,
        originalPrice: 225,
        discount: "20% off",
        rating: 4.2,
        ratingCount: "(31,665)",
        image: "https://rukminim1.flixcart.com/image/612/612/xif0q/hair-oil/z/w/f/-original-imagg2abzhxqcgny.jpeg?q=70",
        category: "Beauty",
        brand: "The Plant Fix Plix",
        tags: ["Beauty", "Hair"]
    },
    {
        id: 27,
        name: "Mamaearth Onion Hair Oil",
        price: 399,
        originalPrice: 599,
        discount: "33% off",
        rating: 4.4,
        ratingCount: "(15,000)",
        image: "https://rukminim1.flixcart.com/image/612/612/xif0q/hair-oil/2/y/o/s-ku657-mokshi-original-imagm5wzbg7x6l3h.jpeg?q=70",
        category: "Beauty",
        brand: "Mamaearth",
        tags: ["Beauty", "Hair"]
    },
    {
        id: 28,
        name: "Lauki Oil for Silky Strong Hair",
        price: 299,
        originalPrice: 499,
        discount: "40% off",
        rating: 4.1,
        ratingCount: "(457)",
        image: "https://rukminim1.flixcart.com/image/612/612/xif0q/hair-oil/m/n/o/-original-imagm5y2j5j5z5e6.jpeg?q=70",
        category: "Beauty",
        brand: "Kajal Mantra",
        tags: ["Beauty", "Hair"]
    },
    {
        id: 29,
        name: "Plix Rosemary Anti Hairfall Treatment",
        price: 450,
        originalPrice: 800,
        discount: "40% off",
        rating: 4.5,
        ratingCount: "(457)",
        image: "https://rukminim1.flixcart.com/image/612/612/xif0q/hair-mask/m/n/o/-original-imagm5y2j5j5z5e6.jpeg?q=70",
        category: "Beauty",
        brand: "Plix",
        tags: ["Beauty", "Hair"]
    },

    // Home - 4 items
    {
        id: 30,
        name: "Prestige Induction Base Cookware Set",
        price: 1599,
        originalPrice: 3500,
        discount: "54% off",
        rating: 4.2,
        image: "https://rukminim1.flixcart.com/image/612/612/kfa0b0w0/pot/v/z/v/aluminium-non-stick-cookware-set-3-piece-induction-bottom-ck-original-imafvrg8wd5gzb9d.jpeg?q=70",
        category: "Home",
        tags: ["Home", "Cookware"]
    },
    {
        id: 31,
        name: "Double Bed Mink Blanket",
        price: 499,
        originalPrice: 1999,
        discount: "75% off",
        rating: 4.0,
        image: "https://rukminim1.flixcart.com/image/612/612/xif0q/blanket/b/r/n/double-bed-mink-blanket-for-winter-soft-warm-thick-heavy-weight-original-imagm5y2j5j5z5e6.jpeg?q=70",
        category: "Home",
        tags: ["Home", "Blankets"]
    },

    // Grocery items (Existing)
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
        id: 10,
        name: "Farmley Prasadam Makhana",
        price: 378,
        originalPrice: 595,
        rating: 4.3,
        image: "https://images.unsplash.com/photo-1621607512214-68297480165e?q=80&w=300",
        category: "Grocery"
    },
    {
        id: 11,
        name: "INDIA GATE 1 Cup Mogra Rice",
        price: 302,
        originalPrice: 378,
        rating: 4.1,
        image: "https://images.unsplash.com/photo-1516684732162-798a0062be99?q=80&w=300&auto=format&fit=crop",
        category: "Grocery"
    },

    // Existing Health items ...
    {
        id: 402,
        name: "Aashirvaad Atta 5kg",
        price: 245,
        originalPrice: 299,
        discount: "18% off",
        rating: 4.6,
        image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=300",
        category: "Grocery"
    },
    {
        id: 403,
        name: "Tetley Green Tea 100 bags",
        price: 450,
        originalPrice: 550,
        discount: "18% off",
        rating: 4.4,
        image: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?q=80&w=300",
        category: "Grocery"
    },
    {
        id: 13,
        name: "PARLE Platina Nutricrunch Diges",
        price: 126,
        originalPrice: 285,
        rating: 4.3,
        image: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?q=80&w=300&auto=format&fit=crop",
    },
    {
        id: 14,
        brand: "AIMIL",
        name: "Amynity Plus Syrup | Natural Immunity Booster | (200 ml)",
        price: 277,
        originalPrice: 351,
        discount: "21% off",
        buyAt: 249, // WOW Deal price
        rating: 2.5,
        ratingCount: 4,
        expiry: "17 Dec 2027",
        quantity: "200 ml",
        image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=300&auto=format&fit=crop",
        category: "Health"
    },
    {
        id: 15,
        brand: "AIMIL",
        name: "Asthigon Syrup - Lungs Health | (200 ml)",
        price: 218,
        originalPrice: 280,
        buyAt: 196,
        rating: 4.2,
        ratingCount: 128,
        expiry: "12 Oct 2026",
        quantity: "200 ml",
        image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=300",
        category: "Health"
    },
    {
        id: 16,
        brand: "AIMIL",
        name: "Giloe (Giloy) Immunity Capsules | 60 Caps",
        price: 146,
        originalPrice: 187,
        buyAt: 131,
        rating: 4.4,
        ratingCount: 856,
        expiry: "05 Jan 2028",
        quantity: "60 Caps",
        image: "https://images.unsplash.com/photo-1585435557343-3b092031a831?q=80&w=300",
        category: "Health"
    },
    {
        id: 17,
        brand: "ACTIWOW",
        name: "Revital H Men Multivitamin | 30 Caps",
        price: 245,
        originalPrice: 350,
        buyAt: 220,
        rating: 4.3,
        ratingCount: 1542,
        expiry: "20 Nov 2026",
        quantity: "30 Caps",
        image: "https://images.unsplash.com/photo-1584017947486-599293996252?q=80&w=300",
        category: "Health"
    },
    {
        id: 18,
        brand: "AIMIL",
        name: "Memtone Syrup - Mental Wellness | (200 ml)",
        price: 192,
        originalPrice: 244,
        buyAt: 172,
        rating: 4.2,
        ratingCount: 215,
        expiry: "15 Aug 2027",
        quantity: "200 ml",
        image: "https://images.unsplash.com/photo-1624454002302-36b824d7bd0a?q=80&w=300&auto=format&fit=crop",
        category: "Health"
    },
    {
        id: 19,
        brand: "Baidyanath",
        name: "Wild Premium Amla Juice | (1 L)",
        price: 188,
        originalPrice: 239,
        buyAt: 179,
        rating: 4.3,
        ratingCount: 1543,
        expiry: "01 Mar 2026",
        quantity: "1 L",
        image: "https://images.unsplash.com/photo-1576086213369-97a306d36557?q=80&w=300&auto=format&fit=crop",
        category: "Health"
    },
    // New Mobile Products for nesting demo
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
        ram: "12 GB",
        tags: ["Mobiles", "Samsung", "Electronics"] // Tags for filtering
    },
    {
        id: 202,
        name: "Samsung Galaxy A55 5G",
        brand: "Samsung",
        price: 39999,
        originalPrice: 45000,
        discount: "11% off",
        rating: 4.3,
        image: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?q=80&w=300",
        category: "Electronics",
        ram: "8 GB",
        tags: ["Mobiles", "Samsung", "Electronics"]
    },
    {
        id: 203,
        name: "Samsung Galaxy M14",
        brand: "Samsung",
        price: 9999,
        originalPrice: 14999,
        discount: "33% off",
        rating: 4.1,
        image: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?q=80&w=300",
        category: "Electronics",
        ram: "6 GB",
        tags: ["Mobiles", "Samsung", "Electronics"]
    },
    {
        id: 204,
        name: "Apple iPhone 15",
        brand: "Apple",
        price: 69999,
        originalPrice: 79999,
        discount: "12% off",
        rating: 4.6,
        image: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?q=80&w=300",
        category: "Electronics",
        ram: "6 GB",
        tags: ["Mobiles", "Apple", "Electronics", "iPhone"]
    }
];

export const videos = [
    {
        id: 1,
        user: "Nikki chauhan",
        type: "Sponsored",
        views: "2.3L",
        title: "LOOKING FOR SOME GIFT IDEAS FOR YOUR MAN?",
        likes: "360",
        comments: "12",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDQccKpbs5j7JThIXBWIUIEAb1P9OQRxv5tspc2jIgDR9rNuwp7w8vJMnJrxgeMclIw648gCX5JktKnLmJ95LA-5rQfFYJ7qv5zaXGJQcQTS2SEyid94otZE7p2ugSXNsuOCvN7RInLmdMWCyl3piqM1C2GFlN0NLXj6qCEvFFAckgJHtA4K6xKTdA2WfQLFiglNuvLNwQuuygab64qIYQ_b0faQpEQsWbWquUFyLbFmaVUO818Id1KsAnpIjOL9LPQj_3GhGpWZPyC",
        avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuBNJXnGE_ZmJO3awIF8rz7ijd8PYy2M9eath8VuPWZH_wDlwEiuGibeeINye3RRZR-8xZnLuRgQCpcJAi5fUi5fyf_MrQgKndSOKtlpTfbugS4u5yNpiazYwfa5bXtN1yGoulIeOmzla59ekdapfPAeCs210Vjv0JUoE8ychZ5IjbSF63xJxMTNG5kMcnBryqpOtbsS1Iuim7yoRwC0M7qHvJtfV438AxprHExyKhKtGR9QYcmkbZO8Mu49xZ0lF5RLVbRl05SNFeGz"
    },
    {
        id: 2,
        user: "Abhishek sawant",
        type: "Verified",
        views: "14.1L",
        title: "Nike Air Max Premium Edition Special Offer",
        likes: "1.2K",
        comments: "45",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDnDrFEzMuLm6U-vzwFcTxHIGfwrW9jsktHOa97spZeQPgMf-KIJaF23I9vFexrOWUNa-II8Ihj0lt-Wmo8JU1P31dSLmU02-OAi1GozDbV-eYJqZ4q5GVC4KtiED5sg3WO8bYkQvndeI1kafJRkjgcJigFUJsgHuaroe3X_69OkvXdCsUCJwfgtUlnZqvOLoL2o-GblkKlH6NRA3JsoJqjPbivYzbCwKUlLGgJSK5cBcwF4actK0Q8P_GP3SmWG8YzCU-CaNQ3V3Km"
    },
];

export const fashionValueDeals = [
    {
        id: 'fvd1',
        name: 'True Wireless',
        discount: 'Min. 50% Off',
        image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=300&auto=format&fit=crop'
    },
    {
        id: 'fvd2',
        name: "Men's Slippers & Flip Flops",
        discount: 'Min. 70% Off',
        image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=300&auto=format&fit=crop',
        category: 'Fashion',
        subcategory: 'Footwear'
    },
    {
        id: 'fvd3',
        name: "Men's Casual Shoes",
        discount: 'Min. 70% Off',
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=300&auto=format&fit=crop',
        category: 'Fashion',
        subcategory: 'Footwear'
    },
    {
        id: 'fvd4',
        name: 'Wrist Watches',
        discount: 'Min. 90% Off',
        image: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?q=80&w=300&auto=format&fit=crop',
        category: 'Fashion',
        subcategory: 'Watches'
    },
    {
        id: 'fvd5',
        name: 'Backpacks',
        discount: 'Min. 60% Off',
        image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=300',
        category: 'Fashion',
        subcategory: 'Bags'
    },
    {
        id: 'fvd6',
        name: 'Sunglasses',
        discount: 'Flat 50% Off',
        image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?q=80&w=300&auto=format&fit=crop',
        category: 'Fashion',
        subcategory: 'Accessories'
    },
    {
        id: 'fvd7',
        name: 'Kurta Sets',
        discount: 'Under ₹499',
        image: 'https://images.unsplash.com/photo-1583391733958-e0295c29026.jpg?q=80&w=300',
        category: 'Fashion',
        subcategory: 'Ethnic'
    },
    {
        id: 'fvd8',
        name: 'Sports Shoes',
        discount: 'Min. 40% Off',
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=300',
        category: 'Fashion',
        subcategory: 'Footwear'
    },
    {
        id: 'fvd9',
        name: 'Handbags',
        discount: 'Flat 60% Off',
        image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=300',
        category: 'Fashion',
        subcategory: 'Bags'
    }
];

export const interestingFinds = [
    {
        title: 'Best Picks',
        tag: 'Under ₹399',
        image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=300&auto=format&fit=crop', // Saree
        category: 'Fashion',
        subcategory: 'Ethnic'
    },
    {
        title: 'Top Collection',
        tag: 'Special offer',
        image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=300&auto=format&fit=crop', // Underwear
        category: 'Fashion',
        subcategory: 'Innerwear'
    },
    {
        title: 'Wedding Special',
        tag: 'Grab Now',
        image: 'https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?q=80&w=300&auto=format&fit=crop',
        category: 'Fashion',
        subcategory: 'Ethnic'
    },
    {
        title: 'Designer Wear',
        tag: 'New Arrivals',
        image: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?q=80&w=300&auto=format&fit=crop',
        category: 'Fashion',
        subcategory: 'Dresses'
    },
    {
        title: 'Party Essentials',
        tag: 'Min 50% Off',
        image: 'https://images.unsplash.com/photo-1627483262268-9c96d8e360c7?q=80&w=300&auto=format&fit=crop',
        category: 'Electronics',
        subcategory: 'Audio'
    },
    {
        title: 'Gym Gear',
        tag: 'Start at ₹299',
        image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=300&auto=format&fit=crop',
        category: 'Sports',
        subcategory: 'Tops'
    },
    {
        title: 'Top Collection',
        tag: 'Min. 60% Off',
        image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=300&auto=format&fit=crop', // Mop
        category: 'Home',
        subcategory: 'Cleaning'
    },
    {
        title: 'New Range',
        tag: 'Special offer',
        image: 'https://images.unsplash.com/photo-1511067007398-7e4b90cfa4bc?q=80&w=300&auto=format&fit=crop', // Jar of nuts
        category: 'Grocery',
        subcategory: 'Snacks'
    },
    {
        title: 'Tech Gadgets',
        tag: 'From ₹199',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=300',
        category: 'Electronics',
        subcategory: 'Accessories'
    },
    {
        title: 'Home Decor',
        tag: 'Min. 40% Off',
        image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=300',
        category: 'Home',
        subcategory: 'Decor'
    }
];

export const saleBanner = {
    image: 'https://images.unsplash.com/photo-1532375810709-75b1da00537c?q=80&w=1200&auto=format&fit=crop', // Better Republic Day vibe
    alt: 'REPUBLIC DAY SALE IS LIVE!'
};

export const resolveCategoryPath = (baseCategoryName, subPathStr) => {
    // 1. Find Base Category
    let current = categories.find(c => c.name.toLowerCase() === baseCategoryName?.toLowerCase());
    if (!current) return null;

    const breadcrumbs = [current];

    // 2. Traverse Sub Path if exists
    if (subPathStr) {
        const segments = subPathStr.split('/').filter(Boolean); // "Mobiles", "Samsung"
        for (const segment of segments) {
            if (current.subCategories) {
                const decodedSegment = decodeURIComponent(segment);
                const found = current.subCategories.find(s => s.name.toLowerCase() === decodedSegment.toLowerCase());
                if (found) {
                    current = found;
                    breadcrumbs.push(current);
                }
            }
        }
    }

    // 3. Filter Products
    const filteredProducts = products.filter(p => {
        // Match Base Category (fallback to category string if tags not present, or if base category matches)
        if (p.category === breadcrumbs[0].name) {
            // If we are deeper than base
            if (breadcrumbs.length > 1) {
                const currentName = current.name.toLowerCase();

                // Check tags if available (Preferred)
                if (p.tags) {
                    return p.tags.some(tag => tag.toLowerCase() === currentName);
                }

                return p.name.toLowerCase().includes(currentName);
            }
            return true;
        }

        // Also check tags for base category match if p.category doesn't match directly (e.g. multi-category items)
        if (p.tags && p.tags.includes(breadcrumbs[0].name)) {
            if (breadcrumbs.length > 1) {
                const currentName = current.name.toLowerCase();
                return p.tags.some(tag => tag.toLowerCase() === currentName);
            }
            return true;
        }

        return false;
    });

    return {
        data: current,
        breadcrumbs,
        products: filteredProducts,
        isLeaf: !current.subCategories || current.subCategories.length === 0
    };
};
