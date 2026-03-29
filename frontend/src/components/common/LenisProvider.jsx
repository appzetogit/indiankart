import { useEffect } from 'react';
import Lenis from 'lenis';

const LenisProvider = ({ children }) => {
  useEffect(() => {
    if (window.__lenisInstance) return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) return undefined;

    const lenis = new Lenis({
      smoothWheel: true,
      syncTouch: true,
      gestureOrientation: 'vertical',
      touchInertiaMultiplier: 22,
      wheelMultiplier: 0.85,
      duration: 1.15,
      touchMultiplier: 1,
      lerp: 0.085,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
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
