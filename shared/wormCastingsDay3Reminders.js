import {
  WORM_CASTINGS_CAMPAIGN_KEY,
  buildWormCastingsDay3ReminderEmail,
} from './wormCastingsCampaign.js';

export const DAY3_REMINDER_TEMPLATE = 'worm_castings_day3_reminder';

/**
 * Eligible: coupon emailed, still unredeemed, issued >= 3 days ago,
 * Day-3 reminder not yet sent. Skips internal/test and any address that has
 * already bounced, complained, or been suppressed by the email provider.
 */
export async function listDay3ReminderDue(client, { campaignKey = WORM_CASTINGS_CAMPAIGN_KEY, limit = 200 } = {}) {
  const { rows } = await client.query(
    `
    SELECT id, full_name, email, redemption_token, issued_at
    FROM public.sp_worm_castings_redemptions
    WHERE campaign_key = $1
      AND redeemed_at IS NULL
      AND distribution_status = 'sent'
      AND day3_reminder_sent_at IS NULL
      AND (day3_reminder_provider_id IS NULL OR day3_reminder_provider_id = 'failed')
      AND issued_at <= now() - interval '3 days'
      AND email_normalized NOT LIKE '%@soilseedandwater.com'
      AND email_normalized NOT IN ('test@test.com', 'test@example.com')
      AND NOT EXISTS (
        SELECT 1
        FROM public.email_events event
        WHERE lower(event.email) = email_normalized
          AND event.event_type IN ('bounced', 'complained', 'suppressed')
      )
    ORDER BY issued_at ASC
    LIMIT $2
    `,
    [campaignKey, limit],
  );
  return rows;
}

export async function claimAndSendDay3Reminder(client, resend, row, { fromAddress, sourceApp }) {
  const claimed = await client.query(
    `
    UPDATE public.sp_worm_castings_redemptions
    SET day3_reminder_provider_id = 'sending',
        updated_at = now()
    WHERE id = $1
      AND redeemed_at IS NULL
      AND distribution_status = 'sent'
      AND day3_reminder_sent_at IS NULL
      AND (day3_reminder_provider_id IS NULL OR day3_reminder_provider_id = 'failed')
    RETURNING id, full_name, email, redemption_token
    `,
    [row.id],
  );
  if (!claimed.rowCount) return { id: row.id, status: 'skipped' };

  const coupon = claimed.rows[0];
  const message = buildWormCastingsDay3ReminderEmail({
    fullName: coupon.full_name,
    token: coupon.redemption_token,
  });

  try {
    const response = await resend.emails.send({
      from: fromAddress,
      to: [coupon.email],
      subject: message.subject,
      html: message.html,
      tags: [
        { name: 'campaign', value: WORM_CASTINGS_CAMPAIGN_KEY },
        { name: 'template', value: DAY3_REMINDER_TEMPLATE },
      ],
    });
    const providerId = response?.data?.id;
    if (response?.error || !providerId) {
      throw new Error(response?.error?.message || 'day3_reminder_not_accepted');
    }

    await client.query(
      `
      UPDATE public.sp_worm_castings_redemptions
      SET day3_reminder_sent_at = now(),
          day3_reminder_provider_id = $2,
          updated_at = now()
      WHERE id = $1
      `,
      [coupon.id, providerId],
    );

    await client.query(
      `
      INSERT INTO public.notification_log
        (notification_type, template_name, recipient, subject, content, status, provider, provider_id, source_app, sent_at)
      VALUES
        ('email', $4, $1, $2, 'Day-3 unredeemed worm castings pickup reminder', 'sent', 'resend', $3, $5, now())
      `,
      [coupon.email, message.subject, providerId, DAY3_REMINDER_TEMPLATE, sourceApp],
    );

    return { id: coupon.id, email: coupon.email, status: 'sent', providerId };
  } catch (error) {
    const reason = error?.message || 'day3_reminder_failed';
    await client.query(
      `
      UPDATE public.sp_worm_castings_redemptions
      SET day3_reminder_provider_id = 'failed',
          updated_at = now()
      WHERE id = $1 AND day3_reminder_sent_at IS NULL
      `,
      [coupon.id],
    );
    await client.query(
      `
      INSERT INTO public.notification_log
        (notification_type, template_name, recipient, subject, content, status, provider, error_message, source_app)
      VALUES
        ('email', $3, $1, $2, 'Day-3 unredeemed worm castings pickup reminder', 'failed', 'resend', $4, $5)
      `,
      [coupon.email, message.subject, DAY3_REMINDER_TEMPLATE, reason, sourceApp],
    );
    return { id: coupon.id, email: coupon.email, status: 'failed', error: reason };
  }
}

export async function processDay3Reminders(client, resend, {
  apply = false,
  limit = 200,
  delayMs = 150,
  fromAddress = process.env.WORM_CASTINGS_EMAIL_FROM || 'Soil Seed & Water <info@soilseedandwater.com>',
  sourceApp = 'organic_soil_wholesale_day3_reminder',
} = {}) {
  const due = await listDay3ReminderDue(client, { limit });
  if (!apply) {
    return {
      mode: 'dry-run',
      campaignKey: WORM_CASTINGS_CAMPAIGN_KEY,
      due: due.length,
      sample: due.slice(0, 5).map((row) => ({ email: row.email, issued_at: row.issued_at })),
    };
  }

  const results = [];
  for (const row of due) {
    const result = await claimAndSendDay3Reminder(client, resend, row, { fromAddress, sourceApp });
    results.push(result);
    if (delayMs > 0) await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  return {
    mode: 'apply',
    campaignKey: WORM_CASTINGS_CAMPAIGN_KEY,
    due: due.length,
    sent: results.filter((row) => row.status === 'sent').length,
    failed: results.filter((row) => row.status === 'failed').length,
    skipped: results.filter((row) => row.status === 'skipped').length,
  };
}
