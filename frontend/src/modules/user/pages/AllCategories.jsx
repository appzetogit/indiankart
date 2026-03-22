import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCategories } from '../../../hooks/useData';
import { useHeaderStore } from '../../admin/store/headerStore';
import {
    MdGridView,
    MdCheckroom,
    MdSmartphone,
    MdFace,
    MdLaptop,
    MdHome,
    MdShoppingBasket,
    MdBolt
} from 'react-icons/md';

const toThumbnailSrc = (url = '', size = 120) => {
    const src = String(url || '').trim();
    if (!src) return '';

    // Cloudinary transformation for faster thumbnail delivery.
    if (src.includes('res.cloudinary.com') && src.includes('/upload/')) {
        return src.replace('/upload/', `/upload/f_auto,q_auto,w_${size},h_${size},c_fill/`);
    }

    return src;
};

const prefetchedThumbs = new Set();
const prefetchThumbnail = (url, size = 140) => {
    const thumb = toThumbnailSrc(url, size);
    if (!thumb || prefetchedThumbs.has(thumb)) return;
    prefetchedThumbs.add(thumb);
    const img = new Image();
    img.decoding = 'async';
    img.loading = 'eager';
    img.src = thumb;
};

const CircleImage = ({ src, alt, sizeClass = 'w-16 h-16', fallback = null, priority = false }) => {
    const [loaded, setLoaded] = useState(false);
    const [errored, setErrored] = useState(false);
    const optimizedSrc = useMemo(() => toThumbnailSrc(src, 140), [src]);

    if (!optimizedSrc || errored) {
        return fallback;
    }

    return (
        <div className={`relative ${sizeClass} rounded-full overflow-hidden`}>
            {!loaded && <div className="absolute inset-0 shimmer rounded-full" />}
            <img
                src={optimizedSrc}
                alt={alt}
                className={`w-full h-full object-cover rounded-full transition-opacity duration-200 ${loaded ? 'opacity-100' : 'opacity-0'}`}
                loading={priority ? 'eager' : 'lazy'}
                decoding="async"
                fetchPriority={priority ? 'high' : 'auto'}
                onLoad={() => setLoaded(true)}
                onError={() => setErrored(true)}
            />
        </div>
    );
};

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
    const { categories, loading: categoriesLoading } = useCategories({ lite: true });
    const { headerCategories, fetchHeaderConfig, isLoading: headerLoading } = useHeaderStore();

    useEffect(() => {
        fetchHeaderConfig();
    }, []);
    
    const normalizedHeaderCategories = useMemo(() => {
        return (headerCategories || [])
            .filter((cat) => cat && cat.active !== false && cat.name !== 'For You')
            .map((cat) => ({
                ...cat,
                subCategories: Array.isArray(cat.subCategories) ? cat.subCategories : []
            }));
    }, [headerCategories]);

    // Prefer full categories when available; otherwise use the same source as homepage header.
    const sourceCategories = useMemo(() => {
        const activeFromCategories = (categories || []).filter(
            (cat) => cat && cat.active !== false && cat.name !== 'For You'
        );
        return activeFromCategories.length > 0 ? activeFromCategories : normalizedHeaderCategories;
    }, [categories, normalizedHeaderCategories]);

    // Reorder categories to match header pinned items first
    const displayCategories = useMemo(() => {
        const allActive = sourceCategories;
        const pinned = normalizedHeaderCategories;

        const pinnedIds = new Set(pinned.map(cat => String(cat.id || cat._id)));
        const remaining = allActive.filter(cat => !pinnedIds.has(String(cat.id || cat._id)));

        return [...pinned, ...remaining];
    }, [sourceCategories, normalizedHeaderCategories]);

    const [selectedCategory, setSelectedCategory] = useState(null);
    const [subCategoryBatchLoaded, setSubCategoryBatchLoaded] = useState(false);

    // Update selected category when categories load
    useEffect(() => {
        if (displayCategories.length > 0 && !selectedCategory) {
            setSelectedCategory(displayCategories[0]?.id || displayCategories[0]?._id);
        }
    }, [displayCategories, selectedCategory]);

    // Filter categories to show content based on selection
    const activeData = useMemo(() => {
        return sourceCategories.find(cat => String(cat.id || cat._id) === String(selectedCategory));
    }, [sourceCategories, selectedCategory]);
    const activeSubCategoryThumbs = useMemo(() => {
        return (activeData?.subCategories || []).map((sub, index) => ({
            key: sub._id || sub.id || `${sub.name}-${index}`,
            src: toThumbnailSrc(sub?.image, 140)
        }));
    }, [activeData]);

    useEffect(() => {
        let cancelled = false;
        const thumbs = activeSubCategoryThumbs.filter((item) => item.src);

        if (thumbs.length === 0) {
            setSubCategoryBatchLoaded(true);
            return () => {
                cancelled = true;
            };
        }

        setSubCategoryBatchLoaded(false);

        Promise.all(
            thumbs.map((item) => new Promise((resolve) => {
                const img = new Image();
                img.decoding = 'async';
                img.loading = 'eager';
                img.fetchPriority = 'high';
                img.onload = () => resolve(true);
                img.onerror = () => resolve(false);
                img.src = item.src;
            }))
        ).then(() => {
            if (!cancelled) setSubCategoryBatchLoaded(true);
        });

        return () => {
            cancelled = true;
        };
    }, [selectedCategory, activeSubCategoryThumbs]);

    useEffect(() => {
        if (displayCategories.length === 0) return;

        const schedule = (work) => {
            if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
                return window.requestIdleCallback(work, { timeout: 1200 });
            }
            return setTimeout(work, 120);
        };

        const cancel = (id) => {
            if (typeof window !== 'undefined' && typeof window.cancelIdleCallback === 'function') {
                window.cancelIdleCallback(id);
                return;
            }
            clearTimeout(id);
        };

        const taskId = schedule(() => {
            // Prefetch all sidebar category icons first.
            displayCategories.forEach((cat) => {
                const categoryImage = cat?.image || cat?.icon || '';
                if (isImageSource(categoryImage)) {
                    prefetchThumbnail(categoryImage, 96);
                }
            });

            // Prefetch selected category subcategory thumbnails.
            (activeData?.subCategories || []).slice(0, 18).forEach((sub) => {
                if (sub?.image) {
                    prefetchThumbnail(sub.image, 140);
                }
            });

            // Warm likely-next subcategory thumbnails from remaining categories.
            displayCategories.slice(0, 8).forEach((cat) => {
                (cat?.subCategories || []).slice(0, 8).forEach((sub) => {
                    if (sub?.image) {
                        prefetchThumbnail(sub.image, 140);
                    }
                });
            });
        });

        return () => cancel(taskId);
    }, [displayCategories, activeData]);

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

    if (displayCategories.length === 0 && (categoriesLoading || headerLoading)) {
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
                                        <CircleImage
                                            src={categoryImage}
                                            alt={cat.name}
                                            sizeClass="w-12 h-12"
                                            priority={isSelected}
                                            fallback={<IconComponent className="text-2xl" />}
                                        />
                                    ) : (
                                        <IconComponent className="text-2xl" />
                                    )}
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
                                            {subCategoryBatchLoaded ? (
                                                <CircleImage
                                                    src={sub.image}
                                                    alt={sub.name}
                                                    sizeClass="w-full h-full"
                                                    priority={index < 9}
                                                    fallback={<div className="w-full h-full rounded-full bg-gray-200" />}
                                                />
                                            ) : (
                                                <div className="w-full h-full rounded-full shimmer" />
                                            )}
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
