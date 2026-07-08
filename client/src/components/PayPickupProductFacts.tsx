import { Check, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PayPickupProductFactsProps {
  includes: string[];
  benefits?: string[];
  /** Compact spacing for grid cards; roomy for product detail hero */
  variant?: "card" | "detail";
  className?: string;
}

export function PayPickupProductFacts({
  includes,
  benefits = [],
  variant = "card",
  className,
}: PayPickupProductFactsProps) {
  const isDetail = variant === "detail";

  if (includes.length === 0 && benefits.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-3", className)}>
      {includes.length > 0 && (
        <div>
          <p
            className={cn(
              "font-semibold uppercase tracking-[0.16em] text-stone-500",
              isDetail ? "mb-2 text-xs" : "mb-1.5 text-[10px]",
            )}
          >
            Includes
          </p>
          <div className={cn("flex flex-wrap gap-1.5", isDetail && "gap-2")}>
            {includes.map((item) => (
              <span
                key={item}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border border-[#264027]/15 bg-[#264027]/5 font-semibold text-[#264027]",
                  isDetail ? "px-3 py-1.5 text-xs" : "px-2 py-0.5 text-[11px]",
                )}
              >
                <CheckCircle2 className={cn("shrink-0", isDetail ? "h-3.5 w-3.5" : "h-3 w-3")} strokeWidth={2.5} />
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      {benefits.length > 0 && (
        <ul className={cn("space-y-1.5", isDetail && "sm:grid sm:grid-cols-2 sm:gap-x-4 sm:space-y-0")}>
          {benefits.map((item) => (
            <li
              key={item}
              className={cn(
                "flex items-start gap-2 leading-snug text-stone-600",
                isDetail ? "text-sm sm:py-1" : "text-xs",
              )}
            >
              <Check className={cn("mt-0.5 shrink-0 text-[#438764]", isDetail ? "h-4 w-4" : "h-3.5 w-3.5")} strokeWidth={2.5} />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default PayPickupProductFacts;
