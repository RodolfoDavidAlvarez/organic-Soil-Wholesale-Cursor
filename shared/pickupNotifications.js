/**
 * Pickup order alerts (SMS + admin email) by location.
 *
 * Testing (OSW_PICKUP_NOTIFY_TESTING=true): Rodo only — use while validating checkout.
 * Production Phoenix (locationId 1): Rodo + Sabrina + Kash (YARD_ADMIN_PHONES).
 * Production Congress (locationId 2): Rodo + Kerry (logistics at Congress plant).
 */

export const PICKUP_NOTIFY_KERRY = {
  name: 'Kerry',
  phone: '+19288303304',
  email: 'kcooper@soilseedandwater.com',
};

export const PICKUP_NOTIFY_RODO = {
  phone: '+19285501649',
  email: 'ralvarez@soilseedandwater.com',
};

/** Documented team contacts — production uses YARD_ADMIN_PHONES when set. */
export const PICKUP_TEAM = {
  phoenix: [
    { name: 'Rodolfo', phone: '+19285501649', email: 'ralvarez@soilseedandwater.com' },
    { name: 'Sabrina', phone: '+15204796360', email: 'sabrina@soilseedandwater.com' },
    { name: 'Kash', phone: '+16025387999', email: 'kash@soilseedandwater.com' },
  ],
  congress: [
    { name: 'Rodolfo', phone: '+19285501649', email: 'ralvarez@soilseedandwater.com' },
    PICKUP_NOTIFY_KERRY,
  ],
};

export function isPickupNotifyTesting() {
  const v = String(
    process.env.OSW_PICKUP_NOTIFY_TESTING || process.env.OSW_DEVELOPER_MODE || '',
  ).trim().toLowerCase();
  return v === 'true' || v === '1' || v === 'yes';
}

export function getPickupLocationKey(locationId) {
  return Number(locationId) === 2 ? 'congress' : 'phoenix';
}

export function getPickupNotifySmsPhones(locationId = 1) {
  const rodo = process.env.RODO_PHONE || PICKUP_NOTIFY_RODO.phone;
  if (isPickupNotifyTesting()) {
    return rodo ? [rodo] : [];
  }

  if (getPickupLocationKey(locationId) === 'congress') {
    const raw = process.env.CONGRESS_NOTIFY_PHONES || '';
    const fromEnv = raw.split(',').map((s) => s.trim()).filter(Boolean);
    if (fromEnv.length) return [...new Set(fromEnv)];
    return PICKUP_TEAM.congress.map((p) => p.phone);
  }

  const raw = process.env.YARD_ADMIN_PHONES || '';
  const fromEnv = raw.split(',').map((s) => s.trim()).filter(Boolean);
  if (fromEnv.length) return [...new Set(fromEnv)];

  return PICKUP_TEAM.phoenix.map((p) => p.phone);
}

export function getPickupNotifyEmails(locationId = 1) {
  if (isPickupNotifyTesting()) {
    return [PICKUP_NOTIFY_RODO.email];
  }

  if (getPickupLocationKey(locationId) === 'congress') {
    return PICKUP_TEAM.congress.map((p) => p.email);
  }

  return PICKUP_TEAM.phoenix.map((p) => p.email);
}

export function formatNewPickupOrderSms({
  customerName,
  customerPhone,
  orderRef,
  readyLabel,
  pickupLocation,
  totalDollars,
  itemCount,
  testing = isPickupNotifyTesting(),
}) {
  const lines = [
    testing ? '[TEST] NEW OSW PICKUP ORDER' : 'NEW OSW PICKUP ORDER',
    orderRef ? `#${orderRef}` : null,
    customerName,
    customerPhone,
    readyLabel ? `Ready: ${readyLabel}` : null,
    pickupLocation ? `At: ${pickupLocation}` : null,
    typeof totalDollars === 'number' ? `Total: $${totalDollars.toFixed(2)}` : null,
    itemCount ? `${itemCount} item(s)` : null,
  ].filter(Boolean);
  return lines.join('\n');
}
