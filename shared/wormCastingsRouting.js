/** Routing questions for the August /free-worm-castings gift signup.
 *  Source of truth: SSW Planning (Mike, San Diego Aug 13-15, 2026)
 *  and SSW Promotion Plan. Do not invent extra plant SKUs.
 */

export const WORM_CASTINGS_OFFER = 'free-9lb-mikeys-worm-poop';
export const WORM_CASTINGS_OFFER_LABEL = "Free 9-lb bag of Mikey's Worm Poop";

export const WORM_CASTINGS_CUSTOMER_TYPES = Object.freeze([
  ['homeowner', 'Homeowner'],
  ['landscaper', 'Landscaper'],
  ['specialty-farmer', 'Specialty farmer'],
]);

export const WORM_CASTINGS_GARDEN_STATUSES = Object.freeze([
  ['brand-new', 'Brand new'],
  ['existing', 'Existing'],
]);

export const WORM_CASTINGS_GROWING_OPTIONS = Object.freeze([
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

const CUSTOMER_TYPE_VALUES = new Set(WORM_CASTINGS_CUSTOMER_TYPES.map(([value]) => value));
const GARDEN_STATUS_VALUES = new Set(WORM_CASTINGS_GARDEN_STATUSES.map(([value]) => value));
const GROWING_VALUES = new Set(WORM_CASTINGS_GROWING_OPTIONS.map(([value]) => value));
const GROWING_LABELS = Object.fromEntries(WORM_CASTINGS_GROWING_OPTIONS);

export function labelForCustomerType(value) {
  return WORM_CASTINGS_CUSTOMER_TYPES.find(([key]) => key === value)?.[1] || '';
}

export function labelForGardenStatus(value) {
  return WORM_CASTINGS_GARDEN_STATUSES.find(([key]) => key === value)?.[1] || '';
}

export function normalizeZipCode(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length === 5) return digits;
  if (digits.length === 9) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return null;
}

export function normalizeGrowingSelection(value) {
  const raw = Array.isArray(value) ? value : typeof value === 'string' && value ? [value] : [];
  const unique = [];
  for (const item of raw) {
    const key = String(item || '').trim();
    if (!GROWING_VALUES.has(key) || unique.includes(key)) continue;
    unique.push(key);
  }
  return unique;
}

export function propertyProfileFromGrowing(growing, growingOther) {
  const labels = normalizeGrowingSelection(growing).map((key) => GROWING_LABELS[key]);
  const other = String(growingOther || '').trim();
  if (other) labels.push(`Other: ${other}`);
  return labels.join(', ');
}

export function nextActionForGardenStatus(gardenStatus) {
  return gardenStatus === 'brand-new'
    ? 'yard_pickup_then_intro_prescription'
    : 'yard_pickup_then_existing_garden_upsell';
}

export function nextActionLabel(nextAction) {
  if (nextAction === 'yard_pickup_then_intro_prescription') {
    return 'Yard pickup, then intro soil prescription';
  }
  if (nextAction === 'yard_pickup_then_existing_garden_upsell') {
    return 'Yard pickup, then existing-garden upsell';
  }
  return String(nextAction || '').trim();
}

export function validateWormCastingsRouting(body = {}) {
  const customerType = String(body.customerType || body.customerCategory || '').trim();
  const gardenStatus = String(body.gardenStatus || '').trim();
  const growing = normalizeGrowingSelection(body.growing);
  const growingOther = String(body.growingOther || '').trim().slice(0, 120);
  const zipCode = normalizeZipCode(body.zipCode || body.zip);

  if (!CUSTOMER_TYPE_VALUES.has(customerType)) {
    return { ok: false, error: 'Please tell us who you are.' };
  }
  if (!GARDEN_STATUS_VALUES.has(gardenStatus)) {
    return { ok: false, error: 'Please tell us if this is a brand new or existing garden.' };
  }
  if (!growing.length) {
    return { ok: false, error: 'Please tell us what you are growing.' };
  }
  if (!zipCode) {
    return { ok: false, error: 'Please enter a valid US ZIP code.' };
  }

  const propertyProfile = propertyProfileFromGrowing(growing, growingOther);
  const nextAction = nextActionForGardenStatus(gardenStatus);

  return {
    ok: true,
    routing: {
      customerType,
      gardenStatus,
      growing,
      growingOther: growingOther || null,
      zipCode,
      propertyProfile,
      offer: WORM_CASTINGS_OFFER,
      nextAction,
    },
  };
}

export function routingRecordColumns(routing, source) {
  return {
    zip_code: routing.zipCode,
    customer_type: routing.customerType,
    garden_status: routing.gardenStatus,
    growing: routing.growing,
    growing_other: routing.growingOther,
    property_profile: routing.propertyProfile,
    offer: routing.offer || WORM_CASTINGS_OFFER,
    source: source || null,
    next_action: routing.nextAction,
  };
}

export function routingNotesBlock(routing, now = new Date().toISOString()) {
  return [
    `[Worm castings routing ${now}]`,
    `Customer type: ${labelForCustomerType(routing.customerType) || routing.customerType}`,
    `Garden: ${labelForGardenStatus(routing.gardenStatus) || routing.gardenStatus}`,
    `Property profile: ${routing.propertyProfile}`,
    `ZIP: ${routing.zipCode}`,
    `Offer: ${WORM_CASTINGS_OFFER}`,
    `Next action: ${nextActionLabel(routing.nextAction)}`,
  ].join('\n');
}

export async function persistWormCastingsRouting({ db, customer, redemptionId, routing, source }) {
  const now = new Date().toISOString();
  const columns = routingRecordColumns(routing, source);

  const redemptionUpdate = await db
    .from('sp_worm_castings_redemptions')
    .update({ ...columns, updated_at: now })
    .eq('id', redemptionId)
    .select('id')
    .maybeSingle();
  if (redemptionUpdate.error) throw redemptionUpdate.error;

  const customerPatch = {
    newsletter_contact_type: routing.customerType,
    updated_at: now,
  };
  const existingZip = String(customer?.delivery_zip || '').trim();
  if (!existingZip) customerPatch.delivery_zip = routing.zipCode;

  const existingNotes = String(customer?.newsletter_notes || '').trim();
  customerPatch.newsletter_notes = [existingNotes, routingNotesBlock(routing, now)].filter(Boolean).join('\n\n');

  const customerUpdate = await db
    .from('sp_customers')
    .update(customerPatch)
    .eq('id', customer.id);
  if (customerUpdate.error) throw customerUpdate.error;

  return columns;
}
