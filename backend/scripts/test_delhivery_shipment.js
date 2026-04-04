import axios from 'axios';

const parseArgs = () => {
    const args = process.argv.slice(2);
    const options = {};

    for (let index = 0; index < args.length; index += 1) {
        const arg = args[index];
        if (!arg.startsWith('--')) continue;
        const key = arg.slice(2);
        const nextValue = args[index + 1];
        if (!nextValue || nextValue.startsWith('--')) {
            options[key] = true;
            continue;
        }
        options[key] = nextValue;
        index += 1;
    }

    return options;
};

const sanitize = (value = '') => String(value || '').trim();

const options = parseArgs();
const token = sanitize(options.token || process.env.DELHIVERY_TOKEN);
const baseUrl = sanitize(options.baseUrl || process.env.DELHIVERY_BASE_URL || 'https://track.delhivery.com').replace(/\/$/, '');
const client = sanitize(options.client || process.env.DELHIVERY_CLIENT);
const pickupLocation = sanitize(options.pickup || process.env.DELHIVERY_PICKUP);
const orderId = sanitize(options.order || `TEST-${Date.now()}`);

if (!token) {
    console.error('Missing token. Pass --token or set DELHIVERY_TOKEN.');
    process.exit(1);
}

if (!client) {
    console.error('Missing client. Pass --client or set DELHIVERY_CLIENT.');
    process.exit(1);
}

if (!pickupLocation) {
    console.error('Missing pickup location. Pass --pickup or set DELHIVERY_PICKUP.');
    process.exit(1);
}

const payload = {
    shipments: [
        {
            name: sanitize(options.name || 'Test Customer'),
            add: sanitize(options.address || 'Test Address'),
            pin: sanitize(options.pin || '110001'),
            city: sanitize(options.city || 'Delhi'),
            state: sanitize(options.state || 'Delhi'),
            country: sanitize(options.country || 'India'),
            phone: sanitize(options.phone || '9999999999'),
            order: orderId,
            payment_mode: sanitize(options.paymentMode || 'Prepaid'),
            products_desc: sanitize(options.product || 'Test Product'),
            order_date: sanitize(options.orderDate || new Date().toISOString().slice(0, 10)),
            total_amount: Number(options.amount || 999),
            cod_amount: sanitize(options.paymentMode || 'Prepaid').toUpperCase() === 'COD' ? Number(options.amount || 999) : 0,
            seller_add: sanitize(options.sellerAddress || 'Test Seller Address'),
            seller_name: sanitize(options.sellerName || 'Test Seller'),
            seller_inv: orderId,
            quantity: Number(options.quantity || 1),
            shipment_width: Number(options.width || 10),
            shipment_height: Number(options.height || 10),
            shipment_length: Number(options.length || 10),
            weight: Number(options.weight || 1),
            seller_gst_tin: sanitize(options.gst || '21ABACA2389L1ZP'),
            hsn_code: sanitize(options.hsn || '0000')
        }
    ],
    pickup_location: {
        name: pickupLocation
    },
    client
};

const encodedBody = `format=json&data=${encodeURIComponent(JSON.stringify(payload))}`;

try {
    const response = await axios.post(`${baseUrl}/api/cmu/create.json`, encodedBody, {
        headers: {
            Authorization: `Token ${token}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 30000
    });

    console.log(JSON.stringify({
        ok: true,
        status: response.status,
        requestPayload: payload,
        responseData: response.data
    }, null, 2));
} catch (error) {
    console.log(JSON.stringify({
        ok: false,
        status: error.response?.status || null,
        requestPayload: payload,
        responseData: error.response?.data || null,
        message: error.message
    }, null, 2));
    process.exit(1);
}
