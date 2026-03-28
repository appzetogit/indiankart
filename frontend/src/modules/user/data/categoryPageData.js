const categoryPageData = {
    electronics: {
        heroSlides: [
            {
                image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1600&q=80',
                redirectLink: '/category/Electronics/Laptops'
            },
            {
                image: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=1600&q=80',
                redirectLink: '/category/Electronics/Wearables'
            },
            {
                image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1600&q=80',
                redirectLink: '/category/Electronics/Mobile%20Covers'
            }
        ],
        scrollSection: {
            title: 'Exclusively for you',
            images: [
                {
                    image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=80',
                    redirectLink: '/category/Electronics/Wearables'
                },
                {
                    image: 'https://images.unsplash.com/photo-1522338140262-f46f5913618a?auto=format&fit=crop&w=800&q=80',
                    redirectLink: '/category/Electronics/Grooming'
                },
                {
                    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
                    redirectLink: '/category/Electronics/Accessories'
                },
                {
                    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80',
                    redirectLink: '/category/Electronics/Headsets'
                }
            ]
        },
        quickLinks: [
            {
                id: 'headsets',
                name: 'Headsets',
                image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=500&q=80',
                targetName: 'Headsets'
            },
            {
                id: 'wearables',
                name: 'Wearables',
                image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=500&q=80',
                targetName: 'Wearables'
            },
            {
                id: 'powerbanks',
                name: 'Power Banks',
                image: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=500&q=80',
                targetName: 'Power Banks'
            },
            {
                id: 'laptops',
                name: 'Laptops',
                image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=500&q=80',
                targetName: 'Laptops'
            },
            {
                id: 'mobilecovers',
                name: 'Mobile Covers',
                image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=500&q=80',
                targetName: 'Mobile Covers'
            },
            {
                id: 'gaminglaptop',
                name: 'Gaming Laptop',
                image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=500&q=80',
                targetName: 'Gaming Laptop'
            },
            {
                id: 'grooming',
                name: 'Grooming',
                image: 'https://images.unsplash.com/photo-1522338140262-f46f5913618a?auto=format&fit=crop&w=500&q=80',
                targetName: 'Grooming'
            },
            {
                id: 'accessories',
                name: 'Accessories',
                image: 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?auto=format&fit=crop&w=500&q=80',
                targetName: 'Accessories'
            }
        ]
    }
};

export const getCategoryPageData = (categoryName) => {
    const key = String(categoryName || '').trim().toLowerCase();
    return categoryPageData[key] || null;
};

export default categoryPageData;
