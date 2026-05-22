// Mobile animation performance utility for DMS Luxe.
// Helps disable or downgrade expensive Framer Motion animations on mobile viewports (< 768px).

export const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

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
