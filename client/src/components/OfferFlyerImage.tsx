import { useCallback, useState, type ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const prefetched = new Set<string>();

/** Prefetch a single flyer URL (homepage hover/focus). Do not prefetch all heroes. */
export function prefetchOfferImage(src?: string | null) {
  if (!src || prefetched.has(src) || typeof window === "undefined") return;
  prefetched.add(src);
  const img = new Image();
  img.decoding = "async";
  img.src = src;
}

type OfferFlyerImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt"> & {
  src: string;
  alt: string;
  wrapperClassName?: string;
  spinnerLabel?: string;
};

/**
 * Cream placeholder + spinning ring until the flyer actually paints.
 * Matches the Home MobileResultsProof loading treatment; does not touch Suspense.
 */
export default function OfferFlyerImage({
  src,
  alt,
  className,
  wrapperClassName,
  spinnerLabel = "Loading…",
  loading,
  decoding,
  fetchPriority,
  onLoad,
  onError,
  ...props
}: OfferFlyerImageProps) {
  const [settledSrc, setSettledSrc] = useState<{ src: string; state: "loaded" | "error" } | null>(null);
  const showSpinner = settledSrc?.src !== src;

  const markLoaded = useCallback(() => {
    setSettledSrc({ src, state: "loaded" });
  }, [src]);

  const attach = useCallback(
    (el: HTMLImageElement | null) => {
      if (el && el.complete && el.naturalWidth > 0) markLoaded();
    },
    [markLoaded],
  );

  return (
    <div className={cn("relative overflow-hidden bg-[#f4f2eb]", wrapperClassName)}>
      {showSpinner ? (
        <div className="absolute inset-0 z-10 overflow-hidden" role="status" aria-live="polite">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/55 to-transparent motion-safe:animate-pulse motion-reduce:animate-none" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-2 text-xs font-semibold text-[#264027] shadow-sm ring-1 ring-[#264027]/10">
              <span
                className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#264027]/25 border-t-[#264027] motion-reduce:animate-none"
                aria-hidden="true"
              />
              {spinnerLabel}
            </span>
          </div>
        </div>
      ) : null}
      <img
        ref={attach}
        src={src}
        alt={alt}
        loading={loading}
        decoding={decoding ?? "async"}
        fetchPriority={fetchPriority}
        onLoad={(event) => {
          markLoaded();
          onLoad?.(event);
        }}
        onError={(event) => {
          setSettledSrc({ src, state: "error" });
          onError?.(event);
        }}
        className={cn(
          "transition-opacity duration-500 motion-reduce:transition-none",
          settledSrc?.src === src && settledSrc.state === "loaded" ? "opacity-100" : "opacity-0",
          className,
        )}
        {...props}
      />
    </div>
  );
}
