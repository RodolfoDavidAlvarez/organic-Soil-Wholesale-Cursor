import { forwardRef, useCallback, useMemo, useRef, type ImgHTMLAttributes, type SyntheticEvent } from "react";
import { getOptimizedImageSrc, getOriginalImageSrc } from "@/utils/getOptimizedImageSrc";

export interface OptimizedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  priority?: boolean;
}

export const OptimizedImage = forwardRef<HTMLImageElement, OptimizedImageProps>(
  ({ src, loading, decoding, priority = false, onError, fetchPriority, ...props }, ref) => {
    const resolvedSrc = getOptimizedImageSrc(src);
    const fallbackSrc = useMemo(() => getOriginalImageSrc(src), [src]);
    const hasTriedFallbackRef = useRef(false);

    const effectiveLoading = loading ?? (priority ? "eager" : "lazy");
    const effectiveDecoding = decoding ?? (priority ? "sync" : "async");
    const effectiveFetchPriority = fetchPriority ?? (priority ? "high" : undefined);

    const handleError = useCallback(
      (event: SyntheticEvent<HTMLImageElement, Event>) => {
        if (!hasTriedFallbackRef.current && fallbackSrc && event.currentTarget.src !== fallbackSrc) {
          hasTriedFallbackRef.current = true;
          event.currentTarget.src = fallbackSrc;
          return;
        }

        // If both optimized and fallback fail, try a generic texture image
        if (!event.currentTarget.src.includes('/images/optimized/default-potting-soil-texture.jpg')) {
          event.currentTarget.src = '/images/optimized/default-potting-soil-texture.jpg';
          return;
        }

        onError?.(event);
      },
      [fallbackSrc, onError]
    );

    return (
      <img
        ref={ref}
        src={resolvedSrc || fallbackSrc}
        loading={effectiveLoading}
        decoding={effectiveDecoding}
        fetchPriority={effectiveFetchPriority}
        onError={handleError}
        {...props}
      />
    );
  }
);

OptimizedImage.displayName = "OptimizedImage";
