import React, { useState, useEffect, useRef } from 'react';

const LazySection = ({ children, threshold = 0.1, placeholder }) => {
    const [isVisible, setIsVisible] = useState(false);
    const sectionRef = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry.target);
                }
            },
            {
                threshold,
                rootMargin: '100px', // Start loading slightly before it comes into view
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
    }, [threshold]);

    return (
        <div ref={sectionRef}>
            {isVisible ? children : placeholder}
        </div>
    );
};

export default LazySection;
