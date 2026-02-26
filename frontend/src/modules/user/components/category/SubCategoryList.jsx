import React, { useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';

const buildSubCategoryRoute = (categoryName, subCategoryName) => {
    const categorySegment = encodeURIComponent(String(categoryName || '').trim());
    const subCategorySegment = encodeURIComponent(String(subCategoryName || '').trim());
    return `/category/${categorySegment}/${subCategorySegment}`;
};

const SubCategoryList = ({
    subCategories,
    categoryName,
    smallBanners = [],
    secondaryBannerTitle = '',
    secondaryBanners = []
}) => {
    if (!categoryName) return null;
    const bannerRailRef = useRef(null);

    const normalizedSubCategories = Array.isArray(subCategories)
        ? subCategories.filter((sub) => sub?.name)
        : [];

    const primaryTargetName = normalizedSubCategories[0]?.name || categoryName;

    const displaySubCategories = useMemo(() => {
        return normalizedSubCategories.slice(0, 15).map((sub) => ({
            id: sub.id || sub._id || sub.name,
            name: sub.name,
            image: sub.image || '',
            targetName: sub.name
        }));
    }, [normalizedSubCategories, primaryTargetName]);

    const normalizedBannerCards = useMemo(() => {
        return (Array.isArray(smallBanners) ? smallBanners : [])
            .map((item) => {
                if (typeof item === 'string') return { image: item, title: categoryName, linkSubCategoryName: primaryTargetName };
                if (item?.image) {
                    return {
                        image: item.image,
                        title: item.title || categoryName,
                        linkSubCategoryName: item.linkSubCategoryName || primaryTargetName
                    };
                }
                return null;
            })
            .filter(Boolean);
    }, [smallBanners, categoryName, primaryTargetName]);

    const normalizedSecondaryBanners = useMemo(() => {
        return (Array.isArray(secondaryBanners) ? secondaryBanners : [])
            .map((item) => {
                if (typeof item === 'string') return { image: item, title: secondaryBannerTitle || categoryName };
                if (item?.image) return { image: item.image, title: item.title || secondaryBannerTitle || categoryName };
                return null;
            })
            .filter(Boolean);
    }, [secondaryBanners, secondaryBannerTitle, categoryName]);

    useEffect(() => {
        if (!bannerRailRef.current || normalizedBannerCards.length <= 1) return undefined;

        const rail = bannerRailRef.current;
        const interval = setInterval(() => {
            const card = rail.firstElementChild;
            if (!card) return;

            const cardWidth = card.getBoundingClientRect().width;
            const style = window.getComputedStyle(rail);
            const gap = parseFloat(style.columnGap || style.gap || '0') || 0;
            const step = cardWidth + gap;
            const maxScrollLeft = rail.scrollWidth - rail.clientWidth;
            const nextScrollLeft = rail.scrollLeft + step;

            if (nextScrollLeft >= maxScrollLeft - 4) {
                rail.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
                rail.scrollTo({ left: nextScrollLeft, behavior: 'smooth' });
            }
        }, 2800);

        return () => clearInterval(interval);
    }, [normalizedBannerCards.length]);

    return (
        <div className="bg-white">
            <div className="max-w-[1360px] mx-auto px-3 md:px-5 py-3 md:py-4">
                {normalizedBannerCards.length > 0 && (
                <div
                    ref={bannerRailRef}
                    className="flex gap-3 md:gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory"
                >
                    {normalizedBannerCards.map((banner, index) => (
                        <Link
                            key={`${banner.image}-${index}`}
                            to={buildSubCategoryRoute(categoryName, banner.linkSubCategoryName || primaryTargetName)}
                            className="relative overflow-hidden rounded-2xl border border-gray-200 h-[180px] md:h-[266px] min-w-[78%] md:min-w-[calc(44%-8px)] snap-start shrink-0"
                        >
                            <img
                                src={banner.image}
                                alt={banner.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = '';
                                }}
                            />
                        </Link>
                    ))}
                </div>
                )}

                {displaySubCategories.length > 0 && (
                <div className="px-1 md:px-2 mt-4">
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-8 gap-y-5 md:gap-y-6 gap-x-2 md:gap-x-3">
                        {displaySubCategories.map((sub) => (
                            <Link
                                key={sub.id}
                                to={buildSubCategoryRoute(categoryName, sub.targetName)}
                                className="flex flex-col items-center text-center"
                            >
                                <div className="w-[62px] h-[62px] md:w-[108px] md:h-[108px] overflow-hidden mb-1.5">
                                    {sub.image ? (
                                        <img src={sub.image} alt={sub.name} className="w-full h-full object-cover rounded-md" />
                                    ) : (
                                        <div className="w-full h-full bg-gray-200 rounded-md"></div>
                                    )}
                                </div>
                                <span className="text-[11px] md:text-sm font-medium text-[#111827] leading-tight line-clamp-1">
                                    {sub.name}
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
                )}

                {normalizedSecondaryBanners.length > 0 && (
                    <div className="px-1 md:px-2 mt-8 md:mt-10">
                        <h2 className="text-3xl md:text-6xl font-black text-black mb-4 md:mb-6">
                            {secondaryBannerTitle || 'Launch of the Day'}
                        </h2>
                        <div className="space-y-3 md:space-y-4">
                            {normalizedSecondaryBanners.map((banner, index) => (
                                <div
                                    key={`${banner.image}-${index}`}
                                    className="w-full rounded-2xl overflow-hidden border border-gray-200"
                                >
                                    <img
                                        src={banner.image}
                                        alt={banner.title}
                                        className="w-full h-[180px] md:h-[420px] object-cover"
                                        onError={(e) => {
                                            e.currentTarget.onerror = null;
                                            e.currentTarget.src = '';
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SubCategoryList;
