import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../../services/api';
import { useAuthStore } from '../store/authStore';
import useAdminAuthStore from '../../admin/store/adminAuthStore';

const MyOrders = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { adminUser } = useAdminAuthStore();
    const currentUser = adminUser || user;
    
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const { data } = await API.get('/orders/myorders');
            setOrders(data);
            setError(null);
        } catch (err) {
            console.error('Fetch orders error:', err);
            setError(err.response?.data?.message || 'Failed to fetch orders');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            'Pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
            'Confirmed': 'bg-blue-100 text-blue-800 border-blue-200',
            'Packed': 'bg-indigo-100 text-indigo-800 border-indigo-200',
            'Dispatched': 'bg-purple-100 text-purple-800 border-purple-200',
            'Out for Delivery': 'bg-orange-100 text-orange-800 border-orange-200',
            'Delivered': 'bg-green-100 text-green-800 border-green-200',
            'Cancelled': 'bg-red-100 text-red-800 border-red-200',
            'Return Requested': 'bg-orange-100 text-orange-800 border-orange-200',
            'Replacement Requested': 'bg-orange-100 text-orange-800 border-orange-200',
            'Approved': 'bg-teal-100 text-teal-800 border-teal-200',
            'Pickup Scheduled': 'bg-purple-100 text-purple-800 border-purple-200',
            'Received at Warehouse': 'bg-blue-100 text-blue-800 border-blue-200',
            'Refund Initiated': 'bg-green-100 text-green-800 border-green-200',
            'Replacement Dispatched': 'bg-purple-100 text-purple-800 border-purple-200',
            'Returned': 'bg-green-100 text-green-800 border-green-200',
            'Replaced': 'bg-green-100 text-green-800 border-green-200',
            'Return Rejected': 'bg-red-100 text-red-800 border-red-200'
        };
        return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    const getStatusIcon = (status) => {
        const icons = {
            'Pending': 'pending',
            'Confirmed': 'check_circle',
            'Packed': 'inventory_2',
            'Dispatched': 'local_shipping',
            'Out for Delivery': 'delivery_dining',
            'Delivered': 'done_all',
            'Cancelled': 'cancel',
            'Return Requested': 'assignment_return',
            'Replacement Requested': 'sync',
            'Approved': 'thumb_up',
            'Pickup Scheduled': 'local_shipping',
            'Received at Warehouse': 'warehouse',
            'Refund Initiated': 'currency_rupee',
            'Replacement Dispatched': 'local_shipping',
            'Returned': 'check_circle',
            'Replaced': 'check_circle',
            'Return Rejected': 'cancel'
        };
        return icons[status] || 'info';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 font-semibold">Loading your orders...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-gray-50 pb-24 md:pb-6">
            {/* Mobile Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-4 flex items-center justify-between sticky top-0 z-10 md:hidden shadow-lg">
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => navigate('/account')}
                        className="material-icons p-2 -ml-2 active:bg-white/10 rounded-full transition-all cursor-pointer relative z-20"
                    >
                        arrow_back
                    </button>
                    <h1 className="text-lg font-bold">My Orders</h1>
                </div>
                <button className="material-icons text-white">search</button>
            </div>

            {/* Desktop Container */}
            <div className="md:max-w-6xl md:mx-auto md:px-4">
                {/* Desktop Breadcrumbs */}
                <div className="hidden md:flex items-center gap-2 text-sm text-gray-500 mb-6 mt-4">
                    <span onClick={() => navigate('/')} className="cursor-pointer hover:text-blue-600 font-medium">Home</span>
                    <span className="material-icons text-xs">chevron_right</span>
                    <span onClick={() => navigate('/account')} className="cursor-pointer hover:text-blue-600 font-medium">My Account</span>
                    <span className="material-icons text-xs">chevron_right</span>
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-bold">My Orders</span>
                </div>

                {error && (
                    <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6 mx-4 md:mx-0">
                        <div className="flex items-center gap-2">
                            <span className="material-icons text-red-600">error</span>
                            <p className="text-red-700 font-semibold">{error}</p>
                        </div>
                    </div>
                )}

                {!loading && orders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 px-10 text-center bg-white mx-4 md:mx-0 rounded-xl shadow-lg border border-blue-100">
                        <div className="w-24 h-24 md:w-32 md:h-32 bg-indigo-50 rounded-full flex items-center justify-center mb-6 shadow-inner ring-8 ring-indigo-50/50">
                            <span className="material-icons text-indigo-600 text-6xl md:text-7xl">receipt_long</span>
                        </div>
                        <h2 className="text-2xl font-bold mb-2 text-gray-800">You haven't placed any orders yet!</h2>
                        <p className="text-gray-600 text-base mb-6">Start shopping to see your orders here.</p>
                        <button onClick={() => navigate('/')} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-12 py-3.5 rounded-lg font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all">
                            Shop Now
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4 px-4 md:px-0">
                        {orders.map((order) => (
                            <div 
                                key={order._id} 
                                className="bg-white rounded-lg shadow-md border-2 border-blue-100 overflow-hidden hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1"
                                onClick={() => navigate(`/my-orders/${order._id}`)}
                            >
                                {/* Order Header */}
                                <div className="bg-gradient-to-r from-white to-blue-50 px-5 py-4 border-b border-blue-100">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <span className="material-icons text-blue-600 text-2xl">receipt_long</span>
                                            <div>
                                                <p className="text-xs text-gray-500 font-medium">Order ID</p>
                                                <p className="font-bold text-gray-800 text-sm">#{order.displayId || order._id.slice(-8).toUpperCase()}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div>
                                                <p className="text-xs text-gray-500 font-medium">Placed on</p>
                                                <p className="font-semibold text-gray-800 text-sm">
                                                    {new Date(order.createdAt).toLocaleDateString('en-IN', { 
                                                        day: 'numeric', 
                                                        month: 'short', 
                                                        year: 'numeric' 
                                                    })}
                                                </p>
                                            </div>
                                            <span className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1 ${getStatusColor(order.status)}`}>
                                                <span className="material-icons text-sm">{getStatusIcon(order.status)}</span>
                                                {order.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Order Items */}
                                <div className="p-5">
                                    <div className="space-y-3">
                                        {order.orderItems.slice(0, 3).map((item, index) => (
                                            <div key={index} className="flex gap-4 items-center">
                                                <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg border-2 border-blue-100 p-2 flex-shrink-0">
                                                    <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-sm font-bold text-gray-800 line-clamp-2">{item.name}</h3>
                                                    {item.variant && (
                                                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                                                            {Object.entries(item.variant).map(([key, value]) => (
                                                                <span key={key} className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">
                                                                    {key}: <span className="text-blue-600">{value}</span>
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                    <p className="text-base font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mt-1">
                                                        ₹{item.price.toLocaleString()}
                                                    </p>

                                                    {/* Serial Number / IMEI - Only if Delivered */}
                                                    {(item.serialNumber && (order.status === 'Delivered' || order.isDelivered)) && (
                                                        <div className="mt-2">
                                                            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-md font-bold font-mono border border-blue-200 shadow-sm flex items-center gap-1 w-max">
                                                                <span className="text-blue-400 select-none">{item.serialType === 'IMEI' ? 'IMEI:' : 'SN:'}</span> {item.serialNumber}
                                                            </span>
                                                        </div>
                                                    )}

                                                    {/* Item Status Badge */}
                                                    {item.status && item.status !== order.status && (
                                                        <div className={`mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(item.status)}`}>
                                                            <span className="material-icons text-[12px]">{getStatusIcon(item.status)}</span>
                                                            {item.status}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {order.orderItems.length > 3 && (
                                            <p className="text-xs text-blue-600 font-bold">
                                                +{order.orderItems.length - 3} more item(s)
                                            </p>
                                        )}
                                    </div>

                                    {/* Order Total */}
                                    <div className="mt-4 pt-4 border-t border-blue-100 flex flex-col md:flex-row justify-between md:items-center gap-3">
                                        <div>
                                            <p className="text-xs text-gray-500 font-medium">Total Amount</p>
                                            <p className="text-xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                                ₹{order.totalPrice.toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            {order.isPaid ? (
                                                <div className="flex items-center gap-1 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full">
                                                    <span className="material-icons text-green-600 text-sm">check_circle</span>
                                                    <span className="text-xs font-bold text-green-700">Paid</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1 bg-yellow-50 border border-yellow-200 px-3 py-1.5 rounded-full">
                                                    <span className="material-icons text-yellow-600 text-sm">pending</span>
                                                    <span className="text-xs font-bold text-yellow-700">COD</span>
                                                </div>
                                            )}
                                            <button 
                                                className="flex items-center gap-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:shadow-lg transition-all"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/my-orders/${order._id}`);
                                                }}
                                            >
                                                View Details
                                                <span className="material-icons text-sm">arrow_forward</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyOrders;
