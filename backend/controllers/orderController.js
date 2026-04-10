import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import PinCode from '../models/PinCode.js';
import Notification from '../models/Notification.js';
import { refundCancelledRazorpayOrder, restoreOrderStock } from '../utils/orderCancellation.js';
import { cancelDelhiveryShipment, createDelhiveryShipment, fetchDelhiveryTracking } from '../utils/delhiveryService.js';
import { cancelEkartShipment, createEkartShipment, fetchEkartTracking } from '../utils/ekartService.js';

const DELHIVERY_SYNC_TRIGGER_STATUSES = new Set([
    'Confirmed',
    'Packed',
    'Dispatched',
    'Out for Delivery',
    'Delivered'
]);

const MANUAL_TRACKING_STATUSES = new Set([
    'Pending',
    'Confirmed',
    'Packed',
    'Dispatched',
    'Out for Delivery',
    'Delivered',
    'Cancelled',
    'Cancellation Requested'
]);

const getEffectivePurchaseLimit = (product, availableStock) => {
    const stockLimit = Math.max(0, Number(availableStock) || 0);
    const configuredLimit = Number(product?.maxOrderQuantity);

    if (!Number.isFinite(configuredLimit) || configuredLimit <= 0) {
        return stockLimit;
    }

    return Math.min(stockLimit, configuredLimit);
};

const isOrderAccessibleByUser = (order, user) => {
    const orderUserId = order?.user?.toString();
    const currentUserId = user?._id?.toString();
    const isAdmin = Boolean(user && (user.isAdmin || ['admin', 'superadmin', 'editor', 'moderator'].includes(user.role)));

    return {
        orderUserId,
        currentUserId,
        isAdmin,
        isAllowed: orderUserId === currentUserId || isAdmin
    };
};

const getFulfillmentMode = (order) => {
    const explicitMode = String(order?.fulfillment?.mode || '').trim();
    if (explicitMode && explicitMode !== 'unassigned') {
        return explicitMode;
    }

    if (order?.delhivery?.waybill) return 'delhivery';
    if (order?.ekart?.trackingNumber) return 'ekart';
    return explicitMode || 'unassigned';
};

const PROVIDER_SYNC_TRIGGER_STATUSES = new Set([
    'Confirmed',
    'Packed',
    'Dispatched',
    'Out for Delivery',
    'Delivered'
]);

const getProviderTrackingIdentifier = (order, provider) => {
    if (provider === 'delhivery') return String(order?.delhivery?.waybill || '').trim();
    if (provider === 'ekart') return String(order?.ekart?.trackingNumber || '').trim();
    return '';
};

const clearInactiveProviderErrors = (order, activeProvider) => {
    order.delhivery = {
        ...order.delhivery,
        lastError: activeProvider === 'delhivery' ? String(order?.delhivery?.lastError || '') : ''
    };
    order.ekart = {
        ...order.ekart,
        lastError: activeProvider === 'ekart' ? String(order?.ekart?.lastError || '') : ''
    };
};

const createShipmentForProvider = async (order, provider) => {
    if (provider === 'delhivery') {
        const shipment = await createDelhiveryShipment(order);
        order.delhivery = {
            ...order.delhivery,
            waybill: shipment.waybill || '',
            providerOrderId: shipment.providerOrderId,
            pickupLocation: shipment.pickupLocation,
            syncedAt: new Date(),
            requestPayload: shipment.requestPayload,
            responsePayload: shipment.responsePayload,
            lastError: ''
        };
        order.ekart = {
            ...order.ekart,
            lastError: ''
        };
        return;
    }

    if (provider === 'ekart') {
        const shipment = await createEkartShipment(order);
        order.ekart = {
            ...order.ekart,
            trackingNumber: shipment.trackingNumber || '',
            providerOrderId: shipment.providerOrderId,
            pickupLocation: shipment.pickupLocation,
            syncedAt: new Date(),
            requestPayload: shipment.requestPayload,
            responsePayload: shipment.responsePayload,
            lastError: ''
        };
        order.delhivery = {
            ...order.delhivery,
            lastError: ''
        };
    }
};

