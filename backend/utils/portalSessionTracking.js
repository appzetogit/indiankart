import crypto from 'crypto';
import PortalSession from '../models/PortalSession.js';

const normalizeSessionId = (value = '') => String(value || '').trim();

export const createPortalSessionId = () => crypto.randomUUID();

export const recordPortalLogin = async ({
    sessionId,
    userId,
    userRole = 'user',
    authMethod = 'unknown'
}) => {
    const normalizedSessionId = normalizeSessionId(sessionId);
    const normalizedUserId = String(userId || '').trim();

    if (!normalizedSessionId || !normalizedUserId) return null;

    const now = new Date();

    return PortalSession.findOneAndUpdate(
        { sessionId: normalizedSessionId },
        {
            $set: {
                userId: normalizedUserId,
                userRole,
                authMethod,
                lastSeenAt: now,
                logoutAt: null,
                isActive: true
            },
            $setOnInsert: {
                loginAt: now
            }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );
};

export const touchPortalSession = async ({ sessionId, userId }) => {
    const normalizedSessionId = normalizeSessionId(sessionId);
    const normalizedUserId = String(userId || '').trim();

    if (!normalizedSessionId || !normalizedUserId) return null;

    return PortalSession.findOneAndUpdate(
        { sessionId: normalizedSessionId, userId: normalizedUserId },
        {
            $set: {
                lastSeenAt: new Date(),
                logoutAt: null,
                isActive: true
            }
        },
        { new: true }
    );
};

export const recordPortalLogout = async ({ sessionId, userId }) => {
    const normalizedSessionId = normalizeSessionId(sessionId);
    const normalizedUserId = String(userId || '').trim();

    if (!normalizedSessionId || !normalizedUserId) return null;

    return PortalSession.findOneAndUpdate(
        { sessionId: normalizedSessionId, userId: normalizedUserId },
        {
            $set: {
                lastSeenAt: new Date(),
                logoutAt: new Date(),
                isActive: false
            }
        },
        { new: true }
    );
};
