import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import PinCode from '../models/PinCode.js';
import Notification from '../models/Notification.js';

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
export const addOrderItems = async (req, res) => {
    try {
        const {
            orderItems,
            shippingAddress,
            paymentMethod,
            itemsPrice,
            taxPrice,
            shippingPrice,
            totalPrice,
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
                
                if (!sku || sku.stock < item.qty) {
                    return res.status(400).json({ 
                        message: `Insufficient stock for ${item.name} (${Object.values(item.variant).join(', ')})`,
                        available: sku ? sku.stock : 0
                    });
                }
            } else if (product.stock < item.qty) {
                // Check Overall Stock
                return res.status(400).json({ 
                    message: `Insufficient stock for ${item.name}`,
                    available: product.stock
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
            paymentMethod,
            itemsPrice,
            taxPrice,
            shippingPrice,
            totalPrice,
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
        const order = await Order.findById(req.params.id).populate('user', 'name email phone');
        
        if (order) {
            // Check if user is still attached to the order
            // If population failed (e.g. user deleted or admin), order.user might be null if we accessed it as an object
            // However, we can try to get the raw user ID if populate didn't work as expected
            const orderUserId = order.user?._id?.toString() || order.user?.toString();
            const currentUserId = req.user?._id?.toString();
            const isAdmin = req.user && (req.user.isAdmin || ['admin', 'superadmin', 'editor', 'moderator'].includes(req.user.role));

            console.log(`Checking Order Auth: OrderOwner=${orderUserId}, RequestUser=${currentUserId}, isAdmin=${isAdmin}`);

            // Check if it's the owner or an admin
            if (orderUserId === currentUserId || isAdmin) {
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

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
export const getOrders = async (req, res) => {
    try {
        const { pageNumber, limit, search, status, user } = req.query;
        let filter = {};
        
        // Search Implementation
        if (search) {
             const searchRegex = { $regex: search, $options: 'i' };
             
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

            const updatedOrder = await order.save();
            res.json(updatedOrder);
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({ message: error.message });
    }
};

