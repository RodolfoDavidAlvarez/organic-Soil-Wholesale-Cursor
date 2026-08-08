import test from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import {
  enqueueDay3Reminders,
  processDay3Reminders,
} from '../shared/wormCastingsDay3Reminders.js';

const connectionString = process.env.TEST_DATABASE_URL;
if (!connectionString || !connectionString.includes('codex_worm_day3_validation_')) {
  throw new Error('TEST_DATABASE_URL must point to an isolated codex_worm_day3_validation_* database');
}

class FakeResend {
  constructor() {
    this.calls = [];
    this.emails = { send: this.send.bind(this) };
  }

  async send(payload, options) {
    this.calls.push({ payload, options });
    return { data: { id: `provider-${options.idempotencyKey}` }, error: null };
  }
}

async function insertFixture(client, {
  email,
  sentOffset,
  subscribed = true,
  unsubscribed = false,
  redeemed = false,
  suppressedEvent = null,
}) {
  const customer = await client.query(
    `INSERT INTO public.sp_customers
      (email, newsletter_subscribed, newsletter_unsubscribed_at)
     VALUES ($1, $2, CASE WHEN $3 THEN now() ELSE NULL END)
     RETURNING id`,
    [email, subscribed, unsubscribed],
  );
  const redemption = await client.query(
    `INSERT INTO public.sp_worm_castings_redemptions
      (customer_id, full_name, email, email_normalized, distribution_status,
       distribution_sent_at, redeemed_at)
     VALUES ($1, 'Phoenix Neighbor', $2, lower($2), 'sent',
       now() - $3::interval, CASE WHEN $4 THEN now() ELSE NULL END)
     RETURNING id`,
    [customer.rows[0].id, email, sentOffset, redeemed],
  );
  if (suppressedEvent) {
    await client.query(
      `INSERT INTO public.email_events (email, event_type)
       VALUES ($1, $2)`,
      [email, suppressedEvent],
    );
  }
  return redemption.rows[0].id;
}

test('real PostgreSQL enforces boundary, suppression, and exactly-once delivery', async () => {
  const client = new pg.Client({ connectionString });
  await client.connect();
  try {
    await client.query(`
      TRUNCATE public.worm_castings_reminder_attempts,
        public.worm_castings_reminder_outbox,
        public.worm_castings_reminder_runs,
        public.notification_log,
        public.email_events,
        public.sp_worm_castings_redemptions,
        public.sp_customers
      RESTART IDENTITY CASCADE`);

    await insertFixture(client, { email: 'at-boundary@example.com', sentOffset: '3 days' });
    await insertFixture(client, { email: 'too-young@example.com', sentOffset: '2 days 23 hours 59 minutes 59 seconds' });
    await insertFixture(client, { email: 'redeemed@example.com', sentOffset: '4 days', redeemed: true });
    await insertFixture(client, { email: 'opted-out@example.com', sentOffset: '4 days', subscribed: false, unsubscribed: true });
    await insertFixture(client, { email: 'bounced@example.com', sentOffset: '4 days', suppressedEvent: 'bounced' });
    await insertFixture(client, { email: 'complained@example.com', sentOffset: '4 days', suppressedEvent: 'complained' });

    assert.equal(await enqueueDay3Reminders(client), 1);
    assert.equal(await enqueueDay3Reminders(client), 0);

    const resend = new FakeResend();
    const first = await processDay3Reminders(client, resend, {
      apply: true, limit: 10, delayMs: 0, sourceApp: 'sql_integration_test',
    });
    assert.equal(first.sent, 1);
    assert.equal(first.failed, 0);
    assert.equal(resend.calls.length, 1);
    assert.match(resend.calls[0].payload.headers['List-Unsubscribe'], /at-boundary%40example\.com/);

    const second = await processDay3Reminders(client, resend, {
      apply: true, limit: 10, delayMs: 0, sourceApp: 'sql_integration_test',
    });
    assert.equal(second.sent, 0);
    assert.equal(resend.calls.length, 1);

    const ledger = await client.query(`
      SELECT status, attempt_count, provider_idempotency_key
      FROM public.worm_castings_reminder_outbox`);
    assert.equal(ledger.rowCount, 1);
    assert.equal(ledger.rows[0].status, 'sent');
    assert.equal(ledger.rows[0].attempt_count, 1);
    assert.match(ledger.rows[0].provider_idempotency_key, /^worm-day3-/);
  } finally {
    await client.end();
  }
});
