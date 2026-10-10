import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import API from '../../../services/api';
import Loader from '../../../components/common/Loader';
import { useCartStore } from '../store/cartStore';
import { trackPurchase } from '../../../utils/analytics';
import { readPendingRedirectPayment, clearPendingRedirectPayment } from '../utils/redirectPayment';

const POLL_MS = 3000;
// Long enough for a slow bank capture; after this the customer is told the
// order will still appear on its own (the server keeps checking).
const GIVE_UP_MS = 3 * 60 * 1000;

// Landing page after paying on the bank's own page (redirect mode, used on
// phones). The server builds the order; this page waits for it, then does what
// the in-page flow does on success: clear the cart, report the purchase and
// open the order.
const PaymentStatus = () => {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const razorpayOrderId = params.get('rzp') || '';
    const failedReason = params.get('failed') ? (params.get('reason') || 'Payment was not completed') : '';
    const rejectedCode = params.get('rejected') || '';
    const { placeOrder, removeCoupon } = useCartStore();
    const [state, setState] = useState(rejectedCode ? 'rejected' : failedReason ? 'failed' : 'confirming');
    const [message, setMessage] = useState(failedReason);
    const [rejection, setRejection] = useState(() => (rejectedCode ? {
        code: rejectedCode,
        paymentId: params.get('pay') || '',
        paidAmount: params.get('paid'),
        expectedAmount: params.get('expected'),
    } : null));
    const finished = useRef(false);

    useEffect(() => {
        if (rejectedCode) return undefined;
        if (failedReason || !razorpayOrderId) {
            if (!razorpayOrderId && !failedReason) setState('unknown');
            return undefined;
        }
        const started = Date.now();
        let timer = null;

        const poll = async () => {
            if (finished.current) return;
            try {
                const { data } = await API.get(`/payments/checkout-status/${razorpayOrderId}`);
                if (data.order) {
                    finished.current = true;
                    const pending = readPendingRedirectPayment(razorpayOrderId);
                    placeOrder(data.order, pending ? pending.clearCart : true);
                    if (pending?.hadCoupon) removeCoupon();
                    clearPendingRedirectPayment();
                    trackPurchase(data.order);
                    setState('success');
                    setTimeout(() => navigate(`/my-orders/${data.order._id}`, { replace: true }), 1500);
                    return;
                }
                if (data.status === 'rejected') {
                    finished.current = true;
                    setRejection(data.rejection || { code: '' });
                    clearPendingRedirectPayment();
                    setState('rejected');
                    return;
                }
                if (data.status === 'needs_review') {
                    finished.current = true;
                    setState('review');
                    return;
                }
                if (!data.paid && data.lastError && Date.now() - started > 20 * 1000) {
                    finished.current = true;
                    setMessage(data.lastError);
                    setState('failed');
                    return;
                }
            } catch (error) {
                if (error?.response?.status === 404) {
                    finished.current = true;
                    setState('unknown');
                    return;
                }
                // Network blip: keep trying.
            }
            if (Date.now() - started > GIVE_UP_MS) {
                finished.current = true;
                setState('slow');
                return;
            }
            timer = setTimeout(poll, POLL_MS);
        };

        poll();
        return () => clearTimeout(timer);
    }, [razorpayOrderId, failedReason, rejectedCode, navigate, placeOrder, removeCoupon]);

    if (state === 'rejected') {
        const formatRs = (value) => {
            const amount = Number(value);
            return Number.isFinite(amount) ? `₹${amount.toLocaleString('en-IN')}` : '';
        };
        const paid = formatRs(rejection?.paidAmount);
        const expected = formatRs(rejection?.expectedAmount);
        const reason = {
            PAYMENT_AMOUNT_MISMATCH: paid && expected
                ? `The amount paid (${paid}) does not match the order total (${expected}).`
                : 'The amount paid does not match the order total.',
            PAYMENT_ORDER_MISMATCH: 'This payment belongs to a different checkout.',
            PAYMENT_ALREADY_USED: 'This payment has already been used for another order.',
            PAYMENT_SIGNATURE_INVALID: 'The payment details could not be verified.',
        }[rejection?.code] || 'This payment could not be matched to your order.';

        return (
            <div className="min-h-screen bg-[#f1f3f6] flex items-center justify-center px-4">
                <div className="bg-white rounded-lg shadow-sm max-w-md w-full p-6 text-center border-t-4 border-red-500">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
                        <span className="material-icons text-red-600 text-[28px]">error_outline</span>
                    </div>
                    <h1 className="text-lg font-semibold text-red-600 mb-2">Payment not confirmed</h1>
                    <p className="text-sm text-gray-700 mb-2">{reason}</p>
                    <p className="text-sm font-semibold text-gray-900 mb-4">Your order was not placed.</p>
                    {rejection?.paymentId ? (
                        <p className="text-xs text-gray-500 mb-4 break-all">Payment ID: {rejection.paymentId}</p>
                    ) : null}
                    <p className="text-xs text-gray-500 mb-6">
                        If money was taken, contact support with the payment ID and we will sort it out.
                    </p>
                    <div className="flex flex-col gap-3">
                        <button
                            type="button"
                            onClick={() => navigate('/cart', { replace: true })}
                            className="w-full bg-[#fb641b] text-white font-semibold py-3 rounded"
                        >
                            Back to cart
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/support')}
                            className="w-full border border-gray-300 text-gray-800 font-semibold py-3 rounded"
                        >
                            Contact support
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (state === 'confirming' || state === 'success') {
        return (
            <Loader
                fullPage={true}
                message={state === 'success' ? 'Order Placed Successfully!' : 'Confirming your payment... Please do not close or pay again.'}
                isSuccess={state === 'success'}
            />
        );
    }

    const content = {
        failed: {
            title: 'Payment not completed',
            body: `${message || 'Your payment did not go through.'} If any amount was debited for this attempt, your bank will refund it automatically.`,
        },
        review: {
            title: 'Payment received',
            body: 'We received your payment but need to check one detail before confirming the order. Our team will contact you shortly, or refund the full amount.',
        },
        slow: {
            title: 'Still confirming your payment',
            body: 'Your bank is taking longer than usual. If money was debited, your order will appear in My Orders automatically within a few minutes. Please do not pay again.',
        },
        unknown: {
            title: 'Check your orders',
            body: 'We could not find this payment session. If money was debited, your order will appear in My Orders shortly.',
        },
    }[state];

    return (
        <div className="min-h-screen bg-[#f1f3f6] flex items-center justify-center px-4">
            <div className="bg-white rounded-lg shadow-sm max-w-md w-full p-6 text-center">
                <h1 className="text-lg font-semibold text-gray-900 mb-2">{content.title}</h1>
                <p className="text-sm text-gray-600 mb-6">{content.body}</p>
                <div className="flex flex-col gap-3">
                    {state === 'failed' ? (
                        <button
                            type="button"
                            onClick={() => navigate('/cart', { replace: true })}
                            className="w-full bg-[#fb641b] text-white font-semibold py-3 rounded"
                        >
                            Try again
                        </button>
                    ) : null}
                    <button
                        type="button"
                        onClick={() => navigate('/my-orders', { replace: true })}
                        className={`w-full font-semibold py-3 rounded ${state === 'failed' ? 'border border-gray-300 text-gray-800' : 'bg-[#2874f0] text-white'}`}
                    >
                        Go to My Orders
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentStatus;
