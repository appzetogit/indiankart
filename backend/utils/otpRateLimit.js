import OtpSendLog from '../models/OtpSendLog.js';

// Each OTP is a paid SMS, and the endpoint is public, so without limits anyone
// could send thousands to one number (or many). Limits are generous for a real
// customer (resend after 30 s, a handful of retries) and shared by all backend
// instances through the database.
const PER_MOBILE_GAP_SEC = 30;
const PER_MOBILE_15_MIN = 5;
const PER_MOBILE_HOUR = 10;
// Many customers on one mobile network share an IP, so this one is loose.
const PER_IP_HOUR = 30;

const normalize = (mobile) => String(mobile || '').replace(/\D/g, '').slice(-10);

const wait = (seconds) => {
    const s = Math.max(1, Math.ceil(seconds));
    return s >= 120 ? `${Math.ceil(s / 60)} minutes` : `${s} seconds`;
};

/**
 * Returns { allowed: true } and records the send, or
 * { allowed: false, retryAfterSec, message }.
 */
export const checkAndRecordOtpSend = async (mobile, ip = '') => {
    const number = normalize(mobile);
    const now = Date.now();
    const since = (ms) => new Date(now - ms);

    const recent = await OtpSendLog.find({ mobile: number, createdAt: { $gte: since(60 * 60 * 1000) } })
        .sort({ createdAt: -1 })
        .select('createdAt')
        .lean();

    if (recent.length) {
        const lastAgoSec = (now - new Date(recent[0].createdAt).getTime()) / 1000;
        if (lastAgoSec < PER_MOBILE_GAP_SEC) {
            const retryAfterSec = Math.ceil(PER_MOBILE_GAP_SEC - lastAgoSec);
            return { allowed: false, retryAfterSec, message: `Please wait ${wait(retryAfterSec)} before requesting another OTP.` };
        }
    }

    const in15 = recent.filter((r) => new Date(r.createdAt).getTime() >= now - 15 * 60 * 1000);
    if (in15.length >= PER_MOBILE_15_MIN) {
        const oldest = new Date(in15[in15.length - 1].createdAt).getTime();
        const retryAfterSec = Math.ceil((oldest + 15 * 60 * 1000 - now) / 1000);
        return { allowed: false, retryAfterSec, message: `Too many OTP requests for this number. Please try again in ${wait(retryAfterSec)}.` };
    }
    if (recent.length >= PER_MOBILE_HOUR) {
        const oldest = new Date(recent[recent.length - 1].createdAt).getTime();
        const retryAfterSec = Math.ceil((oldest + 60 * 60 * 1000 - now) / 1000);
        return { allowed: false, retryAfterSec, message: `Too many OTP requests for this number. Please try again in ${wait(retryAfterSec)}.` };
    }

    if (ip) {
        const fromIp = await OtpSendLog.countDocuments({ ip, createdAt: { $gte: since(60 * 60 * 1000) } });
        if (fromIp >= PER_IP_HOUR) {
            return { allowed: false, retryAfterSec: 15 * 60, message: 'Too many OTP requests from this network. Please try again later.' };
        }
    }

    await OtpSendLog.create({ mobile: number, ip });
    return { allowed: true };
};