const setProviderCreationError = (order, provider, errorMessage) => {
    if (provider === 'delhivery') {
        order.delhivery = {
            ...order.delhivery,
            waybill: '',
            lastError: errorMessage
        };
        return;
    }

    if (provider === 'ekart') {
        order.ekart = {
            ...order.ekart,
            trackingNumber: '',
            lastError: errorMessage
        };
    }
};

const cancelShipmentForProvider = async (order, provider) => {
    if (provider === 'delhivery' && order?.delhivery?.waybill) {
        const cancellation = await cancelDelhiveryShipment(order);
        order.delhivery = {
            ...order.delhivery,
            cancelledAt: new Date(),
            cancelResponsePayload: cancellation.responsePayload,
            lastError: ''
        };
        return;
    }

    if (provider === 'ekart' && order?.ekart?.trackingNumber) {
        const cancellation = await cancelEkartShipment(order);
        order.ekart = {
            ...order.ekart,
            cancelledAt: new Date(),
            cancelResponsePayload: cancellation.responsePayload,
            lastError: ''
        };
    }
};

const setProviderCancellationError = (order, provider, errorMessage) => {
    if (provider === 'delhivery') {
        order.delhivery = {
            ...order.delhivery,
            lastError: errorMessage
        };
        return;
    }

    if (provider === 'ekart') {
        order.ekart = {
            ...order.ekart,
            lastError: errorMessage
        };
    }
};

