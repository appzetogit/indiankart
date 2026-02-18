import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { confirmToast } from '../../../utils/toastUtils.jsx';
import ProductSection from '../components/home/ProductSection';
import { products } from '../data/mockData';
import toast from 'react-hot-toast';

const Cart = () => {
    const navigate = useNavigate();
    const {
        cart,
        savedForLater,
        removeFromCart,
        updateQuantity,
        moveToSavedForLater,
        moveToCart,
        removeFromSavedForLater,
        getTotalPrice,
        getTotalOriginalPrice,
        getTotalSavings,
        addresses
    } = useCartStore();
    const { isAuthenticated } = useAuthStore();

    const handleCheckout = () => {
        if (!isAuthenticated) {
            toast.error('Please login first to proceed to checkout');
            navigate('/login', { state: { from: '/cart' } });
            return;
        }
        if (cart.length === 0) {
            toast.error('🛒 Your cart is empty!');
            return;
        }
        if (addresses.length === 0) {
            confirmToast({
                message: '📍 Please add a delivery address before checkout.\n\nWould you like to add one now?',
                confirmText: 'Add Address',
                icon: 'add_location_alt',
                onConfirm: () => navigate('/addresses')
            });
            return;
        }
        navigate('/checkout');
    };

    const price = getTotalPrice();
    const originalPrice = getTotalOriginalPrice();
    const savings = getTotalSavings();
    const delivery = price > 500 ? 0 : 40;

    return (
        <div className="bg-gradient-to-b from-blue-50 via-white to-gray-50 min-h-screen">
            {/* Header */}
            <div className="bg-white sticky top-0 z-50 shadow-md md:shadow-sm md:static md:bg-transparent md:mb-4 border-b border-blue-100">
                <div className="px-4 py-4 flex items-center gap-3 w-full md:px-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="material-icons p-2 -ml-2 active:bg-blue-50 rounded-full transition-all cursor-pointer relative z-[60] md:hidden text-blue-600 hover:bg-blue-100"
                    >
                        arrow_back
                    </button>
                    <div className="flex items-center gap-3">
                        <h1 className="text-lg font-semibold text-gray-800 md:text-3xl">
                            My Cart ({cart.length})
                        </h1>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="w-full px-4 md:px-4">
                {cart.length === 0 ? (
                    <div className="space-y-6">
                        <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-white min-h-[40vh] md:rounded-2xl md:shadow-sm md:py-24 md:border border-gray-100 mx-4 md:mx-0">
                            <div className="relative mb-6 group">
                                <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-20 duration-[2s]"></div>
                                <div className="relative w-24 h-24 bg-gradient-to-tr from-blue-50 to-blue-100 rounded-full flex items-center justify-center shadow-inner hover:scale-105 transition-transform duration-300">
                                    <span className="material-icons text-blue-600 text-4xl md:text-[80px] drop-shadow-sm -ml-1">remove_shopping_cart</span>
                                </div>
                                <div className="absolute -bottom-1 -right-1 bg-white p-1.5 rounded-full shadow-md border border-gray-100">
                                    <span className="material-icons text-orange-500 text-lg">sentiment_dissatisfied</span>
                                </div>
                            </div>

                            <h2 className="text-xl md:text-3xl font-bold text-gray-900 mb-2 tracking-tight">Your cart is feeling light</h2>
                            <p className="text-gray-500 text-sm md:text-lg mb-6 max-w-sm mx-auto leading-relaxed">
                                There is nothing in your bag. Let's add some items.
                            </p>

                            <button
                                onClick={() => navigate('/')}
                                className="group relative inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-full font-bold shadow-blue-200 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden text-sm"
                            >
                                <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
                                <span className="material-icons relative z-10 text-lg transition-transform group-hover:rotate-12">shopping_bag</span>
                                <span className="relative z-10">Start Shopping</span>
                            </button>
                        </div>

                        {/* Saved for Later - Displayed even when cart is empty */}
                        {savedForLater.length > 0 && (
                            <div className="bg-white md:rounded-lg md:shadow-lg border border-blue-100 mx-4 md:mx-0">
                                <div className="px-5 py-4 border-b border-blue-100 bg-gradient-to-r from-white to-purple-50">
                                    <div className="flex items-center gap-2">
                                        <span className="material-icons text-purple-600">bookmark</span>
                                        <h3 className="text-base font-extrabold text-gray-800 uppercase">Saved for later ({savedForLater.length})</h3>
                                    </div>
                                </div>
                                {savedForLater.map((item) => (
                                    <div key={item.id} className="p-5 border-b border-blue-50 last:border-b-0 flex gap-4 opacity-80 hover:opacity-100 transition-all hover:bg-purple-50/50">
                                        <div className="w-24 h-28 flex-shrink-0 bg-gradient-to-br from-gray-50 to-purple-50 rounded-lg border-2 border-purple-100 p-2 grayscale hover:grayscale-0 transition-all">
                                            <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                                        </div>
                                        <div className="flex-1">
                                            <h2 className="text-base font-bold text-gray-700 line-clamp-2 hover:text-purple-600 cursor-pointer transition-colors" onClick={() => navigate(`/product/${item.id}`)}>{item.name}</h2>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-xl font-extrabold text-gray-700">₹{item.price.toLocaleString()}</span>
                                            </div>
                                            <div className="flex items-center gap-6 mt-4 text-sm font-bold uppercase">
                                                <button onClick={() => moveToCart(item)} className="text-blue-600 hover:text-purple-600 transition-colors flex items-center gap-1">
                                                    <span className="material-icons text-base">add_shopping_cart</span>
                                                    Move to Cart
                                                </button>
                                                <button onClick={() => removeFromSavedForLater(item.id)} className="text-red-500 hover:text-red-700 transition-colors flex items-center gap-1">
                                                    <span className="material-icons text-base">delete</span>
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="w-full md:flex md:gap-4 items-start">
                            {/* LEFT COLUMN */}
                            <div className="space-y-3 md:space-y-4 md:flex-1 md:min-w-0">
                                {/* Deliver to section */}
                                <div className="bg-gradient-to-r from-white to-blue-50 px-4 py-4 flex items-center justify-between border-b border-blue-100 md:rounded-lg md:shadow-md w-full">
                                    <div className="flex flex-col flex-1 min-w-0 mr-4">
                                        <div className="flex items-center gap-2">
                                            <span className="material-icons text-blue-600 text-lg">location_on</span>
                                            <span className="text-sm text-gray-800 font-semibold">Deliver to: <span className="font-extrabold text-blue-600">{addresses[0]?.name}, {addresses[0]?.pincode}</span></span>
                                            <span className="text-[10px] bg-gradient-to-r from-blue-500 to-purple-500 text-white px-2 py-1 rounded-full font-bold uppercase shrink-0">{addresses[0]?.type}</span>
                                        </div>
                                        <p className="text-xs text-gray-600 truncate mt-1 ml-7">{addresses[0]?.address}, {addresses[0]?.city}</p>
                                    </div>
                                    <button onClick={handleCheckout} className="text-blue-600 font-bold text-sm border-2 border-blue-600 px-5 py-2 rounded-lg active:bg-blue-50 hover:bg-blue-600 hover:text-white transition-all whitespace-nowrap shrink-0 shadow-sm">
                                        Change
                                    </button>
                                </div>

                                {/* Checkout Process Steps */}
                                <div className="bg-white px-6 py-6 border-b border-blue-100 flex items-center justify-between overflow-x-auto no-scrollbar relative md:rounded-lg md:shadow-md">
                                    <div className="absolute top-[38px] left-[15%] right-[15%] h-[2px] bg-gradient-to-r from-blue-200 via-purple-200 to-blue-200 -z-0"></div>

                                    <div className="flex flex-col items-center gap-2 min-w-[60px] relative z-10">
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white flex items-center justify-center text-sm font-bold shadow-lg ring-4 ring-blue-100">
                                            <span className="material-icons text-lg">shopping_cart</span>
                                        </div>
                                        <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-tight">Cart</span>
                                    </div>

                                    <div className="flex flex-col items-center gap-2 min-w-[60px] relative z-10 opacity-40">
                                        <div className="w-9 h-9 rounded-full bg-gray-300 text-white flex items-center justify-center text-sm font-bold shadow-md ring-4 ring-white">
                                            <span className="material-icons text-lg">location_on</span>
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">Address</span>
                                    </div>

                                    <div className="flex flex-col items-center gap-2 min-w-[60px] relative z-10 opacity-40">
                                        <div className="w-9 h-9 rounded-full bg-gray-300 text-white flex items-center justify-center text-sm font-bold shadow-md ring-4 ring-white">
                                            <span className="material-icons text-lg">receipt</span>
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">Summary</span>
                                    </div>

                                    <div className="flex flex-col items-center gap-2 min-w-[60px] relative z-10 opacity-40">
                                        <div className="w-9 h-9 rounded-full bg-gray-300 text-white flex items-center justify-center text-sm font-bold shadow-md ring-4 ring-white">
                                            <span className="material-icons text-lg">payment</span>
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">Payment</span>
                                    </div>
                                </div>

                                {/* Cart Items */}
                                <div className="bg-white md:rounded-lg md:shadow-lg border border-blue-100">
                                    {cart.map((item) => (
                                        <div key={`${item.id}-${JSON.stringify(item.selectedSize)}`} className="p-5 border-b border-blue-50 last:border-b-0 hover:bg-blue-50/50 transition-all">
                                            <div className="flex gap-4">
                                                <div className="w-24 h-28 flex-shrink-0 bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg border-2 border-blue-100 p-2 shadow-sm">
                                                    <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                                                </div>
                                                <div className="flex-1">
                                                    <h2 className="text-base font-bold text-gray-900 line-clamp-2 hover:text-blue-600 cursor-pointer transition-colors" onClick={() => navigate(`/product/${item.id}`)}>{item.name}</h2>
                                                    {item.variant && Object.entries(item.variant).map(([key, value]) => (
                                                        <p key={key} className="text-xs text-gray-600 mt-0.5 font-medium">
                                                            {key}: <span className="text-blue-600">{value}</span>
                                                        </p>
                                                    ))}
                                                    <div className="flex items-center gap-3 mt-3">
                                                        <span className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">₹{item.price.toLocaleString()}</span>
                                                        {item.originalPrice && (
                                                            <span className="text-sm text-gray-400 line-through font-medium">₹{item.originalPrice.toLocaleString()}</span>
                                                        )}
                                                        <span className="text-xs bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2 py-1 rounded-full font-bold shadow-sm">
                                                            {Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)}% Off
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 mt-6">
                                                <div className="flex items-center border-2 border-blue-600 rounded-lg overflow-hidden shadow-sm">
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity - 1, item.variant)}
                                                        className="w-10 h-10 flex items-center justify-center active:bg-blue-600 hover:bg-blue-50 active:text-white transition-all"
                                                    >
                                                        <span className="material-icons text-lg">remove</span>
                                                    </button>
                                                    <span className="w-12 text-center text-base font-extrabold text-blue-600">{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity + 1, item.variant)}
                                                        className="w-10 h-10 flex items-center justify-center active:bg-blue-600 hover:bg-blue-50 active:text-white transition-all"
                                                    >
                                                        <span className="material-icons text-lg">add</span>
                                                    </button>
                                                </div>
                                                <div className="flex items-center gap-6 text-sm font-bold uppercase">
                                                    <button onClick={() => moveToSavedForLater(item)} className="text-blue-600 hover:text-purple-600 transition-colors flex items-center gap-1">
                                                        <span className="material-icons text-base">bookmark</span>
                                                        Save for later
                                                    </button>
                                                    <button onClick={() => removeFromCart(item.id, item.variant)} className="text-red-500 hover:text-red-700 transition-colors flex items-center gap-1">
                                                        <span className="material-icons text-base">delete</span>
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {/* Desktop Place Order Button */}
                                    {cart.length > 0 && (
                                        <div className="hidden md:flex justify-end p-5 shadow-[0_-2px_10px_0_rgba(59,130,246,0.1)] sticky bottom-0 bg-gradient-to-r from-white to-blue-50">
                                            <button
                                                onClick={handleCheckout}
                                                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-12 py-4 rounded-lg font-bold text-base shadow-lg hover:shadow-xl transform hover:scale-105 transition-all uppercase tracking-wide"
                                            >
                                                Place Order
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Saved for Later */}
                                {savedForLater.length > 0 && (
                                    <div className="bg-white md:rounded-lg md:shadow-lg md:mt-4 border border-blue-100">
                                        <div className="px-5 py-4 border-b border-blue-100 bg-gradient-to-r from-white to-purple-50">
                                            <div className="flex items-center gap-2">
                                                <span className="material-icons text-purple-600">bookmark</span>
                                                <h3 className="text-base font-extrabold text-gray-800 uppercase">Saved for later ({savedForLater.length})</h3>
                                            </div>
                                        </div>
                                        {savedForLater.map((item) => (
                                            <div key={item.id} className="p-5 border-b border-blue-50 last:border-b-0 flex gap-4 opacity-80 hover:opacity-100 transition-all hover:bg-purple-50/50">
                                                <div className="w-24 h-28 flex-shrink-0 bg-gradient-to-br from-gray-50 to-purple-50 rounded-lg border-2 border-purple-100 p-2 grayscale hover:grayscale-0 transition-all">
                                                    <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                                                </div>
                                                <div className="flex-1">
                                                    <h2 className="text-base font-bold text-gray-700 line-clamp-2 hover:text-purple-600 cursor-pointer transition-colors" onClick={() => navigate(`/product/${item.id}`)}>{item.name}</h2>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <span className="text-xl font-extrabold text-gray-700">₹{item.price.toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex items-center gap-6 mt-4 text-sm font-bold uppercase">
                                                        <button onClick={() => moveToCart(item)} className="text-blue-600 hover:text-purple-600 transition-colors flex items-center gap-1">
                                                            <span className="material-icons text-base">add_shopping_cart</span>
                                                            Move to Cart
                                                        </button>
                                                        <button onClick={() => removeFromSavedForLater(item.id)} className="text-red-500 hover:text-red-700 transition-colors flex items-center gap-1">
                                                            <span className="material-icons text-base">delete</span>
                                                            Remove
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Mobile Price Summary */}
                                <div className="md:hidden mt-4">
                                    {cart.length > 0 && (
                                        <div className="bg-white py-5 mb-4 border-t border-b border-blue-100 md:border-t-0 md:border-b-0 md:rounded-lg md:shadow-lg">
                                            <h3 className="text-gray-700 font-extrabold uppercase text-sm mb-4 border-b border-blue-100 pb-3 px-5 flex items-center gap-2">
                                                <span className="material-icons text-blue-600">receipt_long</span>
                                                Price Details
                                            </h3>
                                            <div className="space-y-3 text-base px-5 font-medium">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-700">Price ({cart.length} items)</span>
                                                    <span className="font-bold text-gray-800">₹{originalPrice.toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-700">Discount</span>
                                                    <span className="font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">- ₹{savings.toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-700">Delivery Charges</span>
                                                    <span className={delivery === 0 ? "font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent" : "font-bold text-gray-800"}>{delivery === 0 ? "FREE" : `₹${delivery}`}</span>
                                                </div>
                                                <div className="flex justify-between font-extrabold text-xl border-t border-dashed border-blue-200 pt-4 mt-4">
                                                    <span className="text-gray-800">Total Amount</span>
                                                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">₹{(price + delivery).toLocaleString()}</span>
                                                </div>
                                            </div>
                                            <div className="mt-5 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 mx-5">
                                                <div className="flex items-center gap-2">
                                                    <span className="material-icons text-green-600">savings</span>
                                                    <span className="font-bold text-green-700 text-base">You will save ₹{savings.toLocaleString()} on this order</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                            </div>

                            {/* RIGHT COLUMN (Desktop Sidebar) */}
                            <div className="hidden md:block w-[320px] lg:w-[360px] shrink-0">
                                <div className="sticky top-20 space-y-4">
                                    {/* Price Summary */}
                                    {cart.length > 0 && (
                                        <div className="bg-white p-5 rounded-lg shadow-lg border-2 border-blue-100">
                                            <h3 className="text-gray-700 font-extrabold uppercase text-sm mb-4 border-b border-blue-100 pb-3 flex items-center gap-2">
                                                <span className="material-icons text-blue-600">receipt_long</span>
                                                Price Details
                                            </h3>
                                            <div className="space-y-3 text-base font-medium">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-700">Price ({cart.length} items)</span>
                                                    <span className="font-bold text-gray-800">₹{originalPrice.toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-700">Discount</span>
                                                    <span className="font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">- ₹{savings.toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-700">Delivery Charges</span>
                                                    <span className={delivery === 0 ? "font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent" : "font-bold text-gray-800"}>{delivery === 0 ? "FREE" : `₹${delivery}`}</span>
                                                </div>
                                                <div className="flex justify-between font-extrabold text-xl border-t border-dashed border-blue-200 pt-4 mt-4">
                                                    <span className="text-gray-800">Total Amount</span>
                                                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">₹{(price + delivery).toLocaleString()}</span>
                                                </div>
                                            </div>
                                            <div className="mt-5 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="material-icons text-green-600">savings</span>
                                                    <span className="font-bold text-green-700 text-sm">You will save ₹{savings.toLocaleString()} on this order</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Safe Payment Badge */}
                                    <div className="flex items-center gap-3 p-4 text-sm text-gray-600 font-semibold bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                                        <span className="material-icons text-blue-600 text-2xl">gpp_good</span>
                                        <p>Safe and Secure Payments. 100% Authentic products.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Similar Products */}
                        <div className="pb-10 px-4 md:px-0 mt-6 w-full">
                            <ProductSection
                                title="You might be interested in"
                                products={products.slice(0, 6)}
                                containerClass="mt-2 w-full"
                                onViewAll={() => navigate('/category/You might be interested in')}
                            />
                        </div>
                    </>
                )
                }
            </div>

            {/* Bottom Actions - MOBILE ONLY */}
            {
                cart.length > 0 && (
                    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-gradient-to-r from-white to-blue-50 border-t-2 border-blue-200 px-4 py-4 flex items-center justify-between z-[100] shadow-[0_-6px_20px_rgba(59,130,246,0.2)]">
                        <div className="flex flex-col">
                            <span className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">₹{(price + delivery).toLocaleString()}</span>
                            <span className="text-xs text-blue-600 font-bold cursor-pointer hover:underline" onClick={() => document.getElementById('price-details')?.scrollIntoView({ behavior: 'smooth' })}>View price details</span>
                        </div>
                        <button
                            onClick={handleCheckout}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3.5 rounded-lg font-bold text-base shadow-lg hover:shadow-xl transform hover:scale-105 transition-all w-1/2 ml-4"
                        >
                            Place Order
                        </button>
                    </div>
                )
            }
        </div >
    );
};


export default Cart;
