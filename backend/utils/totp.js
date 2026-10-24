import crypto from 'node:crypto';

// Time-based one-time codes (RFC 6238), the 6-digit codes shown by Google
// Authenticator, Microsoft Authenticator, Authy and similar apps.

const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const STEP_SECONDS = 30;

const base32Encode = (buffer) => {
    let bits = 0; let value = 0; let out = '';
    for (const byte of buffer) {
        value = (value << 8) | byte; bits += 8;
        while (bits >= 5) { out += BASE32[(value >>> (bits - 5)) & 31]; bits -= 5; }
    }
    if (bits > 0) out += BASE32[(value << (5 - bits)) & 31];
    return out;
};

const base32Decode = (text) => {
    const clean = String(text || '').toUpperCase().replace(/[^A-Z2-7]/g, '');
    let bits = 0; let value = 0; const out = [];
    for (const char of clean) {
        value = (value << 5) | BASE32.indexOf(char); bits += 5;
        if (bits >= 8) { out.push((value >>> (bits - 8)) & 255); bits -= 8; }
    }
    return Buffer.from(out);
};

export const generateTotpSecret = () => base32Encode(crypto.randomBytes(20));

const codeForCounter = (secret, counter) => {
    const buf = Buffer.alloc(8);
    buf.writeBigUInt64BE(BigInt(counter));
    const hmac = crypto.createHmac('sha1', base32Decode(secret)).update(buf).digest();
    const offset = hmac[hmac.length - 1] & 0xf;
    const binary = ((hmac[offset] & 0x7f) << 24) | (hmac[offset + 1] << 16) | (hmac[offset + 2] << 8) | hmac[offset + 3];
    return String(binary % 1_000_000).padStart(6, '0');
};

/**
 * Checks a 6-digit code, allowing one step of clock drift either way.
 * Returns the matching time step (so a code can't be used twice), or null.
 */
export const verifyTotp = (secret, code, { now = Date.now(), lastUsedCounter = -1 } = {}) => {
    const clean = String(code || '').replace(/\s/g, '');
    if (!/^\d{6}$/.test(clean) || !secret) return null;
    const current = Math.floor(now / 1000 / STEP_SECONDS);
    for (const counter of [current - 1, current, current + 1]) {
        if (counter <= lastUsedCounter) continue;
        const expected = codeForCounter(secret, counter);
        if (crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(clean))) return counter;
    }
    return null;
};

export const totpUri = ({ secret, account, issuer = 'IndianKart Admin' }) =>
    `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=${STEP_SECONDS}`;

// ---- Secret storage: AES-256-GCM, key from ADMIN_MFA_KEY -------------------
const getKey = () => {
    const configured = process.env.ADMIN_MFA_KEY;
    if (configured) {
        const key = Buffer.from(configured, 'base64');
        if (key.length === 32) return key;
    }
    // Fallback so a missing key never stores secrets in plain text.
    return crypto.createHash('sha256').update(`admin-mfa:${process.env.JWT_SECRET || ''}`).digest();
};

export const encryptSecret = (plain) => {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv);
    const data = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
    return `v1:${iv.toString('base64')}:${cipher.getAuthTag().toString('base64')}:${data.toString('base64')}`;
};

export const decryptSecret = (stored) => {
    if (!stored || !String(stored).startsWith('v1:')) return null;
    try {
        const [, iv, tag, data] = String(stored).split(':');
        const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), Buffer.from(iv, 'base64'));
        decipher.setAuthTag(Buffer.from(tag, 'base64'));
        return Buffer.concat([decipher.update(Buffer.from(data, 'base64')), decipher.final()]).toString('utf8');
    } catch {
        return null;
    }
};

// ---- Recovery codes --------------------------------------------------------
export const generateRecoveryCodes = (count = 10) =>
    Array.from({ length: count }, () => {
        const raw = base32Encode(crypto.randomBytes(6)).slice(0, 10);
        return `${raw.slice(0, 5)}-${raw.slice(5)}`;
    });

export const hashRecoveryCode = (code) =>
    crypto.createHash('sha256').update(String(code || '').toUpperCase().replace(/[^A-Z2-7]/g, '')).digest('hex');
