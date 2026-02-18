import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import ProductSection from '../components/home/ProductSection';
import { useAuthStore } from '../store/authStore';
import { useProduct, useProducts } from '../../../hooks/useData';
import { useGoogleTranslation } from '../../../hooks/useGoogleTranslation';
import API from '../../../services/api';
import toast from 'react-hot-toast';
import { confirmToast } from '../../../utils/toastUtils.jsx';
import './ProductDetails.css';

const ProductSkeleton = () => {
    return (
        <div className="bg-white min-h-screen pb-24 font-sans animate-pulse px-4 md:px-0">
            {/* Desktop Skeleton */}
            <div className="hidden md:block max-w-[1600px] mx-auto p-6">
                <div className="flex items-center gap-2 mb-6">
                    <div className="h-3 w-12 bg-gray-100 rounded"></div>
                    <div className="h-3 w-4 bg-gray-50 rounded"></div>
                    <div className="h-3 w-20 bg-gray-100 rounded"></div>
                    <div className="h-3 w-4 bg-gray-50 rounded"></div>
                    <div className="h-3 w-32 bg-gray-100 rounded"></div>
                </div>
                <div className="flex gap-10">
                    <div className="w-[40%] flex gap-4">
                        <div className="flex flex-col gap-3 w-16">
                            {[1, 2, 3, 4, 5].map(i => <div key={i} className="w-16 h-16 bg-gray-100 rounded-lg"></div>)}
                        </div>
                        <div className="flex-1 h-[450px] bg-gray-100 rounded-xl"></div>
                    </div>
                    <div className="flex-1 space-y-6">
                        <div className="space-y-2">
                            <div className="h-3 w-24 bg-gray-100 rounded"></div>
                            <div className="h-8 w-3/4 bg-gray-100 rounded"></div>
                            <div className="h-4 w-full bg-gray-50 rounded"></div>
                            <div className="h-4 w-5/6 bg-gray-50 rounded"></div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="h-6 w-16 bg-gray-100 rounded"></div>
                            <div className="h-4 w-32 bg-gray-50 rounded"></div>
                        </div>
                        <div className="space-y-2">
                            <div className="h-4 w-20 bg-gray-100 rounded"></div>
                            <div className="h-10 w-40 bg-gray-100 rounded"></div>
                        </div>
                        <div className="flex gap-4 pt-4">
                            <div className="h-14 flex-1 bg-gray-100 rounded-sm"></div>
                            <div className="h-14 flex-1 bg-gray-100 rounded-sm"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Skeleton */}
            <div className="md:hidden">
                <div className="w-full aspect-[3/2] bg-gray-100"></div>
                <div className="px-4 py-6 space-y-6">
                    <div className="space-y-2">
                        <div className="h-4 w-1/4 bg-gray-100 rounded"></div>
                        <div className="h-6 w-full bg-gray-100 rounded"></div>
                        <div className="h-4 w-3/4 bg-gray-50 rounded"></div>
                    </div>
                    <div className="h-10 w-1/3 bg-gray-100 rounded"></div>
                    <div className="space-y-3">
                        <div className="h-4 w-1/2 bg-gray-100 rounded"></div>
                        <div className="flex gap-3">
                            {[1, 2, 3, 4].map(i => <div key={i} className="w-16 h-20 bg-gray-100 rounded-xl"></div>)}
                        </div>
                    </div>
                </div>
                {/* Sticky Footer Skeleton */}
                <div className="fixed bottom-0 left-0 right-0 bg-white p-2 flex gap-2 border-t border-gray-100">
                    <div className="h-12 flex-1 bg-gray-100 rounded-sm"></div>
                    <div className="h-12 flex-1 bg-gray-100 rounded-sm"></div>
                </div>
            </div>
        </div>
    );
};

const TranslatedText = ({ text }) => {
    const translated = useGoogleTranslation(text);
    return <>{translated}</>;
};

const ProductDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuthStore();
    const { addToCart, wishlist, toggleWishlist, addresses } = useCartStore();

    // Fetch individual product
    const { product, loading } = useProduct(id);

    // Translation Hooks
    const translatedName = useGoogleTranslation(product?.name);
    // Static Text Translations
    const homeText = useGoogleTranslation('Home');
    const addToCartText = useGoogleTranslation('Add to Cart');
    const outOfStockText = useGoogleTranslation('Out of Stock');
    const buyNowText = useGoogleTranslation('Buy Now');
    const checkText = useGoogleTranslation('Check');
    const freeText = useGoogleTranslation('Free');
    const deliverByText = useGoogleTranslation('Delivery by');
    const specialPriceText = useGoogleTranslation('Special Price');
    const availableOffersText = useGoogleTranslation('Available offers');
    const deliveryText = useGoogleTranslation('Delivery');
    const specificationsText = useGoogleTranslation('Specifications');
    const productDescriptionText = useGoogleTranslation('Product Description');
    const ratingsAndReviewsText = useGoogleTranslation('Ratings and reviews');
    const rateThisProductText = useGoogleTranslation('Rate this product');
    const ratingsText = useGoogleTranslation('Ratings');
    const reviewsText = useGoogleTranslation('Reviews');
    const offText = useGoogleTranslation('off');
    const notDeliverableText = useGoogleTranslation('Not deliverable in your area');
    const codNotAvailableText = useGoogleTranslation('COD Not Available');
    const cashOnDeliveryText = useGoogleTranslation('Cash on Delivery');
    const onlinePaymentOnlyText = useGoogleTranslation('Online payment only');
    const payAtDoorstepText = useGoogleTranslation('Pay at doorstep');
    const daysReturnText = useGoogleTranslation('-Day Return');
    const easyReturnsText = useGoogleTranslation('Easy returns');
    const warrantyDetailsText = useGoogleTranslation('Warranty details');
    const currentlyNotAvailableText = useGoogleTranslation('Currently not available at this location');
    const noReviewsText = useGoogleTranslation('No reviews yet. Be the first to review!');
    const shareExperienceText = useGoogleTranslation('Share your experience...');
    const highlightsText = useGoogleTranslation('Highlights');
    const viewAllReviewsText = useGoogleTranslation('View All Reviews');

    // Note: Complex descriptions might need more granular translation, 
    // but for now we'll translate the main name which is key.

    // Fetch all products for "Similar" and "High Rated" logic (could be optimized on backend)
    const { products, loading: productsLoading } = useProducts();

    const [similarProducts, setSimilarProducts] = useState([]);
    const [similarStyles, setSimilarStyles] = useState([]);
    const [highRatedProducts, setHighRatedProducts] = useState([]);
    const [showToast, setShowToast] = useState(false);

    // PIN Code State
    const [pincode, setPincode] = useState('');
    const [pincodeStatus, setPincodeStatus] = useState(null); // { message: '', isServiceable: bool, deliveryDate: '' }
    const [checkingPincode, setCheckingPincode] = useState(false);

    const handleCheckPincode = async (codeOverride = null) => {
        const codeToCheck = codeOverride || pincode;
        if (!codeToCheck || codeToCheck.length < 6) {
            if (!codeOverride) toast.error('Please enter a valid 6-digit PIN code');
            return;
        }
        setCheckingPincode(true);
        try {
            const { data } = await API.get(`/pincodes/check/${codeToCheck}`);
            if (data.isServiceable) {
                setPincodeStatus({
                    isServiceable: true,
                    message: data.message || `Delivered in ${data.deliveryTime} ${data.unit}`,

                    deliveryDate: data.deliveryTime + ' ' + data.unit,
                    isCOD: data.isCOD
                });
            } else {
                setPincodeStatus({
                    isServiceable: false,
                    message: data.message || 'Not deliverable to this location',
                    deliveryDate: null
                });
                if (!codeOverride) toast.error(data.message || 'Not deliverable to this location');
            }
        } catch (error) {
            console.error('Pincode Check Error:', error);
            setPincodeStatus({
                isServiceable: false,
                message: 'Area not serviceable',
                deliveryDate: null
            });
            if (!codeOverride) toast.error('Service not available in this area');
        } finally {
            setCheckingPincode(false);
        }
    };

    // Auto-check pincode if address exists
    useEffect(() => {
        if (addresses && addresses.length > 0 && !pincode && !pincodeStatus) {
            const firstAddr = addresses[0];
            if (firstAddr.pincode) {
                setPincode(firstAddr.pincode);
                handleCheckPincode(firstAddr.pincode);
            }
        }
    }, [addresses, product]);

    const isInWishlist = product && wishlist.find(item => item.id === product.id);

    const [selectedVariants, setSelectedVariants] = useState({});

    const displayVariantHeadings = React.useMemo(() => {
        if (!product) return [];
        if (product.variantHeadings && product.variantHeadings.length > 0) return product.variantHeadings;

        const fallback = [];
        if (product.colors && product.colors.length > 0) {
            fallback.push({
                id: 'color-fallback',
                name: 'Color',
                hasImage: true,
                options: product.colors.map(c => typeof c === 'string' ? { name: c, image: '' } : c)
            });
        }
        if (product.sizes && product.sizes.length > 0) {
            fallback.push({
                id: 'size-fallback',
                name: product.variantLabel || 'Size',
                hasImage: false,
                options: product.sizes.map(s => typeof s === 'string' ? { name: s } : s)
            });
        }
        return fallback;
    }, [product]);

    useEffect(() => {
        if (product && displayVariantHeadings.length > 0) {
            const initial = {};
            displayVariantHeadings.forEach(vh => {
                if (vh.options && vh.options.length > 0) {
                    initial[vh.name] = vh.options[0].name;
                }
            });
            setSelectedVariants(initial);
        }
    }, [product, displayVariantHeadings]);

    const currentStock = React.useMemo(() => {
        if (!product) return 0;

        if (displayVariantHeadings.length > 0 && product.skus && product.skus.length > 0) {
            const matchingSku = product.skus.find(sku => {
                // Every selected variant must match the SKU combination
                return displayVariantHeadings.every(vh =>
                    sku.combination[vh.name] === selectedVariants[vh.name]
                );
            });
            return matchingSku ? matchingSku.stock : 0;
        }

        return product.stock || 0;
    }, [product, selectedVariants, displayVariantHeadings]);

    const productImages = React.useMemo(() => {
        if (!product) return [];

        const baseImages = [
            product.image,
            ...(Array.isArray(product.images) ? product.images : [])
        ];

        // Add ONLY the images of currently selected variants
        const variantImages = [];
        displayVariantHeadings.forEach(vh => {
            if (vh.hasImage && vh.options) {
                // Find the image for the currently selected option in this category
                const selectedOpt = vh.options.find(opt => opt.name === selectedVariants[vh.name]);
                if (selectedOpt) {
                    if (selectedOpt.image) variantImages.push(selectedOpt.image);
                    if (Array.isArray(selectedOpt.images)) {
                        variantImages.push(...selectedOpt.images);
                    }
                }
            }
        });

        // Combine base images and selected variant images, unique and filtered
        return Array.from(new Set([...baseImages, ...variantImages])).filter(Boolean);
    }, [product, displayVariantHeadings, selectedVariants]);

    const handleVariantSelect = (vhName, optName, optImage, optImages) => {
        setSelectedVariants(prev => ({ ...prev, [vhName]: optName }));

        // When a variant with images is selected, we want to jump to the first one.
        if (optImage || (Array.isArray(optImages) && optImages.length > 0)) {
            // Find where these images start in the recomputed productImages list.
            // They always appear after baseImages.
            const baseImagesCount = [product.image, ...(Array.isArray(product.images) ? product.images : [])].filter(Boolean).length;
            setCurrentImageIndex(baseImagesCount);
        }
    };

    const handleAddToCart = () => {
        if (!isAuthenticated) {
            toast.error('Please login first to add items to cart');
            navigate('/login', { state: { from: window.location.pathname } });
            return;
        }
        addToCart(product, selectedVariants);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    const handleBuyNow = () => {
        if (!isAuthenticated) {
            toast.error('Please login first to buy items');
            navigate('/login', { state: { from: window.location.pathname } });
            return;
        }
        if (addresses.length === 0) {
            confirmToast({
                message: '📍 Please add a delivery address before purchase.\n\nWould you like to add one now?',
                confirmText: 'Add Address',
                icon: 'add_location_alt',
                onConfirm: () => navigate('/addresses')
            });
            return;
        }
        // Instead of adding to cart, pass item directly to checkout via state
        navigate('/checkout', {
            state: {
                buyNowItem: {
                    ...product,
                    variant: selectedVariants,
                    quantity: 1
                }
            }
        });
    };

    const handleShare = async () => {
        const shareData = {
            title: product?.name || 'Product Details',
            text: `Check out this ${product?.name} on Indian Kart!`,
            url: window.location.href,
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.error('Error sharing:', err);
            }
        } else {
            // Fallback: Copy to clipboard
            try {
                await navigator.clipboard.writeText(window.location.href);
                toast.success('Link copied to clipboard!');
            } catch (err) {
                console.error('Error copying to clipboard:', err);
                toast.error('Failed to copy link');
            }
        }
    };
    const [reviews, setReviews] = useState([]);
    const [questions, setQuestions] = useState([
        { id: 1, q: 'Is this skin friendly?', a: 'Yes, it is anti-allergic and safe for all skin types.', user: 'Sonal M.' }
    ]);

    // Fetch Reviews from backend
    useEffect(() => {
        const fetchReviews = async () => {
            if (!id) return;
            try {
                const { data } = await API.get(`/reviews/product/${id}`);
                setReviews(data);
            } catch (err) {
                console.error("Error fetching reviews:", err);
            }
        };
        fetchReviews();
    }, [id]);

    // Derived State for Ratings
    const totalRatings = reviews.length;
    const averageRating = totalRatings > 0
        ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / totalRatings).toFixed(1)
        : (product?.rating || 0);

    const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
    const [submittingReview, setSubmittingReview] = useState(false);
    const [newQuestion, setNewQuestion] = useState('');

    const [expandedSections, setExpandedSections] = useState({
        highlights: false,
        allDetails: false,
        reviews: false,
        questions: false,
        specifications: false,
        description: false
    });
    const [selectedDetailTab, setSelectedDetailTab] = useState('Manufacturer');
    const [showFullDescription, setShowFullDescription] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [bankOffers, setBankOffers] = useState([]);

    useEffect(() => {
        if (id) {
            const fetchBankOffers = async () => {
                try {
                    const { data } = await API.get(`/bank-offers/product/${id}`);
                    setBankOffers(data);
                } catch (error) {
                    console.error('Error fetching bank offers', error);
                }
            };
            fetchBankOffers();
        }
    }, [id]);

    const offers = [
        ...bankOffers.map(offer => ({
            type: `${offer.bankName} Offer`,
            text: `${offer.offerName} - Get ${offer.discountType === 'flat' ? 'Flat ₹' + offer.discountValue : offer.discountValue + '%'} Off. ${offer.description || ''}`
        }))
    ];



    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    useEffect(() => {
        window.scrollTo(0, 0);
        if (product && products.length > 0) {
            // Find similar products by Category
            const similar = products.filter(p => p.category === product.category && p.id !== product.id);
            setSimilarProducts(similar);

            // Find similar products by Sub-Category (Styles)
            if (product.subCategories && product.subCategories.length > 0) {
                const subIds = product.subCategories.map(s => s._id || s.id);
                const styles = products.filter(p => {
                    if (p.id === product.id) return false;
                    if (!p.subCategories || p.subCategories.length === 0) return false;
                    return p.subCategories.some(s => subIds.includes(s._id || s.id));
                });
                setSimilarStyles(styles);
            } else {
                setSimilarStyles([]);
            }

            // Find high rated products in same category
            const highRated = products.filter(p => p.category === product.category && p.rating >= 4.0 && p.id !== product.id).slice(0, 6);
            setHighRatedProducts(highRated);
        }
    }, [product, products]);

    if (loading || !product) return <ProductSkeleton />;

    const discountPercentage = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);

    return (
        <div className="bg-white min-h-screen pb-24 font-sans text-gray-900">

            {/* ============================================================== */}
            {/* DESKTOP VIEW (Visible only on md+)                           */}
            {/* ============================================================== */}
            <div className="hidden md:block max-w-[1600px] mx-auto p-6 animate-in fade-in duration-500">
                {/* Breadcrumbs */}
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-6 font-medium">
                    <span className="hover:text-blue-600 cursor-pointer transition-colors" onClick={() => navigate('/')}>
                        <TranslatedText text={homeText} />
                    </span>
                    <span className="material-icons text-[12px] text-gray-400">chevron_right</span>
                    <span className="hover:text-blue-600 cursor-pointer transition-colors" onClick={() => navigate(`/search?category=${product.category}`)}>
                        <TranslatedText text={product.category} />
                    </span>
                    {product.subCategories && product.subCategories.length > 0 && (
                        <>
                            <span className="material-icons text-[12px] text-gray-400">chevron_right</span>
                            <span className="hover:text-blue-600 cursor-pointer transition-colors" onClick={() => navigate(`/search?subcategory=${product.subCategories[0].name}`)}>
                                <TranslatedText text={product.subCategories[0].name} />
                            </span>
                        </>
                    )}
                    <span className="material-icons text-[12px] text-gray-400">chevron_right</span>
                    <span className="text-gray-800 font-bold truncate max-w-[600px]">{translatedName}</span>
                </div>

                <div className="flex gap-10 items-start">
                    {/* LEFT COLUMN: Gallery & Buttons */}
                    <div className="w-[40%] flex-shrink-0 sticky top-[110px] self-start">
                        <div className="flex gap-4">
                            {/* Thumbnails Strip */}
                            {productImages.length > 1 && (
                                <div className="flex flex-col gap-3 h-[450px] overflow-y-auto no-scrollbar w-16 flex-shrink-0">
                                    {productImages.map((img, idx) => (
                                        <div
                                            key={idx}
                                            onMouseEnter={() => setCurrentImageIndex(idx)}
                                            className={`w-16 h-16 border-2 rounded-lg p-1 cursor-pointer transition-all ${currentImageIndex === idx ? 'border-blue-600' : 'border-gray-200 hover:border-blue-400'}`}
                                        >
                                            <img src={img || null} alt="" className="w-full h-full object-contain" />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Main Image */}
                            <div className="flex-1 h-[450px] border border-gray-100 rounded-xl flex items-center justify-center p-4 relative group bg-white shadow-sm hover:shadow-md transition-shadow">
                                {productImages.length > 0 ? (
                                    <img
                                        src={(productImages[currentImageIndex] || productImages[0]) || null}
                                        alt={product.name}
                                        className="w-full h-full object-contain transform group-hover:scale-105 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-400">
                                        <span className="material-icons text-6xl">image_not_supported</span>
                                    </div>
                                )}
                                <button onClick={() => toggleWishlist(product)} className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full shadow-md border border-gray-100 flex items-center justify-center hover:scale-110 transition-transform text-gray-400 hover:text-red-500 group/fav">
                                    <span className={`material-icons ${isInWishlist ? 'text-red-500' : ''}`}>favorite</span>
                                </button>
                                <button onClick={handleShare} className="absolute top-16 right-4 w-10 h-10 bg-white rounded-full shadow-md border border-gray-100 flex items-center justify-center hover:scale-110 transition-transform text-gray-400 hover:text-blue-500">
                                    <span className="material-icons">share</span>
                                </button>
                            </div>
                        </div>

                        {/* Desktop Action Buttons */}
                        <div className="flex gap-4 mt-6">
                            {pincodeStatus?.isServiceable === false ? (
                                <div className="flex-1 bg-red-50 border border-red-100 p-4 rounded-sm text-center">
                                    <p className="text-red-600 font-bold uppercase tracking-tight text-sm flex items-center justify-center gap-2">
                                        <span className="material-icons text-red-500 text-[18px]">location_off</span>
                                        {notDeliverableText}
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <button
                                        onClick={handleAddToCart}
                                        disabled={currentStock <= 0}
                                        className={`flex-1 font-bold py-4 rounded-sm shadow-sm active:scale-[0.98] transition-all text-base uppercase tracking-wide flex items-center justify-center gap-2 ${currentStock > 0
                                            ? 'bg-[#ff9f00] text-white hover:bg-[#f39801]'
                                            : 'bg-gray-200 text-gray-500 cursor-not-allowed shadow-none'
                                            }`}
                                    >
                                        <span className="material-icons text-[20px]">{currentStock > 0 ? 'shopping_cart' : 'info'}</span>
                                        {currentStock > 0 ? addToCartText : outOfStockText}
                                    </button>
                                    <button
                                        onClick={handleBuyNow}
                                        disabled={currentStock <= 0}
                                        className={`flex-1 font-bold py-4 rounded-sm shadow-sm active:scale-[0.98] transition-all text-base uppercase tracking-wide flex items-center justify-center gap-2 ${currentStock > 0
                                            ? 'bg-[#fb641b] text-white hover:bg-[#e85d19]'
                                            : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                                            }`}
                                    >
                                        <span className="material-icons text-[20px]">{currentStock > 0 ? 'flash_on' : 'remove_shopping_cart'}</span>
                                        {currentStock > 0 ? buyNowText : outOfStockText}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Info & Details */}
                    <div className="flex-1 min-w-0">
                        <div className="mb-2">
                            <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mb-1 hover:text-blue-600 cursor-pointer w-fit">{product.brand || "Brand Name"}</p>
                            <h1 className="text-2xl font-medium text-gray-900 leading-snug hover:text-blue-600 cursor-pointer transition-colors inline-block">
                                {translatedName}
                                {displayVariantHeadings.length > 0 && (
                                    <span className="text-gray-500 ml-1">
                                        ({displayVariantHeadings.map((vh, i) => (
                                            <React.Fragment key={vh.id}>
                                                <TranslatedText text={selectedVariants[vh.name]} />
                                                {i < displayVariantHeadings.length - 1 ? ', ' : ''}
                                            </React.Fragment>
                                        ))})
                                    </span>
                                )}
                            </h1>
                        </div>

                        <div className="flex items-center gap-3 mb-4">
                            <span className="bg-[#388e3c] text-white text-sm font-bold px-2 py-0.5 rounded flex items-center gap-1 cursor-pointer">
                                {averageRating} <span className="material-icons !text-[18px]">star</span>
                            </span>
                            <span className="text-gray-500 text-sm font-medium">{totalRatings.toLocaleString()} {ratingsText} & {totalRatings.toLocaleString()} {reviewsText}</span>
                        </div>

                        <p className="text-green-600 text-sm font-bold mb-1">{specialPriceText}</p>
                        <div className="flex items-baseline gap-3 mb-4">
                            <span className="text-3xl font-medium text-gray-900">₹{product.price.toLocaleString()}</span>
                            <span className="text-gray-500 line-through text-base">₹{product.originalPrice.toLocaleString()}</span>
                            <span className="text-green-600 font-bold text-base">{discountPercentage}% {offText}</span>
                        </div>

                        {/* Dynamic Variants Desktop */}
                        {displayVariantHeadings.length > 0 && (
                            <div className="space-y-6 mb-8 mt-6">
                                {displayVariantHeadings.map((vh) => (
                                    <div key={vh.id} className="flex gap-4">
                                        <span className="text-gray-500 font-medium text-sm w-20 pt-1 uppercase tracking-wider text-[11px] font-bold"><TranslatedText text={vh.name} /></span>
                                        <div className="flex flex-wrap gap-2 max-w-[500px]">
                                            {vh.options?.map((opt, idx) => (
                                                vh.hasImage ? (
                                                    <div
                                                        key={idx}
                                                        onClick={() => handleVariantSelect(vh.name, opt.name, opt.image, opt.images)}
                                                        className={`w-14 h-16 rounded border-2 p-0.5 cursor-pointer transition-all hover:scale-105 ${selectedVariants[vh.name] === opt.name ? 'border-blue-600' : 'border-transparent'}`}
                                                    >
                                                        <img
                                                            src={opt.image || (opt.images && opt.images[0])}
                                                            alt={opt.name}
                                                            className="w-full h-full object-cover rounded-[2px]"
                                                        />
                                                    </div>
                                                ) : (
                                                    <button
                                                        key={idx}
                                                        onClick={() => handleVariantSelect(vh.name, opt.name)}
                                                        className={`min-w-[50px] h-10 px-4 rounded-sm border-2 font-bold text-sm transition-all ${selectedVariants[vh.name] === opt.name
                                                            ? 'border-blue-600 text-blue-600 bg-blue-50/20'
                                                            : 'border-gray-200 text-gray-900 hover:border-blue-400'
                                                            }`}
                                                    >
                                                        <TranslatedText text={opt.name} />
                                                    </button>
                                                )
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Offers - Desktop */}
                        <div className="mb-6 space-y-2">
                            <p className="text-sm font-bold text-gray-900 mb-2">{availableOffersText}</p>
                            {offers.map((offer, idx) => (
                                <div key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                                    <span className="material-icons text-[#388e3c] text-[16px] mt-0.5">local_offer</span>
                                    <div>
                                        <span className="font-bold text-gray-800">{offer.type}</span>
                                        <span className="ml-1">{offer.text}</span>
                                        <span className="text-blue-600 font-medium cursor-pointer ml-1">T&C</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Delivery & Seller - Desktop */}
                        <div className="flex gap-16 mb-6">
                            {/* Delivery */}
                            <div className="flex gap-4">
                                <span className="text-gray-500 font-medium text-sm w-12 pt-1">{deliveryText}</span>
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2 border-b-2 border-blue-600 pb-0.5 max-w-[200px]">
                                        <span className="material-icons text-[18px] text-gray-400">location_on</span>
                                        <input
                                            type="text"
                                            value={pincode}
                                            onChange={(e) => setPincode(e.target.value)}
                                            placeholder="Enter Pincode"
                                            maxLength={6}
                                            className="font-bold text-gray-900 text-sm outline-none w-full placeholder:text-gray-400"
                                        />
                                        <button
                                            onClick={() => handleCheckPincode()}
                                            disabled={checkingPincode}
                                            className="text-blue-600 text-[11px] font-bold uppercase whitespace-nowrap hover:text-blue-700 disabled:opacity-50"
                                        >
                                            {checkingPincode ? '...' : checkText}
                                        </button>
                                    </div>
                                    <div className="text-sm">
                                        <span className={`font-bold ${pincodeStatus ? (pincodeStatus.isServiceable ? 'text-gray-900' : 'text-red-600') : 'text-gray-500'}`}>
                                            {pincodeStatus ? pincodeStatus.message : `Delivery by ${product.deliveryDate || '7 days'}`}
                                        </span>
                                        {pincodeStatus?.isServiceable && (
                                            <>
                                                <span className="text-gray-400 mx-1">|</span>
                                                <span className="text-green-600 font-bold">{freeText}</span>
                                                <span className="text-gray-400 line-through text-xs ml-1">₹40</span>
                                            </>
                                        )}
                                    </div>
                                    {!pincodeStatus?.isServiceable && pincodeStatus && (
                                        <p className="text-xs text-red-500 font-medium">
                                            {currentlyNotAvailableText}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>



                        {/* Services - Desktop */}
                        <div className="flex gap-8 mb-8 mt-2">
                            {product.returnPolicy && (
                                <div className="flex items-center gap-4 group cursor-pointer">
                                    <div className="w-12 h-12 rounded-xl bg-[#f5f5f5] flex items-center justify-center text-gray-800 transition-colors group-hover:bg-blue-50">
                                        <span className="material-icons-outlined text-[24px] group-hover:text-blue-600">autorenew</span>
                                    </div>
                                    <div className="text-gray-800">
                                        <span className="text-[14px] font-bold leading-tight block">{product.returnPolicy.days}{daysReturnText}</span>
                                        <span className="text-xs text-gray-500">{easyReturnsText}</span>
                                    </div>

                                </div>
                            )}



                            <div className="flex items-center gap-4 group cursor-pointer">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${pincodeStatus ? (pincodeStatus?.isCOD ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500') : 'bg-[#f5f5f5] text-gray-800 group-hover:bg-blue-50'}`}>
                                    <span className="material-icons-outlined text-[24px] group-hover:text-blue-600">
                                        {pincodeStatus ? (pincodeStatus.isCOD ? 'payments' : 'money_off') : 'payments'}
                                    </span>
                                </div>
                                <div className="text-gray-800">
                                    <span className={`text-[14px] font-bold leading-tight block ${pincodeStatus ? (pincodeStatus.isCOD ? 'text-green-700' : 'text-red-600') : ''}`}>
                                        {pincodeStatus ? (pincodeStatus.isCOD ? cashOnDeliveryText : codNotAvailableText) : cashOnDeliveryText}
                                    </span>
                                    <span className="text-xs text-gray-500 px-0.5">
                                        {pincodeStatus ? (pincodeStatus.isCOD ? payAtDoorstepText : onlinePaymentOnlyText) : payAtDoorstepText}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 group cursor-pointer">
                                <div className="w-12 h-12 rounded-xl bg-[#f5f5f5] flex items-center justify-center text-gray-800 transition-colors group-hover:bg-blue-50">
                                    <span className="material-icons-outlined text-[24px] group-hover:text-blue-600">verified_user</span>
                                </div>
                                <div className="text-gray-800">
                                    <span className="text-[14px] font-bold leading-tight block">{product.warranty?.summary || 'Brand Warranty'}</span>
                                    <span className="text-xs text-gray-500">{warrantyDetailsText}</span>
                                </div>
                            </div>
                        </div>


                        {/* Product Highlights - Two Column Grid */}
                        {product.highlights && product.highlights.length > 0 && (
                            <div className="grid grid-cols-2 gap-12 mb-6 mt-6">
                                {product.highlights.map((section, idx) => (
                                    <div key={idx}>
                                        <h3 className="text-gray-500 font-medium text-sm mb-3"><TranslatedText text={section.heading} /></h3>
                                        <ul className="space-y-2">
                                            {section.points.filter(p => p.trim()).map((point, pIdx) => (
                                                <li key={pIdx} className="flex items-start gap-2 text-sm text-gray-700">
                                                    <span className="text-gray-400 mt-1.5 text-xs">●</span>
                                                    <span className="flex-1"><TranslatedText text={point} /></span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        )}




                        {/* Product Description Section - Rich Zig-Zag Layout */}
                        {product.description && product.description.length > 0 && (
                            <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm mt-8 mb-8 space-y-8">
                                <h3 className="text-2xl font-bold text-gray-900 border-b border-gray-200 pb-4">{productDescriptionText}</h3>

                                {product.description.map((section, idx) => {
                                    const isEven = idx % 2 === 0;
                                    const hasImage = !!section.image;

                                    return (
                                        <div key={idx} className={`flex flex-col md:flex-row gap-8 items-center ${!isEven && hasImage ? 'md:flex-row-reverse' : ''}`}>

                                            <div className={`flex-1 space-y-4 ${hasImage ? '' : 'w-full'}`}>
                                                {section.heading && (
                                                    <h4 className="text-lg font-bold text-gray-900 leading-tight">
                                                        <TranslatedText text={section.heading} />
                                                    </h4>
                                                )}

                                                {section.content && (
                                                    <p className="text-amber-800 text-sm leading-relaxed whitespace-pre-line">
                                                        <TranslatedText text={section.content} />
                                                    </p>
                                                )}

                                                {section.points && section.points.length > 0 && section.points[0] !== '' && (
                                                    <ul className="space-y-2 mt-4">
                                                        {section.points.map((point, pIdx) => (
                                                            point && (
                                                                <li key={pIdx} className="flex items-start gap-3 text-sm text-gray-700">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 flex-shrink-0"></span>
                                                                    <span className="leading-relaxed"><TranslatedText text={point} /></span>
                                                                </li>
                                                            )
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>

                                            {/* Image Content */}
                                            {hasImage && (
                                                <div className="w-full md:w-auto md:max-w-[280px] flex-shrink-0">
                                                    <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-white">
                                                        <img
                                                            src={section.image}
                                                            alt={section.heading || 'Product Detail'}
                                                            className="w-full h-auto object-contain"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Specifications Section */}
                        {product.specifications && product.specifications.length > 0 && product.specifications[0].groupName && (
                            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mt-6">
                                <h3 className="text-2xl font-bold text-gray-900 border-b border-gray-200 pb-4 mb-6">{specificationsText}</h3>
                                <div className="space-y-6">
                                    {product.specifications.map((group, idx) => (
                                        group.groupName && (
                                            <div key={idx} className="border-b border-gray-100 pb-4 last:border-0">
                                                <h4 className="text-lg font-semibold text-gray-900 mb-3"><TranslatedText text={group.groupName} /></h4>
                                                <div className="space-y-2">
                                                    {group.specs && group.specs.map((spec, specIdx) => (
                                                        spec.key && spec.value && (
                                                            <div key={specIdx} className="flex items-start gap-4">
                                                                <span className="text-sm text-gray-500 min-w-[140px]"><TranslatedText text={spec.key} /></span>
                                                                <span className="text-sm text-gray-900 font-medium"><TranslatedText text={spec.value} /></span>
                                                            </div>
                                                        )
                                                    ))}
                                                </div>
                                            </div>
                                        )
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Ratings and Reviews Section - Desktop Right Column */}
                        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm mt-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-3">{ratingsAndReviewsText}</h3>

                            {/* Reviews List */}
                            <div className="space-y-4 mb-6">
                                {reviews.length > 0 ? (
                                    reviews.slice(0, 3).map(rev => (
                                        <div key={rev._id || rev.id} className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="bg-[#388e3c] text-white text-xs font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                                    {rev.rating} <span className="material-icons !text-[18px]">star</span>
                                                </div>
                                                <span className="text-[13px] font-bold text-gray-800 line-clamp-1">{rev.name || rev.user}</span>
                                            </div>
                                            <p className="text-[13px] text-gray-600 mb-1 leading-relaxed">{rev.comment}</p>
                                            <span className="text-[10px] text-gray-400 font-medium lowercase">
                                                {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : (rev.date || 'Recently')}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-500 italic pb-2">{noReviewsText}</p>
                                )}
                            </div>

                            {/* Post Review Form - Compact */}
                            <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-3">{rateThisProductText}</h4>
                                <div className="flex gap-1.5 mb-4">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <button
                                            key={star}
                                            onClick={() => setNewReview(prev => ({ ...prev, rating: star }))}
                                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${newReview.rating >= star
                                                ? 'bg-[#388e3c] text-white shadow-sm'
                                                : 'bg-white text-gray-300 border border-gray-100'
                                                }`}
                                        >
                                            <span className="material-icons text-[18px]">star</span>
                                        </button>
                                    ))}
                                </div>
                                <textarea
                                    placeholder={shareExperienceText}
                                    value={newReview.comment}
                                    onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                                    className="w-full bg-white border border-gray-100 rounded-xl p-3 text-xs focus:ring-2 focus:ring-green-100 outline-none resize-none min-h-[70px] mb-3 shadow-inner"
                                />
                                <button
                                    onClick={async () => {
                                        if (!newReview.comment) return;
                                        setSubmittingReview(true);
                                        try {
                                            await API.post('/reviews', {
                                                productId: id,
                                                rating: newReview.rating,
                                                comment: newReview.comment
                                            });
                                            setNewReview({ rating: 5, comment: '' });
                                            toast.success("Your review has been submitted for approval!");
                                        } catch (err) {
                                            console.error("Error posting review:", err);
                                            toast.error(err.response?.data?.message || "Failed to post review. Please login.");
                                        } finally {
                                            setSubmittingReview(false);
                                        }
                                    }}
                                    disabled={submittingReview}
                                    className={`w-full bg-[#1084ea] text-white font-bold h-12 flex items-center justify-center rounded-xl text-xs active:scale-95 transition-all shadow-sm ${submittingReview ? 'opacity-50' : ''}`}
                                >
                                    {submittingReview ? 'Submitting...' : 'Post Review'}
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            <div className="md:hidden pt-16">

                {/* Product Image Section - Single Image with Thumbnail Gallery */}
                <div className="bg-white">
                    {/* Main Image */}
                    <div className="relative w-full aspect-square bg-white flex items-center justify-center p-0">
                        {/* Back Button - Mobile Only (Below Header) */}
                        <div className="absolute top-6 left-5 z-10 md:hidden">
                            <button
                                onClick={() => navigate(-1)}
                                className="w-8 h-8 flex items-center justify-center active:scale-90 transition-transform"
                            >
                                <span className="material-icons text-gray-700 text-[18px]">arrow_back</span>
                            </button>
                        </div>

                        <img
                            src={(productImages[currentImageIndex] || productImages[0]) || null}
                            alt={product.name}
                            className="w-full h-full object-contain"
                        />

                        {/* Icons - Top Right */}
                        <div className="absolute top-6 right-5 flex gap-2 z-10">
                            <button
                                onClick={() => toggleWishlist(product)}
                                className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full shadow-md flex items-center justify-center border border-gray-100/50"
                            >
                                <span className={`material-icons text-[18px] ${isInWishlist ? 'text-red-500' : 'text-gray-600'}`}>
                                    {isInWishlist ? 'favorite' : 'favorite_border'}
                                </span>
                            </button>
                            <button
                                onClick={handleShare}
                                className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full shadow-md flex items-center justify-center border border-gray-100/50"
                            >
                                <span className="material-icons-outlined text-gray-600 text-[20px]">share</span>
                            </button>
                        </div>
                    </div>

                    {/* Thumbnail Gallery */}
                    {productImages.length > 1 && (
                        <div className="px-4 pb-4">
                            <div className="flex gap-2 overflow-x-auto no-scrollbar">
                                {productImages.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentImageIndex(idx)}
                                        className={`flex-shrink-0 w-14 h-14 rounded border-2 p-0.5 transition-all ${currentImageIndex === idx
                                            ? 'border-blue-600'
                                            : 'border-gray-200'
                                            }`}
                                    >
                                        <img src={img || null} alt="" className="w-full h-full object-contain" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Product Info - Redesigned */}
                <div className="bg-white px-5 py-4">
                    {/* Brand */}
                    <div className="mb-2">
                        <span className="text-blue-600 text-[10px] font-black uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded">
                            {product.brand || 'Brand'}
                        </span>
                    </div>

                    {/* Product Name */}
                    <h1 className="text-gray-900 text-lg font-bold leading-snug mb-3">
                        {translatedName}
                    </h1>

                    {/* Rating */}
                    <div className="flex items-center gap-3 mb-4">
                        <div className="flex items-center gap-1 bg-green-600 text-white text-sm font-bold px-2 py-0.5 rounded shadow-sm">
                            {averageRating}
                            <span className="material-icons !text-[18px]">star</span>
                        </div>
                        <span className="text-gray-400 text-xs font-medium">
                            {totalRatings.toLocaleString()} {ratingsText} & {totalRatings.toLocaleString()} {reviewsText}
                        </span>
                    </div>

                    {/* Price */}
                    <div className="flex items-center gap-2 mb-4 bg-gray-50 p-2 rounded-xl border border-gray-100 w-fit">
                        <span className="text-xl font-black text-gray-900">₹{product.price.toLocaleString()}</span>
                        {product.originalPrice > product.price && (
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400 line-through">₹{product.originalPrice.toLocaleString()}</span>
                                <span className="text-xs text-green-600 font-black">
                                    {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% {offText}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Dynamic Variants Mobile */}
                    {displayVariantHeadings.length > 0 && (
                        <div className="space-y-6 pb-2">
                            {displayVariantHeadings.map((vh) => (
                                <div key={vh.id}>
                                    <p className="text-[11px] font-black text-gray-400 mb-3 uppercase tracking-widest">
                                        Select <TranslatedText text={vh.name} />: <span className="text-gray-900 normal-case ml-1"><TranslatedText text={selectedVariants[vh.name]} /></span>
                                    </p>
                                    <div className="flex flex-wrap gap-2.5">
                                        {vh.options?.map((opt, idx) => (
                                            vh.hasImage ? (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleVariantSelect(vh.name, opt.name, opt.image)}
                                                    className={`w-14 h-16 rounded-xl border-2 p-0.5 transition-all shadow-sm ${selectedVariants[vh.name] === opt.name
                                                        ? 'border-blue-600 bg-blue-50/50 scale-105 shadow-md'
                                                        : 'border-gray-100 bg-white hover:border-gray-200'
                                                        }`}
                                                >
                                                    <img src={opt.image} alt={opt.name} className="w-full h-full object-cover rounded-lg" />
                                                </button>
                                            ) : (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleVariantSelect(vh.name, opt.name)}
                                                    className={`h-11 px-5 rounded-xl border-2 font-bold text-xs transition-all shadow-sm ${selectedVariants[vh.name] === opt.name
                                                        ? 'border-blue-600 text-blue-600 bg-blue-50/50 scale-105 shadow-md'
                                                        : 'border-gray-100 bg-gray-50 text-gray-700 hover:border-gray-200'
                                                        }`}
                                                >
                                                    <TranslatedText text={opt.name} />
                                                </button>
                                            )
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Offers Section */}
                <div className="bg-white border-t-8 border-gray-100 px-4 py-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">{availableOffersText}</h3>
                    <div className="space-y-2">
                        {offers.slice(0, 4).map((offer, idx) => (
                            <div key={idx} className="flex gap-2 items-start text-xs text-gray-700">
                                <span className="material-icons text-green-600 text-[16px] mt-0.5 shrink-0">local_offer</span>
                                <div className="flex-1">
                                    <span className="font-semibold text-gray-900">{offer.type}</span>
                                    <span className="ml-1">{offer.text}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Delivery Details Section */}
                <div className="bg-white border-t-8 border-gray-100 px-4 py-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">{deliveryText}</h3>

                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        {/* Location Bar */}
                        <div className="flex items-center gap-2 mb-3">
                            <span className="material-icons-outlined text-gray-600 text-[18px]">location_on</span>
                            <div className="flex items-center gap-2 flex-1">
                                <input
                                    type="text"
                                    value={pincode}
                                    onChange={(e) => setPincode(e.target.value)}
                                    placeholder="Enter Pincode"
                                    maxLength={6}
                                    className="text-xs font-semibold text-gray-900 bg-transparent outline-none w-full placeholder:text-gray-400"
                                />
                                <button
                                    onClick={() => handleCheckPincode()}
                                    disabled={checkingPincode}
                                    className="text-xs font-bold text-blue-600 whitespace-nowrap disabled:opacity-50"
                                >
                                    {checkingPincode ? '...' : checkText}
                                </button>
                            </div>
                        </div>

                        {/* Delivery Status */}
                        <div className="flex items-center gap-2 text-xs">
                            <span className="material-icons-outlined text-gray-500 text-[18px]">local_shipping</span>
                            <span className={`font-semibold ${pincodeStatus ? (pincodeStatus.isServiceable ? 'text-gray-900' : 'text-red-600') : 'text-gray-700'}`}>
                                {pincodeStatus ? pincodeStatus.message : `Delivery by ${product.deliveryDate || '7 days'}`}
                            </span>
                        </div>

                        {pincodeStatus?.isServiceable && (
                            <div className="mt-2 text-xs text-green-600 font-medium">
                                {freeText}
                            </div>
                        )}
                    </div>
                </div>

                {/* Service Icons - Mobile */}
                <div className="bg-white border-t-8 border-gray-100 px-4 py-4">
                    <div className="flex justify-between">
                        {product.returnPolicy && (
                            <div className="flex flex-col items-center gap-2.5 w-1/3 group">
                                <div className="w-12 h-12 rounded-xl bg-[#f5f5f5] flex items-center justify-center text-gray-800">
                                    <span className="material-icons-outlined text-[24px]">autorenew</span>
                                </div>
                                <div className="flex items-center text-gray-800">
                                    <span className="text-[11px] font-bold text-center leading-tight">{product.returnPolicy.days}{daysReturnText}</span>
                                    <span className="material-icons text-[14px] text-gray-400 ml-0.5">chevron_right</span>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col items-center gap-2.5 w-1/3">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${pincodeStatus ? (pincodeStatus.isCOD ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500') : 'bg-[#f5f5f5] text-gray-800'}`}>
                                <span className="material-icons-outlined text-[24px]">
                                    {pincodeStatus ? (pincodeStatus.isCOD ? 'payments' : 'money_off') : 'payments'}
                                </span>
                            </div>
                            <div className="flex flex-col items-center text-gray-800">
                                <span className={`text-[11px] font-bold text-center leading-tight ${pincodeStatus ? (pincodeStatus.isCOD ? 'text-green-700' : 'text-red-600') : ''}`}>
                                    {pincodeStatus ? (pincodeStatus.isCOD ? cashOnDeliveryText : codNotAvailableText) : cashOnDeliveryText}
                                </span>
                                <span className="text-[9px] text-gray-500 mt-0.5 uppercase tracking-tighter">
                                    {pincodeStatus ? (pincodeStatus.isCOD ? payAtDoorstepText : onlinePaymentOnlyText) : payAtDoorstepText}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col items-center gap-2.5 w-1/3">
                            <div className="w-12 h-12 rounded-xl bg-[#f5f5f5] flex items-center justify-center text-gray-800">
                                <span className="material-icons-outlined text-[24px]">verified_user</span>
                            </div>
                            <div className="flex items-center text-gray-800">
                                <span className="text-[11px] font-bold text-center leading-tight">
                                    {product.warranty?.summary ? (
                                        <>
                                            {product.warranty.summary.split(' ').slice(0, 2).join(' ')}<br />
                                            {product.warranty.summary.split(' ').slice(2).join(' ') || warrantyDetailsText}
                                        </>
                                    ) : (
                                        <>{warrantyDetailsText}</>
                                    )}
                                </span>
                                <span className="material-icons text-[14px] text-gray-400 ml-0.5">chevron_right</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Description & Reviews */}
                <div className="mt-4 px-4 space-y-4">
                    {/* Highlights Section */}
                    {product.highlights && product.highlights.length > 0 && (
                        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                            <h3 className="text-[16px] font-bold text-gray-900 mb-4">{highlightsText}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                {Array.isArray(product.highlights) ? (
                                    product.highlights.map((section, idx) => {
                                        const validPoints = section.points?.filter(p => p && p.trim().length > 0) || [];
                                        if (!section.heading && validPoints.length === 0) return null;

                                        return (
                                            <div key={idx}>
                                                {section.heading && <h4 className="font-bold text-gray-800 text-sm mb-2"><TranslatedText text={section.heading} /></h4>}
                                                {validPoints.length > 0 && (
                                                    <ul className="list-disc pl-4 space-y-1">
                                                        {validPoints.map((point, pIdx) => (
                                                            <li key={pIdx} className="text-[13px] text-gray-700"><TranslatedText text={point} /></li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                        );
                                    })
                                ) : (
                                    /* Fallback for legacy string data */
                                    <div
                                        className="prose prose-sm max-w-none text-gray-700 text-[13px]"
                                        dangerouslySetInnerHTML={{ __html: product.highlights }}
                                    />
                                )}
                            </div>
                        </div>
                    )}

                    {/* Description Section */}
                    {product.description && product.description.length > 0 && (
                        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                            <div
                                className="p-3 flex items-center justify-between cursor-pointer"
                                onClick={() => toggleSection('description')}
                            >
                                <h3 className="text-[18px] font-bold text-gray-900">{productDescriptionText}</h3>
                                <span className={`material-icons transition-transform text-[20px] ${expandedSections.description ? 'rotate-180' : ''}`}>expand_more</span>
                            </div>

                            {expandedSections.description && (
                                <div className="p-3 pt-0 border-t border-gray-50 space-y-3 animate-in fade-in slide-in-from-top-2">
                                    {product.description.map((section, idx) => (
                                        <div key={idx} className="space-y-2">
                                            {section.heading && (
                                                <h4 className="text-[14px] font-bold text-gray-900 uppercase tracking-wide border-b border-gray-50 pb-1">
                                                    <TranslatedText text={section.heading} />
                                                </h4>
                                            )}
                                            <ul className="space-y-1">
                                                {section.points?.map((point, pointIdx) => (
                                                    point && (
                                                        <li key={pointIdx} className="flex items-start gap-2 text-[11px] text-gray-700">
                                                            <span className="text-blue-600 mt-1 flex-shrink-0 font-bold">•</span>
                                                            <span className="leading-relaxed font-medium"><TranslatedText text={point} /></span>
                                                        </li>
                                                    )
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Specifications Section - Mobile */}
                    {product.specifications && product.specifications.length > 0 && product.specifications[0].groupName && (
                        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                            <div
                                className="p-3 flex items-center justify-between cursor-pointer"
                                onClick={() => toggleSection('specifications')}
                            >
                                <h3 className="text-[18px] font-bold text-gray-900">{specificationsText}</h3>
                                <span className={`material-icons transition-transform text-[20px] ${expandedSections.specifications ? 'rotate-180' : ''}`}>expand_more</span>
                            </div>

                            {expandedSections.specifications && (
                                <div className="p-3 pt-0 border-t border-gray-50 space-y-4 animate-in fade-in slide-in-from-top-2">
                                    {product.specifications.map((group, idx) => (
                                        group.groupName && (
                                            <div key={idx} className="border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                                                <h4 className="text-[14px] font-bold text-gray-800 mb-1.5 uppercase tracking-wide"><TranslatedText text={group.groupName} /></h4>
                                                <div className="space-y-1.5">
                                                    {group.specs && group.specs.map((spec, specIdx) => (
                                                        spec.key && spec.value && (
                                                            <div key={specIdx} className="flex flex-col gap-0.5">
                                                                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold"><TranslatedText text={spec.key} /></span>
                                                                <span className="text-[11px] text-gray-900 font-medium leading-snug"><TranslatedText text={spec.value} /></span>
                                                            </div>
                                                        )
                                                    ))}
                                                </div>
                                            </div>
                                        )
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Ratings Section */}
                    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                        <div
                            className="p-5 flex items-center justify-between cursor-pointer"
                            onClick={() => toggleSection('reviews')}
                        >
                            <div>
                                <h3 className="text-[16px] font-bold text-gray-900">{ratingsAndReviewsText}</h3>
                                <p className="text-[12px] text-gray-500 mt-0.5">
                                    {reviews.length > 0 ? `${reviews.length} ${reviewsText}` : noReviewsText}
                                </p>
                            </div>
                            <span className={`material-icons transition-transform ${expandedSections.reviews ? 'rotate-180' : ''}`}>expand_more</span>
                        </div>

                        {expandedSections.reviews && (
                            <div className="p-5 pt-0 border-t border-gray-50 space-y-4 animate-in fade-in slide-in-from-top-2">
                                <div className="space-y-4 mb-6">
                                    {reviews.length > 0 ? (
                                        reviews.slice(0, 3).map(rev => (
                                            <div key={rev._id || rev.id} className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="bg-[#388e3c] text-white text-xs font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                                        {rev.rating} <span className="material-icons !text-[18px]">star</span>
                                                    </div>
                                                    <span className="text-[13px] font-bold text-gray-800 line-clamp-1">{rev.name || rev.user}</span>
                                                </div>
                                                <p className="text-[12px] text-gray-600 leading-relaxed">{rev.comment}</p>
                                                <span className="text-[10px] text-gray-400 font-medium lowercase block mt-1">
                                                    {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : (rev.date || 'Recently')}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-500 italic pb-2">{noReviewsText}</p>
                                    )}
                                </div>

                                {/* Post Review Form */}
                                <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                                    <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-3">{rateThisProductText}</h4>
                                    <div className="flex gap-1.5 mb-4">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <button
                                                key={star}
                                                onClick={() => setNewReview(prev => ({ ...prev, rating: star }))}
                                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${newReview.rating >= star
                                                    ? 'bg-[#388e3c] text-white shadow-sm'
                                                    : 'bg-white text-gray-300 border border-gray-100'
                                                    }`}
                                            >
                                                <span className="material-icons !text-[18px]">star</span>
                                            </button>
                                        ))}
                                    </div>
                                    <textarea
                                        placeholder={shareExperienceText}
                                        value={newReview.comment}
                                        onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                                        className="w-full bg-white border border-gray-100 rounded-xl p-3 text-xs focus:ring-2 focus:ring-green-100 outline-none resize-none min-h-[70px] mb-3 shadow-inner"
                                    />
                                    <button
                                        onClick={async () => {
                                            if (!newReview.comment) return;
                                            setSubmittingReview(true);
                                            try {
                                                await API.post('/reviews', {
                                                    productId: id,
                                                    rating: newReview.rating,
                                                    comment: newReview.comment
                                                });
                                                setNewReview({ rating: 5, comment: '' });
                                                toast.success("Your review has been submitted for approval!");
                                            } catch (err) {
                                                console.error("Error posting review:", err);
                                                toast.error(err.response?.data?.message || "Failed to post review. Please login.");
                                            } finally {
                                                setSubmittingReview(false);
                                            }
                                        }}
                                        disabled={submittingReview}
                                        className={`w-full bg-[#1084ea] text-white font-bold h-12 flex items-center justify-center rounded-xl text-xs active:scale-95 transition-all shadow-sm ${submittingReview ? 'opacity-50' : ''}`}
                                    >
                                        {submittingReview ? 'Submitting...' : 'Post Review'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Close Mobile Wrapper */}


            {/* Product Description Section - Above Similar Products */}


            {/* Similar Products Section - Added as requested */}
            {similarProducts.length > 0 && (
                <div className="md:max-w-[1600px] md:mx-auto md:px-6">
                    <ProductSection
                        title="Similar Products"
                        products={similarProducts}
                        loading={productsLoading}
                        containerClass="mt-4 pb-4 px-4 md:px-0"
                    />
                </div>
            )}

            <div className="md:max-w-[1600px] md:mx-auto md:px-6">
                {/* All Details Section - Tabbed Interface with Main Dropdown */}

                {/* Similar Styles Section */}
                {similarStyles.length > 0 && (
                    <div className="border-t border-gray-100 mt-4">
                        <ProductSection
                            title={`Similar ${product.subCategories?.[0]?.name || product.brand || ''} Styles`}
                            products={similarStyles}
                            loading={productsLoading}
                            containerClass="mt-2 pb-4 px-4 md:px-0"
                        />
                    </div>
                )}

                {/* Top Rated Section */}
                {highRatedProducts.length > 0 && (
                    <div className="border-t border-gray-100">
                        <ProductSection
                            title={`${product.category} rated 4 stars and above`}
                            products={highRatedProducts}
                            loading={productsLoading}
                            containerClass="mt-2 pb-8 px-4 md:px-0"
                        />
                    </div>
                )}





                {/* Recently Viewed Section */}
                <div className="border-t border-gray-100 mt-2">
                    <ProductSection
                        title="Recently Viewed"
                        products={products.slice(0, 6)}
                        loading={productsLoading}
                        containerClass="mt-2 pb-4 px-4 md:px-0"
                    />
                </div>

                {/* You may also like Section - Tighter padding */}
                <div className="border-t border-gray-100">
                    <ProductSection
                        title="You may also like"
                        titleBadge="AD"
                        products={products.slice(6, 12)}
                        loading={productsLoading}
                        containerClass="mt-2 pb-4 px-4 md:px-0"
                    />
                </div>
            </div>

            {/* Bottom Actions - Fixed Footer */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-2 flex gap-2 z-[100] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                {pincodeStatus?.isServiceable === false ? (
                    <div className="flex-1 bg-red-50 p-3 rounded-xl text-center">
                        <p className="text-red-600 font-bold uppercase tracking-tight text-xs flex items-center justify-center gap-2">
                            <span className="material-icons text-red-500 text-[16px]">location_off</span>
                            {notDeliverableText}
                        </p>
                    </div>
                ) : (
                    <>
                        <button
                            onClick={handleAddToCart}
                            disabled={currentStock <= 0}
                            className={`flex-1 font-bold py-3.5 rounded-xl text-sm active:scale-[0.98] transition-all ${currentStock > 0
                                ? 'bg-white border border-gray-300 text-gray-900 hover:bg-gray-50'
                                : 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                                }`}
                        >
                            {currentStock > 0 ? addToCartText : outOfStockText}
                        </button>
                        <button
                            onClick={handleBuyNow}
                            disabled={currentStock <= 0}
                            className={`flex-1 font-bold py-3.5 rounded-xl text-sm shadow-sm active:scale-[0.98] transition-all ${currentStock > 0
                                ? 'bg-[#ffc200] text-black hover:bg-[#ffb300]'
                                : 'bg-gray-100 text-gray-300 shadow-none cursor-not-allowed'
                                }`}
                        >
                            {currentStock > 0 ? buyNowText : outOfStockText}
                        </button>
                    </>
                )}
            </div>

            {/* Toast Notification */}
            {
                showToast && (
                    <div className="fixed bottom-24 left-4 right-4 bg-gray-900 text-white p-4 rounded-xl flex items-center justify-between z-[200] animate-in fade-in slide-in-from-bottom-4 duration-300 shadow-2xl">
                        <div className="flex items-center gap-3">
                            <span className="material-icons text-green-400">check_circle</span>
                            <span className="text-sm font-medium">Added to cart successfully</span>
                        </div>
                        <button
                            onClick={() => navigate('/cart')}
                            className="text-blue-400 font-bold text-sm uppercase"
                        >
                            Go to Cart
                        </button>
                    </div>
                )
            }
        </div>
    );
};

export default ProductDetails;
