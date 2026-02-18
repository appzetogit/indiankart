import React from 'react';
import { useNavigate } from 'react-router-dom';

import { useGoogleTranslation } from '../../../../hooks/useGoogleTranslation';

const ProductCard = ({ product, footerText }) => {
    const navigate = useNavigate();
    
    // Translated Values
    const productName = useGoogleTranslation(product.name);
    // Brand names should usually not be translated
    const productBrand = product.brand || product.name.split(' ')[0];
    const translatedFooter = useGoogleTranslation(footerText);
    const offText = useGoogleTranslation('OFF');
    const adText = useGoogleTranslation('AD');
    const withBankOfferText = useGoogleTranslation('with Bank offer');

    const [isNavigating, setIsNavigating] = React.useState(false);

    const handleNavigate = () => {
        setIsNavigating(true);
        // Add a small delay for visual feedback before navigating
        setTimeout(() => {
            navigate(`/product/${product.id}`);
            setIsNavigating(false);
        }, 300);
    };

    // Calculate dynamic discount if not provided
    const discountPercent = product.discount || (product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) + `% ${offText}` : null);

    // Default footer text if none provided
    const displayFooterText = footerText ? translatedFooter : `₹${Math.round(product.price * 0.95).toLocaleString()} ${withBankOfferText}`;


    return (
        <div
            className={`flex flex-col h-full cursor-pointer group/card transition-opacity duration-300 ${isNavigating ? 'opacity-70' : ''}`}
            onClick={handleNavigate}
        >
            <div className="relative aspect-square mb-2 bg-[#f8f8f8] rounded-xl overflow-hidden flex items-center justify-center border border-gray-50 shadow-sm">
                {isNavigating && (
                    <div className="absolute inset-0 z-20 bg-white/40 flex items-center justify-center backdrop-blur-[1px]">
                        <div className="w-8 h-8 border-[3px] border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}
                <img
                    alt={product.name}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500"
                    src={product.image}
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
                    }}
                />

                {/* Rating Badge - Bottom Left */}
                {product.rating && (
                    <div className="absolute bottom-2 left-2 bg-white px-1.5 py-0.5 rounded-md flex items-center gap-0.5 text-[10px] md:text-xs font-bold shadow-sm border border-black/5 leading-none">
                        {product.rating} <span className="material-icons text-green-700 md:text-[12px]" style={{ fontSize: '9px' }}>star</span>
                    </div>
                )}

                {/* AD Badge - Top Right (Conditional or dynamic based on ID) */}
                {(product.id % 4 === 0) && (
                    <div className="absolute top-2 right-2 bg-black/40 backdrop-blur-sm text-[7px] md:text-[10px] font-bold px-1.5 py-0.5 rounded">
                        {adText}
                    </div>
                )}
            </div>

            <div className="px-1 flex flex-col flex-1">
                {/* Brand / Title */}
                <h4 className="text-[11px] md:text-sm font-bold text-gray-900 line-clamp-1 mb-0.5">
                    {productBrand} {productName}
                </h4>

                {/* Discount Percentage */}
                {discountPercent && (
                    <p className="text-[10px] md:text-xs font-bold text-green-700 mb-0.5 uppercase">
                        {discountPercent}
                    </p>
                )}

                {/* Prices */}
                <div className="flex items-center gap-1.5 mb-0.5">
                    {product.originalPrice && (
                        <span className="text-[11px] md:text-sm text-gray-500 line-through">₹{product.originalPrice.toLocaleString()}</span>
                    )}
                    <span className="text-[13px] md:text-lg font-bold text-gray-900">₹{product.price.toLocaleString()}</span>
                </div>

                {/* Offer/Footer Text */}
                <p className="text-[10px] md:text-xs font-bold text-blue-600 line-clamp-1">
                    {displayFooterText}
                </p>
            </div>
        </div>
    );
};

export default ProductCard;
