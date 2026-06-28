/** Shared newsletter unsubscribe + Resend webhook helpers (Vercel + Express). */

function deviceFromUserAgent(ua) {
  if (!ua) return 'unknown';
  const s = String(ua).toLowerCase();
  if (/mobile|iphone|android|ipad/.test(s)) return 'mobile';
  if (/windows|macintosh|linux|cros/.test(s)) return 'desktop';
  return 'unknown';
}

function normalizeEmail(to) {
  if (!to) return null;
  const raw = Array.isArray(to) ? to[0] : to;
  return raw?.toLowerCase?.().trim() || null;
}

function newsletterIdFromTags(tags) {
  const list = tags || [];
  const tag = list.find((t) => t.name === 'newsletter_id' || t.name === 'campaign');
  return tag?.value || null;
}

export async function unsubscribeNewsletterContact(supabase, normalizedEmail, reason) {
  const now = new Date().toISOString();
  const { data: existing } = await supabase
    .from('sp_customers')
    .select('id, newsletter_notes')
    .ilike('email', normalizedEmail)
    .maybeSingle();

  if (existing) {
    const notes = reason?.trim()
      ? `${existing.newsletter_notes || ''}\n\n[Unsubscribed ${now}]\nReason: ${reason.trim()}`.trim()
      : existing.newsletter_notes;

    await supabase
      .from('sp_customers')
      .update({
        newsletter_subscribed: false,
        newsletter_unsubscribed_at: now,
        newsletter_notes: notes || null,
        updated_at: now,
      })
      .eq('id', existing.id);
  }

  const apiKey = process.env.AIRTABLE_API_KEY;
  if (!apiKey) return;

  const base = 'appBLlRW7MOx0qdlu';
  const table = 'tblmofFGmkN2dZ4GB';
  const searchUrl = `https://api.airtable.com/v0/${base}/${table}?filterByFormula=LOWER({Email})="${normalizedEmail}"&maxRecords=1`;
  const searchResponse = await fetch(searchUrl, { headers: { Authorization: `Bearer ${apiKey}` } });
  if (!searchResponse.ok) return;

  const searchData = await searchResponse.json();
  const record = searchData.records?.[0];
  if (!record) return;

  const fields = {
    Subscribed: false,
    'Unsubscribed Date': now.split('T')[0],
  };
  if (reason?.trim()) {
    fields.Notes = `${record.fields?.Notes || ''}\n\n[Unsubscribed ${now}]\nReason: ${reason.trim()}`.trim();
  }

  await fetch(`https://api.airtable.com/v0/${base}/${table}/${record.id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  });
}

export async function handleResendNewsletterWebhook(supabase, event) {
  const { type, data } = event || {};
  const email = normalizeEmail(data?.to);
  if (!email) return { skipped: true };

  const newsletterId = newsletterIdFromTags(data?.tags);
  const device = deviceFromUserAgent(data?.user_agent);
  const now = new Date().toISOString();

  if (['email.opened', 'email.clicked', 'email.bounced', 'email.complained'].includes(type)) {
    const { data: customer } = await supabase
      .from('sp_customers')
      .select('id, newsletter_email_opens, newsletter_email_clicks')
      .ilike('email', email)
      .maybeSingle();

    await supabase.from('email_events').insert({
      email,
      customer_id: customer?.id ?? null,
      event_type: type.replace('email.', ''),
      newsletter_id: newsletterId,
      resend_email_id: data?.email_id ?? null,
      user_agent: data?.user_agent ?? null,
      device_type: device,
    });

    if (customer) {
      const patch = {};
      if (type === 'email.opened') {
        patch.newsletter_email_opens = (customer.newsletter_email_opens || 0) + 1;
        patch.newsletter_last_opened_at = now;
        patch.newsletter_last_open_device = device;
      }
      if (type === 'email.clicked') {
        patch.newsletter_email_clicks = (customer.newsletter_email_clicks || 0) + 1;
        patch.newsletter_last_clicked_at = now;
        if (!customer.newsletter_email_opens) patch.newsletter_email_opens = 1;
      }
      if (type === 'email.bounced' || type === 'email.complained') {
        patch.newsletter_subscribed = false;
        patch.newsletter_verification_status = type === 'email.bounced' ? 'Bounced' : 'Complained';
        patch.newsletter_unsubscribed_at = now;
      }
      if (Object.keys(patch).length) {
        await supabase.from('sp_customers').update(patch).eq('id', customer.id);
      }
    }

    if (newsletterId && (type === 'email.opened' || type === 'email.clicked')) {
      const col = type === 'email.opened' ? 'total_opens' : 'total_clicks';
      const { data: campaign } = await supabase
        .from('newsletter_campaigns')
        .select(`id, ${col}, mobile_opens, desktop_opens`)
        .eq('newsletter_id', newsletterId)
        .maybeSingle();

      if (campaign) {
        const campPatch = { [col]: (campaign[col] || 0) + 1 };
        if (type === 'email.opened' && device === 'mobile') {
          campPatch.mobile_opens = (campaign.mobile_opens || 0) + 1;
        }
        if (type === 'email.opened' && device === 'desktop') {
          campPatch.desktop_opens = (campaign.desktop_opens || 0) + 1;
        }
        await supabase.from('newsletter_campaigns').update(campPatch).eq('id', campaign.id);
      }
    }
  }

  return { ok: true, type, email };
}
