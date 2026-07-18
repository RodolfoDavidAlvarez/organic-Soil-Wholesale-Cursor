import { useEffect, useMemo, useState } from "react";
import { Clock, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  computeAsapPickup,
  HOURS_LABEL,
} from "@shared/pickupSchedule.js";
import { PickupSlotPicker, type PickupSelection } from "@/components/PickupSlotPicker";

export type PickupTimingMode = "asap" | "schedule";

export type PickupReadySelection = {
  pickupMode: PickupTimingMode;
  readyAt: string;
  readyLabel: string;
  status: "asap" | "scheduled";
  /** Set when pickupMode === 'schedule' */
  slotLabel?: string;
};

interface PickupReadyTimeProps {
  value: PickupReadySelection | null;
  onChange: (selection: PickupReadySelection | null) => void;
  className?: string;
  refreshMs?: number;
  allowAsap?: boolean;
  minLeadDays?: number;
  scheduleHelpText?: string;
}

type AsapResult = ReturnType<typeof computeAsapPickup>;

function asapSelection(result: AsapResult): PickupReadySelection | null {
  if (!result.ok) return null;
  return {
    pickupMode: "asap",
    readyAt: result.readyAtIso,
    readyLabel: result.readyLabel,
    status: result.status,
  };
}

function scheduleSelection(slot: PickupSelection): PickupReadySelection {
  return {
    pickupMode: "schedule",
    readyAt: slot.pickupAt,
    readyLabel: `Pickup ${slot.slotLabel}`,
    status: "scheduled",
    slotLabel: slot.slotLabel,
  };
}

export function PickupReadyTime({
  value,
  onChange,
  className,
  refreshMs = 60_000,
  allowAsap = true,
  minLeadDays = 0,
  scheduleHelpText,
}: PickupReadyTimeProps) {
  const [mode, setMode] = useState<PickupTimingMode>(allowAsap ? (value?.pickupMode ?? "asap") : "schedule");
  const [tick, setTick] = useState(0);
  const [scheduleSlot, setScheduleSlot] = useState<PickupSelection | null>(
    value?.pickupMode === "schedule" && value.readyAt
      ? {
          pickupDate: value.readyAt.slice(0, 10),
          slotLabel: value.slotLabel ?? value.readyLabel,
          pickupAt: value.readyAt,
        }
      : null,
  );

  const computedAsap = useMemo(() => computeAsapPickup(), [tick]);

  useEffect(() => {
    if (!allowAsap && mode !== "schedule") {
      setMode("schedule");
      onChange(null);
    }
  }, [allowAsap, mode, onChange]);

  useEffect(() => {
    if (mode !== "asap") return;
    const selection = asapSelection(computedAsap);
    if (!selection) return;
    if (
      value?.pickupMode !== "asap" ||
      value.readyAt !== selection.readyAt ||
      value.readyLabel !== selection.readyLabel
    ) {
      onChange(selection);
    }
  }, [computedAsap, mode, onChange, value?.pickupMode, value?.readyAt, value?.readyLabel]);

  useEffect(() => {
    if (mode !== "schedule") return;
    if (scheduleSlot) {
      onChange(scheduleSelection(scheduleSlot));
    } else {
      onChange(null);
    }
  }, [mode, scheduleSlot, onChange]);

  useEffect(() => {
    if (!refreshMs || mode !== "asap") return undefined;
    const id = window.setInterval(() => setTick((t) => t + 1), refreshMs);
    return () => window.clearInterval(id);
  }, [refreshMs, mode]);

  const displayAsap = value?.pickupMode === "asap" ? value : asapSelection(computedAsap);

  return (
    <div className={cn("space-y-4", className)}>
      <div className={cn("grid gap-2", allowAsap ? "grid-cols-2" : "grid-cols-1")}>
        {allowAsap && (
        <button
          type="button"
          onClick={() => setMode("asap")}
          className={cn(
            "flex min-h-[52px] flex-col items-start justify-center gap-0.5 rounded-xl border px-3 py-2.5 text-left transition touch-manipulation",
            mode === "asap"
              ? "border-[#264027] bg-[#264027]/10 text-[#264027] shadow-[inset_0_0_0_1px_#264027]"
              : "border-stone-200 bg-white text-stone-700 hover:border-stone-400",
          )}
        >
          <span className="flex items-center gap-1.5 text-sm font-bold">
            <Clock className="h-4 w-4" /> ASAP
          </span>
          <span className="text-[11px] font-medium text-stone-500">Ready in ~30 min</span>
        </button>
        )}
        <button
          type="button"
          onClick={() => setMode("schedule")}
          className={cn(
            "flex min-h-[52px] flex-col items-start justify-center gap-0.5 rounded-xl border px-3 py-2.5 text-left transition touch-manipulation",
            mode === "schedule"
              ? "border-[#264027] bg-[#264027]/10 text-[#264027] shadow-[inset_0_0_0_1px_#264027]"
              : "border-stone-200 bg-white text-stone-700 hover:border-stone-400",
          )}
        >
          <span className="flex items-center gap-1.5 text-sm font-bold">
            <Calendar className="h-4 w-4" /> Schedule
          </span>
          <span className="text-[11px] font-medium text-stone-500">
            {minLeadDays > 0 ? `At least ${minLeadDays} days out` : "Pick a time slot"}
          </span>
        </button>
      </div>

      {mode === "asap" ? (
        <div className="rounded-xl border border-[#264027]/20 bg-[#264027]/5 px-4 py-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#264027]/10">
              <Clock className="h-5 w-5 text-[#264027]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-base font-bold leading-snug text-stone-900">
                {displayAsap?.readyLabel ?? "Calculating ready time…"}
              </p>
              <p className="mt-1 text-sm leading-snug text-stone-600">
                {displayAsap?.status === "asap"
                  ? "We'll start preparing your order as soon as you pay."
                  : "Your order will be prepared for the next available window."}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {scheduleHelpText && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm font-medium leading-snug text-amber-900">
              {scheduleHelpText}
            </p>
          )}
          <PickupSlotPicker value={scheduleSlot} onChange={setScheduleSlot} minLeadDays={minLeadDays} />
        </>
      )}

      <p className="text-xs text-stone-500">{HOURS_LABEL}</p>
    </div>
  );
}

export default PickupReadyTime;
