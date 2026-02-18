import { create } from 'zustand';
import API from '../../../services/api';

const useOrderStore = create((set) => ({
    orders: [],
    isLoading: false,
    error: null,

    fetchOrders: async () => {
        set({ isLoading: true });
        try {
            const { data } = await API.get('/orders');
            // Transform backend data to match frontend structure
            const transformedOrders = data.map(order => ({
                ...order,
                id: order._id,
                displayId: order.displayId,
                transactionId: order.transactionId,
                date: order.createdAt,
                items: order.orderItems?.map(item => ({
                    id: item.product,
                    _id: item._id, // Order Item Subdocument ID
                    name: item.name,
                    image: item.image,
                    price: item.price,
                    quantity: item.qty,
                    serialNumber: item.serialNumber, // Mapping Serial Number
                    serialType: item.serialType // Mapping Serial Type
                })) || [],
                total: order.totalPrice,
                payment: {
                    method: order.paymentMethod === 'COD' ? 'COD' : order.paymentMethod,
                    status: order.isPaid ? 'Paid' : 'Pending',
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
                        note: ''
                    }
                ]
            }));
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
            // Transform the updated order
            const transformedOrder = {
                ...data,
                id: data._id,
                displayId: data.displayId,
                transactionId: data.transactionId,
                date: data.createdAt,
                items: data.orderItems?.map(item => ({
                    id: item.product,
                    _id: item._id, // Order Item Subdocument ID
                    name: item.name,
                    image: item.image,
                    price: item.price,
                    quantity: item.qty,
                    serialNumber: item.serialNumber, // Mapping Serial Number
                    serialType: item.serialType // Mapping Serial Type
                })) || [],
                total: data.totalPrice,
                payment: {
                    method: data.paymentMethod === 'COD' ? 'COD' : data.paymentMethod,
                    status: data.isPaid ? 'Paid' : 'Pending',
                    transactionId: data.transactionId || data.paymentResult?.razorpay_order_id || data.paymentResult?.id,
                    cardType: data.paymentResult?.card_type,
                    cardNetwork: data.paymentResult?.card_network,
                    cardLast4: data.paymentResult?.card_last4
                },
                address: {
                    name: data.user?.name || 'N/A',
                    line: data.shippingAddress?.street || '',
                    city: data.shippingAddress?.city || '',
                    state: data.shippingAddress?.state || '',
                    pincode: data.shippingAddress?.postalCode || '',
                    type: 'Home'
                },
                timeline: [
                    {
                        status: data.status,
                        time: data.updatedAt || data.createdAt,
                        note: note || ''
                    }
                ]
            };
            set((state) => ({
                orders: state.orders.map(o => o.id === id ? transformedOrder : o),
                isLoading: false
            }));
        } catch (error) {
            set({ 
                error: error.response?.data?.message || error.message, 
                isLoading: false 
            });
        }
    },

    cancelOrder: async (id, note) => {
        set({ isLoading: true });
        try {
            const { data } = await API.put(`/orders/${id}/status`, { status: 'Cancelled' });
            const transformedOrder = {
                ...data,
                id: data._id,
                displayId: data.displayId,
                transactionId: data.transactionId,
                date: data.createdAt,
                items: data.orderItems?.map(item => ({
                    id: item.product,
                    _id: item._id, // Order Item Subdocument ID
                    name: item.name,
                    image: item.image,
                    price: item.price,
                    quantity: item.qty
                })) || [],
                total: data.totalPrice,
                payment: {
                    method: data.paymentMethod === 'COD' ? 'COD' : data.paymentMethod,
                    status: data.isPaid ? 'Paid' : 'Pending',
                    transactionId: data.transactionId || data.paymentResult?.razorpay_order_id || data.paymentResult?.id,
                    cardType: data.paymentResult?.card_type,
                    cardNetwork: data.paymentResult?.card_network,
                    cardLast4: data.paymentResult?.card_last4
                },
 address: {
                    name: data.user?.name || 'N/A',
                    line: data.shippingAddress?.street || '',
                    city: data.shippingAddress?.city || '',
                    state: data.shippingAddress?.state || '',
                    pincode: data.shippingAddress?.postalCode || '',
                    type: 'Home'
                },
                timeline: [
                    {
                        status: 'Cancelled',
                        time: data.updatedAt || data.createdAt,
                        note: note || ''
                    }
                ]
            };
            set((state) => ({
                orders: state.orders.map(o => o.id === id ? transformedOrder : o),
                isLoading: false
            }));
        } catch (error) {
            set({ 
                error: error.response?.data?.message || error.message, 
                isLoading: false 
            });
        }
    },

    getOrderDetails: async (id) => {
        set({ isLoading: true });
        try {
            const { data } = await API.get(`/orders/${id}`);
            const transformedOrder = {
                ...data,
                id: data._id,
                displayId: data.displayId,
                transactionId: data.transactionId,
                date: data.createdAt,
                items: data.orderItems?.map(item => ({
                    id: item.product,
                    _id: item._id, // Order Item Subdocument ID
                    name: item.name,
                    image: item.image,
                    price: item.price,
                    quantity: item.qty,
                    serialNumber: item.serialNumber, // Mapping Serial Number
                    serialType: item.serialType // Mapping Serial Type
                })) || [],
                total: data.totalPrice,
                payment: {
                    method: data.paymentMethod === 'COD' ? 'COD' : data.paymentMethod,
                    status: data.isPaid ? 'Paid' : 'Pending',
                    transactionId: data.transactionId || data.paymentResult?.razorpay_order_id || data.paymentResult?.id,
                    cardType: data.paymentResult?.card_type,
                    cardNetwork: data.paymentResult?.card_network,
                    cardLast4: data.paymentResult?.card_last4
                },
                address: {
                    name: data.user?.name || 'N/A',
                    line: data.shippingAddress?.street || '',
                    city: data.shippingAddress?.city || '',
                    state: data.shippingAddress?.state || '',
                    pincode: data.shippingAddress?.postalCode || '',
                    type: 'Home'
                },
                timeline: [
                    {
                        status: data.status,
                        time: data.updatedAt || data.createdAt,
                        note: ''
                    }
                ]
            };

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
