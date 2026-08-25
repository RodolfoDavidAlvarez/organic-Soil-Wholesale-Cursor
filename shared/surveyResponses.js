import { randomBytes } from 'node:crypto';
import {
  GARDEN_CLASS_EVENT_KEY,
  GARDEN_CLASS_SURVEY_SOURCE,
  SURVEY_KIND_GARDEN_CLASS,
  SURVEY_KIND_PURCHASE,
  SURVEY_SOURCE,
  isGardenClassSurveySource,
  normalizeSurveyKindFilter,
  normalizeSurveySource,
  surveyKindFromSource,
} from './surveySources.js';

export {
  GARDEN_CLASS_EVENT_KEY,
  GARDEN_CLASS_SURVEY_SOURCE,
  SURVEY_KIND_GARDEN_CLASS,
  SURVEY_KIND_PURCHASE,
  SURVEY_SOURCE,
  isGardenClassSurveySource,
  normalizeSurveyKindFilter,
  normalizeSurveySource,
  surveyKindFromSource,
};

export const SURVEY_COUPON_LABEL = 'SSW survey thank-you';
export const SURVEY_COUPON_OFFER = '30% off one item, one time, Phoenix yard pickup.';
export const SURVEY_COUPON_RESTRICTIONS =
  'Not the whole ticket. Not delivery. Not already-discounted workshop pallets.';
export const SURVEY_COUPON_VALID_DAYS = 30;
export const SURVEY_COUPON_PREFIX = 'SSW30-';
export const SURVEY_COUPON_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const SURVEY_COUPON_CODE_RE = /^SSW30-[A-HJ-NP-Z2-9]{8}$/;

const YES_NO = new Set(['yes', 'no', 'not-sure']);
export const GARDEN_CLASS_SATURDAY_FEEL = new Set(['great', 'okay', 'rough']);
export const GARDEN_CLASS_HEAT_CALL = new Set(['yes', 'not-sure', 'no']);
export const GARDEN_CLASS_TEACHING = new Set(['loved-it', 'fine', 'lost-me']);
export const GARDEN_CLASS_COME_AGAIN = new Set(['yes', 'maybe', 'no']);
const COUPON_SELECT =
  'id, first_name, email, coupon_code, coupon_issued_at, coupon_expires_at, coupon_redeemed_at';
const SAVED_SELECT = `${COUPON_SELECT}, created_at, customer_id, survey_kind, event_key, scores, notes, source`;
const INBOX_SELECT =
  'id, created_at, survey_kind, event_key, source, first_name, email_normalized, customer_id, would_come_back, notes, scores, user_agent, coupon_code';

function trimText(value, max) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function compactScores(values) {
  const scores = {};
  for (const [key, value] of Object.entries(values)) {
    if (value) scores[key] = value;
  }
  return scores;
}

export function normalizeSurveyResponse(input = {}, extras = {}) {
  const source = normalizeSurveySource(input.source);
  const isClass = isGardenClassSurveySource(source);
  const wouldSendFriend = String(input.wouldSendFriend || input.would_send_friend || '').trim().toLowerCase();
  const saturdayFeel = trimText(
    input.saturdayFeel || input.saturday_feel || (isClass ? input.whatFeltEasy || input.what_felt_easy : ''),
    40,
  ).toLowerCase();
  const heatCall = trimText(
    input.heatCall || input.heat_call || (isClass ? input.whatFeltConfusing || input.what_felt_confusing : ''),
    40,
  ).toLowerCase();
  const teaching = trimText(
    input.teaching || (isClass ? input.whatToAddNext || input.what_to_add_next : ''),
    40,
  ).toLowerCase();
  const comeAgain = trimText(
    input.comeAgain || input.come_again || input.wouldComeBack || input.would_come_back,
    40,
  ).toLowerCase();
  const wouldComeBack = isClass
    ? comeAgain
    : String(input.wouldComeBack || input.would_come_back || '').trim().toLowerCase();
  const notes = trimText(input.notes || input.comment || input.visitFeedback || input.visit_feedback, 500);
  const visitFeedback = isClass
    ? notes
    : trimText(input.visitFeedback || input.visit_feedback || input.q1, 500);
  const eventKey = trimText(input.eventKey || input.event_key, 80) || (isClass ? GARDEN_CLASS_EVENT_KEY : '');

  return {
    firstName: trimText(input.firstName || input.first_name || input.name, 80),
    email: String(input.email || '').trim().toLowerCase().slice(0, 254),
    phone: trimText(input.phone, 30),
    visitFeedback,
    notes,
    whatFeltEasy: isClass ? saturdayFeel : trimText(input.whatFeltEasy || input.what_felt_easy || input.q2, 500),
    whatFeltConfusing: isClass
      ? heatCall
      : trimText(input.whatFeltConfusing || input.what_felt_confusing || input.q3, 500),
    whatToAddNext: isClass ? teaching : trimText(input.whatToAddNext || input.what_to_add_next || input.q4, 500),
    wouldComeBack: isClass
      ? (GARDEN_CLASS_COME_AGAIN.has(wouldComeBack) ? wouldComeBack : trimText(wouldComeBack, 80))
      : YES_NO.has(wouldComeBack)
        ? wouldComeBack
        : trimText(wouldComeBack, 80),
    wouldSendFriend: YES_NO.has(wouldSendFriend) ? wouldSendFriend : trimText(wouldSendFriend, 80),
    saturdayFeel,
    heatCall,
    teaching,
    comeAgain,
    scores: isClass
      ? compactScores({ saturdayFeel, heatCall, teaching, comeAgain })
      : compactScores({
          wouldComeBack: YES_NO.has(wouldComeBack) ? wouldComeBack : '',
          wouldSendFriend: YES_NO.has(wouldSendFriend) ? wouldSendFriend : '',
        }),
    surveyKind: surveyKindFromSource(source),
    eventKey,
    source,
    website: String(input.website || '').trim(),
    userAgent: trimText(extras.userAgent || input.userAgent || input.user_agent, 400),
  };
}

