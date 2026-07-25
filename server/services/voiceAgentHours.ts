import {
  CLOSE_HOUR,
  computeAsapPickup,
  formatReadyLabel,
  HOURS_LABEL,
  isOpenPickupDay,
  MIN_NOTICE_MS,
  OPEN_HOUR,
  phoenixParts,
  phoenixYmd,
  READY_IN_MINUTES,
  validateAsapPickupIso,
} from "../../shared/pickupSchedule.js";

export const PICKUP_TIMEZONE = "America/Phoenix";
export const OPEN_HOUR_LOCAL = OPEN_HOUR;
export const CLOSE_HOUR_LOCAL = CLOSE_HOUR;
export const MIN_LEAD_MINUTES = READY_IN_MINUTES;

export type PickupOption = {
  pickupAtIso: string;
  label: string;
  azClock: string;
  dayLabel: string;
};

export type PickupDayHint = "auto" | "today" | "tomorrow";

function formatDayLabel(ymd: string, todayYmd: string, tomorrowYmd: string) {
  if (ymd === todayYmd) return "today";
  if (ymd === tomorrowYmd) return "tomorrow";
  const d = new Date(`${ymd}T12:00:00-07:00`);
  return d.toLocaleDateString("en-US", { weekday: "long", timeZone: PICKUP_TIMEZONE }).toLowerCase();
}

/** Voice agent: offer ASAP ready time (restaurant-style). */
export function getPickupOptions(maxOptions = 1): PickupOption[] {
  const asap = computeAsapPickup();
  if (!asap.ok) return [];

  const parts = phoenixParts(new Date(asap.readyAtIso));
  const todayYmd = phoenixYmd();
  const tomorrowYmd = phoenixYmd(new Date(Date.now() + 86400000));
  const dayLabel = formatDayLabel(parts.ymd, todayYmd, tomorrowYmd);

  const options: PickupOption[] = [
    {
      pickupAtIso: asap.readyAtIso,
      azClock: formatReadyLabel(asap.readyAtIso),
      dayLabel,
      label: asap.readyLabel,
    },
  ];

  return options.slice(0, maxOptions);
}

export type PickupValidation =
  | { ok: true; pickupAtIso: string; label: string }
  | { ok: false; reason: string; message: string };

export function validatePickup(pickupAtIso: string): PickupValidation {
  const normalized = String(pickupAtIso || "").trim().toLowerCase();
  if (!normalized || normalized === "asap") {
    const asap = computeAsapPickup();
    if (!asap.ok) {
      return { ok: false, reason: "unavailable", message: asap.message || "Pickup is not available right now." };
    }
    return {
      ok: true,
      pickupAtIso: asap.readyAtIso,
      label: asap.readyLabel,
    };
  }

  const result = validateAsapPickupIso(pickupAtIso);
  if (!result.ok) {
    return { ok: false, reason: result.reason, message: result.message };
  }
  return {
    ok: true,
    pickupAtIso: result.pickupAtIso,
    label: result.readyLabel,
  };
}

export function isVoicePickupDayOpen(date = new Date()) {
  return isOpenPickupDay(date);
}

export { HOURS_LABEL, MIN_NOTICE_MS };
