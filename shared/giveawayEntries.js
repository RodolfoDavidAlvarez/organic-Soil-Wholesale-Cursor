/**
 * Phoenix Fall Garden Giveaway (/win) entry validation and persistence.
 *
 * Entries are OPEN by default. No Vercel env is required in production.
 * Set GIVEAWAY_ENTRIES_OPEN=false to pause new entries. This path never
 * sends a customer or marketing email.
 */

export const GIVEAWAY_SOURCE = 'win-giveaway';
export const GIVEAWAY_CAMPAIGN_KEY = 'phoenix-fall-garden-2026';
export const GIVEAWAY_ENTRIES_CLOSED_MESSAGE = 'Entries are not open yet.';
export const GIVEAWAY_FOLLOW_COPY = 'Follow us (free) — tap each Follow, then check the box.';

export const GIVEAWAY_CUSTOMER_TYPES = Object.freeze([
  ['homeowner', 'Homeowner'],
  ['landscaper', 'Landscaper'],
  ['specialty-farmer', 'Specialty farmer'],
]);

export const GIVEAWAY_GARDEN_STATUSES = Object.freeze([
  ['brand-new', 'Brand new'],
  ['existing', 'Existing'],
]);

export const GIVEAWAY_GROWING_OPTIONS = Object.freeze([
  ['food-garden', 'Food garden'],
  ['turf', 'Turf/grass'],
  ['ornamentals', 'Ornamentals'],
  ['trees', 'Trees'],
  ['citrus-avocado', 'Citrus/avocado'],
  ['palms', 'Palms'],
  ['roses', 'Roses'],
  ['succulents', 'Succulents'],
  ['indoor-plants', 'Indoor plants'],
]);

export const GIVEAWAY_SOCIAL_CHANNELS = Object.freeze([
  {
    key: 'ig',
    column: 'followed_ig',
    label: 'Instagram @soilseedandwater',
    url: 'https://www.instagram.com/soilseedandwater/',
  },
  {
    key: 'fb',
    column: 'followed_fb',
    label: 'Facebook Soil Seed and Water',
    url: 'https://www.facebook.com/soilseedandwater',
  },
  {
    key: 'yt',
    column: 'followed_yt',
    label: 'YouTube @soilseedwater',
    url: 'https://www.youtube.com/@soilseedwater',
  },
  {
    key: 'tt',
    column: 'followed_tt',
    label: 'TikTok @soilseedandwater',
    url: 'https://www.tiktok.com/@soilseedandwater',
  },
]);

const CUSTOMER_TYPE_VALUES = new Set(GIVEAWAY_CUSTOMER_TYPES.map(([value]) => value));
const GARDEN_STATUS_VALUES = new Set(GIVEAWAY_GARDEN_STATUSES.map(([value]) => value));
const GROWING_VALUES = new Set(GIVEAWAY_GROWING_OPTIONS.map(([value]) => value));
const SOCIAL_KEYS = GIVEAWAY_SOCIAL_CHANNELS.map((channel) => channel.key);

function envObject(env) {
  if (env && typeof env === 'object') return env;
  if (typeof process !== 'undefined' && process.env) return process.env;
  return {};
}

function isClosedFlag(value) {
  const raw = String(value ?? '').trim().toLowerCase();
  return raw === '0' || raw === 'false' || raw === 'no' || raw === 'off';
}

export function areGiveawayEntriesOpen(env) {
  const value = envObject(env).GIVEAWAY_ENTRIES_OPEN;
  if (value == null || String(value).trim() === '') return true;
  return !isClosedFlag(value);
}

function trimText(value, max) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

export function normalizeGiveawayZip(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length === 5) return digits;
  if (digits.length === 9) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return null;
}

export function normalizeGiveawayGrowing(value) {
  const raw = Array.isArray(value) ? value : typeof value === 'string' && value ? [value] : [];
  const unique = [];
  for (const item of raw) {
    const key = String(item || '').trim();
    if (!GROWING_VALUES.has(key) || unique.includes(key)) continue;
    unique.push(key);
  }
  return unique;
}

function readFollowed(input = {}) {
  const nested = input.followed && typeof input.followed === 'object' ? input.followed : {};
  const followed = {};
  for (const key of SOCIAL_KEYS) {
    const column = GIVEAWAY_SOCIAL_CHANNELS.find((channel) => channel.key === key)?.column;
    followed[key] = nested[key] === true
      || input[key] === true
      || input[column] === true
      || input[`followed_${key}`] === true
      || input[`followed${key.charAt(0).toUpperCase()}${key.slice(1)}`] === true;
  }
  return followed;
}

