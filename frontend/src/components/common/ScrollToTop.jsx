import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const lenis = window.__lenisInstance;
    if (lenis) {
      lenis.scrollTo(0, { immediate: true });
      return;
    }

    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

export default ScrollToTop;
