import Razorpay from 'razorpay';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('--- Razorpay Connection Debugger ---');
console.log('Current Directory:', __dirname);
console.log('Env File Path:', path.join(__dirname, '.env'));

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

console.log('\n--- Credentials Check ---');
console.log('Key ID Loaded:', !!keyId);
console.log('Key Secret Loaded:', !!keySecret);

if (keyId) {
    console.log('Key ID Length:', keyId.length);
    console.log('Key ID (First 8 chars):', keyId.substring(0, 8) + '...');
    // Check for common issues
    if (keyId.includes(' ')) console.error('WARNING: Key ID contains spaces!');
}

if (keySecret) {
    console.log('Key Secret Length:', keySecret.length);
    // console.log('Key Secret:', keySecret); // Don't print full secret
}

if (!keyId || !keySecret) {
    console.error('ERROR: Missing Credentials. Please check .env file.');
    process.exit(1);
}

// Initialize Razorpay
console.log('\n--- Initializing Razorpay Instance ---');
try {
    const instance = new Razorpay({
        key_id: keyId.trim(),
        key_secret: keySecret.trim(),
    });

    console.log('Instance created. Attempting to fetch a dummy order/payment or list orders...');

    // Try to list orders (lightweight call)
    instance.orders.all({ count: 1 })
        .then(response => {
            console.log('\nSUCCESS! Razorpay connection verified.');
            console.log('API Response (Orders List):', JSON.stringify(response, null, 2));
        })
        .catch(error => {
            console.error('\nFAILED: Razorpay API call failed.');
            console.error('Error Code:', error.statusCode);
            console.error('Error Description:', error.error ? error.error.description : error.message);
            console.error('Full Error:', JSON.stringify(error, null, 2));
        });

} catch (err) {
    console.error('CRITICAL: Failed to initialize Razorpay instance:', err.message);
}
