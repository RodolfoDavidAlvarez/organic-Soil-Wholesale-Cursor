import { useEffect, useMemo, useState } from "react";
import { Calendar, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getBookableDates,
  getBookableSlots,
  MIN_NOTICE_MS,
  phoenixYmd,
} from "@shared/pickupSchedule.js";

export interface PickupSelection {
  pickupDate: string;
  slotLabel: string;
  pickupAt: string;
}

interface PickupSlotPickerProps {
  value: PickupSelection | null;
  onChange: (selection: PickupSelection | null) => void;
  /** how many days ahead to offer; default 7 */
  daysAhead?: number;
  className?: string;
}

export function PickupSlotPicker({
  value,
  onChange,
  daysAhead = 7,
  className,
}: PickupSlotPickerProps) {
  const todayYmd = phoenixYmd();
  const tomorrowYmd = phoenixYmd(new Date(Date.now() + 86400000));
  const earliestPickupMs = Date.now() + MIN_NOTICE_MS;

  const dates = useMemo(
    () => getBookableDates({ daysAhead, earliestMs: earliestPickupMs }),
    [daysAhead, earliestPickupMs],
  );

  const [selectedDate, setSelectedDate] = useState<string>(
    value?.pickupDate ?? dates[0]?.ymd ?? todayYmd,
  );

  useEffect(() => {
    if (dates.length > 0 && !dates.some((date) => date.ymd === selectedDate)) {
      setSelectedDate(dates[0].ymd);
      onChange(null);
    }
  }, [dates, onChange, selectedDate]);

  const availableSlots = useMemo(
    () => getBookableSlots(selectedDate, earliestPickupMs),
    [selectedDate, earliestPickupMs],
  );

  const handleSlotPick = (slot: { startHour: number; label: string }) => {
    const pickupAt = `${selectedDate}T${String(slot.startHour).padStart(2, "0")}:00:00-07:00`;
    onChange({ pickupDate: selectedDate, slotLabel: slot.label, pickupAt });
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-stone-500">
          <Calendar className="h-3.5 w-3.5 text-[#b38a58]" /> Pickup day
        </div>
        <div className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1">
          {dates.map((d) => {
            const isSelected = d.ymd === selectedDate;
            return (
              <button
                key={d.ymd}
                type="button"
                onClick={() => {
                  setSelectedDate(d.ymd);
                  if (value?.pickupDate !== d.ymd) onChange(null);
                }}
                className={cn(
                  "min-h-[46px] min-w-[118px] shrink-0 snap-start rounded-xl border px-3 py-2 text-center text-sm font-semibold leading-tight transition touch-manipulation",
                  isSelected
                    ? "border-[#264027] bg-[#264027] text-white shadow-sm"
                    : "border-stone-200 bg-white text-stone-700 hover:border-[#264027]/40 hover:bg-[#264027]/5",
                )}
              >
                {d.label === "Today" || d.label === "Tomorrow"
                  ? d.label
                  : d.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-stone-500">
          <Clock className="h-3.5 w-3.5 text-[#b38a58]" /> Slot
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
                    "min-h-[48px] rounded-xl border px-2 py-2.5 text-center text-sm font-bold leading-tight transition touch-manipulation",
                    isSelected
                      ? "border-[#264027] bg-[#264027] text-white shadow-sm"
                      : "border-stone-200 bg-white text-stone-700 hover:border-[#264027]/40 hover:bg-[#264027]/5",
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