function validateContactFields(response) {
  if (response.firstName.length < 1) return { ok: false, error: 'Please enter your first name.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(response.email)) {
    return { ok: false, error: 'Please enter a valid email address.' };
  }
  if (response.phone && response.phone.replace(/\D/g, '').length < 10) {
    return { ok: false, error: 'Please enter a valid phone number, or leave it blank.' };
  }
  return null;
}

function validateGardenClassSurvey(response) {
  const contactError = validateContactFields(response);
  if (contactError) return contactError;
  if (!GARDEN_CLASS_SATURDAY_FEEL.has(response.saturdayFeel || response.whatFeltEasy)) {
    return { ok: false, error: 'Please tell us how Saturday felt.' };
  }
  if (!GARDEN_CLASS_HEAT_CALL.has(response.heatCall || response.whatFeltConfusing)) {
    return { ok: false, error: 'Please tell us if 8am was the right call.' };
  }
  if (!GARDEN_CLASS_TEACHING.has(response.teaching || response.whatToAddNext)) {
    return { ok: false, error: 'Please tell us how the teaching felt.' };
  }
  if (!GARDEN_CLASS_COME_AGAIN.has(response.comeAgain || response.wouldComeBack)) {
    return { ok: false, error: 'Please tell us if you would come to another class.' };
  }
  return { ok: true, bot: false, response };
}

export function validateSurveyResponse(input = {}, extras = {}) {
  const response = normalizeSurveyResponse(input, extras);
  if (response.website) return { ok: true, bot: true, response };
  if (isGardenClassSurveySource(response.source)) {
    return validateGardenClassSurvey(response);
  }
  const contactError = validateContactFields(response);
  if (contactError) return contactError;
  if (response.visitFeedback.length < 2) {
    return { ok: false, error: 'Please tell us how your visit or order went.' };
  }
  return { ok: true, bot: false, response };
}

export function generateSurveyCouponCode(bytes = randomBytes(8)) {
  let body = '';
  for (let i = 0; i < 8; i += 1) {
    body += SURVEY_COUPON_ALPHABET[bytes[i] % SURVEY_COUPON_ALPHABET.length];
  }
  return `${SURVEY_COUPON_PREFIX}${body}`;
}

export function isSurveyCouponCode(value) {
  return SURVEY_COUPON_CODE_RE.test(String(value || '').trim().toUpperCase());
}

export function surveyCouponExpiresAt(from = new Date()) {
  const issued = from instanceof Date ? from : new Date(from);
  return new Date(issued.getTime() + SURVEY_COUPON_VALID_DAYS * 24 * 60 * 60 * 1000);
}

export function surveyCouponQrPath(code) {
  return `/api/public/survey-coupon/qr/${encodeURIComponent(String(code || '').trim().toUpperCase())}.png`;
}

export function parseSurveyCouponQrRequest(fileName) {
  const match = String(fileName || '').trim().match(/^(SSW30-[A-HJ-NP-Z2-9]{8})\.(png|svg)$/i);
  if (!match) return null;
  return { code: match[1].toUpperCase(), format: match[2].toLowerCase() };
}

export function buildPublicSurveyCoupon(row, { reused = false } = {}) {
  if (!row?.coupon_code) return null;
  return {
    code: row.coupon_code,
    label: SURVEY_COUPON_LABEL,
    offer: SURVEY_COUPON_OFFER,
    restrictions: SURVEY_COUPON_RESTRICTIONS,
    firstName: row.first_name,
    email: row.email,
    issuedAt: row.coupon_issued_at,
    expiresAt: row.coupon_expires_at,
    redeemedAt: row.coupon_redeemed_at || null,
    qrUrl: surveyCouponQrPath(row.coupon_code),
    reused: Boolean(reused),
  };
}

function isUniqueViolation(error, constraint) {
  const message = `${error?.message || ''} ${error?.details || ''}`;
  if (error?.code !== '23505') return false;
  return constraint ? message.includes(constraint) : true;
}

