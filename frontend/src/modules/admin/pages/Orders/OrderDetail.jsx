import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MdArrowBack, MdPrint, MdLocalShipping, MdCheckCircle, MdPendingActions, MdCancel, MdPerson, MdEmail, MdPhone, MdLocationOn, MdPayment, MdSchedule } from 'react-icons/md';
import toast from 'react-hot-toast';
import useOrderStore from '../../store/orderStore';
import InvoiceGenerator from '../../components/orders/InvoiceGenerator';
import API from '../../../../services/api';

const OrderDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { orders, updateOrderStatus, cancelOrder, getOrderDetails, isLoading } = useOrderStore();
    const order = orders.find(o => o.id === id);

    const [updating, setUpdating] = useState(false);
    const [actionNote, setActionNote] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [serialInputs, setSerialInputs] = useState({});
    const [serialTypes, setSerialTypes] = useState({});
    const [showSerialModal, setShowSerialModal] = useState(false);

    // Initialize selected status when modal opens
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [settings, setSettings] = useState(null);
    const fulfillmentStatuses = ['Confirmed', 'Packed', 'Dispatched', 'Out for Delivery', 'Delivered'];

    const normalizeFulfillmentStatus = (status = '') => {
        const value = String(status || '').trim();
        if (value === 'Shipped') return 'Dispatched';
        return value;
    };

    React.useEffect(() => {
        if (!order) {
            getOrderDetails(id);
        }
        // Fetch settings for invoice
        const fetchSettings = async () => {
            try {
                const { data } = await API.get('/settings');
                setSettings(data);
            } catch (error) {
                console.error('Error fetching settings for invoice:', error);
            }
        };
        fetchSettings();
    }, [id, order, getOrderDetails]);

    if (isLoading && !order) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                <p className="mt-4 text-gray-500 font-medium animate-pulse">Loading order details...</p>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 bg-red-50 text-red-400 rounded-full flex items-center justify-center mb-6">
                    <MdCancel size={48} />
                </div>
                <h2 className="text-2xl font-black text-gray-900">Order Not Found</h2>
                <button onClick={() => navigate('/admin/orders')} className="mt-4 text-blue-600 font-bold hover:underline">Back to Orders</button>
            </div>
        );
    }

    const openUpdateModal = () => {
        setUpdating(true);
        setShowCancelConfirm(false);
        setActionNote('');
        // Set next logical status or current status
        const normalizedOrderStatus = normalizeFulfillmentStatus(order.status);
        const currentIdx = fulfillmentStatuses.indexOf(normalizedOrderStatus);
        if (currentIdx !== -1 && currentIdx < fulfillmentStatuses.length - 1) {
            setSelectedStatus(fulfillmentStatuses[currentIdx + 1]);
        } else {
            setSelectedStatus(fulfillmentStatuses.includes(normalizedOrderStatus) ? normalizedOrderStatus : '');
        }
    };

    const openSerialModal = () => {
        // Pre-fill serial inputs
        const initialInputs = {};
        const initialTypes = {};
        order.items.forEach(item => {
            if (item.serialNumber) initialInputs[item._id] = item.serialNumber;
            if (item.serialType) initialTypes[item._id] = item.serialType;
        });
        setSerialInputs(initialInputs);
        setSerialTypes(initialTypes);
        setShowSerialModal(true);
    };

    const handleSerialSave = () => {
        const serialNumbers = order.items.map(item => ({
            itemId: item._id,
            serial: serialInputs[item._id] !== undefined ? serialInputs[item._id] : item.serialNumber,
            type: serialTypes[item._id] !== undefined ? serialTypes[item._id] : (item.serialType || 'Serial Number')
        })).filter(s => s.serial);

        // Update with CURRENT status to just save serials
        updateOrderStatus(id, order.status, '', serialNumbers);
        setShowSerialModal(false);
        setSerialInputs({});
    };

    const handleUpdateClick = () => {
        handleStatusUpdate(selectedStatus);
    };

    const handleStatusUpdate = (newStatus) => {
        // Validation for Packed status
        if (newStatus === 'Packed') {
            // Check if serial is present in input OR already exists in item
            const missingSerials = order.items.some(item => !serialInputs[item._id] && !item.serialNumber);
            if (missingSerials) {
                toast.error('Please enter Serial Number / IMEI for all items before packing.');
                return;
            }

            const serialNumbers = order.items.map(item => ({
                itemId: item._id,
                // Use input value if present, otherwise fallback to existing value
                serial: serialInputs[item._id] !== undefined ? serialInputs[item._id] : item.serialNumber,
                type: serialTypes[item._id] !== undefined ? serialTypes[item._id] : (item.serialType || 'Serial Number')
            })).filter(s => s.serial); // Only send if we have a serial number

            updateOrderStatus(id, newStatus, actionNote, serialNumbers);
        } else {
            // Also send serial numbers if they were edited in other statuses
            const hasEdits = Object.keys(serialInputs).length > 0 || Object.keys(serialTypes).length > 0;
            if (hasEdits) {
                const serialNumbers = order.items.map(item => ({
                    itemId: item._id,
                    serial: serialInputs[item._id] !== undefined ? serialInputs[item._id] : item.serialNumber,
                    type: serialTypes[item._id] !== undefined ? serialTypes[item._id] : (item.serialType || 'Serial Number')
                })).filter(s => s.serial); // Only send valid ones

                updateOrderStatus(id, newStatus, actionNote, serialNumbers);
            } else {
                updateOrderStatus(id, newStatus, actionNote);
            }
        }

        setActionNote('');
        setSerialInputs({});
        setUpdating(false);
    };

    const getStatusStepStatus = (stepStatus) => {
        const statuses = ['Pending', 'Confirmed', 'Shipped', 'Delivered'];
        const currentIdx = statuses.indexOf(order.status);
        const stepIdx = statuses.indexOf(stepStatus);

        if (order.status === 'Cancelled') return 'cancelled';
        if (currentIdx >= stepIdx) return 'completed';
        return 'upcoming';
    };

    const orderedTimeline = Array.isArray(order.timeline)
        ? [...order.timeline].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
        : [];
    const timelineFlow = ['Pending', 'Confirmed', 'Packed', 'Dispatched', 'Out for Delivery', 'Delivered'];
    const normalizedCurrentStatus = normalizeFulfillmentStatus(order.status);
    const currentFlowIndex = timelineFlow.indexOf(normalizedCurrentStatus);
    const timelineByStatus = orderedTimeline.reduce((acc, event) => {
        const normalizedStatus = normalizeFulfillmentStatus(event.status);
        if (!acc[normalizedStatus]) {
            acc[normalizedStatus] = event;
        }
        return acc;
    }, {});
    const createdTimeMs = new Date(order.createdAt || order.date || Date.now()).getTime();
    const currentStatusTimeMs = new Date(
        timelineByStatus[normalizedCurrentStatus]?.time || order.updatedAt || order.createdAt || order.date || Date.now()
    ).getTime();
    const explicitTimelineFlowIndex = orderedTimeline.reduce((highestIdx, event) => {
        const eventIdx = timelineFlow.indexOf(normalizeFulfillmentStatus(event.status));
        return eventIdx > highestIdx ? eventIdx : highestIdx;
    }, -1);
    const inferredCancelledFlowIndex = (() => {
        if (explicitTimelineFlowIndex >= 0) return explicitTimelineFlowIndex;
        if (order.isDelivered || order.deliveredAt) return timelineFlow.indexOf('Delivered');
        const hasPackedSignal = Array.isArray(order.items) && order.items.some(item => item.serialNumber);
        return hasPackedSignal ? timelineFlow.indexOf('Packed') : timelineFlow.indexOf('Pending');
    })();
    const effectiveFlowIndex = normalizedCurrentStatus === 'Cancelled'
        ? inferredCancelledFlowIndex
        : currentFlowIndex;
    const completedCount = effectiveFlowIndex >= 0 ? effectiveFlowIndex + 1 : 0;
    const fallbackTimeByStatus = {};
    if (completedCount > 0) {
        for (let i = 0; i < completedCount; i += 1) {
            const status = timelineFlow[i];
            const existingTime = timelineByStatus[status]?.time;
            if (existingTime) {
                fallbackTimeByStatus[status] = new Date(existingTime);
                continue;
            }
            if (i === 0) {
                fallbackTimeByStatus[status] = new Date(createdTimeMs);
                continue;
            }
            if (i === effectiveFlowIndex) {
                fallbackTimeByStatus[status] = new Date(currentStatusTimeMs);
                continue;
            }
            const ratio = effectiveFlowIndex > 0 ? i / effectiveFlowIndex : 0;
            const syntheticMs = createdTimeMs + ((currentStatusTimeMs - createdTimeMs) * ratio);
            fallbackTimeByStatus[status] = new Date(syntheticMs);
        }
    }
    const isOrderDelivered = normalizedCurrentStatus === 'Delivered';
    const paymentStatusLabel = isOrderDelivered
        ? 'Completed'
        : (order.payment?.status || (order.isPaid ? 'Paid' : 'Pending'));
    const paymentStatusClass =
        paymentStatusLabel === 'Completed' || paymentStatusLabel === 'Paid'
            ? 'bg-green-100 text-green-700'
            : 'bg-amber-100 text-amber-700';
    const summaryItemsPrice = Number(order.itemsPrice ?? Math.max(0, (order.total || 0) - Number(order.shippingPrice || 0) - Number(order.taxPrice || 0)));
    const summaryShippingPrice = Number(order.shippingPrice || 0);
    const summaryTotal = Number(order.total || 0);
    const customerProfileId = order.user?._id || order.user?.id;

    return (
        <div className="max-w-7xl mx-auto space-y-4 md:space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-6 bg-white p-4 md:p-8 rounded-2xl md:rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 md:gap-6">
                    <button
                        onClick={() => navigate('/admin/orders')}
                        className="p-2 md:p-4 bg-gray-50 hover:bg-white border border-transparent hover:border-gray-100 text-gray-500 hover:text-gray-900 rounded-xl md:rounded-2xl transition-all shadow-sm group"
                    >
                        <MdArrowBack size={20} className="md:w-6 md:h-6 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 md:gap-3 mb-1">
                            <h1 className="text-xl md:text-3xl font-black text-gray-900 tracking-tight">{order.displayId || order.id}</h1>
                            <span className={`px-2 py-1 md:px-4 md:py-1.5 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest shadow-sm ${order.status === 'Delivered' ? 'bg-green-100 text-green-600' :
                                order.status === 'Cancelled' ? 'bg-red-100 text-red-600' :
                                    'bg-blue-100 text-blue-600 animate-pulse'
                                }`}>
                                {order.status}
                            </span>
                        </div>
                        <p className="text-xs md:text-sm text-gray-400 font-medium">Placed on {new Date(order.date).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' })}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 md:gap-3">
                    <InvoiceGenerator
                        order={order}
                        items={order.items}
                        settings={settings}
                        customTrigger={
                            <button className="flex items-center gap-1 md:gap-2 px-3 py-2 md:px-6 md:py-3 bg-white border border-gray-100 text-gray-600 font-black text-[10px] md:text-xs rounded-xl md:rounded-2xl hover:bg-gray-50 transition-all shadow-sm uppercase tracking-widest">
                                <MdPrint size={16} className="md:w-[18px] md:h-[18px]" /> <span className="hidden md:inline">Print Invoice</span><span className="md:hidden">Invoice</span>
                            </button>
                        }
                    />

                    {/* Separate Serial/IMEI Button */}
                    {order.status !== 'Cancelled' && (
                        <button
                            onClick={openSerialModal}
                            className="flex items-center gap-1 md:gap-2 px-3 py-2 md:px-6 md:py-3 bg-indigo-50 text-indigo-600 border border-indigo-100 font-black text-[10px] md:text-xs rounded-xl md:rounded-2xl hover:bg-indigo-100 transition-all shadow-sm uppercase tracking-widest"
                        >
                            <MdPendingActions size={16} className="md:w-[18px] md:h-[18px]" /> <span className="hidden md:inline">Manage Serials</span><span className="md:hidden">Serials</span>
                        </button>
                    )}

                    {order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                        <button
                            onClick={openUpdateModal}
                            className="flex items-center gap-1 md:gap-2 px-3 py-2 md:px-6 md:py-3 bg-blue-600 text-white font-black text-[10px] md:text-xs rounded-xl md:rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 uppercase tracking-widest"
                        >
                            <span className="hidden md:inline">Update Status</span><span className="md:hidden">Update</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8">
                {/* Main Content */}
                <div className="lg:col-span-8 space-y-4 md:space-y-8">
                    {/* Order Items */}
                    <div className="bg-white rounded-2xl md:rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-4 md:p-6 border-b border-gray-50 bg-gray-50/30">
                            <h2 className="text-xs md:text-sm font-black text-gray-800 uppercase tracking-widest">Order Items ({order.items.length})</h2>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {order.items.map((item, idx) => (
                                <div key={idx} className="p-4 md:p-6 flex items-center gap-3 md:gap-6 hover:bg-gray-50/50 transition-colors">
                                    <div className="w-14 h-14 md:w-20 md:h-20 bg-gray-50 rounded-xl md:rounded-2xl border border-gray-100 p-2 overflow-hidden flex-shrink-0">
                                        <img src={item.image} className="w-full h-full object-contain" alt={item.name} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-sm font-black text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-2" title={item.name}>{item.name}</h3>
                                        <div className="flex items-center gap-4 mt-2">
                                            <span className="text-[10px] font-black text-gray-400 uppercase bg-gray-100 px-2 py-0.5 rounded">ID: {item.id}</span>
                                            <span className="text-[10px] font-black text-gray-400 uppercase">Quantity: {item.quantity}</span>
                                        </div>
                                        {item.serialNumber && (
                                            <div className="mt-2">
                                                <span className="text-sm bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg font-bold font-mono border border-blue-200 shadow-sm flex items-center gap-2 w-max select-all">
                                                    <span className="text-blue-400 select-none">{item.serialType === 'IMEI' ? 'IMEI:' : 'SN:'}</span> {item.serialNumber}
                                                </span>
                                            </div>
                                        )}
                                        <div className="mt-3">
                                            <InvoiceGenerator order={order} item={item} settings={settings} />
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-black text-gray-900">₹{item.price.toLocaleString()}</div>
                                        <div className="text-[10px] font-bold text-gray-400 uppercase mt-1">₹{(item.price * item.quantity).toLocaleString()} Subtotal</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 md:p-8 bg-gray-50/30 border-t border-gray-50 flex flex-col items-end gap-2 md:gap-3 text-right">
                            <div className="flex justify-between w-full max-w-[160px] md:max-w-[200px] text-[10px] md:text-xs font-bold text-gray-400 uppercase">
                                <span>Subtotal</span>
                                <span>₹{summaryItemsPrice.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between w-full max-w-[160px] md:max-w-[200px] text-[10px] md:text-xs font-bold text-gray-400 uppercase">
                                <span>Shipping</span>
                                <span className={summaryShippingPrice === 0 ? 'text-green-500' : 'text-gray-700'}>
                                    {summaryShippingPrice === 0 ? 'FREE' : `₹${summaryShippingPrice.toLocaleString()}`}
                                </span>
                            </div>
                            <div className="flex justify-between w-full max-w-[160px] md:max-w-[200px] text-lg md:text-xl font-black text-gray-900 mt-1 md:mt-2">
                                <span>TOTAL</span>
                                <span>₹{summaryTotal.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="bg-white p-4 md:p-8 rounded-2xl md:rounded-3xl border border-gray-100 shadow-sm">
                        <h2 className="text-xs md:text-sm font-black text-gray-800 uppercase tracking-widest mb-6 md:mb-8 flex items-center gap-2 md:gap-3">
                            <MdSchedule className="text-blue-500" size={18} /> Order Timeline
                        </h2>
                        <div className="space-y-4 md:space-y-5">
                            {timelineFlow.map((status, idx) => {
                                const statusEvent = timelineByStatus[status];
                                const isCompleted = effectiveFlowIndex >= idx;
                                const isCurrent = normalizedCurrentStatus === status;
                                const isUpcoming = effectiveFlowIndex !== -1 ? idx > effectiveFlowIndex : !statusEvent;
                                const displayTime = statusEvent?.time ? new Date(statusEvent.time) : fallbackTimeByStatus[status];
                                return (
                                <div key={status} className="flex items-start gap-3 md:gap-4">
                                    <div className="flex flex-col items-center pt-1">
                                        <div className={`w-3 h-3 rounded-full ${isCurrent
                                            ? 'bg-blue-600 ring-4 ring-blue-100'
                                            : isCompleted
                                                ? 'bg-green-500'
                                                : 'bg-gray-300'
                                            }`}></div>
                                        {idx < timelineFlow.length - 1 && (
                                            <div className="w-[2px] h-10 md:h-12 bg-gray-200 mt-1"></div>
                                        )}
                                    </div>
                                    <div className="flex-1 border-b border-gray-100 pb-3 md:pb-4">
                                        <h4 className={`text-sm md:text-base font-black uppercase tracking-wide ${isUpcoming ? 'text-gray-400' : 'text-gray-900'}`}>
                                            {status}
                                        </h4>
                                        {displayTime ? (
                                            <p className="text-[11px] md:text-xs text-gray-500 font-bold mt-1">
                                                {displayTime.toLocaleString('en-IN', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        ) : (
                                            <p className="text-[11px] md:text-xs text-gray-400 font-bold mt-1">Pending update</p>
                                        )}
                                        {isCurrent && (
                                            <p className="text-[10px] text-blue-600 font-black uppercase tracking-wider mt-1">Current status</p>
                                        )}
                                        {statusEvent?.note && <p className="text-xs text-gray-500 font-medium italic">"{statusEvent.note}"</p>}
                                    </div>
                                </div>
                                );
                            })}
                            {normalizedCurrentStatus === 'Cancelled' && (
                                <div className="flex items-start gap-3 md:gap-4">
                                    <div className="flex flex-col items-center pt-1">
                                        <div className="w-3 h-3 rounded-full bg-red-500 ring-4 ring-red-100"></div>
                                    </div>
                                    <div className="flex-1 border-b border-gray-100 pb-3 md:pb-4">
                                        <h4 className="text-sm md:text-base font-black uppercase tracking-wide text-red-600">
                                            Cancelled
                                        </h4>
                                        <p className="text-[11px] md:text-xs text-gray-500 font-bold mt-1">
                                            {new Date((timelineByStatus.Cancelled || orderedTimeline[orderedTimeline.length - 1])?.time || order.updatedAt || Date.now()).toLocaleString('en-IN', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar Details */}
                <div className="lg:col-span-4 space-y-4 md:space-y-8">
                    {/* User Info */}
                    <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl border border-gray-100 shadow-sm space-y-4 md:space-y-6">
                        <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-3 md:pb-4">Customer Profile</h2>
                        <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-2xl">
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-blue-500 shadow-sm font-black text-xl">
                                {order.user?.name?.charAt(0) || 'U'}
                            </div>
                            <div className="min-w-0">
                                {customerProfileId ? (
                                    <button
                                        type="button"
                                        onClick={() => navigate(`/admin/users/${customerProfileId}`)}
                                        className="truncate text-left text-sm font-black text-gray-900 transition hover:text-blue-600"
                                    >
                                        {order.user?.name || order.shippingAddress?.name || 'Unknown User'}
                                    </button>
                                ) : (
                                    <h4 className="text-sm font-black text-gray-900 truncate">{order.user?.name || order.shippingAddress?.name || 'Unknown User'}</h4>
                                )}
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-gray-600">
                                <MdEmail className="text-gray-300" size={18} />
                                <span className="text-xs font-medium truncate">{order.user?.email || order.shippingAddress?.email || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-600">
                                <MdPhone className="text-gray-300" size={18} />
                                <span className="text-xs font-medium">{order.shippingAddress?.phone || order.user?.phone || 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Delivery Address */}
                    <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl border border-gray-100 shadow-sm space-y-4 md:space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">Delivery Address</h2>
                            <span className="px-2 py-0.5 bg-gray-100 text-[8px] font-black uppercase rounded text-gray-500">{order.address?.type || 'Home'}</span>
                        </div>
                        <div className="flex gap-4">
                            <MdLocationOn className="text-blue-500 flex-shrink-0 mt-1" size={20} />
                            <div className="text-xs text-gray-600 leading-relaxed font-medium">
                                <p className="font-black text-gray-900 mb-1">{order.shippingAddress?.name || order.address?.name || order.user?.name || 'N/A'}</p>
                                <p>{order.address?.line || order.shippingAddress?.street || 'N/A'}</p>
                                <p>{order.address?.city || order.shippingAddress?.city || 'N/A'}, {order.address?.state || order.shippingAddress?.state || 'N/A'}</p>
                                <p className="font-black mt-1 text-gray-400">{order.address?.pincode || order.shippingAddress?.postalCode || 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Payment Info */}
                    <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl border border-gray-100 shadow-sm space-y-4 md:space-y-6">
                        <h2 className="text-xs font-black text-gray-700 uppercase tracking-widest">Payment Metadata</h2>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-600 font-bold uppercase tracking-widest text-[9px]">Method</span>
                                <span className="font-black text-gray-900">{order.payment?.method || order.paymentMethod || 'COD'}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-600 font-bold uppercase tracking-widest text-[9px]">Status</span>
                                <span className={`font-black uppercase tracking-tighter px-2 py-0.5 rounded ${paymentStatusClass}`}>
                                    {paymentStatusLabel}
                                </span>
                            </div>
                            {order.payment?.transactionId && (
                                <div className="pt-4 border-t border-gray-50">
                                    <p className="text-[9px] font-black text-gray-600 uppercase mb-1">Transaction ID</p>
                                    <p className="text-[11px] font-bold text-gray-800 font-mono break-all bg-gray-50 p-2 rounded-lg">{order.payment.transactionId}</p>
                                </div>
                            )}

                            {order.payment?.cardNetwork && (
                                <div className="pt-4 border-t border-gray-50 grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[9px] font-black text-gray-600 uppercase mb-1">Card Network</p>
                                        <p className="text-[11px] font-black text-gray-900 uppercase tracking-wider">{order.payment.cardNetwork}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-gray-600 uppercase mb-1">Card Type</p>
                                        <p className="text-[11px] font-black text-gray-900 uppercase tracking-wider">{order.payment.cardType || 'N/A'}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-[9px] font-black text-gray-600 uppercase mb-1">Card Number</p>
                                        <p className="text-[11px] font-bold text-gray-800 font-mono">**** **** **** {order.payment.cardLast4}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Status Update Modal/Pop-up */}
            {updating && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-md rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8">
                        {!showCancelConfirm ? (
                            <div className="p-4 md:p-8 space-y-4 md:space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-black text-gray-900">Update fulfillment status</h3>
                                    <button onClick={() => setUpdating(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"><MdCancel size={24} /></button>
                                </div>

                                <div className="space-y-3">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Select New Status</p>
                                    <div className="space-y-2">
                                        <div className="relative">
                                            <select
                                                value={selectedStatus}
                                                onChange={(e) => setSelectedStatus(e.target.value)}
                                                className="w-full bg-gray-50 text-gray-900 border-2 border-transparent focus:border-blue-500 rounded-2xl p-4 outline-none text-sm font-bold appearance-none cursor-pointer"
                                            >
                                                <option value="" disabled>Select Status</option>
                                                {fulfillmentStatuses.map(status => (
                                                    <option key={status} value={status} disabled={normalizeFulfillmentStatus(order.status) === status}>
                                                        {status}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        </div>
                                        <p className="text-[11px] font-bold text-gray-500 px-1">
                                            Selected: <span className="text-gray-800">{selectedStatus || 'None'}</span>
                                        </p>
                                    </div>

                                    {/* Serial Number Input for Packed Status and above (Edit Mode) */}
                                    {(selectedStatus === 'Packed' || order.status === 'Confirmed' || order.status === 'Packed' || order.status === 'Dispatched' || order.status === 'Out for Delivery') && (
                                        <div className="space-y-3 mt-4 animate-in fade-in slide-in-from-top-2">
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                                <MdLocalShipping size={14} />
                                                {order.status === 'Confirmed' ? 'Enter Serial/IMEI for Items' : 'Edit Serial/IMEI Numbers'}
                                            </p>
                                            <div className="bg-gray-50 rounded-2xl p-4 space-y-3 border border-gray-100 max-h-60 overflow-y-auto">
                                                {order.items.map(item => (
                                                    <div key={item._id} className="space-y-1">
                                                        <label className="text-xs font-bold text-gray-700 truncate block">{item.name}</label>
                                                        <div className="flex gap-2">
                                                            <select
                                                                className="bg-white border border-gray-200 focus:border-blue-500 rounded-xl px-3 py-3 text-xs font-bold outline-none transition-all text-gray-700 shadow-sm w-1/3 appearance-none"
                                                                value={serialTypes[item._id] || (item.serialType || 'Serial Number')}
                                                                onChange={(e) => setSerialTypes(prev => ({ ...prev, [item._id]: e.target.value }))}
                                                            >
                                                                <option>Serial Number</option>
                                                                <option>IMEI</option>
                                                            </select>
                                                            <input
                                                                type="text"
                                                                list={`serials-${item._id}`}
                                                                placeholder={`Enter Number...`}
                                                                className="flex-1 bg-white border border-gray-200 focus:border-blue-500 rounded-xl px-4 py-3 text-sm outline-none transition-all placeholder:text-gray-400 font-mono text-gray-900 shadow-sm"
                                                                value={serialInputs[item._id] !== undefined ? serialInputs[item._id] : (item.serialNumber || '')}
                                                                onChange={(e) => setSerialInputs(prev => ({ ...prev, [item._id]: e.target.value }))}
                                                            />
                                                        </div>
                                                        <datalist id={`serials-${item._id}`}>
                                                            {/* Placeholder for future inventory integration */}
                                                            <option value="SN-EXAMPLE-01" />
                                                            <option value="SN-EXAMPLE-02" />
                                                            <option value="IMEI-TEST-123456789012345" />
                                                        </datalist>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    <button
                                        onClick={() => setShowCancelConfirm(true)}
                                        className="w-full mt-2 px-4 py-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white text-xs font-black uppercase tracking-widest transition-all shadow-sm"
                                    >
                                        Cancel Order
                                    </button>

                                    <button
                                        onClick={handleUpdateClick}
                                        className="w-full mt-2 px-6 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-black uppercase tracking-widest shadow-lg shadow-blue-200 hover:shadow-xl hover:scale-[1.02] transition-all"
                                    >
                                        Update Status
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 md:p-8 space-y-4 md:space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-black text-red-600">Cancel Order?</h3>
                                    <button onClick={() => setShowCancelConfirm(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"><MdCancel size={24} /></button>
                                </div>

                                <div className="space-y-4">
                                    <p className="text-sm text-gray-600">Are you sure you want to cancel this order? This action cannot be undone.</p>

                                    <div className="space-y-2">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Cancellation Reason (Required)</p>
                                        <textarea
                                            placeholder="Please provide a reason for cancellation..."
                                            className="w-full bg-gray-50 border-2 border-transparent focus:border-red-500 rounded-2xl p-4 outline-none text-sm transition-all h-32 font-medium text-gray-900 placeholder:text-gray-400"
                                            value={actionNote}
                                            onChange={(e) => setActionNote(e.target.value)}
                                        />
                                    </div>

                                    <div className="flex gap-3 pt-2">
                                        <button
                                            onClick={() => setShowCancelConfirm(false)}
                                            className="flex-1 px-4 py-3 rounded-xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-all font-black uppercase tracking-tight"
                                        >
                                            Back
                                        </button>
                                        <button
                                            disabled={!actionNote.trim()}
                                            onClick={() => {
                                                cancelOrder(id, actionNote);
                                                setUpdating(false);
                                            }}
                                            className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-200 disabled:opacity-50 disabled:cursor-not-allowed font-black uppercase tracking-tight"
                                        >
                                            Confirm Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Serial Only Modal */}
            {
                showSerialModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="bg-white w-full max-w-md rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8">
                            <div className="p-4 md:p-8 space-y-4 md:space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-black text-gray-900">Manage Serial/IMEI Numbers</h3>
                                    <button onClick={() => setShowSerialModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"><MdCancel size={24} /></button>
                                </div>

                                <div className="space-y-3">
                                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            <MdLocalShipping size={14} />
                                            Update Product Identification
                                        </p>
                                        <div className="bg-gray-50 rounded-2xl p-4 space-y-3 border border-gray-100 max-h-[60vh] overflow-y-auto">
                                            {order.items.map(item => (
                                                <div key={item._id} className="space-y-1">
                                                    <label className="text-xs font-bold text-gray-700 truncate block">{item.name}</label>
                                                    <div className="flex gap-2">
                                                        <select
                                                            className="bg-white border border-gray-200 focus:border-blue-500 rounded-xl px-3 py-3 text-xs font-bold outline-none transition-all text-gray-700 shadow-sm w-1/3 appearance-none"
                                                            value={serialTypes[item._id] || (item.serialType || 'Serial Number')}
                                                            onChange={(e) => setSerialTypes(prev => ({ ...prev, [item._id]: e.target.value }))}
                                                        >
                                                            <option>Serial Number</option>
                                                            <option>IMEI</option>
                                                        </select>
                                                        <input
                                                            type="text"
                                                            placeholder={`Enter Number...`}
                                                            className="flex-1 bg-white border border-gray-200 focus:border-blue-500 rounded-xl px-4 py-3 text-sm outline-none transition-all placeholder:text-gray-400 font-mono text-gray-900 shadow-sm"
                                                            value={serialInputs[item._id] !== undefined ? serialInputs[item._id] : (item.serialNumber || '')}
                                                            onChange={(e) => setSerialInputs(prev => ({ ...prev, [item._id]: e.target.value }))}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleSerialSave}
                                        className="w-full mt-2 px-6 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-sm font-black uppercase tracking-widest shadow-lg shadow-blue-200 hover:shadow-xl hover:scale-[1.02] transition-all"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default OrderDetail;
