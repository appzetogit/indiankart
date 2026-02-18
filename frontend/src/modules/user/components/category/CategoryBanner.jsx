import React, { useState, useRef, useEffect } from 'react';

const CategoryBanner = ({ image, alt, banners = [] }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const scrollRef = useRef(null);

    // Use banners array if provided, otherwise fallback to single image object
    const slides = banners.length > 0 ? banners : (image ? [{ id: 1, image, alt }] : []);

    if (slides.length === 0) return null;

    const handleScroll = () => {
        if (scrollRef.current) {
            const scrollPosition = scrollRef.current.scrollLeft;
            const width = scrollRef.current.offsetWidth;
            const index = Math.round(scrollPosition / width);
            setActiveIndex(index);
        }
    };

    return (
        <div className="w-full relative px-2 mb-4">
            {/* Scroll Container */}
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar w-full rounded-xl"
                style={{ scrollBehavior: 'smooth' }}
            >
                {slides.map((slide, index) => (
                    <div key={slide.id || index} className="w-full flex-shrink-0 snap-center relative">
                        <img
                            src={slide.image}
                            alt={slide.alt || "Banner"}
                            className="w-full h-auto object-cover min-h-[160px] max-h-[180px] md:max-h-[300px] rounded-xl"
                        />
                    </div>
                ))}
            </div>

            {/* Pagination Dots */}
            {slides.length > 1 && (
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">
                    {slides.map((_, index) => (
                        <div
                            key={index}
                            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${index === activeIndex ? 'bg-white w-4' : 'bg-white/50'
                                }`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default CategoryBanner;
