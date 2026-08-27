import assert from 'node:assert/strict';
import {
  STAFF_GARDEN_CLASS_SUBJECT,
  STAFF_GARDEN_CLASS_THREAD_ID,
  STAFF_NEWSLETTER_THREAD_ID,
  STAFF_SIGNUP_SUBJECT,
  buildGardenClassAdminNotification,
  buildNewsletterAdminNotification,
  isGardenClassRegistrationSource,
  sendNewsletterAdminNotifications,
} from '../shared/newsletterNotifications.js';
import {
  FALL_GARDEN_WORKSHOP,
  submitGardenClassRegistration,
} from '../shared/workshopRegistrations.js';
import {
  STAFF_CLASS_SURVEY_SUBJECT,
  STAFF_CLASS_SURVEY_THREAD_ID,
  STAFF_YARD_SURVEY_SUBJECT,
  STAFF_YARD_SURVEY_THREAD_ID,
} from '../shared/surveyStaffAlerts.js';

const newsletter = buildNewsletterAdminNotification({
  subscriber: { name: 'Alex Rivera', email: 'alex@example.com', source: 'website_newsletter_signup' },
  testing: false,
});
const gardenClass = buildGardenClassAdminNotification({
  registration: {
    full_name: 'Jordan Lee',
    email: 'jordan@example.com',
    phone: '6232633386',
    source: 'fall-garden-workshop-2026-08-website',
    event_name: 'The Garden Reset',
  },
  testing: false,
});

assert.equal(newsletter.subject, 'SSW signup');
assert.equal(STAFF_SIGNUP_SUBJECT, 'SSW signup');
assert.equal(gardenClass.subject, 'New Garden Class Registration');
assert.equal(STAFF_GARDEN_CLASS_SUBJECT, 'New Garden Class Registration');
assert.notEqual(newsletter.subject, gardenClass.subject);
assert.doesNotMatch(newsletter.subject, /Alex|Jordan/);
assert.doesNotMatch(gardenClass.subject, /Alex|Jordan/);
assert.equal(newsletter.headers['In-Reply-To'], STAFF_NEWSLETTER_THREAD_ID);
assert.equal(gardenClass.headers['In-Reply-To'], STAFF_GARDEN_CLASS_THREAD_ID);
assert.notEqual(newsletter.headers['In-Reply-To'], gardenClass.headers['In-Reply-To']);
assert.equal(isGardenClassRegistrationSource('fall-garden-workshop-2026-08-website'), true);
assert.throws(
  () => buildNewsletterAdminNotification({
    subscriber: { name: 'Jordan Lee', email: 'jordan@example.com', source: 'fall-garden-workshop-2026-08-website' },
    testing: false,
  }),
  /cannot use the SSW signup staff alert/,
);

const rows = [];
const db = {
  from(table) {
    if (table === 'sp_customers') {
      return {
        select() { return this; },
        ilike() { return this; },
        maybeSingle: async () => ({ data: { id: 42 }, error: null }),
      };
    }
    const state = { filters: {}, payload: null, op: 'select', inFilter: null };
    const executeUpdate = async () => {
      const match = rows.find((row) => {
        if (state.filters.id && row.id !== state.filters.id) return false;
        if (state.inFilter?.col === 'admin_notification_status') {
          return state.inFilter.vals.includes(row.admin_notification_status);
        }
        return true;
      });
      if (!match) return { data: null, error: null };
      Object.assign(match, state.payload);
      return { data: { ...match }, error: null };
    };
    const api = {
      select() { return api; },
      eq(col, val) { state.filters[col] = val; return api; },
      in(col, vals) { state.inFilter = { col, vals }; return api; },
      upsert(row) { state.op = 'upsert'; state.payload = row; return api; },
      update(row) { state.op = 'update'; state.payload = row; return api; },
      maybeSingle: async () => {
        if (state.op === 'update') return executeUpdate();
        const match = rows.find((row) => row.event_key === state.filters.event_key && row.email_normalized === state.filters.email_normalized);
        return { data: match ? { ...match } : null, error: null };
      },
      single: async () => {
        if (state.op === 'update') return executeUpdate();
        const saved = {
          id: `reg-${rows.length + 1}`,
          created_at: '2026-08-20T01:00:00.000Z',
          ...state.payload,
        };
        rows.push(saved);
        return { data: { ...saved }, error: null };
      },
      then(resolve, reject) { executeUpdate().then(resolve, reject); },
    };
    return api;
  },
};

const sent = [];
const result = await submitGardenClassRegistration({
  db,
  input: {
    name: 'Jordan Lee',
    email: 'jordan@example.com',
    phone: '6232633386',
    customerCategory: 'home-gardener',
    source: 'fall-garden-workshop-2026-08-website',
    eventUpdatesConsent: true,
    marketingConsent: true,
  },
  subscribeNewsletterContact: async () => {
    assert.equal(rows.length, 1, 'roster row must exist before newsletter subscribe');
    return { status: 'subscribed' };
  },
  resend: {
    emails: {
      send: async (payload) => {
        sent.push(payload);
        return { data: { id: `re_${sent.length}` } };
      },
    },
  },
  recipients: [{ name: 'Rodolfo Alvarez', email: 'ralvarez@soilseedandwater.com' }],
});

assert.equal(result.ok, true);
assert.equal(rows.length, 1);
assert.equal(rows[0].event_key, FALL_GARDEN_WORKSHOP.key);
assert.equal(sent.length, 1);
assert.equal(sent[0].subject, STAFF_GARDEN_CLASS_SUBJECT);
assert.notEqual(sent[0].subject, STAFF_SIGNUP_SUBJECT);
assert.notEqual(STAFF_YARD_SURVEY_SUBJECT, STAFF_SIGNUP_SUBJECT);
assert.notEqual(STAFF_CLASS_SURVEY_SUBJECT, STAFF_GARDEN_CLASS_SUBJECT);
assert.notEqual(STAFF_YARD_SURVEY_THREAD_ID, STAFF_NEWSLETTER_THREAD_ID);
assert.notEqual(STAFF_CLASS_SURVEY_THREAD_ID, STAFF_GARDEN_CLASS_THREAD_ID);
assert.equal(STAFF_YARD_SURVEY_SUBJECT, 'New yard survey');
assert.equal(STAFF_CLASS_SURVEY_SUBJECT, 'New class survey');

await assert.rejects(
  () => sendNewsletterAdminNotifications({
    resend: { emails: { send: async () => ({ data: { id: 'nope' } }) } },
    subscriber: { name: 'Jordan Lee', email: 'jordan@example.com', source: 'fall-garden-workshop-2026-08-website' },
  }),
  /cannot use the SSW signup staff alert/,
);

console.log('Signup alert checks passed.');
