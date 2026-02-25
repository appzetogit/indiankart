import React from 'react';
import { useNavigate } from 'react-router-dom';

import { useGoogleTranslation } from '../../../../hooks/useGoogleTranslation';
import { prefetchProductById } from '../../../../hooks/useData';

const ProductCard = ({ product, footerText }) => {
    const navigate = useNavigate();

    // Translated Values
    const productName = useGoogleTranslation(product.name);
    // Brand names should usually not be translated
    const productBrand = product.brand || product.name.split(' ')[0];
    const translatedFooter = useGoogleTranslation(footerText);
    const offText = useGoogleTranslation('OFF');
    const adText = useGoogleTranslation('AD');

    const handleNavigate = () => {
        navigate(`/product/${product.id}`);
    };

    const prefetchDetails = () => {
        prefetchProductById(product.id);
    };

    // Calculate dynamic discount if not provided
    const discountPercent = product.discount || (product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) + `% ${offText}` : null);

    const displayFooterText = footerText ? translatedFooter : '';


    return (
        <div
            className="flex flex-col h-full cursor-pointer group/card transition-opacity duration-300"
            onClick={handleNavigate}
            onMouseEnter={prefetchDetails}
            onMouseDown={prefetchDetails}
            onTouchStart={prefetchDetails}
        >
            <div className="relative aspect-square mb-2 bg-[#f8f8f8] rounded-xl overflow-hidden flex items-center justify-center border border-gray-50 shadow-sm">
                <img
                    alt={product.name}
                    loading="lazy"
                    className="w-full h-full object-contain p-2 group-hover/card:scale-105 transition-transform duration-500"
                    src={product.image}
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
                    }}
                />

                {/* Rating Badge - Bottom Left */}
                {Number(product.rating) > 0 && (
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

                {/* Prices */}
                <div className="flex items-center gap-1.5 mb-0.5">
                    {product.originalPrice && (
                        <span className="text-[11px] md:text-sm text-gray-500 line-through">&#8377;{product.originalPrice.toLocaleString()}</span>
                    )}
                    <span className="text-[13px] md:text-lg font-bold text-gray-900">&#8377;{product.price.toLocaleString()}</span>
                    {discountPercent && (
                        <span className="text-[10px] md:text-xs font-bold text-green-700 uppercase">
                            {discountPercent}
                        </span>
                    )}
                </div>

                {/* Offer/Footer Text */}
                {displayFooterText && (
                    <p className="text-[10px] md:text-xs font-bold text-blue-600 line-clamp-1">
                        {displayFooterText}
                    </p>
                )}
            </div>
        </div>
    );
};

export default ProductCard;
