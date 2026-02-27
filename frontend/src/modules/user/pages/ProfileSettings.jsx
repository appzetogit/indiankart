import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdArrowBack } from 'react-icons/md';
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
    const [passwordData, setPasswordData] = useState({
        newPassword: '',
        confirmPassword: ''
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
        if (passwordData.newPassword || passwordData.confirmPassword) {
            if (passwordData.newPassword.length < 6) {
                toast.error('New password must be at least 6 characters');
                return;
            }
            if (passwordData.newPassword !== passwordData.confirmPassword) {
                toast.error('Passwords do not match');
                return;
            }
        }

        const payload = {
            ...formData,
            ...(passwordData.newPassword ? { password: passwordData.newPassword } : {})
        };

        try {
            const promise = updateProfile(payload);
            await toast.promise(promise, {
                loading: 'Updating profile...',
                success: 'Profile updated successfully!',
                error: (err) => `Update failed: ${err.message}`
            });
            setPasswordData({ newPassword: '', confirmPassword: '' });
        } catch (error) {
            console.error('Error saving profile:', error);
        }
    };

    const handleCancel = () => {
        navigate('/account');
    };

    return (
        <div className="min-h-screen bg-[#f1f3f6] py-4 md:py-0 px-3 md:px-6">
            <div className="max-w-3xl mx-auto md:mt-4 bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-4 md:p-6 border-b border-gray-100 flex items-center gap-3">
                    <button
                        onClick={() => navigate('/account')}
                        className="text-gray-600 hover:text-[#2874f0] transition-colors"
                    >
                        <MdArrowBack size={24} />
                    </button>
                    <div>
                        <h1 className="text-lg md:text-2xl font-bold text-gray-900">Profile Settings</h1>
                        <p className="text-sm text-gray-500">Edit your profile details and reset password</p>
                    </div>
                </div>

                <div className="p-4 md:p-6 space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-gray-500 mb-1.5 font-medium">Full Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:border-[#2874f0] focus:ring-1 focus:ring-[#2874f0] outline-none"
                                placeholder="Enter your name"
                            />
                        </div>

                        <div>
                            <label className="block text-xs text-gray-500 mb-1.5 font-medium">Email Address</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:border-[#2874f0] focus:ring-1 focus:ring-[#2874f0] outline-none"
                                placeholder="Enter your email"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs text-gray-500 mb-1.5 font-medium">Mobile Number</label>
                        <input
                            type="text"
                            value={formData.mobile}
                            disabled
                            className="w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm bg-gray-100 text-gray-400 cursor-not-allowed"
                            placeholder="Mobile number"
                        />
                    </div>

                    <div className="border-t border-gray-100 pt-5">
                        <h2 className="text-base font-semibold text-gray-900 mb-3">Reset Password</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1.5 font-medium">New Password</label>
                                <input
                                    type="password"
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:border-[#2874f0] focus:ring-1 focus:ring-[#2874f0] outline-none"
                                    placeholder="Enter new password"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1.5 font-medium">Confirm New Password</label>
                                <input
                                    type="password"
                                    value={passwordData.confirmPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:border-[#2874f0] focus:ring-1 focus:ring-[#2874f0] outline-none"
                                    placeholder="Confirm new password"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <button
                            onClick={handleSave}
                            className="bg-[#2874f0] text-white py-2.5 px-6 rounded-md text-sm font-medium hover:bg-[#1a5dc8] transition-colors"
                        >
                            Save Changes
                        </button>
                        <button
                            onClick={handleCancel}
                            className="border border-gray-300 text-gray-700 py-2.5 px-6 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
                        >
                            Back to Account
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileSettings;