export function normalizeGiveawayEntry(input = {}, extras = {}) {
  const email = String(input.email || '').trim().toLowerCase().slice(0, 254);
  const source = trimText(input.source, 80) || GIVEAWAY_SOURCE;
  return {
    fullName: trimText(input.fullName || input.name, 120),
    email,
    phone: trimText(input.phone, 30),
    zipCode: normalizeGiveawayZip(input.zipCode || input.zip),
    customerType: String(input.customerType || input.customerCategory || '').trim(),
    gardenStatus: String(input.gardenStatus || '').trim(),
    growing: normalizeGiveawayGrowing(input.growing),
    growingOther: trimText(input.growingOther || input.growing_other, 80) || null,
    notes: trimText(input.notes, 500) || null,
    emailConsent: input.emailConsent === true || input.consent === true,
    rulesConsent: input.rulesConsent === true || input.officialRules === true,
    followed: readFollowed(input),
    source,
    website: String(input.website || '').trim(),
    userAgent: trimText(extras.userAgent || input.userAgent || input.user_agent, 400),
  };
}

function missingFollows(followed) {
  return SOCIAL_KEYS.filter((key) => !followed[key]);
}

export function validateGiveawayEntry(input = {}, extras = {}) {
  const entry = normalizeGiveawayEntry(input, extras);
  if (entry.website) return { ok: true, bot: true, entry };
  if (entry.fullName.length < 2) return { ok: false, error: 'Please enter your full name.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(entry.email)) {
    return { ok: false, error: 'Please enter a valid email address.' };
  }
  if (entry.phone.replace(/\D/g, '').length < 10) {
    return { ok: false, error: 'Please enter a valid phone number.' };
  }
  if (!entry.zipCode) return { ok: false, error: 'Please enter a valid US ZIP code.' };
  if (!CUSTOMER_TYPE_VALUES.has(entry.customerType)) {
    return { ok: false, error: 'Please tell us who you are.' };
  }
  if (!GARDEN_STATUS_VALUES.has(entry.gardenStatus)) {
    return { ok: false, error: 'Please tell us if this is a brand new or existing garden.' };
  }
  if (!entry.growing.length) return { ok: false, error: 'Please tell us what you are growing.' };
  if (!entry.emailConsent) {
    return { ok: false, error: 'Please confirm we may email you about this giveaway.' };
  }
  if (!entry.rulesConsent) {
    return { ok: false, error: 'Please confirm you are eligible and agree to the official rules.' };
  }
  if (missingFollows(entry.followed).length) {
    return { ok: false, error: 'Please follow each channel, then check the box.' };
  }
  return { ok: true, bot: false, entry };
}

export function giveawayEntryRow(entry, { now = new Date(), isPreview = false } = {}) {
  const timestamp = now instanceof Date ? now.toISOString() : now;
  return {
    source: entry.source || GIVEAWAY_SOURCE,
    campaign_key: GIVEAWAY_CAMPAIGN_KEY,
    is_preview: isPreview === true,
    full_name: entry.fullName,
    email: entry.email,
    email_normalized: entry.email,
    phone: entry.phone,
    zip_code: entry.zipCode,
    customer_type: entry.customerType,
    garden_status: entry.gardenStatus,
    growing: entry.growing,
    growing_other: entry.growingOther,
    notes: entry.notes,
    email_consent: entry.emailConsent === true,
    rules_consent: entry.rulesConsent === true,
    followed_ig: entry.followed?.ig === true,
    followed_fb: entry.followed?.fb === true,
    followed_yt: entry.followed?.yt === true,
    followed_tt: entry.followed?.tt === true,
    user_agent: entry.userAgent || null,
    created_at: timestamp,
    updated_at: timestamp,
  };
}

export async function saveGiveawayEntry({ db, entry, now = new Date() }) {
  const row = giveawayEntryRow(entry, { now, isPreview: false });
  const { data: existing, error: existingError } = await db
    .from('sp_giveaway_entries')
    .select('id, created_at')
    .eq('source', row.source)
    .eq('email_normalized', row.email_normalized)
    .eq('is_preview', false)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing) return { created: false, entry: existing };

  const { data, error } = await db
    .from('sp_giveaway_entries')
    .insert(row)
    .select('id, created_at')
    .single();
  if (error) {
    if (error.code === '23505') return { created: false, entry: { id: null, created_at: null } };
    throw error;
  }
  return { created: true, entry: data };
}

export async function processGiveawayEntry({
  db,
  body,
  userAgent = '',
  env,
  now = new Date(),
} = {}) {
  const entriesOpen = areGiveawayEntriesOpen(env);
  const normalized = normalizeGiveawayEntry(body || {}, { userAgent });
  if (normalized.website) return { status: 200, json: { success: true } };

  if (!entriesOpen) {
    return {
      status: 403,
      json: {
        success: false,
        error: GIVEAWAY_ENTRIES_CLOSED_MESSAGE,
        entriesOpen: false,
      },
    };
  }

  const validation = validateGiveawayEntry(body || {}, { userAgent });
  if (!validation.ok) return { status: 400, json: { error: validation.error } };

  const result = await saveGiveawayEntry({ db, entry: validation.entry, now });
  return {
    status: result.created ? 201 : 200,
    json: {
      success: true,
      entryId: result.entry?.id || null,
      alreadyEntered: !result.created,
      message: result.created
        ? 'Your giveaway entry is saved.'
        : 'This email already has one entry.',
    },
  };
}
