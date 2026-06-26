/**
 * Local pickup schedule test checklist (plan cases 1-7).
 * Run: node scripts/test-pickup-schedule.js
 */
import {
  getBookableDates,
  getBookableSlots,
  isOpenPickupDay,
  phoenixParts,
  phoenixWeekday,
  phoenixYmd,
  validatePickupIso,
  MIN_NOTICE_MS,
} from '../shared/pickupSchedule.js';

let passed = 0;
let failed = 0;

function assert(name, cond, detail = '') {
  if (cond) {
    passed += 1;
    console.log(`✓ ${name}`);
  } else {
    failed += 1;
    console.error(`✗ ${name}${detail ? `: ${detail}` : ''}`);
  }
}

function withMockNow(iso, fn) {
  const RealDate = Date;
  const fixed = new RealDate(iso).getTime();
  // eslint-disable-next-line no-global-assign
  global.Date = class extends RealDate {
    constructor(...args) {
      if (args.length === 0) super(fixed);
      else super(...args);
    }
    static now() {
      return fixed;
    }
  };
  try {
    return fn();
  } finally {
    global.Date = RealDate;
  }
}

// Case 1: Tuesday ~9:30 AM Phoenix — Today visible; slots 10-11, 11-12, 2-3, 3-4
withMockNow('2026-06-30T16:30:00.000Z', () => {
  const ymd = phoenixYmd();
  assert('Case 1: Tuesday', phoenixWeekday(ymd) === 2, ymd);
  const dates = getBookableDates({ daysAhead: 7, earliestMs: Date.now() + MIN_NOTICE_MS });
  assert('Case 1: Today in dates', dates[0]?.label === 'Today');
  const slots = getBookableSlots(ymd, Date.now() + MIN_NOTICE_MS).map((s) => s.label);
  assert('Case 1: slot labels', JSON.stringify(slots) === JSON.stringify(['10 AM – 11 AM', '11 AM – 12 PM', '2 PM – 3 PM', '3 PM – 4 PM']), slots.join(', '));
});

// Case 2: Sunday — no Today; first day is Tuesday
withMockNow('2026-06-28T17:00:00.000Z', () => {
  const dates = getBookableDates({ daysAhead: 7, earliestMs: Date.now() + MIN_NOTICE_MS });
  assert('Case 2: not Sunday bookable', !isOpenPickupDay(phoenixYmd()));
  assert('Case 2: no Today', dates.every((d) => d.label !== 'Today'));
  assert('Case 2: first open day Tue', phoenixWeekday(dates[0]?.ymd) === 2, dates[0]?.ymd);
});

// Case 3: Monday — no Monday in date list
withMockNow('2026-06-29T17:00:00.000Z', () => {
  const dates = getBookableDates({ daysAhead: 7, earliestMs: Date.now() + MIN_NOTICE_MS });
  assert('Case 3: Monday closed', phoenixWeekday(phoenixYmd()) === 1);
  assert('Case 3: no Monday dates', dates.every((d) => phoenixWeekday(d.ymd) !== 1));
});

// Case 4: Saturday — appears with full slot grid (mock Fri evening so Sat has slots)
withMockNow('2026-07-03T04:00:00.000Z', () => {
  const sat = '2026-07-04';
  assert('Case 4: Saturday open', isOpenPickupDay(sat));
  const slots = getBookableSlots(sat, Date.now() + MIN_NOTICE_MS).map((s) => s.label);
  assert('Case 4: six slots', slots.length === 6, slots.join(', '));
});

// Case 5: 12:30 PM — no 1 PM slot; 2 PM earliest afternoon
withMockNow('2026-06-30T19:30:00.000Z', () => {
  const ymd = phoenixYmd();
  const slots = getBookableSlots(ymd, Date.now() + MIN_NOTICE_MS).map((s) => s.startHour);
  assert('Case 5: no lunch slot', !slots.includes(13));
  assert('Case 5: 2 PM included', slots.includes(14));
});

// Case 6: 3:45 PM — no same-day slots
withMockNow('2026-06-30T22:45:00.000Z', () => {
  const ymd = phoenixYmd();
  const slots = getBookableSlots(ymd, Date.now() + MIN_NOTICE_MS);
  assert('Case 6: no same-day slots after 3:45 PM', slots.length === 0);
  const dates = getBookableDates({ daysAhead: 3, earliestMs: Date.now() + MIN_NOTICE_MS });
  assert('Case 6: earliest not today', dates[0]?.ymd !== ymd, dates[0]?.ymd);
});

// Case 7: invalid pickupTime rejected
const bad = validatePickupIso('2026-06-30T13:00:00-07:00');
assert('Case 7: lunch rejected', !bad.ok && bad.reason === 'outside_hours', bad.reason);
const missing = validatePickupIso('');
assert('Case 7: missing rejected', !missing.ok);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
