import {
  getBookableDates,
  getBookableSlots,
  HOURS_LABEL,
  MIN_NOTICE_MS,
  OPEN_DAYS,
  phoenixParts,
  phoenixWeekday,
  phoenixYmd,
  validatePickupIso,
} from "../../shared/pickupSchedule.js";

export const PICKUP_TIMEZONE = "America/Phoenix";
export const OPEN_HOUR_LOCAL = 8;
export const CLOSE_HOUR_LOCAL = 16;
export const MIN_LEAD_MINUTES = 30;

export type PickupOption = {
  pickupAtIso: string;
  label: string;
  azClock: string;
  dayLabel: string;
};

export type PickupDayHint = "auto" | "today" | "tomorrow";

function slotToIso(ymd: string, startHour: number) {
  return new Date(`${ymd}T${String(startHour).padStart(2, "0")}:00:00-07:00`).toISOString();
}

function formatDayLabel(ymd: string, todayYmd: string, tomorrowYmd: string) {
  if (ymd === todayYmd) return "today";
  if (ymd === tomorrowYmd) return "tomorrow";
  const d = new Date(`${ymd}T12:00:00-07:00`);
  return d.toLocaleDateString("en-US", { weekday: "long", timeZone: PICKUP_TIMEZONE }).toLowerCase();
}

export function getPickupOptions(maxOptions = 16, forDay: PickupDayHint = "auto"): PickupOption[] {
  const now = new Date();
  const todayYmd = phoenixYmd(now);
  const tomorrowYmd = phoenixYmd(new Date(now.getTime() + 86400000));
  const earliestMs = Date.now() + MIN_NOTICE_MS;

  const dates =
    forDay === "tomorrow"
      ? [{ ymd: tomorrowYmd, label: "Tomorrow" }]
      : forDay === "today"
        ? [{ ymd: todayYmd, label: "Today" }]
        : getBookableDates({ daysAhead: 14, earliestMs });

  const options: PickupOption[] = [];
  for (const date of dates) {
    for (const slot of getBookableSlots(date.ymd, earliestMs)) {
      const pickupAtIso = slotToIso(date.ymd, slot.startHour);
      const dayLabel = formatDayLabel(date.ymd, todayYmd, tomorrowYmd);
      options.push({
        pickupAtIso,
        azClock: slot.label.split(" – ")[0],
        dayLabel,
        label: `${dayLabel} at ${slot.label}`,
      });
      if (options.length >= maxOptions) return options;
    }
  }
  return options;
}

export type PickupValidation =
  | { ok: true; pickupAtIso: string; label: string }
  | { ok: false; reason: string; message: string };

export function validatePickup(pickupAtIso: string): PickupValidation {
  const result = validatePickupIso(pickupAtIso);
  if (!result.ok) {
    return { ok: false, reason: result.reason, message: result.message };
  }
  const parts = phoenixParts(new Date(result.pickupAtIso));
  const todayYmd = phoenixYmd();
  const tomorrowYmd = phoenixYmd(new Date(Date.now() + 86400000));
  const dayLabel = formatDayLabel(parts.ymd, todayYmd, tomorrowYmd);
  const hourLabel =
    parts.hour === 12
      ? "12 PM"
      : parts.hour < 12
        ? `${parts.hour} AM`
        : `${parts.hour - 12} PM`;
  return {
    ok: true,
    pickupAtIso: result.pickupAtIso,
    label: `${dayLabel} at ${hourLabel}`,
  };
}

export function isVoicePickupDayOpen(date = new Date()) {
  return OPEN_DAYS.has(phoenixWeekday(phoenixYmd(date)));
}

export { HOURS_LABEL };
