import React, { useState, useCallback } from 'react';

/**
 * Production-ready image component with built-in fallback handling.
 * 
 * Features:
 * - Graceful error fallback with customizable placeholder
 * - Prevents infinite error loops (single retry)
 * - Supports all standard <img> props
 * - Optional loading="lazy" by default for performance
 */
const FALLBACK_PLACEHOLDER =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">' +
    '<rect fill="#f1f5f9" width="400" height="300"/>' +
    '<text x="200" y="150" text-anchor="middle" dominant-baseline="central" ' +
    'font-family="system-ui,sans-serif" font-size="14" fill="#94a3b8">Image unavailable</text>' +
    '</svg>'
  );

const ImageWithFallback = ({
  src,
  alt = '',
  fallbackSrc,
  className = '',
  loading = 'lazy',
  onError: externalOnError,
  ...rest
}) => {
  const [hasError, setHasError] = useState(false);

  const handleError = useCallback(
    (e) => {
      if (!hasError) {
        setHasError(true);
        e.target.src = fallbackSrc || FALLBACK_PLACEHOLDER;
      }
      if (externalOnError) externalOnError(e);
    },
    [hasError, fallbackSrc, externalOnError]
  );

  return (
    <img
      src={hasError ? (fallbackSrc || FALLBACK_PLACEHOLDER) : src}
      alt={alt}
      className={className}
      loading={loading}
      onError={handleError}
      {...rest}
    />
  );
};

export default ImageWithFallback;
