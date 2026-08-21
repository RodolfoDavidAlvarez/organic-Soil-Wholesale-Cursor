import {
  STAFF_GARDEN_CLASS_SUBJECT,
  getNewsletterAdminRecipients,
  isGardenClassRegistrationSource,
  sendGardenClassAdminNotifications,
} from './newsletterNotifications.js';

export const FALL_GARDEN_WORKSHOP = Object.freeze({
  key: 'fall-garden-workshop-2026-08-22',
  name: 'The Garden Reset',
  startsAt: '2026-08-22T08:00:00-07:00',
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

export { isGardenClassRegistrationSource };

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

  const customer = await findCustomer(db, registration.email);
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
    event_updates_consented_at: existing?.created_at || now,
    marketing_consent: registration.marketingConsent,
    marketing_consented_at: registration.marketingConsent ? now : null,
    marketing_sync_status: registration.marketingConsent ? 'pending' : 'not_requested',
    marketing_sync_error: null,
    customer_id: customer?.id || null,
    status: 'confirmed',
    admin_notification_status: existing?.admin_notification_status || 'pending',
  };

  const { data: saved, error: saveError } = await db
    .from('sp_event_registrations')
    .upsert(row, { onConflict: 'event_key,email_normalized' })
    .select()
    .single();
  if (saveError || !saved?.id) {
    throw new Error(saveError?.message || 'Class registration was not saved.');
  }

  let marketingSyncStatus = saved.marketing_sync_status;
  if (registration.marketingConsent && typeof subscribeNewsletterContact === 'function') {
    const marketingPatch = {};
    try {
      const result = await subscribeNewsletterContact(db, {
        email: registration.email,
        name: registration.fullName,
        phone: registration.phone,
        customerCategory: registration.customerType,
        source: registration.source.slice(0, 100),
      });
      marketingSyncStatus = result.status === 'opted_out' ? 'opted_out' : 'subscribed';
      marketingPatch.marketing_sync_status = marketingSyncStatus;
      marketingPatch.marketing_sync_error = null;
      const linked = await findCustomer(db, registration.email);
      if (linked?.id) marketingPatch.customer_id = linked.id;
    } catch (error) {
      marketingSyncStatus = 'failed';
      marketingPatch.marketing_sync_status = 'failed';
      marketingPatch.marketing_sync_error = String(error?.message || 'Newsletter sync failed').slice(0, 500);
    }

    const { data: updated, error: updateError } = await db
      .from('sp_event_registrations')
      .update(marketingPatch)
      .eq('id', saved.id)
      .select()
      .single();
    if (updateError) throw updateError;
    return {
      registration: updated || { ...saved, ...marketingPatch },
      created: !existing,
      marketingSyncStatus,
    };
  }

  return {
    registration: saved,
    created: !existing,
    marketingSyncStatus,
  };
}

export async function sendWorkshopAdminNotification({
  db,
  resend,
  registration,
  recipients = getNewsletterAdminRecipients(),
}) {
  const { data: claimed, error: claimError } = await db
    .from('sp_event_registrations')
    .update({ admin_notification_status: 'sending', admin_notification_error: null })
    .eq('id', registration.id)
    .in('admin_notification_status', ['pending', 'failed'])
    .select()
    .maybeSingle();
  if (claimError) throw claimError;
  if (!claimed) return { status: 'already_processed', staffEmails: [] };

  if (!recipients.length || !resend) {
    await db.from('sp_event_registrations').update({
      admin_notification_status: 'failed',
      admin_notification_error: 'Class staff alert was not sent because email delivery was unavailable.',
    }).eq('id', claimed.id);
    return { status: 'failed', staffEmails: [] };
  }

  try {
    const results = await sendGardenClassAdminNotifications({
      resend,
      recipients,
      registration: claimed,
    });
    const failures = results.filter((result) => result.status === 'rejected');
    const sent = results.filter((result) => result.status === 'fulfilled');
    if (!sent.length) {
      throw new Error(failures[0]?.reason?.message || 'Class staff alert was not accepted.');
    }
    await db.from('sp_event_registrations').update({
      admin_notification_status: 'sent',
      admin_notification_provider_id: sent[0].value?.id || null,
      admin_notification_sent_at: new Date().toISOString(),
      admin_notification_error: failures.length
        ? String(failures[0].reason?.message || 'Some staff copies failed').slice(0, 500)
        : null,
    }).eq('id', claimed.id);
    return {
      status: 'sent',
      staffEmails: sent.map((result) => ({
        to: result.value?.recipient?.email,
        subject: result.value?.subject || STAFF_GARDEN_CLASS_SUBJECT,
        id: result.value?.id || null,
      })),
    };
  } catch (error) {
    const messageText = String(error?.message || 'Notification failed').slice(0, 500);
    await db.from('sp_event_registrations').update({
      admin_notification_status: 'failed',
      admin_notification_error: messageText,
    }).eq('id', claimed.id);
    throw error;
  }
}

export async function submitGardenClassRegistration({
  db,
  input,
  subscribeNewsletterContact,
  resend,
  recipients = getNewsletterAdminRecipients(),
}) {
  const validation = validateWorkshopRegistration(input);
  if (!validation.ok) return { ok: false, status: 400, error: validation.error, staffEmails: [] };
  if (validation.bot) return { ok: true, bot: true, staffEmails: [] };

  const saved = await saveWorkshopRegistration({
    db,
    registration: validation.registration,
    subscribeNewsletterContact,
  });

  let notificationStatus = saved.registration.admin_notification_status;
  let staffEmails = [];
  if (saved.created) {
    try {
      const notification = await sendWorkshopAdminNotification({
        db,
        resend,
        registration: saved.registration,
        recipients,
      });
      notificationStatus = notification.status;
      staffEmails = notification.staffEmails || [];
    } catch (error) {
      notificationStatus = 'failed';
      console.error('[Workshop RSVP] Admin notification error:', error?.message || error);
    }
  }

  return {
    ok: true,
    bot: false,
    created: saved.created,
    registration: saved.registration,
    marketingSyncStatus: saved.marketingSyncStatus,
    notificationStatus,
    staffEmails,
    staffSubjects: staffEmails.map((email) => email.subject),
  };
}
