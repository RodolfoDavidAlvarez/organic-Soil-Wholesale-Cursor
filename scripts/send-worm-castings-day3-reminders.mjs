#!/usr/bin/env node
/**
 * Day-3 pickup reminders for unredeemed August worm-castings coupons.
 * Default = dry-run. Pass --apply to send via Resend.
 *
 *   node scripts/send-worm-castings-day3-reminders.mjs
 *   node scripts/send-worm-castings-day3-reminders.mjs --apply
 *   node scripts/send-worm-castings-day3-reminders.mjs --apply --limit=40
 */
import dotenv from 'dotenv';
import pg from 'pg';
import { Resend } from 'resend';
import { processDay3Reminders } from '../shared/wormCastingsDay3Reminders.js';

dotenv.config({ path: '.env', quiet: true });

const apply = process.argv.includes('--apply');
const limitArg = process.argv.find((arg) => arg.startsWith('--limit='));
const limit = limitArg ? Number(limitArg.split('=')[1]) : 200;

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL missing');
  process.exit(1);
}
if (apply && !process.env.RESEND_API_KEY) {
  console.error('RESEND_API_KEY missing');
  process.exit(1);
}

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const resend = new Resend(process.env.RESEND_API_KEY);

await client.connect();
try {
  const summary = await processDay3Reminders(client, resend, {
    apply,
    limit: Number.isFinite(limit) && limit > 0 ? limit : 200,
    sourceApp: 'organic_soil_wholesale_day3_reminder_script',
  });
  console.log(JSON.stringify(summary, null, 2));
} finally {
  await client.end();
}
