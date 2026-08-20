import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STAFF_GARDEN_CLASS_SUBJECT,
  STAFF_SIGNUP_SUBJECT,
} from '../shared/newsletterNotifications.js';
import {
  FALL_GARDEN_WORKSHOP,
  saveWorkshopRegistration,
  submitGardenClassRegistration,
  validateWorkshopRegistration,
} from '../shared/workshopRegistrations.js';

function createWorkshopDb({ failUpsert = false, customerId = 42 } = {}) {
  const rows = [];
  return {
    rows,
    from(table) {
      if (table === 'sp_customers') {
        return {
          select() { return this; },
          ilike() { return this; },
          maybeSingle: async () => ({
            data: customerId == null ? null : { id: customerId },
            error: null,
          }),
        };
      }
      if (table === 'sp_event_registrations') {
        const state = { filters: {}, payload: null, op: 'select', inFilter: null };
        const execute = async () => {
          if (state.op === 'update') {
            const match = rows.find((row) => {
              if (state.filters.id && row.id !== state.filters.id) return false;
              if (state.inFilter?.col === 'admin_notification_status') {
                return state.inFilter.vals.includes(row.admin_notification_status);
              }
              return true;
            });
            if (!match) return { data: null, error: null, count: 0 };
            Object.assign(match, state.payload);
            return { data: { ...match }, error: null, count: 1 };
          }
          if (failUpsert && state.op === 'upsert') {
            return { data: null, error: { message: 'insert failed' } };
          }
          return { data: null, error: null };
        };
        const api = {
          select() { return api; },
          eq(col, val) { state.filters[col] = val; return api; },
          in(col, vals) { state.inFilter = { col, vals }; return api; },
          upsert(row) {
            state.op = 'upsert';
            state.payload = row;
            return api;
          },
          update(row) {
            state.op = 'update';
            state.payload = row;
            return api;
          },
          maybeSingle: async () => {
            if (state.op === 'update') {
              const result = await execute();
              return { data: result.data || null, error: result.error };
            }
            const match = rows.find((row) => (
              row.event_key === state.filters.event_key
              && row.email_normalized === state.filters.email_normalized
            ));
            return { data: match ? { ...match } : null, error: null };
          },
          single: async () => {
            if (state.op === 'update') {
              const result = await execute();
              if (!result.data) return { data: null, error: result.error || { message: 'not found' } };
              return { data: result.data, error: null };
            }
            if (failUpsert) {
              return { data: null, error: { message: 'insert failed' } };
            }
            const existing = rows.find((row) => (
              row.event_key === state.payload.event_key
              && row.email_normalized === state.payload.email_normalized
            ));
            const saved = {
              id: existing?.id || `reg-${rows.length + 1}`,
              created_at: existing?.created_at || '2026-08-20T01:00:00.000Z',
              ...existing,
              ...state.payload,
            };
            if (existing) Object.assign(existing, saved);
            else rows.push(saved);
            return { data: { ...saved }, error: null };
          },
          then(resolve, reject) {
            execute().then(resolve, reject);
          },
        };
        return api;
      }
      throw new Error(`unexpected table ${table}`);
    },
  };
}

function createResend() {
  const sent = [];
  return {
    sent,
    emails: {
      send: async (payload) => {
        sent.push(payload);
        return { data: { id: `re_${sent.length}` } };
      },
    },
  };
}

const classInput = {
  name: 'Jordan Lee',
  email: 'jordan@example.com',
  phone: '6232633386',
  customerCategory: 'home-gardener',
  source: 'fall-garden-workshop-2026-08-website',
  eventUpdatesConsent: true,
  marketingConsent: true,
};

test('class form validation requires an RSVP consent separate from marketing', () => {
  const missingEvent = validateWorkshopRegistration({
    ...classInput,
    eventUpdatesConsent: false,
    marketingConsent: true,
  });
  assert.equal(missingEvent.ok, false);

  const ok = validateWorkshopRegistration(classInput);
  assert.equal(ok.ok, true);
  assert.equal(ok.bot, false);
});

test('a combined class + newsletter submit persists and sends one class staff email', async () => {
  const db = createWorkshopDb();
  const resend = createResend();
  const subscribeCalls = [];

  const result = await submitGardenClassRegistration({
    db,
    input: classInput,
    subscribeNewsletterContact: async (client, payload) => {
      assert.equal(db.rows.length, 1, 'class roster row must exist before newsletter subscribe');
      subscribeCalls.push(payload);
      return { status: 'subscribed', existing: false };
    },
    resend,
    recipients: [{ name: 'Rodolfo Alvarez', email: 'ralvarez@soilseedandwater.com' }],
  });

  assert.equal(result.ok, true);
  assert.equal(result.created, true);
  assert.equal(db.rows.length, 1);
  assert.equal(db.rows[0].event_key, FALL_GARDEN_WORKSHOP.key);
  assert.equal(db.rows[0].email_normalized, 'jordan@example.com');
  assert.equal(db.rows[0].full_name, 'Jordan Lee');
  assert.equal(db.rows[0].admin_notification_status, 'sent');
  assert.equal(subscribeCalls.length, 1);
  assert.equal(resend.sent.length, 1);
  assert.equal(resend.sent[0].subject, STAFF_GARDEN_CLASS_SUBJECT);
  assert.notEqual(resend.sent[0].subject, STAFF_SIGNUP_SUBJECT);
  assert.deepEqual(result.staffSubjects, [STAFF_GARDEN_CLASS_SUBJECT]);
  assert.equal(resend.sent.some((email) => email.subject === STAFF_SIGNUP_SUBJECT), false);
});

test('class staff email is not sent when the registration insert fails', async () => {
  const db = createWorkshopDb({ failUpsert: true });
  const resend = createResend();
  const subscribeCalls = [];

  await assert.rejects(
    () => saveWorkshopRegistration({
      db,
      registration: validateWorkshopRegistration(classInput).registration,
      subscribeNewsletterContact: async (client, payload) => {
        subscribeCalls.push(payload);
        return { status: 'subscribed' };
      },
    }),
    /not saved|insert failed/,
  );

  await assert.rejects(
    () => submitGardenClassRegistration({
      db: createWorkshopDb({ failUpsert: true }),
      input: classInput,
      subscribeNewsletterContact: async () => ({ status: 'subscribed' }),
      resend,
      recipients: [{ name: 'Rodolfo Alvarez', email: 'ralvarez@soilseedandwater.com' }],
    }),
    /not saved|insert failed/,
  );

  assert.equal(resend.sent.length, 0);
});

test('repeat class submit does not send a second staff email', async () => {
  const db = createWorkshopDb();
  const resend = createResend();
  const first = await submitGardenClassRegistration({
    db,
    input: classInput,
    subscribeNewsletterContact: async () => ({ status: 'subscribed' }),
    resend,
    recipients: [{ name: 'Rodolfo Alvarez', email: 'ralvarez@soilseedandwater.com' }],
  });
  const second = await submitGardenClassRegistration({
    db,
    input: classInput,
    subscribeNewsletterContact: async () => ({ status: 'subscribed' }),
    resend,
    recipients: [{ name: 'Rodolfo Alvarez', email: 'ralvarez@soilseedandwater.com' }],
  });

  assert.equal(first.created, true);
  assert.equal(second.created, false);
  assert.equal(db.rows.length, 1);
  assert.equal(resend.sent.length, 1);
  assert.equal(resend.sent[0].subject, STAFF_GARDEN_CLASS_SUBJECT);
});
