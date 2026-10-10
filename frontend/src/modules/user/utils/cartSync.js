import API from '../../../services/api';
import { useCartStore } from '../store/cartStore';

// Keeps the cart, wishlist and saved-for-later in step with the server so they
// follow the account across devices (they used to live only in this browser's
// storage, so a cart filled on the phone was empty on the laptop).
//
// - On sign-in the server copy is loaded. The first time this browser syncs for
//   this account, whatever it already held is merged in, so nothing is lost.
// - Every change is saved shortly afterwards.
// - Coming back to the tab re-reads the server, picking up other devices' edits.
// Nothing is ever sent until the server copy has been read, so a failed load
// cannot overwrite a cart saved from another device.

const OWNER_KEY = 'ik_cart_owner';
const DIRTY_KEY = 'ik_cart_unsynced';
const PUSH_DELAY_MS = 800;

let activeUserId = null;
let unsubscribe = null;
let pushTimer = null;
let applyingServer = false;
let starting = null;

const storage = {
    get: (key) => { try { return localStorage.getItem(key); } catch { return null; } },
    set: (key, value) => { try { localStorage.setItem(key, value); } catch { /* ignore */ } },
    remove: (key) => { try { localStorage.removeItem(key); } catch { /* ignore */ } },
};

const lineKey = (item) => `${item?.id}|${JSON.stringify(item?.variant || {})}`;

const toPayload = (list = []) => list.map((item) => ({
    id: item.id,
    variant: item.variant || {},
    quantity: item.quantity || 1,
    image: item.image,
    addedAt: item.addedAt,
}));

// Server lines carry live prices; keep them, add anything only this browser had.
const mergeLists = (serverList = [], localList = []) => {
    const merged = new Map(serverList.map((item) => [lineKey(item), item]));
    localList.forEach((item) => {
        const key = lineKey(item);
        const existing = merged.get(key);
        if (!existing) {
            merged.set(key, item);
        } else if ((item.quantity || 1) > (existing.quantity || 1)) {
            merged.set(key, { ...existing, quantity: item.quantity });
        }
    });
    return [...merged.values()];
};

const sameLines = (a = [], b = []) => {
    if (a.length !== b.length) return false;
    const keys = new Set(a.map((item) => `${lineKey(item)}#${item.quantity || 1}`));
    return b.every((item) => keys.has(`${lineKey(item)}#${item.quantity || 1}`));
};

const applyServerState = ({ cart = [], wishlist = [], savedForLater = [] }) => {
    applyingServer = true;
    try {
        useCartStore.setState({ cart, wishlist, savedForLater });
    } finally {
        applyingServer = false;
    }
};

const push = async () => {
    clearTimeout(pushTimer);
    pushTimer = null;
    const userId = activeUserId;
    if (!userId) return;
    const { cart, wishlist, savedForLater } = useCartStore.getState();
    try {
        const { data } = await API.put('/cart', {
            cart: toPayload(cart),
            wishlist: toPayload(wishlist),
            savedForLater: toPayload(savedForLater),
        });
        if (activeUserId === userId && !pushTimer) storage.remove(DIRTY_KEY);
        return data;
    } catch {
        // Stays marked unsynced; retried on the next change or tab focus.
        return null;
    }
};

const schedulePush = () => {
    storage.set(DIRTY_KEY, String(activeUserId));
    clearTimeout(pushTimer);
    pushTimer = setTimeout(push, PUSH_DELAY_MS);
};

const refreshFromServer = async () => {
    const userId = activeUserId;
    if (!userId || document.visibilityState === 'hidden') return;
    if (pushTimer || storage.get(DIRTY_KEY) === String(userId)) {
        await push();
        return;
    }
    try {
        const { data } = await API.get('/cart');
        if (activeUserId === userId && !pushTimer) applyServerState(data);
    } catch {
        // Keep what is on screen.
    }
};

const onVisible = () => {
    if (document.visibilityState === 'visible') refreshFromServer();
};

export const stopCartSync = () => {
    clearTimeout(pushTimer);
    pushTimer = null;
    unsubscribe?.();
    unsubscribe = null;
    activeUserId = null;
    starting = null;
    window.removeEventListener('focus', refreshFromServer);
    document.removeEventListener('visibilitychange', onVisible);
};

// Send a change that is still waiting (e.g. just before signing out).
export const flushCartSync = async () => {
    if (pushTimer && activeUserId) await push();
};

// Call on sign-out, before the local cart is wiped.
export const endCartSyncForSignOut = () => {
    stopCartSync();
    storage.remove(OWNER_KEY);
    storage.remove(DIRTY_KEY);
};

export const startCartSync = async (userId) => {
    const id = String(userId || '');
    if (!id) return;
    if (activeUserId === id && (unsubscribe || starting)) return;
    stopCartSync();
    activeUserId = id;

    starting = (async () => {
        let server;
        try {
            ({ data: server } = await API.get('/cart'));
        } catch {
            // Could not read the saved cart: do not sync this session rather
            // than risk overwriting it. Retried on the next sign-in/page load.
            if (activeUserId === id) activeUserId = null;
            return;
        }
        if (activeUserId !== id) return;

        const local = useCartStore.getState();
        const owner = storage.get(OWNER_KEY);
        const ownedHere = owner === id;
        const unsyncedHere = storage.get(DIRTY_KEY) === id;

        if (ownedHere && unsyncedHere) {
            // This browser changed the cart offline; its copy wins.
            await push();
        } else if (ownedHere) {
            applyServerState(server);
        } else if (owner) {
            // Left behind by another account on this browser: never merge it.
            applyServerState(server);
            storage.set(OWNER_KEY, id);
            storage.remove(DIRTY_KEY);
        } else {
            // A cart from before syncing existed (or a fresh browser): keep it.
            const merged = {
                cart: mergeLists(server.cart, local.cart),
                wishlist: mergeLists(server.wishlist, local.wishlist),
                savedForLater: mergeLists(server.savedForLater, local.savedForLater),
            };
            applyServerState(merged);
            storage.set(OWNER_KEY, id);
            const changed = !sameLines(merged.cart, server.cart)
                || !sameLines(merged.wishlist, server.wishlist)
                || !sameLines(merged.savedForLater, server.savedForLater);
            if (changed) {
                // Nothing can have changed locally yet (not subscribed), so the
                // server's reply, with live prices, can replace the merged copy.
                const saved = await push();
                if (saved && activeUserId === id) applyServerState(saved);
            }
        }
        if (activeUserId !== id) return;

        unsubscribe = useCartStore.subscribe((state, previous) => {
            if (applyingServer || activeUserId !== id) return;
            if (state.cart !== previous.cart
                || state.wishlist !== previous.wishlist
                || state.savedForLater !== previous.savedForLater) {
                schedulePush();
            }
        });
        window.addEventListener('focus', refreshFromServer);
        document.addEventListener('visibilitychange', onVisible);
    })();

    try {
        await starting;
    } finally {
        starting = null;
    }
};
