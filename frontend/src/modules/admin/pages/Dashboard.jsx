import React, { useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MdInventory,
    MdShoppingCart,
    MdLocalOffer,
    MdPeople,
    MdCategory,
    MdAttachMoney,
    MdTrendingUp,
    MdAddBox,
    MdLocalShipping,
    MdWarning,
    MdAssignment,
    MdPersonAdd,
    MdAccessTime,
    MdChevronRight
} from 'react-icons/md';
import useProductStore from '../store/productStore';
import useOrderStore from '../store/orderStore';
import useUserStore from '../store/userStore';
import useCategoryStore from '../store/categoryStore';
import useCouponStore from '../store/couponStore';
import useReturnStore from '../store/returnStore';
import useSupportStore from '../store/supportStore';

const parseAmount = (value) => {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    if (typeof value === 'string') {
        const parsed = parseFloat(value.replace(/[^0-9.-]+/g, ''));
        return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
};

const getOrderDate = (order) => {
    const raw = order?.date || order?.createdAt || order?.updatedAt;
    if (!raw) return null;
    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getProductStock = (product) => {
    if (Array.isArray(product?.skus) && product.skus.length > 0) {
        return product.skus.reduce((sum, sku) => sum + (Number(sku?.stock) || 0), 0);
    }
    return Number(product?.stock) || 0;
};

const normalizeStatus = (status) => String(status || '').trim().toUpperCase();

const Dashboard = () => {
    const navigate = useNavigate();
    const { products = [], fetchProducts } = useProductStore();
    const { orders = [], fetchOrders } = useOrderStore();
    const { users = [], fetchUsers } = useUserStore();
    const { categories = [], fetchCategories } = useCategoryStore();
    const { coupons = [], fetchCoupons } = useCouponStore();
    const { returns = [], fetchReturns } = useReturnStore();
    const { supportRequests = [] } = useSupportStore();

    useEffect(() => {
        // Fetch all necessary data on component mount
        fetchProducts();
        fetchOrders();
        fetchUsers();
        fetchCategories();
        fetchCoupons();
        fetchReturns();
    }, [fetchProducts, fetchOrders, fetchUsers, fetchCategories, fetchCoupons, fetchReturns]);


    const activeCoupons = coupons.filter(c => c.active).length;

    // --- Analytics Logic ---

    // 1. Revenue Stats
    const {
        todayRevenue,
        monthRevenue,
        previousMonthRevenue,
        totalRevenue,
        avgOrderValue,
        todayOrdersCount
    } = useMemo(() => {
        const today = new Date().toDateString();
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const previousMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

        let todayRev = 0;
        let monthRev = 0;
        let prevMonthRev = 0;
        let totalRev = 0;
        let ordersToday = 0;

        orders.forEach(order => {
            const orderDate = getOrderDate(order);
            if (!orderDate) return;

            const amount = parseAmount(order.total);
            if (orderDate.toDateString() === today) {
                todayRev += amount;
                ordersToday += 1;
            }
            if (orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear) monthRev += amount;
            if (orderDate.getMonth() === previousMonth && orderDate.getFullYear() === previousMonthYear) prevMonthRev += amount;
            totalRev += amount;
        });

        return {
            todayRevenue: todayRev,
            monthRevenue: monthRev,
            previousMonthRevenue: prevMonthRev,
            totalRevenue: totalRev,
            avgOrderValue: orders.length > 0 ? totalRev / orders.length : 0,
            todayOrdersCount: ordersToday
        };
    }, [orders]);

    const revenueGrowthPct = useMemo(() => {
        if (previousMonthRevenue <= 0) return monthRevenue > 0 ? 100 : 0;
        return ((monthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100;
    }, [monthRevenue, previousMonthRevenue]);

    // 2. Pending Tasks Counts
    const pendingOrders = orders.filter(o => ['PENDING', 'PLACED', 'PROCESSING'].includes(normalizeStatus(o.status))).length;
    const pendingReturns = returns.filter(r => ['PENDING', 'REQUESTED', 'OPEN'].includes(normalizeStatus(r.status))).length;
    const openTickets = supportRequests.filter(r => r.status === 'OPEN').length;

    const totalStockUnits = useMemo(
        () => products.reduce((sum, product) => sum + getProductStock(product), 0),
        [products]
    );

    const outOfStockProducts = useMemo(
        () => products.filter(product => getProductStock(product) <= 0).length,
        [products]
    );

    // 3. Low Stock Alerts
    const lowStockProducts = useMemo(() => {
        return products
            .map(p => ({ ...p, computedStock: getProductStock(p) }))
            .filter(p => p.computedStock > 0 && p.computedStock <= 5)
            .sort((a, b) => a.computedStock - b.computedStock)
            .slice(0, 5);
    }, [products]);

    // 4. Recent Activity (Combine Orders & Users)
    const recentActivity = useMemo(() => {
        const activity = [
            ...orders.map(o => ({
                type: 'order',
                id: o.id,
                text: `New order ${o.id} placed by ${o.user?.name || 'Customer'}`,
                time: o.date || o.createdAt || o.updatedAt,
                icon: MdShoppingCart,
                color: 'gray'
            })),
            ...users.map(u => ({
                type: 'user',
                id: u.id,
                text: `New user ${u.name || 'someone'} registered`,
                time: u.joinDate || new Date().toISOString(),
                icon: MdPersonAdd,
                color: 'gray'
            })),
            ...returns.map(r => ({
                type: 'return',
                id: r.id,
                text: `Return requested for Order ${r.orderId}`,
                time: r.date || r.createdAt || r.updatedAt,
                icon: MdAssignment,
                color: 'gray'
            }))
        ];

        // Sort by time descending and take top 6
        return activity
            .filter(a => a.time)
            .sort((a, b) => new Date(b.time) - new Date(a.time))
            .slice(0, 6);
    }, [orders, users, returns]);

    // 5. Top Customers
    const topCustomers = useMemo(() => {
        const customerSpend = {};
        orders.forEach(order => {
            if (!order.user) return;
            const customerKey = order.user.email || order.user._id || order.user.id;
            if (!customerKey) return;

            const amount = parseAmount(order.total);

            if (!customerSpend[customerKey]) {
                customerSpend[customerKey] = {
                    id: order.user._id || order.user.id, // Support both _id and id
                    name: order.user.name || 'Customer',
                    email: order.user.email,
                    spend: 0,
                    orders: 0
                };
            }
            customerSpend[customerKey].spend += amount;
            customerSpend[customerKey].orders += 1;
        });

        return Object.values(customerSpend)
            .sort((a, b) => b.spend - a.spend)
            .slice(0, 5);
    }, [orders]);

    return (
        <div className="space-y-4 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-xl md:text-3xl font-black text-gray-900 tracking-tight">Dashboard Overview</h1>
                <p className="text-gray-500 mt-2 font-medium">Welcome back! Here's what's happening today.</p>
            </div>

            {/* 1. Key Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
                {/* Standard Counts */}
                <div
                    onClick={() => navigate('/admin/products')}
                    className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all cursor-pointer"
                >
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Products</p>
                        <h3 className="text-xl font-black text-gray-900">{products.length.toLocaleString()}</h3>
                    </div>
                    <div className="w-10 h-10 bg-gray-50 text-gray-600 rounded-2xl flex items-center justify-center group-hover:bg-gray-100 transition-colors">
                        <MdInventory size={24} />
                    </div>
                </div>

                <div
                    onClick={() => navigate('/admin/orders')}
                    className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all cursor-pointer"
                >
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Orders</p>
                        <h3 className="text-xl font-black text-gray-900">{orders.length.toLocaleString()}</h3>
                    </div>
                    <div className="w-10 h-10 bg-gray-50 text-gray-600 rounded-2xl flex items-center justify-center group-hover:bg-gray-100 transition-colors">
                        <MdShoppingCart size={24} />
                    </div>
                </div>

                <div
                    onClick={() => navigate('/admin/users')}
                    className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all cursor-pointer"
                >
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Users</p>
                        <h3 className="text-xl font-black text-gray-900">{users.length.toLocaleString()}</h3>
                    </div>
                    <div className="w-10 h-10 bg-gray-50 text-gray-600 rounded-2xl flex items-center justify-center group-hover:bg-gray-100 transition-colors">
                        <MdPeople size={24} />
                    </div>
                </div>

                <div
                    onClick={() => navigate('/admin/coupons')}
                    className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all cursor-pointer"
                >
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Active Coupons</p>
                        <h3 className="text-xl font-black text-gray-900">{activeCoupons}</h3>
                    </div>
                    <div className="w-10 h-10 bg-gray-50 text-gray-600 rounded-2xl flex items-center justify-center group-hover:bg-gray-100 transition-colors">
                        <MdLocalOffer size={24} />
                    </div>
                </div>

                <div
                    onClick={() => navigate('/admin/stock')}
                    className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all cursor-pointer"
                >
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Stock Units</p>
                        <h3 className="text-xl font-black text-gray-900">{totalStockUnits.toLocaleString()}</h3>
                    </div>
                    <div className="w-10 h-10 bg-gray-50 text-gray-600 rounded-2xl flex items-center justify-center group-hover:bg-gray-100 transition-colors">
                        <MdInventory size={24} />
                    </div>
                </div>

                <div
                    onClick={() => navigate('/admin/stock')}
                    className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all cursor-pointer"
                >
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Out Of Stock</p>
                        <h3 className="text-xl font-black text-gray-900">{outOfStockProducts.toLocaleString()}</h3>
                    </div>
                    <div className="w-10 h-10 bg-gray-50 text-gray-600 rounded-2xl flex items-center justify-center group-hover:bg-gray-100 transition-colors">
                        <MdWarning size={24} />
                    </div>
                </div>
            </div>

            {/* 2. Financial Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div
                    onClick={() => navigate('/admin/orders')}
                    className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-all cursor-pointer"
                >
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Revenue</p>
                        <h3 className="text-xl font-black text-gray-900">&#8377;{Math.round(totalRevenue).toLocaleString()}</h3>
                        <p className={`text-xs font-medium mt-1 flex items-center gap-1 ${revenueGrowthPct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            <MdTrendingUp /> {revenueGrowthPct >= 0 ? '+' : ''}{Math.round(revenueGrowthPct)}% vs last month
                        </p>
                    </div>
                    <div className="w-10 h-10 bg-gray-50 text-gray-600 rounded-2xl flex items-center justify-center">
                        <MdAttachMoney size={24} />
                    </div>
                </div>
                <div
                    onClick={() => navigate('/admin/orders')}
                    className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-all cursor-pointer"
                >
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Today's Sales</p>
                        <h3 className="text-xl font-black text-gray-900">&#8377;{Math.round(todayRevenue).toLocaleString()}</h3>
                        <p className="text-xs font-medium text-gray-500 mt-1">
                            {todayOrdersCount} orders today
                        </p>
                    </div>
                    <div className="w-10 h-10 bg-gray-50 text-gray-600 rounded-2xl flex items-center justify-center">
                        <MdAttachMoney size={24} />
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Avg. Order Value</p>
                        <h3 className="text-xl font-black text-gray-900">&#8377;{Math.round(avgOrderValue).toLocaleString()}</h3>
                    </div>
                    <div className="w-10 h-10 bg-gray-50 text-gray-600 rounded-2xl flex items-center justify-center">
                        <MdCategory size={24} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Left Column (2/3) */}
                <div className="lg:col-span-2 space-y-4">

                    {/* 2. Quick Actions & Pending Tasks Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Quick Actions */}
                        <div className="bg-gray-800 rounded-xl p-4 text-white shadow-lg shadow-gray-200">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                <MdAccessTime className="text-gray-300" /> Quick Actions
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => navigate('/admin/products')} className="bg-white/10 hover:bg-white/20 transition p-2 rounded-lg flex flex-col items-center justify-center gap-2 text-xs font-bold border border-white/10">
                                    <MdAddBox size={24} className="text-gray-200" />
                                    Add Product
                                </button>
                                <button onClick={() => navigate('/admin/coupons')} className="bg-white/10 hover:bg-white/20 transition p-2 rounded-lg flex flex-col items-center justify-center gap-2 text-xs font-bold border border-white/10">
                                    <MdLocalOffer size={24} className="text-gray-200" />
                                    Create Coupon
                                </button>
                                <button onClick={() => navigate('/admin/categories')} className="bg-white/10 hover:bg-white/20 transition p-2 rounded-lg flex flex-col items-center justify-center gap-2 text-xs font-bold border border-white/10">
                                    <MdCategory size={24} className="text-gray-200" />
                                    Add Category
                                </button>
                                <button onClick={() => navigate('/admin/support')} className="bg-white/10 hover:bg-white/20 transition p-2 rounded-lg flex flex-col items-center justify-center gap-2 text-xs font-bold border border-white/10">
                                    <MdPeople size={24} className="text-gray-200" />
                                    View Users
                                </button>
                            </div>
                        </div>

                        {/* Pending Tasks */}
                        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                            <h3 className="font-bold text-lg mb-4 text-gray-800 flex items-center gap-2">
                                <MdAssignment className="text-gray-400" /> Pending Tasks
                            </h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-100 mb-2 cursor-pointer hover:bg-gray-100 transition" onClick={() => navigate('/admin/orders?status=Pending')}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-bold text-xs ring-2 ring-white">
                                            {pendingOrders}
                                        </div>
                                        <span className="text-sm font-bold text-gray-700">Orders to Process</span>
                                    </div>
                                    <MdChevronRight className="text-gray-400" />
                                </div>
                                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-100 mb-2 cursor-pointer hover:bg-gray-100 transition" onClick={() => navigate('/admin/returns')}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-bold text-xs ring-2 ring-white">
                                            {pendingReturns}
                                        </div>
                                        <span className="text-sm font-bold text-gray-700">Returns Pending</span>
                                    </div>
                                    <MdChevronRight className="text-gray-400" />
                                </div>
                                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-100 cursor-pointer hover:bg-gray-100 transition" onClick={() => navigate('/admin/support')}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-bold text-xs ring-2 ring-white">
                                            {openTickets}
                                        </div>
                                        <span className="text-sm font-bold text-gray-700">Support Tickets</span>
                                    </div>
                                    <MdChevronRight className="text-gray-400" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 3. Recent Activity Feed */}
                    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-lg text-gray-800">Recent Activity</h3>
                            <button
                                onClick={() => navigate('/admin/orders')}
                                className="text-xs font-bold text-gray-600 hover:bg-gray-50 px-3 py-1 border border-gray-200 rounded-full transition"
                            >
                                View All Orders
                            </button>
                        </div>
                        <div className="relative pl-2 space-y-6">
                            {/* Timeline Line */}
                            <div className="absolute top-2 left-[19px] bottom-2 w-0.5 bg-gray-100"></div>

                            {recentActivity.map((activity, index) => (
                                <div
                                    key={index}
                                    onClick={() => {
                                        if (activity.type === 'order') navigate(`/admin/orders/${activity.id}`);
                                        else if (activity.type === 'user') navigate(`/admin/users/${activity.id}`);
                                        else if (activity.type === 'return') navigate('/admin/returns');
                                    }}
                                    className="relative flex items-start gap-4 z-10 cursor-pointer group"
                                >
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ring-4 ring-white bg-gray-50 text-gray-600 shrink-0 group-hover:bg-gray-100 transition-colors`}>
                                        <activity.icon size={18} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{activity.text}</p>
                                        <p className="text-xs text-gray-400 font-medium mt-0.5">{new Date(activity.time).toLocaleString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column (1/3) */}
                <div className="space-y-4">
                    {/* 4. Low Stock Alerts */}
                    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <MdWarning className="text-gray-500" size={20} />
                            <h3 className="font-bold text-lg text-gray-800">Low Stock Alert</h3>
                        </div>
                        <div className="space-y-3">
                            {lowStockProducts.length === 0 ? (
                                <p className="text-sm text-gray-400 italic">No low stock items.</p>
                            ) : (
                                lowStockProducts.map(product => (
                                    <div
                                        key={product.id}
                                        onClick={() => navigate(`/admin/products/edit/${product.id}`)}
                                        className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg border border-gray-100 cursor-pointer hover:bg-gray-100 transition"
                                    >
                                        <img src={product.image} alt={product.name} className="w-10 h-10 rounded-lg object-cover bg-white" />
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-xs font-bold text-gray-800 truncate">{product.name}</h4>
                                            <p className="text-[10px] text-gray-500">Stock: <span className="text-red-600 font-black">{product.computedStock} left</span></p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* 5. Top Customers */}
                    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <MdPeople className="text-gray-500" size={20} />
                            <h3 className="font-bold text-lg text-gray-800">Top Customers</h3>
                        </div>
                        <div className="space-y-4">
                            {topCustomers.map((customer, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => customer.id && navigate(`/admin/users/${customer.id}`)}
                                    className={`flex items-center justify-between border-b border-gray-50 last:border-0 pb-3 last:pb-0 ${customer.id ? 'cursor-pointer group' : ''}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-50 text-gray-600 flex items-center justify-center font-bold text-xs uppercase group-hover:bg-gray-100 transition-colors">
                                            {customer.name.substring(0, 2)}
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{customer.name}</h4>
                                            <p className="text-[10px] text-gray-400">{customer.orders} orders</p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-black text-gray-900">&#8377;{Math.round(customer.spend).toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

