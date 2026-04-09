export const getFulfillmentMode = (order) => {
    const explicitMode = String(order?.fulfillment?.mode || '').trim();
    if (explicitMode && explicitMode !== 'unassigned') {
        return explicitMode;
    }

    if (order?.delhivery?.waybill) return 'delhivery';
    if (order?.ekart?.trackingNumber) return 'ekart';
    return explicitMode || 'unassigned';
};

export const getShippingProviderLabel = (mode) => {
    if (mode === 'delhivery') return 'Delhivery';
    if (mode === 'ekart') return 'Ekart';
    if (mode === 'manual') return 'Manual';
    return 'Not assigned';
};

export const isCourierMode = (mode) => mode === 'delhivery' || mode === 'ekart';

export const getTrackingIdentifier = (order, mode) => {
    if (mode === 'delhivery') return String(order?.delhivery?.waybill || '').trim();
    if (mode === 'ekart') return String(order?.ekart?.trackingNumber || '').trim();
    return '';
};

export const getTrackingIdentifierLabel = (mode) => {
    if (mode === 'delhivery') return 'Waybill';
    if (mode === 'ekart') return 'Tracking Number';
    return 'Tracking ID';
};

export const getShippingError = (order, mode) => {
    if (mode === 'delhivery') return String(order?.delhivery?.lastError || '').trim();
    if (mode === 'ekart') return String(order?.ekart?.lastError || '').trim();
    return '';
};

export const getShippingPickupLocation = (order, mode) => {
    if (mode === 'delhivery') return String(order?.delhivery?.pickupLocation || '').trim();
    if (mode === 'ekart') return String(order?.ekart?.pickupLocation || '').trim();
    return '';
};

export const getShippingSyncedAt = (order, mode) => {
    if (mode === 'delhivery') return order?.delhivery?.syncedAt || null;
    if (mode === 'ekart') return order?.ekart?.syncedAt || null;
    return null;
};
