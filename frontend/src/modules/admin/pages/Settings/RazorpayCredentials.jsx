import React, { useEffect, useState } from 'react';
import API from '../../../../services/api';
import toast from 'react-hot-toast';

const RazorpayCredentials = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        razorpayKeyId: '',
        razorpayKeySecret: ''
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data } = await API.get('/settings');
                setForm({
                    razorpayKeyId: data?.razorpayKeyId || '',
                    razorpayKeySecret: ''
                });
            } catch (error) {
                console.error('Failed to fetch Razorpay credentials:', error);
                toast.error('Failed to load Razorpay credentials');
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const data = new FormData();
            data.append('razorpayKeyId', form.razorpayKeyId.trim());
            data.append('razorpayKeySecret', form.razorpayKeySecret);

            const res = await API.put('/settings', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setForm({
                razorpayKeyId: res.data?.razorpayKeyId || '',
                razorpayKeySecret: ''
            });
            toast.success('Razorpay credentials updated');
        } catch (error) {
            console.error('Failed to update Razorpay credentials:', error);
            toast.error(error.response?.data?.message || 'Failed to update Razorpay credentials');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500 font-medium">Loading Razorpay credentials...</div>;
    }

    return (
        <div className="p-6 md:p-8 bg-gray-50 min-h-screen">
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-2 tracking-tight">Razorpay Credentials</h1>
            <p className="text-gray-500 mb-8 font-medium">Manage payment gateway keys used for online payments.</p>

            <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 max-w-2xl space-y-6">
                <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-2 tracking-wider">
                        Razorpay Key ID
                    </label>
                    <input
                        type="text"
                        name="razorpayKeyId"
                        value={form.razorpayKeyId}
                        onChange={handleChange}
                        className="w-full border border-gray-200 rounded-xl p-3.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-medium text-gray-900 bg-gray-50/50 transition-all"
                        placeholder="rzp_live_xxxxx or rzp_test_xxxxx"
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-2 tracking-wider">
                        Razorpay Key Secret
                    </label>
                    <input
                        type="password"
                        name="razorpayKeySecret"
                        value={form.razorpayKeySecret}
                        onChange={handleChange}
                        className="w-full border border-gray-200 rounded-xl p-3.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-medium text-gray-900 bg-gray-50/50 transition-all"
                        placeholder="Leave blank to keep existing secret"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                        For security, the stored secret is never returned by the API.
                    </p>
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={saving}
                        className={`px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${saving ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                    >
                        {saving ? 'Saving...' : 'Save Razorpay Credentials'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default RazorpayCredentials;
