import React, { useState, useEffect, useRef } from 'react';

const LazySection = ({ children, threshold = 0.1, placeholder, rootMargin = '100px', onVisible }) => {
    const [isVisible, setIsVisible] = useState(false);
    const sectionRef = useRef(null);
    const hasTriggeredRef = useRef(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    if (!hasTriggeredRef.current) {
                        hasTriggeredRef.current = true;
                        onVisible?.();
                    }
                    setIsVisible(true);
                    observer.unobserve(entry.target);
                }
            },
            {
                threshold,
                rootMargin,
            }
        );

        if (sectionRef.current) {
            observer.observe(sectionRef.current);
        }

        return () => {
            if (sectionRef.current) {
                observer.unobserve(sectionRef.current);
            }
        };
    }, [onVisible, rootMargin, threshold]);

    return (
        <div ref={sectionRef}>
            {isVisible ? children : placeholder}
        </div>
    );
};

export default LazySection;
