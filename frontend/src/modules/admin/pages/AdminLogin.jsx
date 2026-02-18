import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAdminAuthStore from '../store/adminAuthStore';

import toast from 'react-hot-toast';

const AdminLogin = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('admin@flipkart.comm');
    const [password, setPassword] = useState('admin123');
    const { login, loading } = useAdminAuthStore();

    const handleSubmit = async (e) => {
        e.preventDefault();
        // setError('');

        const success = await login(email, password);
        if (success) {
            toast.success('Welcome back, Admin!');
            navigate('/admin/dashboard');
        } else {
            toast.error('Invalid credentials. Please try again.');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Admin Panel</h1>
                    <p className="text-gray-500">Sign in to manage your store</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading}
                            className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-gray-900 ${loading ? 'bg-gray-50 cursor-not-allowed opacity-75' : 'bg-white'
                                }`}
                            placeholder="admin@flipkart.comm"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                            className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-gray-900 ${loading ? 'bg-gray-50 cursor-not-allowed opacity-75' : 'bg-white'
                                }`}
                            placeholder="••••••••"
                            required
                        />
                    </div>



                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3 rounded-lg font-semibold transition-all shadow-lg flex items-center justify-center gap-2 ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span>Signing In...</span>
                            </>
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </form>

                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 text-center">
                        Demo Credentials:<br />
                        <span className="font-mono font-semibold">admin@flipkart.comm / admin123</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
