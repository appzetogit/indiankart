import React, { useState, useEffect } from 'react';
import {
    MdNotifications,
    MdAdd,
    MdDelete,
    MdFilterList,
    MdSend,
    MdClose,
    MdPeopleAlt,
    MdCategory,
    MdHistory,
    MdCheckCircle
} from 'react-icons/md';
import useNotificationStore from '../../store/notificationStore';
import { confirmToast } from '../../../../utils/toastUtils.jsx';
import toast from 'react-hot-toast';

const NotificationManager = () => {
    const {
        filteredPushNotifications,
        addPushNotification,
        deletePushNotification,
        filterPushNotifications,
        showForm,
        toggleForm,
        fetchNotifications
    } = useNotificationStore();

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const [formData, setFormData] = useState({
        title: '',
        message: '',
        type: 'General',
        targetAudience: 'All Users'
    });

    const [filters, setFilters] = useState({
        type: 'All',
        target: 'All'
    });

    const notificationTypes = ['General', 'Promotional', 'Order Update', 'New Arrival'];
    const targetAudiences = ['All Users', 'New Users', 'Active Users', 'Inactive Users'];

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        const newFilters = { ...filters, [name]: value };
        setFilters(newFilters);
        filterPushNotifications(newFilters.type, newFilters.target);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.message) {
            toast.error('Please fill in both title and message');
            return;
        }

        try {
            const result = await addPushNotification(formData);
            if (result.firebaseSent) {
                toast.success(`✅ Notification sent to ${result.tokensTargeted} users!`);
            } else {
                toast(`⚠️ Notification created but not sent (${result.tokensTargeted} tokens targeted)`, {
                    icon: '⚠️',
                    style: {
                        background: '#FEF3C7',
                        color: '#92400E',
                    }
                });
            }
            setFormData({
                title: '',
                message: '',
                type: 'General',
                targetAudience: 'All Users'
            });
        } catch (error) {
            toast.error('Failed to send notification: ' + (error.message || 'Unknown error'));
        }
    };

    const handleTestNotification = async () => {
        try {
            await addPushNotification({
                title: '🔔 Test Notification',
                message: 'This is a test push notification from your admin panel!',
                type: 'General',
                targetAudience: 'All Users'
            });
            toast.success('Test notification sent!');
        } catch (error) {
            toast.error('Failed to send test notification');
        }
    };

    const handleDelete = (id) => {
        confirmToast({
            message: 'Are you sure you want to delete this notification record?',
            type: 'danger',
            confirmText: 'Delete',
            onConfirm: () => {
                deletePushNotification(id);
                toast.success('Notification deleted');
            }
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Sent': return 'bg-green-100 text-green-700 border-green-200';
            case 'Failed': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'Promotional': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'Order Update': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'New Arrival': return 'bg-orange-100 text-orange-700 border-orange-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                        <MdNotifications size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Push Notifications</h1>
                        <p className="text-sm text-gray-500 font-medium">Create and manage blast notifications for your users</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleTestNotification}
                        className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-200"
                    >
                        <MdSend size={18} />
                        Test Push
                    </button>
                    <button
                        onClick={toggleForm}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-lg ${showForm
                            ? 'bg-gray-100 text-gray-600 hover:bg-gray-200 shadow-none'
                            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200'
                            }`}
                    >
                        {showForm ? <MdClose size={20} /> : <MdAdd size={20} />}
                        {showForm ? 'Cancel Creation' : 'Create Notification'}
                    </button>
                </div>
            </div>

            {/* Create Notification Form */}
            {showForm && (
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center gap-3 border-b border-gray-50 pb-4 mb-6">
                        <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                            <MdSend size={18} />
                        </span>
                        <h2 className="text-lg font-bold text-gray-800">New Push Campaign</h2>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Notification Title</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    placeholder="e.g. ⚡ Flash Sale Alert!"
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-gray-900 caret-black placeholder:text-gray-400"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Notification Type</label>
                                <select
                                    name="type"
                                    value={formData.type}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-gray-900"
                                >
                                    {notificationTypes.map(type => <option key={type} value={type}>{type}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Message Content</label>
                            <textarea
                                name="message"
                                value={formData.message}
                                onChange={handleInputChange}
                                placeholder="Write your notification message here..."
                                rows="3"
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-gray-900 caret-black placeholder:text-gray-400 resize-none"
                                maxLength="200"
                                required
                            />
                            <p className="text-[10px] text-gray-400 text-right font-medium">Max 200 characters recommended for best delivery</p>
                        </div>

                        <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-white rounded-lg text-blue-500 shadow-sm">
                                    <MdPeopleAlt size={24} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-700">Target Audience Selection</p>
                                    <p className="text-xs text-gray-500">Who should receive this notification?</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {targetAudiences.map(target => (
                                    <button
                                        key={target}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, targetAudience: target }))}
                                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${formData.targetAudience === target
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-md transform -translate-y-0.5'
                                            : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        {target}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button
                                type="submit"
                                className="flex items-center gap-2 bg-blue-600 text-white px-10 py-3.5 rounded-2xl font-black uppercase tracking-wider hover:bg-blue-700 transition-all shadow-xl shadow-blue-100"
                            >
                                <MdSend size={20} />
                                Send Notification Now
                            </button>
                        </div>
                    </form>
                </div>
            )
            }

            {/* Notifications List Table */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <MdHistory className="text-gray-400" size={20} />
                        <h3 className="font-bold text-gray-700">Notification History</h3>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-sm">
                            <MdFilterList className="text-gray-400" size={16} />
                            <select
                                name="type"
                                value={filters.type}
                                onChange={handleFilterChange}
                                className="text-[10px] font-black uppercase tracking-widest text-gray-600 outline-none bg-transparent"
                            >
                                <option value="All">All Types</option>
                                {notificationTypes.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-sm">
                            <MdPeopleAlt className="text-gray-400" size={16} />
                            <select
                                name="target"
                                value={filters.target}
                                onChange={handleFilterChange}
                                className="text-[10px] font-black uppercase tracking-widest text-gray-600 outline-none bg-transparent"
                            >
                                <option value="All">All Audiences</option>
                                {targetAudiences.map(a => <option key={a} value={a}>{a}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-[10px] md:text-xs font-black text-gray-900 uppercase tracking-widest">S.No</th>
                                <th className="px-6 py-4 text-[10px] md:text-xs font-black text-gray-900 uppercase tracking-widest">Title & Message</th>
                                <th className="px-6 py-4 text-[10px] md:text-xs font-black text-gray-900 uppercase tracking-widest text-center">Type</th>
                                <th className="px-6 py-4 text-[10px] md:text-xs font-black text-gray-900 uppercase tracking-widest text-center">Audience</th>
                                <th className="px-6 py-4 text-[10px] md:text-xs font-black text-gray-900 uppercase tracking-widest text-center">Status</th>
                                <th className="px-6 py-4 text-[10px] md:text-xs font-black text-gray-900 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredPushNotifications.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-400 italic">
                                        No notifications found matching your filters.
                                    </td>
                                </tr>
                            ) : (
                                filteredPushNotifications.map((notif, index) => (
                                    <tr key={notif._id || notif.id} className="hover:bg-blue-50/5 transition-colors group">
                                        <td className="px-6 py-4 font-bold text-gray-400 text-sm">#{index + 1}</td>
                                        <td className="px-6 py-4 max-w-md">
                                            <p className="font-bold text-gray-800 text-sm">{notif.title}</p>
                                            <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{notif.message}</p>
                                            <p className="text-[10px] text-gray-400 font-medium mt-1 uppercase">{new Date(notif.sentAt).toLocaleString()}</p>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${getTypeColor(notif.type)}`}>
                                                {notif.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-gray-600">
                                                <MdPeopleAlt size={14} className="text-gray-400" />
                                                {notif.targetAudience}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <span className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${getStatusColor(notif.status)}`}>
                                                    {notif.status === 'Sent' && <MdCheckCircle size={12} />}
                                                    {notif.status}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleDelete(notif._id || notif.id)}
                                                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                title="Delete Record"
                                            >
                                                <MdDelete size={20} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div >
    );
};

export default NotificationManager;
