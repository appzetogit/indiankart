import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    MdArrowBack, 
    MdPerson, 
    MdEmail, 
    MdPhone, 
    MdSave, 
    MdNavigateNext
} from 'react-icons/md';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

const ProfileSettings = () => {
    const navigate = useNavigate();
    const { user, updateProfile } = useAuthStore();
    const currentUser = user;

    const [formData, setFormData] = useState({
        name: '',
        mobile: '',
        email: '',
        gender: ''
    });

    useEffect(() => {
        if (!currentUser) return;
        const rawPhone = currentUser?.phone || currentUser?.mobile || '';
        const rawEmail = currentUser?.email || '';
        const normalizedPhone = String(rawPhone).trim();
        const normalizedEmail = String(rawEmail).trim();
        const digitsFromEmail = normalizedEmail.replace(/\D/g, '');
        const looksLikePhoneInEmail = normalizedEmail && !normalizedEmail.includes('@') && digitsFromEmail.length >= 10;

        setFormData({
            name: currentUser?.name || '',
            mobile: normalizedPhone || (looksLikePhoneInEmail ? digitsFromEmail : ''),
            email: looksLikePhoneInEmail ? '' : normalizedEmail,
            gender: currentUser?.gender || ''
        });
    }, [currentUser]);

    const handleSave = async () => {
        try {
            const promise = updateProfile(formData);
            await toast.promise(promise, {
                loading: 'Updating profile...',
                success: 'Profile updated successfully!',
                error: (err) => `Update failed: ${err.message}`
            });
        } catch (error) {
            console.error('Error saving profile:', error);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-20">
            {/* Header Area with Gradient Background */}
            <div className="bg-gradient-to-br from-[#2874f0] to-[#1e5eb8] pt-8 pb-32 px-4 shadow-lg">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <button
                        onClick={() => navigate('/account')}
                        className="bg-white/10 hover:bg-white/20 p-2.5 rounded-xl transition-all border border-white/10 group backdrop-blur-md"
                    >
                        <MdArrowBack className="text-white group-hover:-translate-x-1 transition-transform" size={24} />
                    </button>
                    <div className="text-center">
                        <h1 className="text-2xl font-black text-white tracking-tight uppercase">Profile Settings</h1>
                        <p className="text-blue-100 text-xs font-bold tracking-widest uppercase opacity-70">Update your account information</p>
                    </div>
                    <div className="w-11"></div> {/* Spacer for symmetry */}
                </div>
            </div>

            {/* Main Content Area - Overlapping the header */}
            <div className="max-w-4xl mx-auto px-4 -mt-24">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* Sidebar Profile Card */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-white rounded-3xl p-6 shadow-xl shadow-blue-900/5 border border-white relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-500"></div>
                            
                            <div className="relative flex flex-col items-center">
                                <div className="relative mb-4 group/avatar">
                                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center p-1 shadow-inner">
                                        <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                                            {currentUser?.name ? (
                                                <span className="text-3xl font-black text-blue-600">
                                                    {currentUser.name.charAt(0).toUpperCase()}
                                                </span>
                                            ) : (
                                                <MdPerson className="text-4xl text-blue-200" />
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <h2 className="text-xl font-black text-gray-900 leading-tight truncate w-full text-center px-2">
                                    {formData.name || 'Your Name'}
                                </h2>
                                <p className="text-sm font-bold text-blue-600 uppercase tracking-tighter mb-4">
                                    Member since {new Date(currentUser?.createdAt || Date.now()).getFullYear()}
                                </p>
                                
                                <div className="w-full h-px bg-gray-100 my-4"></div>
                                
                                <div className="w-full space-y-3">
                                    <div className="flex items-center gap-3 text-gray-500 px-2">
                                        <MdPhone size={18} className="text-blue-400" />
                                        <span className="text-sm font-bold tracking-tight">+{formData.mobile || '---'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-gray-500 px-2 truncate">
                                        <MdEmail size={18} className="text-blue-400" />
                                        <span className="text-sm font-bold tracking-tight truncate">{formData.email || '---'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Tips or Stats */}
                        <div className="bg-gradient-to-br from-gray-900 to-blue-950 rounded-3xl p-6 text-white shadow-xl shadow-black/10">
                            <h3 className="text-xs font-black uppercase tracking-[2px] opacity-60 mb-4">Privacy Tip</h3>
                            <p className="text-sm font-medium leading-relaxed">
                                Keep your email address up to date to ensure you receive important order updates and security alerts.
                            </p>
                        </div>
                    </div>

                    {/* Main Form Fields */}
                    <div className="lg:col-span-8">
                        <div className="bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-white overflow-hidden">
                            <div className="p-6 md:p-8 space-y-8">
                                <div>
                                    <h3 className="text-lg font-black text-gray-900 flex items-center gap-2 mb-6">
                                        <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                                        Personal Information
                                    </h3>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Name Field */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Full Name</label>
                                            <div className="relative group/input">
                                                <MdPerson className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/input:text-blue-600 transition-colors" size={20} />
                                                <input
                                                    type="text"
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-gray-900 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 outline-none transition-all placeholder:text-gray-300"
                                                    placeholder="e.g. Rahul Sharma"
                                                />
                                            </div>
                                        </div>

                                        {/* Gender Field */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Gender</label>
                                            <div className="flex bg-gray-50 border border-gray-100 rounded-2xl p-1 gap-1">
                                                {['Male', 'Female'].map((g) => (
                                                    <button
                                                        key={g}
                                                        onClick={() => setFormData({ ...formData, gender: g })}
                                                        className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                                                            formData.gender === g 
                                                                ? 'bg-white text-blue-600 shadow-md ring-1 ring-black/5' 
                                                                : 'text-gray-400 hover:text-gray-600 hover:bg-white/50'
                                                        }`}
                                                    >
                                                        {g}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Email Field */}
                                        <div className="md:col-span-2 space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Email Address</label>
                                            <div className="relative group/input">
                                                <MdEmail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/input:text-blue-600 transition-colors" size={20} />
                                                <input
                                                    type="email"
                                                    value={formData.email}
                                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-gray-900 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 outline-none transition-all placeholder:text-gray-300"
                                                    placeholder="rahul@example.com"
                                                />
                                            </div>
                                            <p className="text-[10px] text-gray-400 font-bold pl-1 tracking-tight">Email is used for order communications and receipts.</p>
                                        </div>

                                        {/* Mobile Field (Read-only) */}
                                        <div className="md:col-span-2 space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Mobile Number (Verified)</label>
                                            <div className="relative group/input opacity-70">
                                                <MdPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                                <input
                                                    type="text"
                                                    value={formData.mobile}
                                                    disabled
                                                    className="w-full bg-gray-100 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-gray-500 cursor-not-allowed outline-none"
                                                    placeholder="9876543210"
                                                />
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-green-500/10 text-green-600 px-3 py-1.5 rounded-lg border border-green-200">
                                                    <span className="material-icons text-[14px]">verified</span>
                                                    <span className="text-[10px] font-black uppercase tracking-tight">Verified</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Form Actions */}
                                <div className="flex items-center gap-4 pt-4 border-t border-gray-50">
                                    <button
                                        onClick={handleSave}
                                        className="flex-1 bg-blue-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-[2px] shadow-xl shadow-blue-500/30 hover:bg-blue-700 hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-2 group"
                                    >
                                        <MdSave size={18} />
                                        Save Changes
                                    </button>
                                    <button
                                        onClick={() => navigate('/account')}
                                        className="hidden md:flex flex-1 bg-gray-50 text-gray-400 border border-gray-100 py-5 rounded-2xl font-black uppercase text-xs tracking-[2px] hover:bg-white hover:text-blue-600 hover:border-blue-200 transition-all items-center justify-center gap-2 group"
                                    >
                                        Cancel
                                        <MdNavigateNext size={20} className="group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileSettings;
