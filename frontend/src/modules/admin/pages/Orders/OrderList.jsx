import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MdLocalShipping, MdCheckCircle, MdPendingActions, MdCancel } from 'react-icons/md';
import toast from 'react-hot-toast';
import API from '../../../../services/api';
import { getAdminPaymentStatus } from '../../utils/paymentStatus';
import OrderListFilters from '../../components/orders/OrderListFilters';
import OrderListTable from '../../components/orders/OrderListTable';

const BULK_STATUS_OPTIONS = [
    'Pending',
    'Confirmed',
    'Packed',
    'Dispatched',
    'Out for Delivery',
    'Delivered',
    'Cancelled'
];

const normalizeOrderStatus = (status = '') => {
    const value = String(status || '').trim();
    if (value === 'Shipped') return 'Dispatched';
    return value;
};

const transformOrder = (order) => {
    const normalizedOrderStatus = normalizeOrderStatus(order?.status);

    return {
        ...order,
        id: order._id,
        date: order.createdAt,
        items: order.orderItems?.map((item) => ({
            id: item.product,
            _id: item._id,
            name: item.name,
            title: item.title,
            productName: item.productName,
            image: item.image,
            price: item.price,
            quantity: item.qty,
            qty: item.qty,
            serialNumber: item.serialNumber,
            serialType: item.serialType || 'Serial Number',
            variant: item.variant
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

const OrderList = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const userEmailFilter = searchParams.get('user');

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [localOrders, setLocalOrders] = useState([]);
    const [selectedOrderIds, setSelectedOrderIds] = useState(() => new Set());
    const [bulkStatus, setBulkStatus] = useState('');
    const [isBulkUpdating, setIsBulkUpdating] = useState(false);
    const [serialEditorOrderId, setSerialEditorOrderId] = useState('');
    const [serialInputs, setSerialInputs] = useState({});
    const [serialTypes, setSerialTypes] = useState({});
    const [serialSavingOrderId, setSerialSavingOrderId] = useState('');
    const itemsPerPage = 20;

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

        const timer = setTimeout(fetchPaginatedOrders, 300);
        return () => clearTimeout(timer);
    }, [currentPage, searchTerm, statusFilter, userEmailFilter]);

    const filteredOrders = localOrders;
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

    const resetSerialEditor = () => {
        setSerialEditorOrderId('');
        setSerialInputs({});
        setSerialTypes({});
    };

    const handleOpenSerialEditor = (order) => {
        if (serialEditorOrderId === order.id) {
            resetSerialEditor();
            return;
        }

        const nextInputs = {};
        const nextTypes = {};

        (order.items || []).forEach((item) => {
            if (item.serialNumber) nextInputs[item._id] = item.serialNumber;
            if (item.serialType) nextTypes[item._id] = item.serialType;
        });

        setSerialInputs(nextInputs);
        setSerialTypes(nextTypes);
        setSerialEditorOrderId(order.id);
    };

    const handleSerialSave = async (order) => {
        const serialNumbers = (order.items || []).map((item) => ({
            itemId: item._id,
            serial: (serialInputs[item._id] !== undefined ? serialInputs[item._id] : item.serialNumber || '').trim(),
            type: serialTypes[item._id] !== undefined ? serialTypes[item._id] : (item.serialType || 'Serial Number')
        })).filter((item) => item.serial);

        if (!serialNumbers.length) {
            toast.error('Enter at least one Serial Number or IMEI before saving.');
            return;
        }

        setSerialSavingOrderId(order.id);
        try {
            const { data } = await API.put(`/orders/${order.id}/status`, {
                status: order.baseStatus || order.status,
                serialNumbers
            });

            setLocalOrders((orders) => orders.map((entry) => (
                entry.id === order.id ? transformOrder(data) : entry
            )));
            toast.success('Serial / IMEI saved successfully');
            resetSerialEditor();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save Serial / IMEI');
        } finally {
            setSerialSavingOrderId('');
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
            if (next.has(orderId)) next.delete(orderId);
            else next.add(orderId);
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

            const updatedOrderById = new Map((data.updatedOrders || []).map((order) => [order._id, order]));

            setLocalOrders((orders) => orders.map((order) => {
                const updatedOrder = updatedOrderById.get(order.id);
                return updatedOrder ? transformOrder(updatedOrder) : order;
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

            <OrderListFilters
                searchTerm={searchTerm}
                statusFilter={statusFilter}
                onSearchChange={(value) => {
                    setSearchTerm(value);
                    setCurrentPage(1);
                }}
                onStatusChange={(value) => {
                    setStatusFilter(value);
                    setCurrentPage(1);
                }}
            />

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

            {filteredOrders.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-3xl border border-dashed border-gray-200">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                        <MdLocalShipping size={32} />
                    </div>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">No orders found matching your criteria</p>
                </div>
            ) : (
                <OrderListTable
                    orders={filteredOrders}
                    totalPages={totalPages}
                    currentPage={currentPage}
                    onPageChange={handlePageChange}
                    allVisibleSelected={allVisibleSelected}
                    someVisibleSelected={someVisibleSelected}
                    selectedOrderIds={selectedOrderIds}
                    onToggleVisibleOrders={handleToggleVisibleOrders}
                    onToggleOrder={handleToggleOrder}
                    getStatusStyle={getStatusStyle}
                    getStatusIcon={getStatusIcon}
                    serialEditorOrderId={serialEditorOrderId}
                    onOpenSerialEditor={handleOpenSerialEditor}
                    onResetSerialEditor={resetSerialEditor}
                    onSaveSerial={handleSerialSave}
                    serialInputs={serialInputs}
                    serialTypes={serialTypes}
                    setSerialInputs={setSerialInputs}
                    setSerialTypes={setSerialTypes}
                    serialSavingOrderId={serialSavingOrderId}
                    navigate={navigate}
                />
            )}
        </div>
    );
};

export default OrderList;
