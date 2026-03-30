import Return from '../models/Return.js';
import Order from '../models/Order.js';
import Notification from '../models/Notification.js';
import Product from '../models/Product.js';
import mongoose from 'mongoose';
import { uploadBufferToCloudinary } from '../utils/cloudinaryUpload.js';
import { refundCancelledRazorpayOrder, restoreOrderStock } from '../utils/orderCancellation.js';

const RETURN_WINDOW_DAYS = 7;

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
            requestedQuantity,
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
                if (/\d/.test(parsedBankDetails.accountHolderName)) {
                    return res.status(400).json({ message: 'Account holder name should not contain numbers.' });
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
            const deliveredAt = order.deliveredAt ? new Date(order.deliveredAt) : null;
            if (!deliveredAt || Number.isNaN(deliveredAt.getTime())) {
                return res.status(400).json({ message: 'Return or replacement is allowed only after successful delivery.' });
            }

            const diffMs = Date.now() - deliveredAt.getTime();
            const diffDays = diffMs / (1000 * 60 * 60 * 24);
            if (diffDays > RETURN_WINDOW_DAYS) {
                return res.status(400).json({
                    message: `Return or replacement can only be requested within ${RETURN_WINDOW_DAYS} days of delivery.`
                });
            }

            const itemIndex = order.orderItems.findIndex(item => 
                String(item.product) === String(productId) || 
                String(item._id) === String(productId)
            );

            if (itemIndex === -1) {
                return res.status(404).json({ message: 'Product not found in order' });
            }

            const item = order.orderItems[itemIndex];
            const normalizedRequestedQuantity = Math.max(1, Number.parseInt(requestedQuantity, 10) || 1);
            const maxAllowedQuantity = Math.max(1, Number(item.qty || item.quantity || 1));

            if (normalizedRequestedQuantity > maxAllowedQuantity) {
                return res.status(400).json({ message: `You can request up to ${maxAllowedQuantity} quantity for this item.` });
            }

            const orderedVariant = item.variant && typeof item.variant === 'object'
                ? item.variant
                : {};
            const orderedVariantEntries = Object.entries(orderedVariant)
                .filter(([key, value]) => key && value !== undefined && value !== null && String(value).trim() !== '');

            if (type === 'Replacement') {
                const productDoc = await Product.findOne({ id: item.product }).lean();

                if (!productDoc) {
                    return res.status(404).json({ message: 'Replacement product details not found.' });
                }

                const skuList = Array.isArray(productDoc.skus) ? productDoc.skus : [];
                const hasVariantSnapshot = orderedVariantEntries.length > 0;

                if (hasVariantSnapshot && skuList.length > 0) {
                    const exactSku = skuList.find((sku) => {
                        const combination = sku?.combination && typeof sku.combination === 'object'
                            ? sku.combination
                            : {};

                        return orderedVariantEntries.every(([key, value]) =>
                            String(combination[key] || '') === String(value)
                        );
                    });

                    if (!exactSku || Number(exactSku.stock || 0) <= 0) {
                        return res.status(400).json({
                            message: 'Exact same product variant is unavailable for replacement right now. Please request a refund instead.'
                        });
                    }
                } else if (Number(productDoc.stock || 0) <= 0) {
                    return res.status(400).json({
                        message: 'This product is currently out of stock for replacement. Please request a refund instead.'
                    });
                }
            }
            
            // Create Return Record
            const newReturn = new Return({
                id: `RET-${Date.now()}`,
                orderId: order._id,
                customer: req.user.name,
                product: {
                    id: item.product,
                    name: item.name,
                    image: item.image,
                    price: item.price,
                    variant: orderedVariant
                },
                type,
                requestedQuantity: normalizedRequestedQuantity,
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
            
            if (type === 'Replacement' && orderedVariantEntries.length > 0) {
                const replacementVariantLabel = orderedVariantEntries
                    .map(([key, value]) => `${key}: ${value}`)
                    .join(', ');
                createdReturn.comment = `${createdReturn.comment || ''} [Exact replacement: ${replacementVariantLabel}]`.trim();
                await createdReturn.save();
            } else if (selectedReplacementSize || selectedReplacementColor) {
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

            const isOnlinePaid = Boolean(order.isPaid) && String(order.paymentMethod || '').trim().toUpperCase() !== 'COD';

            let returnStatus = 'Completed';
            let returnNote = 'Cancellation completed automatically';

            if (order.status !== 'Cancelled') {
                await restoreOrderStock(order);
                order.status = 'Cancelled';
            }

            if (isOnlinePaid) {
                const refundResult = await refundCancelledRazorpayOrder(order, 'User cancelled order before delivery');
                if (refundResult.success) {
                    returnStatus = 'Refund Initiated';
                    returnNote = 'Cancellation completed and Razorpay refund initiated automatically';
                } else {
                    returnStatus = 'Approved';
                    returnNote = `Cancellation completed but automatic refund failed: ${refundResult.error || 'Unknown error'}`;
                }
            }

            await order.save();

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
                status: returnStatus,
                timeline: [{
                    status: returnStatus,
                    note: returnNote
                }]
            });

            const createdReturn = await newReturn.save();

            // Create Notification
            await Notification.create({
                type: 'return',
                title: 'Order Cancelled',
                message: `Order #${order._id.toString().slice(-6).toUpperCase()} cancelled${isOnlinePaid ? ' and refund started' : ''}`,
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
        const nextStatus = String(req.body.status || '').trim();
        const note = String(req.body.note || '').trim();

        if (nextStatus === 'Rejected' && !note) {
            return res.status(400).json({ message: 'Reject reason is required.' });
        }

        let returnRequest;
        if (mongoose.Types.ObjectId.isValid(req.params.id)) {
            returnRequest = await Return.findById(req.params.id);
        }
        
        if (!returnRequest) {
            returnRequest = await Return.findOne({ id: req.params.id });
        }

        if (returnRequest) {
            const oldStatus = returnRequest.status;
            returnRequest.status = nextStatus || returnRequest.status;
            
            // Push to timeline
            returnRequest.timeline.push({
                status: nextStatus,
                note: note || `Status updated to ${nextStatus}`
            });
            
            const updatedReturn = await returnRequest.save();

            // Sync with Order Status
            const order = await Order.findById(returnRequest.orderId);
            if (order) {
                if (returnRequest.type === 'Cancellation') {
                    // CANCELLATION ACTION
                    if (nextStatus === 'Approved' || nextStatus === 'Completed') {
                        // Restore Stock and Set Order to Cancelled
                        if (order.status !== 'Cancelled') {
                            order.status = 'Cancelled';
                            await restoreOrderStock(order);
                        }

                        const refundResult = await refundCancelledRazorpayOrder(order, 'Admin approved cancellation before delivery');
                        if (refundResult.attempted && refundResult.success && nextStatus !== 'Completed') {
                            returnRequest.status = 'Refund Initiated';
                            returnRequest.timeline.push({
                                status: 'Refund Initiated',
                                note: 'Razorpay refund initiated automatically'
                            });
                            await returnRequest.save();
                        }

                        await order.save();
                    } else if (nextStatus === 'Rejected') {
                        // Revert order status back to Pending/Confirmed (we'll guess Pending or just use a fixed logic)
                        // Ideally we'd store the original status, but for now we'll set back to 'Pending' or leave as is.
                        order.status = 'Pending'; 
                        await order.save();
                    }
                } else {
                    // RETURN / REPLACEMENT ACTION
                    const returnVariant = returnRequest.product?.variant && typeof returnRequest.product.variant === 'object'
                        ? returnRequest.product.variant
                        : {};
                    const itemToUpdate = order.orderItems.find((i) => {
                        const sameById = String(i.product) === String(returnRequest.product?.id) &&
                            JSON.stringify(i.variant || {}) === JSON.stringify(returnVariant);
                        const sameByName = String(i.name || '').trim() === String(returnRequest.product?.name || '').trim();
                        return sameById || sameByName;
                    });
                    
                    if (itemToUpdate) {
                        let newItemStatus = itemToUpdate.status;
                        if (nextStatus === 'Rejected') {
                            newItemStatus = 'Return Rejected';
                        } else if (nextStatus === 'Completed') {
                            newItemStatus = returnRequest.type === 'Return' ? 'Returned' : 'Replaced';
                        } else {
                            newItemStatus = nextStatus;
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