const fetchTrackingForProvider = async (order, provider) => {
    if (provider === 'delhivery') {
        return fetchDelhiveryTracking(order);
    }

    if (provider === 'ekart') {
        return fetchEkartTracking(order);
    }

    throw new Error('Tracking is available only for courier-based fulfillment providers.');
};

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
export const addOrderItems = async (req, res) => {
    try {
        const {
            orderItems,
            shippingAddress,
            retailerDetails,
            paymentMethod,
            itemsPrice,
            taxPrice,
            shippingPrice,
            totalPrice,
            coupon,
        } = req.body;

        if (!orderItems || orderItems.length === 0) {
            return res.status(400).json({ message: 'No order items' });
        }

        // Validate Pincode Serviceability
        const pincode = shippingAddress.postalCode;
        if (pincode) {
            const pinCodeRecord = await PinCode.findOne({ code: pincode, isActive: true });
            if (!pinCodeRecord) {
                return res.status(400).json({ message: `Delivery not available for pincode ${pincode}` });
            }
        } else {
            return res.status(400).json({ message: 'Shipping pincode is required' });
        }

        const isRetailer = Boolean(retailerDetails?.isRetailer);
        const normalizedShopName = isRetailer ? String(retailerDetails?.shopName || '').trim() : '';
        const normalizedGstNumber = isRetailer
            ? String(retailerDetails?.gstNumber || '').replace(/\s+/g, '').toUpperCase()
            : '';

        if (isRetailer) {
            if (!normalizedShopName || !normalizedGstNumber) {
                return res.status(400).json({ message: 'Shop name and GST number are required for retailer orders' });
            }
            if (normalizedGstNumber.length !== 15) {
                return res.status(400).json({ message: 'Invalid GST number' });
            }
        }

        // Generate Unique Human-Readable Order ID
        const generateDisplayId = () => {
            const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude ambiguous 0, O, 1, I
            let result = 'ORD-';
            for (let i = 0; i < 6; i++) {
                result += characters.charAt(Math.floor(Math.random() * characters.length));
            }
            return result;
        };

        let displayId = generateDisplayId();
        let isUnique = false;
        let attempts = 0;
        
        while (!isUnique && attempts < 10) {
            const existing = await Order.findOne({ displayId });
            if (!existing) {
                isUnique = true;
            } else {
                displayId = generateDisplayId();
                attempts++;
            }
        }

        // 1. Initial Stock Validation (Pre-creation)
        for (const item of orderItems) {
            const product = await Product.findOne({ id: item.product || item._id });
            if (!product) {
                return res.status(404).json({ message: `Product not found: ${item.name}` });
            }

            // Check Variant Stock if applicable
            if (item.variant && Object.keys(item.variant).length > 0) {
                const sku = product.skus.find(s => {
                    const comb = s.combination instanceof Map ? Object.fromEntries(s.combination) : s.combination;
                    const itemKeys = Object.keys(item.variant);
                    const combKeys = Object.keys(comb);
                    if (itemKeys.length !== combKeys.length) return false;
                    return itemKeys.every(key => String(item.variant[key]) === String(comb[key]));
                });
                const purchaseLimit = getEffectivePurchaseLimit(product, sku?.stock);
                
                if (!sku || purchaseLimit < item.qty) {
                    return res.status(400).json({ 
                        message: purchaseLimit <= 0
                            ? `Insufficient stock for ${item.name} (${Object.values(item.variant).join(', ')})`
                            : `Maximum allowed quantity for ${item.name} is ${purchaseLimit}`,
                        available: purchaseLimit
                    });
                }
            } else if (getEffectivePurchaseLimit(product, product.stock) < item.qty) {
                // Check Overall Stock
                const purchaseLimit = getEffectivePurchaseLimit(product, product.stock);
                return res.status(400).json({ 
                    message: purchaseLimit <= 0
                        ? `Insufficient stock for ${item.name}`
                        : `Maximum allowed quantity for ${item.name} is ${purchaseLimit}`,
                    available: purchaseLimit
                });
            }
        }

        const order = new Order({
            displayId,
            transactionId: req.body.paymentResult?.razorpay_payment_id || req.body.paymentResult?.id || null,
            orderItems: orderItems.map(item => ({
                ...item,
                product: item.product || item._id
            })),
            user: req.user._id,
            shippingAddress,
            retailerDetails: {
                isRetailer,
                shopName: normalizedShopName,
                gstNumber: normalizedGstNumber
            },
            paymentMethod,
            itemsPrice,
            taxPrice,
            shippingPrice,
            totalPrice,
            coupon,
            isPaid: req.body.isPaid || false,
            paidAt: req.body.paidAt,
            paymentResult: req.body.paymentResult
        });

        const createdOrder = await order.save();

        // 2. Reduce Stock (Post-creation)
        for (const item of createdOrder.orderItems) {
            const product = await Product.findOne({ id: item.product });
            if (product) {
                const update = { $inc: { stock: -item.qty } };
                
                // If variant exists, find its index for atomic array update
                if (item.variant && Object.keys(item.variant).length > 0) {
                    const skuIndex = product.skus.findIndex(s => {
                        const comb = s.combination instanceof Map ? Object.fromEntries(s.combination) : s.combination;
                        const itemKeys = Object.keys(item.variant);
                        const combKeys = Object.keys(comb);
                        if (itemKeys.length !== combKeys.length) return false;
                        return itemKeys.every(key => String(item.variant[key]) === String(comb[key]));
                    });
                    
                    if (skuIndex !== -1) {
                        update.$inc[`skus.${skuIndex}.stock`] = -item.qty;
                    }
                }

                // Atomic update to avoid VersionError
                const updatedProduct = await Product.findOneAndUpdate(
                    { _id: product._id },
                    update,
                    { new: true }
                );

                if (updatedProduct) {
                    // Overall Low Stock Alert
                    if (updatedProduct.stock <= 5) {
                        await Notification.create({
                            type: 'stock',
                            title: 'Low Stock Alert',
                            message: `Product "${updatedProduct.name}" is running low on stock (${updatedProduct.stock} remaining).`,
                            relatedId: updatedProduct._id
                        });
                    }

                    // Variant Low Stock Alert (Check updated SKU stock)
                    if (item.variant && Object.keys(item.variant).length > 0) {
                         const updatedSku = updatedProduct.skus.find(s => {
                            const comb = s.combination instanceof Map ? Object.fromEntries(s.combination) : s.combination;
                            const itemKeys = Object.keys(item.variant);
                            return itemKeys.every(key => String(item.variant[key]) === String(comb[key]));
                        });
                        if (updatedSku && updatedSku.stock <= 5) {
                            await Notification.create({
                                type: 'stock',
                                title: 'Low Stock Alert (Variant)',
                                message: `Product "${updatedProduct.name}" variant has low stock (${updatedSku.stock} remaining).`,
                                relatedId: updatedProduct._id
                            });
                        }
                    }
                }
            }
        }

        // Create Order Notification
        await Notification.create({
            type: 'order',
            title: 'New Order Received',
            message: `Order #${createdOrder._id.toString().slice(-6).toUpperCase()} placed by ${req.user.name} for ₹${totalPrice}`,
            relatedId: createdOrder._id
        });

        res.status(201).json(createdOrder);
    } catch (error) {
        console.error('Order creation error:', error);
        res.status(500).json({ message: error.message || 'Order creation failed' });
    }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
export const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        console.error('Get my orders error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        
        if (order) {
            // Authorize against the raw stored owner id before attempting population.
            // This keeps ownership checks working even for special/bypass users
            // whose referenced user document may not exist in the Users collection.
            const { orderUserId, currentUserId, isAdmin, isAllowed } = isOrderAccessibleByUser(order, req.user);

            console.log(`Checking Order Auth: OrderOwner=${orderUserId}, RequestUser=${currentUserId}, isAdmin=${isAdmin}`);

            // Check if it's the owner or an admin
            if (isAllowed) {
                await order.populate('user', 'name email phone');
                res.json(order);
            } else {
                res.status(401).json({ 
                    message: 'Not authorized to view this order',
                    details: `Current: ${currentUserId}, Owner: ${orderUserId}`
                });
            }
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        console.error(`Get order by ID error [ID: ${req.params.id}]:`, error);
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid order ID format' });
        }
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get live Delhivery tracking for an order
// @route   GET /api/orders/:id/delhivery-tracking
// @access  Private
export const getOrderDelhiveryTracking = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const { isAllowed } = isOrderAccessibleByUser(order, req.user);
        if (!isAllowed) {
            return res.status(401).json({ message: 'Not authorized to view this order tracking' });
        }

        if (!order.delhivery?.waybill) {
            return res.status(400).json({ message: 'Delhivery shipment has not been created for this order yet.' });
        }

        const tracking = await fetchDelhiveryTracking(order);

        return res.json({
            orderId: order._id,
            displayId: order.displayId,
            status: order.status,
            waybill: order.delhivery.waybill,
            tracking
        });
    } catch (error) {
        console.error(`Get order Delhivery tracking error [ID: ${req.params.id}]:`, error);
        return res.status(500).json({ message: error.message || 'Failed to fetch Delhivery tracking' });
    }
};

