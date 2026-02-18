import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create()(
    persist(
        (set, get) => ({
            cart: [],
            wishlist: [],
            savedForLater: [],
            orders: [],
            addresses: [],
            language: 'English',
            userProfile: null,
            appliedCoupon: null, // { code, discount, type }

            applyCoupon: (coupon) => set({ appliedCoupon: coupon }),
            removeCoupon: () => set({ appliedCoupon: null }),

            updateUserProfile: (profile) => set((state) => ({
                userProfile: { ...state.userProfile, ...profile }
            })),

            addToCart: (product, variant = {}) => {
                set((state) => {
                    const cartItem = { ...product, variant };
                    const existingItem = state.cart.find((item) =>
                        item.id === product.id &&
                        JSON.stringify(item.variant) === JSON.stringify(variant)
                    );

                    if (existingItem) {
                        return {
                            cart: state.cart.map((item) =>
                                item === existingItem ? { ...item, quantity: item.quantity + 1 } : item
                            ),
                        };
                    }
                    return { cart: [...state.cart, { ...cartItem, quantity: 1 }] };
                });
            },

            removeFromCart: (productId, variant = {}) => {
                set((state) => ({
                    cart: state.cart.filter((item) => !(
                        item.id === productId &&
                        JSON.stringify(item.variant) === JSON.stringify(variant)
                    )),
                }));
            },

            updateQuantity: (productId, quantity, variant = {}) => {
                set((state) => ({
                    cart: state.cart.map((item) =>
                        (item.id === productId &&
                            JSON.stringify(item.variant) === JSON.stringify(variant))
                            ? { ...item, quantity: Math.max(1, quantity) } : item
                    ),
                }));
            },

            toggleWishlist: (product) => {
                set((state) => {
                    const exists = state.wishlist.find(item => item.id === product.id);
                    if (exists) {
                        return { wishlist: state.wishlist.filter(item => item.id !== product.id) };
                    }
                    return { wishlist: [...state.wishlist, product] };
                });
            },

            moveToSavedForLater: (product) => {
                set((state) => ({
                    cart: state.cart.filter(item => item.id !== product.id),
                    savedForLater: [...state.savedForLater, product]
                }));
            },

            moveToCart: (product) => {
                set((state) => {
                    const isInSaved = state.savedForLater.find(item => item.id === product.id);
                    if (isInSaved) {
                        return {
                            savedForLater: state.savedForLater.filter(item => item.id !== product.id),
                            cart: [...state.cart, { ...product, quantity: 1 }]
                        };
                    }
                    const isInWishlist = state.wishlist.find(item => item.id === product.id);
                    if (isInWishlist) {
                        return {
                            wishlist: state.wishlist.filter(item => item.id !== product.id),
                            cart: [...state.cart, { ...product, quantity: 1 }]
                        };
                    }
                    return state;
                });
            },

            removeFromSavedForLater: (productId) => {
                set((state) => ({
                    savedForLater: state.savedForLater.filter(item => item.id !== productId)
                }));
            },

            addAddress: (address) => {
                set((state) => ({
                    addresses: [...state.addresses, { ...address, id: Date.now() }]
                }));
            },

            updateAddress: (id, updatedAddress) => {
                set((state) => ({
                    addresses: state.addresses.map(addr => addr.id === id ? { ...addr, ...updatedAddress } : addr)
                }));
            },

            removeAddress: (id) => {
                set((state) => ({
                    addresses: state.addresses.filter(addr => addr.id !== id)
                }));
            },

            placeOrder: (order, shouldClearCart = true) => {
                const normalizedOrder = {
                    ...order,
                    id: order._id || order.id,
                    date: order.createdAt || order.date,
                    items: (order.orderItems || order.items || []).map(item => ({
                        ...item,
                        id: item.product || item.id, // product is the number ID
                        status: item.status || order.status || 'PLACED'
                    })),
                    status: order.status || 'PLACED'
                };
                set((state) => ({
                    orders: [normalizedOrder, ...state.orders],
                    cart: shouldClearCart ? [] : state.cart
                }));
            },

            updateItemStatus: (orderId, productId, newStatus) => {
                const statusMap = {
                    'RETURN_REQUESTED': 'Return Requested',
                    'RETURN_PICKED_UP': 'Item Picked Up',
                    'REFUND_PROCESSED': 'Refund Processed',
                    'REPLACEMENT_REQUESTED': 'Replacement Requested',
                    'REPLACEMENT_PICKED_UP': 'Item Picked Up',
                    'REPLACEMENT_SHIPPED': 'Replacement Shipped',
                    'REPLACEMENT_DELIVERED': 'Replacement Delivered'
                };

                set((state) => ({
                    orders: state.orders.map(order =>
                        order.id === orderId ? {
                            ...order,
                            items: order.items.map(item =>
                                item.id === productId ? {
                                    ...item,
                                    status: newStatus,
                                    trackingHistory: [
                                        ...(item.trackingHistory || []),
                                        {
                                            status: newStatus,
                                            title: statusMap[newStatus] || newStatus,
                                            time: new Date().toISOString()
                                        }
                                    ]
                                } : item
                            )
                        } : order
                    )
                }));
            },

            updateOrderStatus: (orderId, newStatus) => {
                const statusMap = {
                    'PLACED': 'Order Placed',
                    'PACKED': 'Packed',
                    'SHIPPED': 'Shipped',
                    'OUT_FOR_DELIVERY': 'Out for Delivery',
                    'DELIVERED': 'Delivered',
                    'CANCELLED': 'Cancelled'
                };

                set((state) => ({
                    orders: state.orders.map(order =>
                        order.id === orderId ? {
                            ...order,
                            status: newStatus,
                            items: order.items.map(item =>
                                (!item.status || item.status === order.status || ['PLACED', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(item.status))
                                    ? { ...item, status: newStatus }
                                    : item
                            ),
                            tracking: [
                                ...(order.tracking || []),
                                {
                                    status: newStatus,
                                    title: statusMap[newStatus] || newStatus,
                                    time: new Date().toISOString(),
                                    completed: true,
                                    current: true
                                }
                            ].map(t => ({ ...t, current: t.status === newStatus }))
                        } : order
                    )
                }));
            },

            setLanguage: (language) => set({ language }),

            startSimulation: (orderId) => {
                const orderStatuses = ['PLACED', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];
                const returnStatuses = ['RETURN_REQUESTED', 'RETURN_PICKED_UP', 'REFUND_PROCESSED'];
                const replacementStatuses = ['REPLACEMENT_REQUESTED', 'REPLACEMENT_PICKED_UP', 'REPLACEMENT_SHIPPED', 'REPLACEMENT_DELIVERED'];

                const interval = setInterval(() => {
                    const state = get();
                    const order = state.orders.find(o => o.id === orderId);

                    if (!order || order.status === 'CANCELLED') {
                        clearInterval(interval);
                        return;
                    }

                    // Order Level Simulation
                    if (order.status !== 'DELIVERED' && !order.status.startsWith('RETURN')) {
                        const currentIdx = orderStatuses.indexOf(order.status);
                        if (currentIdx !== -1 && currentIdx < orderStatuses.length - 1) {
                            state.updateOrderStatus(orderId, orderStatuses[currentIdx + 1]);
                            return; // Wait for next tick
                        }
                    }

                    // Item Level Simulation (for returns/replacements)
                    let itemsUpdated = false;
                    order.items.forEach(item => {
                        if (item.status && item.status.startsWith('RETURN')) {
                            const currentIdx = returnStatuses.indexOf(item.status);
                            if (currentIdx !== -1 && currentIdx < returnStatuses.length - 1) {
                                state.updateItemStatus(orderId, item.id, returnStatuses[currentIdx + 1]);
                                itemsUpdated = true;
                            }
                        } else if (item.status && item.status.startsWith('REPLACEMENT')) {
                            const currentIdx = replacementStatuses.indexOf(item.status);
                            if (currentIdx !== -1 && currentIdx < replacementStatuses.length - 1) {
                                state.updateItemStatus(orderId, item.id, replacementStatuses[currentIdx + 1]);
                                itemsUpdated = true;
                            }
                        }
                    });

                    // If order reached DELIVERED and no return/replacement items are being updated, clear interval
                    if (order.status === 'DELIVERED' && !itemsUpdated) {
                        // Check if any items are still in a transition state
                        const anyActiveItems = order.items.some(item =>
                            (item.status && item.status.startsWith('RETURN') && item.status !== 'REFUND_PROCESSED') ||
                            (item.status && item.status.startsWith('REPLACEMENT') && item.status !== 'DELIVERED')
                        );

                        if (!anyActiveItems) {
                            clearInterval(interval);
                        }
                    }
                }, 5000);
            },

            clearCart: () => set({ cart: [] }),
            getTotalItems: () => {
                const { cart } = get();
                return cart.reduce((total, item) => total + item.quantity, 0);
            },
            getTotalPrice: () => {
                const { cart } = get();
                return cart.reduce((total, item) => total + item.price * item.quantity, 0);
            },
            getTotalOriginalPrice: () => {
                const { cart } = get();
                return cart.reduce((total, item) => total + (item.originalPrice || item.price) * item.quantity, 0);
            },
            getTotalSavings: () => {
                const { cart } = get();
                const original = cart.reduce((total, item) => total + (item.originalPrice || item.price) * item.quantity, 0);
                const current = cart.reduce((total, item) => total + item.price * item.quantity, 0);
                return original - current;
            },

            clearStore: () => set({
                cart: [],
                wishlist: [],
                savedForLater: [],
                orders: [],
                addresses: [],
                appliedCoupon: null,
                userProfile: null
            })
        }),
        {
            name: 'cart-storage',
        }
    )
);
