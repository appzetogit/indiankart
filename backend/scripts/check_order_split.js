// Self-check for splitting one checkout into one order per cart line.
// Run: node scripts/check_order_split.js
import assert from 'assert';
import { allocateByWeight, splitCheckoutAmounts } from '../utils/orderSplit.js';

const paise = (amount) => Math.round(amount * 100);
const sumPaise = (values) => values.reduce((sum, value) => sum + paise(value), 0);

// Parts always add up to exactly the total, even when it does not divide evenly.
assert.deepStrictEqual(allocateByWeight(40, [1, 1, 1]), [13.34, 13.33, 13.33]);
assert.strictEqual(sumPaise(allocateByWeight(99.99, [3, 7, 11, 13])), paise(99.99));
assert.deepStrictEqual(allocateByWeight(0, [5, 5]), [0, 0]);
assert.deepStrictEqual(allocateByWeight(10, [0, 0]), [5, 5]);
assert.deepStrictEqual(allocateByWeight(10, []), []);

// Three lines, shipping, a coupon, a referral: every amount sums back to the checkout.
const lines = [
    { price: 499, qty: 1 },
    { price: 1299.5, qty: 2 },
    { price: 89, qty: 3 }
];
const itemsPrice = 499 + 2599 + 267;
const coupon = { code: 'SAVE10', type: 'percentage', discount: 336.5 };
const referral = { code: 'AG1', commissionPercent: 2, commissionAmount: 67.3 };
const shippingPrice = 40;
const totalPrice = itemsPrice + shippingPrice - coupon.discount;

const online = splitCheckoutAmounts({ lines, shippingPrice, coupon, referral });
assert.strictEqual(online.length, 3);
assert.deepStrictEqual(online.map((part) => part.itemsPrice), [499, 2599, 267]);
assert.strictEqual(sumPaise(online.map((part) => part.shippingPrice)), paise(shippingPrice));
assert.strictEqual(sumPaise(online.map((part) => part.coupon.discount)), paise(coupon.discount));
assert.strictEqual(sumPaise(online.map((part) => part.referral.commissionAmount)), paise(referral.commissionAmount));
assert.strictEqual(sumPaise(online.map((part) => part.totalPrice)), paise(totalPrice));
online.forEach((part) => {
    assert.strictEqual(paise(part.totalPrice), paise(part.itemsPrice) + paise(part.shippingPrice) - paise(part.coupon.discount));
    assert.strictEqual(part.coupon.code, 'SAVE10');
    assert.strictEqual(part.referral.commissionPercent, 2);
    // Not COD-advance: the whole order total is the balance, as before.
    assert.strictEqual(part.remainingCodBalance, part.totalPrice);
    assert.strictEqual(part.codAdvancedAmount, 0);
});

// COD with an advance: advance + balance add up per order and overall.
const cod = splitCheckoutAmounts({ lines, shippingPrice, codAdvancedActive: true, codAdvancedAmount: 100 });
assert.strictEqual(sumPaise(cod.map((part) => part.codAdvancedAmount)), paise(100));
cod.forEach((part) => {
    assert.ok(part.codAdvancedAmount <= part.totalPrice);
    assert.strictEqual(paise(part.codAdvancedAmount) + paise(part.remainingCodBalance), paise(part.totalPrice));
    assert.strictEqual(part.coupon, null);
    assert.strictEqual(part.referral, null);
});

// A single-line cart is unchanged: it carries every amount itself.
const [single] = splitCheckoutAmounts({ lines: [{ price: 250, qty: 2 }], shippingPrice: 40, coupon: { code: 'X', type: 'flat', discount: 50 } });
assert.deepStrictEqual(
    { itemsPrice: single.itemsPrice, shippingPrice: single.shippingPrice, totalPrice: single.totalPrice, discount: single.coupon.discount },
    { itemsPrice: 500, shippingPrice: 40, totalPrice: 490, discount: 50 }
);

console.log('order split checks passed');
