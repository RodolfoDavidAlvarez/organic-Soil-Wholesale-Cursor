import { useEffect, useMemo, useState } from "react";
import { Calendar, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Pickup slot configuration (confirmed with Rodo, May 2026).
 * Schedule: 8 AM – 4 PM with a break from 12 PM – 2 PM.
 * 6 one-hour slots per day.
 */
const SLOTS: { startHour: number; label: string }[] = [
  { startHour: 8, label: "8 – 9 AM" },
  { startHour: 9, label: "9 – 10 AM" },
  { startHour: 10, label: "10 – 11 AM" },
  { startHour: 11, label: "11 AM – 12 PM" },
  { startHour: 14, label: "2 – 3 PM" },
  { startHour: 15, label: "3 – 4 PM" },
];

const MIN_PICKUP_NOTICE_MS = 24 * 60 * 60 * 1000;

export interface PickupSelection {
  /** Date in YYYY-MM-DD (Phoenix local) */
  pickupDate: string;
  /** "8 – 9 AM", etc. */
  slotLabel: string;
  /** Full ISO timestamp at the slot's start hour, Phoenix local */
  pickupAt: string;
}

interface PickupSlotPickerProps {
  value: PickupSelection | null;
  onChange: (selection: PickupSelection | null) => void;
  /** how many days ahead to offer; default 7 */
  daysAhead?: number;
  className?: string;
}

function phoenixNow(): Date {
  // Arizona doesn't observe DST so MST is always UTC-7
  const utc = new Date();
  return new Date(utc.getTime() - 7 * 60 * 60 * 1000);
}

function ymd(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function prettyDate(ymdStr: string, todayYmd: string, tomorrowYmd: string): string {
  if (ymdStr === todayYmd) return "Today";
  if (ymdStr === tomorrowYmd) return "Tomorrow";
  const d = new Date(`${ymdStr}T12:00:00Z`);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function slotStartMs(ymdStr: string, startHour: number): number {
  return Date.parse(`${ymdStr}T${String(startHour).padStart(2, "0")}:00:00-07:00`);
}

export function PickupSlotPicker({
  value,
  onChange,
  daysAhead = 7,
  className,
}: PickupSlotPickerProps) {
  const today = phoenixNow();
  const todayYmd = ymd(today);
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const tomorrowYmd = ymd(tomorrow);
  const earliestPickupMs = Date.now() + MIN_PICKUP_NOTICE_MS;

  // Build upcoming days, only keeping dates with at least one slot 24+ hours out.
  const dates = useMemo(() => {
    const out: { ymdStr: string; label: string }[] = [];
    for (let i = 0; out.length < daysAhead && i < daysAhead + 3; i++) {
      const d = new Date(today.getTime() + i * 24 * 60 * 60 * 1000);
      const ymdStr = ymd(d);
      const hasAvailableSlot = SLOTS.some((slot) => slotStartMs(ymdStr, slot.startHour) >= earliestPickupMs);
      if (hasAvailableSlot) {
        out.push({ ymdStr, label: prettyDate(ymdStr, todayYmd, tomorrowYmd) });
      }
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayYmd, daysAhead, earliestPickupMs]);

  const [selectedDate, setSelectedDate] = useState<string>(value?.pickupDate ?? dates[0]?.ymdStr ?? todayYmd);

  useEffect(() => {
    if (dates.length > 0 && !dates.some((date) => date.ymdStr === selectedDate)) {
      setSelectedDate(dates[0].ymdStr);
      onChange(null);
    }
  }, [dates, onChange, selectedDate]);

  // Only show slots that are at least 24 hours from now.
  const availableSlots = useMemo(() => {
    return SLOTS.filter((slot) => slotStartMs(selectedDate, slot.startHour) >= earliestPickupMs);
  }, [selectedDate, earliestPickupMs]);

  const handleSlotPick = (slot: { startHour: number; label: string }) => {
    // Build ISO at slot start, Phoenix local (MST = UTC-7)
    const pickupAt = `${selectedDate}T${String(slot.startHour).padStart(2, "0")}:00:00-07:00`;
    onChange({ pickupDate: selectedDate, slotLabel: slot.label, pickupAt });
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Date scroller */}
      <div>
        <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-500">
          <Calendar className="h-3.5 w-3.5" /> Pickup day
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {dates.map((d) => {
            const isSelected = d.ymdStr === selectedDate;
            return (
              <button
                key={d.ymdStr}
                type="button"
                onClick={() => {
                  setSelectedDate(d.ymdStr);
                  if (value?.pickupDate !== d.ymdStr) onChange(null);
                }}
                className={cn(
                  "shrink-0 min-w-[78px] rounded-xl border px-3 py-2 text-center text-sm font-medium transition",
                  isSelected
                    ? "border-[#264027] bg-[#264027] text-white shadow-sm"
                    : "border-stone-200 bg-white text-stone-700 hover:border-stone-400"
                )}
              >
                {d.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Slot grid */}
      <div>
        <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-500">
          <Clock className="h-3.5 w-3.5" /> Slot
        </div>
        {availableSlots.length === 0 ? (
          <p className="rounded-lg bg-stone-50 px-3 py-2.5 text-sm text-stone-500">
            No available slots on this day. Pick another day above.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {availableSlots.map((slot) => {
              const isSelected =
                value?.pickupDate === selectedDate && value?.slotLabel === slot.label;
              return (
                <button
                  key={slot.label}
                  type="button"
                  onClick={() => handleSlotPick(slot)}
                  className={cn(
                    "rounded-xl border px-3 py-2.5 text-center text-sm font-semibold transition",
                    isSelected
                      ? "border-[#264027] bg-[#264027] text-white shadow-sm"
                      : "border-stone-200 bg-white text-stone-700 hover:border-stone-400"
                  )}
                >
                  {slot.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default PickupSlotPicker;
