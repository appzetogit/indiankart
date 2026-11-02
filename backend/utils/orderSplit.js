// A checkout becomes one order per cart line. Checkout-wide amounts (shipping,
// coupon discount, COD advance, referral commission) are shared out between
// those orders here, so each order carries its own part and refunds or
// invoices of one order never touch the others.

const toPaise = (amount) => Math.round((Number(amount) || 0) * 100);
const toRupees = (paise) => Number((paise / 100).toFixed(2));

// Splits `total` (in rupees) in proportion to `weights`. Works in paise with
// the largest-remainder method, so the parts always add up to exactly `total`
// and no part is negative or larger than its fair share rounded up.
export const allocateByWeight = (total, weights) => {
    const totalPaise = toPaise(total);
    const safeWeights = weights.map((weight) => Math.max(0, Number(weight) || 0));
    const weightSum = safeWeights.reduce((sum, weight) => sum + weight, 0);

    if (!weights.length) return [];
    if (totalPaise <= 0) return weights.map(() => 0);

    // No usable weights: split evenly.
    const shares = weightSum > 0
        ? safeWeights.map((weight) => (totalPaise * weight) / weightSum)
        : safeWeights.map(() => totalPaise / weights.length);

    const parts = shares.map(Math.floor);
    let leftover = totalPaise - parts.reduce((sum, part) => sum + part, 0);
    const byRemainder = shares
        .map((share, index) => ({ index, remainder: share - Math.floor(share) }))
        .sort((a, b) => b.remainder - a.remainder || a.index - b.index);
    for (let i = 0; leftover > 0; i = (i + 1) % byRemainder.length, leftover--) {
        parts[byRemainder[i].index] += 1;
    }

    return parts.map(toRupees);
};

// Returns one pricing block per order line, in the same order as `lines`.
// Each `line` needs `price` and `qty`.
export const splitCheckoutAmounts = ({
    lines,
    shippingPrice = 0,
    coupon = null,
    codAdvancedAmount = 0,
    codAdvancedActive = false,
    referral = null
}) => {
    const lineValues = lines.map((line) => toRupees(toPaise(Number(line.price) * Number(line.qty))));
    const shippingParts = allocateByWeight(shippingPrice, lineValues);
    const discountParts = allocateByWeight(coupon?.discount || 0, lineValues);
    const totals = lineValues.map((value, index) =>
        toRupees(Math.max(0, toPaise(value) + toPaise(shippingParts[index]) - toPaise(discountParts[index])))
    );
    const advanceParts = allocateByWeight(codAdvancedActive ? codAdvancedAmount : 0, totals);
    const commissionParts = allocateByWeight(referral?.commissionAmount || 0, lineValues);

    return lines.map((line, index) => ({
        itemsPrice: lineValues[index],
        shippingPrice: shippingParts[index],
        taxPrice: 0,
        totalPrice: totals[index],
        coupon: coupon
            ? { code: coupon.code, type: coupon.type, discount: discountParts[index] }
            : null,
        codAdvancedAmount: advanceParts[index],
        remainingCodBalance: codAdvancedActive
            ? toRupees(Math.max(0, toPaise(totals[index]) - toPaise(advanceParts[index])))
            : totals[index],
        referral: referral
            ? { ...referral, commissionAmount: commissionParts[index] }
            : null
    }));
};
