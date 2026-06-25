const DEFAULT_TTL_MS = 2 * 60 * 1000;

const memoryCache = new Map();

const isFresh = (entry, ttlMs) => (
    entry &&
    (Date.now() - entry.fetchedAt) < ttlMs
);

export const getAdminListCache = (key, ttlMs = DEFAULT_TTL_MS) => {
    const entry = memoryCache.get(key);
    if (!isFresh(entry, ttlMs)) {
        if (entry) {
            memoryCache.delete(key);
        }
        return null;
    }

    return entry.value;
};

export const setAdminListCache = (key, value) => {
    memoryCache.set(key, {
        value,
        fetchedAt: Date.now()
    });
    return value;
};

export const clearAdminListCache = (keyPrefix = '') => {
    if (!keyPrefix) {
        memoryCache.clear();
        return;
    }

    for (const key of memoryCache.keys()) {
        if (String(key).startsWith(keyPrefix)) {
            memoryCache.delete(key);
        }
    }
};

