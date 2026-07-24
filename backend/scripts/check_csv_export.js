// Self-check for order-export CSV cell encoding. Run: node scripts/check_csv_export.js
import assert from 'assert';
import { __testables } from '../controllers/orderController.js';

const { escapeCsvCell, asCsvText } = __testables;
const cell = (value) => escapeCsvCell(asCsvText(value));

// A 15-digit IMEI must survive as text, not become 8.61234E+14.
assert.strictEqual(cell('861234567890123'), '"=""861234567890123"""');
// Waybills / alphanumeric serials too.
assert.strictEqual(cell('SN-00042A'), '"=""SN-00042A"""');
// Empty stays empty rather than an empty formula.
assert.strictEqual(cell(''), '');
// Values with unsafe characters are never wrapped as a formula...
assert.strictEqual(asCsvText('=cmd|calc'), '=cmd|calc');
// ...and get neutralised on the way out.
assert.strictEqual(escapeCsvCell('=cmd|calc'), "'=cmd|calc");
assert.strictEqual(escapeCsvCell('@SUM(A1)'), "'@SUM(A1)");
// Ordinary text and real numbers are left alone.
assert.strictEqual(escapeCsvCell('Redmi Note 13'), 'Redmi Note 13');
assert.strictEqual(escapeCsvCell('Bag, large'), '"Bag, large"');
assert.strictEqual(escapeCsvCell(3), '3');
assert.strictEqual(escapeCsvCell(-50.5), '-50.5');

console.log('csv export encoding OK');
