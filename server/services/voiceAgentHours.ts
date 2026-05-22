export const PICKUP_TIMEZONE = "America/Phoenix";
export const OPEN_HOUR_LOCAL = 8;
export const CLOSE_HOUR_LOCAL = 16;
export const MIN_LEAD_MINUTES = 30;
export const SLOT_INTERVAL_MINUTES = 30;

const AZ_OFFSET_HOURS = -7;

function nowAzParts() {
  const utc = new Date();
  const az = new Date(utc.getTime() + AZ_OFFSET_HOURS * 60 * 60 * 1000);
  return {
    az,
    year: az.getUTCFullYear(),
    month: az.getUTCMonth(),
    day: az.getUTCDate(),
    hour: az.getUTCHours(),
    minute: az.getUTCMinutes(),
  };
}

function azDateToUtcIso(year: number, month: number, day: number, hour: number, minute: number) {
  const utcMs = Date.UTC(year, month, day, hour - AZ_OFFSET_HOURS, minute);
  return new Date(utcMs).toISOString();
}

function formatAzClock(hour: number, minute: number) {
  const h12 = ((hour + 11) % 12) + 1;
  const ampm = hour < 12 ? "AM" : "PM";
  const mm = minute.toString().padStart(2, "0");
  return `${h12}:${mm} ${ampm}`;
}

function formatAzDateLabel(year: number, month: number, day: number, today: { year: number; month: number; day: number }) {
  const isToday = year === today.year && month === today.month && day === today.day;
  if (isToday) return "today";
  const date = new Date(Date.UTC(year, month, day));
  const weekday = date.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
  return weekday.toLowerCase();
}

export type PickupOption = {
  pickupAtIso: string;
  label: string;
  azClock: string;
  dayLabel: string;
};

export type PickupDayHint = "auto" | "today" | "tomorrow";

export function getPickupOptions(maxOptions = 16, forDay: PickupDayHint = "auto"): PickupOption[] {
  const now = nowAzParts();
  let startHour: number;
  let startMin: number;
  let curYear = now.year;
  let curMonth = now.month;
  let curDay = now.day;

  if (forDay === "tomorrow") {
    const tomorrow = new Date(Date.UTC(now.year, now.month, now.day + 1));
    curYear = tomorrow.getUTCFullYear();
    curMonth = tomorrow.getUTCMonth();
    curDay = tomorrow.getUTCDate();
    startHour = OPEN_HOUR_LOCAL;
    startMin = 0;
  } else {
    const earliestMin = now.minute + MIN_LEAD_MINUTES;
    startHour = now.hour;
    startMin = earliestMin;
    while (startMin >= 60) {
      startMin -= 60;
      startHour += 1;
    }
    const remainder = startMin % SLOT_INTERVAL_MINUTES;
    if (remainder !== 0) {
      startMin += SLOT_INTERVAL_MINUTES - remainder;
    }
    while (startMin >= 60) {
      startMin -= 60;
      startHour += 1;
    }
  }

  const options: PickupOption[] = [];
  let curHour = startHour;
  let curMin = startMin;

  for (let safety = 0; safety < 200 && options.length < maxOptions; safety++) {
    if (curHour >= CLOSE_HOUR_LOCAL || (curHour === CLOSE_HOUR_LOCAL - 1 && curMin > 0)) {
      const tomorrow = new Date(Date.UTC(curYear, curMonth, curDay + 1));
      curYear = tomorrow.getUTCFullYear();
      curMonth = tomorrow.getUTCMonth();
      curDay = tomorrow.getUTCDate();
      curHour = OPEN_HOUR_LOCAL;
      curMin = 0;
    }
    if (curHour < OPEN_HOUR_LOCAL) {
      curHour = OPEN_HOUR_LOCAL;
      curMin = 0;
    }
    if (curHour >= CLOSE_HOUR_LOCAL) continue;

    const iso = azDateToUtcIso(curYear, curMonth, curDay, curHour, curMin);
    const azClock = formatAzClock(curHour, curMin);
    const dayLabel = formatAzDateLabel(curYear, curMonth, curDay, now);
    options.push({
      pickupAtIso: iso,
      azClock,
      dayLabel,
      label: `${dayLabel} at ${azClock}`,
    });

    curMin += SLOT_INTERVAL_MINUTES;
    while (curMin >= 60) {
      curMin -= 60;
      curHour += 1;
    }
  }

  return options;
}

export type PickupValidation =
  | { ok: true; pickupAtIso: string; label: string }
  | { ok: false; reason: string; message: string };

export function validatePickup(pickupAtIso: string): PickupValidation {
  const requested = new Date(pickupAtIso);
  if (isNaN(requested.getTime())) {
    return { ok: false, reason: "invalid_date", message: "That pickup time is not a valid date." };
  }
  const now = new Date();
  const diffMin = (requested.getTime() - now.getTime()) / 60000;
  if (diffMin < MIN_LEAD_MINUTES) {
    return {
      ok: false,
      reason: "lead_time",
      message: `Pickup must be at least ${MIN_LEAD_MINUTES} minutes from now.`,
    };
  }
  const azDate = new Date(requested.getTime() + AZ_OFFSET_HOURS * 60 * 60 * 1000);
  const hour = azDate.getUTCHours();
  const minute = azDate.getUTCMinutes();
  if (hour < OPEN_HOUR_LOCAL || hour >= CLOSE_HOUR_LOCAL) {
    return {
      ok: false,
      reason: "outside_hours",
      message: `We are open ${OPEN_HOUR_LOCAL} AM to ${CLOSE_HOUR_LOCAL - 12} PM Arizona time.`,
    };
  }
  return {
    ok: true,
    pickupAtIso: requested.toISOString(),
    label: `${formatAzDateLabel(azDate.getUTCFullYear(), azDate.getUTCMonth(), azDate.getUTCDate(), nowAzParts())} at ${formatAzClock(hour, minute)}`,
  };
}
