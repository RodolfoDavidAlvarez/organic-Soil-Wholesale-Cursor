#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

import {
  buildGiveawayLeadReportEmail,
  buildGiveawayLeadReportModel,
  deliverGiveawayLeadReportBatch,
  getGiveawayLeadReportRecipients,
  loadGiveawayLeadReportData,
  sendGiveawayLeadReport,
} from '../shared/giveawayNotifications.js';
import { GIVEAWAY_CAMPAIGN_KEY } from '../shared/giveawayEntries.js';

function parseArgs(argv) {
  const args = { _: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) {
      args._.push(token);
      continue;
    }
    const key = token.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) args[key] = true;
    else {
      args[key] = next;
      index += 1;
    }
  }
  return args;
}

function requiredEnv(name) {
  const value = String(process.env[name] || '').trim();
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function clients() {
  return {
    db: createClient(
      process.env.SUPABASE_URL || requiredEnv('VITE_SUPABASE_URL'),
      requiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
      { auth: { persistSession: false, autoRefreshToken: false } },
    ),
    resend: new Resend(requiredEnv('RESEND_API_KEY')),
  };
}

async function latestWindow(db, batchSize = 30) {
  const { count, error } = await db.from('sp_giveaway_entries')
    .select('id', { count: 'exact', head: true })
    .eq('campaign_key', GIVEAWAY_CAMPAIGN_KEY)
    .eq('is_preview', false)
    .not('email', 'ilike', '%@example.com');
  if (error) throw error;
  const entryEnd = Number(count || 0);
  if (entryEnd < batchSize) throw new Error(`At least ${batchSize} valid giveaway leads are required.`);
  return { entryStart: entryEnd - batchSize + 1, entryEnd };
}

async function runTest({ db, resend }, args) {
  const batchNumber = Number(args.batch || 1);
  const recipient = String(args.to || 'ralvarez@soilseedandwater.com').trim().toLowerCase();
  const window = await latestWindow(db);
  const data = await loadGiveawayLeadReportData({ db, batchNumber, ...window });
  const model = buildGiveawayLeadReportModel({ batchNumber, ...data });
  const report = await buildGiveawayLeadReportEmail({ model, testing: true });
  const delivery = await sendGiveawayLeadReport({
    resend,
    report,
    model,
    recipients: [{ name: 'Rodolfo Alvarez', email: recipient }],
    idempotencySuffix: `-test-${Date.now()}`,
  });
  if (!delivery.complete) throw new Error(delivery.errors.join(' | ') || 'Test delivery failed.');
  console.log(JSON.stringify({
    action: 'test',
    batchNumber,
    recipient,
    subject: report.subject,
    providerIds: delivery.providerIds,
    map: report.map,
  }, (key, value) => key === 'buffer' ? undefined : value, 2));
}

async function runSchedule({ db, resend }, args) {
  if (!args.approved) throw new Error('Refusing to schedule without --approved.');
  const scheduledAt = String(args.scheduledAt || '').trim();
  if (!scheduledAt) throw new Error('--scheduled-at is required.');
  const date = new Date(scheduledAt);
  if (Number.isNaN(date.getTime())) throw new Error('--scheduled-at must be a valid ISO date.');
  const batchNumber = Number(args.batch || 1);
  const window = await latestWindow(db);
  const recipients = getGiveawayLeadReportRecipients();
  const result = await deliverGiveawayLeadReportBatch({
    db,
    resend,
    batchNumber,
    ...window,
    recipients,
    scheduledAt: date.toISOString(),
    idempotencySuffix: String(args.idempotencySuffix || ''),
  });
  console.log(JSON.stringify({
    action: 'schedule',
    batchNumber,
    scheduledAt: date.toISOString(),
    recipients: recipients.map((recipient) => recipient.email),
    skipped: result.skipped,
    status: result.row?.status || null,
    providerIds: result.row?.recipient_provider_ids || {},
    error: result.row?.last_error || null,
  }, null, 2));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const action = args._[0];
  if (!['test', 'schedule'].includes(action)) {
    throw new Error('Usage: giveaway-lead-report.mjs test|schedule [--batch 1] [--to email] [--scheduled-at ISO] [--approved]');
  }
  const connected = clients();
  if (action === 'test') await runTest(connected, args);
  else await runSchedule(connected, args);
}

main().catch((error) => {
  console.error(error?.message || error);
  process.exit(1);
});
