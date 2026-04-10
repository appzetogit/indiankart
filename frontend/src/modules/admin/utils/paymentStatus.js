const ONLINE_PAYMENT_SUCCESS_STATUSES = new Set(['captured']);

export const getAdminPaymentStatus = (order) => {
    const paymentMethod = String(order?.paymentMethod || order?.payment?.method || '').trim().toUpperCase();
    const gatewayStatus = String(order?.paymentResult?.status || order?.paymentGatewayStatus || '').trim().toLowerCase();
    const refundStatus = String(order?.paymentResult?.refund_status || '').trim().toLowerCase();
    const gatewaySyncError = String(order?.paymentResult?.gateway_sync_error || '').trim();
    const hasDuplicatePayment = Boolean(order?.paymentAudit?.hasDuplicatePayment);
    const isOnlinePayment = paymentMethod && paymentMethod !== 'COD';

    if (!isOnlinePayment) {
        return order?.isPaid ? 'Paid' : 'Pending';
    }

    if (hasDuplicatePayment) {
        return 'Duplicate Payment Use';
    }

    if (refundStatus === 'full') {
        return 'Refunded';
    }

    if (refundStatus === 'partial') {
        return 'Partially Refunded';
    }

    if (order?.isPaid && ONLINE_PAYMENT_SUCCESS_STATUSES.has(gatewayStatus)) {
        return 'Paid';
    }

    if (gatewayStatus === 'failed') {
        return 'Failed';
    }

    if (gatewayStatus === 'authorized') {
        return 'Authorized';
    }

    if (!gatewayStatus || gatewayStatus === 'created' || gatewayStatus === 'paid' || gatewayStatus === 'success') {
        return 'Pending';
    }

    if (gatewaySyncError) {
        return 'Verification Required';
    }

    return 'Pending';
};

export const getAdminPaymentStatusClass = (status) => {
    if (['Paid', 'Completed'].includes(status)) {
        return 'bg-green-100 text-green-700';
    }

    if (['Refunded', 'Partially Refunded'].includes(status)) {
        return 'bg-blue-100 text-blue-700';
    }

    if (status === 'Failed') {
        return 'bg-red-100 text-red-700';
    }

    if (status === 'Authorized') {
        return 'bg-violet-100 text-violet-700';
    }

    if (status === 'Verification Required') {
        return 'bg-slate-100 text-slate-700';
    }

    if (status === 'Duplicate Payment Use') {
        return 'bg-rose-100 text-rose-700';
    }

    return 'bg-amber-100 text-amber-700';
};
