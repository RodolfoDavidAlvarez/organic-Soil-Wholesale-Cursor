/**
 * OSW pickup schedule — single source of truth (America/Phoenix).
 * Open Tue-Sat 8 AM-4 PM, closed 1-2 PM lunch, same-day with 30 min notice.
 */

export const PICKUP_TIMEZONE = 'America/Phoenix';
export const OPEN_DAYS = new Set([2, 3, 4, 5, 6]); // Tue-Sat
export const SLOT_START_HOURS = [8, 9, 10, 11, 14, 15];
export const LUNCH_START_HOUR = 13;
export const LUNCH_END_HOUR = 14;
export const OPEN_HOUR = 8;
export const CLOSE_HOUR = 16;
export const MIN_NOTICE_MS = 30 * 60 * 1000;
export const SAME_DAY_CUTOFF_HOUR = 16;
export const HOURS_LABEL = 'Tue-Sat, 8 AM-4 PM (closed 1-2 PM)';
export const PICKUP_ADDRESS = '1634 N 19th Ave, Phoenix, AZ 85009';

export const PICKUP_SLOTS = SLOT_START_HOURS.map((startHour) => ({
  startHour,
  label: formatSlotLabel(startHour),
}));

function formatSlotLabel(startHour) {
  const endHour = startHour + 1;
  const fmt = (h) => {
    if (h === 12) return '12 PM';
    if (h < 12) return `${h} AM`;
    return `${h - 12} PM`;
  };
  if (startHour === 11) return '11 AM – 12 PM';
  return `${fmt(startHour)} – ${fmt(endHour)}`;
}

export function phoenixYmd(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: PICKUP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function phoenixParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: PICKUP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(date);
  const get = (type) => parts.find((p) => p.type === type)?.value ?? '';
  let hour = Number(get('hour'));
  if (hour === 24) hour = 0;
  return {
    ymd: `${get('year')}-${get('month')}-${get('day')}`,
    hour,
    minute: Number(get('minute')),
  };
}

export function phoenixWeekday(ymd) {
  return new Date(`${ymd}T12:00:00-07:00`).getUTCDay();
}

export function isOpenPickupDay(ymdOrDate) {
  const ymd = typeof ymdOrDate === 'string' ? ymdOrDate : phoenixYmd(ymdOrDate);
  return OPEN_DAYS.has(phoenixWeekday(ymd));
}

export function slotStartMs(ymd, startHour) {
  return Date.parse(`${ymd}T${String(startHour).padStart(2, '0')}:00:00-07:00`);
}

export function prettyDateLabel(ymd, todayYmd, tomorrowYmd) {
  if (ymd === todayYmd) return 'Today';
  if (ymd === tomorrowYmd) return 'Tomorrow';
  const d = new Date(`${ymd}T12:00:00-07:00`);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: PICKUP_TIMEZONE,
  });
}

export function getBookableSlots(ymd, earliestMs = Date.now() + MIN_NOTICE_MS) {
  if (!isOpenPickupDay(ymd)) return [];
  return PICKUP_SLOTS.filter((slot) => slotStartMs(ymd, slot.startHour) >= earliestMs);
}

export function getBookableDates({ daysAhead = 7, earliestMs = Date.now() + MIN_NOTICE_MS } = {}) {
  const now = new Date();
  const todayYmd = phoenixYmd(now);
  const tomorrowYmd = phoenixYmd(new Date(now.getTime() + 86400000));
  const out = [];

  for (let i = 0; out.length < daysAhead && i < daysAhead + 14; i++) {
    const d = new Date(now.getTime() + i * 86400000);
    const ymd = phoenixYmd(d);
    if (getBookableSlots(ymd, earliestMs).length > 0) {
      out.push({ ymd, label: prettyDateLabel(ymd, todayYmd, tomorrowYmd) });
    }
  }
  return out;
}

