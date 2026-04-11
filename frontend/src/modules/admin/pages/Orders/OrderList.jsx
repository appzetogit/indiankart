import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MdSearch, MdFilterList, MdVisibility, MdChevronLeft, MdChevronRight, MdLocalShipping, MdCheckCircle, MdPendingActions, MdCancel } from 'react-icons/md';
import toast from 'react-hot-toast';
import Pagination from '../../../../components/Pagination';
import API from '../../../../services/api';
import AdminTable, { AdminTableHead, AdminTableHeaderCell, AdminTableHeaderRow } from '../../components/common/AdminTable';
import { getAdminPaymentStatus, getAdminPaymentStatusClass } from '../../utils/paymentStatus';

const BULK_STATUS_OPTIONS = [
    'Pending',
    'Confirmed',
    'Packed',
    'Dispatched',
    'Out for Delivery',
    'Delivered',
    'Cancelled'
];

const OrderList = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const userEmailFilter = searchParams.get('user');

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    // Server-side Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 20;

    const [localOrders, setLocalOrders] = useState([]);
    const [selectedOrderIds, setSelectedOrderIds] = useState(() => new Set());
    const [bulkStatus, setBulkStatus] = useState('');
    const [isBulkUpdating, setIsBulkUpdating] = useState(false);

    const normalizeOrderStatus = (status = '') => {
        const value = String(status || '').trim();
        if (value === 'Shipped') return 'Dispatched';
        return value;
    };

    useEffect(() => {
        const fetchPaginatedOrders = async () => {
            try {
                const params = {
                    pageNumber: currentPage,
                    limit: itemsPerPage,
                    syncPayments: false
                };

                if (searchTerm) params.search = searchTerm;
                if (statusFilter !== 'All') params.status = statusFilter;
                if (userEmailFilter) params.user = userEmailFilter;

                const { data } = await API.get('/orders', { params });

                const transformOrder = (order) => {
                    const normalizedOrderStatus = normalizeOrderStatus(order?.status);

                    return {
                        ...order,
                        id: order._id,
                        date: order.createdAt,
                        items: order.orderItems?.map(item => ({
                            id: item.product,
                            name: item.name,
                            image: item.image,
                            price: item.price,
                            quantity: item.qty
                        })) || [],
                        total: order.totalPrice,
                        payment: {
                            method: order.paymentMethod || 'COD',
                            status: getAdminPaymentStatus(order)
                        },
                        status: normalizedOrderStatus || 'Pending',
                        baseStatus: normalizedOrderStatus
                    };
                };

                if (data.orders) {
                    setLocalOrders(data.orders.map((order) => transformOrder(order)));
                    setTotalPages(data.pages);
                } else {
                    setLocalOrders(Array.isArray(data) ? data.map((order) => transformOrder(order)) : []);
                }
            } catch (error) {
                console.error(error);
            }
        };

        const timer = setTimeout(() => {
            fetchPaginatedOrders();
        }, 300); // Debounce search

        return () => clearTimeout(timer);
    }, [currentPage, searchTerm, statusFilter, userEmailFilter]);

    const filteredOrders = localOrders; // Now directly from server
    const selectedCount = selectedOrderIds.size;
    const allVisibleSelected = filteredOrders.length > 0 && filteredOrders.every((order) => selectedOrderIds.has(order.id));
    const someVisibleSelected = filteredOrders.some((order) => selectedOrderIds.has(order.id));

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Pending': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'Confirmed': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'Packed': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
            case 'Manifested': return 'bg-cyan-50 text-cyan-600 border-cyan-100';
            case 'Not Picked': return 'bg-sky-50 text-sky-600 border-sky-100';
            case 'Scheduled': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
            case 'Dispatched': return 'bg-purple-50 text-purple-600 border-purple-100';
            case 'In Transit': return 'bg-violet-50 text-violet-600 border-violet-100';
            case 'Out for Delivery': return 'bg-orange-50 text-orange-600 border-orange-100';
            case 'Delivered': return 'bg-green-50 text-green-600 border-green-100';
            case 'Cancelled': return 'bg-red-50 text-red-600 border-red-100';
            default: return 'bg-gray-50 text-gray-600 border-gray-100';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Pending': return <MdPendingActions size={14} />;
            case 'Confirmed': return <MdCheckCircle size={14} />;
            case 'Packed': return <MdPendingActions size={14} />;
            case 'Manifested': return <MdLocalShipping size={14} />;
            case 'Not Picked': return <MdPendingActions size={14} />;
            case 'Scheduled': return <MdPendingActions size={14} />;
            case 'Dispatched': return <MdLocalShipping size={14} />;
            case 'In Transit': return <MdLocalShipping size={14} />;
            case 'Out for Delivery': return <MdLocalShipping size={14} />;
            case 'Delivered': return <MdCheckCircle size={14} />;
            case 'Cancelled': return <MdCancel size={14} />;
            default: return null;
        }
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleToggleOrder = (orderId) => {
        setSelectedOrderIds((prev) => {
            const next = new Set(prev);
            if (next.has(orderId)) {
                next.delete(orderId);
            } else {
                next.add(orderId);
            }
            return next;
        });
    };

    const handleToggleVisibleOrders = () => {
        setSelectedOrderIds((prev) => {
            const next = new Set(prev);
            if (allVisibleSelected) {
                filteredOrders.forEach((order) => next.delete(order.id));
            } else {
                filteredOrders.forEach((order) => next.add(order.id));
            }
            return next;
        });
    };

    const handleBulkStatusUpdate = async () => {
        if (!selectedCount) {
            toast.error('Select at least one order');
            return;
        }

        if (!bulkStatus) {
            toast.error('Choose a status first');
            return;
        }

        setIsBulkUpdating(true);
        try {
            const { data } = await API.put('/orders/bulk-status', {
                orderIds: Array.from(selectedOrderIds),
                status: bulkStatus
            });
            const updatedOrderById = new Map(
                (data.updatedOrders || []).map((order) => [order._id, order])
            );

            setLocalOrders((orders) => orders.map((order) => {
                const updatedOrder = updatedOrderById.get(order.id);
                if (!updatedOrder) return order;

                const normalizedOrderStatus = normalizeOrderStatus(updatedOrder.status);
                return {
                    ...order,
                    ...updatedOrder,
                    id: updatedOrder._id,
                    date: updatedOrder.createdAt,
                    total: updatedOrder.totalPrice,
                    status: normalizedOrderStatus,
                    baseStatus: normalizedOrderStatus
                };
            }));
            setSelectedOrderIds(new Set());
            setBulkStatus('');

            const updatedCount = data.updatedOrders?.length || 0;
            const failedCount = data.failedOrders?.length || 0;
            if (updatedCount) {
                toast.success(`${updatedCount} order${updatedCount === 1 ? '' : 's'} updated to ${bulkStatus}`);
            }
            if (failedCount) {
                toast.error(`${failedCount} order${failedCount === 1 ? '' : 's'} could not be updated`);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update selected orders');
        } finally {
            setIsBulkUpdating(false);
        }
    };

    return (
        <div className="space-y-3 md:space-y-4 px-2 md:px-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4">
                <div>
                    <h1 className="text-lg md:text-2xl font-black text-gray-900 tracking-tight">Order Management</h1>
                    <p className="text-xs md:text-sm text-gray-500 font-medium italic">Monitor sales and live fulfillment progress ({filteredOrders.length} total)</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-3 md:p-4 rounded-xl md:rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-3 md:gap-4 items-center justify-between">
                <div className="relative flex-1 w-full">
                    <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by Order ID, Customer, or Product Name..."
                        className="w-full pl-12 pr-4 py-2 bg-gray-50 border border-transparent rounded-xl md:rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all text-sm font-bold text-gray-900 placeholder:text-gray-400 caret-blue-600 shadow-inner"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                    />
                </div>
                <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto">
                    <MdFilterList className="text-gray-400" size={20} />
                    <select
                        className="px-4 py-2 md:px-6 md:py-3 bg-gray-50 border border-transparent rounded-xl md:rounded-2xl outline-none focus:bg-white focus:border-blue-500 text-sm font-bold text-gray-900 min-w-[150px] appearance-none shadow-sm cursor-pointer"
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                    >
                        <option value="All">All Statuses</option>
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Packed">Packed</option>
                        <option value="Manifested">Manifested</option>
                        <option value="Not Picked">Not Picked</option>
                        <option value="Scheduled">Scheduled</option>
                        <option value="Dispatched">Dispatched</option>
                        <option value="In Transit">In Transit</option>
                        <option value="Out for Delivery">Out for Delivery</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            {selectedCount > 0 && (
                <div className="bg-gray-950 text-white p-3 md:p-4 rounded-xl md:rounded-2xl border border-gray-800 shadow-sm flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
                    <div>
                        <p className="text-xs font-black uppercase tracking-tight">{selectedCount} selected</p>
                        <p className="text-[10px] text-gray-300 font-bold">Bulk status updates save to the same order status source as single-order changes.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <select
                            className="px-4 py-2 bg-white text-gray-900 border border-gray-700 rounded-lg outline-none text-xs font-black cursor-pointer"
                            value={bulkStatus}
                            onChange={(e) => setBulkStatus(e.target.value)}
                            disabled={isBulkUpdating}
                        >
                            <option value="">Choose status</option>
                            {BULK_STATUS_OPTIONS.map((status) => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                        <button
                            type="button"
                            onClick={handleBulkStatusUpdate}
                            disabled={isBulkUpdating || !bulkStatus}
                            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-xs font-black transition-colors"
                        >
                            {isBulkUpdating ? 'Updating...' : 'Update Selected'}
                        </button>
                    </div>
                </div>
            )}

            {/* Orders Table */}
            {filteredOrders.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-3xl border border-dashed border-gray-200">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                        <MdLocalShipping size={32} />
                    </div>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">No orders found matching your criteria</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="relative md:mx-0">
                        <AdminTable shellClassName="md:rounded-2xl border-y md:border" tableClassName="w-full min-w-max text-left border-collapse">
                                    <AdminTableHead>
                                        <AdminTableHeaderRow>
                                            <AdminTableHeaderCell className="whitespace-nowrap md:whitespace-normal text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={allVisibleSelected}
                                                    ref={(input) => {
                                                        if (input) input.indeterminate = !allVisibleSelected && someVisibleSelected;
                                                    }}
                                                    onChange={handleToggleVisibleOrders}
                                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 cursor-pointer"
                                                    aria-label="Select all visible orders"
                                                />
                                            </AdminTableHeaderCell>
                                            <AdminTableHeaderCell className="whitespace-nowrap md:whitespace-normal">Order ID & Date</AdminTableHeaderCell>
                                            <AdminTableHeaderCell className="whitespace-nowrap md:whitespace-normal">Customer</AdminTableHeaderCell>
                                            <AdminTableHeaderCell className="whitespace-nowrap md:whitespace-normal text-center">Items & Price</AdminTableHeaderCell>
                                            <AdminTableHeaderCell className="whitespace-nowrap md:whitespace-normal text-center">Payment</AdminTableHeaderCell>
                                            <AdminTableHeaderCell className="whitespace-nowrap md:whitespace-normal text-center">Status</AdminTableHeaderCell>
                                            <AdminTableHeaderCell className="whitespace-nowrap md:whitespace-normal text-right">Actions</AdminTableHeaderCell>
                                        </AdminTableHeaderRow>
                                    </AdminTableHead>
                                    <tbody className="divide-y divide-gray-200">
                                        {filteredOrders.map((order, index) => (
                                            <tr key={order.id || `order-${index}`} className="hover:bg-blue-50/10 transition-colors group">
                                                <td className="whitespace-nowrap md:whitespace-normal px-2 py-2 md:px-4 md:py-4 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedOrderIds.has(order.id)}
                                                        onChange={() => handleToggleOrder(order.id)}
                                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 cursor-pointer"
                                                        aria-label={`Select order ${order.displayId || order.id}`}
                                                    />
                                                </td>
                                                <td className="whitespace-nowrap md:whitespace-normal px-2 py-2 md:px-6 md:py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-black text-gray-900 group-hover:text-blue-600 transition-colors">{order.displayId || order.id}</span>
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase mt-1">
                                                            {new Date(order.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="whitespace-nowrap md:whitespace-normal px-2 py-2 md:px-6 md:py-4">
                                                    <div className="flex flex-col">
                                                        {order.user?._id || order.user?.id ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => navigate(`/admin/users/${order.user?._id || order.user?.id}`)}
                                                                className="text-xs font-bold text-blue-700 hover:text-blue-800 hover:underline transition-colors text-left"
                                                                title="Open customer profile"
                                                            >
                                                                {order.user?.name || order.shippingAddress?.name || 'Unknown'}
                                                            </button>
                                                        ) : (
                                                            <span className="text-xs font-bold text-gray-800">
                                                                {order.user?.name || order.shippingAddress?.name || 'Unknown'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="whitespace-nowrap md:whitespace-normal px-2 py-2 md:px-5 md:py-3 text-center">
                                                    <div className="flex items-center justify-center gap-3">
                                                        {/* Product Thumbnails */}
                                                        <div className="flex -space-x-2 overflow-hidden items-center">
                                                            {(order.items || []).slice(0, 3).map((item, idx) => (
                                                                <div key={idx} className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-gray-100 flex-shrink-0">
                                                                    <img
                                                                        src={item.image}
                                                                        alt={item.name}
                                                                        className="h-full w-full object-cover rounded-full"
                                                                    />
                                                                </div>
                                                            ))}
                                                            {(order.items || []).length > 3 && (
                                                                <div className="h-8 w-8 rounded-full ring-2 ring-white bg-gray-50 flex items-center justify-center text-[9px] font-bold text-gray-500 z-10">
                                                                    +{(order.items || []).length - 3}
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="flex flex-col text-left">
                                                            <span className="text-[13px] font-black text-gray-900">₹{(order.total || 0).toLocaleString()}</span>
                                                            <span className="text-[9px] font-bold text-gray-400 uppercase">{(order.items || []).length} {(order.items || []).length === 1 ? 'Item' : 'Items'}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="whitespace-nowrap md:whitespace-normal px-2 py-2 md:px-5 md:py-3 text-center">
                                                    <div className="flex flex-col items-center gap-1">
                                                        <span className="text-[10px] font-black text-gray-500 uppercase">{order.payment?.method || 'N/A'}</span>
                                                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${getAdminPaymentStatusClass(order.payment?.status || 'Pending')}`}>
                                                            {order.payment?.status || 'Pending'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="whitespace-nowrap md:whitespace-normal px-2 py-2 md:px-5 md:py-3 text-center">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-tighter shadow-sm ${getStatusStyle(order.status)}`}>
                                                        {getStatusIcon(order.status)}
                                                        {order.status}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap md:whitespace-normal px-2 py-2 md:px-5 md:py-3 text-right">
                                                    <button
                                                        onClick={() => navigate(`/admin/orders/${order.id}`)}
                                                        className="w-7 h-7 md:w-10 md:h-10 inline-flex items-center justify-center bg-gray-50 hover:bg-blue-600 text-gray-400 hover:text-white rounded-lg md:rounded-xl transition-all shadow-sm border border-transparent hover:border-blue-700"
                                                        title="View Details"
                                                    >
                                                        <MdVisibility size={14} className="md:w-[16px] md:h-[16px]" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                        </AdminTable>

                        {/* Pagination */}
                        {totalPages >= 1 && (
                            <Pagination
                                page={currentPage}
                                pages={totalPages}
                                changePage={handlePageChange}
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderList;


