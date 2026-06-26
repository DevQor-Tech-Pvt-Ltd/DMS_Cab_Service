import { useState, useEffect } from 'react';

// Mobile animation performance utility for DMS Cab Service.
// Helps disable or downgrade expensive Framer Motion animations on mobile viewports (< 768px).

export const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

export const useWindowWidth = () => {
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return width;
};

export const useIsMobile = (breakpoint = 768) => {
  const width = useWindowWidth();
  return width < breakpoint;
};

// GPU-friendly fade-in-up transition (no offset on mobile to prevent compositor shifts)
export const fadeInUp = {
  initial: isMobile ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 },
  animate: isMobile ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 },
  transition: isMobile ? { duration: 0 } : { duration: 0.5, ease: [0.25, 1, 0.5, 1] }
};

// GPU-friendly basic fade-in transition
export const fadeIn = {
  initial: isMobile ? { opacity: 1 } : { opacity: 0 },
  animate: isMobile ? { opacity: 1 } : { opacity: 1 },
  transition: isMobile ? { duration: 0 } : { duration: 0.5 }
};

// GPU-friendly simple scale transition
export const scaleUp = {
  initial: isMobile ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 },
  animate: isMobile ? { opacity: 1, scale: 1 } : { opacity: 1, scale: 1 },
  transition: isMobile ? { duration: 0 } : { duration: 0.4 }
};
