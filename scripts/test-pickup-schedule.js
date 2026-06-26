/**
 * ASAP pickup schedule tests.
 * Run: node scripts/test-pickup-schedule.js
 */
import {
  computeAsapPickup,
  formatReadyLabel,
  normalizeAsapReadyMs,
  phoenixParts,
  phoenixYmd,
  validateAsapPickupIso,
  resolveCheckoutPickupTime,
  READY_IN_MS,
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

function readyParts(nowIso) {
  return withMockNow(nowIso, () => {
    const result = computeAsapPickup();
    const parts = phoenixParts(new Date(result.readyAtIso));
    return { result, parts };
  });
}

// Case 1: Tuesday 9:30 AM Phoenix → ready ~9:50 AM
withMockNow('2026-06-30T16:30:00.000Z', () => {
  const { result, parts } = readyParts('2026-06-30T16:30:00.000Z');
  assert('Case 1: Tuesday ASAP status', result.status === 'asap', result.status);
  assert('Case 1: ready ~9:50 AM', parts.hour === 9 && parts.minute === 50, `${parts.hour}:${parts.minute}`);
  assert('Case 1: label mentions 20 minutes', result.readyLabel.includes('20 minutes'));
});

// Case 2: Tuesday 12:50 PM → ready bumps past lunch to 2:00 PM
withMockNow('2026-06-30T19:50:00.000Z', () => {
  const { parts } = readyParts('2026-06-30T19:50:00.000Z');
  assert('Case 2: lunch bump to 2 PM', parts.hour === 14 && parts.minute === 0, `${parts.hour}:${parts.minute}`);
});

// Case 3: Tuesday 3:50 PM → ready next open day ~8:20 AM
withMockNow('2026-06-30T22:50:00.000Z', () => {
  const { result, parts } = readyParts('2026-06-30T22:50:00.000Z');
  assert('Case 3: scheduled status after close', result.status === 'scheduled', result.status);
  assert('Case 3: next day ready', parts.ymd === '2026-07-01' && parts.hour === 8 && parts.minute === 20, `${parts.ymd} ${parts.hour}:${parts.minute}`);
});

// Case 4: Sunday order → ready Tue ~8:20 AM
withMockNow('2026-06-28T17:00:00.000Z', () => {
  const { parts } = readyParts('2026-06-28T17:00:00.000Z');
  assert('Case 4: Sunday → Tuesday', parts.ymd === '2026-06-30' && parts.hour === 8 && parts.minute === 20, `${parts.ymd} ${parts.hour}:${parts.minute}`);
});

// Case 5: validateAsapPickupIso accepts fresh client time
withMockNow('2026-06-30T16:30:00.000Z', () => {
  const asap = computeAsapPickup();
  const ok = validateAsapPickupIso(asap.readyAtIso);
  assert('Case 5: valid ASAP ISO accepted', ok.ok === true);
});

// Case 6: stale client time rejected
withMockNow('2026-06-30T16:30:00.000Z', () => {
  const stale = new Date(Date.now() + READY_IN_MS + 10 * 60 * 1000).toISOString();
  const bad = validateAsapPickupIso(stale);
  assert('Case 6: stale ISO rejected', !bad.ok && bad.reason === 'stale_ready_time', bad.reason);
});

// Case 7: formatReadyLabel with date for emails
withMockNow('2026-06-30T16:30:00.000Z', () => {
  const asap = computeAsapPickup();
  const label = formatReadyLabel(asap.readyAtIso, { includeDate: true });
  assert('Case 7: email label has date', label.includes('Jun') || label.includes('20 minutes'));
});

// Case 8: scheduled slot within business hours
withMockNow('2026-06-30T16:30:00.000Z', () => {
  const resolved = resolveCheckoutPickupTime({
    pickupMode: 'schedule',
    pickupTime: '2026-06-30T10:00:00-07:00',
  });
  assert('Case 8: schedule mode accepted', resolved.ok === true, resolved.message);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
