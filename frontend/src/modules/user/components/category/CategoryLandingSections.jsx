import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CategoryQuickLinkGrid from './CategoryQuickLinkGrid';
import { getCategoryPageData } from '../../data/categoryPageData';

const CategoryLandingSections = ({ categoryName }) => {
    const navigate = useNavigate();
    const landingContent = getCategoryPageData(categoryName);
    const [activeSlide, setActiveSlide] = useState(0);

    const heroSlides = useMemo(
        () => (Array.isArray(landingContent?.heroSlides) ? landingContent.heroSlides : []),
        [landingContent]
    );

    useEffect(() => {
        if (heroSlides.length <= 1) return undefined;
        const intervalId = window.setInterval(() => {
            setActiveSlide((current) => (current + 1) % heroSlides.length);
        }, 3500);
        return () => window.clearInterval(intervalId);
    }, [heroSlides]);

    if (!landingContent) return null;

    const openLink = (link) => {
        if (!link) return;
        navigate(link);
    };

    return (
        <div className="w-full">
            <div className="max-w-[1360px] mx-auto px-4 md:px-5 py-3 md:py-4">
                {heroSlides.length > 0 && (
                    <div className="mb-4 md:mb-5">
                        <div className="relative overflow-hidden rounded-xl">
                            <button
                                type="button"
                                onClick={() => setActiveSlide((current) => (current - 1 + heroSlides.length) % heroSlides.length)}
                                className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 text-gray-700 shadow-md"
                                aria-label="Previous slide"
                            >
                                <span className="material-icons text-xl">chevron_left</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveSlide((current) => (current + 1) % heroSlides.length)}
                                className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 text-gray-700 shadow-md"
                                aria-label="Next slide"
                            >
                                <span className="material-icons text-xl">chevron_right</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => openLink(heroSlides[activeSlide]?.redirectLink)}
                                className="block w-full overflow-hidden rounded-xl"
                            >
                                <img
                                    src={heroSlides[activeSlide]?.image}
                                    alt=""
                                    className="block w-full rounded-xl object-cover"
                                />
                            </button>

                            {heroSlides.length > 1 && (
                                <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2">
                                    {heroSlides.map((_, index) => (
                                        <button
                                            key={index}
                                            type="button"
                                            onClick={() => setActiveSlide(index)}
                                            className={`h-2 rounded-full transition-all ${activeSlide === index ? 'w-6 bg-white' : 'w-2 bg-white/60'}`}
                                            aria-label={`Go to slide ${index + 1}`}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {landingContent.scrollSection?.images?.length > 0 && (
                    <div className="mb-5">
                        {landingContent.scrollSection.title && (
                            <h3 className="mb-3 text-xl font-bold tracking-tight text-black md:text-2xl">
                                {landingContent.scrollSection.title}
                            </h3>
                        )}
                        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                            {landingContent.scrollSection.images.map((item, index) => (
                                <button
                                    key={`${item.image}-${index}`}
                                    type="button"
                                    onClick={() => openLink(item.redirectLink)}
                                    className="w-[220px] shrink-0 overflow-hidden rounded-xl md:w-[260px]"
                                >
                                    <img
                                        src={item.image}
                                        alt=""
                                        className="block w-full rounded-xl object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {landingContent.quickLinks?.length > 0 && (
                    <CategoryQuickLinkGrid categoryName={categoryName} items={landingContent.quickLinks} />
                )}
            </div>
        </div>
    );
};

export default CategoryLandingSections;
