import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../../services/api';
import { useAuthStore } from '../store/authStore';
import { MdStore, MdEmail, MdPhone, MdLocationOn, MdDescription, MdBusiness, MdAssignment } from 'react-icons/md';

const BecomeSeller = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuthStore();

    const [formData, setFormData] = useState({
        storeName: '',
        businessEmail: '',
        phoneNumber: '',
        businessAddress: '',
        taxId: '',
        businessType: 'Individual',
        description: ''
    });

    const [status, setStatus] = useState(null); // 'Pending', 'Approved', 'Rejected'
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login?redirect=/become-seller');
            return;
        }

        const fetchMyRequest = async () => {
            try {
                const { data } = await API.get('/seller-requests/my-request');
                if (data) {
                    setStatus(data.status);
                    setFormData(data);
                }
            } catch (err) {
                console.error('Error fetching seller request:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchMyRequest();
    }, [isAuthenticated, navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            await API.post('/seller-requests', formData);
            setSuccess(true);
            setStatus('Pending');
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (status === 'Pending' || success) {
        return (
            <div className="min-h-screen pt-4 pb-12 px-4 bg-gray-50 flex items-center justify-center">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-blue-50">
                    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <MdAssignment className="text-4xl text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 mb-2">Application Received!</h2>
                    <p className="text-gray-600 mb-8 font-medium">
                        Your request to become a seller is currently under review by our admin team. We will notify you via email once approved.
                    </p>
                    <button
                        onClick={() => navigate('/')}
                        className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    if (status === 'Approved') {
        return (
            <div className="min-h-screen pt-4 pb-12 px-4 bg-gray-50 flex items-center justify-center">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-green-50">
                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <MdStore className="text-4xl text-green-600" />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 mb-2">Congratulations!</h2>
                    <p className="text-gray-600 mb-8 font-medium">
                        Your seller account has been approved. You can now start listing your products and growing your business with us.
                    </p>
                    <button
                        onClick={() => navigate('/admin/dashboard')}
                        className="w-full bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-200"
                    >
                        Go to Seller Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-4 pb-12 px-4 bg-gradient-to-b from-blue-50/50 to-white">
            <div className="max-w-3xl mx-auto">
                <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
                    {/* Header */}
                    <div className="bg-blue-600 p-8 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <MdStore size={120} />
                        </div>
                        <h1 className="text-3xl font-black mb-2">Become a Seller</h1>
                        <p className="text-blue-100 font-medium opacity-90">Fill in the details below to start your selling journey on IndianKart.</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        {error && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold border border-red-100 animate-pulse">
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Store Name */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                                    <MdStore className="text-blue-600" /> Store Name
                                </label>
                                <input
                                    required
                                    type="text"
                                    name="storeName"
                                    value={formData.storeName}
                                    onChange={handleChange}
                                    placeholder="e.g. My Awesome Shop"
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-medium outline-none"
                                />
                            </div>

                            {/* Business Email */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                                    <MdEmail className="text-blue-600" /> Business Email
                                </label>
                                <input
                                    required
                                    type="email"
                                    name="businessEmail"
                                    value={formData.businessEmail}
                                    onChange={handleChange}
                                    placeholder="e.g. contact@myshop.com"
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-medium outline-none"
                                />
                            </div>

                            {/* Phone Number */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                                    <MdPhone className="text-blue-600" /> Phone Number
                                </label>
                                <input
                                    required
                                    type="tel"
                                    name="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={handleChange}
                                    placeholder="e.g. +91 9876543210"
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-medium outline-none"
                                />
                            </div>

                            {/* Tax ID */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                                    <MdAssignment className="text-blue-600" /> GSTIN / Tax ID
                                </label>
                                <input
                                    required
                                    type="text"
                                    name="taxId"
                                    value={formData.taxId}
                                    onChange={handleChange}
                                    placeholder="Your Business Tax ID"
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-medium outline-none"
                                />
                            </div>
                        </div>

                        {/* Business Type */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                                <MdBusiness className="text-blue-600" /> Business Type
                            </label>
                            <select
                                name="businessType"
                                value={formData.businessType}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-medium outline-none appearance-none cursor-pointer"
                            >
                                <option value="Individual">Individual</option>
                                <option value="Partnership">Partnership</option>
                                <option value="Private Limited">Private Limited</option>
                                <option value="Public Limited">Public Limited</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        {/* Business Address */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                                <MdLocationOn className="text-blue-600" /> Business Address
                            </label>
                            <textarea
                                required
                                name="businessAddress"
                                value={formData.businessAddress}
                                onChange={handleChange}
                                placeholder="Complete business address..."
                                rows="3"
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-medium outline-none resize-none"
                            ></textarea>
                        </div>

                        {/* Description */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                                <MdDescription className="text-blue-600" /> Business Description
                            </label>
                            <textarea
                                required
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Tell us about the products you plan to sell..."
                                rows="4"
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-medium outline-none resize-none"
                            ></textarea>
                        </div>

                        <button
                            disabled={submitting}
                            type="submit"
                            className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-2 group disabled:opacity-70"
                        >
                            {submitting ? (
                                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    Submit Application
                                    <MdStore className="text-xl group-hover:scale-110 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default BecomeSeller;
