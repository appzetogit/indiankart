// Keep in sync with GST_RATES / DEFAULT_GST_RATE in backend/models/Product.js.
export const GST_RATES = [0, 5, 12, 18, 28];
export const DEFAULT_GST_RATE = 18;

// Older orders were placed before rates were stored per item; they were all 18%.
export const getItemGstRate = (item) => {
    const rate = Number(item?.gstRate);
    return GST_RATES.includes(rate) ? rate : DEFAULT_GST_RATE;
};
