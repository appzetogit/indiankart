import { refreshActiveOrderStatuses } from '../controllers/orderController.js';

// Keeps courier and payment status of open orders current without anyone
// opening the order page (which no longer waits for these lookups). Runs on
// the instance that runs the payment reconciler.
let timer = null;
let running = false;

export const startOrderStatusSync = ({ intervalMs = 15 * 60 * 1000 } = {}) => {
    if (timer) return;
    const tick = async () => {
        if (running) return;
        running = true;
        try {
            const result = await refreshActiveOrderStatuses();
            if (result.checked) {
                console.log(`[order-sync] checked ${result.checked} open order(s), ${result.paymentUpdates} payment update(s)`);
            }
        } catch (error) {
            console.error('[order-sync] pass failed:', error.message);
        } finally {
            running = false;
        }
    };
    timer = setInterval(tick, intervalMs);
    timer.unref?.();
    setTimeout(tick, 60 * 1000).unref?.();
    console.log(`[order-sync] refreshing open orders every ${Math.round(intervalMs / 60000)} min`);
};
