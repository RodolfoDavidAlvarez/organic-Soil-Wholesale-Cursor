import { OptimizedImage } from "@/components/OptimizedImage";
import {
  FLATBED_CAPACITY,
  FULL_LOAD_PRODUCT_DISCOUNT,
  flatbedLoadCount,
  hasFullFlatbedDiscount,
} from "@/lib/flatbedSpots";
import { cn } from "@/lib/utils";

type FlatbedLoadMeterProps = {
  spots: number;
  className?: string;
  /** Compact for cart drawer; roomier for checkout sidebar */
  compact?: boolean;
};

const MIXED_FLATBED_IMAGE = "/images/size-formats/mixed-truckload.webp";

export function FlatbedLoadMeter({ spots, className, compact = false }: FlatbedLoadMeterProps) {
  if (spots <= 0) return null;

  const capacity = FLATBED_CAPACITY;
  const filled = Math.min(spots, capacity);
  const pct = Math.round((filled / capacity) * 100);
  const loads = flatbedLoadCount(spots);
  const full = hasFullFlatbedDiscount(spots);
  const over = spots > capacity;
  const discountPct = Math.round(FULL_LOAD_PRODUCT_DISCOUNT * 100);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border bg-white",
        full
          ? "border-emerald-300 bg-emerald-50/40"
          : over
            ? "border-amber-300 bg-amber-50/30"
            : "border-stone-200",
        className,
      )}
    >
      <div className={cn("flex gap-3", compact ? "p-3" : "p-4")}>
        <div
          className={cn(
            "shrink-0 overflow-hidden rounded-lg bg-stone-100 ring-1 ring-stone-200/80",
            compact ? "h-14 w-14" : "h-16 w-20",
          )}
        >
          <OptimizedImage
            src={MIXED_FLATBED_IMAGE}
            alt="Mixed flatbed truckload with pallets and totes"
            className="h-full w-full object-cover"
            width={160}
            q={65}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className={cn("font-semibold text-stone-900", compact ? "text-sm" : "text-base")}>
              Flatbed load
            </p>
            <p className={cn("tabular-nums font-bold text-[#264027]", compact ? "text-sm" : "text-base")}>
              {spots} / {capacity}
              <span className="ml-1 text-xs font-medium text-stone-500">spots</span>
            </p>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-200">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-300",
                full ? "bg-emerald-600" : over ? "bg-amber-500" : "bg-[#264027]",
              )}
              style={{ width: `${Math.min(100, over ? 100 : pct)}%` }}
            />
          </div>
          <p className={cn("mt-1.5 leading-snug text-stone-600", compact ? "text-[11px]" : "text-xs")}>
            {full ? (
              <span className="font-semibold text-emerald-800">
                Full truckload — {discountPct}% off products
              </span>
            ) : over ? (
              <span className="font-medium text-amber-900">
                This needs {loads} flatbed loads ({spots} spots)
              </span>
            ) : (
              <>
                Pallets &amp; totes ride a flatbed with onboard forklift (Moffett).
                {spots < capacity ? (
                  <span className="text-stone-500"> {capacity - spots} spots left for 10% off.</span>
                ) : null}
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
