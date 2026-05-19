import React, { useState, useEffect, useRef } from 'react';

/**
 * LazyViewportSection
 * Delays mounting of below-the-fold components until they are near the viewport.
 * Dramatically improves Lighthouse performance by keeping the initial JS bundle small
 * and postponing asset/code requests.
 */
const LazyViewportSection = ({ children, fallback, threshold = 0.01, rootMargin = '300px' }) => {
  const [isIntersected, setIsIntersected] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    if (isIntersected) return;

    // Use IntersectionObserver if supported in the browser
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsIntersected(true);
          }
        },
        { threshold, rootMargin }
      );

      if (sectionRef.current) {
        observer.observe(sectionRef.current);
      }

      return () => {
        if (sectionRef.current) {
          observer.unobserve(sectionRef.current);
        }
      };
    } else {
      // Fallback for environment/browsers without IntersectionObserver support
      setIsIntersected(true);
    }
  }, [isIntersected, threshold, rootMargin]);

  return (
    <div ref={sectionRef} className="w-full min-h-[10px]">
      {isIntersected ? children : fallback}
    </div>
  );
};

export default LazyViewportSection;
