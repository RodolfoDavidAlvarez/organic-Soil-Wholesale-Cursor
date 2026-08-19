export const SURVEY_SOURCE = 'osw-survey';

const YES_NO = new Set(['yes', 'no', 'not-sure']);

function trimText(value, max) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

export function normalizeSurveyResponse(input = {}, extras = {}) {
  const wouldComeBack = String(input.wouldComeBack || input.would_come_back || '').trim().toLowerCase();
  const wouldSendFriend = String(input.wouldSendFriend || input.would_send_friend || '').trim().toLowerCase();
  const source = trimText(input.source, 120) || SURVEY_SOURCE;

  return {
    firstName: trimText(input.firstName || input.first_name || input.name, 80),
    email: String(input.email || '').trim().toLowerCase().slice(0, 254),
    phone: trimText(input.phone, 30),
    visitFeedback: trimText(input.visitFeedback || input.visit_feedback || input.q1, 500),
    whatFeltEasy: trimText(input.whatFeltEasy || input.what_felt_easy || input.q2, 500),
    whatFeltConfusing: trimText(input.whatFeltConfusing || input.what_felt_confusing || input.q3, 500),
    whatToAddNext: trimText(input.whatToAddNext || input.what_to_add_next || input.q4, 500),
    wouldComeBack: YES_NO.has(wouldComeBack) ? wouldComeBack : trimText(wouldComeBack, 80),
    wouldSendFriend: YES_NO.has(wouldSendFriend) ? wouldSendFriend : trimText(wouldSendFriend, 80),
    source: source.startsWith(SURVEY_SOURCE) ? source : `${SURVEY_SOURCE}:${source}`.slice(0, 120),
    website: String(input.website || '').trim(),
    userAgent: trimText(extras.userAgent || input.userAgent || input.user_agent, 400),
  };
}

export function validateSurveyResponse(input = {}, extras = {}) {
  const response = normalizeSurveyResponse(input, extras);
  if (response.website) return { ok: true, bot: true, response };
  if (response.firstName.length < 1) return { ok: false, error: 'Please enter your first name.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(response.email)) {
    return { ok: false, error: 'Please enter a valid email address.' };
  }
  if (response.phone && response.phone.replace(/\D/g, '').length < 10) {
    return { ok: false, error: 'Please enter a valid phone number, or leave it blank.' };
  }
  if (response.visitFeedback.length < 2) {
    return { ok: false, error: 'Please tell us how your visit or order went.' };
  }
  return { ok: true, bot: false, response };
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

export async function saveSurveyResponse({ db, response }) {
  const customerId = await findCustomerId(db, response.email);
  const row = {
    first_name: response.firstName,
    email: response.email,
    email_normalized: response.email,
    phone: response.phone || null,
    visit_feedback: response.visitFeedback,
    what_felt_easy: response.whatFeltEasy || null,
    what_felt_confusing: response.whatFeltConfusing || null,
    what_to_add_next: response.whatToAddNext || null,
    would_come_back: response.wouldComeBack || null,
    would_send_friend: response.wouldSendFriend || null,
    source: response.source || SURVEY_SOURCE,
    user_agent: response.userAgent || null,
    customer_id: customerId,
  };

  const { data: saved, error } = await db
    .from('sp_survey_responses')
    .insert(row)
    .select('id, created_at, customer_id')
    .single();
  if (error) throw error;

  return { response: saved };
}
