import { createJSONStorage } from 'zustand/middleware';

// Everything under this prefix is a re-fetchable cache, safe to throw away.
export const DISPOSABLE_CACHE_PREFIX = 'ik-cache-v1:';

export const purgeDisposableCache = (keyPrefix = DISPOSABLE_CACHE_PREFIX) => {
    try {
        const doomed = [];
        for (let i = 0; i < localStorage.length; i += 1) {
            const key = localStorage.key(i);
            if (key && key.startsWith(keyPrefix)) doomed.push(key);
        }
        doomed.forEach((key) => localStorage.removeItem(key));
        return doomed.length;
    } catch {
        return 0;
    }
};

// A full localStorage made setItem throw QuotaExceededError right after the
// server had accepted an OTP, so the login never completed and the customer,
// still on the OTP screen, retried a code that was already used ("wrong OTP").
// Writes that matter must never throw: on failure, drop the disposable cache
// and try once more; if that still fails, carry on without persisting.
export const safeSetItem = (key, value) => {
    try {
        localStorage.setItem(key, value);
        return true;
    } catch {
        purgeDisposableCache();
        try {
            localStorage.setItem(key, value);
            return true;
        } catch {
            return false;
        }
    }
};

export const safeRemoveItem = (key) => {
    try {
        localStorage.removeItem(key);
    } catch {
        // Storage unavailable; nothing to remove.
    }
};

export const safeGetItem = (key) => {
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
};

// zustand's persist writes inside set(), so a throwing setItem would make the
// state update itself throw. Use this for every persisted store.
export const safePersistStorage = createJSONStorage(() => ({
    getItem: safeGetItem,
    setItem: safeSetItem,
    removeItem: safeRemoveItem
}));
