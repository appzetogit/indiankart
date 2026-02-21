import { useEffect } from 'react';
import Lenis from 'lenis';

const LenisProvider = ({ children }) => {
  useEffect(() => {
    if (window.__lenisInstance) return undefined;

    const lenis = new Lenis({
      smoothWheel: true,
      syncTouch: true,
      gestureOrientation: 'vertical',
      touchInertiaMultiplier: 28,
      wheelMultiplier: 0.9,
      duration: 1.1,
      touchMultiplier: 1.1,
      lerp: 0.08,
    });

    window.__lenisInstance = lenis;

    let rafId;
    const raf = (time) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };

    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      window.__lenisInstance = null;
    };
  }, []);

  return children;
};

export default LenisProvider;
