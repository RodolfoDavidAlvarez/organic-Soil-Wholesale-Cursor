export const FALL_GARDEN_WORKSHOP = Object.freeze({
  key: 'fall-garden-workshop-2026-08-22',
  name: 'Grow your best fall garden in Arizona',
  startsAt: '2026-08-22T10:00:00-07:00',
  rosterUrl: 'https://ssw-owner-command-center.vercel.app/?tab=campaigns&view=events',
});

const CUSTOMER_TYPES = new Set([
  'home-gardener',
  'farmer',
  'landscaper',
  'nursery',
  'contractor',
  'municipal-commercial',
  'other',
]);

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function label(value) {
  return String(value || 'Not provided')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function normalizeWorkshopRegistration(input = {}) {
  return {
    fullName: String(input.fullName || input.name || '').trim().slice(0, 120),
    email: String(input.email || '').trim().toLowerCase().slice(0, 254),
    phone: String(input.phone || '').trim().slice(0, 30),
    customerType: String(input.customerType || input.customerCategory || '').trim().slice(0, 60),
    source: String(input.source || 'website').trim().slice(0, 120),
    eventUpdatesConsent: input.eventUpdatesConsent === true,
    marketingConsent: input.marketingConsent === true,
    website: String(input.website || '').trim(),
  };
}

export function validateWorkshopRegistration(input = {}) {
  const registration = normalizeWorkshopRegistration(input);
  if (registration.website) return { ok: true, bot: true, registration };
  if (registration.fullName.length < 2) return { ok: false, error: 'Please enter your full name.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registration.email)) {
    return { ok: false, error: 'Please enter a valid email address.' };
  }
  if (registration.phone.replace(/\D/g, '').length < 10) {
    return { ok: false, error: 'Please enter a valid phone number.' };
  }
  if (!CUSTOMER_TYPES.has(registration.customerType)) {
    return { ok: false, error: 'Please select the option that best describes you.' };
  }
  if (!registration.eventUpdatesConsent) {
    return { ok: false, error: 'Please confirm that we may email you about this workshop.' };
  }
  return { ok: true, bot: false, registration };
}

async function findCustomer(db, email) {
  const { data, error } = await db
    .from('sp_customers')
    .select('id')
    .ilike('email', email)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

export async function saveWorkshopRegistration({ db, registration, subscribeNewsletterContact }) {
  const now = new Date().toISOString();
  const { data: existing, error: existingError } = await db
    .from('sp_event_registrations')
    .select('id, created_at, admin_notification_status')
    .eq('event_key', FALL_GARDEN_WORKSHOP.key)
    .eq('email_normalized', registration.email)
    .maybeSingle();
  if (existingError) throw existingError;

  let customer = await findCustomer(db, registration.email);
  let marketingSyncStatus = registration.marketingConsent ? 'pending' : 'not_requested';
  let marketingSyncError = null;

  if (registration.marketingConsent) {
    try {
      const result = await subscribeNewsletterContact(db, {
        email: registration.email,
        name: registration.fullName,
        phone: registration.phone,
        customerCategory: registration.customerType,
        source: `${FALL_GARDEN_WORKSHOP.key}-${registration.source}`.slice(0, 100),
      });
      marketingSyncStatus = result.status === 'opted_out' ? 'opted_out' : 'subscribed';
      customer = await findCustomer(db, registration.email);
    } catch (error) {
      marketingSyncStatus = 'failed';
      marketingSyncError = String(error?.message || 'Newsletter sync failed').slice(0, 500);
    }
  }

  const row = {
    event_key: FALL_GARDEN_WORKSHOP.key,
    event_name: FALL_GARDEN_WORKSHOP.name,
    event_starts_at: FALL_GARDEN_WORKSHOP.startsAt,
    full_name: registration.fullName,
    email: registration.email,
    email_normalized: registration.email,
    phone: registration.phone,
    customer_type: registration.customerType,
    source: registration.source,
    event_updates_consent: true,
    event_updates_consented_at: now,
    marketing_consent: registration.marketingConsent,
    marketing_consented_at: registration.marketingConsent ? now : null,
    marketing_sync_status: marketingSyncStatus,
    marketing_sync_error: marketingSyncError,
    customer_id: customer?.id || null,
    status: 'confirmed',
    admin_notification_status: existing?.admin_notification_status || 'pending',
  };

  const { data: saved, error: saveError } = await db
    .from('sp_event_registrations')
    .upsert(row, { onConflict: 'event_key,email_normalized' })
    .select()
    .single();
  if (saveError) throw saveError;

  return {
    registration: saved,
    created: !existing,
    marketingSyncStatus,
  };
}

export function getWorkshopAdminRecipients(value = process.env.WORKSHOP_ADMIN_NOTIFICATION_EMAILS) {
  const emails = String(value || 'ralvarez@soilseedandwater.com')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  return [...new Set(emails)];
}

export function buildWorkshopAdminNotification(registration) {
  const when = new Date(registration.created_at || Date.now()).toLocaleString('en-US', {
    timeZone: 'America/Phoenix',
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  return {
    subject: `New garden workshop RSVP — ${registration.full_name}`,
    html: `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>New workshop RSVP</title></head>
<body style="margin:0;background:#f1f0e8;font-family:Arial,Helvetica,sans-serif;color:#263527;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background:#fff;border:1px solid #dfe4d9;border-radius:16px;overflow:hidden;">
<tr><td style="padding:24px 26px;background:#264027;color:#fff;"><div style="font-size:11px;font-weight:800;letter-spacing:1.4px;text-transform:uppercase;color:#d7b77d;">New event signup</div><h1 style="margin:8px 0 0;font-size:25px;line-height:1.2;">Fall garden workshop</h1></td></tr>
<tr><td style="padding:24px 26px;"><p style="margin:0 0 18px;font-size:16px;line-height:1.5;"><strong>${escapeHtml(registration.full_name)}</strong> reserved a spot.</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="font-size:14px;line-height:1.45;">
<tr><td style="padding:9px 0;color:#6b776d;width:34%;">Email</td><td style="padding:9px 0;"><a href="mailto:${escapeHtml(registration.email)}" style="color:#264027;font-weight:700;">${escapeHtml(registration.email)}</a></td></tr>
<tr><td style="padding:9px 0;color:#6b776d;">Phone</td><td style="padding:9px 0;"><a href="tel:${escapeHtml(registration.phone)}" style="color:#264027;font-weight:700;">${escapeHtml(registration.phone)}</a></td></tr>
<tr><td style="padding:9px 0;color:#6b776d;">Customer type</td><td style="padding:9px 0;">${escapeHtml(label(registration.customer_type))}</td></tr>
<tr><td style="padding:9px 0;color:#6b776d;">Source</td><td style="padding:9px 0;">${escapeHtml(label(registration.source))}</td></tr>
<tr><td style="padding:9px 0;color:#6b776d;">Newsletter</td><td style="padding:9px 0;">${registration.marketing_consent ? 'Opted in' : 'Not requested'}</td></tr>
<tr><td style="padding:9px 0;color:#6b776d;">Registered</td><td style="padding:9px 0;">${escapeHtml(when)} AZ</td></tr>
</table>
<a href="${FALL_GARDEN_WORKSHOP.rosterUrl}" style="display:block;margin-top:22px;padding:14px 18px;border-radius:10px;background:#264027;color:#fff;text-align:center;text-decoration:none;font-weight:800;">Open event signups in SSW World</a>
</td></tr><tr><td style="padding:15px 26px;background:#f7f7f2;border-top:1px solid #e3e6de;color:#6b776d;font-size:12px;">Organic Soil Wholesale · (623) 263-3386</td></tr>
</table></td></tr></table></body></html>`,
  };
}

export async function sendWorkshopAdminNotification({ db, resend, registration }) {
  const { data: claimed, error: claimError } = await db
    .from('sp_event_registrations')
    .update({ admin_notification_status: 'sending', admin_notification_error: null })
    .eq('id', registration.id)
    .in('admin_notification_status', ['pending', 'failed'])
    .select()
    .maybeSingle();
  if (claimError) throw claimError;
  if (!claimed) return { status: 'already_processed' };

  const message = buildWorkshopAdminNotification(claimed);
  const recipients = getWorkshopAdminRecipients();
  if (!recipients.length || !resend) {
    await db.from('sp_event_registrations').update({ admin_notification_status: 'skipped' }).eq('id', claimed.id);
    return { status: 'skipped' };
  }

  try {
    const result = await resend.emails.send(
      {
        from: process.env.WORKSHOP_EMAIL_FROM || 'Soil Seed & Water <info@soilseedandwater.com>',
        replyTo: 'ralvarez@soilseedandwater.com',
        to: recipients,
        subject: message.subject,
        html: message.html,
        tags: [
          { name: 'message_type', value: 'workshop_admin_notification' },
          { name: 'event_key', value: FALL_GARDEN_WORKSHOP.key },
        ],
      },
      { headers: { 'Idempotency-Key': `workshop-admin-${claimed.id}` } },
    );
    if (result?.error || !result?.data?.id) throw new Error(result?.error?.message || 'Notification was not accepted.');
    await db.from('sp_event_registrations').update({
      admin_notification_status: 'sent',
      admin_notification_provider_id: result.data.id,
      admin_notification_sent_at: new Date().toISOString(),
      admin_notification_error: null,
    }).eq('id', claimed.id);
    return { status: 'sent', providerId: result.data.id };
  } catch (error) {
    const messageText = String(error?.message || 'Notification failed').slice(0, 500);
    await db.from('sp_event_registrations').update({
      admin_notification_status: 'failed',
      admin_notification_error: messageText,
    }).eq('id', claimed.id);
    throw error;
  }
}