export function computeLeadDays({ allYardAvailable, maxLeadDays = 7 }) {
  const { hour } = phoenixParts();
  if (allYardAvailable && hour < SAME_DAY_CUTOFF_HOUR) return 0;
  return maxLeadDays;
}

function addDaysYmd(startYmd, days) {
  const d = new Date(`${startYmd}T12:00:00-07:00`);
  d.setUTCDate(d.getUTCDate() + days);
  return phoenixYmd(d);
}

export function advanceYmdToOpenDay(ymd) {
  let cur = ymd;
  for (let i = 0; i < 14; i++) {
    if (isOpenPickupDay(cur)) return cur;
    cur = addDaysYmd(cur, 1);
  }
  return cur;
}

export function getAvailableDatesForProducts({
  allYardAvailable = false,
  maxLeadDays = 7,
  maxDates = 20,
} = {}) {
  const leadDays = computeLeadDays({ allYardAvailable, maxLeadDays });
  const startYmd = advanceYmdToOpenDay(addDaysYmd(phoenixYmd(), leadDays));
  const dates = [];
  let cur = startYmd;

  for (let i = 0; i < 45 && dates.length < maxDates; i++) {
    if (isOpenPickupDay(cur)) dates.push(cur);
    cur = addDaysYmd(cur, 1);
  }

  return {
    earliest_date: dates[0] ?? startYmd,
    available_dates: dates,
    max_lead_days: maxLeadDays,
    all_yard_available: allYardAvailable,
  };
}

export function getTimeSlotsForDate(dateYmd) {
  if (!isOpenPickupDay(dateYmd)) {
    return { slots: [], message: 'Pickup available Tue-Sat only' };
  }
  const earliestMs = Date.now() + MIN_NOTICE_MS;
  const slots = getBookableSlots(dateYmd, earliestMs).map((slot) => ({
    time: slot.label,
    available: true,
    startHour: slot.startHour,
  }));
  return { date: dateYmd, slots };
}

/**
 * @returns {{ ok: true, pickupAtIso: string } | { ok: false, reason: string, message: string }}
 */
export function validatePickupIso(pickupAtIso) {
  if (!pickupAtIso || typeof pickupAtIso !== 'string') {
    return { ok: false, reason: 'missing', message: 'Pickup time is required.' };
  }

  const requested = new Date(pickupAtIso);
  if (Number.isNaN(requested.getTime())) {
    return { ok: false, reason: 'invalid_date', message: 'That pickup time is not valid.' };
  }

  const diffMs = requested.getTime() - Date.now();
  if (diffMs < MIN_NOTICE_MS) {
    return {
      ok: false,
      reason: 'lead_time',
      message: 'Pickup must be at least 30 minutes from now.',
    };
  }

  const parts = phoenixParts(requested);
  const { ymd, hour, minute } = parts;

  if (!isOpenPickupDay(ymd)) {
    return {
      ok: false,
      reason: 'closed_day',
      message: `Pickup is available ${HOURS_LABEL}.`,
    };
  }

  if (minute !== 0) {
    return {
      ok: false,
      reason: 'invalid_slot',
      message: 'Please choose a full-hour pickup slot.',
    };
  }

  if (!SLOT_START_HOURS.includes(hour)) {
    return {
      ok: false,
      reason: 'outside_hours',
      message: `Pickup slots are ${HOURS_LABEL}.`,
    };
  }

  if (hour >= LUNCH_START_HOUR && hour < LUNCH_END_HOUR) {
    return {
      ok: false,
      reason: 'lunch_break',
      message: 'We are closed 1-2 PM for lunch.',
    };
  }

  const expectedMs = slotStartMs(ymd, hour);
  if (requested.getTime() !== expectedMs) {
    return {
      ok: false,
      reason: 'invalid_slot',
      message: 'Please choose a valid pickup slot from the list.',
    };
  }

  return { ok: true, pickupAtIso: requested.toISOString() };
}
