import axios from 'axios';
import { randomInt } from 'crypto';
import Otp from '../models/Otp.js';
import Order from '../models/Order.js';

// SMS India HUB Configuration
// SMS India HUB Configuration accessed dynamically to handle ESM loading order
const API_TIMEOUT = 30000; // 30 seconds
const HARDCODED_LOGIN_OTP = '0000';
const HARDCODED_LOGIN_MOBILES = new Set(['7610416911', '7223077890']);
const MAX_OTP_ATTEMPTS = 5;

// Every fixed-OTP shortcut hangs off this one flag. Deliberately NOT keyed on
// NODE_ENV: production servers frequently run with NODE_ENV=development, which
// would silently re-open 999999/0000/1234 as universal logins.
const isTestOtpBypassEnabled = () => process.env.ALLOW_HARDCODED_LOGIN_OTP === 'true';

// One normaliser for both storing and looking up an OTP. These used to differ:
// saving kept every digit while verification searched on the last ten, so a
// number arriving as +91XXXXXXXXXX was stored under twelve digits and could
// never be found again — the user always saw "failed to verify OTP".
const normalizeOtpMobile = (value = '') => {
    const digits = String(value || '').replace(/\D/g, '');
    return digits.length > 10 ? digits.slice(-10) : digits;
};

