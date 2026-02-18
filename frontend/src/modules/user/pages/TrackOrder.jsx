import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { confirmToast } from '../../../utils/toastUtils.jsx';

const TrackOrder = () => {
    const { orderId, productId } = useParams();
    const navigate = useNavigate();
    const orders = useCartStore(state => state.orders);
    const startSimulation = useCartStore(state => state.startSimulation);
    const order = orders.find(o => o.id === orderId);
    const targetItem = productId ? order?.items.find(i => String(i.id) === String(productId)) : order?.items[0];

    React.useEffect(() => {
        if (order) {
            const isActiveOrder = order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && !order.status.startsWith('RETURN');
            const isActiveItem = productId && targetItem?.status && (
                (targetItem.status.startsWith('RETURN') && targetItem.status !== 'REFUND_PROCESSED') ||
                (targetItem.status.startsWith('REPLACEMENT') && targetItem.status !== 'DELIVERED')
            );

            if (isActiveOrder || isActiveItem) {
                startSimulation(order.id);
            }
        }
    }, [order?.id, productId, targetItem?.status]);

    if (!order) {
        return <div className="p-10 text-center">Order not found.</div>;
    }

    // Determine the target item and status
    const currentStatus = productId ? targetItem?.status : order.status;

    // Explicitly define statuses for each flow to prevent incorrect detection
    const returnStatuses = ['RETURN_REQUESTED', 'RETURN_PICKED_UP', 'REFUND_PROCESSED'];
    const replacementStatuses = ['REPLACEMENT_REQUESTED', 'REPLACEMENT_PICKED_UP', 'REPLACEMENT_SHIPPED', 'REPLACEMENT_DELIVERED'];

    // Check for specific flows based on history or current status
    const isReturnFlow = returnStatuses.includes(currentStatus) ||
        targetItem?.trackingHistory?.some(t => returnStatuses.includes(t.status));

    const isReplacementFlow = replacementStatuses.includes(currentStatus) ||
        targetItem?.trackingHistory?.some(t => replacementStatuses.includes(t.status));

    const steps = isReturnFlow
        ? [
            { status: 'RETURN_REQUESTED', title: 'Return Requested', desc: 'We have received your return request' },
            { status: 'RETURN_PICKED_UP', title: 'Picked Up', desc: 'Item has been picked up by our courier' },
            { status: 'REFUND_PROCESSED', title: 'Refund Processed', desc: 'Refund has been initiated' }
        ]
        : isReplacementFlow
            ? [
                { status: 'REPLACEMENT_REQUESTED', title: 'Replacement Requested', desc: 'Replacement request is being processed' },
                { status: 'REPLACEMENT_PICKED_UP', title: 'Item Picked Up', desc: 'Old item has been picked up' },
                { status: 'REPLACEMENT_SHIPPED', title: 'New Item Shipped', desc: 'Replacement item is on its way' },
                { status: 'REPLACEMENT_DELIVERED', title: 'New Item Delivered', desc: 'Replacement has been delivered' }
            ]
            : [
                { status: 'PLACED', title: 'Order Placed', desc: 'Your order has been placed', time: order.date },
                { status: 'PACKED', title: 'Packed', desc: 'We are processing your order' },
                { status: 'SHIPPED', title: 'Shipped', desc: 'Order has been handed over to courier' },
                { status: 'OUT_FOR_DELIVERY', title: 'Out for Delivery', desc: 'Your order is arriving today' },
                { status: 'DELIVERED', title: 'Delivered', desc: 'Order has been delivered' }
            ];

    // Map DELIVERED to REPLACEMENT_DELIVERED if in replacement flow to fix legacy/corner cases
    const effectiveStatus = (isReplacementFlow && (currentStatus === 'DELIVERED')) ? 'REPLACEMENT_DELIVERED' : (currentStatus || order.status);
    const currentStatusIdx = steps.findIndex(s => s.status === effectiveStatus);

    // Auto-cancellation for testing purposes
    const updateStatus = useCartStore(state => state.updateOrderStatus);
    const handleCancel = () => {
        confirmToast({
            message: 'Are you sure you want to cancel this order?',
            type: 'danger',
            icon: 'cancel',
            confirmText: 'Cancel Order',
            onConfirm: () => updateStatus(order.id, 'CANCELLED')
        });
    };

    return (
        <div className="bg-white min-h-screen md:bg-[#f1f3f6] md:py-6">

            {/* Mobile Header - Hidden on Desktop */}
            <div className="bg-blue-600 text-white px-4 py-4 flex items-center gap-4 sticky top-0 z-50 shadow-md md:hidden">
                <button
                    onClick={() => {
                        // If it's a specific product track, go back to order details, otherwise go to my orders
                        if (productId) {
                            navigate(`/my-orders/${orderId}`);
                        } else {
                            navigate('/my-orders');
                        }
                    }}
                    className="material-icons p-1 -ml-1 active:bg-white/10 rounded-full transition-colors cursor-pointer relative z-[60]"
                    style={{ pointerEvents: 'auto' }}
                >
                    arrow_back
                </button>
                <div className="flex flex-col">
                    <h1 className="text-sm font-bold uppercase tracking-tight">Tracking {productId ? (currentStatus?.includes('RETURN') ? 'Return' : 'Replacement') : 'Order'}</h1>
                    <span className="text-[10px] text-white/80 uppercase">#{order.displayId || order.id}</span>
                </div>
            </div>

            {/* Desktop Container */}
            <div className="md:max-w-[800px] md:mx-auto">

                {/* Desktop Breadcrumbs */}
                <div className="hidden md:flex items-center gap-2 text-xs text-gray-500 mb-4 px-4">
                    <span onClick={() => navigate('/')} className="cursor-pointer hover:text-blue-600">Home</span>
                    <span className="material-icons text-[10px]">chevron_right</span>
                    <span onClick={() => navigate('/my-orders')} className="cursor-pointer hover:text-blue-600">My Orders</span>
                    <span className="material-icons text-[10px]">chevron_right</span>
                    <span className="text-gray-800 font-bold">Track Order</span>
                </div>

                {/* Main Card (Desktop) / Wrapper (Mobile) */}
                <div className="md:bg-white md:rounded-lg md:shadow-sm md:overflow-hidden md:border md:border-gray-200">

                    {/* Product Info Header */}
                    <div className="p-4 border-b md:bg-gray-50">
                        <div className="flex gap-4">
                            <div className="w-16 h-16 bg-gray-50 rounded border p-1 md:bg-white">
                                <img src={targetItem?.image} alt="" className="w-full h-full object-contain" />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-sm font-bold text-gray-800 line-clamp-1 md:text-base">{targetItem?.name}</h2>
                                <p className="text-xs text-gray-500 mt-1 md:text-sm">Status: <span className="text-blue-600 font-bold uppercase tracking-tighter">{currentStatus?.replace(/_/g, ' ')}</span></p>
                                <p className="text-[10px] text-gray-400 mt-1 hidden md:block">Order ID: {order.displayId || order.id}</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 md:p-8">
                        <div className="relative md:pl-4">
                            {/* Vertical Line Background */}
                            <div className="absolute left-[9px] md:left-[25px] top-2 bottom-2 w-0.5 bg-gray-100">
                                {/* Dynamic Green Line */}
                                {order.status !== 'CANCELLED' && (
                                    <div
                                        className="w-full bg-green-600 transition-all duration-1000 ease-in-out"
                                        style={{
                                            height: `${currentStatusIdx <= 0 ? 0 : (currentStatusIdx / (steps.length - 1)) * 100}%`
                                        }}
                                    ></div>
                                )}
                            </div>

                            <div className="space-y-10">
                                {order.status === 'CANCELLED' ? (
                                    <div className="flex gap-6 relative">
                                        <div className="w-5 h-5 rounded-full bg-red-600 flex items-center justify-center z-10 md:w-6 md:h-6">
                                            <span className="material-icons text-white text-[12px] md:text-[14px]">close</span>
                                        </div>
                                        <div className="flex-1 -mt-1 md:mt-0">
                                            <h3 className="text-sm font-bold text-red-600 md:text-base">Order Cancelled</h3>
                                            <p className="text-xs text-gray-500 mt-0.5 md:text-sm">This order was cancelled.</p>
                                            {order.tracking?.find(t => t.status === 'CANCELLED') && (
                                                <p className="text-[10px] text-gray-400 mt-1 md:text-xs">{new Date(order.tracking.find(t => t.status === 'CANCELLED').time).toLocaleString()}</p>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    steps.map((step, idx) => {
                                        const isCompleted = idx < currentStatusIdx;
                                        const isCurrent = idx === currentStatusIdx;
                                        const trackingEntry = (productId && targetItem?.trackingHistory?.some(t => t.status === step.status))
                                            ? targetItem.trackingHistory.find(t => t.status === step.status)
                                            : order.tracking?.find(t => t.status === step.status);

                                        return (
                                            <div key={idx} className="flex gap-6 relative">
                                                <div className="relative">
                                                    {isCurrent && (
                                                        <div className="absolute -inset-1 bg-green-400 rounded-full animate-ping opacity-40"></div>
                                                    )}
                                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center z-10 relative md:w-6 md:h-6 ${isCompleted || isCurrent ? 'bg-green-600' : 'bg-gray-200'
                                                        }`}>
                                                        <span className="material-icons text-white text-[12px] md:text-[14px]">
                                                            {isCompleted ? 'check' : isCurrent ? 'radio_button_checked' : 'radio_button_unchecked'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex-1 -mt-1 md:mt-0">
                                                    <h3 className={`text-sm font-bold transition-all duration-500 md:text-base ${isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-400'}`}>
                                                        {step.title}
                                                    </h3>
                                                    <p className="text-xs text-gray-500 mt-0.5 md:text-sm">{step.desc}</p>
                                                    {trackingEntry ? (
                                                        <p className="text-[10px] text-gray-400 mt-1 animate-in fade-in duration-500 md:text-xs">
                                                            {new Date(trackingEntry.time).toLocaleString()}
                                                        </p>
                                                    ) : isCurrent ? (
                                                        <div className="flex items-center gap-1.5 mt-1">
                                                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                                                            <p className="text-[10px] text-blue-500 font-bold uppercase tracking-wider md:text-xs">In Progress...</p>
                                                        </div>
                                                    ) : null}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                            <div className="mt-10 pt-6 border-t md:hidden">
                                <button
                                    onClick={handleCancel}
                                    className="w-full text-red-600 font-bold text-sm flex items-center justify-center gap-2 py-2 border border-red-100 rounded-lg active:bg-red-50"
                                >
                                    <span className="material-icons text-sm">cancel</span>
                                    Cancel Order
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="m-4 p-4 bg-blue-50 rounded-xl border border-blue-100 md:mx-0 md:mt-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-sm">
                            <span className="material-icons">support_agent</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-bold text-blue-900">Need help with tracking?</p>
                            <p className="text-[11px] text-blue-700">Call our customer support at 1800-202-9898</p>
                        </div>
                        <button className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:bg-blue-700 transition-colors">Call Now</button>
                    </div>
                </div>

                <div className="px-6 py-4 mt-4 border-t md:bg-white md:rounded-lg md:shadow-sm md:border md:border-gray-200 md:px-6 md:py-6">
                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-4 tracking-widest">Couriers details</h4>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-bold text-gray-800">Ekart Logistics</p>
                            <p className="text-xs text-gray-500 uppercase mt-0.5">AWB: {order.id.slice(2)}</p>
                        </div>
                        <span className="material-icons text-gray-400">chevron_right</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TrackOrder;
