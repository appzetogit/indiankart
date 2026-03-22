import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCategories } from '../../../hooks/useData';
import { useHeaderStore } from '../../admin/store/headerStore';
import { IoSearch } from 'react-icons/io5';
import {
    MdGridView,
    MdCheckroom,
    MdSmartphone,
    MdFace,
    MdLaptop,
    MdHome,
    MdShoppingBasket,
    MdOutlineQrCodeScanner,
    MdBolt // For 'For You' equivalent icon
} from 'react-icons/md';

const AllCategoriesSkeleton = () => (
    <div className="bg-white min-h-screen flex flex-col pb-24">
        <div className="bg-white sticky top-0 z-10 px-3 py-3 border-b border-gray-100">
            <div className="h-6 w-40 rounded shimmer" />
        </div>
        <div className="flex flex-1 min-h-0">
            <div className="w-1/4 max-w-[100px] bg-gray-50 border-r border-gray-200 px-2 py-3 space-y-3">
                {Array.from({ length: 7 }).map((_, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-full shimmer" />
                        <div className="h-2.5 w-12 rounded shimmer" />
                    </div>
                ))}
            </div>
            <div className="flex-1 p-4">
                <div className="h-5 w-36 rounded shimmer mb-4" />
                <div className="grid grid-cols-3 gap-3">
                    {Array.from({ length: 9 }).map((_, idx) => (
                        <div key={idx} className="flex flex-col items-center gap-2">
                            <div className="w-16 h-16 rounded-full shimmer" />
                            <div className="h-2.5 w-14 rounded shimmer" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
);

const AllCategories = () => {
    const navigate = useNavigate();
    const { categories, loading: categoriesLoading } = useCategories();
    const { headerCategories, fetchHeaderConfig, isLoading: headerLoading } = useHeaderStore();

    useEffect(() => {
        fetchHeaderConfig();
    }, []);
    
    // Reorder categories to match header pinned items first
    const displayCategories = useMemo(() => {
        if (categoriesLoading) return [];
        
        // Keep active categories, but exclude "For You" on this page.
        const allActive = categories.filter(cat => cat.active !== false && cat.name !== 'For You');
        const pinned = headerCategories.filter(cat => cat.active !== false && cat.name !== 'For You');
        
        const pinnedIds = new Set(pinned.map(cat => cat.id || cat._id));
        const remaining = allActive.filter(cat => !pinnedIds.has(cat.id || cat._id));
        
        return [...pinned, ...remaining];
    }, [categories, headerCategories, categoriesLoading]);

    const [selectedCategory, setSelectedCategory] = useState(null);

    // Update selected category when categories load
    useEffect(() => {
        if (displayCategories.length > 0 && !selectedCategory) {
            setSelectedCategory(displayCategories[0]?.id || displayCategories[0]?._id);
        }
    }, [displayCategories, selectedCategory]);

    // Filter categories to show content based on selection
    const activeData = useMemo(() => {
        return categories.find(cat => (cat.id || cat._id) === selectedCategory);
    }, [categories, selectedCategory]);

    const iconMap = {
        'grid_view': MdGridView,
        'checkroom': MdCheckroom,
        'smartphone': MdSmartphone,
        'face': MdFace,
        'laptop': MdLaptop,
        'home': MdHome,
        'shopping_basket': MdShoppingBasket,
    };
    const isImageSource = (value = '') => /^(https?:\/\/|\/|data:|blob:)/i.test(String(value || '').trim());

    if (categoriesLoading) {
        return <AllCategoriesSkeleton />;
    }

    return (
        <div className="bg-white min-h-screen flex flex-col md:pb-0">
            {/* Header for All Categories Page - Similar to screenshot */}
            <div className="bg-white sticky top-0 z-10 px-3 py-3 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h1 className="text-lg font-bold text-gray-800">All Categories</h1>
                </div>
            </div>

            <div className="flex flex-1">
                {/* Left Sidebar - Categories List */}
                <div className="w-1/4 max-w-[100px] bg-gray-50 border-r border-gray-200 no-scrollbar">
                    {displayCategories.map((cat) => {
                        const IconComponent = iconMap[cat.icon] || MdGridView;
                        const categoryImage = cat.image || cat.icon || '';
                        const hasCategoryImage = isImageSource(categoryImage);
                        const isSelected = selectedCategory === (cat.id || cat._id);
                        const isForYou = String(cat.name || '').trim().toLowerCase() === 'for you';
                        return (
                            <div
                                key={cat.id || cat._id}
                                onClick={() => setSelectedCategory(cat.id || cat._id)}
                                className={`flex flex-col items-center justify-center py-4 px-1 cursor-pointer relative ${isSelected ? 'bg-white' : ''}`}
                            >
                                {/* Active Indicator Strip */}
                                {isSelected && !isForYou && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r-full"></div>
                                )}

                                <div className={`relative w-12 h-12 rounded-full flex items-center justify-center mb-1 border transition-all ${isSelected && !isForYou ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                    {hasCategoryImage ? (
                                        <img
                                            src={categoryImage}
                                            alt={cat.name}
                                            className="w-full h-full object-cover rounded-full"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                                const fallbackIcon = e.currentTarget.nextElementSibling;
                                                if (fallbackIcon) fallbackIcon.style.display = 'block';
                                            }}
                                        />
                                    ) : null}
                                    <IconComponent
                                        className="text-2xl"
                                        style={{ display: hasCategoryImage ? 'none' : 'block' }}
                                    />
                                </div>
                                <span className={`text-[10px] text-center font-medium leading-tight ${isSelected && !isForYou ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>
                                    {cat.name}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Right Content Area - Subcategories ONLY */}
                <div className="flex-1 bg-white p-4">
                    <div className="animate-in slide-in-from-bottom-2 duration-300">
                        {/* Subcategories Grid */}
                        <h3 className="font-bold text-gray-800 mb-3 text-sm">Shop by Category</h3>

                        {activeData?.subCategories && activeData.subCategories.length > 0 ? (
                            <div className="grid grid-cols-3 gap-3">
                                {activeData.subCategories.map((sub, index) => (
                                    <div
                                        key={index}
                                        onClick={() =>
                                            navigate(
                                                `/category/${encodeURIComponent(activeData.name)}/${encodeURIComponent(sub.name)}`
                                            )
                                        }
                                        className="flex flex-col items-center gap-2 cursor-pointer group"
                                    >
                                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100 p-1 group-hover:border-blue-300 transition-all">
                                            <img
                                                src={sub.image || 'https://via.placeholder.com/150'}
                                                alt={sub.name}
                                                className="w-full h-full object-cover rounded-full"
                                            />
                                        </div>
                                        <span className="text-[10px] font-medium text-center text-gray-700 leading-tight group-hover:text-blue-600">
                                            {sub.name}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 text-gray-400 text-sm">
                                No subcategories found.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AllCategories;
