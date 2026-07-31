#!/usr/bin/env node
/**
 * Creates pending coupons for verified July campaign registrants.
 * Default mode is read-only. Use --apply only after reviewing the count.
 * This script never sends email; delivery is retried through the protected API.
 */
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config({ path: '.env', quiet: true });

const apply = process.argv.includes('--apply');
const campaignKey = 'free-worm-castings-2026-08';
const source = 'july-community-gift';
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

await client.connect();
try {
  const summary = await client.query(`
    SELECT
      count(*) FILTER (WHERE c.newsletter_subscribed IS TRUE)::int AS eligible_registrants,
      count(r.id)::int AS existing_coupons,
      count(*) FILTER (WHERE r.id IS NULL)::int AS missing_coupons
    FROM public.sp_customers c
    LEFT JOIN public.sp_worm_castings_redemptions r
      ON r.campaign_key = $1
      AND r.email_normalized = lower(trim(c.email))
    WHERE lower(coalesce(c.newsletter_source, '')) = $2
      AND c.newsletter_subscribed IS TRUE
      AND c.email IS NOT NULL
      AND trim(c.email) <> ''
  `, [campaignKey, source]);

  if (!apply) {
    console.log(JSON.stringify({ mode: 'dry-run', campaignKey, source, ...summary.rows[0] }));
    process.exit(0);
  }

  await client.query('begin');
  const inserted = await client.query(`
    INSERT INTO public.sp_worm_castings_redemptions (
      campaign_key, customer_id, full_name, email, email_normalized, distribution_status
    )
    SELECT
      $1,
      c.id,
      coalesce(nullif(trim(c.full_name), ''), lower(trim(c.email))),
      lower(trim(c.email)),
      lower(trim(c.email)),
      'pending'
    FROM public.sp_customers c
    WHERE lower(coalesce(c.newsletter_source, '')) = $2
      AND c.newsletter_subscribed IS TRUE
      AND c.email IS NOT NULL
      AND trim(c.email) <> ''
    ON CONFLICT (campaign_key, email_normalized) DO NOTHING
    RETURNING id
  `, [campaignKey, source]);
  await client.query('commit');
  console.log(JSON.stringify({ mode: 'apply', campaignKey, source, created_pending_coupons: inserted.rowCount }));
} catch (error) {
  await client.query('rollback').catch(() => undefined);
  throw error;
} finally {
  await client.end();
}
