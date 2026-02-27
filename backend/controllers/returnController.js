import Return from '../models/Return.js';
import Order from '../models/Order.js';
import Notification from '../models/Notification.js';
import Product from '../models/Product.js';
import mongoose from 'mongoose';
import { uploadBufferToCloudinary } from '../utils/cloudinaryUpload.js';

// @desc    Create a new return request
// @route   POST /api/returns
// @access  Private
export const createReturnRequest = async (req, res) => {
    try {
        const {
            orderId,
            productId,
            reason,
            comment,
            type,
            images,
            googleDriveLink,
            bankDetails,
            selectedReplacementSize,
            selectedReplacementColor,
            pickupAddress
        } = req.body;
        const parseJSON = (value) => {
            if (!value) return value;
            if (typeof value === 'object') return value;
            if (typeof value === 'string') {
                try {
                    return JSON.parse(value);
                } catch {
                    return value;
                }
            }
            return value;
        };
        const parsedPickupAddressRaw = parseJSON(pickupAddress);
        const parsedPickupAddress = parsedPickupAddressRaw && typeof parsedPickupAddressRaw === 'object'
            ? parsedPickupAddressRaw
            : null;
        const parsedBankDetailsRaw = parseJSON(bankDetails);
        const parsedBankDetails = parsedBankDetailsRaw && typeof parsedBankDetailsRaw === 'object'
            ? {
                accountHolderName: String(parsedBankDetailsRaw.accountHolderName || '').trim(),
                accountNumber: String(parsedBankDetailsRaw.accountNumber || '').trim(),
                ifscCode: String(parsedBankDetailsRaw.ifscCode || '').trim().toUpperCase()
            }
            : null;

        const normalizedProofLink = String(googleDriveLink || '').trim();
        const proofFiles = Array.isArray(req.files) ? req.files : [];
        const uploadedProofMedia = [];

        if (normalizedProofLink && !/(drive\.google\.com|docs\.google\.com)/i.test(normalizedProofLink)) {
            return res.status(400).json({ message: 'Please provide a valid Google Drive/Docs link for proof.' });
        }

        if (parsedBankDetails) {
            const hasAnyBankField = Boolean(
                parsedBankDetails.accountHolderName || parsedBankDetails.accountNumber || parsedBankDetails.ifscCode
            );

            if (hasAnyBankField) {
                if (!parsedBankDetails.accountHolderName || !parsedBankDetails.accountNumber || !parsedBankDetails.ifscCode) {
                    return res.status(400).json({ message: 'Please provide complete bank details (name, account number, IFSC).' });
                }
                if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(parsedBankDetails.ifscCode)) {
                    return res.status(400).json({ message: 'Invalid IFSC code format.' });
                }
                if (!/^\d{9,18}$/.test(parsedBankDetails.accountNumber)) {
                    return res.status(400).json({ message: 'Invalid account number.' });
                }
            }
        }

        for (const file of proofFiles) {
            if (!file?.mimetype || (!file.mimetype.startsWith('image/') && !file.mimetype.startsWith('video/'))) {
                return res.status(400).json({ message: 'Only image/video files are allowed as proof.' });
            }

            if (Number(file.size || 0) > 10 * 1024 * 1024) {
                return res.status(400).json({ message: 'Each proof file must be 10MB or smaller.' });
            }
        }

        if (proofFiles.length > 0) {
            const uploadResults = await Promise.all(
                proofFiles.map((file) =>
                    uploadBufferToCloudinary(file.buffer, {
                        folder: 'ecom_uploads/returns/proofs',
                        resource_type: 'auto'
                    })
                )
            );
            uploadedProofMedia.push(...uploadResults.map((result) => result.secure_url).filter(Boolean));
        }

        const order = await Order.findOne({ _id: orderId });
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Verify user owns the order
        if (order.user && order.user.toString() !== req.user._id.toString()) {
             return res.status(401).json({ message: 'Not authorized to return items for this order' });
        }

        if (type !== 'Cancellation') {
            const itemIndex = order.orderItems.findIndex(item => 
                String(item.product) === String(productId) || 
                String(item._id) === String(productId)
            );

            if (itemIndex === -1) {
                return res.status(404).json({ message: 'Product not found in order' });
            }

            const item = order.orderItems[itemIndex];
            
            // Create Return Record
            const newReturn = new Return({
                id: `RET-${Date.now()}`,
                orderId: order._id,
                customer: req.user.name,
                product: {
                    name: item.name,
                    image: item.image,
                    price: item.price
                },
                type,
                reason,
                comment,
                pickupAddress: parsedPickupAddress || {
                    name: order.shippingAddress?.name,
                    phone: order.shippingAddress?.phone,
                    address: order.shippingAddress?.street,
                    city: order.shippingAddress?.city,
                    state: order.shippingAddress?.state,
                    pincode: order.shippingAddress?.postalCode,
                    type: 'Home'
                },
                bankDetails: type === 'Return' ? (parsedBankDetails || undefined) : undefined,
                googleDriveLink: normalizedProofLink || '',
                proofMedia: uploadedProofMedia,
                images: uploadedProofMedia.length > 0 ? uploadedProofMedia : images,
                status: 'Pending',
                timeline: [{
                    status: 'Pending',
                    note: `${type} request initiated`
                }]
            });

            if (!normalizedProofLink && uploadedProofMedia.length === 0) {
                return res.status(400).json({
                    message: 'Please provide proof: either Google Drive link or image/video files (max 10MB each).'
                });
            }

            const createdReturn = await newReturn.save();

            // Update Order Item Status
            order.orderItems[itemIndex].status = type === 'Return' ? 'Return Requested' : 'Replacement Requested';
            
            if (selectedReplacementSize || selectedReplacementColor) {
                createdReturn.comment = `${createdReturn.comment || ''} [Replacement: Size ${selectedReplacementSize}, Color ${selectedReplacementColor}]`;
                await createdReturn.save();
            }

            await order.save();

            // Create Return Notification
            await Notification.create({
                type: 'return',
                title: `New ${type} Request`,
                message: `${type} requested for Order #${order._id.toString().slice(-6).toUpperCase()}`,
                relatedId: createdReturn._id
            });

            return res.status(201).json(createdReturn);
        } else {
            // CANCELLATION Flow
            // Safety Check: Only Pending or Confirmed orders can be cancelled
            const eligibleForCancellation = ['Pending', 'Confirmed'].includes(order.status);
            if (!eligibleForCancellation) {
                return res.status(400).json({ message: `Order cannot be cancelled in its current status: ${order.status}` });
            }

            const newReturn = new Return({
                id: `CAN-${Date.now()}`,
                orderId: order._id,
                customer: req.user.name,
                product: {
                    name: 'Whole Order Cancellation',
                    image: order.orderItems[0]?.image || '', // Use first item image as placeholder
                    price: order.totalPrice
                },
                type: 'Cancellation',
                reason: reason || 'User requested cancellation',
                comment,
                status: 'Pending',
                timeline: [{
                    status: 'Pending',
                    note: 'Cancellation request initiated'
                }]
            });

            const createdReturn = await newReturn.save();

            // Update Order Status
            order.status = 'Cancellation Requested';
            await order.save();

            // Create Notification
            await Notification.create({
                type: 'return',
                title: 'New Cancellation Request',
                message: `Cancellation requested for Order #${order._id.toString().slice(-6).toUpperCase()}`,
                relatedId: createdReturn._id
            });

            return res.status(201).json(createdReturn);
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error: ' + error.message });
    }
};


