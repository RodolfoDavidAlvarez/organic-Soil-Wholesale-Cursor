/**
 * OSW developer / staging mode.
 * When ON: team-facing fan-out (MOS, yard SMS) is suppressed; Rodo still gets notifications.
 * Toggle via OSW_DEVELOPER_MODE=true (Vercel env or local .env).
 */

import {
  getPickupNotifySmsPhones,
  isPickupNotifyTesting,
} from './pickupNotifications.js';

export const DEV_ADMIN_EMAIL = 'ralvarez@soilseedandwater.com';

export function isOswDeveloperMode() {
  const v = String(process.env.OSW_DEVELOPER_MODE || '').trim().toLowerCase();
  return v === 'true' || v === '1' || v === 'yes';
}

export function getDevSiteConfig() {
  return {
    developerMode: isOswDeveloperMode(),
    label: isOswDeveloperMode()
      ? 'Developer mode ON — test orders notify Rodo only; team alerts paused'
      : null,
  };
}

export function shouldForwardToMos() {
  return !isOswDeveloperMode();
}

/** Customer emails redirect to Rodo during dev mode so real customers are not disturbed. */
export function resolveCustomerEmail(customerEmail) {
  if (isOswDeveloperMode()) return DEV_ADMIN_EMAIL;
  return customerEmail;
}

/** Customer SMS redirect to Rodo during dev mode. */
export function resolveCustomerSmsPhone(phone) {
  if (isOswDeveloperMode()) return process.env.RODO_PHONE || null;
  return phone;
}

export function devModeSubject(subject) {
  return isOswDeveloperMode() ? `[DEV TEST] ${subject}` : subject;
}

export function devModeSmsBody(body) {
  return isOswDeveloperMode() ? `[DEV TEST] ${body}` : body;
}

/** Yard admin SMS fan-out — respects testing mode, dev mode, and pickup location. */
export function getYardAdminPhones(locationId = 1) {
  if (isPickupNotifyTesting() || isOswDeveloperMode()) {
    const rodo = process.env.RODO_PHONE;
    return rodo ? [rodo] : [];
  }
  return getPickupNotifySmsPhones(locationId);
}
