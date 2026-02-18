import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MdSearch, MdFilterList, MdVisibility, MdChevronLeft, MdChevronRight, MdLocalShipping, MdCheckCircle, MdPendingActions, MdCancel } from 'react-icons/md';
import useOrderStore from '../../store/orderStore';
import Pagination from '../../../../components/Pagination';
import API from '../../../../services/api';

const OrderList = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const userEmailFilter = searchParams.get('user');

    const { orders, fetchOrders } = useOrderStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    // Server-side Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalOrders, setTotalOrders] = useState(0);
    const itemsPerPage = 12;

    const [localOrders, setLocalOrders] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchPaginatedOrders = async () => {
            setLoading(true);
            try {
                const params = {
                    pageNumber: currentPage,
                    limit: itemsPerPage
                };

                if (searchTerm) params.search = searchTerm;
                if (statusFilter !== 'All') params.status = statusFilter;
                if (userEmailFilter) params.user = userEmailFilter;

                const { data } = await API.get('/orders', { params });

                const transformOrder = (order) => ({
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
                        method: order.paymentMethod,
                        status: order.isPaid ? 'Paid' : 'Pending'
                    }
                });

                if (data.orders) {
                    setLocalOrders(data.orders.map(transformOrder));
                    setTotalPages(data.pages);
                    setTotalOrders(data.total);
                } else {
                    setLocalOrders(Array.isArray(data) ? data.map(transformOrder) : []);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(() => {
            fetchPaginatedOrders();
        }, 300); // Debounce search

        return () => clearTimeout(timer);
    }, [currentPage, searchTerm, statusFilter, userEmailFilter]);

    const filteredOrders = localOrders; // Now directly from server

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Pending': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'Confirmed': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'Shipped': return 'bg-purple-50 text-purple-600 border-purple-100';
            case 'Delivered': return 'bg-green-50 text-green-600 border-green-100';
            case 'Cancelled': return 'bg-red-50 text-red-600 border-red-100';
            default: return 'bg-gray-50 text-gray-600 border-gray-100';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Pending': return <MdPendingActions size={14} />;
            case 'Confirmed': return <MdCheckCircle size={14} />;
            case 'Shipped': return <MdLocalShipping size={14} />;
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

    return (
        <div className="space-y-3 md:space-y-4 px-2 md:px-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4">
                <div>
                    <h1 className="text-lg md:text-2xl font-black text-gray-900 tracking-tight">Order Management</h1>
                    <p className="text-xs md:text-sm text-gray-500 font-medium italic">Monitor sales and update fulfillment status ({filteredOrders.length} total)</p>
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
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

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
                        <div className="bg-white md:rounded-2xl border-y md:border border-gray-200 shadow-sm">
                            <div className="overflow-x-auto overflow-y-visible" style={{ WebkitOverflowScrolling: 'touch', maxWidth: '100vw' }}>
                                <table className="w-full min-w-max text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50/50 border-b border-gray-100">
                                            <th className="whitespace-nowrap md:whitespace-normal px-2 py-2 md:px-6 md:py-4 text-[10px] md:text-xs font-black text-gray-900 uppercase tracking-widest">Order ID & Date</th>
                                            <th className="whitespace-nowrap md:whitespace-normal px-2 py-2 md:px-6 md:py-4 text-[10px] md:text-xs font-black text-gray-900 uppercase tracking-widest">CustomerDetails</th>
                                            <th className="whitespace-nowrap md:whitespace-normal px-2 py-2 md:px-6 md:py-4 text-[10px] md:text-xs font-black text-gray-900 uppercase tracking-widest text-center">Items & Price</th>
                                            <th className="whitespace-nowrap md:whitespace-normal px-2 py-2 md:px-6 md:py-4 text-[10px] md:text-xs font-black text-gray-900 uppercase tracking-widest text-center">Payment</th>
                                            <th className="whitespace-nowrap md:whitespace-normal px-2 py-2 md:px-6 md:py-4 text-[10px] md:text-xs font-black text-gray-900 uppercase tracking-widest text-center">Status</th>
                                            <th className="whitespace-nowrap md:whitespace-normal px-2 py-2 md:px-6 md:py-4 text-[10px] md:text-xs font-black text-gray-900 uppercase tracking-widest text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {filteredOrders.map((order, index) => (
                                            <tr key={order.id || `order-${index}`} className="hover:bg-blue-50/10 transition-colors group">
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
                                                        <span className="text-xs font-bold text-gray-800">
                                                            {order.user?.name || order.shippingAddress?.name || 'Unknown'}
                                                        </span>
                                                        <div className="flex flex-col mt-0.5 gap-0.5">
                                                            <span className="text-[10px] text-gray-400 font-medium tracking-tight hover:text-blue-500 transition-colors cursor-pointer">
                                                                {order.user?.email || order.shippingAddress?.email || 'N/A'}
                                                            </span>
                                                            <span className="text-[10px] text-gray-400 font-medium tracking-tight">
                                                                {order.user?.phone || 'N/A'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="whitespace-nowrap md:whitespace-normal px-2 py-2 md:px-6 md:py-4 text-center">
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
                                                <td className="whitespace-nowrap md:whitespace-normal px-2 py-2 md:px-6 md:py-4 text-center">
                                                    <div className="flex flex-col items-center gap-1">
                                                        <span className="text-[10px] font-black text-gray-500 uppercase">{order.payment?.method || 'N/A'}</span>
                                                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${order.payment?.status === 'Paid' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                                                            {order.payment?.status || 'Pending'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="whitespace-nowrap md:whitespace-normal px-2 py-2 md:px-6 md:py-4 text-center">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-tighter shadow-sm ${getStatusStyle(order.status)}`}>
                                                        {getStatusIcon(order.status)}
                                                        {order.status}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap md:whitespace-normal px-2 py-2 md:px-6 md:py-4 text-right">
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
                                </table>
                            </div>
                        </div>

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


