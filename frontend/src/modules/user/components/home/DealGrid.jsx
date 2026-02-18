import React from 'react';
import { useNavigate } from 'react-router-dom';

const DealGrid = ({
    title,
    items,
    bgColor = "bg-[#ffdcb4]",
    darkBgColor = "",
    titleKey = "name",
    subtitleKey = "discount",
    imageKey = "image",
    showArrow = true,
    showStamp = false,
    stampText = "NEW DELHI INDIA",
    containerClass = "mt-4",
    desktopGridCols = "md:grid-cols-6",
    isScrollable = false
}) => {
    const navigate = useNavigate();

    const handleItemClick = (item) => {
        const params = new URLSearchParams();
        if (item.category) params.append('category', item.category);
        if (item.subcategory) params.append('subcategory', item.subcategory);
        else if (item.name) params.append('subcategory', item.name); // Fallback to name as subcat

        navigate(`/products?${params.toString()}`);
    };

    return (
        <section className={`${containerClass}`}>
            <div className={`${bgColor} md:rounded-2xl p-3 md:p-4 shadow-sm border-y md:border border-gray-100 relative overflow-hidden`}>

                {/* Optional Stamp Decoration */}
                {showStamp && (
                    <div className="absolute top-2 right-2 opacity-10 rotate-12 pointer-events-none select-none">
                        <span className="text-[9px] md:text-sm font-black uppercase border-2 border-current px-2 py-0.5 leading-none whitespace-nowrap">
                            {stampText}
                        </span>
                    </div>
                )}

                {/* Header */}
                <div className="flex items-center justify-between mb-2 md:mb-4 px-1">
                    <h3 className="text-sm md:text-xl font-bold text-gray-900">{title}</h3>
                    {showArrow && (
                        <button className="bg-black text-white rounded-full w-7 h-7 md:w-10 md:h-10 flex items-center justify-center hover:bg-gray-800 transition-colors z-10">
                            <span className="material-icons text-white text-base md:text-lg">arrow_forward</span>
                        </button>
                    )}
                </div>

                {/* Content Container: Scrollable or Grid */}
                {isScrollable ? (
                    <>
                        {/* Mobile: Grid Layout (2 cols) - Preserves original mobile design */}
                        <div className="md:hidden grid grid-cols-2 gap-3">
                            {items.slice(0, 4).map((item, idx) => (
                                <div
                                    key={item.id || idx}
                                    onClick={() => handleItemClick(item)}
                                    className="bg-white rounded-xl shadow-sm cursor-pointer group hover:shadow-md transition-all overflow-hidden flex flex-col h-full"
                                >
                                    <div className="aspect-square w-full bg-[#f8f8f8] mb-2 overflow-hidden flex items-center justify-center relative">
                                        <img
                                            src={item[imageKey]}
                                            alt={item[titleKey]}
                                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
                                            }}
                                        />
                                    </div>
                                    <div className="px-2 pb-2 flex-1 flex flex-col justify-end text-center">
                                        <p className="text-[11px] md:text-sm text-gray-600 dark:text-gray-400 font-medium truncate mb-0.5">
                                            {item[titleKey]}
                                        </p>
                                        <p className="text-xs md:text-base font-bold text-gray-900 dark:text-white truncate">
                                            {subtitleKey === 'price' ? `₹${item[subtitleKey]?.toLocaleString()}` : item[subtitleKey]}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop: Scrollable Layout (Row) - As requested for web view */}
                        <div className="hidden md:flex overflow-x-auto gap-4 no-scrollbar pb-2 -mx-1 px-1">
                            {items.map((item, idx) => (
                                <div
                                    key={item.id || idx}
                                    onClick={() => handleItemClick(item)}
                                    className="w-[280px] flex-shrink-0 bg-white rounded-xl shadow-sm cursor-pointer group hover:shadow-md transition-all overflow-hidden flex flex-col h-full"
                                >
                                    <div className="aspect-square w-full bg-[#f8f8f8] mb-2 overflow-hidden flex items-center justify-center relative">
                                        <img
                                            src={item[imageKey]}
                                            alt={item[titleKey]}
                                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
                                            }}
                                        />
                                    </div>
                                    <div className="px-3 pb-3 flex-1 flex flex-col justify-end text-center">
                                        <p className="text-[11px] md:text-sm text-gray-600 dark:text-gray-400 font-medium truncate mb-0.5">
                                            {item[titleKey]}
                                        </p>
                                        <p className="text-xs md:text-base font-bold text-gray-900 dark:text-white truncate">
                                            {subtitleKey === 'price' ? `₹${item[subtitleKey]?.toLocaleString()}` : item[subtitleKey]}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className={`grid grid-cols-2 gap-3 ${desktopGridCols} md:gap-6`}>
                        {items.map((item, idx) => (
                            <div
                                key={item.id || idx}
                                onClick={() => handleItemClick(item)}
                                className="bg-white rounded-xl shadow-sm cursor-pointer group hover:shadow-md transition-all overflow-hidden flex flex-col h-full"
                            >
                                <div className="aspect-square w-full bg-[#f8f8f8] mb-2 overflow-hidden flex items-center justify-center relative">
                                    <img
                                        src={item[imageKey]}
                                        alt={item[titleKey]}
                                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
                                        }}
                                    />
                                </div>
                                <div className="px-2 pb-2 flex-1 flex flex-col justify-end text-center">
                                    <p className="text-[11px] md:text-sm text-gray-600 font-medium truncate mb-0.5">
                                        {item[titleKey]}
                                    </p>
                                    <p className="text-xs md:text-base font-bold text-gray-900 truncate">
                                        {subtitleKey === 'price' ? `₹${item[subtitleKey]?.toLocaleString()}` : item[subtitleKey]}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default DealGrid;
