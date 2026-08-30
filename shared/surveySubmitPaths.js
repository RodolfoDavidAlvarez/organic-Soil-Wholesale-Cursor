/**
 * Public survey POST paths.
 *
 * Canonical write path (live /survey and /survey/garden-class): /api/survey/submit
 * Production also accepts /api/survey.
 *
 * /api/public/survey and /api/surveys 404'd on organicsoilwholesale.com
 * (system_errors 2026-08-28 16:55 UTC, unmatched_input). Alias them so those
 * posts save instead of alerting. Do not treat them as a second write path.
 */
export const SURVEY_SUBMIT_POST_PATHS = Object.freeze([
  "/api/survey",
  "/api/survey/submit",
  "/api/public/survey",
  "/api/surveys",
]);

export const SURVEY_SUBMIT_MOUNT_PREFIXES = Object.freeze([
  "/api/survey",
  "/api/public/survey",
  "/api/surveys",
]);

export function isSurveySubmitPostPath(path) {
  return SURVEY_SUBMIT_POST_PATHS.includes(path);
}
