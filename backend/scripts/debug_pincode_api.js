import axios from 'axios';

const API_URL = 'http://localhost:5000/api/pincodes'; // Adjust port if needed, assuming default 5000 or from .env

// We can't easily test protected routes without a token, 
// so we'll test the public check endpoint first to see if server is up.
// For protected routes, we'd need to login first.

const testAPI = async () => {
    try {
        console.log('Testing Pincode API Health...');
        
        // 1. Check a random pincode (Public endpoint)
        console.log('1. Testing public check endpoint...');
        try {
            const checkRes = await axios.get(`${API_URL}/check/110001`); // Use a common pincode
            console.log('   Check endpoint response:', checkRes.status, checkRes.data);
        } catch (err) {
            console.log('   Check endpoint result:', err.response ? err.response.status : err.message);
            // It might be 404 or success depending on data, but if it connects, server is up.
        }

        // 2. Try to fetch pincodes (Protected - expects 401)
        console.log('2. Testing protected list endpoint (should fail with 401 if unauthorized)...');
        try {
            await axios.get(API_URL);
            console.log('   List endpoint unexpected success (auth might be disabled?)');
        } catch (err) {
            if (err.response && err.response.status === 401) {
                console.log('   List endpoint correctly returned 401 Unauthorized - Server is protected and listening.');
            } else {
                console.error('   List endpoint error:', err.message);
            }
        }

    } catch (error) {
        console.error('API Test Failed:', error.message);
    }
};

testAPI();