// @desc    Get live shipping tracking for an order
// @route   GET /api/orders/:id/shipping-tracking
// @access  Private
export const getOrderShippingTracking = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const { isAllowed } = isOrderAccessibleByUser(order, req.user);
        if (!isAllowed) {
            return res.status(401).json({ message: 'Not authorized to view this order tracking' });
        }

        const provider = getFulfillmentMode(order);
        if (!['delhivery', 'ekart'].includes(provider)) {
            return res.status(400).json({ message: 'Tracking is available only after assigning Delhivery or Ekart.' });
        }

        const trackingIdentifier = getProviderTrackingIdentifier(order, provider);
        if (!trackingIdentifier) {
            return res.status(400).json({ message: `${provider === 'delhivery' ? 'Delhivery waybill' : 'Ekart tracking number'} has not been created for this order yet.` });
        }

        const tracking = await fetchTrackingForProvider(order, provider);

        return res.json({
            orderId: order._id,
            displayId: order.displayId,
            status: order.status,
            provider,
            trackingIdentifier,
            tracking
        });
    } catch (error) {
        console.error(`Get order shipping tracking error [ID: ${req.params.id}]:`, error);
        return res.status(500).json({ message: error.message || 'Failed to fetch shipping tracking' });
    }
};

// @desc    Assign order fulfillment mode
// @route   PUT /api/orders/:id/fulfillment
// @access  Private/Admin
export const assignOrderFulfillment = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        const requestedMode = String(req.body?.mode || '').trim().toLowerCase();

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (!['manual', 'delhivery', 'ekart'].includes(requestedMode)) {
            return res.status(400).json({ message: 'Invalid fulfillment mode' });
        }

        const currentMode = getFulfillmentMode(order);
        if (currentMode === requestedMode) {
            await order.populate('user', 'name email phone');
            return res.json(order);
        }

        order.fulfillment = {
            ...order.fulfillment,
            mode: requestedMode,
            assignedAt: new Date(),
            assignedBy: req.user?._id || null
        };

        if (['delhivery', 'ekart'].includes(requestedMode)) {
            if (!getProviderTrackingIdentifier(order, requestedMode)) {
                try {
                    await createShipmentForProvider(order, requestedMode);
                } catch (error) {
                    setProviderCreationError(order, requestedMode, error.message || `Failed to create ${requestedMode} shipment`);
                    await order.save();
                    return res.status(400).json({
                        message: error.message || `Failed to create ${requestedMode} shipment`
                    });
                }
            }

            if (String(order.status || '').trim() === 'Pending') {
                order.status = 'Confirmed';
            }
        } else {
            clearInactiveProviderErrors(order, 'manual');
        }

        const updatedOrder = await order.save();
        await updatedOrder.populate('user', 'name email phone');
        return res.json(updatedOrder);
    } catch (error) {
        console.error('Assign order fulfillment error:', error);
        return res.status(500).json({ message: error.message || 'Failed to assign fulfillment mode' });
    }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
