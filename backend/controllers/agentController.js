import mongoose from 'mongoose';
import Agent from '../models/Agent.js';
import Order from '../models/Order.js';

const normalizeReferralCode = (value = '') =>
    String(value || '')
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .trim();

const sanitizeAgentPayload = (body = {}) => ({
    name: String(body.name || '').trim(),
    email: String(body.email || '').trim(),
    phone: String(body.phone || '').trim(),
    referralCode: normalizeReferralCode(body.referralCode),
    commissionPercent: Number(body.commissionPercent),
    isActive: body.isActive !== false,
    notes: String(body.notes || '').trim()
});

const buildAgentSummaryMap = async () => {
    const summary = await Order.aggregate([
        {
            $match: {
                'referral.agent': { $exists: true, $ne: null }
            }
        },
        {
            $group: {
                _id: '$referral.agent',
                totalReferralOrders: { $sum: 1 },
                successfulReferralOrders: {
                    $sum: {
                        $cond: [{ $ne: ['$status', 'Cancelled'] }, 1, 0]
                    }
                },
                cancelledReferralOrders: {
                    $sum: {
                        $cond: [{ $eq: ['$status', 'Cancelled'] }, 1, 0]
                    }
                },
                revenueGenerated: {
                    $sum: {
                        $cond: [{ $ne: ['$status', 'Cancelled'] }, '$itemsPrice', 0]
                    }
                },
                commissionEarned: {
                    $sum: {
                        $cond: [{ $ne: ['$status', 'Cancelled'] }, '$referral.commissionAmount', 0]
                    }
                },
                customers: { $addToSet: '$user' }
            }
        }
    ]);

    return new Map(
        summary.map((item) => [
            String(item._id),
            {
                totalReferralOrders: Number(item.totalReferralOrders || 0),
                successfulReferralOrders: Number(item.successfulReferralOrders || 0),
                cancelledReferralOrders: Number(item.cancelledReferralOrders || 0),
                revenueGenerated: Number(item.revenueGenerated || 0),
                commissionEarned: Number(item.commissionEarned || 0),
                uniqueCustomers: Array.isArray(item.customers) ? item.customers.length : 0
            }
        ])
    );
};

const serializeAgent = (agent, summary = {}) => ({
    ...agent,
    summary: {
        totalReferralOrders: 0,
        successfulReferralOrders: 0,
        cancelledReferralOrders: 0,
        revenueGenerated: 0,
        commissionEarned: 0,
        uniqueCustomers: 0,
        ...summary
    }
});

export const validateReferralCode = async (req, res) => {
    try {
        const referralCode = normalizeReferralCode(req.params.code);
        if (!referralCode) {
            return res.status(400).json({ message: 'Referral code is required' });
        }

        const agent = await Agent.findOne({ referralCode, isActive: true }).lean();
        if (!agent) {
            return res.status(404).json({ message: 'Invalid or inactive referral code' });
        }

        return res.json({
            _id: agent._id,
            name: agent.name,
            referralCode: agent.referralCode,
            commissionPercent: Number(agent.commissionPercent || 0)
        });
    } catch (error) {
        return res.status(500).json({ message: error.message || 'Failed to validate referral code' });
    }
};

export const getAgents = async (req, res) => {
    try {
        const agents = await Agent.find({}).sort({ createdAt: -1 }).lean();
        const summaryMap = await buildAgentSummaryMap();

        return res.json(
            agents.map((agent) =>
                serializeAgent(agent, summaryMap.get(String(agent._id)))
            )
        );
    } catch (error) {
        return res.status(500).json({ message: error.message || 'Failed to load agents' });
    }
};

export const getAgentById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid agent ID' });
        }

        const agent = await Agent.findById(req.params.id).lean();
        if (!agent) {
            return res.status(404).json({ message: 'Agent not found' });
        }

        const summaryMap = await buildAgentSummaryMap();
        const orders = await Order.find({ 'referral.agent': agent._id })
            .select('displayId createdAt status itemsPrice totalPrice shippingPrice referral shippingAddress')
            .sort({ createdAt: -1 })
            .lean();

        return res.json({
            ...serializeAgent(agent, summaryMap.get(String(agent._id))),
            orders: orders.map((order) => ({
                _id: order._id,
                displayId: order.displayId,
                createdAt: order.createdAt,
                status: order.status,
                itemsPrice: Number(order.itemsPrice || 0),
                totalPrice: Number(order.totalPrice || 0),
                shippingPrice: Number(order.shippingPrice || 0),
                customerName: order.shippingAddress?.name || '',
                customerEmail: order.shippingAddress?.email || '',
                customerPhone: order.shippingAddress?.phone || '',
                referralCode: order.referral?.code || '',
                commissionPercent: Number(order.referral?.commissionPercent || 0),
                commissionAmount: Number(order.referral?.commissionAmount || 0)
            }))
        });
    } catch (error) {
        return res.status(500).json({ message: error.message || 'Failed to load agent details' });
    }
};

export const createAgent = async (req, res) => {
    try {
        const payload = sanitizeAgentPayload(req.body);

        if (!payload.name) {
            return res.status(400).json({ message: 'Agent name is required' });
        }
        if (!payload.referralCode || payload.referralCode.length < 4) {
            return res.status(400).json({ message: 'Referral code must be at least 4 characters' });
        }
        if (!Number.isFinite(payload.commissionPercent) || payload.commissionPercent < 0 || payload.commissionPercent > 100) {
            return res.status(400).json({ message: 'Commission percent must be between 0 and 100' });
        }

        const existingAgent = await Agent.findOne({ referralCode: payload.referralCode });
        if (existingAgent) {
            return res.status(400).json({ message: 'Referral code already exists' });
        }

        const agent = await Agent.create(payload);
        return res.status(201).json(serializeAgent(agent.toObject()));
    } catch (error) {
        return res.status(500).json({ message: error.message || 'Failed to create agent' });
    }
};

export const updateAgent = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid agent ID' });
        }

        const agent = await Agent.findById(req.params.id);
        if (!agent) {
            return res.status(404).json({ message: 'Agent not found' });
        }

        const payload = sanitizeAgentPayload(req.body);
        if (!payload.name) {
            return res.status(400).json({ message: 'Agent name is required' });
        }
        if (!payload.referralCode || payload.referralCode.length < 4) {
            return res.status(400).json({ message: 'Referral code must be at least 4 characters' });
        }
        if (!Number.isFinite(payload.commissionPercent) || payload.commissionPercent < 0 || payload.commissionPercent > 100) {
            return res.status(400).json({ message: 'Commission percent must be between 0 and 100' });
        }

        const duplicateAgent = await Agent.findOne({
            referralCode: payload.referralCode,
            _id: { $ne: agent._id }
        });
        if (duplicateAgent) {
            return res.status(400).json({ message: 'Referral code already exists' });
        }

        agent.name = payload.name;
        agent.email = payload.email;
        agent.phone = payload.phone;
        agent.referralCode = payload.referralCode;
        agent.commissionPercent = payload.commissionPercent;
        agent.isActive = payload.isActive;
        agent.notes = payload.notes;

        const updatedAgent = await agent.save();
        return res.json(serializeAgent(updatedAgent.toObject()));
    } catch (error) {
        return res.status(500).json({ message: error.message || 'Failed to update agent' });
    }
};
