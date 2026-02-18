import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MdArrowBack, MdClose } from 'react-icons/md';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import useCouponStore from '../../admin/store/couponStore';
import API from '../../../services/api';
import { toast } from 'react-hot-toast';
import { useAddressAutocomplete } from '../../../hooks/useAddressAutocomplete';
import Loader from '../../../components/common/Loader';

const Checkout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { cart, addresses, placeOrder, getTotalPrice, addAddress, appliedCoupon, applyCoupon, removeCoupon } = useCartStore();
    const { user } = useAuthStore();
    const buyNowItem = location.state?.buyNowItem;
    
    // Use buyNowItem if present, otherwise fallback to global cart
    const checkoutItems = buyNowItem ? [buyNowItem] : cart;
    const { coupons, fetchCoupons } = useCouponStore(); // Get coupons from the store

    useEffect(() => {
        fetchCoupons();
    }, [fetchCoupons]);

    const [step, setStep] = useState(2);
    const [selectedAddress, setSelectedAddress] = useState(addresses[0]?.id || null);
    const [paymentMethod, setPaymentMethod] = useState('UPI');
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);
    const [isOrderSuccess, setIsOrderSuccess] = useState(false);
    const [isChangingAddress, setIsChangingAddress] = useState(false);
    const [isAddingAddress, setIsAddingAddress] = useState(false);
    const { 
        suggestions, 
        loading: autocompleteLoading, 
        fetchSuggestions, 
        fetchPlaceDetails,
        setSuggestions 
    } = useAddressAutocomplete();

    const [isPincodeServiceable, setIsPincodeServiceable] = useState(true);
    const [isCODServiceable, setIsCODServiceable] = useState(true);
    const [isPincodeChecking, setIsPincodeChecking] = useState(false);

    useEffect(() => {
        const checkServiceability = async () => {
            const selectedAddrObj = addresses.find(a => a.id === selectedAddress);
            if (selectedAddrObj && selectedAddrObj.pincode) {
                setIsPincodeChecking(true);
                try {
                    const { data } = await API.get(`/pincodes/check/${selectedAddrObj.pincode}`);
                    setIsPincodeServiceable(data.isServiceable);
                    setIsCODServiceable(data.isCOD !== false); // Default to true if undefined, but API sends it now
                } catch (error) {
                    console.error('Error checking serviceability:', error);
                    setIsPincodeServiceable(false);
                    setIsCODServiceable(false);
                } finally {
                    setIsPincodeChecking(false);
                }
            }
        };
        if (selectedAddress) {
            checkServiceability();
        }
    }, [selectedAddress, addresses]);

    // Redirect if not logged in, cart is empty or no addresses exist
    useEffect(() => {
        if (!user) {
            toast.error('Please login first to access checkout');
            navigate('/login', { state: { from: '/checkout' }, replace: true });
        } else if (checkoutItems.length === 0) {
            navigate('/cart', { replace: true });
        } else if (addresses.length === 0) {
            toast.error('📍 Please add a delivery address before placing an order.');
            navigate('/addresses', { replace: true });
        }
    }, [user, cart, addresses, navigate]);

    const [couponInput, setCouponInput] = useState('');
    const [couponError, setCouponError] = useState('');

    const handleApplyCoupon = (codeOverride = null) => {
        setCouponError('');
        const codeToApply = (codeOverride || couponInput).trim();
        if (!codeToApply) return;

        // Find coupon in the store
        // console.log('Available Coupons:', coupons);
        // console.log('Code to Apply:', codeToApply);
        
        // Find by code first to give better error messages
        const coupon = coupons.find(c => c.code === codeToApply);

        // console.log('Found Coupon:', coupon);

        if (coupon) {
            if (!coupon.active) {
                setCouponError('This coupon is inactive or expired');
                return;
            }

            // Basic Validation Logic
            const price = buyNowItem 
                ? buyNowItem.price * buyNowItem.quantity
                : getTotalPrice();
                
            if (price < coupon.minPurchase) {
                setCouponError(`Min purchase of ₹${coupon.minPurchase} required`);
                return;
            }

            // Calculate Discount - Robust Calculation
            let discountAmount = 0;
            const couponValue = parseFloat(coupon.value) || 0;
            const maxDiscount = parseFloat(coupon.maxDiscount) || 0;
            
            if (couponValue < 0) {
                 setCouponError('Invalid coupon value');
                 return;
            }

            if (coupon.type === 'percentage') {
                discountAmount = (price * couponValue) / 100;
                if (maxDiscount > 0) {
                    discountAmount = Math.min(discountAmount, maxDiscount);
                }
            } else {
                discountAmount = couponValue;
            }

            // Safety: Ensure discount doesn't exceed order price and is not negative
            discountAmount = Math.max(0, Math.min(discountAmount, price));

            applyCoupon({ code: coupon.code, discount: Math.round(discountAmount), type: coupon.type });
            setCouponInput('');
        } else {
            setCouponError('Invalid Coupon Code');
        }
    };

    const handleRemoveCoupon = () => {
        removeCoupon();
        setCouponInput('');
        setCouponError('');
    };

    // New Address Form State
    const [newAddr, setNewAddr] = useState({
        name: user?.name || '',
        mobile: user?.phone || user?.mobile || '',
        pincode: '',
        address: '',
        city: '',
        state: '',
        type: 'Home'
    });

    // Update newAddr if user changes
    useEffect(() => {
        if (user) {
            setNewAddr(prev => ({
                ...prev,
                name: prev.name || user.name || '',
                mobile: prev.mobile || user.phone || user.mobile || ''
            }));
        }
    }, [user]);

    const handleAddAddress = (e) => {
        e.preventDefault();
        // Validate Indian mobile number
        const mobileRegex = /^[6-9]\d{9}$/;
        if (!mobileRegex.test(newAddr.mobile)) {
            return toast.error('Please enter a valid 10-digit Indian mobile number (starting with 6-9)');
        }

        const id = Date.now();
        addAddress({ ...newAddr, name: user?.name || newAddr.name, id });
        setSelectedAddress(id);
        setIsAddingAddress(false);
        setIsChangingAddress(false);
    };

    
    const totalPrice = buyNowItem 
        ? buyNowItem.price * buyNowItem.quantity 
        : getTotalPrice();
    const discount = appliedCoupon ? appliedCoupon.discount : 0;
    const delivery = totalPrice > 500 ? 0 : 40;
    const finalAmount = Math.max(0, totalPrice + delivery - discount);

    const handlePlaceOrder = async (paymentMethodOverride = 'COD') => {
        // Validate cart is not empty
        if (checkoutItems.length === 0) {
            toast.error('Your cart is empty');
            navigate('/cart');
            return;
        }

        // Validate address is selected
        if (!selectedAddress) {
            toast.error('Please select a delivery address');
            return;
        }

        const selectedAddrObj = addresses.find(a => a.id === selectedAddress);
        
        // Validate address object exists and has required fields
        if (!selectedAddrObj || !selectedAddrObj.address || !selectedAddrObj.city || !selectedAddrObj.pincode) {
            toast.error('Please add a complete delivery address with all required fields');
            return;
        }

        // Validate mobile number
        if (!selectedAddrObj.mobile) {
            toast.error('Please ensure a mobile number is added to your delivery address');
            return;
        }

        setIsPlacingOrder(true);
        
        
        const orderData = {
            orderItems: checkoutItems.map(item => ({
                name: item.name,
                qty: item.quantity,
                image: item.image,
                price: item.price,
                variant: item.variant,
                product: item.id
            })),
            shippingAddress: {
                name: selectedAddrObj.name,
                email: selectedAddrObj.email || addresses[0]?.email || 'N/A', // Try to get email if available in address or fallback 
                phone: selectedAddrObj.mobile,
                street: selectedAddrObj.address,
                city: selectedAddrObj.city,
                postalCode: selectedAddrObj.pincode,
                country: 'India'
            },
            paymentMethod: paymentMethodOverride,
            itemsPrice: totalPrice,
            taxPrice: 0,
            shippingPrice: delivery,
            totalPrice: finalAmount,
        };

        if (paymentMethodOverride === 'COD') {
            try {
                const { data } = await API.post('/orders', orderData);
                // If buying now, do NOT clear the main cart. Pass false.
                // If purchasing from cart, clear it. Pass true.
                placeOrder(data, !buyNowItem);
                if (appliedCoupon) removeCoupon();
                setIsOrderSuccess(true);
                setTimeout(() => {
                    navigate(`/my-orders/${data._id || data.id}`, { replace: true });
                }, 2000);
            } catch (error) {
                console.error(error);
                setIsPlacingOrder(false);
                toast.error(error.response?.data?.message || "Order failed!");
            }
        } else {
            // Razorpay flow
            try {
                const { data: config } = await API.get('/payments/config');
                const { data: order } = await API.post('/payments/order', { amount: finalAmount });
                
                const options = {
                    key: config.keyId,
                    amount: order.amount,
                    currency: order.currency,
                    name: "Geeta Stores",
                    description: "Order Payment",
                    order_id: order.id,
                    handler: async (response) => {
                        try {
                            const { data: verification } = await API.post('/payments/verify', response);
                            if (verification.message === "Payment verified successfully") {
                                const paidOrderData = {
                                    ...orderData,
                                    paymentResult: {
                                        id: response.razorpay_payment_id,
                                        razorpay_order_id: response.razorpay_order_id,
                                        status: 'paid',
                                        update_time: new Date().toISOString(),
                                        card_network: verification.cardInfo?.network,
                                        card_last4: verification.cardInfo?.last4,
                                        card_type: verification.cardInfo?.type
                                    },
                                    isPaid: true,
                                    paidAt: new Date().toISOString()
                                };
                                const { data } = await API.post('/orders', paidOrderData);
                                placeOrder(data, !buyNowItem);
                                if (appliedCoupon) removeCoupon();
                                setIsOrderSuccess(true);
                                setTimeout(() => {
                                    navigate(`/my-orders/${data._id || data.id}`, { replace: true });
                                }, 2000);
                            }
                        } catch (error) {
                            console.error(error);
                            toast.error("Payment verification failed!");
                            setIsPlacingOrder(false);
                        }
                    },
                    prefill: {
                        name: selectedAddrObj?.name,
                        contact: selectedAddrObj?.mobile
                    },
                    theme: {
                        color: "#2874f0"
                    },
                    modal: {
                        ondismiss: () => {
                            setIsPlacingOrder(false);
                        }
                    }
                };
                const rzp = new window.Razorpay(options);
                rzp.open();
            } catch (error) {
                console.error(error);
                setIsPlacingOrder(false);
                toast.error("Failed to initialize payment!");
            }
        }
    };

    if (isPlacingOrder || isOrderSuccess) {
        return (
            <Loader 
                fullPage={true} 
                message={isOrderSuccess ? "Order Placed Successfully!" : "Processing Payment... Finishing your order safely."} 
                isSuccess={isOrderSuccess}
            />
        );
    }

    return (
        <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 min-h-screen pb-10">
            {/* Enhanced Header */}
            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 sticky top-0 z-50 shadow-lg md:static md:shadow-xl md:mb-6">
                <div className="px-4 py-5 flex items-center gap-4 md:max-w-[1248px] md:mx-auto md:px-6 md:rounded-2xl">
                    <button
                        onClick={() => step === 3 ? setStep(2) : navigate(-1)}
                        className="p-2 -ml-1 text-white hover:bg-white/20 rounded-full transition-all md:hidden"
                    >
                        <MdArrowBack size={24} />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-xl font-black text-white tracking-tight">{step === 2 ? '🛒 Order Summary' : '💳 Payment'}</h1>
                        <p className="text-xs text-white/80 mt-0.5">Complete your purchase securely</p>
                    </div>
                </div>
            </div>

            {/* Main Grid Container */}
            <div className="md:flex md:gap-4 md:max-w-[1248px] md:mx-auto md:items-start md:px-0">

                {/* Left Column */}
                <div className="md:flex-1 md:min-w-0">
                    {/* Enhanced Steps Progress */}
                    <div className="bg-gradient-to-r from-white to-blue-50 px-4 py-6 border-2 border-blue-100 flex items-center justify-center mb-4 md:rounded-2xl md:shadow-lg">
                        <div className="flex items-center w-full max-w-md">
                            {/* Cart Step */}
                            <div className="flex flex-col items-center flex-1 relative">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-white flex items-center justify-center z-10 shadow-lg shadow-green-500/50">
                                    <span className="material-icons text-[18px]">check</span>
                                </div>
                                <span className="text-[11px] font-black text-green-600 uppercase mt-2 tracking-tight">Cart</span>
                            </div>

                            <div className="flex-1 h-[3px] bg-gradient-to-r from-green-500 to-blue-500 -mt-8 rounded-full"></div>

                            {/* Summary Step */}
                            <div className="flex flex-col items-center flex-1 relative">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 shadow-lg ${step >= 2 ? 'bg-gradient-to-br from-blue-500 to-purple-600 shadow-blue-500/50' : 'bg-gray-200'} text-white text-sm font-black`}>
                                    {step > 2 ? <span className="material-icons text-[18px]">check</span> : '2'}
                                </div>
                                <span className={`text-[11px] font-black uppercase mt-2 tracking-tight ${step >= 2 ? 'bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent' : 'text-gray-400'}`}>Summary</span>
                            </div>

                            <div className={`flex-1 h-[3px] -mt-8 rounded-full ${step > 2 ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-gray-200'}`}></div>

                            {/* Payment Step */}
                            <div className="flex flex-col items-center flex-1 relative">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 shadow-lg ${step === 3 ? 'bg-gradient-to-br from-purple-500 to-pink-600 shadow-purple-500/50' : 'bg-gray-200'} text-white text-sm font-black`}>
                                    3
                                </div>
                                <span className={`text-[11px] font-black uppercase mt-2 tracking-tight ${step === 3 ? 'bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent' : 'text-gray-400'}`}>Payment</span>
                            </div>
                        </div>
                    </div>

                    {step === 2 && (
                        <div className="space-y-2 pb-24 md:pb-0">
                            {/* Delivery Address Section */}
                            {!isChangingAddress ? (
                                <div className="bg-white px-4 py-4 flex items-center justify-between md:rounded-sm md:shadow-sm">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[13px] text-gray-800">Deliver to: <span className="font-bold">{user?.name || addresses.find(a => a.id === selectedAddress)?.name}, {addresses.find(a => a.id === selectedAddress)?.pincode}</span></span>
                                            <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-500 font-bold uppercase tracking-tighter">{addresses.find(a => a.id === selectedAddress)?.type}</span>
                                        </div>
                                        <p className="text-[11px] text-gray-500 leading-normal">{addresses.find(a => a.id === selectedAddress)?.address}, {addresses.find(a => a.id === selectedAddress)?.city}</p>
                                    </div>
                                    <button
                                        onClick={() => setIsChangingAddress(true)}
                                        className="text-blue-600 font-bold text-[12px] border border-gray-100 px-4 py-1.5 rounded-sm shadow-sm active:bg-gray-50 hover:bg-gray-50"
                                    >
                                        Change
                                    </button>
                                </div>
                            ) : (
                                <div className="bg-white p-4 animate-in fade-in duration-300 md:rounded-sm md:shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-bold uppercase text-gray-400 tracking-wider">Select Delivery Address</h3>
                                        <button onClick={() => setIsChangingAddress(false)} className="text-blue-600 text-xs font-bold uppercase">Done</button>
                                    </div>

                                    <div className="space-y-4">
                                        {addresses.map(addr => (
                                            <label key={addr.id} className={`block p-4 rounded border transition-all cursor-pointer ${selectedAddress === addr.id ? 'border-blue-500 bg-blue-50/20' : 'border-gray-100 hover:border-gray-300'}`}>
                                                <div className="flex gap-3">
                                                    <input
                                                        type="radio"
                                                        checked={selectedAddress === addr.id}
                                                        onChange={() => setSelectedAddress(addr.id)}
                                                        className="mt-1 accent-blue-600"
                                                    />
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="font-bold text-sm text-gray-800">{user?.name || addr.name}</span>
                                                            <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 font-bold uppercase">{addr.type}</span>
                                                            <span className="text-sm text-gray-800 ml-auto font-medium">{addr.mobile}</span>
                                                        </div>
                                                        <p className="text-xs text-gray-500 leading-relaxed">{addr.address}, {addr.city}, {addr.state} - {addr.pincode}</p>
                                                        {selectedAddress === addr.id && (
                                                            <button
                                                                onClick={() => {
                                                                    setIsChangingAddress(false);
                                                                    setStep(2);
                                                                }}
                                                                className="mt-3 bg-[#fb641b] text-white px-6 py-2 rounded-sm text-[11px] font-bold uppercase shadow-md active:scale-95 transition-all w-full md:w-auto"
                                                            >
                                                                Deliver Here
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </label>
                                        ))}

                                        {!isAddingAddress ? (
                                            <button
                                                onClick={() => setIsAddingAddress(true)}
                                                className="w-full flex items-center gap-2 p-4 text-blue-600 border border-dashed border-blue-200 rounded-lg bg-blue-50/30 active:bg-blue-50 transition-colors hover:bg-blue-50"
                                            >
                                                <span className="material-icons text-sm">add</span>
                                                <span className="text-sm font-bold">Add a new address</span>
                                            </button>
                                        ) : (
                                            <form onSubmit={handleAddAddress} className="border border-blue-200 p-4 rounded-lg bg-blue-50/10 space-y-4 animate-in slide-in-from-top-4 duration-300">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2 col-span-2">
                                                        <label className="text-xs font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent uppercase tracking-wide pl-1">👤 Full Name</label>
                                                        <input required type="text" placeholder="Enter your full name" className="w-full border-2 border-blue-200 p-3 rounded-xl text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none text-gray-900 font-semibold placeholder-blue-300 bg-white shadow-sm" value={newAddr.name} onChange={e => setNewAddr({ ...newAddr, name: e.target.value })} />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent uppercase tracking-wide pl-1">📱 Mobile</label>
                                                        <input required type="tel" placeholder="10-digit mobile" className="w-full border-2 border-blue-200 p-3 rounded-xl text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none text-gray-900 font-semibold placeholder-blue-300 bg-white shadow-sm" value={newAddr.mobile} onChange={e => setNewAddr({ ...newAddr, mobile: e.target.value })} />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent uppercase tracking-wide pl-1">📮 Pincode</label>
                                                        <input required type="number" placeholder="6-digit PIN" className="w-full border-2 border-blue-200 p-3 rounded-xl text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none text-gray-900 font-semibold placeholder-blue-300 bg-white shadow-sm" value={newAddr.pincode} onChange={e => setNewAddr({ ...newAddr, pincode: e.target.value })} />
                                                    </div>
                                                    <div className="space-y-2 col-span-2 relative">
                                                        <label className="text-xs font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent uppercase tracking-wide pl-1">🏠 Address (Area and Street)</label>
                                                        <textarea 
                                                            required 
                                                            rows="2" 
                                                            placeholder="Enter flat, house no., building, company, apartment, area, street" 
                                                            className="w-full border-2 border-blue-200 p-3 rounded-xl text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none text-gray-900 font-semibold placeholder-blue-300 bg-white shadow-sm" 
                                                            value={newAddr.address} 
                                                            onChange={e => {
                                                                const val = e.target.value;
                                                                setNewAddr({ ...newAddr, address: val });
                                                                fetchSuggestions(val);
                                                            }} 
                                                        />
                                                        {suggestions.length > 0 && (
                                                            <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-blue-200 shadow-xl rounded-xl max-h-48 overflow-y-auto">
                                                                {suggestions.map((suggestion) => (
                                                                    <button
                                                                        key={suggestion.place_id}
                                                                        type="button"
                                                                        onClick={async () => {
                                                                            const details = await fetchPlaceDetails(suggestion.place_id);
                                                                            if (details) {
                                                                                setNewAddr(prev => ({
                                                                                    ...prev,
                                                                                    address: details.address,
                                                                                    city: details.city || prev.city,
                                                                                    state: details.state || prev.state,
                                                                                    pincode: details.pincode || prev.pincode
                                                                                }));
                                                                                setSuggestions([]);
                                                                            }
                                                                        }}
                                                                        className="w-full text-left p-3 hover:bg-blue-50 border-b last:border-0 border-blue-50 transition-colors flex items-start gap-2"
                                                                    >
                                                                        <span className="material-icons text-blue-400 text-sm mt-0.5">location_on</span>
                                                                        <div className="flex-1">
                                                                            <p className="text-sm text-gray-800 font-medium">{suggestion.description}</p>
                                                                        </div>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent uppercase tracking-wide pl-1">🏙️ City</label>
                                                        <input required type="text" placeholder="Your city" className="w-full border-2 border-blue-200 p-3 rounded-xl text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none text-gray-900 font-semibold placeholder-blue-300 bg-white shadow-sm" value={newAddr.city} onChange={e => setNewAddr({ ...newAddr, city: e.target.value })} />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent uppercase tracking-wide pl-1">🗺️ State</label>
                                                        <input required type="text" placeholder="Your state" className="w-full border-2 border-blue-200 p-3 rounded-xl text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none text-gray-900 font-semibold placeholder-blue-300 bg-white shadow-sm" value={newAddr.state} onChange={e => setNewAddr({ ...newAddr, state: e.target.value })} />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-1">Address Type</label>
                                                    <div className="flex gap-4">
                                                        {['Home', 'Work'].map(type => (
                                                            <label key={type} className="flex items-center gap-2 cursor-pointer">
                                                                <input type="radio" name="addrType" checked={newAddr.type === type} onChange={() => setNewAddr({ ...newAddr, type })} className="accent-blue-600" />
                                                                <span className="text-sm text-gray-700">{type}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="flex gap-3 pt-2">
                                                    <button type="button" onClick={() => setIsAddingAddress(false)} className="flex-1 py-3 text-gray-500 font-bold uppercase text-[12px]">Cancel</button>
                                                    <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-sm font-bold uppercase text-[12px] shadow-lg">Save & Deliver</button>
                                                </div>
                                            </form>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Order Items */}
                            <div className="bg-white md:rounded-sm md:shadow-sm">
                                {checkoutItems.map(item => (
                                    <div key={item.id} className="p-4 border-b border-gray-100 last:border-0 flex gap-4">
                                        <div className="w-16 h-20 bg-gray-50 rounded border border-gray-100 p-1 flex-shrink-0 flex items-center justify-center">
                                            <img src={item.image} alt="" className="max-w-full max-h-full object-contain" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-[13px] font-medium text-gray-800 line-clamp-2 leading-snug">{item.name}</h3>
                                            {item.variant && Object.entries(item.variant).map(([key, value]) => (
                                                <p key={key} className="text-[10px] text-gray-400 mt-0.5 uppercase font-bold tracking-tight">
                                                    {key}: {value}
                                                </p>
                                            ))}
                                            <p className="text-[10px] text-gray-400 mt-0.5 uppercase font-bold tracking-tight">Quantity: {item.quantity}</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-[16px] font-black text-gray-900">₹{item.price.toLocaleString()}</span>
                                                {item.originalPrice && (
                                                    <span className="text-[11px] text-gray-400 line-through font-medium">₹{item.originalPrice.toLocaleString()}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {/* Desktop Continue Button */}
                                <div className="hidden md:flex flex-col gap-3 p-4 border-t sticky bottom-0 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
                                    {!isPincodeServiceable && !isPincodeChecking && (
                                        <div className="bg-red-50 p-3 rounded-lg border border-red-100 mb-2">
                                            <p className="text-red-600 font-bold text-xs flex items-center gap-2 justify-center">
                                                <span className="material-icons text-red-500 text-[18px]">location_off</span>
                                                Sorry, we don't deliver to this pincode yet.
                                            </p>
                                        </div>
                                    )}
                                    {isPincodeServiceable && !isCODServiceable && !isPincodeChecking && (
                                        <div className="bg-orange-50 p-2 rounded-lg border border-orange-100 mb-2">
                                            <p className="text-orange-600 font-bold text-xs flex items-center gap-2 justify-center">
                                                <span className="material-icons text-orange-500 text-[18px]">money_off</span>
                                                Cash on Delivery is not available for this location.
                                            </p>
                                        </div>
                                    )}
                                    <div className="flex justify-end gap-3">
                                        <button
                                            onClick={() => handlePlaceOrder('COD')}
                                            disabled={!isPincodeServiceable || isPincodeChecking || !isCODServiceable}
                                            className={`px-8 py-3.5 rounded-xl font-black text-sm shadow-lg hover:shadow-xl transition-all uppercase tracking-wide flex items-center gap-2 ${
                                                isPincodeServiceable && !isPincodeChecking && isCODServiceable
                                                ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white'
                                                : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed shadow-none'
                                            }`}
                                        >
                                            <span className="material-icons text-lg">local_shipping</span>
                                            Cash on Delivery
                                        </button>
                                        <button
                                            onClick={() => setStep(3)}
                                            disabled={!isPincodeServiceable || isPincodeChecking}
                                            className={`px-10 py-3.5 rounded-xl font-black text-sm shadow-lg hover:shadow-xl transition-all uppercase tracking-wide flex items-center gap-2 ${
                                                isPincodeServiceable && !isPincodeChecking
                                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                                                : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed shadow-none'
                                            }`}
                                        >
                                            <span className="material-icons text-lg">payment</span>
                                            Pay Online
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Coupons Section (Mobile Only - moved to Sidebar for Desktop) */}
                            <div className="bg-white p-4 md:hidden">
                                {/* Inline Coupon Input */}
                                <div className="mt-4 flex gap-3">
                                    <input
                                        type="text"
                                        placeholder="🎟️ Enter Coupon Code"
                                        value={couponInput}
                                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                                        className="flex-1 border-2 border-purple-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 font-black uppercase placeholder-purple-300 disabled:bg-gray-50 text-gray-900 shadow-sm bg-white"
                                        disabled={appliedCoupon !== null}
                                    />
                                    {appliedCoupon ? (
                                        <button
                                            onClick={handleRemoveCoupon}
                                            className="bg-gradient-to-r from-red-500 to-pink-600 text-white font-black text-xs uppercase px-5 py-3 rounded-xl hover:shadow-lg transition-all shadow-md"
                                        >
                                            Remove
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleApplyCoupon()}
                                            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-black text-sm uppercase px-6 py-3 rounded-xl cursor-pointer hover:shadow-lg transition-all shadow-md"
                                        >
                                            Apply
                                        </button>
                                    )}
                                </div>

                                {appliedCoupon && (
                                    <div className="mt-2 flex items-center gap-2 text-green-600 bg-green-50 p-2 rounded border border-green-100 animate-in fade-in">
                                        <span className="material-icons text-sm">check_circle</span>
                                        <div className="text-xs">
                                            <span className="font-bold">'{appliedCoupon.code}'</span> applied.
                                            <span className="font-bold ml-1">₹{appliedCoupon.discount} savings!</span>
                                        </div>
                                    </div>
                                )}

                                {couponError && (
                                    <p className="text-xs text-red-500 mt-2 font-medium">{couponError}</p>
                                )}

                                {/* Inline Available Coupons for Mobile */}
                                {!appliedCoupon && coupons.filter(c => c.active).length > 0 && (
                                    <div className="mt-6 space-y-3 pt-6 border-t border-gray-50">
                                        <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Available Coupons</h4>
                                        <div className="space-y-3">
                                            {coupons.filter(c => c.active).map((coupon) => (
                                                <div key={coupon._id} className="bg-white rounded-xl p-3 border border-dashed border-blue-200 hover:border-blue-400 transition-colors flex items-center justify-between group">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-[11px]">{coupon.code}</span>
                                                            <span className="text-[11px] font-bold text-gray-700">{coupon.title}</span>
                                                        </div>
                                                        <p className="text-[10px] text-gray-400 mt-1">{coupon.description}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleApplyCoupon(coupon.code)}
                                                        className="text-[11px] font-black text-blue-600 uppercase hover:text-blue-700 active:scale-95 transition-all"
                                                    >
                                                        Apply
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Order Summary Details (Mobile Only) */}
                            <div className="bg-white p-4 md:hidden">
                                <h3 className="text-gray-400 font-bold uppercase text-[10px] mb-4 tracking-widest">Price Details</h3>
                                <div className="space-y-4 text-[13px]">
                                    <div className="flex justify-between">
                                        <span className="text-gray-700 font-medium">Price ({checkoutItems.reduce((acc, item) => acc + item.quantity, 0)} items)</span>
                                        <span className="text-gray-900">₹{totalPrice.toLocaleString()}</span>
                                    </div>

                                    {appliedCoupon && (
                                        <div className="flex justify-between text-green-600 animate-in slide-in-from-left-2">
                                            <span className="font-medium flex items-center gap-1">coupon <span className="uppercase text-[10px] bg-green-100 px-1 rounded border border-green-200">{appliedCoupon.code}</span></span>
                                            <span className="font-bold">- ₹{appliedCoupon.discount}</span>
                                        </div>
                                    )}

                                    <div className="flex justify-between">
                                        <span className="text-gray-700 font-medium">Delivery Charges</span>
                                        <span className={delivery === 0 ? "text-green-600 font-black" : "text-gray-900"}>{delivery === 0 ? "FREE" : `₹${delivery}`}</span>
                                    </div>
                                    <div className="flex justify-between font-black text-[15px] border-t border-dashed pt-4 mt-2">
                                        <span className="text-gray-900 tracking-tight">Total Amount</span>
                                        <span className="text-gray-900 font-black">₹{finalAmount.toLocaleString()}</span>
                                    </div>
                                </div>
                                {appliedCoupon && (
                                    <div className="border-t border-gray-100 mt-4 pt-3 text-green-600 font-bold text-xs">
                                        You will save ₹{appliedCoupon.discount} on this order
                                    </div>
                                )}
                            </div>

                            {/* Sticky Footer for step 2 (Mobile Only) */}
                            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-3 flex items-center justify-between shadow-[0_-10px_30px_rgba(0,0,0,0.06)] z-[50] md:hidden">
                                <div className="flex flex-col">
                                    <span className="text-lg font-black text-gray-900">₹{finalAmount.toLocaleString()}</span>
                                    <button className="text-[10px] text-blue-600 font-black uppercase tracking-tighter text-left w-fit">View Details</button>
                                </div>
                                <div className="flex flex-col gap-2">
                                    {( (!isPincodeServiceable && !isPincodeChecking) || (!isCODServiceable && !isPincodeChecking) ) && (
                                        <span className={`${!isPincodeServiceable ? 'text-red-500' : 'text-orange-500'} font-black text-[10px] uppercase text-right leading-tight mb-1`}>
                                            {!isPincodeServiceable ? 'Not deliverable here' : 'COD Not Available'}
                                        </span>
                                    )}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handlePlaceOrder('COD')}
                                            disabled={!isPincodeServiceable || isPincodeChecking || !isCODServiceable}
                                            className={`px-6 py-3 rounded-xl font-black uppercase text-[11px] shadow-lg active:scale-[0.98] transition-all flex items-center gap-2 ${
                                                isPincodeServiceable && !isPincodeChecking && isCODServiceable
                                                ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-green-600/20'
                                                : 'bg-gray-100 text-gray-300 shadow-none cursor-not-allowed'
                                            }`}
                                        >
                                            <span className="material-icons text-sm">local_shipping</span>
                                            Cash on Delivery
                                        </button>
                                        <button
                                            onClick={() => setStep(3)}
                                            disabled={!isPincodeServiceable || isPincodeChecking}
                                            className={`px-6 py-3 rounded-xl font-black uppercase text-[11px] shadow-lg active:scale-[0.98] transition-all flex items-center gap-2 ${
                                                isPincodeServiceable && !isPincodeChecking
                                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-blue-600/20'
                                                : 'bg-gray-100 text-gray-300 shadow-none cursor-not-allowed'
                                            }`}
                                        >
                                            <span className="material-icons text-sm">payment</span>
                                            Pay Online
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4 md:space-y-6">
                            <div className="bg-white rounded-sm shadow-sm overflow-hidden border border-gray-100">
                                <div className="px-4 py-4 bg-gray-50/50 border-b border-gray-50">
                                    <h3 className="text-[13px] font-bold uppercase text-gray-500 tracking-wide">Payment Options</h3>
                                </div>
                                <div className="p-4 space-y-4">
                                    <div className="space-y-3">
                                        <label className={`flex items-center gap-4 p-4 rounded-lg border transition-all cursor-pointer ${paymentMethod === 'UPI' ? 'border-blue-500 bg-blue-50/20' : 'border-gray-50 hover:bg-gray-50'}`}>
                                            <input type="radio" checked={paymentMethod === 'UPI'} onChange={() => setPaymentMethod('UPI')} className="accent-blue-600" />
                                            <div className="flex-1 flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-gray-800">UPI (PhonePe / Google Pay)</span>
                                                    <span className="text-[10px] text-gray-400">Safe & Secure payments</span>
                                                </div>
                                                <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo.png" alt="upi" className="h-[14px]" />
                                            </div>
                                        </label>

                                        <label className={`flex items-center gap-4 p-4 rounded-lg border transition-all cursor-pointer ${paymentMethod === 'Card' ? 'border-blue-500 bg-blue-50/20' : 'border-gray-50 hover:bg-gray-50'}`}>
                                            <input type="radio" checked={paymentMethod === 'Card'} onChange={() => setPaymentMethod('Card')} className="accent-blue-600" />
                                            <div className="flex-1 flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-gray-800">Credit / Debit Card</span>
                                                    <span className="text-[10px] text-gray-400">All banks supported</span>
                                                </div>
                                                <div className="flex gap-1.5 grayscale opacity-50">
                                                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/2560px-Visa_Inc._logo.svg.png" alt="visa" className="h-[10px]" />
                                                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1280px-Mastercard-logo.svg.png" alt="mc" className="h-4" />
                                                </div>
                                            </div>
                                        </label>

                                        <label className={`flex items-center gap-4 p-4 rounded-lg border transition-all cursor-pointer ${paymentMethod === 'COD' ? 'border-blue-500 bg-blue-50/20' : (!isCODServiceable ? 'bg-gray-50 opacity-50 cursor-not-allowed' : 'border-gray-50 hover:bg-gray-50')}`}>
                                            <input type="radio" checked={paymentMethod === 'COD'} onChange={() => isCODServiceable && setPaymentMethod('COD')} disabled={!isCODServiceable} className="accent-blue-600" />
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-gray-800">Cash on Delivery</span>
                                                {!isCODServiceable && <span className="text-[10px] text-red-500 font-bold">Not available due to high returns/risk</span>}
                                            </div>
                                        </label>
                                    </div>

                                    <button
                                        onClick={() => handlePlaceOrder(paymentMethod)}
                                        className="w-full mt-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-black uppercase text-[14px] shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all hover:shadow-xl"
                                    >
                                        {paymentMethod === 'COD' ? '🚚 Place Order (COD)' : '💳 Pay & Place Order'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column (Desktop Sidebar) */}
                <div className="hidden md:block w-[320px] lg:w-[360px] shrink-0">
                    <div className="sticky top-20 space-y-4">
                        {/* Price Details Sidebar */}
                        <div className="bg-white p-4 rounded-sm shadow-sm border border-gray-100">
                            <h3 className="text-gray-400 font-bold uppercase text-[13px] mb-4 border-b pb-2 tracking-widest">Price Details</h3>
                            <div className="space-y-4 text-[13px]">
                                <div className="flex justify-between">
                                    <span className="text-gray-700 font-medium">Price ({checkoutItems.reduce((acc, item) => acc + item.quantity, 0)} items)</span>
                                    <span className="text-gray-900">₹{totalPrice.toLocaleString()}</span>
                                </div>

                                {appliedCoupon && (
                                    <div className="flex justify-between text-green-600">
                                        <span className="font-medium flex items-center gap-1">coupon <span className="uppercase text-[10px] bg-green-100 px-1 rounded border border-green-200">{appliedCoupon.code}</span></span>
                                        <span className="font-bold">- ₹{appliedCoupon.discount}</span>
                                    </div>
                                )}

                                <div className="flex justify-between">
                                    <span className="text-gray-700 font-medium">Delivery Charges</span>
                                    <span className={delivery === 0 ? "text-green-600 font-black" : "text-gray-900"}>{delivery === 0 ? "FREE" : `₹${delivery}`}</span>
                                </div>
                                <div className="flex justify-between font-black text-[15px] border-t border-dashed pt-4 mt-2">
                                    <span className="text-gray-900 tracking-tight">Total Amount</span>
                                    <span className="text-gray-900 font-black">₹{finalAmount.toLocaleString()}</span>
                                </div>
                            </div>
                            {appliedCoupon && (
                                <div className="border-t border-gray-100 mt-4 pt-3 text-green-600 font-bold text-xs">
                                    You will save ₹{appliedCoupon.discount} on this order
                                </div>
                            )}
                        </div>

                        {/* Apply Coupon Sidebar */}
                        <div className="bg-white p-4 rounded-sm shadow-sm border border-gray-100">
                            <div className="flex gap-3 mb-3">
                                <input
                                    type="text"
                                    placeholder="🎟️ Enter Coupon Code"
                                    value={couponInput}
                                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                                    className="flex-1 border-2 border-purple-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 font-black uppercase placeholder-purple-300 disabled:bg-gray-50 text-gray-900 shadow-sm bg-white"
                                    disabled={appliedCoupon !== null}
                                />
                                {appliedCoupon ? (
                                    <button
                                        onClick={handleRemoveCoupon}
                                        className="bg-gradient-to-r from-red-500 to-pink-600 text-white font-black text-xs uppercase px-5 py-3 rounded-xl hover:shadow-lg transition-all shadow-md"
                                    >
                                        Remove
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleApplyCoupon()}
                                        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-black text-sm uppercase px-6 py-3 rounded-xl cursor-pointer hover:shadow-lg transition-all shadow-md"
                                    >
                                        Apply
                                    </button>
                                )}
                            </div>
                            {couponError && (
                                <p className="text-xs text-red-500 mt-2 font-medium">{couponError}</p>
                            )}

                            {/* Inline Available Coupons for Desktop */}
                            {!appliedCoupon && coupons.filter(c => c.active).length > 0 && (
                                <div className="mt-6 space-y-3 pt-4 border-t border-gray-50">
                                    <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Available Coupons</h4>
                                    <div className="space-y-3">
                                        {coupons.filter(c => c.active).map((coupon) => (
                                            <div key={coupon._id} className="p-3 rounded-xl border border-dashed border-blue-100 bg-blue-50/10 hover:border-blue-300 hover:bg-blue-50/30 transition-all group">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-mono font-bold text-blue-600 text-[11px] uppercase tracking-wider">{coupon.code}</span>
                                                    <button
                                                        onClick={() => handleApplyCoupon(coupon.code)}
                                                        className="text-[10px] font-black text-blue-500 uppercase hover:text-blue-700 transition-colors"
                                                    >
                                                        Apply
                                                    </button>
                                                </div>
                                                <p className="text-[11px] font-bold text-gray-700 line-clamp-1">{coupon.title}</p>
                                                <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-2 leading-tight">{coupon.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Safe Payment Badge */}
                        <div className="flex items-center gap-3 p-4 text-xs text-gray-500 font-medium">
                            <span className="material-icons text-gray-400">gpp_good</span>
                            <p>Safe and Secure Payments. 100% Authentic products.</p>
                        </div>
                    </div>
                </div>

            </div>      {/* Coupons Modal */}

        </div>
    );
};

export default Checkout;
