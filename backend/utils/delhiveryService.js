import axios from 'axios';
import Setting from '../models/Setting.js';

const DEFAULT_DELHIVERY_BASE_URL = 'https://track.delhivery.com';

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

const formatOrderDate = (dateValue) => {
    const date = new Date(dateValue || Date.now());
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getPaymentMode = (order) => String(order?.paymentMethod || '').trim().toUpperCase() === 'COD'
    ? 'COD'
    : 'Pre-paid';

const buildShipmentPayload = (order, settings) => {
    const shippingAddress = order?.shippingAddress || {};
    const orderItems = Array.isArray(order?.orderItems) ? order.orderItems : [];
    const totalQuantity = orderItems.reduce((sum, item) => sum + (Number(item?.qty) || 0), 0) || 1;
    const productsDescription = sanitizeText(
        orderItems.map((item) => item?.name).filter(Boolean).join(', ')
    ).slice(0, 250);
    const orderReference = sanitizeText(order?.displayId || order?._id || '');
    const deliveryAddress = sanitizeText([
        shippingAddress?.street,
        shippingAddress?.city,
        shippingAddress?.state
    ].filter(Boolean).join(', '));
    const sellerName = sanitizeText(settings?.sellerName || 'IndianKart');
    const sellerAddress = sanitizeText(settings?.sellerAddress || 'Store Address');
    const totalAmount = Number(order?.totalPrice || 0);
    const paymentMode = getPaymentMode(order);
    const pickupLocationName = sanitizeText(settings?.delhiveryPickupLocation || '');
    const clientName = sanitizeText(settings?.delhiveryClientName || '');

    return {
        shipments: [
            {
                name: sanitizeText(shippingAddress?.name || 'Customer'),
                add: deliveryAddress,
                pin: String(shippingAddress?.postalCode || '').trim(),
                city: sanitizeText(shippingAddress?.city || ''),
                state: sanitizeText(shippingAddress?.state || ''),
                country: sanitizeText(shippingAddress?.country || 'India') || 'India',
                phone: normalizePhone(shippingAddress?.phone || ''),
                order: orderReference,
                payment_mode: paymentMode,
                products_desc: productsDescription,
                order_date: formatOrderDate(order?.createdAt),
                total_amount: totalAmount,
                cod_amount: paymentMode === 'COD' ? totalAmount : 0,
                seller_add: sellerAddress,
                seller_name: sellerName,
                seller_inv: orderReference,
                quantity: totalQuantity,
                shipment_width: 10,
                shipment_height: 10,
                shipment_length: 10,
                weight: Math.max(0.5, totalQuantity * 0.5),
                seller_gst_tin: sanitizeText(settings?.gstNumber || ''),
                hsn_code: '0000'
            }
        ],
        pickup_location: {
            name: pickupLocationName
        },
        client: clientName
    };
};

const parseWaybill = (responseData) => {
    if (!responseData || typeof responseData !== 'object') return '';

    const packageEntry = Array.isArray(responseData?.packages) ? responseData.packages[0] : null;
    return String(
        packageEntry?.waybill ||
        responseData?.waybill ||
        responseData?.packages?.waybill ||
        ''
    ).trim();
};

const getDelhiverySettings = async () => {
    const settings = await Setting.findOne().select('+delhiveryToken').lean();
    const baseUrl = String(settings?.deliveryApi || DEFAULT_DELHIVERY_BASE_URL).trim() || DEFAULT_DELHIVERY_BASE_URL;
    const token = String(settings?.delhiveryToken || '').trim();
    const clientName = String(settings?.delhiveryClientName || '').trim();
    const pickupLocation = String(settings?.delhiveryPickupLocation || '').trim();

    return {
        settings,
        baseUrl: baseUrl.replace(/\/$/, ''),
        token,
        clientName,
        pickupLocation
    };
};

const parseScanLocation = (scanDetail = {}) => {
    if (typeof scanDetail?.ScannedLocation === 'string') return scanDetail.ScannedLocation.trim();
    if (typeof scanDetail?.scanned_location === 'string') return scanDetail.scanned_location.trim();
    if (typeof scanDetail?.location === 'string') return scanDetail.location.trim();
    if (scanDetail?.ScannedLocation && typeof scanDetail.ScannedLocation === 'object') {
        return sanitizeText(
            scanDetail.ScannedLocation.city ||
            scanDetail.ScannedLocation.name ||
            scanDetail.ScannedLocation.center ||
            ''
        );
    }
    return '';
};

const parseScanTime = (scanDetail = {}) => (
    scanDetail?.StatusDateTime ||
    scanDetail?.ScanDateTime ||
    scanDetail?.status_date_time ||
    scanDetail?.scan_date_time ||
    scanDetail?.time ||
    null
);

const RAW_TO_USER_TRACKING_STEP = {
    Manifested: 'Processing',
    'Not Picked': 'Not Picked',
    'Picked Up': 'Picked Up',
    Pending: 'Processing',
    Scheduled: 'Processing',
    Dispatched: 'Dispatched',
    'In Transit': 'In Transit',
    'Out for Delivery': 'Out for Delivery',
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

const buildMappedStepTimes = (scans = []) => {
    const stepTimes = {
        Processing: null,
        'Not Picked': null,
        'Picked Up': null,
        Dispatched: null,
        'In Transit': null,
        'Out for Delivery': null,
        Delivered: null
    };

    const chronologicalScans = [...scans].sort(
        (first, second) => new Date(first.time || 0).getTime() - new Date(second.time || 0).getTime()
    );

    chronologicalScans.forEach((scan) => {
        const mappedStep = getMappedTrackingStep(scan.status);
        if (!mappedStep || !scan.time) return;
        if (!stepTimes[mappedStep]) {
            stepTimes[mappedStep] = scan.time;
        }
    });

    return stepTimes;
};

const normalizeTrackingResponse = (responseData, fallbackWaybill = '') => {
    const shipmentEntry = Array.isArray(responseData?.ShipmentData)
        ? responseData.ShipmentData[0]
        : (Array.isArray(responseData?.shipmentData) ? responseData.shipmentData[0] : null);

    const shipment = shipmentEntry?.Shipment || shipmentEntry?.shipment || shipmentEntry || {};
    const shipmentStatus = shipment?.Status || shipment?.status || {};
    const rawScans = Array.isArray(shipment?.Scans)
        ? shipment.Scans
        : (Array.isArray(shipment?.scans) ? shipment.scans : []);

    const scans = rawScans
        .map((entry) => {
            const detail = entry?.ScanDetail || entry?.scanDetail || entry || {};
            return {
                status: sanitizeText(detail?.Status || detail?.status || detail?.Scan || detail?.scan || ''),
                statusCode: sanitizeText(detail?.StatusCode || detail?.statusCode || ''),
                location: parseScanLocation(detail),
                time: parseScanTime(detail),
                instructions: sanitizeText(detail?.Instructions || detail?.instructions || ''),
                remarks: sanitizeText(detail?.Remarks || detail?.remarks || '')
            };
        })
        .filter((scan) => scan.status || scan.time)
        .sort((first, second) => new Date(second.time || 0).getTime() - new Date(first.time || 0).getTime());

    const latestScan = scans[0] || null;
    const statusInfo = typeof shipmentStatus === 'object' ? shipmentStatus : {};
    const currentStatus = sanitizeText(
        statusInfo?.Status ||
        statusInfo?.status ||
        shipment?.StatusDescription ||
        shipment?.status_description ||
        latestScan?.status ||
        ''
    );
    const currentStatusCode = sanitizeText(
        statusInfo?.StatusCode ||
        statusInfo?.statusCode ||
        latestScan?.statusCode ||
        ''
    );
    const currentLocation = sanitizeText(
        statusInfo?.StatusLocation ||
        statusInfo?.statusLocation ||
        latestScan?.location ||
        ''
    );
    const lastUpdatedAt = (
        statusInfo?.StatusDateTime ||
        statusInfo?.statusDateTime ||
        shipment?.LastUpdateDate ||
        shipment?.lastUpdateDate ||
        latestScan?.time ||
        null
    );
    const waybill = String(
        shipment?.AWB ||
        shipment?.awb ||
        shipment?.Waybill ||
        shipment?.waybill ||
        fallbackWaybill ||
        ''
    ).trim();

    return {
        waybill,
        referenceNumber: sanitizeText(shipment?.ReferenceNo || shipment?.referenceNo || shipment?.OrderNo || shipment?.orderNo || ''),
        currentStatus,
        currentStatusCode,
        mappedCurrentStep: getMappedTrackingStep(currentStatus),
        currentLocation,
        lastUpdatedAt,
        destination: sanitizeText(shipment?.Destination || shipment?.destination || ''),
        origin: sanitizeText(shipment?.Origin || shipment?.origin || ''),
        expectedDeliveryDate: shipment?.ExpectedDeliveryDate || shipment?.expectedDeliveryDate || null,
        stepTimes: buildMappedStepTimes(scans),
        scans,
        rawResponse: responseData
    };
};

export const createDelhiveryShipment = async (order) => {
    const {
        settings,
        baseUrl,
        token,
        clientName,
        pickupLocation
    } = await getDelhiverySettings();

    if (!token || !clientName || !pickupLocation) {
        throw new Error('Delhivery credentials are incomplete. Please save token, client name, and pickup location in Admin > API Credentials.');
    }

    const payload = buildShipmentPayload(order, settings);
    const encodedBody = `format=json&data=${encodeURIComponent(JSON.stringify(payload))}`;

    const { data } = await axios.post(
        `${baseUrl}/api/cmu/create.json`,
        encodedBody,
        {
            headers: {
                Authorization: `Token ${token}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            timeout: 20000
        }
    );

    const success = Boolean(data?.success);
    const waybill = parseWaybill(data);
    const remark = sanitizeText(data?.rmk || data?.remark || data?.error_message || data?.message || '');

    if (!success || !waybill) {
        throw new Error(remark || 'Delhivery shipment was not created successfully.');
    }

    return {
        requestPayload: payload,
        responsePayload: data,
        waybill,
        providerOrderId: sanitizeText(order?.displayId || order?._id || ''),
        pickupLocation
    };
};

export const fetchDelhiveryTracking = async (orderOrWaybill) => {
    const { baseUrl, token } = await getDelhiverySettings();
    const waybill = String(
        typeof orderOrWaybill === 'string'
            ? orderOrWaybill
            : orderOrWaybill?.delhivery?.waybill || ''
    ).trim();

    if (!token) {
        throw new Error('Delhivery token is missing. Please save it in Admin > API Credentials.');
    }

    if (!waybill) {
        throw new Error('Delhivery waybill is not available for this order yet.');
    }

    const { data } = await axios.get(
        `${baseUrl}/api/v1/packages/json/`,
        {
            headers: {
                Authorization: `Token ${token}`
            },
            params: {
                waybill
            },
            timeout: 20000
        }
    );

    if (data?.Error && !Array.isArray(data?.ShipmentData)) {
        throw new Error(String(data.Error).trim());
    }

    return normalizeTrackingResponse(data, waybill);
};

export const cancelDelhiveryShipment = async (order) => {
    const { baseUrl, token } = await getDelhiverySettings();
    const waybill = String(order?.delhivery?.waybill || '').trim();

    if (!token) {
        throw new Error('Delhivery token is missing. Please save it in Admin > API Credentials.');
    }

    if (!waybill) {
        throw new Error('Delhivery waybill is not available for this order yet.');
    }

    const payload = {
        waybill,
        cancellation: 'true'
    };

    const { data } = await axios.post(
        `${baseUrl}/api/p/edit`,
        payload,
        {
            headers: {
                Authorization: `Token ${token}`,
                'Content-Type': 'application/json'
            },
            timeout: 20000
        }
    );

    const hasSuccessFlag = data?.success === true || data?.Success === true;
    const acknowledged = data?.acknowledged === true || data?.Acknowledged === true;
    const statusText = sanitizeText(data?.status || data?.message || data?.rmk || data?.remark || '');
    const looksSuccessful = hasSuccessFlag || acknowledged || /cancel/i.test(statusText);

    if (!looksSuccessful) {
        throw new Error(statusText || 'Delhivery shipment cancellation failed.');
    }

    return {
        requestPayload: payload,
        responsePayload: data
    };
};
