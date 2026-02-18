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
        
        // Filter out "For You" category and ensure they are active
        const allActive = categories.filter(cat => cat.name !== "For You" && cat.active !== false);
        const pinned = headerCategories.filter(cat => cat.name !== "For You" && cat.active !== false);
        
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

    if (categoriesLoading) {
        return <div className="p-10 text-center">Loading categories...</div>;
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
                        return (
                            <div
                                key={cat.id || cat._id}
                                onClick={() => setSelectedCategory(cat.id || cat._id)}
                                className={`flex flex-col items-center justify-center py-4 px-1 cursor-pointer relative ${selectedCategory === (cat.id || cat._id) ? 'bg-white' : ''}`}
                            >
                                {/* Active Indicator Strip */}
                                {selectedCategory === (cat.id || cat._id) && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r-full"></div>
                                )}

                                <div className={`relative w-10 h-10 rounded-full flex items-center justify-center mb-1 ${selectedCategory === (cat.id || cat._id) ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                                    <IconComponent className="text-xl" />
                                </div>
                                <span className={`text-[10px] text-center font-medium leading-tight ${selectedCategory === (cat.id || cat._id) ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>
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
                                        onClick={() => navigate(`/category/${activeData.name}/${sub.name}`)}
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
