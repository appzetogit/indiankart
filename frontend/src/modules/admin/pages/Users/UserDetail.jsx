import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    MdArrowBack, MdMail, MdPhone, MdLocationOn, MdCalendarToday,
    MdShoppingBag, MdCheckCircle, MdBlock, MdHistory,
    MdPendingActions, MdLocalShipping, MdCancel, MdTrendingUp, MdVerifiedUser
} from 'react-icons/md';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import useUserStore from '../../store/userStore';
import useOrderStore from '../../store/orderStore';
import useReturnStore from '../../store/returnStore';

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

    const user = users.find(u => u.id === id || u._id === id);

    if (!user && !isUserLoading) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center h-[60vh] text-gray-500"
            >
                <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-6 shadow-inner">
                    <MdBlock size={40} className="text-red-300" />
                </div>
                <h2 className="text-2xl font-black uppercase tracking-widest text-gray-900 mb-2">User Not Found</h2>
                <p className="text-sm font-medium text-gray-400 mb-6 italic px-8 text-center max-w-md">
                    The requested account could not be located in our secure directory.
                    It may have been permanently removed or the ID is incorrect.
                </p>
                <button
                    onClick={() => navigate('/admin/users')}
                    className="px-8 py-3 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl hover:bg-black transition-all active:scale-95"
                >
                    Back to Directory
                </button>
            </motion.div>
        );
    }

    if (isUserLoading && !user) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh]">
                <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
                <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-gray-400 italic">Accessing Directory...</p>
            </div>
        );
    }

    // Filter orders for this user
    const userOrders = orders.filter(order => order.user?.email?.toLowerCase() === user?.email?.toLowerCase());

    // Filter returns for this user
    const userReturns = returns.filter(ret => ret.customer?.toLowerCase() === user?.name?.toLowerCase());

    const filteredItems = (() => {
        let items = [];
        if (activeTab === 'Returns') {
            items = userReturns;
        } else if (activeTab === 'All') {
            items = [...userOrders, ...userReturns];
        } else {
            items = userOrders.filter(order => order.status === activeTab);
        }
        return items.sort((a, b) => new Date(b.date) - new Date(a.date));
    })();

    const stats = [
        { label: 'Total Orders', value: user?.orderStats?.total || 0, icon: MdShoppingBag, color: 'blue', gradient: 'from-blue-500 to-indigo-600' },
        { label: 'Completed', value: user?.orderStats?.completed || 0, icon: MdCheckCircle, color: 'green', gradient: 'from-emerald-500 to-teal-600' },
        { label: 'Pending', value: user?.orderStats?.pending || 0, icon: MdPendingActions, color: 'amber', gradient: 'from-amber-400 to-orange-500' },
        { label: 'Total Spent', value: `₹${(user?.financials?.totalSpent || 0).toLocaleString()}`, icon: MdTrendingUp, color: 'indigo', gradient: 'from-violet-500 to-indigo-600' },
    ];

    const tabs = ['All', 'Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled', 'Returns'];

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Pending': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'Confirmed': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'Shipped': return 'bg-purple-50 text-purple-600 border-purple-100';
            case 'Delivered': return 'bg-green-50 text-green-600 border-green-100';
            case 'Cancelled': return 'bg-red-50 text-red-600 border-red-100';
            case 'Pickup Scheduled': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
            case 'Approved': return 'bg-teal-50 text-teal-600 border-teal-100';
            default: return 'bg-gray-50 text-gray-600 border-gray-100';
        }
    };

    const handleToggleStatus = async () => {
        try {
            const action = user.status === 'active' ? 'disable' : 'enable';
            const promise = toggleUserStatus(user.id || user._id);
            await toast.promise(promise, {
                loading: `${action.charAt(0).toUpperCase() + action.slice(1)}ing account...`,
                success: `Account ${action}d successfully`,
                error: (err) => `Failed to ${action} account: ${err}`
            });
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="space-y-4 md:space-y-6 max-w-[1400px] mx-auto relative pb-10 md:pb-20">
            {/* Loading Overlay */}
            <AnimatePresence>
                {isUserLoading && user && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-white/40 backdrop-blur-[2px] flex items-center justify-center"
                    >
                        <div className="bg-white p-6 rounded-3xl shadow-2xl border border-gray-100 flex flex-col items-center">
                            <div className="w-10 h-10 border-[3px] border-gray-100 border-t-blue-600 rounded-full animate-spin"></div>
                            <p className="mt-3 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 italic">Updating Record...</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header / Back Navigation */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 md:gap-6 mb-1 md:mb-2"
            >
                <button
                    onClick={() => navigate('/admin/users')}
                    className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-white hover:bg-gray-900 rounded-xl md:rounded-2xl transition-all text-gray-400 hover:text-white border border-gray-100 shadow-sm active:scale-90"
                >
                    <MdArrowBack size={20} className="md:w-[24px] md:h-[24px]" />
                </button>
                <div className="flex-1">
                    <div className="flex items-center gap-2 md:gap-3">
                        <h1 className="text-xl md:text-3xl font-black text-gray-900 tracking-tight leading-none uppercase italic">Profile View</h1>
                        <span className="hidden md:block w-12 h-0.5 bg-blue-600 rounded-full"></span>
                        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-blue-50/50 rounded-full border border-blue-100">
                            <MdVerifiedUser size={14} className="text-blue-600" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 italic">Verified Identity</span>
                        </div>
                    </div>
                    <p className="text-[8px] md:text-[10px] text-gray-400 font-bold uppercase tracking-[0.3em] mt-1 md:mt-2 italic flex items-center gap-2">
                        System Reference <span className="text-gray-900">{user?.id || user?._id}</span>
                    </p>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Profile Information */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="lg:col-span-4 bg-white/80 backdrop-blur-xl rounded-[2rem] md:rounded-[2.5rem] border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col group sticky top-6"
                >
                    <div className="p-6 md:p-10 md:pb-6 text-center">
                        <div className="relative inline-block group-hover:scale-105 transition-transform duration-500">
                            <div className="w-24 h-24 md:w-36 md:h-36 rounded-[2rem] md:rounded-[3rem] overflow-hidden border-4 border-white shadow-2xl mx-auto rotate-6 group-hover:rotate-0 transition-transform">
                                <img src={user?.avatar || 'https://www.w3schools.com/howto/img_avatar.png'} className="w-full h-full object-cover -rotate-6 group-hover:rotate-0 transition-transform scale-110" alt="" />
                            </div>
                            <span className={`absolute -bottom-2 -right-2 w-6 h-6 md:w-8 md:h-8 rounded-xl md:rounded-2xl border-2 md:border-4 border-white shadow-xl flex items-center justify-center ${user?.status === 'active' ? 'bg-green-500' : 'bg-red-500'
                                }`}>
                                <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-white rounded-full animate-ping"></span>
                            </span>
                        </div>
                        <h2 className="text-xl md:text-2xl font-black text-gray-900 mt-6 md:mt-8 tracking-tighter italic uppercase">{user?.name}</h2>
                        <div className={`mt-3 inline-flex items-center gap-2 px-4 py-1.5 rounded-2xl border text-[10px] font-black uppercase tracking-[0.2em] ${user?.status === 'active'
                            ? 'bg-green-50/50 text-green-600 border-green-100'
                            : 'bg-red-50/50 text-red-600 border-red-100'
                            }`}>
                            Account {user?.status}
                        </div>
                    </div>

                    <div className="p-10 pt-6 space-y-4">
                        {[
                            { icon: MdMail, label: 'Email', value: user?.email, color: 'blue' },
                            { icon: MdPhone, label: 'Phone', value: `+91 ${user?.phone || 'N/A'}`, color: 'emerald' },
                            { icon: MdLocationOn, label: 'Address', value: user?.address || 'N/A', color: 'violet' },
                            { icon: MdCalendarToday, label: 'Joined', value: user?.joinedDate ? new Date(user.joinedDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : 'N/A', color: 'amber' }
                        ].map((item, idx) => (
                            <div key={idx} className="flex items-start gap-4 p-4 bg-gray-50/50 hover:bg-white rounded-3xl border border-transparent hover:border-gray-100 hover:shadow-xl transition-all cursor-default">
                                <div className={`w-12 h-12 rounded-[1.25rem] bg-${item.color}-500/10 text-${item.color}-600 flex items-center justify-center flex-shrink-0`}>
                                    <item.icon size={20} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{item.label}</p>
                                    <p className="text-xs font-bold text-gray-800 mt-1 truncate leading-tight">{item.value}</p>
                                </div>
                            </div>
                        ))}

                        <button
                            onClick={handleToggleStatus}
                            className={`w-full py-5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 mt-6 shadow-2xl active:scale-95 border ${user?.status === 'active'
                                ? 'bg-red-500 text-white border-red-600 hover:bg-black hover:border-black shadow-red-200'
                                : 'bg-green-600 text-white border-green-700 hover:bg-black hover:border-black shadow-green-200'
                                }`}
                        >
                            {user?.status === 'active' ? <><MdBlock size={18} /> Disable Policy</> : <><MdCheckCircle size={18} /> Restore Access</>}
                        </button>
                    </div>
                </motion.div>

                {/* Stats & History */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                        {stats.map((stat, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.2 + idx * 0.05 }}
                                className="bg-white p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center group hover:bg-gray-900 transition-all cursor-default overflow-hidden relative"
                            >
                                <div className={`absolute -right-4 -top-4 w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-10 blur-xl transition-opacity`}></div>
                                <div className={`w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl mb-3 md:mb-4 flex items-center justify-center bg-${stat.color}-50 text-${stat.color}-500 group-hover:bg-white/10 group-hover:text-white transition-all duration-500 rotate-3 group-hover:rotate-0`}>
                                    <stat.icon size={20} className="md:w-[28px] md:h-[28px]" />
                                </div>
                                <p className="text-lg md:text-2xl font-black text-gray-900 group-hover:text-white leading-none tracking-tighter transition-colors italic">{stat.value}</p>
                                <p className="text-[8px] md:text-[9px] font-black text-gray-400 group-hover:text-gray-100/50 uppercase tracking-widest mt-2 md:mt-3 transition-colors">{stat.label}</p>
                            </motion.div>
                        ))}
                    </div>

                    {/* Activity Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-white rounded-[2rem] md:rounded-[2.5rem] border border-gray-100 shadow-2xl overflow-hidden flex flex-col h-full min-h-[500px] md:min-h-[600px]"
                    >
                        <div className="p-4 md:p-8 border-b border-gray-50 flex flex-col xl:flex-row xl:items-center justify-between gap-4 md:gap-6">
                            <div className="flex items-center gap-3 md:gap-4">
                                <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-50 rounded-xl md:rounded-2xl flex items-center justify-center text-gray-400 shadow-inner">
                                    <MdHistory size={20} className="md:w-[24px] md:h-[24px]" />
                                </div>
                                <div>
                                    <h3 className="text-lg md:text-xl font-black text-gray-900 tracking-tight uppercase italic">
                                        {activeTab === 'Returns' ? 'Returns Ledger' : 'Trade Activity'}
                                    </h3>
                                    <p className="text-[9px] md:text-[10px] font-black text-gray-300 uppercase tracking-widest mt-0.5 md:mt-1 italic">Audit history for all interactions</p>
                                </div>
                            </div>

                            <div className="flex gap-1 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
                                {tabs.map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap active:scale-90 ${activeTab === tab
                                            ? 'bg-gray-900 text-white shadow-2xl shadow-gray-400 rotate-1'
                                            : 'bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                                            }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        </div>



                        <div className="p-4 md:p-8 flex-1 overflow-y-auto max-h-[600px] md:max-h-[800px] space-y-3 md:space-y-4">
                            <AnimatePresence mode="popLayout">
                                {filteredItems.length === 0 ? (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 0.4 }}
                                        className="flex flex-col items-center justify-center py-32 text-center"
                                    >
                                        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                                            <MdShoppingBag size={48} className="text-gray-300" />
                                        </div>
                                        <p className="text-xs font-black uppercase tracking-[0.3em] italic text-gray-900">End of records</p>
                                        <p className="text-[9px] font-bold text-gray-400 mt-2">No {activeTab.toLowerCase()} items found</p>
                                    </motion.div>
                                ) : (
                                    filteredItems.map(item => {
                                        const isReturn = item.type === 'Return' || item.type === 'Replacement';
                                        return (
                                            <motion.div
                                                layout
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                key={item.id}
                                                className="p-4 md:p-6 bg-gray-50/50 rounded-[1.5rem] md:rounded-[2rem] border border-gray-100 flex flex-col md:flex-row gap-4 md:gap-8 hover:bg-white hover:shadow-2xl hover:scale-[1.01] transition-all group overflow-hidden relative cursor-default"
                                            >
                                                <div className="flex-1 space-y-4 relative z-10">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] font-black text-gray-900 group-hover:text-blue-600 transition-colors uppercase italic tracking-wider">{item.id}</span>
                                                                {isReturn && (
                                                                    <span className="text-[8px] font-black bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full uppercase tracking-widest border border-blue-200">
                                                                        {item.type}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-2">
                                                                <MdCalendarToday size={12} className="text-gray-300" />
                                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                                                    {new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} at {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <span className={`px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest shadow-sm ${getStatusStyle(item.status)}`}>
                                                            {item.status}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-4">
                                                        {isReturn ? (
                                                            <>
                                                                <div className="w-16 h-16 rounded-2xl border-4 border-white shadow-xl overflow-hidden bg-white flex-shrink-0 rotate-3 group-hover:rotate-0 transition-transform">
                                                                    <img src={item.product?.image} className="w-full h-full object-cover" alt="" />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-[13px] font-black text-gray-900 truncate leading-tight italic uppercase">{item.product?.name}</p>
                                                                    <p className="text-[9px] font-black text-red-500 mt-1.5 uppercase tracking-widest flex items-center gap-1">
                                                                        <MdBlock size={10} /> {item.reason}
                                                                    </p>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <div className="flex -space-x-3 overflow-hidden p-1">
                                                                {item.items?.map((prod, idx) => (
                                                                    <div key={idx} className="w-12 h-12 rounded-2xl border-4 border-white shadow-xl overflow-hidden bg-white transition-transform group-hover:-translate-y-1" style={{ transitionDelay: `${idx * 50}ms` }}>
                                                                        <img src={prod.image} className="w-full h-full object-cover" alt="" />
                                                                    </div>
                                                                ))}
                                                                {item.items?.length > 4 && (
                                                                    <div className="w-12 h-12 rounded-2xl border-4 border-white shadow-xl bg-gray-900 text-white flex items-center justify-center text-[11px] font-black z-10">
                                                                        +{item.items.length - 4}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="md:w-px h-px md:h-auto bg-gray-100/50"></div>

                                                <div className="flex flex-col justify-center items-end text-right min-w-[140px] relative z-10">
                                                    <p className="text-[10px] font-black text-gray-300 uppercase italic tracking-tighter">
                                                        {isReturn ? (item.type === 'Return' ? 'Credit Back' : 'Asset Value') : 'Invoice Value'}
                                                    </p>
                                                    <p className="text-2xl font-black text-gray-900 mt-2 tracking-tighter italic">
                                                        ₹{(isReturn ? item.product?.price : item.total || 0).toLocaleString()}
                                                    </p>
                                                    <button
                                                        onClick={() => navigate(isReturn ? `/admin/returns` : `/admin/orders/${item.id}`)}
                                                        className="mt-6 px-4 py-2 bg-white hover:bg-gray-900 text-[9px] font-black text-gray-900 hover:text-white border border-gray-100 hover:border-black rounded-xl flex items-center gap-2 uppercase tracking-[0.2em] shadow-sm transition-all active:scale-95"
                                                    >
                                                        Inspect <MdArrowBack className="rotate-180" size={14} />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        );
                                    })
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </div>
            </div >
        </div >
    );
};

export default UserDetail;

