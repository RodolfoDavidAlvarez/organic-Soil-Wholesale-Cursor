const ADMIN_TEAM = Object.freeze([
  { name: 'Rodolfo Alvarez', email: 'ralvarez@soilseedandwater.com' },
  { name: 'Kerry Cooper', email: 'kcooper@soilseedandwater.com' },
  { name: 'Sabrina Moses', email: 'sabrina@soilseedandwater.com' },
  { name: 'Kash Starks', email: 'kash@soilseedandwater.com' },
  { name: 'Gabriela Perez', email: 'gperez@soilseedandwater.com' },
]);

const INTERNAL_TEST_RECIPIENTS = Object.freeze([ADMIN_TEAM[0]]);

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function getNewsletterAdminRecipients(active = process.env.NEWSLETTER_ADMIN_NOTIFICATIONS_ACTIVE) {
  return String(active || '').toLowerCase() === 'true' ? ADMIN_TEAM : INTERNAL_TEST_RECIPIENTS;
}

export function buildNewsletterAdminNotification({ subscriber, testing = true }) {
  const name = String(subscriber?.name || '').trim() || 'Not provided';
  const email = String(subscriber?.email || '').trim();
  const phone = String(subscriber?.phone || '').trim() || 'Not provided';
  const customerCategory = String(subscriber?.customerCategory || '').trim() || 'Not provided';
  const source = String(subscriber?.source || 'website_newsletter_signup').trim();
  const subscribedAt = subscriber?.subscribedAt ? new Date(subscriber.subscribedAt) : new Date();
  const when = Number.isNaN(subscribedAt.getTime())
    ? 'Just now'
    : subscribedAt.toLocaleString('en-US', {
        timeZone: 'America/Phoenix',
        dateStyle: 'medium',
        timeStyle: 'short',
      });
  const testPrefix = testing ? '[INTERNAL TEST] ' : '';

  return {
    subject: `${testPrefix}New newsletter subscriber — ${name === 'Not provided' ? email : name}`,
    html: `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#f3f0e8;font-family:Arial,sans-serif;color:#173d2b;">
    <div style="display:none;max-height:0;overflow:hidden;">A new subscriber joined the Soil Seed &amp; Water community newsletter.</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f0e8;padding:28px 12px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #ded8c9;">
          <tr><td style="background:#173d2b;padding:26px 30px;color:#ffffff;">
            <div style="font-size:12px;letter-spacing:1.4px;text-transform:uppercase;color:#bdd48c;">Soil Seed &amp; Water</div>
            <h1 style="font-size:25px;line-height:1.25;margin:8px 0 0;">New Community Subscriber</h1>
          </td></tr>
          <tr><td style="padding:28px 30px;">
            ${testing ? '<div style="margin-bottom:20px;padding:11px 14px;background:#fff7df;border:1px solid #ead39a;border-radius:8px;color:#684e12;font-size:13px;"><strong>Internal test mode:</strong> this notification is currently going only to Rodolfo.</div>' : ''}
            <p style="font-size:16px;line-height:1.55;margin:0 0 22px;">Someone has opted in to receive community news, growing guidance, and local product updates.</p>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;font-size:15px;">
              <tr><td style="padding:10px 0;border-bottom:1px solid #ece8df;color:#68746d;width:34%;">Name</td><td style="padding:10px 0;border-bottom:1px solid #ece8df;"><strong>${escapeHtml(name)}</strong></td></tr>
              <tr><td style="padding:10px 0;border-bottom:1px solid #ece8df;color:#68746d;">Email</td><td style="padding:10px 0;border-bottom:1px solid #ece8df;"><a href="mailto:${escapeHtml(email)}" style="color:#2d6a45;">${escapeHtml(email)}</a></td></tr>
              <tr><td style="padding:10px 0;border-bottom:1px solid #ece8df;color:#68746d;">Phone</td><td style="padding:10px 0;border-bottom:1px solid #ece8df;"><a href="tel:${escapeHtml(phone)}" style="color:#2d6a45;">${escapeHtml(phone)}</a></td></tr>
              <tr><td style="padding:10px 0;border-bottom:1px solid #ece8df;color:#68746d;">Customer type</td><td style="padding:10px 0;border-bottom:1px solid #ece8df;">${escapeHtml(customerCategory)}</td></tr>
              <tr><td style="padding:10px 0;border-bottom:1px solid #ece8df;color:#68746d;">Source</td><td style="padding:10px 0;border-bottom:1px solid #ece8df;">${escapeHtml(source)}</td></tr>
              <tr><td style="padding:10px 0;border-bottom:1px solid #ece8df;color:#68746d;">Subscribed</td><td style="padding:10px 0;border-bottom:1px solid #ece8df;">${escapeHtml(when)} Arizona time</td></tr>
              <tr><td style="padding:10px 0;color:#68746d;">Status</td><td style="padding:10px 0;"><strong style="color:#2d6a45;">Active newsletter subscriber</strong></td></tr>
            </table>
            <p style="font-size:13px;line-height:1.55;color:#68746d;margin:22px 0 0;">Consent was captured through the website’s explicit opt-in checkbox. The source and timestamp are stored with the customer record.</p>
          </td></tr>
          <tr><td style="padding:18px 30px;background:#f8f6f0;color:#68746d;font-size:12px;line-height:1.5;">Soil Seed &amp; Water · Phoenix, Arizona · (602) 637-0032</td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`,
  };
}

export async function sendNewsletterAdminNotifications({ resend, subscriber, recipients = getNewsletterAdminRecipients() }) {
  const testing = recipients.length === 1 && recipients[0]?.email === INTERNAL_TEST_RECIPIENTS[0].email;
  const message = buildNewsletterAdminNotification({ subscriber, testing });

  return Promise.allSettled(recipients.map(async (recipient) => {
    const result = await resend.emails.send({
      from: 'Soil Seed & Water <info@soilseedandwater.com>',
      replyTo: 'ralvarez@soilseedandwater.com',
      to: recipient.email,
      subject: message.subject,
      html: message.html,
    });
    if (result?.error) throw new Error(result.error.message || JSON.stringify(result.error));
    return { recipient, id: result?.data?.id || null };
  }));
}

export { ADMIN_TEAM, INTERNAL_TEST_RECIPIENTS };
