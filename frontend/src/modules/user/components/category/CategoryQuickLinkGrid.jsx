import React from 'react';
import { Link } from 'react-router-dom';
import { getPlaceholderImage, optimizeImage } from '../../../../utils/imageUtils';

const buildSubCategoryRoute = (categoryName, subCategoryName) => {
    const categorySegment = encodeURIComponent(String(categoryName || '').trim());
    const subCategorySegment = encodeURIComponent(String(subCategoryName || '').trim());
    return `/category/${categorySegment}/${subCategorySegment}`;
};

const CategoryQuickLinkGrid = ({ categoryName, items = [] }) => {
    if (!categoryName || items.length === 0) return null;

    return (
        <div className="w-full">
            <div className="grid grid-cols-4 gap-x-1.5 gap-y-3 justify-items-start sm:grid-cols-5 sm:gap-x-2 sm:gap-y-4 md:grid-cols-8 md:gap-x-3 md:gap-y-6">
                {items.map((item) => (
                    <Link
                        key={item.id || item.name}
                        to={buildSubCategoryRoute(categoryName, item.targetName || item.name)}
                        className="flex w-full flex-col items-start text-left"
                    >
                        <div className="mb-1 flex h-[50px] w-[50px] items-center justify-center overflow-hidden rounded-[14px] bg-[#f0d1fb] shadow-[0_10px_20px_rgba(236,72,153,0.10)] sm:h-[58px] sm:w-[58px] sm:rounded-[18px] md:h-[108px] md:w-[108px] md:rounded-[22px]">
                            <img
                                src={optimizeImage(item.image || getPlaceholderImage(220, 220), { width: 220, quality: '80' })}
                                alt={item.name}
                                loading="lazy"
                                className="h-full w-full object-cover"
                                onError={(event) => {
                                    event.currentTarget.onerror = null;
                                    event.currentTarget.src = getPlaceholderImage(220, 220);
                                }}
                            />
                        </div>
                        <span className="line-clamp-2 text-[10px] font-medium leading-tight text-[#111827] sm:text-[11px] md:text-sm">
                            {item.name}
                        </span>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default CategoryQuickLinkGrid;
