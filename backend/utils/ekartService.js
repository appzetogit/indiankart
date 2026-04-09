import axios from 'axios';
import Setting from '../models/Setting.js';

const sanitizeText = (value = '') => (
    String(value || '')
        .replace(/[&#%;\\]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
);

const normalizePhone = (value = '') => {
    const digits = String(value || '').replace(/\D/g, '');
    if (digits.length >= 10) return digits.slice(-10);
    return digits;
};

const joinUrl = (baseUrl = '', path = '') => {
    const normalizedBase = String(baseUrl || '').trim().replace(/\/$/, '');
    const normalizedPath = String(path || '').trim();
    if (!normalizedPath) return normalizedBase;
    if (/^https?:\/\//i.test(normalizedPath)) return normalizedPath;
    return `${normalizedBase}${normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`}`;
};

const getTrackingNumber = (payload = {}) => {
    if (!payload || typeof payload !== 'object') return '';

    const candidates = [
        payload?.trackingNumber,
        payload?.tracking_number,
        payload?.awb,
        payload?.waybill,
        payload?.consignmentNumber,
        payload?.consignment_number,
        payload?.shipmentId,
        payload?.shipment_id,
        payload?.referenceNumber,
        payload?.reference_number
    ];

    for (const candidate of candidates) {
        const value = String(candidate || '').trim();
        if (value) return value;
    }

    if (Array.isArray(payload?.shipments)) {
        for (const shipment of payload.shipments) {
            const value = getTrackingNumber(shipment);
            if (value) return value;
        }
    }

    if (payload?.data && typeof payload.data === 'object') {
        return getTrackingNumber(payload.data);
    }

    return '';
};

const getCurrentStatus = (payload = {}) => {
    const candidates = [
        payload?.currentStatus,
        payload?.current_status,
        payload?.status,
        payload?.shipmentStatus,
        payload?.shipment_status
    ];

    for (const candidate of candidates) {
        const value = sanitizeText(candidate);
        if (value) return value;
    }

    return '';
};

const RAW_TO_USER_TRACKING_STEP = {
    Created: 'Processing',
    Booked: 'Processing',
    Pending: 'Processing',
    Processing: 'Processing',
    Manifested: 'Processing',
    'Shipment Created': 'Processing',
    Scheduled: 'Scheduled',
    'Pickup Scheduled': 'Scheduled',
    'Not Picked': 'Not Picked',
    Picked: 'Picked Up',
    'Picked Up': 'Picked Up',
    Dispatched: 'Dispatched',
    Shipped: 'Dispatched',
    'In Transit': 'In Transit',
    Transit: 'In Transit',
    'Out for Delivery': 'Out for Delivery',
    OFD: 'Out for Delivery',
    Delivered: 'Delivered',
    Cancelled: 'Cancelled',
    RTO: 'RTO',
    DTO: 'DTO',
    Collected: 'Collected'
};

const getMappedTrackingStep = (rawStatus = '') => {
    const normalized = sanitizeText(rawStatus);
    return RAW_TO_USER_TRACKING_STEP[normalized] || '';
};

const buildShipmentPayload = (order, settings) => {
    const shippingAddress = order?.shippingAddress || {};
    const orderItems = Array.isArray(order?.orderItems) ? order.orderItems : [];
    const totalQuantity = orderItems.reduce((sum, item) => sum + (Number(item?.qty) || 0), 0) || 1;
    const totalAmount = Number(order?.totalPrice || 0);

    return {
        orderReference: sanitizeText(order?.displayId || order?._id || ''),
        clientName: sanitizeText(settings?.ekartClientName || settings?.sellerName || 'IndianKart'),
        pickupLocation: sanitizeText(settings?.ekartPickupLocation || ''),
        paymentMode: String(order?.paymentMethod || '').trim().toUpperCase() === 'COD' ? 'COD' : 'PREPAID',
        amount: totalAmount,
        currency: 'INR',
        quantity: totalQuantity,
        customer: {
            name: sanitizeText(shippingAddress?.name || 'Customer'),
            phone: normalizePhone(shippingAddress?.phone || ''),
            email: sanitizeText(shippingAddress?.email || ''),
            addressLine1: sanitizeText(shippingAddress?.street || ''),
            city: sanitizeText(shippingAddress?.city || ''),
            state: sanitizeText(shippingAddress?.state || ''),
            postalCode: String(shippingAddress?.postalCode || '').trim(),
            country: sanitizeText(shippingAddress?.country || 'India') || 'India'
        },
        items: orderItems.map((item) => ({
            name: sanitizeText(item?.name || 'Item'),
            quantity: Number(item?.qty) || 1,
            unitPrice: Number(item?.price) || 0
        }))
    };
};

const buildAuthHeaders = (config) => {
    const headers = {};
    if (config.apiKey) {
        headers.Authorization = `Bearer ${config.apiKey}`;
        headers['x-api-key'] = config.apiKey;
    }

    if (config.username && config.password) {
        const encoded = Buffer.from(`${config.username}:${config.password}`).toString('base64');
        headers.Authorization = headers.Authorization || `Basic ${encoded}`;
    }

    return headers;
};

const getEkartSettings = async () => {
    const settings = await Setting.findOne().select('+ekartPassword +ekartApiKey').lean();
    const baseUrl = String(settings?.ekartBaseUrl || '').trim();
    const trackingBaseUrl = String(settings?.ekartTrackingBaseUrl || baseUrl).trim();

    return {
        settings,
        baseUrl: baseUrl.replace(/\/$/, ''),
        trackingBaseUrl: trackingBaseUrl.replace(/\/$/, ''),
        username: String(settings?.ekartUsername || '').trim(),
        password: String(settings?.ekartPassword || '').trim(),
        apiKey: String(settings?.ekartApiKey || '').trim(),
        createShipmentPath: String(settings?.ekartCreateShipmentPath || '/api/v1/shipments').trim(),
        trackingPath: String(settings?.ekartTrackingPath || '/api/v1/shipments/tracking').trim(),
        cancelPath: String(settings?.ekartCancelPath || '/api/v1/shipments/cancel').trim(),
        clientName: String(settings?.ekartClientName || '').trim(),
        pickupLocation: String(settings?.ekartPickupLocation || '').trim()
    };
};

const normalizeTrackingResponse = (responseData, fallbackTrackingNumber = '') => {
    const rawEvents = Array.isArray(responseData?.events)
        ? responseData.events
        : (Array.isArray(responseData?.scans) ? responseData.scans : []);

    const scans = rawEvents.map((entry) => ({
        status: sanitizeText(entry?.status || entry?.event || entry?.description || ''),
        location: sanitizeText(entry?.location || entry?.hub || entry?.city || ''),
        time: entry?.time || entry?.timestamp || entry?.updatedAt || null,
        remarks: sanitizeText(entry?.remarks || entry?.note || '')
    })).filter((entry) => entry.status || entry.time);

    const stepTimes = {};
    scans
        .sort((first, second) => new Date(first.time || 0).getTime() - new Date(second.time || 0).getTime())
        .forEach((scan) => {
            const mappedStep = getMappedTrackingStep(scan.status);
            if (mappedStep && scan.time && !stepTimes[mappedStep]) {
                stepTimes[mappedStep] = scan.time;
            }
        });

    const currentStatus = getCurrentStatus(responseData) || sanitizeText(scans[scans.length - 1]?.status || '');
    const currentLocation = sanitizeText(
        responseData?.currentLocation ||
        responseData?.current_location ||
        scans[scans.length - 1]?.location ||
        ''
    );

    return {
        trackingNumber: getTrackingNumber(responseData) || fallbackTrackingNumber,
        currentStatus,
        mappedCurrentStep: getMappedTrackingStep(currentStatus),
        currentLocation,
        lastUpdatedAt: responseData?.lastUpdatedAt || responseData?.updatedAt || scans[scans.length - 1]?.time || null,
        expectedDeliveryDate: responseData?.expectedDeliveryDate || responseData?.expected_delivery_date || null,
        stepTimes,
        scans,
        rawResponse: responseData
    };
};

export const createEkartShipment = async (order) => {
    const config = await getEkartSettings();
    if (!config.baseUrl || (!config.apiKey && !(config.username && config.password))) {
        throw new Error('Ekart credentials are incomplete. Please save base URL plus API key or username/password in Admin > API Credentials.');
    }

    const payload = buildShipmentPayload(order, config.settings);
    const { data } = await axios.post(
        joinUrl(config.baseUrl, config.createShipmentPath),
        payload,
        {
            headers: {
                ...buildAuthHeaders(config),
                'Content-Type': 'application/json'
            },
            timeout: 20000
        }
    );

    const trackingNumber = getTrackingNumber(data);
    if (!trackingNumber) {
        throw new Error(sanitizeText(data?.message || data?.error || 'Ekart shipment was not created successfully.'));
    }

    return {
        trackingNumber,
        providerOrderId: sanitizeText(order?.displayId || order?._id || ''),
        pickupLocation: config.pickupLocation,
        requestPayload: payload,
        responsePayload: data
    };
};

export const fetchEkartTracking = async (orderOrTrackingNumber) => {
    const config = await getEkartSettings();
    const trackingNumber = String(
        typeof orderOrTrackingNumber === 'string'
            ? orderOrTrackingNumber
            : orderOrTrackingNumber?.ekart?.trackingNumber || ''
    ).trim();

    if (!config.trackingBaseUrl || (!config.apiKey && !(config.username && config.password))) {
        throw new Error('Ekart credentials are incomplete. Please save tracking base URL plus API key or username/password in Admin > API Credentials.');
    }

    if (!trackingNumber) {
        throw new Error('Ekart tracking number is not available for this order yet.');
    }

    const { data } = await axios.get(
        joinUrl(config.trackingBaseUrl, config.trackingPath),
        {
            headers: buildAuthHeaders(config),
            params: {
                trackingNumber
            },
            timeout: 20000
        }
    );

    return normalizeTrackingResponse(data, trackingNumber);
};

export const cancelEkartShipment = async (order) => {
    const config = await getEkartSettings();
    const trackingNumber = String(order?.ekart?.trackingNumber || '').trim();

    if (!config.baseUrl || (!config.apiKey && !(config.username && config.password))) {
        throw new Error('Ekart credentials are incomplete. Please save base URL plus API key or username/password in Admin > API Credentials.');
    }

    if (!trackingNumber) {
        throw new Error('Ekart tracking number is not available for this order yet.');
    }

    const payload = {
        trackingNumber,
        orderReference: sanitizeText(order?.displayId || order?._id || '')
    };

    const { data } = await axios.post(
        joinUrl(config.baseUrl, config.cancelPath),
        payload,
        {
            headers: {
                ...buildAuthHeaders(config),
                'Content-Type': 'application/json'
            },
            timeout: 20000
        }
    );

    return {
        requestPayload: payload,
        responsePayload: data
    };
};
