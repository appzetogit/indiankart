// Self-check for courier status -> internal step mapping. Run: node scripts/check_tracking_map.js
import assert from 'assert';
import { __testables as ekart } from '../utils/ekartService.js';

const cases = [
    ['DELIVERED', 'Delivered'],
    ['Shipment Delivered', 'Delivered'],
    ['delivery_success', ''],
    ['Out For Delivery', 'Out for Delivery'],
    ['out-for-delivery', 'Out for Delivery'],
    ['Not Picked', 'Not Picked'],
    ['random noise', '']
];

for (const [raw, expected] of cases) {
    assert.strictEqual(ekart.getMappedTrackingStep(raw), expected, `${raw} -> expected ${expected}`);
}

console.log('tracking map OK');
