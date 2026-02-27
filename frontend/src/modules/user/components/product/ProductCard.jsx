import React from 'react';
import { useNavigate } from 'react-router-dom';

import { useGoogleTranslation } from '../../../../hooks/useGoogleTranslation';
import { prefetchProductById } from '../../../../hooks/useData';

const ProductCard = ({ product, footerText }) => {
    const navigate = useNavigate();

    const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const cleanedProductName = React.useMemo(() => {
        const rawName = (product?.name || '').trim();
        const categoryName = (product?.category || '').trim();
        if (!rawName) return '';
        if (!categoryName) return rawName;

        const categoryPattern = new RegExp(`\\b${escapeRegex(categoryName)}\\b`, 'ig');
        return rawName.replace(categoryPattern, '').replace(/\s{2,}/g, ' ').trim();
    }, [product?.name, product?.category]);

    // Translated Values
    const productName = useGoogleTranslation(cleanedProductName || product.name);
    const translatedFooter = useGoogleTranslation(footerText);
    const offText = useGoogleTranslation('OFF');
    const adText = useGoogleTranslation('AD');

    const handleNavigate = () => {
        navigate(`/product/${product.id}`);
    };

    const prefetchDetails = () => {
        prefetchProductById(product.id);
    };

    // Variant Price Logic: Use first variant's price if available
    const firstSku = product?.skus?.[0];
    const displayPrice = (firstSku?.price !== undefined && firstSku?.price !== null) ? firstSku.price : product.price;
    const displayOriginalPrice = (firstSku?.originalPrice !== undefined && firstSku?.originalPrice !== null) ? firstSku.originalPrice : product.originalPrice;

    // Calculate dynamic discount if not provided
    const discountPercent = product.discount || (displayOriginalPrice ? Math.round(((displayOriginalPrice - displayPrice) / displayOriginalPrice) * 100) + `% ${offText}` : null);

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
                    {productName}
                </h4>

                {/* Prices */}
                <div className="flex items-center gap-1.5 mb-0.5">
                    {displayOriginalPrice && displayOriginalPrice > displayPrice && (
                        <span className="text-[11px] md:text-sm text-gray-500 line-through">&#8377;{displayOriginalPrice.toLocaleString()}</span>
                    )}
                    <span className="text-[13px] md:text-lg font-bold text-gray-900">&#8377;{displayPrice.toLocaleString()}</span>
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
