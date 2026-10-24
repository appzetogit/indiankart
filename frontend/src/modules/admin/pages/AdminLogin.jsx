import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdVisibility, MdVisibilityOff } from 'react-icons/md';
import useAdminAuthStore from '../store/adminAuthStore';
import logo from '../../../assets/indiankart-logo.png';

import toast from 'react-hot-toast';

const AdminLogin = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [code, setCode] = useState('');
    const [useRecoveryCode, setUseRecoveryCode] = useState(false);
    const { login, verifyMfa, cancelMfa, loading, mfaToken, error } = useAdminAuthStore();

    const afterLogin = (result) => {
        if (result === 'ok') {
            toast.success('Welcome back, Admin!');
            navigate('/admin/dashboard');
        } else if (result === 'setup') {
            navigate('/admin/mfa-setup');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await login(username, password);
        if (result === 'mfa') {
            setCode('');
            return;
        }
        if (!result) {
            toast.error(useAdminAuthStore.getState().error || 'Invalid credentials. Please try again.');
            return;
        }
        afterLogin(result);
    };

    const handleCode = async (e) => {
        e.preventDefault();
        const result = await verifyMfa(code.trim());
        if (result === 'restart') {
            toast.error('That login took too long. Please enter your password again.');
            setPassword('');
            return;
        }
        if (!result) {
            toast.error(useAdminAuthStore.getState().error || 'That code is not correct.');
            return;
        }
        afterLogin(result);
    };

    const inputClass = `w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-gray-900 ${loading ? 'bg-gray-50 cursor-not-allowed opacity-75' : 'bg-white'}`;
    const submitClass = `w-full py-3 rounded-lg font-semibold transition-all shadow-lg flex items-center justify-center gap-2 ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`;
    const spinner = <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
                <div className="text-center mb-8">
                    <img
                        src={logo}
                        alt="Indiankart"
                        className="h-12 w-auto mx-auto mb-4 scale-[2] origin-center"
                    />
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Admin Panel</h1>
                    <p className="text-gray-500">
                        {mfaToken ? 'Enter the code from your authenticator app' : 'Sign in to manage your store'}
                    </p>
                </div>

                {mfaToken ? (
                    <form onSubmit={handleCode} className="space-y-6" autoComplete="off">
                        <div>
                            <label htmlFor="admin-mfa-code" className="block text-sm font-medium text-gray-700 mb-2">
                                {useRecoveryCode ? 'Recovery code' : '6-digit code'}
                            </label>
                            <input
                                id="admin-mfa-code"
                                type="text"
                                inputMode={useRecoveryCode ? 'text' : 'numeric'}
                                autoComplete="one-time-code"
                                autoFocus
                                value={code}
                                onChange={(e) => setCode(useRecoveryCode ? e.target.value.toUpperCase() : e.target.value.replace(/\D/g, '').slice(0, 6))}
                                disabled={loading}
                                className={`${inputClass} text-center text-2xl tracking-[0.4em] font-mono`}
                                placeholder={useRecoveryCode ? 'XXXXX-XXXXX' : '000000'}
                                required
                            />
                            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                        </div>
                        <button type="submit" disabled={loading || (!useRecoveryCode && code.length !== 6)} className={submitClass}>
                            {loading ? <>{spinner}<span>Checking...</span></> : 'Verify'}
                        </button>
                        <div className="flex justify-between text-sm">
                            <button type="button" className="text-blue-600 hover:underline" onClick={() => { setUseRecoveryCode((v) => !v); setCode(''); }}>
                                {useRecoveryCode ? 'Use the app code instead' : 'Lost your phone? Use a recovery code'}
                            </button>
                            <button type="button" className="text-gray-500 hover:underline" onClick={() => { cancelMfa(); setPassword(''); }}>
                                Back
                            </button>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
                        <div>
                            <label htmlFor="admin-username" className="block text-sm font-medium text-gray-700 mb-2">
                                Username
                            </label>
                            <input
                                id="admin-username"
                                type="text"
                                name="admin-username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                disabled={loading}
                                autoComplete="off"
                                className={inputClass}
                                placeholder="Enter your username"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="admin-password" className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    id="admin-password"
                                    type={showPassword ? 'text' : 'password'}
                                    name="admin-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={loading}
                                    autoComplete="new-password"
                                    className={`${inputClass} pr-12`}
                                    placeholder="Enter your password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    disabled={loading}
                                    className={`absolute inset-y-0 right-0 px-3 flex items-center ${loading ? 'cursor-not-allowed text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    title={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" disabled={loading} className={submitClass}>
                            {loading ? <>{spinner}<span>Signing In...</span></> : 'Sign In'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default AdminLogin;
