// Admin account protections: password rule (and, below, login lockout).

const COMMON_PASSWORDS = new Set([
    '123456789012', 'password1234', 'password@123', 'admin@123456', 'admin1234567',
    'qwerty123456', 'welcome@1234', 'indiankart123', 'indiankart@123', 'india@123456',
    'flipkart@123', '1234567890ab', 'abcdef123456', 'letmein12345', 'iloveyou1234',
]);

/** Returns a message saying what's wrong with an admin password, or '' if it's fine. */
export const getAdminPasswordProblem = (password, { name = '', email = '', username = '' } = {}) => {
    if (typeof password !== 'string') return 'Password is required';
    const value = password.trim();
    if (value.length < 12) return 'Admin passwords must be at least 12 characters';
    if (value.length > 128) return 'Password is too long';
    if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) return 'Use both letters and numbers in the password';
    const lower = value.toLowerCase();
    if (COMMON_PASSWORDS.has(lower)) return 'This password is too common. Choose another one';
    const personal = [name, username, String(email).split('@')[0]]
        .map((part) => String(part || '').toLowerCase().trim())
        .filter((part) => part.length >= 4);
    if (personal.some((part) => lower.includes(part))) return "Don't use your name or email in the password";
    return '';
};

// ---- Login lockout -------------------------------------------------------
// Failed admin logins are counted on the account itself (shared by every
// backend instance). After MAX failures the account is locked for LOCK_MS;
// the lock lifts on its own or when a superadmin resets the password.
export const ADMIN_MAX_FAILED_LOGINS = 5;
export const ADMIN_LOCK_MS = 15 * 60 * 1000;

export const isAdminLocked = (admin) => Boolean(admin?.lockedUntil && new Date(admin.lockedUntil).getTime() > Date.now());
