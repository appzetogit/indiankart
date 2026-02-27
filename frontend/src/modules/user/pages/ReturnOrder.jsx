import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import API from '../../../services/api';
import { toast } from 'react-hot-toast';
import Loader from '../../../components/common/Loader';

const ReturnOrder = () => {
    const { orderId, productId } = useParams();
    const navigate = useNavigate();
    // const orders = useCartStore(state => state.orders); // Removed dependency on store orders
    const [order, setOrder] = useState(null);
    const [loadingOrder, setLoadingOrder] = useState(true);

    const [step, setStep] = useState(1);
    const [reason, setReason] = useState('');
    const [selectedReplacementSize, setSelectedReplacementSize] = useState('M');
    const [selectedReplacementColor, setSelectedReplacementColor] = useState('Black');
    const [returnMode, setReturnMode] = useState('REFUND'); // REFUND or REPLACEMENT
    const [subReason, setSubReason] = useState('');
    const [comment, setComment] = useState('');
    const [bankDetails, setBankDetails] = useState({
        accountHolderName: '',
        accountNumber: '',
        ifscCode: ''
    });
    const [googleDriveLink, setGoogleDriveLink] = useState('');
    const [proofFiles, setProofFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const updateItemStatus = useCartStore(state => state.updateItemStatus);
    const addresses = useCartStore((state) => state.addresses || []);
    const [showAddressSelector, setShowAddressSelector] = useState(false);
    const [selectedPickupAddressId, setSelectedPickupAddressId] = useState(null);
    const [selectedPickupAddress, setSelectedPickupAddress] = useState(null);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const { data } = await API.get(`/orders/${orderId}`);
                // Normalize items to match expected structure if needed, or just use orderItems
                // The component below uses 'items', let's map orderItems to items for compatibility
                // or update the component to use orderItems. 
                // Updating component to use orderItems is cleaner but 'items' is used in logic.
                // Let's normalize here.
                const normalizedOrder = {
                    ...data,
                    id: data._id, 
                    items: data.orderItems.map(item => ({
                        ...item,
                        id: item.product || item._id, // Ensure we have a consistent ID.
                        quantity: item.qty ?? item.quantity ?? 1
                    }))
                };
                setOrder(normalizedOrder);
            } catch (error) {
                console.error("Failed to fetch order", error);
            } finally {
                setLoadingOrder(false);
            }
        };
        fetchOrder();
    }, [orderId]);

    useEffect(() => {
        if (!order) return;

        if (addresses.length > 0) {
            const primary = addresses[0];
            setSelectedPickupAddressId(primary.id);
            setSelectedPickupAddress({
                name: primary.name || order.shippingAddress?.name || '',
                phone: primary.mobile || primary.phone || order.shippingAddress?.phone || '',
                address: primary.address || order.shippingAddress?.street || '',
                city: primary.city || order.shippingAddress?.city || '',
                state: primary.state || order.shippingAddress?.state || '',
                pincode: primary.pincode || order.shippingAddress?.postalCode || '',
                type: primary.type || 'Home'
            });
            return;
        }

        setSelectedPickupAddressId('order-shipping');
        setSelectedPickupAddress({
            name: order.shippingAddress?.name || '',
            phone: order.shippingAddress?.phone || '',
            address: order.shippingAddress?.street || '',
            city: order.shippingAddress?.city || '',
            state: order.shippingAddress?.state || '',
            pincode: order.shippingAddress?.postalCode || '',
            type: 'Home'
        });
    }, [order, addresses]);

    const handleSelectPickupAddress = (address) => {
        setSelectedPickupAddressId(address.id);
        setSelectedPickupAddress({
            name: address.name || '',
            phone: address.mobile || address.phone || '',
            address: address.address || '',
            city: address.city || '',
            state: address.state || '',
            pincode: address.pincode || '',
            type: address.type || 'Home'
        });
        setShowAddressSelector(false);
    };

    const reasons = [
        {
            title: "Quality of the product not as expected",
            subs: ["Item is used", "Duplicate product", "Poor quality", "Defect in product"]
        },
        {
            title: "Received a broken/damaged item",
            subs: ["Item damaged during delivery", "Packaging was torn", "Item arrived broken"]
        },
        {
            title: "Wrong item was sent",
            subs: ["Different product received", "Wrong color/size sent", "Item missing from box"]
        },
        {
            title: "Size/Fit issue",
            subs: ["Item is too large", "Item is too small", "Fit is not comfortable"]
        },
        {
            title: "Don't want the product anymore",
            subs: ["Better price available elsewhere", "No longer needed", "Mistakenly ordered"]
        }
    ];

    if (loadingOrder) return <div className="p-10 text-center">Loading...</div>;
    if (!order) return <div className="p-10 text-center">Order not found.</div>;

    // Filter items based on productId if it exists, and only include items that can be returned/replaced
    const isEligibleForReturn = (itemStatus) => {
        if (!itemStatus) return true;
        const normalized = String(itemStatus).trim().toLowerCase();
        if (normalized === 'delivered') return true;

        const blocked = [
            'return requested',
            'replacement requested',
            'approved',
            'pickup scheduled',
            'received at warehouse',
            'refund initiated',
            'replacement dispatched',
            'returned',
            'replaced',
            'completed',
            'cancelled',
            'return rejected'
        ];
        return !blocked.includes(normalized);
    };

    const targetItems = (productId
        ? order.items.filter(i => String(i.id) === String(productId))
        : order.items).filter(item => isEligibleForReturn(item.status));

    const handleReturnSubmit = async () => {
        if (targetItems.length === 0) {
            toast.error('No eligible items found for return/replacement in this order.');
            return;
        }

        if (!googleDriveLink.trim() && proofFiles.length === 0) {
            toast.error('Please add Google Drive link or upload proof files.');
            return;
        }

        setLoading(true);
        try {
            // We need to submit a request for each item, or one request for multiple?
            // The backend controller seems to handle one request per call, taking `productId`.
            // The UI allows selecting multiple items implicitly if `targetItems` has more than one?
            // The UI loop `targetItems.forEach` suggests multiple.
            // But wait, the UI flow (Step 1, 2, 3) seems to focus on "Reasons" which applies to the return as a whole?
            // If `targetItems` has multiple items, do they all share the same reason? Yes.
            
            // However, the backend expects `productId`.
            // Let's loop through targetItems and send a request for each.
            
            for (const item of targetItems) {
                const payload = new FormData();
                payload.append('orderId', order.id);
                payload.append('productId', item.id);
                payload.append('type', returnMode === 'REFUND' ? 'Return' : 'Replacement');
                payload.append('reason', reason);
                payload.append('comment', `${subReason}. ${comment}`.trim());
                payload.append('googleDriveLink', googleDriveLink.trim());
                payload.append('pickupAddress', JSON.stringify(selectedPickupAddress || {}));

                if (returnMode === 'REPLACEMENT') {
                    payload.append('selectedReplacementSize', selectedReplacementSize);
                    payload.append('selectedReplacementColor', selectedReplacementColor);
                }
                if (returnMode === 'REFUND') {
                    payload.append('bankDetails', JSON.stringify(bankDetails));
                }

                proofFiles.forEach((file) => payload.append('proof_files', file));

                await API.post('/returns', payload, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                
                // Optimistic Update (Optional, but good for UX)
                const itemStatus = returnMode === 'REFUND' ? 'Return Requested' : 'Replacement Requested';
                updateItemStatus(order.id, item.id, itemStatus);
            }

            toast.success(`${returnMode === 'REFUND' ? 'Return' : 'Replacement'} request submitted successfully!`);
            navigate(`/my-orders/${order.id}`);
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to submit return request.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-[#f1f3f6] min-h-screen md:py-6">

            {/* Mobile Header - Hidden on Desktop */}
            <div className="bg-white px-4 py-4 flex items-center gap-2 border-b sticky top-0 z-50 shadow-sm md:hidden">
                <button
                    onClick={() => navigate(-1)}
                    className="material-icons p-2 -ml-2 active:bg-gray-100 rounded-full transition-all cursor-pointer relative z-[60]"
                >
                    arrow_back
                </button>
                <h1 className="text-lg font-bold">Request Return / Replace</h1>
            </div>

            {/* Desktop Breadcrumbs */}
            <div className="hidden md:flex max-w-[700px] mx-auto px-4 items-center gap-2 text-xs text-gray-500 mb-4">
                <span onClick={() => navigate('/')} className="cursor-pointer hover:text-blue-600">Home</span>
                <span className="material-icons text-[10px]">chevron_right</span>
                <span onClick={() => navigate('/my-orders')} className="cursor-pointer hover:text-blue-600">My Orders</span>
                <span className="material-icons text-[10px]">chevron_right</span>
                <span onClick={() => navigate(`/my-orders/${orderId}`)} className="cursor-pointer hover:text-blue-600">Order #{order?.displayId || orderId.slice(-8).toUpperCase()}</span>
                <span className="material-icons text-[10px]">chevron_right</span>
                <span className="text-gray-800 font-bold">Return</span>
            </div>

            {/* Desktop Container */}
            <div className="md:max-w-[700px] md:mx-auto md:bg-white md:rounded-lg md:shadow-sm md:border md:border-gray-200 md:overflow-hidden md:pb-6">

                {/* Desktop Title */}
                <div className="hidden md:block px-6 py-4 border-b bg-gray-50">
                    <h1 className="text-lg font-bold text-gray-800">Request Return / Replace</h1>
                </div>

                {/* Current Item Section */}
                <div className="bg-white m-2 rounded-xl overflow-hidden shadow-sm border border-gray-100 md:m-0 md:rounded-none md:shadow-none md:border-0 md:border-b">
                    <div className="px-4 py-3 border-b bg-gray-50/50 md:bg-white md:border-0 md:pt-6">
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Items being processed</h3>
                    </div>
                    <div className="divide-y divide-gray-50 md:divide-gray-100">
                        {targetItems.map((item, idx) => (
                            <div key={idx} className="flex gap-4 p-4 md:px-6">
                                <div className="w-16 h-16 flex-shrink-0 bg-white rounded-lg border border-gray-100 p-1 md:w-20 md:h-20">
                                    <img src={item.image} alt="" className="w-full h-full object-contain" />
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-[13px] font-bold text-gray-800 line-clamp-2 leading-tight md:text-base">{item.name}</h2>
                                    <p className="text-[10px] text-gray-400 mt-1 font-bold uppercase md:text-xs">₹{item.price.toLocaleString()} • Qty: {item.quantity}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {step === 1 && (
                    <div className="bg-white m-2 rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 md:m-6 md:rounded-lg md:border-gray-200">
                        <div className="px-4 py-4 bg-blue-600 text-white">
                            <h3 className="text-sm font-bold uppercase tracking-tight">Step 1: Why are you returning?</h3>
                            <p className="text-[10px] text-white/70 mt-0.5">Please select the most appropriate reason</p>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {reasons.map((r) => (
                                <label key={r.title} className="flex items-center justify-between px-4 py-4 cursor-pointer active:bg-gray-50 transition-colors md:hover:bg-gray-50">
                                    <span className="text-sm text-gray-800 font-medium">{r.title}</span>
                                    <input
                                        type="radio"
                                        name="reason"
                                        onChange={() => {
                                            setReason(r.title);
                                            setStep(2);
                                        }}
                                        className="w-5 h-5 accent-blue-600 cursor-pointer"
                                    />
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="bg-white m-2 rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500 md:m-6 md:rounded-lg md:border-gray-200">
                        <div className="px-4 py-4 bg-blue-600 text-white flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-tight">Step 2: Provide more details</h3>
                                <p className="text-[10px] text-white/70 mt-0.5">Reason: {reason}</p>
                            </div>
                            <button onClick={() => setStep(1)} className="text-[10px] font-black uppercase text-white/80 border border-white/30 px-2 py-1 rounded hover:bg-white/10 transition-colors">Change</button>
                        </div>
                        <div className="p-4">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 block">Sub-reason</label>
                            <div className="space-y-2">
                                {reasons.find(r => r.title === reason)?.subs.map(sub => (
                                    <button
                                        key={sub}
                                        onClick={() => {
                                            setSubReason(sub);
                                            setStep(3);
                                        }}
                                        className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${subReason === sub ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold' : 'border-gray-100 text-gray-600 md:hover:bg-gray-50'}`}
                                    >
                                        {sub}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="m-2 space-y-2 pb-10 animate-in fade-in slide-in-from-right-4 duration-500 md:m-6 md:pb-0">
                        {/* Resolution Section */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden md:rounded-lg md:border-gray-200">
                            <div className="px-4 py-4 bg-orange-500 text-white">
                                <h3 className="text-sm font-bold uppercase tracking-tight">Step 3: What do you want?</h3>
                                <p className="text-[10px] text-white/70 mt-0.5">Select your preferred resolution</p>
                            </div>

                            <div className="p-4">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:items-start">
                                    {/* Refund Option */}
                                    <button
                                        onClick={() => setReturnMode('REFUND')}
                                        className={`group relative p-4 rounded-xl border-2 text-left transition-all h-full ${returnMode === 'REFUND' ? 'border-blue-600 bg-blue-50' : 'border-gray-100 md:hover:border-gray-300'}`}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${returnMode === 'REFUND' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                                <span className="material-icons">payments</span>
                                            </div>
                                            <div className="flex-1">
                                                <p className={`text-sm font-bold uppercase tracking-tight ${returnMode === 'REFUND' ? 'text-blue-700' : 'text-gray-800'}`}>Refund</p>
                                                <p className="text-[11px] text-gray-500 mt-0.5 leading-tight">Get your money back to your original payment mode or bank account.</p>
                                                {returnMode === 'REFUND' && (
                                                    <div className="mt-3 py-2 px-3 bg-white/50 rounded-lg border border-blue-200">
                                                        <div className="flex items-center gap-2">
                                                            <span className="material-icons text-blue-600 text-sm">schedule</span>
                                                            <span className="text-[10px] font-bold text-blue-600 uppercase">Estimated Refund: 5-7 Business Days</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            {returnMode === 'REFUND' && <span className="material-icons text-blue-600 absolute top-4 right-4">check_circle</span>}
                                        </div>
                                    </button>

                                    {/* Replacement Option */}
                                    <button
                                        onClick={() => setReturnMode('REPLACEMENT')}
                                        className={`group relative p-4 rounded-xl border-2 text-left transition-all h-full ${returnMode === 'REPLACEMENT' ? 'border-blue-600 bg-blue-50' : 'border-gray-100 md:hover:border-gray-300'}`}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${returnMode === 'REPLACEMENT' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                                <span className="material-icons">sync</span>
                                            </div>
                                            <div className="flex-1">
                                                <p className={`text-sm font-bold uppercase tracking-tight ${returnMode === 'REPLACEMENT' ? 'text-blue-700' : 'text-gray-800'}`}>Replacement</p>
                                                <p className="text-[11px] text-gray-500 mt-0.5 leading-tight">We will send you a brand new item in place of the current one.</p>
                                                {returnMode === 'REPLACEMENT' && (
                                                    <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                                        {/* Size Selection */}
                                                        <div>
                                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Select New Size</label>
                                                            <div className="flex flex-wrap gap-2">
                                                                {['S', 'M', 'L', 'XL', 'XXL'].map(s => (
                                                                    <div
                                                                        key={s}
                                                                        onClick={(e) => { e.stopPropagation(); setSelectedReplacementSize(s); }}
                                                                        className={`min-w-[40px] h-10 border rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${selectedReplacementSize === s ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                                                    >
                                                                        {s}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* Color Selection */}
                                                        <div>
                                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Select New Color</label>
                                                            <div className="flex flex-wrap gap-3">
                                                                {[
                                                                    { name: 'Black', hex: '#000000' },
                                                                    { name: 'Blue', hex: '#2874f0' },
                                                                    { name: 'Red', hex: '#ff0000' },
                                                                    { name: 'White', hex: '#ffffff shadow-inner' },
                                                                ].map(c => (
                                                                    <div
                                                                        key={c.name}
                                                                        onClick={(e) => { e.stopPropagation(); setSelectedReplacementColor(c.name); }}
                                                                        className={`flex items-center gap-2 px-3 py-2 border rounded-full text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${selectedReplacementColor === c.name ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-100 bg-white text-gray-500 hover:bg-gray-50'}`}
                                                                    >
                                                                        <div className={`w-3 h-3 rounded-full border border-gray-100 ${c.name === 'White' ? 'bg-white' : ''}`} style={{ backgroundColor: c.name !== 'White' ? c.hex : undefined }}></div>
                                                                        {c.name}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        <div className="py-2 px-3 bg-white/50 rounded-lg border border-blue-200">
                                                            <div className="flex items-center gap-2 leading-tight">
                                                                <span className="material-icons text-blue-600 text-sm">local_shipping</span>
                                                                <span className="text-[10px] font-bold text-blue-600 uppercase">New item will be shipped after old item pickup</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            {returnMode === 'REPLACEMENT' && <span className="material-icons text-blue-600 absolute top-4 right-4">check_circle</span>}
                                        </div>
                                    </button>
                                </div>

                                {/* What Happens Next Section */}
                                <div className="mt-8 pt-6 border-t border-gray-100">
                                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">How it works</h4>
                                    <div className="space-y-4">
                                        <div className="flex gap-3">
                                            <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0">
                                                <span className="text-[10px] font-bold">1</span>
                                            </div>
                                            <p className="text-xs text-gray-600">
                                                <span className="font-bold text-gray-800">Quality Check:</span>
                                                {returnMode === 'REPLACEMENT'
                                                    ? " Pickup agent will verify that the original item and tags are intact."
                                                    : " Our agent will verify the reason at pickup."
                                                }
                                            </p>
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0">
                                                <span className="text-[10px] font-bold">2</span>
                                            </div>
                                            <p className="text-xs text-gray-600">
                                                {returnMode === 'REFUND'
                                                    ? <><span className="font-bold text-gray-800">Refund Triggered:</span> Refund initiated after successful pickup check.</>
                                                    : <><span className="font-bold text-gray-800">Replacement Delivered:</span> Your new <span className="text-blue-600 font-bold">{selectedReplacementSize}</span> size item will be dispatched.</>
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Comments (Optional)</label>
                                    <textarea
                                        placeholder="Tell us more about the issue... (e.g. Broken screen, Wrong color)"
                                        className="w-full border border-gray-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-blue-600/20 outline-none h-24 transition-all text-gray-900"
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                    ></textarea>
                                </div>

                                {returnMode === 'REFUND' && (
                                    <div className="mt-6">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">
                                            Bank Details (For Refund)
                                        </label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <input
                                                type="text"
                                                value={bankDetails.accountHolderName}
                                                onChange={(e) => setBankDetails((prev) => ({ ...prev, accountHolderName: e.target.value }))}
                                                placeholder="Account Holder Name"
                                                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-600/20 outline-none transition-all text-gray-900"
                                            />
                                            <input
                                                type="text"
                                                value={bankDetails.accountNumber}
                                                onChange={(e) => setBankDetails((prev) => ({ ...prev, accountNumber: e.target.value.replace(/\D/g, '') }))}
                                                placeholder="Account Number"
                                                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-600/20 outline-none transition-all text-gray-900"
                                            />
                                        </div>
                                        <input
                                            type="text"
                                            value={bankDetails.ifscCode}
                                            onChange={(e) => setBankDetails((prev) => ({ ...prev, ifscCode: e.target.value.toUpperCase() }))}
                                            placeholder="IFSC Code"
                                            className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-600/20 outline-none transition-all text-gray-900 mt-3"
                                        />
                                        <p className="text-[10px] text-gray-500 mt-2">
                                            If added, admin can verify and process refund to this account.
                                        </p>
                                    </div>
                                )}

                                <div className="mt-6">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">
                                        Proof (Required)
                                    </label>
                                    <input
                                        type="url"
                                        value={googleDriveLink}
                                        onChange={(e) => setGoogleDriveLink(e.target.value)}
                                        placeholder="Paste Google Drive/Docs link (optional if uploading files)"
                                        className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-600/20 outline-none transition-all text-gray-900"
                                    />
                                    <div className="mt-3">
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*,video/*"
                                            onChange={(e) => {
                                                const incoming = Array.from(e.target.files || []);
                                                const invalid = incoming.find((f) => f.size > 10 * 1024 * 1024);
                                                if (invalid) {
                                                    toast.error('Each file must be max 10MB');
                                                    e.target.value = '';
                                                    return;
                                                }
                                                setProofFiles(incoming);
                                            }}
                                            className="w-full text-xs text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-xs file:font-bold file:text-blue-700 hover:file:bg-blue-100"
                                        />
                                        <p className="text-[10px] text-gray-500 mt-2">
                                            Upload optional photos/videos (max 10MB each), or provide Google link.
                                        </p>
                                        {proofFiles.length > 0 && (
                                            <p className="text-[10px] text-green-700 mt-1 font-bold">
                                                {proofFiles.length} file(s) selected
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <button
                                    onClick={handleReturnSubmit}
                                    disabled={loading}
                                    className="w-full bg-[#fb641b] text-white py-4 rounded-xl font-black uppercase mt-8 shadow-xl shadow-[#fb641b]/20 active:scale-95 transition-all text-sm tracking-widest hover:bg-[#e65a17] hover:shadow-2xl"
                                >
                                    {loading ? 'Submitting...' : `Initiate ${returnMode === 'REFUND' ? 'Return' : 'Replacement'}`}
                                </button>
                            </div>
                        </div>

                        {/* Pickup Address Card */}
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 md:rounded-lg md:border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Pickup Address</h3>
                                <button
                                    type="button"
                                    onClick={() => setShowAddressSelector((prev) => !prev)}
                                    className="text-blue-600 text-[10px] font-black uppercase cursor-pointer hover:underline"
                                >
                                    Change
                                </button>
                            </div>
                            <p className="text-sm font-bold text-gray-800">{selectedPickupAddress?.name || order.shippingAddress?.name || 'N/A'}</p>
                            <p className="text-xs text-gray-500 mt-1">
                                {selectedPickupAddress?.address || order.shippingAddress?.street || 'N/A'}, {selectedPickupAddress?.city || order.shippingAddress?.city || 'N/A'} - {selectedPickupAddress?.pincode || order.shippingAddress?.postalCode || 'N/A'}
                            </p>
                            {!!selectedPickupAddress?.phone && (
                                <p className="text-xs text-gray-500 mt-1">Phone: {selectedPickupAddress.phone}</p>
                            )}

                            {showAddressSelector && (
                                <div className="mt-4 border-t border-gray-100 pt-4 space-y-2">
                                    {addresses.length > 0 ? (
                                        addresses.map((addr) => (
                                            <button
                                                type="button"
                                                key={addr.id}
                                                onClick={() => handleSelectPickupAddress(addr)}
                                                className={`w-full text-left p-3 rounded-lg border transition-all ${
                                                    selectedPickupAddressId === addr.id
                                                        ? 'border-blue-600 bg-blue-50'
                                                        : 'border-gray-200 hover:border-blue-300'
                                                }`}
                                            >
                                                <p className="text-sm font-semibold text-gray-800">{addr.name} {addr.type ? `(${addr.type})` : ''}</p>
                                                <p className="text-xs text-gray-500 mt-1">{addr.address}, {addr.city} - {addr.pincode}</p>
                                                {!!(addr.mobile || addr.phone) && (
                                                    <p className="text-xs text-gray-500 mt-1">Phone: {addr.mobile || addr.phone}</p>
                                                )}
                                            </button>
                                        ))
                                    ) : (
                                        <div className="text-xs text-gray-500">
                                            No saved addresses found. Default shipping address will be used.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReturnOrder;
