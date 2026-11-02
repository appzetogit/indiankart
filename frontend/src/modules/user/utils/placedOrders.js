// A checkout creates one order per cart line. POST /orders (and the redirect
// checkout status) return the first order plus every order of the checkout in
// `checkoutGroup.orders`; older responses are a single order.
export const getPlacedOrders = (data) => {
    const groupOrders = data?.checkoutGroup?.orders;
    return Array.isArray(groupOrders) && groupOrders.length ? groupOrders : [data];
};

// Where to send the customer after checkout: the order itself, or the order
// list when the checkout created several.
export const placedOrdersPath = (data) => {
    const orders = getPlacedOrders(data);
    if (orders.length > 1) return '/my-orders';
    return `/my-orders/${orders[0]?._id || orders[0]?.id}`;
};