export const getOrders = async (req, res) => {
    try {
        const { pageNumber, limit, search, status, user } = req.query;
        let filter = {};
        
        // Search Implementation
        if (search) {
             const normalizedSearch = String(search || '').trim();
             const searchPattern = normalizedSearch
                 .split(/\s+/)
                 .filter(Boolean)
                 .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
                 .join('\\s*');
             const searchRegex = { $regex: searchPattern, $options: 'i' };
             
             let searchConditions = [
                 { 'user.name': searchRegex },
                 { 'displayId': searchRegex },
                 { 'shippingAddress.name': searchRegex },
                 { 'shippingAddress.email': searchRegex }
             ];

             if (mongoose.Types.ObjectId.isValid(search)) {
                searchConditions.push({ '_id': search });
             }

             filter.$or = searchConditions;
             // Note: Searching nested user fields in a referenced document (populate) isn't directly possible in a simple find query 
             // without aggregation or looking up user IDs first. 
             // However, redundancy in Order model (shippingAddress) helps. 
             // For strict user name search, we might need a separate lookup if not stored in Order.
        }

        if (status && status !== 'All') {
            filter.status = status;
        }
        
        // Filter by User Email (exact match)
        if (user) {
            // This assumes we can filter by user email directly or need to look up user first
            // Since User is referenced, we need the User ID. 
            // If the query passes an email, we might need to find the user first.
            // Or rely on shippingAddress.email
             filter['shippingAddress.email'] = user; 
        }

        if (pageNumber || limit) {
             const pageSize = Number(limit) || 12;
             const page = Number(pageNumber) || 1;
             
             const count = await Order.countDocuments(filter);
             const orders = await Order.find(filter)
                 .populate('user', 'name email phone')
                 .sort({ createdAt: -1 })
                 .limit(pageSize)
                 .skip(pageSize * (page - 1));
                 
             return res.json({ 
                 orders, 
                 page, 
                 pages: Math.ceil(count / pageSize), 
                 total: count 
             });
        }

        const orders = await Order.find(filter) // Apply filter even without pagination
            .populate('user', 'name email phone')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        console.error('Get all orders error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update order to delivered
// @route   PUT /api/orders/:id/deliver
// @access  Private/Admin
export const updateOrderToDelivered = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (order) {
            order.isDelivered = true;
            order.deliveredAt = Date.now();
            order.status = 'Delivered'; // Syncing status field

            const updatedOrder = await order.save();
            res.json(updatedOrder);
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        console.error('Update to delivered error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update order status (general)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
export const updateOrderStatus = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        const { status, serialNumbers } = req.body;

        if (order) {
            const fulfillmentMode = getFulfillmentMode(order);

            if (fulfillmentMode === 'unassigned' && status !== 'Cancelled' && String(status || '').trim() !== String(order.status || '').trim()) {
                return res.status(400).json({ message: 'Assign this order to Delhivery, Ekart, or Manual before updating fulfillment.' });
            }

            if (fulfillmentMode === 'manual' && !MANUAL_TRACKING_STATUSES.has(String(status || '').trim())) {
                return res.status(400).json({ message: 'Invalid manual fulfillment status' });
            }

            if (status === 'Cancelled') {
                if (order.isDelivered || order.deliveredAt || order.status === 'Delivered') {
                    return res.status(400).json({ message: 'Delivered order cannot be cancelled' });
                }

                if (['delhivery', 'ekart'].includes(fulfillmentMode) && getProviderTrackingIdentifier(order, fulfillmentMode)) {
                    try {
                        await cancelShipmentForProvider(order, fulfillmentMode);
                    } catch (error) {
                        setProviderCancellationError(order, fulfillmentMode, error.message || `Failed to cancel ${fulfillmentMode} shipment`);
                        await order.save();
                        return res.status(400).json({
                            message: error.message || `Failed to cancel ${fulfillmentMode} shipment`
                        });
                    }
                }

                if (order.status !== 'Cancelled') {
                    await restoreOrderStock(order);
                }
            }

            order.status = status;
            if (status === 'Delivered') {
                order.isDelivered = true;
                order.deliveredAt = Date.now();
            }

            // If serialNumbers are provided (regardless of status change), update them
            if (serialNumbers && Array.isArray(serialNumbers) && serialNumbers.length > 0) {
                // serialNumbers expected to be array of objects: { itemId: "...", serial: "...", type: "..." }
                serialNumbers.forEach(sItem => {
                   const item = order.orderItems.find(i => i._id.toString() === sItem.itemId);
                   if (item) {
                       item.serialNumber = sItem.serial;
                       item.serialType = sItem.type || 'Serial Number';
                   }
                });
            }

            if (status === 'Cancelled') {
                await refundCancelledRazorpayOrder(order, 'Order cancelled before delivery');
            }

            const shouldCreateProviderShipment =
                ['delhivery', 'ekart'].includes(fulfillmentMode) &&
                PROVIDER_SYNC_TRIGGER_STATUSES.has(String(status || '').trim()) &&
                !getProviderTrackingIdentifier(order, fulfillmentMode);

            if (shouldCreateProviderShipment) {
                try {
                    await createShipmentForProvider(order, fulfillmentMode);
                } catch (error) {
                    setProviderCreationError(order, fulfillmentMode, error.message || `Failed to create ${fulfillmentMode} shipment`);
                    order.status = 'Pending';
                    await order.save();
                    return res.status(400).json({
                        message: error.message || `Failed to create ${fulfillmentMode} shipment`
                    });
                }
            }

            const updatedOrder = await order.save();
            await updatedOrder.populate('user', 'name email phone');
            res.json(updatedOrder);
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({ message: error.message });
    }
};