function getSmsConfig() {
    const apiKey = process.env.SMSINDIAHUB_API_KEY || process.env.SMS_INDIA_HUB_API_KEY;
    const senderId = process.env.SMSINDIAHUB_SENDER_ID || process.env.SMS_INDIA_HUB_SENDER_ID;
    const templateId =
        process.env.SMSINDIAHUB_TEMPLATE_ID ||
        process.env.SMS_INDIA_HUB_DLT_TEMPLATE_ID ||
        process.env.SMS_INDIA_HUB_TEMPLATE_ID;
    const entityId = process.env.SMSINDIAHUB_ENTITY_ID || process.env.SMS_INDIA_HUB_ENTITY_ID;
    const messageTemplate =
        process.env.SMSINDIAHUB_MESSAGE_TEMPLATE || process.env.SMS_INDIA_HUB_MESSAGE_TEMPLATE;
    const apiUrl =
        process.env.SMSINDIAHUB_API_URL ||
        process.env.SMS_INDIA_HUB_API_URL ||
        'https://cloud.smsindiahub.in/vendorsms/pushsms.aspx';
    const gwid =
        process.env.SMSINDIAHUB_GWID ||
        process.env.SMS_INDIA_HUB_GWID ||
        '2';

    return {
        apiKey,
        senderId,
        templateId,
        entityId,
        messageTemplate,
        apiUrl: apiUrl.replace(/^http:\/\//i, 'https://'),
        gwid,
    };
}

function normalizeForHardcodedLogin(mobile) {
    const digits = String(mobile || '').replace(/\D/g, '');
    return digits.length > 10 ? digits.slice(-10) : digits;
}

function normalizeHardcodedOtp(otp) {
    const digits = String(otp ?? '').replace(/\D/g, '');
    if (!digits) return '';
    return digits.length < 4 ? digits.padStart(4, '0') : digits;
}

/**
 * Generate numeric OTP
 */
function generateOTP(length = 4) {
    // crypto, not Math.random: predictable OTPs are guessable OTPs.
    let otp = '';
    for (let i = 0; i < length; i++) {
        otp += String(randomInt(0, 10));
    }
    return otp;
}

/**
 * Normalize mobile number to include country code (91)
 */
// Builds the 91XXXXXXXXXX form the SMS gateway expects. Decided by LENGTH, not
// by leading digits: this used to add 91 only when the number did not already
// start with "91", so every 10-digit mobile that itself begins 91 (9123456789)
// was left at 10 digits, rejected, and never sent an OTP - login and delivery
// OTPs alike.
function normalizeMobileNumber(mobile) {
    let digits = String(mobile || '').replace(/\D/g, '');

    if (digits.length === 11 && digits.startsWith('0')) {
        digits = digits.slice(1);              // 0XXXXXXXXXX trunk prefix
    }
    if (digits.length === 10) {
        digits = `91${digits}`;                // national number
    }

    if (digits.length !== 12 || !digits.startsWith('91') || !/^91[6-9]/.test(digits)) {
        throw new Error(`Invalid mobile number ending ${digits.slice(-4)}. Expected a 10-digit Indian mobile number.`);
    }

    return digits;
}

/**
 * Build DLT-compliant message
 */
function buildOtpMessage(otp) {
    const appName = process.env.APP_NAME || 'Indian Kart';
    const template = getSmsConfig().messageTemplate;
    if (template) {
        return template
            .replaceAll('{companyName}', appName)
            .replaceAll('{otp}', otp);
    }
    return `Welcome to the ${appName} powered by SMSINDIAHUB. Your OTP for registration is ${otp}`;
}

/**
 * Parse and handle SMS India HUB API response
 */
function handleSmsResponse(responseData) {
    const responseText = typeof responseData === 'string'
        ? responseData
        : JSON.stringify(responseData || {});
    const responseTextLower = responseText.toLowerCase();

    if (
        responseTextLower.includes('success') ||
        responseTextLower.includes('sent') ||
        responseTextLower.includes('accepted')
    ) {
        return;
    }

    const errorCode = responseData.ErrorCode || '';
    const errorMsg = responseData.ErrorMessage || '';

    // Success indicators
    if (errorCode === '000' || errorMsg === 'Done' || responseData.JobId || responseData.MessageData) {
        return; // Success
    }

    // Error handling
    if (errorCode || errorMsg) {
        switch (errorCode) {
            case '001':
                throw new Error('SMS India HUB: Account details cannot be blank.');
            case '006':
                throw new Error('SMS India HUB: Invalid DLT template. Message does not match registered template.');
            case '007':
                throw new Error('SMS India HUB: Invalid API key or credentials.');
            case '021':
                throw new Error('SMS India HUB: Insufficient credits in your account.');
            default:
                throw new Error(`SMS India HUB API Error (Code: ${errorCode}): ${errorMsg}`);
        }
    }

    if (
        responseTextLower.includes('error') ||
        responseTextLower.includes('failed') ||
        responseTextLower.includes('invalid') ||
        responseTextLower.includes('not valid')
    ) {
        throw new Error(`SMS India HUB API Error: ${responseText}`);
    }
}

/**
 * Send SMS via SMS India HUB API
 */
async function sendSmsViaApi(mobile, message) {
    const {
        apiKey: API_KEY,
        senderId: SENDER_ID,
        templateId: TEMPLATE_ID,
        entityId: ENTITY_ID,
        apiUrl: API_URL,
        gwid: GWID,
    } = getSmsConfig();

    if (!API_KEY || !SENDER_ID) {
        throw new Error('SMS India HUB credentials are missing. Please check environment variables.');
    }

    const cleanMobile = normalizeMobileNumber(mobile);

    const params = {
        APIKey: API_KEY.trim(),
        msisdn: cleanMobile,
        sid: SENDER_ID.trim(),
        msg: message,
        fl: '0',
        dc: '0',
        gwid: GWID,
    };

    if (TEMPLATE_ID && TEMPLATE_ID.trim()) {
        params.templateid = TEMPLATE_ID.trim();
    }

    if (ENTITY_ID && ENTITY_ID.trim()) {
        params.entityid = ENTITY_ID.trim();
    }

    // DEBUG LOG
    console.log('[SMS] Sending via API:', {
        mobile: cleanMobile,
        sender: SENDER_ID,
        url: API_URL,
        gwid: GWID,
        templateid: params.templateid,
        entityid: params.entityid
    });

    const response = await axios.get(API_URL, {
        params,
        paramsSerializer: (params) => {
            return Object.keys(params)
                .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
                .join('&');
        },
        timeout: API_TIMEOUT,
    });

    console.log('[SMS] API Response:', response.data);

    handleSmsResponse(response.data);
}

// A code is accepted for OTP_VALID_MS. Its record is kept until OTP_RETAIN_MS
// (the TTL index on expiresAt) so that a late or repeated submission can be
// told apart - expired, already used, wrong - instead of every failure
// reading as "no active OTP" and being shown as "Invalid or expired OTP".
// Ten minutes rather than five: DLT-routed SMS in India can take minutes to
// arrive, and a code that expires before it lands is reported as wrong.
const OTP_VALID_MS = 10 * 60 * 1000;
const OTP_RETAIN_MS = 60 * 60 * 1000;

const maskMobile = (mobile = '') => `******${String(mobile).slice(-4)}`;

/**
 * Save OTP to database
 */
async function saveOtpToDb(mobile, otp, userType) {
    const normalizedMobile = normalizeOtpMobile(mobile);
    const now = Date.now();

    await Otp.deleteMany({ mobile: normalizedMobile, userType });
    await Otp.create({
        mobile: normalizedMobile,
        otp: otp.trim(),
        userType,
        validUntil: new Date(now + OTP_VALID_MS),
        expiresAt: new Date(now + OTP_RETAIN_MS),
    });
}

/**
 * Check an OTP and say why it failed.
 * Resolves to { ok: true } or { ok: false, reason, attemptsLeft? } where reason
 * is 'not_found' | 'expired' | 'used' | 'incorrect' | 'locked'.
 */
async function checkOtpFromDb(mobile, otp, userType) {
    const normalizedMobile = normalizeOtpMobile(mobile);
    const tag = `${maskMobile(normalizedMobile)} ${userType}`;

    // Look up by mobile only: a 4-digit OTP is brute-forceable, so wrong guesses must burn attempts.
    const record = await Otp.findOne({ mobile: normalizedMobile, userType }).sort({ createdAt: -1 });

    if (!record) {
        console.error(`OTP check failed [not_found] ${tag} - no code sent in the last hour`);
        return { ok: false, reason: 'not_found' };
    }

    const ageSeconds = Math.round((Date.now() - new Date(record.createdAt).getTime()) / 1000);

    if (record.usedAt) {
        console.error(`OTP check failed [used] ${tag} - code already accepted, sent ${ageSeconds}s ago`);
        return { ok: false, reason: 'used' };
    }

    const validUntil = record.validUntil || record.expiresAt;
    if (validUntil < new Date()) {
        console.error(`OTP check failed [expired] ${tag} - sent ${ageSeconds}s ago`);
        return { ok: false, reason: 'expired' };
    }

    if ((record.attempts || 0) >= MAX_OTP_ATTEMPTS) {
        console.error(`OTP check failed [locked] ${tag} - ${record.attempts} wrong attempts`);
        return { ok: false, reason: 'locked' };
    }

    if (record.otp !== otp.trim()) {
        const updated = await Otp.findOneAndUpdate(
            { _id: record._id },
            { $inc: { attempts: 1 } },
            { new: true }
        );
        const attempts = updated?.attempts || 0;
        console.error(`OTP check failed [incorrect] ${tag} - attempt ${attempts}/${MAX_OTP_ATTEMPTS}, sent ${ageSeconds}s ago`);
        return attempts >= MAX_OTP_ATTEMPTS
            ? { ok: false, reason: 'locked' }
            : { ok: false, reason: 'incorrect', attemptsLeft: MAX_OTP_ATTEMPTS - attempts };
    }

    // Claim atomically: of two simultaneous submissions of the right code only
    // one may succeed. The record is marked, not deleted, so a repeat
    // submission is recognised as already used rather than "not found".
    const claimed = await Otp.findOneAndUpdate(
        { _id: record._id, usedAt: null },
        { $set: { usedAt: new Date() } },
        { new: true }
    );
    if (!claimed) {
        console.error(`OTP check failed [used] ${tag} - claimed by a simultaneous request`);
        return { ok: false, reason: 'used' };
    }

    // Time from send to accepted entry: the SMS delivery delay customers see.
    console.log(`OTP accepted ${tag} after ${ageSeconds}s`);
    return { ok: true };
}

/**
 * Verify OTP from database. Strictly boolean: callers return this value as-is
 * (verifySmsOtp, verifyOTP), so it must never resolve to a truthy object.
 */
async function verifyOtpFromDb(mobile, otp, userType) {
    const result = await checkOtpFromDb(mobile, otp, userType);
    return result.ok === true;
}

/**
 * Check if special bypass should be used
 */
function isSpecialBypass(mobile) {
    return isTestOtpBypassEnabled() && mobile === '9111966732';
}

/**
 * Check if mock mode should be used
 */
function isMockMode() {
    const { apiKey: API_KEY, senderId: SENDER_ID } = getSmsConfig();
    // Log status for clarity
    // console.log('[DEBUG] Mock Check:', { useMock: process.env.USE_MOCK_OTP, hasKey: !!API_KEY, hasSender: !!SENDER_ID });
    return process.env.USE_MOCK_OTP === 'true' || !API_KEY || !SENDER_ID;
}

/**
 * Check if developer bypass OTP
 */
function isDeveloperBypass(otp) {
    return isTestOtpBypassEnabled() && otp === '999999';
}

function isHardcodedLoginMobile(mobile) {
    return isTestOtpBypassEnabled() && HARDCODED_LOGIN_MOBILES.has(normalizeForHardcodedLogin(mobile));
}

// ==========================================
// SMS OTP (Customer / Delivery)
// ==========================================

export async function sendSmsOtp(mobile, userType = 'Delivery') {
    try {
        const otp = generateOTP(4);

        // Special number bypass
        if (isSpecialBypass(mobile)) {
            const specialOtp = '1234';
            await saveOtpToDb(mobile, specialOtp, userType);
            return {
                success: true,
                sessionId: 'DB_VERIFIED_' + mobile,
                message: 'OTP sent successfully',
            };
        }

        // Mock mode
        if (isMockMode()) {
            await saveOtpToDb(mobile, otp, userType);
            console.log(`[MOCK MODE] OTP for ${mobile}: ${otp}`);
            return {
                success: true,
                sessionId: 'MOCK_SESSION_' + mobile,
                message: 'OTP sent successfully',
            };
        }

        // Real mode - Send via SMS India HUB
        await saveOtpToDb(mobile, otp, userType);
        const message = buildOtpMessage(otp);
        await sendSmsViaApi(mobile, message);

        return {
            success: true,
            sessionId: 'DB_VERIFIED_' + mobile,
            message: 'OTP sent successfully',
        };
    } catch (error) {
        const errorMessage = error.message || 'Failed to send OTP. Please try again.';
        console.error('SMS OTP Error (sendSmsOtp):', {
            error: errorMessage,
            mobile,
            userType
        });
        throw new Error(`SMS Service Error: ${errorMessage}`);
    }
}

export async function verifySmsOtp(sessionId, otpInput, mobile, userType = 'Delivery') {
    if (isDeveloperBypass(otpInput)) {
        return true;
    }

    const normalizedOtp = String(otpInput).trim().replace(/\s/g, '');

    if (!normalizedOtp || normalizedOtp.length !== 4) {
        return false;
    }

    let targetMobile = mobile;
    if (!targetMobile && sessionId) {
        if (sessionId.startsWith('DB_VERIFIED_')) {
            targetMobile = sessionId.replace('DB_VERIFIED_', '');
        } else if (sessionId.startsWith('MOCK_SESSION_')) {
            targetMobile = sessionId.replace('MOCK_SESSION_', '');
        }
    }

    if (!targetMobile) {
        return false;
    }

    const normalizedMobile = targetMobile.replace(/\D/g, '');

    if (normalizedMobile.length !== 10) {
        return false;
    }

    return verifyOtpFromDb(normalizedMobile, normalizedOtp, userType);
}

// ==========================================
// SMS OTP (Admin)
// ==========================================

export async function sendOTP(mobile, userType) {
    try {
        if (isHardcodedLoginMobile(mobile)) {
            return { success: true, message: 'OTP sent successfully' };
        }

        const otp = generateOTP(4);

        if (isSpecialBypass(mobile)) {
            const specialOtp = '1234';
            await saveOtpToDb(mobile, specialOtp, userType);
            return { success: true, message: 'OTP sent successfully' };
        }

        if (isMockMode()) {
            await saveOtpToDb(mobile, otp, userType);
            console.log(`[MOCK MODE] OTP for ${mobile} (${userType}): ${otp}`);
            return { success: true, message: 'OTP sent successfully' };
        }

        await saveOtpToDb(mobile, otp, userType);
        const message = buildOtpMessage(otp);
        await sendSmsViaApi(mobile, message);

        return { success: true, message: 'OTP sent successfully' };
    } catch (error) {
        const errorMessage = error.message || 'Failed to send OTP.';
        console.error('SMS OTP Error (sendOTP):', { error: errorMessage, mobile, userType });
        throw new Error(`SMS Service Error: ${errorMessage}`);
    }
}

/**
 * Like verifyOTP, but resolves to { ok, reason, attemptsLeft? } so the caller
 * can tell the customer why a code was refused.
 */
export async function verifyOTPDetailed(mobile, otpInput, userType) {
    if (isDeveloperBypass(otpInput)) return { ok: true };

    const normalizedOtp = normalizeHardcodedOtp(otpInput);
    const normalizedMobile = normalizeForHardcodedLogin(mobile);

    // Must stay env-gated: without this check these numbers log in with 0000 in production.
    if (isHardcodedLoginMobile(normalizedMobile) && normalizedOtp === HARDCODED_LOGIN_OTP) {
        return { ok: true };
    }

    if (!normalizedOtp || normalizedOtp.length !== 4) return { ok: false, reason: 'incorrect' };

    if (normalizedMobile.length !== 10) return { ok: false, reason: 'not_found' };

    return checkOtpFromDb(normalizedMobile, normalizedOtp, userType);
}

export async function verifyOTP(mobile, otpInput, userType) {
    const result = await verifyOTPDetailed(mobile, otpInput, userType);
    return result.ok === true;
}

// ==========================================
// Delivery OTP
// ==========================================

export async function generateDeliveryOtp(orderId, customerPhone) {
    try {
        const order = await Order.findById(orderId);

        if (!order) throw new Error('Order not found');
        if (order.status === 'Delivered') throw new Error('Order is already delivered');

        const otp = String(randomInt(100000, 1000000));

        order.deliveryOtp = otp;
        order.deliveryOtpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
        order.deliveryOtpVerified = false;
        await order.save();

        try {
            // Use SMS India HUB for Delivery OTPs as well
            const appName = process.env.APP_NAME || 'Indian Kart';
            const message = `Welcome to the ${appName} powered by SMSINDIAHUB. Your Delivery OTP for Order #${orderId.slice(-6).toUpperCase()} is ${otp}`;
            
            if (process.env.USE_MOCK_OTP !== 'true') {
                 await sendSmsViaApi(customerPhone, message);
                 console.log(`Delivery OTP sent to ${customerPhone} for order ${orderId}`);
            } else {
                 console.log(`[MOCK MODE] Delivery OTP ${otp} for order ${orderId} to ${customerPhone}`);
            }

        } catch (smsError) {
            console.error('Error sending delivery OTP SMS:', smsError.message);
            // Don't fail the whole request if SMS fails, just log it? 
            // Or maybe we should throw to let the frontend know. 
            // For now, consistent with previous code, we log it but improved logging.
        }

        return { success: true, message: 'Delivery OTP sent successfully to customer' };
    } catch (error) {
        console.error('Error generating delivery OTP:', error);
        throw new Error(error.message || 'Failed to generate delivery OTP');
    }
}

export async function verifyDeliveryOtp(orderId, otp) {
    try {
        const order = await Order.findById(orderId);

        if (!order) throw new Error('Order not found');
        if (!order.deliveryOtp) throw new Error('No delivery OTP generated for this order');
        if (order.deliveryOtpVerified) throw new Error('OTP already verified');
        
        if (order.deliveryOtpExpiresAt && order.deliveryOtpExpiresAt < new Date()) {
             throw new Error('Delivery OTP has expired. Please request a new OTP.');
        }

        if (isDeveloperBypass(otp)) {
             order.deliveryOtpVerified = true;
             order.isDelivered = true;
             order.status = 'Delivered';
             order.deliveredAt = new Date();
             order.invoiceEnabled = true;
             await order.save();
             return { success: true, message: 'OTP verified successfully (Dev Bypass). Order marked as delivered.' };
        }

        if (order.deliveryOtp !== otp) {
            throw new Error('Invalid OTP. Please check and try again.');
        }

        order.deliveryOtpVerified = true;
        order.isDelivered = true;
        order.status = 'Delivered';
        order.deliveredAt = new Date();
        order.invoiceEnabled = true;
        await order.save();

        return { success: true, message: 'OTP verified successfully. Order marked as delivered.' };
    } catch (error) {
        console.error('Error verifying delivery OTP:', error);
        throw new Error(error.message || 'Failed to verify delivery OTP');
    }
}