async function findCustomerId(db, email) {
  try {
    const { data, error } = await db
      .from('sp_customers')
      .select('id')
      .ilike('email', email)
      .limit(1);
    if (error) {
      console.error('[Survey] Customer lookup skipped:', error.message || error);
      return null;
    }
    return data?.[0]?.id || null;
  } catch (error) {
    console.error('[Survey] Customer lookup skipped:', error?.message || error);
    return null;
  }
}

export async function findSurveyCouponByEmail(db, email) {
  const { data, error } = await db
    .from('sp_survey_responses')
    .select(COUPON_SELECT)
    .eq('email_normalized', email)
    .not('coupon_code', 'is', null)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

export async function findSurveyCouponByCode(db, code) {
  const normalized = String(code || '').trim().toUpperCase();
  if (!isSurveyCouponCode(normalized)) return null;
  const { data, error } = await db
    .from('sp_survey_responses')
    .select('id')
    .eq('coupon_code', normalized)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

function surveyRow(response, customerId, coupon = null) {
  const isClass = isGardenClassSurveySource(response.source);
  return {
    first_name: response.firstName,
    email: response.email,
    email_normalized: response.email,
    phone: response.phone || null,
    visit_feedback: response.visitFeedback || '',
    what_felt_easy: response.whatFeltEasy || null,
    what_felt_confusing: response.whatFeltConfusing || null,
    what_to_add_next: response.whatToAddNext || null,
    would_come_back: response.wouldComeBack || null,
    would_send_friend: isClass ? null : response.wouldSendFriend || null,
    notes: response.notes || null,
    survey_kind: response.surveyKind || surveyKindFromSource(response.source),
    event_key: response.eventKey || null,
    scores: response.scores || {},
    source: response.source || SURVEY_SOURCE,
    user_agent: response.userAgent || null,
    customer_id: customerId,
    ...(coupon || {}),
  };
}

async function insertSurveyRow(db, row) {
  const { data: saved, error } = await db
    .from('sp_survey_responses')
    .insert(row)
    .select(SAVED_SELECT)
    .single();
  return { saved, error };
}

export async function listSurveyInbox(db, { kind = 'all', limit = 100 } = {}) {
  const filter = normalizeSurveyKindFilter(kind);
  const take = Math.min(Math.max(Number(limit) || 100, 1), 200);

  const { data: kindRows, error: kindError } = await db
    .from('sp_survey_responses')
    .select('survey_kind');
  if (kindError) throw kindError;

  const counts = { all: 0 };
  for (const row of kindRows || []) {
    const surveyKind = row.survey_kind || SURVEY_KIND_PURCHASE;
    counts[surveyKind] = (counts[surveyKind] || 0) + 1;
    counts.all += 1;
  }

  let query = db.from('sp_survey_responses').select(INBOX_SELECT);
  if (filter !== 'all') query = query.eq('survey_kind', filter);
  const { data, error } = await query.order('created_at', { ascending: false }).limit(take);
  if (error) throw error;

  return { kind: filter, counts, rows: data || [] };
}

function issueCouponFields({ now, createCouponCode }) {
  const issuedAt = now instanceof Date ? now : new Date(now || Date.now());
  return {
    coupon_code: createCouponCode(),
    coupon_issued_at: issuedAt.toISOString(),
    coupon_expires_at: surveyCouponExpiresAt(issuedAt).toISOString(),
  };
}

export async function saveSurveyResponse({
  db,
  response,
  now = new Date(),
  createCouponCode = generateSurveyCouponCode,
} = {}) {
  const customerId = await findCustomerId(db, response.email);

  if (isGardenClassSurveySource(response.source)) {
    const { saved, error } = await insertSurveyRow(db, surveyRow(response, customerId));
    if (error) throw error;
    return { response: saved, coupon: null };
  }

  const existingCoupon = await findSurveyCouponByEmail(db, response.email);

  if (existingCoupon?.coupon_code) {
    const { saved, error } = await insertSurveyRow(db, surveyRow(response, customerId));
    if (error) throw error;
    return {
      response: saved,
      coupon: buildPublicSurveyCoupon(existingCoupon, { reused: true }),
    };
  }

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const couponFields = issueCouponFields({ now, createCouponCode });
    const { saved, error } = await insertSurveyRow(
      db,
      surveyRow(response, customerId, couponFields),
    );
    if (!error) {
      return {
        response: saved,
        coupon: buildPublicSurveyCoupon(saved, { reused: false }),
      };
    }
    if (isUniqueViolation(error, 'sp_survey_responses_one_coupon_per_email_idx')) {
      const { saved: repeat, error: repeatError } = await insertSurveyRow(
        db,
        surveyRow(response, customerId),
      );
      if (repeatError) throw repeatError;
      const issued = await findSurveyCouponByEmail(db, response.email);
      return {
        response: repeat,
        coupon: buildPublicSurveyCoupon(issued, { reused: true }),
      };
    }
    if (isUniqueViolation(error, 'sp_survey_responses_coupon_code_idx') && attempt < 3) {
      continue;
    }
    throw error;
  }

  throw new Error('Could not issue a unique yard coupon.');
}
