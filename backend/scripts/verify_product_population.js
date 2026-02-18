import axios from 'axios';

const run = async () => {
    try {
        const response = await axios.get('http://localhost:5000/api/products');
        const products = response.data;

        if (products.length > 0) {
            console.log('Total Products:', products.length);
            const productsWithSub = products.filter(p => p.subCategory && typeof p.subCategory === 'object');
            console.log('Products with populated subCategory:', productsWithSub.length);
            
            if (productsWithSub.length > 0) {
                console.log('Sample Product SubCategory:', JSON.stringify(productsWithSub[0].subCategory, null, 2));
            } else {
                console.log('No products have a populated subCategory yet. (Make sure you assigned one)');
            }
        } else {
            console.log('No products found.');
        }
    } catch (error) {
        console.error('Error fetching products:', error.message);
    }
};

run();
