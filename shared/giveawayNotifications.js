import {
  STAFF_ALERT_FROM,
  STAFF_ALERT_REPLY_TO,
  getNewsletterAdminRecipients,
  staffAlertThreadingHeaders,
} from './newsletterNotifications.js';

export const STAFF_GIVEAWAY_SUBJECT = 'SSW giveaway signup';
export const STAFF_GIVEAWAY_THREAD_ID = '<ssw-staff-giveaway-signup@soilseedandwater.com>';

export function shouldSendGiveawayAdminNotification(result) {
  return result?.status === 201 && result?.json?.success === true && result?.json?.alreadyEntered !== true;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function label(value) {
  return String(value || '')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function detailRow(name, value) {
  return `<tr><td style="padding:11px 14px;border-bottom:1px solid #e8ece6;color:#758078;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;width:30%;">${escapeHtml(name)}</td><td style="padding:11px 14px;border-bottom:1px solid #e8ece6;font-size:14px;color:#243229;">${escapeHtml(value || 'Not provided')}</td></tr>`;
}

export function buildGiveawayAdminNotification({ entry, testing = true }) {
  const name = String(entry?.fullName || '').trim() || 'Not provided';
  const email = String(entry?.email || '').trim();
  const phone = String(entry?.phone || '').trim() || 'Not provided';
  const customerTypes = Array.isArray(entry?.customerTypes) ? entry.customerTypes.map(label).join(', ') : '';
  const growing = Array.isArray(entry?.growing) ? entry.growing.map(label).join(', ') : '';
  const followed = Object.entries(entry?.followed || {})
    .filter(([, selected]) => selected === true)
    .map(([channel]) => channel.toUpperCase())
    .join(', ');
  const submittedAt = entry?.submittedAt ? new Date(entry.submittedAt) : new Date();
  const when = Number.isNaN(submittedAt.getTime())
    ? 'Just now'
    : submittedAt.toLocaleString('en-US', {
        timeZone: 'America/Phoenix',
        dateStyle: 'medium',
        timeStyle: 'short',
      });

  return {
    subject: STAFF_GIVEAWAY_SUBJECT,
    headers: staffAlertThreadingHeaders(STAFF_GIVEAWAY_THREAD_ID),
    html: `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${STAFF_GIVEAWAY_SUBJECT}</title></head>
<body bgcolor="#eef2ed" style="margin:0;background:#eef2ed;font-family:Arial,Helvetica,sans-serif;color:#243229;">
  <div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(name)} entered the Big Garden Giveaway.</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td align="center" style="padding:24px 12px;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#ffffff" style="width:100%;max-width:600px;background:#ffffff;border:1px solid #dfe6dc;border-radius:16px;overflow:hidden;">
      <tr><td style="padding:22px 26px;border-bottom:1px solid #e6ebe3;"><img src="https://www.organicsoilwholesale.com/email-assets/ssw-logo.png" width="190" alt="Soil Seed &amp; Water" style="display:block;width:190px;max-width:100%;height:auto;border:0;"></td></tr>
      <tr><td bgcolor="#e8f1e6" style="padding:26px;background:#e8f1e6;"><div style="font-size:12px;font-weight:800;letter-spacing:1.4px;text-transform:uppercase;color:#8a6a42;">Big Garden Giveaway</div><h1 style="margin:7px 0 6px;font-size:27px;line-height:1.2;color:#1e3824;">New giveaway entry</h1><p style="margin:0;font-size:15px;color:#4e6253;">${escapeHtml(name)} just entered.</p></td></tr>
      <tr><td style="padding:24px 26px;">
        ${testing ? '<div style="margin-bottom:16px;padding:10px 12px;background:#fff8e7;border:1px solid #ead8a8;border-radius:9px;color:#684e12;font-size:13px;"><strong>Internal test mode:</strong> delivered only to Rodolfo.</div>' : ''}
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:1px solid #e2e8df;border-radius:12px;border-collapse:separate;overflow:hidden;">
          ${detailRow('Name', name)}
          ${detailRow('Email', email)}
          ${detailRow('Phone', phone)}
          ${detailRow('ZIP', entry?.zipCode)}
          ${detailRow('Customer', customerTypes)}
          ${detailRow('Garden', label(entry?.gardenStatus))}
          ${detailRow('Growing', growing)}
          ${detailRow('Other', entry?.growingOther)}
          ${detailRow('Followed', followed)}
          ${detailRow('Notes', entry?.notes)}
          ${detailRow('Entered', `${when} AZ`)}
        </table>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:16px;"><tr><td width="49%"><a href="mailto:${escapeHtml(email)}" style="display:block;padding:13px 10px;border-radius:9px;background:#264027;color:#ffffff;text-decoration:none;text-align:center;font-size:14px;font-weight:800;">Email entrant</a></td><td width="2%">&nbsp;</td><td width="49%"><a href="tel:${escapeHtml(phone)}" style="display:block;padding:12px 10px;border:1px solid #cbd6c8;border-radius:9px;background:#ffffff;color:#264027;text-decoration:none;text-align:center;font-size:14px;font-weight:800;">Call entrant</a></td></tr></table>
      </td></tr>
      <tr><td bgcolor="#f7f8f5" style="padding:16px 26px;border-top:1px solid #e6ebe3;color:#748077;font-size:12px;">Organic Soil Wholesale · Phoenix, Arizona · (623) 263-3386</td></tr>
    </table>
  </td></tr></table>
</body></html>`,
  };
}

export async function sendGiveawayAdminNotifications({
  resend,
  entry,
  recipients = getNewsletterAdminRecipients(),
}) {
  const testing = recipients.length === 1 && recipients[0]?.email === 'ralvarez@soilseedandwater.com';
  const message = buildGiveawayAdminNotification({ entry, testing });
  return Promise.allSettled(recipients.map(async (recipient) => {
    const result = await resend.emails.send({
      from: STAFF_ALERT_FROM,
      replyTo: STAFF_ALERT_REPLY_TO,
      to: recipient.email,
      subject: message.subject,
      html: message.html,
      headers: message.headers,
    });
    if (result?.error) throw new Error(result.error.message || JSON.stringify(result.error));
    return { recipient, id: result?.data?.id || null, subject: message.subject };
  }));
}
