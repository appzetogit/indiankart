import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import logo from '../../../assets/indiankart-logo.png';

import toast from 'react-hot-toast';

const Login = () => {
    const RESEND_COOLDOWN_SECONDS = 60;
    const HARDCODED_LOGIN_MOBILE = '7610416911';
    const HARDCODED_LOGIN_OTP = '0000';
    const normalizeForHardcodedLogin = (value) => {
        const digits = String(value || '').replace(/\D/g, '');
        return digits.length > 10 ? digits.slice(-10) : digits;
    };
    const navigate = useNavigate();
    const location = useLocation();
    const { sendOtp, verifyOtp, loading, error } = useAuthStore();
    const [mobile, setMobile] = useState(location.state?.mobile || '');
    const [name, setName] = useState(location.state?.name || '');
    const [email, setEmail] = useState(location.state?.email || '');
    const [otp, setOtp] = useState(''); // State for OTP
    const [step, setStep] = useState(location.state?.mobile ? 2 : 1); // 1: Mobile, 2: OTP
    const [resendCooldown, setResendCooldown] = useState(0);
    const from = location.state?.from?.pathname || '/';

    useEffect(() => {
        if (step !== 2 || resendCooldown <= 0) return undefined;
        const timer = setInterval(() => {
            setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, [step, resendCooldown]);

    const handleSendOtp = async () => {
        const mobileRegex = /^[6-9]\d{9}$/;
        const normalizedMobile = normalizeForHardcodedLogin(mobile);

        if (!mobileRegex.test(normalizedMobile)) {
            toast.error('Please enter a valid 10-digit Indian mobile number (starting with 6-9)');
            return;
        }

        try {
            await sendOtp(normalizedMobile, 'Customer');
            setStep(2);
            setResendCooldown(RESEND_COOLDOWN_SECONDS);

            if (normalizedMobile === HARDCODED_LOGIN_MOBILE) {
                toast.success(`Use OTP ${HARDCODED_LOGIN_OTP}`);
            } else {
                toast.success('OTP sent successfully');
            }
        } catch (err) {
            toast.error(err?.response?.data?.message || error || 'Failed to send OTP');
        }
    };

    const handleVerifyOtp = async () => {
        if (otp.length === 4) {
            try {
                await verifyOtp(normalizeForHardcodedLogin(mobile), otp, 'Customer', name, email);
                toast.success('Login successful!');
                navigate(from, { replace: true });
            } catch (err) {
                toast.error(err?.response?.data?.message || error || 'Invalid OTP');
            }
        } else {
            toast.error('Please enter a valid 4-digit OTP');
        }
    };

    return (
        <div className="md:min-h-screen md:bg-gray-50 md:flex md:items-center md:justify-center">
            <div className="min-h-screen md:min-h-fit bg-white flex flex-col p-4 md:p-8 md:max-w-lg md:w-full md:rounded-2xl md:shadow-xl md:border md:border-gray-100">
                <div className="flex justify-start md:justify-end mb-2">
                    <button onClick={() => navigate('/')} className="material-icons text-2xl text-gray-800">close</button>
                </div>

                <div className="flex-1 flex flex-col pt-0">
                    <div className="mb-4 flex flex-col items-center">
                        <div className="w-56 h-56 bg-white flex items-center justify-center mb-2">
                            <img src={logo} alt="logo" className="w-full h-full object-contain" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
                            {step === 1 ? 'Log in for the best experience' : 'Verify with OTP'}
                        </h2>
                        <p className="text-sm text-gray-500 text-center">
                            {step === 1 ? 'Enter your phone number to continue' : `Enter OTP sent to +91 ${mobile}`}
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-500 text-sm p-3 rounded mb-4 text-center">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        {step === 1 ? (
                            <>
                                <div className="relative">
                                    <label className="text-[10px] uppercase text-blue-600 font-bold absolute -top-1.5 left-3 bg-white px-1">Mobile Number</label>
                                    <div className="flex items-center border border-blue-600 rounded-lg overflow-hidden h-12">
                                        <span className="pl-4 text-gray-500 text-sm font-medium">+91</span>
                                        <input
                                            type="tel"
                                            value={mobile}
                                            onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                            className="flex-1 h-full px-4 outline-none text-gray-900 font-medium"
                                            placeholder="Enter mobile number"
                                        />
                                    </div>
                                </div>

                                <p className="text-[10px] text-gray-400 leading-tight">
                                    By continuing, you agree to Flipkart&apos;s{' '}
                                    <button
                                        type="button"
                                        onClick={() => navigate('/info?type=dynamic&key=terms-of-use')}
                                        className="text-blue-600 hover:underline font-medium"
                                    >
                                        Terms of Use
                                    </button>{' '}
                                    and{' '}
                                    <button
                                        type="button"
                                        onClick={() => navigate('/info?type=dynamic&key=privacyPolicy')}
                                        className="text-blue-600 hover:underline font-medium"
                                    >
                                        Privacy Policy
                                    </button>.
                                </p>

                                <button
                                    onClick={handleSendOtp}
                                    disabled={loading}
                                    className="w-full bg-[#fb641b] text-white py-3.5 rounded-sm font-bold text-sm shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-all disabled:opacity-70"
                                >
                                    {loading ? 'Sending OTP...' : 'Continue'}
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="relative">
                                    <label className="text-[10px] uppercase text-blue-600 font-bold absolute -top-1.5 left-3 bg-white px-1">OTP</label>
                                    <div className="flex items-center border border-blue-600 rounded-lg overflow-hidden h-12">
                                        <input
                                            type="tel"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                            className="flex-1 h-full px-4 outline-none text-gray-900 font-medium text-center tracking-widest text-xl"
                                            placeholder="XXXX"
                                            maxLength={4}
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={handleVerifyOtp}
                                    disabled={loading}
                                    className="w-full bg-[#fb641b] text-white py-3.5 rounded-sm font-bold text-sm shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-all disabled:opacity-70"
                                >
                                    {loading ? 'Verifying...' : 'Verify'}
                                </button>

                                <div className="text-center space-y-2">
                                    <button
                                        type="button"
                                        onClick={handleSendOtp}
                                        disabled={resendCooldown > 0}
                                        className="text-blue-600 text-sm font-bold disabled:text-gray-400 disabled:cursor-not-allowed"
                                    >
                                        {resendCooldown > 0
                                            ? `Resend OTP in ${Math.floor(resendCooldown / 60)}:${String(resendCooldown % 60).padStart(2, '0')}`
                                            : 'Resend OTP'}
                                    </button>
                                </div>

                                <div className="text-center">
                                    <button
                                        onClick={() => setStep(1)}
                                        className="text-blue-600 text-sm font-bold"
                                    >
                                        Change Mobile Number
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    {step === 1 && (
                        <div className="mt-auto text-center pb-8">
                            <p className="text-sm text-gray-500">
                                New here? <button onClick={() => navigate('/signup')} className="text-blue-600 font-bold">Create an account</button>
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Login;
