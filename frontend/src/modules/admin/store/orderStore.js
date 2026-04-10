import { create } from 'zustand';
import API from '../../../services/api';
import { getAdminPaymentStatus } from '../utils/paymentStatus';

const transformOrder = (order, note = '') => {
    const gatewayStatus = String(order.paymentResult?.status || '').trim().toLowerCase();

    return {
        ...order,
        id: order._id,
        displayId: order.displayId,
        invoiceNumber: order.invoiceNumber,
        transactionId: order.transactionId,
        date: order.createdAt,
        items: order.orderItems?.map(item => ({
            id: item.product,
            _id: item._id,
            name: item.name,
            title: item.title,
            productName: item.productName,
            image: item.image,
            price: item.price,
            quantity: item.qty,
            qty: item.qty,
            variant: item.variant,
            sku: item.sku,
            skuId: item.skuId,
            serialNumber: item.serialNumber,
            serialType: item.serialType
        })) || [],
        total: order.totalPrice,
        itemsPrice: order.itemsPrice ?? 0,
        shippingPrice: order.shippingPrice ?? 0,
        taxPrice: order.taxPrice ?? 0,
        paymentGatewayStatus: gatewayStatus,
        payment: {
            method: order.paymentMethod === 'COD' ? 'COD' : order.paymentMethod,
            status: getAdminPaymentStatus(order),
            transactionId: order.transactionId || order.paymentResult?.razorpay_order_id || order.paymentResult?.id,
            cardType: order.paymentResult?.card_type,
            cardNetwork: order.paymentResult?.card_network,
            cardLast4: order.paymentResult?.card_last4
        },
        address: {
            name: order.user?.name || 'N/A',
            line: order.shippingAddress?.street || '',
            city: order.shippingAddress?.city || '',
            state: order.shippingAddress?.state || '',
            pincode: order.shippingAddress?.postalCode || '',
            type: 'Home'
        },
        timeline: [
            {
                status: order.status,
                time: order.updatedAt || order.createdAt,
                note: note || ''
            }
        ]
    };
};

const useOrderStore = create((set) => ({
    orders: [],
    isLoading: false,
    error: null,

    fetchOrders: async () => {
        set({ isLoading: true });
        try {
            const { data } = await API.get('/orders');
            const transformedOrders = data.map(order => transformOrder(order));
            set({ orders: transformedOrders, isLoading: false });
        } catch (error) {
            set({ 
                error: error.response?.data?.message || error.message, 
                isLoading: false 
            });
        }
    },

    updateOrderStatus: async (id, status, note, serialNumbers) => {
        set({ isLoading: true });
        try {
            const { data } = await API.put(`/orders/${id}/status`, { status, serialNumbers });
            const transformedOrder = transformOrder(data, note);
            set((state) => ({
                orders: state.orders.map(o => o.id === id ? transformedOrder : o),
                isLoading: false
            }));
            return transformedOrder;
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            set({ 
                error: errorMessage, 
                isLoading: false 
            });
            throw error;
        }
    },

    cancelOrder: async (id, note) => {
        set({ isLoading: true });
        try {
            const { data } = await API.put(`/orders/${id}/status`, { status: 'Cancelled' });
            const transformedOrder = transformOrder(data, note);
            set((state) => ({
                orders: state.orders.map(o => o.id === id ? transformedOrder : o),
                isLoading: false
            }));
            return transformedOrder;
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            set({ 
                error: errorMessage, 
                isLoading: false 
            });
            throw error;
        }
    },

    assignOrderFulfillment: async (id, mode) => {
        set({ isLoading: true });
        try {
            const { data } = await API.put(`/orders/${id}/fulfillment`, { mode });
            const transformedOrder = transformOrder(data);
            set((state) => ({
                orders: state.orders.some((order) => order.id === id)
                    ? state.orders.map((order) => order.id === id ? transformedOrder : order)
                    : [...state.orders, transformedOrder],
                isLoading: false
            }));
            return transformedOrder;
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            set({
                error: errorMessage,
                isLoading: false
            });
            throw error;
        }
    },

    getOrderDetails: async (id) => {
        set({ isLoading: true });
        try {
            const { data } = await API.get(`/orders/${id}`);
            const transformedOrder = transformOrder(data);

            set((state) => {
                const existingOrderIndex = state.orders.findIndex(o => o.id === id);
                if (existingOrderIndex !== -1) {
                    const newOrders = [...state.orders];
                    newOrders[existingOrderIndex] = transformedOrder;
                    return { orders: newOrders, isLoading: false };
                } else {
                    return { orders: [...state.orders, transformedOrder], isLoading: false };
                }
            });
        } catch (error) {
            set({ 
                error: error.response?.data?.message || error.message, 
                isLoading: false 
            });
        }
    }
}));

export default useOrderStore;
