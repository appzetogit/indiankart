import Razorpay from 'razorpay';
import Setting from '../models/Setting.js';
import Product from '../models/Product.js';

const getRazorpayCredentials = async () => {
    const settings = await Setting.findOne().select('+razorpayKeySecret razorpayKeyId').lean();
    return {
        keyId: settings?.razorpayKeyId?.trim() || '',
        keySecret: settings?.razorpayKeySecret?.trim() || ''
    };
};

export const restoreOrderStock = async (order) => {
    if (!order?.orderItems?.length) return;

    for (const item of order.orderItems) {
        const product = await Product.findOne({ id: item.product });
        if (!product) continue;

        const update = { $inc: { stock: item.qty } };

        if (item.variant && Object.keys(item.variant).length > 0) {
            const skuIndex = product.skus.findIndex((sku) => {
                const combination = sku.combination instanceof Map ? Object.fromEntries(sku.combination) : sku.combination;
                const itemKeys = Object.keys(item.variant);
                const combinationKeys = Object.keys(combination || {});
                if (itemKeys.length !== combinationKeys.length) return false;
                return itemKeys.every((key) => String(item.variant[key]) === String(combination[key]));
            });

            if (skuIndex !== -1) {
                update.$inc[`skus.${skuIndex}.stock`] = item.qty;
            }
        }

        await Product.findOneAndUpdate({ _id: product._id }, update);
    }
};

export const refundCancelledRazorpayOrder = async (order, reason = 'Order cancelled before delivery') => {
    const paymentId = String(order?.transactionId || order?.paymentResult?.id || '').trim();
    const alreadyProcessed = String(order?.refund?.status || '').trim() === 'processed' && String(order?.refund?.refundId || '').trim();

    if (alreadyProcessed) {
        return {
            attempted: false,
            success: true,
            reason: 'already_processed'
        };
    }

    const isOnlinePaid = Boolean(order?.isPaid) && String(order?.paymentMethod || '').trim().toUpperCase() !== 'COD';
    if (!isOnlinePaid) {
        order.refund = {
            status: 'not_required',
            amount: 0,
            reason,
            processedAt: new Date()
        };
        return {
            attempted: false,
            success: true,
            reason: 'not_required'
        };
    }

    if (!paymentId) {
        order.refund = {
            status: 'failed',
            amount: Number(order?.totalPrice || 0),
            reason,
            initiatedAt: new Date(),
            error: 'Missing Razorpay payment id on order'
        };
        return {
            attempted: true,
            success: false,
            error: 'Missing Razorpay payment id on order'
        };
    }

    const { keyId, keySecret } = await getRazorpayCredentials();
    if (!keyId || !keySecret) {
        order.refund = {
            status: 'failed',
            amount: Number(order?.totalPrice || 0),
            reason,
            initiatedAt: new Date(),
            error: 'Razorpay credentials are not configured'
        };
        return {
            attempted: true,
            success: false,
            error: 'Razorpay credentials are not configured'
        };
    }

    const instance = new Razorpay({
        key_id: keyId,
        key_secret: keySecret
    });

    try {
        const refund = await instance.payments.refund(paymentId, {
            amount: Math.round(Number(order?.totalPrice || 0) * 100),
            speed: 'normal',
            notes: {
                orderId: String(order?._id || ''),
                displayId: String(order?.displayId || ''),
                reason
            }
        });

        order.refund = {
            status: 'processed',
            refundId: refund?.id || '',
            amount: Number(refund?.amount || 0) / 100,
            reason,
            initiatedAt: refund?.created_at ? new Date(refund.created_at * 1000) : new Date(),
            processedAt: new Date()
        };

        return {
            attempted: true,
            success: true,
            refundId: refund?.id || ''
        };
    } catch (error) {
        order.refund = {
            status: 'failed',
            amount: Number(order?.totalPrice || 0),
            reason,
            initiatedAt: new Date(),
            error: error?.error?.description || error?.message || 'Refund failed'
        };

        return {
            attempted: true,
            success: false,
            error: error?.error?.description || error?.message || 'Refund failed'
        };
    }
};
