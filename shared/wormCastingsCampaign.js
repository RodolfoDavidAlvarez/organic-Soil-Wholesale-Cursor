export const WORM_CASTINGS_CAMPAIGN_KEY = 'free-worm-castings-2026-08';
export const WORM_CASTINGS_CAMPAIGN_SOURCES = new Set([
  'july-community-gift',
  'community-print',
  'social',
  'socia',
  'ig-ads',
  'fb-ads',
  'fa',
  'friend-share',
  'hubspot',
  'stripe',
]);

const APP_URL = 'https://www.organicsoilwholesale.com';
const ASSET_BASE = `${APP_URL}/email-assets`;

export function normalizeCampaignEmail(value) {
  const email = String(value || '').trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

export function isWormCastingsCampaignSource(value) {
  return WORM_CASTINGS_CAMPAIGN_SOURCES.has(normalizeCampaignSource(value));
}

export function normalizeCampaignSource(value) {
  const raw = String(value || '').trim().toLowerCase();
  const compact = raw.replace(/\s+/g, '-').replace(/_+/g, '-');
  const map = {
    socia: 'social',
    socials: 'social',
    instagram: 'social',
    reels: 'social',
    shorts: 'social',
    facebook: 'social',
    'facebook-ads': 'fb-ads',
    facebookads: 'fb-ads',
    'fb-ads': 'fb-ads',
    fbads: 'fb-ads',
    fa: 'fb-ads',
    'instagram-ads': 'ig-ads',
    instagramads: 'ig-ads',
    igads: 'ig-ads',
    'ig-ads': 'ig-ads',
    print: 'community-print',
    flyer: 'community-print',
    'community-print': 'community-print',
    newsletter: 'july-community-gift',
  };
  return map[compact] || compact || 'website_newsletter_signup';
}

export function couponUrl(token) {
  return `${APP_URL}/redeem/worm-castings/${encodeURIComponent(token)}`;
}

export function couponQrUrl(token) {
  return `${APP_URL}/api/public/worm-castings/qr/${encodeURIComponent(token)}.png`;
}

export function normalizeCouponGreetingName(value) {
  const rawName = String(value || '').trim();
  const withoutTestSuffix = rawName
    .replace(/\s*(?:—|–|-)\s*(?:\[\s*)?test(?:\s*\])?\s*$/i, '')
    .trim();
  const placeholders = /^(?:friend default|test|testing|unknown|n\/?a|null|undefined)$/i;
  return withoutTestSuffix && !placeholders.test(withoutTestSuffix)
    ? withoutTestSuffix
    : 'Neighbor';
}

export function buildWormCastingsCouponEmail({ fullName, token }) {
  const name = escapeHtml(normalizeCouponGreetingName(fullName));
  const privateCouponUrl = couponUrl(token);
  const qrUrl = couponQrUrl(token);

  return {
    subject: 'Your free 9-lb worm castings coupon',
    html: `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Your free 9-lb worm castings coupon</title></head>
<body style="margin:0;background:#264027;font-family:Arial,Helvetica,sans-serif;color:#263527;">
<div style="display:none;max-height:0;overflow:hidden;">Your private QR coupon is ready for Phoenix pickup through August 31.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#264027;"><tr><td align="center" style="padding:28px 12px;">
<table role="presentation" width="620" cellpadding="0" cellspacing="0" style="max-width:620px;width:100%;background:#fff;border-radius:16px;overflow:hidden;">
  <tr><td style="background:#f7f3e5;padding:32px 28px 22px;text-align:center;">
    <img src="${ASSET_BASE}/ssw-logo.png" alt="Soil Seed and Water" width="145" style="display:block;width:145px;height:auto;margin:0 auto 16px;">
    <p style="margin:0 0 10px;color:#96703f;font-size:12px;font-weight:700;letter-spacing:1.7px;text-transform:uppercase;">August community gift</p>
    <h1 style="margin:0;color:#264027;font-size:31px;line-height:1.16;">Your free 9-lb bag of worm castings</h1>
    <p style="margin:14px auto 0;max-width:480px;color:#4d5c4d;font-size:16px;line-height:1.55;">Hi ${name}, your private coupon is ready. Bring it to the Phoenix yard between August 1 and August 31, 2026.</p>
  </td></tr>
  <tr><td style="padding:30px 28px;text-align:center;">
    <p style="margin:0 0 14px;color:#96703f;font-size:12px;font-weight:700;letter-spacing:1.7px;text-transform:uppercase;">Show this QR at the yard</p>
    <a href="${privateCouponUrl}" style="text-decoration:none;"><img src="${qrUrl}" alt="Your private redemption QR code" width="260" height="260" style="display:block;width:260px;max-width:100%;height:auto;margin:0 auto 20px;padding:10px;border:1px solid #d8dfd4;border-radius:12px;"></a>
    <a href="${privateCouponUrl}" style="display:inline-block;background:#264027;border-radius:8px;color:#fff;font-size:15px;font-weight:700;padding:14px 22px;text-decoration:none;">Open your QR coupon</a>
    <p style="margin:18px 0 0;color:#526052;font-size:13px;line-height:1.55;">One free 9-lb bag of Mikey's Worm Poop per person/email. No purchase required. One-time redemption.</p>
  </td></tr>
  <tr><td style="padding:25px 28px;background:#f3f6ef;text-align:center;border-top:1px solid #dbe3d7;">
    <h2 style="margin:0 0 8px;color:#264027;font-size:19px;">Phoenix yard pickup</h2>
    <p style="margin:0;color:#3f4d40;font-size:14px;line-height:1.65;"><strong>1634 N 19th Ave, Phoenix, AZ 85009</strong><br>Use the south entrance from Grand Avenue and follow the yard lane to check-in.</p>
    <p style="margin:13px 0 0;"><a href="https://www.google.com/maps/dir/?api=1&amp;destination=33.467333%2C-112.101250" style="color:#264027;font-weight:700;">Open the exact entrance pin</a></p>
  </td></tr>
  <tr><td style="padding:22px 28px;background:#264027;text-align:center;color:#dce8d8;font-size:12px;line-height:1.6;">Questions? (623) 263-3386 &nbsp;·&nbsp; Soil Seed &amp; Water<br>Regenerative Soil Solutions</td></tr>
</table></td></tr></table></body></html>`,
  };
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
