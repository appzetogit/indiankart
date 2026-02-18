import Razorpay from 'razorpay';
import crypto from 'crypto';
import Order from '../models/Order.js';

// @desc    Create Razorpay order
// @route   POST /api/payments/order
// @access  Private
export const createRazorpayOrder = async (req, res) => {
    const { amount } = req.body;
    console.log(`Processing Razorpay order request - Amount: ₹${amount}`);
    
    // Debug Logging
    console.log('Razorpay Config Check:', {
        keyIdPresent: !!process.env.RAZORPAY_KEY_ID,
        keySecretPresent: !!process.env.RAZORPAY_KEY_SECRET
    });

    try {
        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            throw new Error("Razorpay credentials missing in backend environment");
        }

        const instance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID.trim(),
            key_secret: process.env.RAZORPAY_KEY_SECRET.trim(),
        });

        const options = {
            amount: Math.round(amount * 100), // Ensure integer paise
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
        };

        const order = await instance.orders.create(options);

        if (!order) {
            return res.status(500).send("Some error occured");
        }

        res.json(order);
    } catch (error) {
        console.error('Razorpay Order Creation Error:', error);
        res.status(500).json({ message: error.message, details: error.error });
    }
};

// @desc    Verify Razorpay payment
// @route   POST /api/payments/verify
// @access  Private
export const verifyPayment = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");

        const isAuthentic = expectedSignature === razorpay_signature;

        if (isAuthentic) {
            // Success - Fetch full payment details from Razorpay to get card info
            const instance = new Razorpay({
                key_id: process.env.RAZORPAY_KEY_ID,
                key_secret: process.env.RAZORPAY_KEY_SECRET,
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

            res.json({
                message: "Payment verified successfully",
                paymentId: razorpay_payment_id,
                cardInfo
            });
        } else {
            res.status(400).json({ message: "Invalid signature" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Test Razorpay credentials
// @route   GET /api/payments/test-credentials
// @access  Private/Admin
export const testRazorpayCredentials = async (req, res) => {
    try {
        const instance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });

        // Try to fetch a small test order to verify credentials
        const options = {
            amount: 100, // ₹1 in paise
            currency: "INR",
            receipt: `test_receipt_${Date.now()}`,
        };

        const order = await instance.orders.create(options);

        if (order) {
            res.json({ 
                success: true, 
                message: "Razorpay credentials are valid!",
                testOrderId: order.id,
                keyId: process.env.RAZORPAY_KEY_ID
            });
        }
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: "Razorpay credentials are invalid or there's an API issue",
            error: error.message,
            keyId: process.env.RAZORPAY_KEY_ID,
            hint: "Please check your RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env file"
        });
    }
};
