import axios from 'axios';
import FormData from 'form-data';

const run = async () => {
    try {
        // 1. Login
        console.log('Logging in...');
        const loginRes = await axios.post('http://localhost:5000/api/admin/login', {
            email: 'admin@flipkart.com', 
            password: 'admin123' 
        });
        
        const cookie = loginRes.headers['set-cookie'];
        console.log('Login Success.');

        // 2 Create a product first to ensure ID exists
        const createForm = new FormData();
        createForm.append('name', 'Test Product Init');
        createForm.append('price', '50');
        createForm.append('category', 'Test');
        createForm.append('categoryPath', '[]');
        
        const createRes = await axios.post('http://localhost:5000/api/products', createForm, {
            headers: { ...createForm.getHeaders(), Cookie: cookie }
        });
        const productId = createRes.data.id;
        console.log('Created Product ID:', productId);

        // 3. Update Product
        console.log('Updating Product...');
        const form = new FormData();
        form.append('name', 'Test Product Update');
        form.append('price', '100');
        form.append('stock', '10'); // Add stock
        form.append('categoryId', '123'); 
        form.append('subCategory', '679a957593c788556c802422'); 
        form.append('categoryPath', JSON.stringify(['123', '679a957593c788556c802422']));
        
        const response = await axios.put(`http://localhost:5000/api/products/${productId}`, form, {
            headers: {
                ...form.getHeaders(),
                Cookie: cookie
            }
        });
        
        console.log('Update Success:', response.data);

    } catch (error) {
        if (error.response) {
             console.error('Update Failed Status:', error.response.status);
             console.error('Update Failed Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error:', error.message);
        }
    }
};

run();
