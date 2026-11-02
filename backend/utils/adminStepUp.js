import Admin from '../models/Admin.js';
import { verifyTotp, decryptSecret } from './totp.js';
import { isAdminLocked, ADMIN_MAX_FAILED_LOGINS, ADMIN_LOCK_MS } from './adminSecurity.js';

// Fresh authenticator code for a risky admin action (changing payment or
// courier credentials). A stolen admin session alone is then not enough to
// point customer payments at someone else's Razorpay account.
// Wrong codes count towards the same lockout as failed logins, so the six
// digits can't be guessed by retrying.

const LOCKED_MESSAGE = 'Too many failed attempts. This account is locked for 15 minutes.';

const fail = (status, code, message) => ({ ok: false, status, code, message });

export const verifyAdminActionCode = async (adminId, rawCode) => {
    const adminDoc = await Admin.findById(adminId).select('+mfaSecret +mfaLastCounter');
    if (!adminDoc) {
        return fail(403, 'ACTION_CODE_UNAVAILABLE', 'Admin account not found');
    }
    if (!adminDoc.mfaEnabled) {
        return fail(403, 'ACTION_MFA_NOT_ENABLED', 'Turn on two-step login for your account before changing payment or courier credentials.');
    }
    if (isAdminLocked(adminDoc)) {
        return fail(429, 'ACCOUNT_LOCKED', LOCKED_MESSAGE);
    }

    const code = String(rawCode ?? '').replace(/\s/g, '');
    if (!code) {
        return fail(403, 'ACTION_CODE_REQUIRED', 'Enter the 6-digit code from your authenticator app to change credentials.');
    }

    const counter = /^\d{6}$/.test(code)
        ? verifyTotp(decryptSecret(adminDoc.mfaSecret), code, { lastUsedCounter: adminDoc.mfaLastCounter ?? -1 })
        : null;

    // Claim the code atomically so it can't be used twice (here or at login).
    if (counter !== null) {
        const claimed = await Admin.updateOne(
            { _id: adminDoc._id, $or: [{ mfaLastCounter: { $lt: counter } }, { mfaLastCounter: { $exists: false } }] },
            { $set: { mfaLastCounter: counter, failedLoginCount: 0 } }
        );
        if (claimed.modifiedCount === 1) {
            return { ok: true };
        }
    }

    const failed = (adminDoc.failedLoginCount || 0) + 1;
    const locked = failed >= ADMIN_MAX_FAILED_LOGINS;
    await Admin.updateOne({ _id: adminDoc._id }, {
        $set: locked
            ? { failedLoginCount: 0, lockedUntil: new Date(Date.now() + ADMIN_LOCK_MS) }
            : { failedLoginCount: failed }
    });
    if (locked) {
        console.warn(`[admin-action] account ${adminDoc._id} locked after ${ADMIN_MAX_FAILED_LOGINS} wrong action codes`);
        return fail(429, 'ACCOUNT_LOCKED', LOCKED_MESSAGE);
    }
    return fail(403, 'ACTION_CODE_INVALID', 'That code is not correct. Check the time on your phone and try again.');
};
