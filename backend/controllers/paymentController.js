import Razorpay from 'razorpay';
import crypto from 'crypto';
import Setting from '../models/Setting.js';

const getRazorpayCredentials = async () => {
    const settings = await Setting.findOne().select('+razorpayKeySecret razorpayKeyId').lean();
    const keyId = settings?.razorpayKeyId?.trim() || '';
    const keySecret = settings?.razorpayKeySecret?.trim() || '';
    return { keyId, keySecret };
};

// @desc    Create Razorpay order
// @route   POST /api/payments/order
// @access  Private
export const createRazorpayOrder = async (req, res) => {
    const { amount, offer_id } = req.body;
    console.log(`Processing Razorpay order request - Amount: Rs ${amount}, Offer ID: ${offer_id || 'none'}`);

    try {
        const { keyId, keySecret } = await getRazorpayCredentials();

        console.log('Razorpay Config Check:', {
            keyIdPresent: !!keyId,
            keySecretPresent: !!keySecret,
            source: keyId && keySecret ? 'admin_settings' : 'missing'
        });

        if (!keyId || !keySecret) {
            throw new Error('Razorpay credentials are not configured');
        }

        const instance = new Razorpay({
            key_id: keyId,
            key_secret: keySecret,
        });

        const options = {
            amount: Math.round(amount * 100),
            currency: 'INR',
            receipt: `receipt_${Date.now()}`,
        };

        // If a Razorpay offer_id is provided, attach it to the order
        // Razorpay will validate the offer and auto-apply the discount during checkout
        if (offer_id && typeof offer_id === 'string' && offer_id.startsWith('offer_')) {
            options.offer_id = offer_id;
        }

        const order = await instance.orders.create(options);

        if (!order) {
            return res.status(500).send('Some error occured');
        }

        return res.json(order);
    } catch (error) {
        console.error('Razorpay Order Creation Error:', error);
        return res.status(500).json({ message: error.message, details: error.error });
    }
};

// @desc    Verify Razorpay payment
// @route   POST /api/payments/verify
// @access  Private
export const verifyPayment = async (req, res) => {
    try {
        const { keyId, keySecret } = await getRazorpayCredentials();
        if (!keyId || !keySecret) {
            return res.status(500).json({ message: 'Razorpay credentials are not configured' });
        }

        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;

        const body = `${razorpay_order_id}|${razorpay_payment_id}`;

        const expectedSignature = crypto
            .createHmac('sha256', keySecret)
            .update(body.toString())
            .digest('hex');

        const isAuthentic = expectedSignature === razorpay_signature;

        if (!isAuthentic) {
            return res.status(400).json({ message: 'Invalid signature' });
        }

        const instance = new Razorpay({
            key_id: keyId,
            key_secret: keySecret,
        });

        const payment = await instance.payments.fetch(razorpay_payment_id);

        let cardInfo = null;
        if (payment.method === 'card' && payment.card) {
            cardInfo = {
                network: payment.card.network,
                last4: payment.card.last4,
                type: payment.card.type
            };
        }

        return res.json({
            message: 'Payment verified successfully',
            paymentId: razorpay_payment_id,
            cardInfo
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// @desc    Get Razorpay public config
// @route   GET /api/payments/config
// @access  Private
export const getRazorpayConfig = async (req, res) => {
    try {
        const { keyId } = await getRazorpayCredentials();
        return res.json({ keyId: keyId || '' });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// @desc    Test Razorpay credentials
// @route   GET /api/payments/test-credentials
// @access  Private/Admin
export const testRazorpayCredentials = async (req, res) => {
    try {
        const { keyId, keySecret } = await getRazorpayCredentials();
        if (!keyId || !keySecret) {
            return res.status(500).json({
                success: false,
                message: 'Razorpay credentials are missing',
                keyId: keyId || '',
                hint: 'Save Razorpay Key ID and Key Secret in Admin > Razorpay Credentials'
            });
        }

        const instance = new Razorpay({
            key_id: keyId,
            key_secret: keySecret,
        });

        const options = {
            amount: 100,
            currency: 'INR',
            receipt: `test_receipt_${Date.now()}`,
        };

        const order = await instance.orders.create(options);

        if (!order) {
            return res.status(500).json({
                success: false,
                message: 'Unable to validate Razorpay credentials right now'
            });
        }

        return res.json({
            success: true,
            message: 'Razorpay credentials are valid!',
            testOrderId: order.id,
            keyId
        });
    } catch (error) {
        const { keyId } = await getRazorpayCredentials();
        return res.status(500).json({
            success: false,
            message: "Razorpay credentials are invalid or there's an API issue",
            error: error.message,
            keyId,
            hint: 'Please check your Razorpay keys in Admin > Razorpay Credentials'
        });
    }
};
