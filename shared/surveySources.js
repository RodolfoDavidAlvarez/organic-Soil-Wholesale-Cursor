export const SURVEY_SOURCE = 'osw-survey';
export const GARDEN_CLASS_SURVEY_SOURCE = 'garden-class-2026-08';

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
