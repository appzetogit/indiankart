import crypto from 'crypto';
import PortalSession from '../models/PortalSession.js';

const normalizeSessionId = (value = '') => String(value || '').trim();
const normalizeUserId = (value = '') => String(value || '').trim();

export const createPortalSessionId = () => crypto.randomUUID();

export const recordPortalLogin = async ({
    sessionId,
    userId,
    userRole = 'user',
    authMethod = 'unknown'
}) => {
    const normalizedSessionId = normalizeSessionId(sessionId);
    const normalizedUserId = normalizeUserId(userId);

    if (!normalizedSessionId || !normalizedUserId) return null;

    const now = new Date();

    // Resolve user's home state on login
    let resolvedState = 'Unknown';
    try {
        const User = (await import('../models/User.js')).default;
        const user = await User.findById(normalizedUserId).select('addresses state').lean();
        if (user) {
            if (Array.isArray(user.addresses) && user.addresses.length > 0) {
                const defaultAddr = user.addresses.find((a) => a.isDefault);
                const firstAddr = user.addresses[0];
                resolvedState = String(defaultAddr?.state || firstAddr?.state || '').trim();
            }
            if ((!resolvedState || resolvedState === 'Unknown') && user.state) {
                resolvedState = String(user.state).trim();
            }
        }
    } catch (error) {
        console.error('Error resolving user state on login:', error);
    }

    return PortalSession.findOneAndUpdate(
        { sessionId: normalizedSessionId },
        {
            $set: {
                userId: normalizedUserId,
                userRole,
                authMethod,
                lastSeenAt: now,
                logoutAt: null,
                isActive: true,
                state: resolvedState || 'Unknown'
            },
            $setOnInsert: {
                loginAt: now
            }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );
};

export const touchPortalSession = async ({ sessionId, userId, path, state }) => {
    const normalizedSessionId = normalizeSessionId(sessionId);
    const normalizedUserId = normalizeUserId(userId);

    if (!normalizedSessionId) return null;

    const updateObj = {
        lastSeenAt: new Date(),
        isActive: true
    };

    if (normalizedUserId) {
        updateObj.userId = normalizedUserId;
        updateObj.logoutAt = null;
        updateObj.userRole = 'user';
    } else {
        updateObj.userRole = 'guest';
        updateObj.authMethod = 'guest';
    }

    // If a custom state is provided, use it. Otherwise, query database as fallback
    if (state && state !== 'Unknown') {
        updateObj.state = state;
    } else if (normalizedUserId) {
        try {
            const User = (await import('../models/User.js')).default;
            const user = await User.findById(normalizedUserId).select('addresses state').lean();
            if (user) {
                let resolvedState = '';
                if (Array.isArray(user.addresses) && user.addresses.length > 0) {
                    const defaultAddr = user.addresses.find((a) => a.isDefault);
                    const firstAddr = user.addresses[0];
                    resolvedState = String(defaultAddr?.state || firstAddr?.state || '').trim();
                }
                if (!resolvedState && user.state) {
                    resolvedState = String(user.state).trim();
                }
                if (resolvedState) {
                    updateObj.state = resolvedState;
                }
            }
        } catch (error) {
            console.error('Error resolving user state on touch:', error);
        }
    }

    const setObj = { $set: updateObj };

    if (path) {
        setObj.$push = {
            pagesVisited: {
                $each: [{ path, visitedAt: new Date() }],
                $slice: -15 // cap at last 15 page transitions
            }
        };
    }

    return PortalSession.findOneAndUpdate(
        { sessionId: normalizedSessionId },
        {
            ...setObj,
            $setOnInsert: {
                sessionId: normalizedSessionId,
                userId: normalizedUserId,
                userRole: normalizedUserId ? 'user' : 'guest',
                authMethod: normalizedUserId ? 'unknown' : 'guest',
                loginAt: new Date()
            }
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
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
