import ShopEvent from '../models/ShopEvent.js';
import { resolveStateFromIp, getClientIp } from './geoState.js';
import { canonicalizeState } from './indianStates.js';

const BOT_PATTERN = /bot|crawl|spider|slurp|facebookexternalhit|preview|headless|lighthouse|pingdom|monitor|curl|wget|python|axios|node-fetch/i;

export const isBotRequest = (req) => BOT_PATTERN.test(String(req?.headers?.['user-agent'] || ''));

export const getDevice = (req) => {
    const agent = String(req?.headers?.['user-agent'] || '');
    if (!agent) return 'unknown';
    if (/ipad|tablet/i.test(agent)) return 'tablet';
    if (/mobi|android|iphone/i.test(agent)) return 'mobile';
    return 'desktop';
};

export const resolveRequestState = (req, preferred = '') => {
    const state = canonicalizeState(preferred);
    if (state) return state;
    const geoState = resolveStateFromIp(getClientIp(req));
    return canonicalizeState(geoState) || 'Unknown';
};

export const formatVariant = (variant) => {
    if (!variant) return '';
    if (typeof variant === 'string') return variant.trim().slice(0, 120);
    if (typeof variant !== 'object') return '';
    return Object.values(variant)
        .map((value) => String(value ?? '').trim())
        .filter(Boolean)
        .join(' / ')
        .slice(0, 120);
};

// Never lets a tracking failure reach the caller: recording is best effort.
export const recordShopEvents = (events = []) => {
    const rows = events.filter((event) => event && event.type && Number.isFinite(Number(event.productId)));
    if (rows.length === 0) return;
    ShopEvent.insertMany(rows, { ordered: false }).catch((error) => {
        console.warn('[shop-events] not recorded:', error.message);
    });
};

// Fields every event from a web request shares.
export const requestContext = (req, preferredState = '') => ({
    user: req?.user && req.user.constructor?.modelName === 'User' ? req.user._id : null,
    sessionId: String(req?.headers?.['x-user-session-id'] || '').trim().slice(0, 120),
    state: resolveRequestState(req, preferredState),
    device: getDevice(req)
});
