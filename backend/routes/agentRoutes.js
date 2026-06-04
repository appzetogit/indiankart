import express from 'express';
import {
    createAgent,
    getAgentById,
    getAgents,
    updateAgent,
    validateReferralCode
} from '../controllers/agentController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/referral/:code', validateReferralCode);

router.route('/')
    .get(protect, admin, getAgents)
    .post(protect, admin, createAgent);

router.route('/:id')
    .get(protect, admin, getAgentById)
    .put(protect, admin, updateAgent);

export default router;
