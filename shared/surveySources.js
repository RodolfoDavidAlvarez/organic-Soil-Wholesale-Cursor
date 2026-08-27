export const SURVEY_SOURCE = 'osw-survey';
export const GARDEN_CLASS_SURVEY_SOURCE = 'garden-class-2026-08';
export const GARDEN_CLASS_EVENT_KEY = 'fall-garden-workshop-2026-08-22';
export const SURVEY_KIND_PURCHASE = 'purchase';
export const SURVEY_KIND_GARDEN_CLASS = 'garden-class';

const CLASS_SOURCE_ALIASES = new Set([
  GARDEN_CLASS_SURVEY_SOURCE,
  'garden-class',
  `${SURVEY_SOURCE}:${GARDEN_CLASS_SURVEY_SOURCE}`,
]);

export function isGardenClassSurveySource(value) {
  const source = String(value || '').trim().toLowerCase();
  if (!source) return false;
  if (CLASS_SOURCE_ALIASES.has(source)) return true;
  return source.endsWith(`:${GARDEN_CLASS_SURVEY_SOURCE}`);
}

export function normalizeSurveySource(value) {
  const raw = String(value || '').replace(/\s+/g, ' ').trim().slice(0, 120);
  if (isGardenClassSurveySource(raw)) return GARDEN_CLASS_SURVEY_SOURCE;
  if (!raw) return SURVEY_SOURCE;
  return raw.startsWith(SURVEY_SOURCE) ? raw : `${SURVEY_SOURCE}:${raw}`.slice(0, 120);
}

export function surveyKindFromSource(value) {
  return isGardenClassSurveySource(value) ? SURVEY_KIND_GARDEN_CLASS : SURVEY_KIND_PURCHASE;
}

export function normalizeSurveyKindFilter(value) {
  const kind = String(value || 'all').trim().toLowerCase();
  if (!kind || kind === 'all') return 'all';
  if (/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(kind) && kind.length <= 40) return kind;
  return 'all';
}

export function readGardenClassSurveyPrefill(search) {
  const raw = String(search || '');
  const params = new URLSearchParams(raw.startsWith('?') ? raw.slice(1) : raw);
  const pick = (...keys) => {
    for (const key of keys) {
      const value = params.get(key);
      if (value != null && String(value).trim()) return String(value).trim();
    }
    return '';
  };

  const email = pick('email');
  const lastName = pick('last_name', 'lastName');
  const firstFromKey = pick('first_name', 'firstName');
  const fullName = pick('name');
  const firstName = firstFromKey || (fullName ? fullName.split(/\s+/)[0] || '' : '');
  return { firstName, email, lastName };
}

export function readSurveyPrefill(search) {
  const prefill = readGardenClassSurveyPrefill(search);
  return { firstName: prefill.firstName, email: prefill.email };
}