// @desc    Get all returns (Admin)
// @route   GET /api/returns
// @access  Private/Admin
export const getReturns = async (req, res) => {
    try {
        const returns = await Return.find({}).sort({ date: -1 }).lean();
        
        // Populate displayId manually since orderId is String
        const orderIds = returns.map(r => r.orderId);
        const orders = await Order.find({ _id: { $in: orderIds } }).select('_id displayId');
        
        const orderMap = orders.reduce((acc, order) => {
            acc[order._id.toString()] = order.displayId;
            return acc;
        }, {});

        const returnsWithDisplayId = returns.map(ret => ({
            ...ret,
            orderDisplayId: orderMap[ret.orderId] || ret.orderId
        }));

        res.json(returnsWithDisplayId);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user returns
// @route   GET /api/returns/my-returns
// @access  Private
export const getUserReturnRequests = async (req, res) => {
    try {
        const userOrders = await Order.find({ user: req.user._id }).select('_id displayId');
        const orderIds = userOrders.map(order => order._id.toString());
        
        const orderMap = userOrders.reduce((acc, order) => {
            acc[order._id.toString()] = order.displayId;
            return acc;
        }, {});

        const returns = await Return.find({ orderId: { $in: orderIds } }).sort({ date: -1 }).lean();

        const returnsWithDisplayId = returns.map(ret => ({
            ...ret,
            orderDisplayId: orderMap[ret.orderId] || ret.orderId
        }));

        res.json(returnsWithDisplayId);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update return status
// @route   PUT /api/returns/:id
// @access  Private/Admin
export const updateReturnStatus = async (req, res) => {
    try {
        let returnRequest;
        if (mongoose.Types.ObjectId.isValid(req.params.id)) {
            returnRequest = await Return.findById(req.params.id);
        }
        
        if (!returnRequest) {
            returnRequest = await Return.findOne({ id: req.params.id });
        }

        if (returnRequest) {
            const oldStatus = returnRequest.status;
            returnRequest.status = req.body.status || returnRequest.status;
            
            // Push to timeline
            returnRequest.timeline.push({
                status: req.body.status,
                note: req.body.note || `Status updated to ${req.body.status}`
            });
            
            const updatedReturn = await returnRequest.save();

            // Sync with Order Status
            const order = await Order.findById(returnRequest.orderId);
            if (order) {
                if (returnRequest.type === 'Cancellation') {
                    // CANCELLATION ACTION
                    if (req.body.status === 'Approved' || req.body.status === 'Completed') {
                        // Restore Stock and Set Order to Cancelled
                        if (order.status !== 'Cancelled') {
                            order.status = 'Cancelled';
                            
                            for (const item of order.orderItems) {
                                const product = await Product.findOne({ id: item.product });
                                if (product) {
                                    const update = { $inc: { stock: item.qty } };
                                    
                                    if (item.variant && Object.keys(item.variant).length > 0) {
                                        const skuIndex = product.skus.findIndex(s => {
                                            const comb = s.combination instanceof Map ? Object.fromEntries(s.combination) : s.combination;
                                            const itemKeys = Object.keys(item.variant);
                                            const combKeys = Object.keys(comb);
                                            if (itemKeys.length !== combKeys.length) return false;
                                            return itemKeys.every(key => String(item.variant[key]) === String(comb[key]));
                                        });
                                        if (skuIndex !== -1) {
                                            update.$inc[`skus.${skuIndex}.stock`] = item.qty;
                                        }
                                    }

                                    await Product.findOneAndUpdate(
                                        { _id: product._id },
                                        update
                                    );
                                }
                            }
                            await order.save();
                        }
                    } else if (req.body.status === 'Rejected') {
                        // Revert order status back to Pending/Confirmed (we'll guess Pending or just use a fixed logic)
                        // Ideally we'd store the original status, but for now we'll set back to 'Pending' or leave as is.
                        order.status = 'Pending'; 
                        await order.save();
                    }
                } else {
                    // RETURN / REPLACEMENT ACTION
                    const itemToUpdate = order.orderItems.find(i => 
                        i.name === returnRequest.product.name
                    );
                    
                    if (itemToUpdate) {
                        let newItemStatus = itemToUpdate.status;
                        if (req.body.status === 'Rejected') {
                            newItemStatus = 'Delivered';
                        } else if (req.body.status === 'Completed') {
                            newItemStatus = returnRequest.type === 'Return' ? 'Returned' : 'Replaced';
                        } else {
                            newItemStatus = req.body.status;
                        }
                        itemToUpdate.status = newItemStatus;
                        await order.save();
                    }
                }
            }

            res.json(updatedReturn);
        } else {
            res.status(404).json({ message: 'Return request not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
