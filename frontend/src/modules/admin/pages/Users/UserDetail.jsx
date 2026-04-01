import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    MdArrowBack,
    MdMail,
    MdPhone,
    MdCalendarToday,
    MdCheckCircle,
    MdBlock,
    MdHistory,
    MdPendingActions,
    MdLocalShipping,
    MdReplay,
    MdPerson,
} from 'react-icons/md';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import useUserStore from '../../store/userStore';
import useOrderStore from '../../store/orderStore';
import useReturnStore from '../../store/returnStore';

const ORDER_TABS = ['All', 'Pending', 'Confirmed', 'Packed', 'Dispatched', 'Out for Delivery', 'Delivered', 'Cancelled', 'Returns', 'Replacements'];

const UserDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { users, toggleUserStatus, fetchUsers, isLoading: isUserLoading } = useUserStore();
    const { orders, fetchOrders, isLoading: isOrdersLoading } = useOrderStore();
    const { returns, fetchReturns, isLoading: isReturnsLoading } = useReturnStore();
    const [activeTab, setActiveTab] = useState('All');

    useEffect(() => {
        fetchUsers();
        fetchOrders();
        fetchReturns();
    }, [fetchUsers, fetchOrders, fetchReturns]);

    const user = users.find((u) => String(u.id || u._id) === String(id));

    const normalizeOrderStatus = (status = '') => {
        const value = String(status || '').trim();
        if (value === 'Shipped') return 'Dispatched';
        return value;
    };

    const userOrders = useMemo(() => {
        if (!user) return [];
        return orders.filter((order) => {
            const orderUserId = order.user?._id || order.user?.id || order.user;
            return (
                String(orderUserId || '') === String(user._id || user.id) ||
                String(order.user?.email || '').toLowerCase() === String(user.email || '').toLowerCase()
            );
        });
    }, [orders, user]);

    const userReturns = useMemo(() => {
        if (!user) return [];
        return returns.filter((ret) => {
            const returnUserId = ret.userId || ret.user?._id || ret.user?.id;
            return (
                String(returnUserId || '') === String(user._id || user.id) ||
                String(ret.customer || '').toLowerCase() === String(user.name || '').toLowerCase()
            );
        });
    }, [returns, user]);

    const metrics = useMemo(() => {
        const totalOrders = userOrders.length || user?.orderStats?.total || 0;
        const deliveredOrders = userOrders.filter((order) => normalizeOrderStatus(order.status) === 'Delivered').length || user?.orderStats?.completed || 0;
        const pendingOrders = userOrders.filter((order) => ['Pending', 'Confirmed', 'Packed', 'Dispatched', 'Out for Delivery'].includes(normalizeOrderStatus(order.status))).length || user?.orderStats?.pending || 0;
        const cancelledOrders = userOrders.filter((order) => normalizeOrderStatus(order.status) === 'Cancelled').length;
        const totalReturns = userReturns.length;
        const totalSpent = userOrders.reduce((sum, order) => sum + Number(order.total || 0), 0) || Number(user?.financials?.totalSpent || 0);

        return {
            totalOrders,
            deliveredOrders,
            pendingOrders,
            cancelledOrders,
            totalReturns,
            totalSpent,
        };
    }, [userOrders, userReturns, user]);

    const savedAddresses = useMemo(() => {
        return Array.isArray(user?.addresses) ? user.addresses : [];
    }, [user]);

    const filteredItems = useMemo(() => {
        let items = [];
        if (activeTab === 'Returns') {
            items = userReturns.filter((ret) => ret.type === 'Return');
        } else if (activeTab === 'Replacements') {
            items = userReturns.filter((ret) => ret.type === 'Replacement');
        } else if (activeTab === 'All') {
            items = [...userOrders, ...userReturns];
        } else {
            items = userOrders.filter((order) => normalizeOrderStatus(order.status) === activeTab);
        }

        return items.sort((a, b) => {
            const aTime = new Date(a.date || a.createdAt || a.updatedAt || 0).getTime();
            const bTime = new Date(b.date || b.createdAt || b.updatedAt || 0).getTime();
            return bTime - aTime;
        });
    }, [activeTab, userOrders, userReturns]);

    const getStatusStyle = (status = '') => {
        const normalizedStatus = normalizeOrderStatus(status);
        switch (normalizedStatus) {
            case 'Pending':
                return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'Confirmed':
                return 'bg-sky-50 text-sky-700 border-sky-200';
            case 'Packed':
                return 'bg-indigo-50 text-indigo-700 border-indigo-200';
            case 'Dispatched':
                return 'bg-violet-50 text-violet-700 border-violet-200';
            case 'Out for Delivery':
                return 'bg-cyan-50 text-cyan-700 border-cyan-200';
            case 'Delivered':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'Cancelled':
                return 'bg-red-50 text-red-700 border-red-200';
            case 'Approved':
                return 'bg-teal-50 text-teal-700 border-teal-200';
            case 'Rejected':
                return 'bg-rose-50 text-rose-700 border-rose-200';
            case 'Completed':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            default:
                return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getDisplayStatus = (item) => {
        if (item?.type === 'Return' && item?.status === 'Completed') return 'Returned';
        if (item?.type === 'Replacement' && item?.status === 'Completed') return 'Replaced';
        return item?.type ? item.status : normalizeOrderStatus(item?.status);
    };

    const getItemTimestamp = (item) => {
        const value = item.date || item.createdAt || item.updatedAt;
        if (!value) return 'N/A';
        const time = new Date(value);
        return time.toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const handleToggleStatus = async () => {
        try {
            const action = (user.status || 'active') === 'active' ? 'disable' : 'enable';
            const promise = toggleUserStatus(user.id || user._id);
            await toast.promise(promise, {
                loading: `${action.charAt(0).toUpperCase() + action.slice(1)}ing account...`,
                success: `Account ${action}d successfully`,
                error: (err) => `Failed to ${action} account: ${err}`,
            });
        } catch (error) {
            console.error(error);
        }
    };

    if (!user && !isUserLoading) {
        return (
            <div className="flex min-h-[55vh] flex-col items-center justify-center rounded-3xl border border-gray-200 bg-white px-6 text-center shadow-sm">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                    <MdBlock size={28} />
                </div>
                <h2 className="text-2xl font-black text-gray-900">User not found</h2>
                <p className="mt-2 max-w-md text-sm font-medium text-gray-500">
                    The requested user profile could not be found.
                </p>
                <button
                    onClick={() => navigate('/admin/users')}
                    className="mt-6 rounded-2xl bg-gray-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-black"
                >
                    Back to users
                </button>
            </div>
        );
    }

    if (isUserLoading && !user) {
        return (
            <div className="flex min-h-[55vh] flex-col items-center justify-center">
                <div className="h-12 w-12 rounded-full border-4 border-gray-200 border-t-gray-900 animate-spin"></div>
                <p className="mt-4 text-sm font-semibold text-gray-500">Loading user details...</p>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-7xl space-y-5 pb-10">
            <AnimatePresence>
                {(isUserLoading || isOrdersLoading || isReturnsLoading) && user && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-white/40 backdrop-blur-[1px]"
                    >
                        <div className="rounded-3xl border border-gray-200 bg-white px-6 py-5 shadow-lg">
                            <div className="mx-auto h-10 w-10 rounded-full border-4 border-gray-200 border-t-gray-900 animate-spin"></div>
                            <p className="mt-3 text-sm font-semibold text-gray-600">Refreshing details...</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex flex-col gap-4 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between md:p-6">
                <div className="flex items-start gap-4">
                    <button
                        onClick={() => navigate('/admin/users')}
                        className="flex h-11 w-11 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
                    >
                        <MdArrowBack size={22} />
                    </button>
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">User Profile</p>
                        <h1 className="mt-1 text-2xl font-black text-gray-900 md:text-3xl">{user?.name || 'Unnamed User'}</h1>
                        <p className="mt-1 break-all text-sm font-medium text-gray-500">{user?.id || user?._id}</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <span className={`inline-flex items-center rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.16em] ${(user?.status || 'active') === 'active'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-red-200 bg-red-50 text-red-700'
                        }`}>
                        {(user?.status || 'active') === 'active' ? 'Active account' : 'Disabled account'}
                    </span>
                    <button
                        onClick={handleToggleStatus}
                        className={`rounded-2xl px-5 py-3 text-sm font-bold text-white transition ${(user?.status || 'active') === 'active'
                            ? 'bg-red-600 hover:bg-red-700'
                            : 'bg-emerald-600 hover:bg-emerald-700'
                            }`}
                    >
                        {(user?.status || 'active') === 'active' ? 'Disable User' : 'Enable User'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
                <div className="space-y-5 xl:col-span-4">
                    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
                                {user?.avatar ? (
                                    <img src={user.avatar} alt={user?.name || 'User'} className="h-full w-full object-cover" />
                                ) : (
                                    <span className="text-2xl font-black text-gray-700">
                                        {String(user?.name || 'U').charAt(0).toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <div className="min-w-0">
                                <h2 className="truncate text-xl font-black text-gray-900">{user?.name || 'Unnamed User'}</h2>
                                <p className="mt-1 text-sm font-medium text-gray-500">{user?.email || 'No email available'}</p>
                            </div>
                        </div>

                        <div className="mt-6 space-y-4">
                            <div className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                                <MdMail className="mt-0.5 text-gray-400" size={18} />
                                <div>
                                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Email</p>
                                    <p className="mt-1 text-sm font-semibold text-gray-800 break-all">{user?.email || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                                <MdPhone className="mt-0.5 text-gray-400" size={18} />
                                <div>
                                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Phone</p>
                                    <p className="mt-1 text-sm font-semibold text-gray-800">{user?.phone ? `+91 ${user.phone}` : 'N/A'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                                <MdCalendarToday className="mt-0.5 text-gray-400" size={18} />
                                <div>
                                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Joined</p>
                                    <p className="mt-1 text-sm font-semibold text-gray-800">
                                        {user?.joinedDate || user?.createdAt
                                            ? new Date(user.joinedDate || user.createdAt).toLocaleDateString('en-IN', {
                                                day: '2-digit',
                                                month: 'long',
                                                year: 'numeric',
                                            })
                                            : 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h3 className="text-sm font-black uppercase tracking-[0.18em] text-gray-700">Saved Addresses</h3>
                        <div className="mt-4 space-y-3">
                            {savedAddresses.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-5 text-sm font-medium text-gray-500">
                                    No saved addresses available.
                                </div>
                            ) : (
                                savedAddresses.map((address, index) => (
                                    <div key={address.id || index} className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="inline-flex rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-gray-700 border border-gray-200">
                                                {address.type || 'Home'}
                                            </span>
                                            {address.isDefault && (
                                                <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700 border border-emerald-200">
                                                    Default
                                                </span>
                                            )}
                                        </div>
                                        <div className="mt-3 space-y-1.5 text-sm font-medium text-gray-700">
                                            <p className="font-black text-gray-900">{address.name || user?.name || 'N/A'}</p>
                                            <p>{address.mobile ? `+91 ${address.mobile}` : 'N/A'}</p>
                                            <p className="break-words">
                                                {[address.address, address.city, address.state, address.pincode]
                                                    .map((part) => String(part || '').trim())
                                                    .filter(Boolean)
                                                    .join(', ') || 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                </div>

                <div className="space-y-5 xl:col-span-8">
                    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                        <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
                            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Total Orders</p>
                            <p className="mt-2 text-xl font-black text-gray-900">{metrics.totalOrders}</p>
                        </div>
                        <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
                            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Delivered</p>
                            <p className="mt-2 text-xl font-black text-gray-900">{metrics.deliveredOrders}</p>
                        </div>
                        <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
                            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Open Orders</p>
                            <p className="mt-2 text-xl font-black text-gray-900">{metrics.pendingOrders}</p>
                        </div>
                        <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
                            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Total Spent</p>
                            <p className="mt-2 text-xl font-black text-gray-900">Rs. {metrics.totalSpent.toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-gray-200 bg-white shadow-sm">
                        <div className="border-b border-gray-200 px-5 py-5 md:px-6">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-100 text-gray-700">
                                        <MdHistory size={22} />
                                    </div>
                                    <h3 className="text-lg font-black text-gray-900">Activity & Orders</h3>
                                </div>
                                <div className="flex gap-2 overflow-x-auto pb-1">
                                    {ORDER_TABS.map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab)}
                                            className={`whitespace-nowrap rounded-2xl px-4 py-2 text-xs font-black uppercase tracking-[0.14em] transition ${activeTab === tab
                                                ? 'bg-gray-900 text-white'
                                                : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                                                }`}
                                        >
                                            {tab}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="max-h-[820px] space-y-4 overflow-y-auto p-5 md:p-6">
                            {filteredItems.length === 0 ? (
                                <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-300 bg-gray-50 px-6 py-16 text-center">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-gray-400 shadow-sm">
                                        <MdPerson size={28} />
                                    </div>
                                    <p className="mt-4 text-base font-black text-gray-900">No records found</p>
                                    <p className="mt-1 text-sm font-medium text-gray-500">There is no activity available for the selected tab.</p>
                                </div>
                            ) : (
                                filteredItems.map((item) => {
                                    const isReturn = item.type === 'Return' || item.type === 'Replacement';
                                    const itemKey = item._id || item.id;
                                    const normalizedStatus = isReturn ? item.status : normalizeOrderStatus(item.status);
                                    const displayStatus = getDisplayStatus(item);
                                    const amountValue = isReturn ? Number(item.product?.price || 0) : Number(item.total || 0);
                                    const paymentMethodValue = String(item.payment?.method || '').trim().toUpperCase();
                                    const isOnlinePaidOrder = !isReturn
                                        && paymentMethodValue
                                        && paymentMethodValue !== 'COD'
                                        && ['PAID', 'COMPLETED'].includes(String(item.payment?.status || '').trim().toUpperCase());
                                    const displayPaymentStatus = !isReturn && (normalizedStatus === 'Delivered' || isOnlinePaidOrder)
                                        ? 'Completed'
                                        : (item.payment?.status || 'Pending');
                                    const paymentLabel = item.payment?.method || 'Payment';

                                    return (
                                        <div
                                            key={itemKey}
                                            className="rounded-3xl border border-gray-200 bg-gray-50 p-4 transition hover:border-gray-300 hover:bg-white md:p-5"
                                        >
                                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="rounded-full bg-gray-900 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-white">
                                                            {isReturn ? item.type : 'Order'}
                                                        </span>
                                                        <span className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] ${getStatusStyle(normalizedStatus)}`}>
                                                            {displayStatus || 'N/A'}
                                                        </span>
                                                    </div>

                                                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-semibold text-gray-500">
                                                        <span>{isReturn ? (item.displayId || item.id || 'Return Request') : (item.displayId || item.id || 'Order')}</span>
                                                        <span>{getItemTimestamp(item)}</span>
                                                    </div>

                                                    {isReturn ? (
                                                        <div className="mt-4 flex items-center gap-4">
                                                            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-white">
                                                                {item.product?.image ? (
                                                                    <img src={item.product.image} alt={item.product?.name || 'Return item'} className="h-full w-full object-cover" />
                                                                ) : (
                                                                    <MdReplay className="text-gray-400" size={24} />
                                                                )}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="truncate text-base font-black text-gray-900">{item.product?.name || 'Product'}</p>
                                                                <p className="mt-1 text-sm font-medium text-gray-500">{item.reason || 'No reason provided'}</p>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="mt-4 flex items-center gap-3">
                                                            <div className="flex -space-x-2 overflow-hidden">
                                                                {(item.items || []).slice(0, 4).map((product, index) => (
                                                                    <div
                                                                        key={`${itemKey}-${index}`}
                                                                        className="h-12 w-12 overflow-hidden rounded-2xl border-2 border-white bg-white shadow-sm"
                                                                    >
                                                                        <img src={product.image} alt={product.name || 'Product'} className="h-full w-full object-cover" />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-base font-black text-gray-900">{(item.items || []).length} item{(item.items || []).length === 1 ? '' : 's'}</p>
                                                                <p className="mt-1 text-sm font-medium text-gray-500">
                                                                    {paymentLabel} • {displayPaymentStatus}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex min-w-[190px] flex-col items-start gap-3 rounded-2xl border border-gray-200 bg-white p-4 lg:items-end lg:text-right">
                                                    <div>
                                                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">
                                                            {isReturn ? 'Request Value' : 'Order Value'}
                                                        </p>
                                                        <p className="mt-2 text-xl font-black text-gray-900">Rs. {amountValue.toLocaleString()}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => navigate(isReturn ? '/admin/returns' : `/admin/orders/${item.id}`)}
                                                        className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
                                                    >
                                                        {isReturn ? <MdReplay size={18} /> : <MdLocalShipping size={18} />}
                                                        View Details
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserDetail;
