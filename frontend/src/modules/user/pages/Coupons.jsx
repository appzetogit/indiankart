import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Coupons = () => {
    const navigate = useNavigate();
    const [couponCode, setCouponCode] = useState('');

    const activeCoupons = [
        {
            id: 1,
            code: 'FLIPKART50',
            title: 'Flat ₹50 Off',
            desc: 'On your first order of the month',
            expiry: 'Expires in 2 days',
            type: 'Offer',
            color: 'bg-blue-600'
        },
        {
            id: 2,
            code: 'WELCOME200',
            title: 'Extra ₹200 Off',
            desc: 'On purchase of ₹1999 and above',
            expiry: 'Expires on 31st Jan',
            type: 'Fashion',
            color: 'bg-green-600'
        },
        {
            id: 3,
            code: 'MAHA20',
            title: '20% Instant Discount',
            desc: 'Applicable on select electronics',
            expiry: 'Limited time offer',
            type: 'Electronics',
            color: 'bg-orange-500'
        }
    ];

    return (
        <div className="bg-[#f1f3f6] min-h-screen pb-10">
            {/* Mobile Header - Hidden on Desktop */}
            <div className="bg-white px-4 py-4 flex items-center gap-4 border-b sticky top-0 z-10 shadow-sm mb-4 md:hidden">
                <button onClick={() => navigate(-1)} className="p-1 -ml-2 rounded-full hover:bg-gray-100">
                    <span className="material-icons text-gray-700">arrow_back</span>
                </button>
                <h1 className="text-lg font-bold text-gray-800">My Coupons</h1>
            </div>

            {/* Desktop Container */}
            <div className="md:max-w-4xl md:mx-auto md:pt-6 md:px-4">

                {/* Desktop Breadcrumbs */}
                <div className="hidden md:flex items-center gap-2 text-xs text-gray-500 mb-6">
                    <span onClick={() => navigate('/')} className="cursor-pointer hover:text-blue-600">Home</span>
                    <span className="material-icons text-[10px]">chevron_right</span>
                    <span onClick={() => navigate('/account')} className="cursor-pointer hover:text-blue-600">My Account</span>
                    <span className="material-icons text-[10px]">chevron_right</span>
                    <span className="text-gray-800 font-bold">My Coupons</span>
                </div>

                {/* Desktop Header */}
                <div className="hidden md:block mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">My Coupons</h1>
                </div>

                <div className="p-4 md:p-0">
                    {/* Apply Coupon Box */}
                    <div className="bg-white p-4 rounded-xl shadow-sm flex gap-3 mb-6 border border-gray-100 md:rounded-lg md:p-5">
                        <input
                            type="text"
                            placeholder="Enter Coupon Code"
                            className="flex-1 border-b-2 border-gray-200 outline-none focus:border-blue-600 px-2 py-2 text-sm font-bold uppercase tracking-wider transition-colors placeholder-gray-400 text-gray-900"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        />
                        <button className="text-blue-600 font-bold text-sm uppercase px-4 hover:bg-blue-50 rounded-lg transition-colors">Apply</button>
                    </div>

                    {/* Coupons List */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1 md:text-sm md:mb-2">Available for you</h3>

                        <div className="flex flex-col gap-4 md:grid md:grid-cols-2">
                            {/* Using the updated data structure matching Admin */}
                            {[
                                {
                                    id: 'C001',
                                    code: 'WELCOME50',
                                    title: 'New User Offer',
                                    description: 'Get 50% off on your first order above ₹500. Max discount ₹100.',
                                    type: 'percentage',
                                    value: 50,
                                    expiryDate: '2024-12-31',
                                    minPurchase: 500,
                                    active: true
                                },
                                {
                                    id: 'C002',
                                    code: 'FLAT200',
                                    title: 'Flat ₹200 OFF',
                                    description: 'Flat Rs. 200 off on all orders above ₹1000. Limited time offer.',
                                    type: 'flat',
                                    value: 200,
                                    expiryDate: '2024-10-15',
                                    minPurchase: 1000,
                                    active: true
                                },
                                {
                                    id: 'C003',
                                    code: 'FESTIVE30',
                                    title: 'Festive Delight',
                                    description: 'Get 30% off on Fashion & Accessories. No minimum purchase required.',
                                    type: 'percentage',
                                    value: 30,
                                    expiryDate: '2024-11-20',
                                    minPurchase: 0,
                                    active: true
                                }
                            ].map((coupon) => (
                                <div key={coupon.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative group transition-transform active:scale-[0.99] md:rounded-lg md:hover:shadow-md md:hover:-translate-y-0.5 md:active:scale-100">
                                    {/* Left Decoration Border (Green for Active) */}
                                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-green-500"></div>

                                    <div className="p-5 pl-7">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-xl font-black text-gray-800 tracking-wider border-2 border-dashed border-gray-300 px-2 py-0.5 rounded bg-gray-50 select-text">
                                                        {coupon.code}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-green-600 font-bold uppercase mt-1.5 ml-1">
                                                    {coupon.type === 'percentage' ? `${coupon.value}% OFF` : `₹${coupon.value} FLAT OFF`}
                                                </p>
                                            </div>
                                            <button
                                                className="text-blue-600 text-xs font-bold uppercase px-3 py-1.5 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                                                onClick={() => {
                                                    setCouponCode(coupon.code);
                                                    // Optional: Scroll to top
                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                }}
                                            >
                                                Apply
                                            </button>
                                        </div>

                                        <div className="mb-3 border-b border-dashed border-gray-100 pb-3">
                                            <h3 className="font-bold text-gray-800 text-base">{coupon.title}</h3>
                                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">{coupon.description}</p>
                                        </div>

                                        <div className="flex justify-between items-center text-xs text-gray-400 font-medium">
                                            <span>Min. Purchase: <span className="text-gray-600">₹{coupon.minPurchase}</span></span>
                                            <span className="text-red-400">Exp: {coupon.expiryDate}</span>
                                        </div>
                                    </div>

                                    {/* Ticket Circles Decoration (Cutouts) */}
                                    <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-[#f1f3f6] rounded-full border-r border-gray-200 shadow-[inset_-2px_0_2px_rgba(0,0,0,0.05)]"></div>
                                    <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-[#f1f3f6] rounded-full border-l border-gray-200 shadow-[inset_2px_0_2px_rgba(0,0,0,0.05)]"></div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-8 text-center bg-white p-6 rounded-xl border border-gray-200 shadow-sm md:max-w-md md:mx-auto md:mt-12 md:rounded-lg">
                        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
                            <span className="material-icons text-blue-500">redeem</span>
                        </div>
                        <p className="text-gray-800 font-bold text-sm">Have a Gift Card?</p>
                        <button className="text-blue-600 text-xs font-bold uppercase mt-2 hover:bg-blue-50 px-4 py-2 rounded-lg transition-colors">Redeem Here</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Coupons;
