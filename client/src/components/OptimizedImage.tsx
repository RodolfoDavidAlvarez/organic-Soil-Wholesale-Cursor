import { forwardRef, useCallback, useMemo, useRef, type ImgHTMLAttributes, type SyntheticEvent } from "react";
import { getOptimizedImageSrc, getOriginalImageSrc } from "@/utils/getOptimizedImageSrc";

export interface OptimizedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  priority?: boolean;
  /** Target render width in CSS px. Used to size the Vercel image
   *  optimization request; default 800 (works for grid cards). Pass smaller
   *  for thumbnails (e.g. 96, 200) to save bandwidth on mobile. */
  width?: number;
  /** Quality 1-100, default 70 — visually indistinguishable from 90 but ~2x smaller. */
  q?: number;
}

const VERCEL_IMAGE_WIDTHS = [256, 384, 480, 640, 750, 828, 1080, 1200, 1600];
const pickWidth = (w: number) => VERCEL_IMAGE_WIDTHS.find((v) => v >= w) ?? 1600;

const isExternal = (s: string) => /^(?:https?:)?\/\//i.test(s) || s.startsWith("data:");

/** Wrap with /_vercel/image so the CDN serves AVIF/WebP at the requested width.
 *  Configured by `images.sizes` + `images.formats` in vercel.json. */
const toVercelImage = (src: string, w: number, q: number) => {
  if (!src || isExternal(src) || src.startsWith("data:") || src.startsWith("/_vercel/")) return src;
  // Only run in browsers — SSR/SSG should leave it untouched.
  const isProd = typeof window !== "undefined" && window.location?.hostname &&
    !window.location.hostname.includes("localhost") &&
    !window.location.hostname.startsWith("127.");
  if (!isProd) return src;
  const params = new URLSearchParams({ url: src, w: String(pickWidth(w)), q: String(q) });
  return `/_vercel/image?${params.toString()}`;
};

export const OptimizedImage = forwardRef<HTMLImageElement, OptimizedImageProps>(
  ({ src, loading, decoding, priority = false, onError, fetchPriority, width = 800, q = 70, ...props }, ref) => {
    const resolvedSrc = getOptimizedImageSrc(src);
    const fallbackSrc = useMemo(() => getOriginalImageSrc(src), [src]);
    const hasTriedFallbackRef = useRef(false);

    const cdnSrc = useMemo(
      () => toVercelImage(resolvedSrc || fallbackSrc, width, q),
      [resolvedSrc, fallbackSrc, width, q]
    );

    const effectiveLoading = loading ?? (priority ? "eager" : "lazy");
    const effectiveDecoding = decoding ?? (priority ? "sync" : "async");
    const effectiveFetchPriority = fetchPriority ?? (priority ? "high" : undefined);

    const handleError = useCallback(
      (event: SyntheticEvent<HTMLImageElement, Event>) => {
        const current = event.currentTarget.src;
        // First, fall back from the CDN URL to the raw resolved src
        if (current.includes("/_vercel/image") && resolvedSrc) {
          event.currentTarget.src = resolvedSrc;
          return;
        }
        if (!hasTriedFallbackRef.current && fallbackSrc && event.currentTarget.src !== fallbackSrc) {
          hasTriedFallbackRef.current = true;
          event.currentTarget.src = fallbackSrc;
          return;
        }
        if (!event.currentTarget.src.includes("/images/optimized/default-potting-soil-texture.jpg")) {
          event.currentTarget.src = "/images/optimized/default-potting-soil-texture.jpg";
          return;
        }
        onError?.(event);
      },
      [fallbackSrc, resolvedSrc, onError]
    );

    return (
      <img
        ref={ref}
        src={cdnSrc || resolvedSrc || fallbackSrc}
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
