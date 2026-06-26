import { useEffect, useMemo, useState } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  computeAsapPickup,
  HOURS_LABEL,
} from "@shared/pickupSchedule.js";

export type PickupReadySelection = {
  readyAt: string;
  readyLabel: string;
  status: "asap" | "scheduled";
};

interface PickupReadyTimeProps {
  value: PickupReadySelection | null;
  onChange: (selection: PickupReadySelection | null) => void;
  className?: string;
  /** Refresh computed ready time on an interval (ms). 0 = no refresh. */
  refreshMs?: number;
}

type AsapResult = ReturnType<typeof computeAsapPickup>;

function toSelection(result: AsapResult): PickupReadySelection | null {
  if (!result.ok) return null;
  return {
    readyAt: result.readyAtIso,
    readyLabel: result.readyLabel,
    status: result.status,
  };
}

export function PickupReadyTime({
  value,
  onChange,
  className,
  refreshMs = 60_000,
}: PickupReadyTimeProps) {
  const [tick, setTick] = useState(0);

  const computed = useMemo(() => computeAsapPickup(), [tick]);

  useEffect(() => {
    const selection = toSelection(computed);
    if (!selection) return;
    if (value?.readyAt !== selection.readyAt || value?.readyLabel !== selection.readyLabel) {
      onChange(selection);
    }
  }, [computed, onChange, value?.readyAt, value?.readyLabel]);

  useEffect(() => {
    if (!refreshMs) return undefined;
    const id = window.setInterval(() => setTick((t) => t + 1), refreshMs);
    return () => window.clearInterval(id);
  }, [refreshMs]);

  const display = value ?? toSelection(computed);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="rounded-xl border border-[#264027]/20 bg-[#264027]/5 px-4 py-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#264027]/10">
            <Clock className="h-5 w-5 text-[#264027]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-base font-bold leading-snug text-stone-900">
              {display?.readyLabel ?? "Calculating ready time…"}
            </p>
            <p className="mt-1 text-sm leading-snug text-stone-600">
              {display?.status === "asap"
                ? "We'll start preparing your order as soon as you pay."
                : "Your order will be prepared for pickup at the next available window."}
            </p>
          </div>
        </div>
      </div>
      <p className="text-xs text-stone-500">{HOURS_LABEL}</p>
    </div>
  );
}

export default PickupReadyTime;
