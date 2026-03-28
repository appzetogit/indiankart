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
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-8 gap-x-2 gap-y-5 justify-items-start md:gap-x-3 md:gap-y-6">
                {items.map((item) => (
                    <Link
                        key={item.id || item.name}
                        to={buildSubCategoryRoute(categoryName, item.targetName || item.name)}
                        className="flex w-full flex-col items-start text-left"
                    >
                        <div className="mb-1.5 flex h-[62px] w-[62px] items-center justify-center overflow-hidden rounded-[22px] bg-[#f0d1fb] shadow-[0_12px_30px_rgba(236,72,153,0.12)] md:h-[108px] md:w-[108px]">
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
                        <span className="line-clamp-2 text-[11px] font-medium leading-tight text-[#111827] md:text-sm">
                            {item.name}
                        </span>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default CategoryQuickLinkGrid;
