import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { MdAdd, MdClose, MdLocalOffer, MdDelete, MdToggleOn, MdToggleOff, MdContentCopy } from 'react-icons/md';
import useCouponStore from '../../store/couponStore';
import { confirmToast } from '../../../../utils/toastUtils.jsx';

const CouponManager = () => {
    const {
        coupons, addCoupon, deleteCoupon, toggleCouponStatus,
        offers, addOffer, deleteOffer, toggleOfferStatus, fetchCoupons
    } = useCouponStore();

    useEffect(() => {
        fetchCoupons();
    }, [fetchCoupons]);

    const [activeTab, setActiveTab] = useState('coupons'); // 'coupons' | 'offers'
    const [showForm, setShowForm] = useState(false);

    // Coupon Form State
    const [couponData, setCouponData] = useState({
        code: '', title: '', description: '', type: 'percentage', value: '',
        minPurchase: '', maxDiscount: '', expiryDate: '',
        userSegment: 'all', applicableCategory: 'all'
    });

    // Offer Form State
    const [offerData, setOfferData] = useState({
        type: 'Bank Offer', title: '', description: '', terms: ''
    });

    const handleCouponSubmit = (e) => {
        e.preventDefault();
        addCoupon({
            ...couponData,
            code: couponData.code.toUpperCase(),
            value: Number(couponData.value),
            minPurchase: Number(couponData.minPurchase),
            maxDiscount: couponData.maxDiscount ? Number(couponData.maxDiscount) : 0
        });
        setShowForm(false);
        setCouponData({
            code: '', title: '', description: '', type: 'percentage', value: '',
            minPurchase: '', maxDiscount: '', expiryDate: '',
            userSegment: 'all', applicableCategory: 'all'
        });
    };

    const handleOfferSubmit = (e) => {
        e.preventDefault();
        addOffer(offerData);
        setShowForm(false);
        setOfferData({ type: 'Bank Offer', title: '', description: '', terms: '' });
    };

    const handleDelete = (id) => {
        const typeStr = activeTab === 'coupons' ? 'coupon' : 'offer';
        confirmToast({
            message: `Are you sure you want to delete this ${typeStr}?`,
            type: 'danger',
            icon: 'delete_forever',
            confirmText: 'Delete',
            onConfirm: () => {
                if (activeTab === 'coupons') {
                    deleteCoupon(id);
                } else {
                    deleteOffer(id);
                }
            }
        });
    };

    const copyCode = (code) => {
        navigator.clipboard.writeText(code);
        toast.success('Copied: ' + code);
    };

    const getSegmentLabel = (segment) => {
        switch (segment) {
            case 'new_user': return 'New Users Only';
            case 'existing_user': return 'Existing Users';
            default: return 'All Users';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Coupons & Offers</h1>
                    <p className="text-gray-500 text-sm">Manage discount codes and bank offers</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition shadow-sm font-medium"
                >
                    <MdAdd size={20} /> Create {activeTab === 'coupons' ? 'Coupon' : 'Offer'}
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('coupons')}
                    className={`pb-2 px-4 text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'coupons' ? 'border-pink-600 text-pink-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                >
                    Coupons
                </button>
                <button
                    onClick={() => setActiveTab('offers')}
                    className={`pb-2 px-4 text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'offers' ? 'border-pink-600 text-pink-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                >
                    Offers
                </button>
            </div>

            {/* Content Switcher */}
            {activeTab === 'coupons' ? (
                /* Coupons Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {coupons.length === 0 ? (
                        <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
                            No active coupons found. Create one to get started!
                        </div>
                    ) : (
                        coupons.map(coupon => (
                            <div key={coupon._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative group hover:shadow-md transition">
                                {/* Left Decoration Border */}
                                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${coupon.active ? 'bg-green-500' : 'bg-gray-300'}`}></div>

                                <div className="p-5 pl-7">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <div
                                                onClick={() => copyCode(coupon.code)}
                                                className="font-mono text-lg font-bold text-gray-800 tracking-wider cursor-pointer hover:text-blue-600 flex items-center gap-2 group/code"
                                                title="Click to Copy"
                                            >
                                                {coupon.code}
                                                <MdContentCopy size={14} className="opacity-0 group-hover/code:opacity-100 transition-opacity text-gray-400" />
                                            </div>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                <span className="text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded border border-green-100 font-bold uppercase">
                                                    {coupon.type === 'percentage' ? `${coupon.value}% OFF` : `₹${coupon.value} OFF`}
                                                </span>
                                            </div>
                                        </div>
                                        <button onClick={() => toggleCouponStatus(coupon._id)}>
                                            {coupon.active ? (
                                                <MdToggleOn size={32} className="text-green-500 hover:text-green-600" />
                                            ) : (
                                                <MdToggleOff size={32} className="text-gray-300 hover:text-gray-400" />
                                            )}
                                        </button>
                                    </div>

                                    <div className="mb-3 border-b border-dashed pb-2">
                                        <h3 className="font-bold text-gray-800 text-sm">{coupon.title || 'Special Offer'}</h3>
                                        <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{coupon.description || 'Limited time discount applicable on checkout.'}</p>

                                        {/* Applicability Badges */}
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {coupon.userSegment && coupon.userSegment !== 'all' && (
                                                <span className="text-[10px] uppercase font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                                                    {getSegmentLabel(coupon.userSegment)}
                                                </span>
                                            )}
                                            {coupon.applicableCategory && coupon.applicableCategory !== 'all' && (
                                                <span className="text-[10px] uppercase font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                                                    {coupon.applicableCategory} Only
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-1.5 text-xs text-gray-500">
                                        <div className="flex justify-between">
                                            <span>Min Purchase:</span>
                                            <span className="font-medium text-gray-700">₹{coupon.minPurchase}</span>
                                        </div>
                                        {coupon.type === 'percentage' && (
                                            <div className="flex justify-between">
                                                <span>Max Discount:</span>
                                                <span className="font-medium text-gray-700">₹{coupon.maxDiscount}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between">
                                            <span>Expires On:</span>
                                            <span className="font-medium text-red-500">{coupon.expiryDate}</span>
                                        </div>
                                    </div>

                                    <div className="pt-3 mt-3 border-t border-dashed border-gray-200 flex justify-between items-center">
                                        <div className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded">
                                            Used {coupon.usageCount} times
                                        </div>
                                        <button
                                            onClick={() => handleDelete(coupon._id)}
                                            className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition"
                                        >
                                            <MdDelete size={18} />
                                        </button>
                                    </div>
                                </div>

                                {/* Ticket Circles Decoration */}
                                <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-gray-50 rounded-full border-r border-gray-300"></div>
                                <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-gray-50 rounded-full border-l border-gray-300"></div>
                            </div>
                        ))
                    )}
                </div>
            ) : (
                /* Offers Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {offers.length === 0 ? (
                        <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
                            No active offers found. Create one to display on product pages!
                        </div>
                    ) : (
                        offers.map(offer => (
                            <div key={offer._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative group hover:shadow-md transition">
                                <div className="p-5">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                                <MdLocalOffer size={18} />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-1 rounded">{offer.type}</span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button onClick={() => toggleOfferStatus(offer._id)}>
                                                {offer.active ? (
                                                    <MdToggleOn size={32} className="text-green-500 hover:text-green-600" />
                                                ) : (
                                                    <MdToggleOff size={32} className="text-gray-300 hover:text-gray-400" />
                                                )}
                                            </button>
                                            <button
                                                onClick={() => handleDelete(offer._id)}
                                                className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition"
                                            >
                                                <MdDelete size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    <h3 className="font-bold text-gray-800 leading-tight mb-2">{offer.title}</h3>
                                    <p className="text-xs text-gray-500 leading-relaxed mb-3">{offer.description}</p>

                                    {offer.terms && (
                                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">T&C</p>
                                            <p className="text-xs text-gray-600">{offer.terms}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Create Modal Form */}
            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <MdLocalOffer className="text-pink-500" /> New {activeTab === 'coupons' ? 'Coupon' : 'Offer'}
                            </h2>
                            <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-200 rounded-full transition">
                                <MdClose size={22} className="text-gray-500" />
                            </button>
                        </div>

                        {activeTab === 'coupons' ? (
                            <form onSubmit={handleCouponSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Coupon Code</label>
                                        <input
                                            type="text"
                                            value={couponData.code}
                                            onChange={(e) => setCouponData({ ...couponData, code: e.target.value.toUpperCase() })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-pink-500 outline-none font-mono text-base text-gray-800 uppercase placeholder:text-gray-500"
                                            placeholder="e.g. SAVE20"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Title (Short)</label>
                                        <input
                                            type="text"
                                            value={couponData.title}
                                            onChange={(e) => setCouponData({ ...couponData, title: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-pink-500 outline-none text-base text-gray-800 placeholder:text-gray-500"
                                            placeholder="e.g. Summer Sale"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label>
                                    <textarea
                                        value={couponData.description}
                                        onChange={(e) => setCouponData({ ...couponData, description: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-pink-500 outline-none h-20 resize-none text-base text-gray-800 placeholder:text-gray-500"
                                        placeholder="Brief terms or benefits..."
                                        required
                                    />
                                </div>

                                {/* Conditions Section */}
                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-3 border-b border-gray-200 pb-1">Conditions</label>
                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Applicable For</label>
                                            <select
                                                value={couponData.userSegment}
                                                onChange={(e) => setCouponData({ ...couponData, userSegment: e.target.value })}
                                                className="w-full px-2 py-1.5 border border-gray-300 rounded-lg bg-white outline-none focus:border-blue-500 text-sm font-normal text-gray-800"
                                            >
                                                <option value="all">All Users</option>
                                                <option value="new_user">New Users Only</option>
                                                <option value="existing_user">Existing Users</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Category</label>
                                            <select
                                                value={couponData.applicableCategory}
                                                onChange={(e) => setCouponData({ ...couponData, applicableCategory: e.target.value })}
                                                className="w-full px-2 py-1.5 border border-gray-300 rounded-lg bg-white outline-none focus:border-blue-500 bg-transparent text-sm font-normal text-gray-800"
                                            >
                                                <option value="all">All Categories</option>
                                                <option value="electronics">Electronics</option>
                                                <option value="fashion">Fashion</option>
                                                <option value="home">Home & Kitchen</option>
                                                <option value="beauty">Beauty</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Min Purchase</label>
                                            <input
                                                type="number"
                                                value={couponData.minPurchase}
                                                onChange={(e) => setCouponData({ ...couponData, minPurchase: e.target.value })}
                                                className="w-full px-2 py-1.5 border border-gray-300 rounded-lg outline-none focus:border-blue-500 text-sm font-normal text-gray-800 placeholder:text-gray-500"
                                                placeholder="₹"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Expiry Date</label>
                                            <input
                                                type="date"
                                                value={couponData.expiryDate}
                                                onChange={(e) => setCouponData({ ...couponData, expiryDate: e.target.value })}
                                                className="w-full px-2 py-1.5 border border-gray-300 rounded-lg outline-none focus:border-blue-500 text-sm font-normal text-gray-800"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Discount Type</label>
                                        <select
                                            value={couponData.type}
                                            onChange={(e) => setCouponData({ ...couponData, type: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-pink-500 outline-none bg-white text-base text-gray-800"
                                        >
                                            <option value="percentage">Percentage (%)</option>
                                            <option value="flat">Flat Amount (₹)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Discount Value</label>
                                        <input
                                            type="number"
                                            value={couponData.value}
                                            onChange={(e) => setCouponData({ ...couponData, value: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-pink-500 outline-none text-base text-gray-800 placeholder:text-gray-500"
                                            placeholder={couponData.type === 'percentage' ? "e.g. 20" : "e.g. 200"}
                                            required
                                        />
                                    </div>
                                </div>

                                {couponData.type === 'percentage' && (
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Max Discount Limit (₹)</label>
                                        <input
                                            type="number"
                                            value={couponData.maxDiscount}
                                            onChange={(e) => setCouponData({ ...couponData, maxDiscount: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-pink-500 outline-none text-base text-gray-800 placeholder:text-gray-500"
                                            placeholder="e.g. 100"
                                        />
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    className="w-full bg-pink-600 text-white font-bold py-3 rounded-xl hover:bg-pink-700 transition mt-2 shadow-sm"
                                >
                                    Publish Coupon
                                </button>
                            </form>
                        ) : (
                            /* Offer Form */
                            <form onSubmit={handleOfferSubmit} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Offer Type</label>
                                    <select
                                        value={offerData.type}
                                        onChange={(e) => setOfferData({ ...offerData, type: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-pink-500 outline-none bg-white text-base text-gray-800"
                                    >
                                        <option>Bank Offer</option>
                                        <option>Partner Offer</option>
                                        <option>Special Price</option>
                                        <option>Combo Offer</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Short Title</label>
                                    <input
                                        type="text"
                                        value={offerData.title}
                                        onChange={(e) => setOfferData({ ...offerData, title: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-pink-500 outline-none text-base text-gray-800 placeholder:text-gray-500"
                                        placeholder="e.g. 10% off on HDFC Cards"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Description</label>
                                    <textarea
                                        value={offerData.description}
                                        onChange={(e) => setOfferData({ ...offerData, description: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-pink-500 outline-none h-20 resize-none text-base text-gray-800 placeholder:text-gray-500"
                                        placeholder="Details shown on product page..."
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Terms & Conditions</label>
                                    <textarea
                                        value={offerData.terms}
                                        onChange={(e) => setOfferData({ ...offerData, terms: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-pink-500 outline-none h-20 resize-none text-base text-gray-800 placeholder:text-gray-500"
                                        placeholder="Minimum purchase limits etc..."
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-pink-600 text-white font-bold py-3 rounded-xl hover:bg-pink-700 transition mt-2 shadow-sm"
                                >
                                    Publish Offer
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CouponManager;
