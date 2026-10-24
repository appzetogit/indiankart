import express from 'express';
import {
    createAgent,
    getAgentById,
    getAgents,
    updateAgent,
    validateReferralCode
} from '../controllers/agentController.js';
import { protect, admin, can } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/referral/:code', validateReferralCode);

router.route('/')
    .get(protect, admin, can('agentManagement', 'orders'), getAgents)
    .post(protect, admin, can('agentManagement'), createAgent);

router.route('/:id')
    .get(protect, admin, can('agentManagement'), getAgentById)
    .put(protect, admin, can('agentManagement'), updateAgent);

export default router;
