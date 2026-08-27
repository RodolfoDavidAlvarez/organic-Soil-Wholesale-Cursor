import { resolvePromoBundle } from "./promoBundles.js";

/** Flatbed / Moffett: 1 pallet or tote = 1 spot. Full load = 22 spots → 10% product discount. */
export const FLATBED_CAPACITY = 22;
export const FULL_LOAD_PRODUCT_DISCOUNT = 0.1;

export function isFlatbedFormat(format) {
  const key = String(format || '').toLowerCase();
  if (!key) return false;
  if (key.includes('flatbed')) return true;
  if (key.includes('truckload') && key.includes('pallet')) return true;
  if (key.includes('pallet') || key.includes('tote') || key.includes('supersack') || key.includes('super sack')) {
    return true;
  }
  return false;
}

export function spotsForFormat(format, quantity = 1) {
  const key = String(format || '');
  const qty = Math.max(0, Number(quantity) || 0);
  if (!key || qty <= 0) return 0;
  const match = key.match(/(\d+)\s*pallets?/i);
  if (match) return Number(match[1]) * qty;
  if (isFlatbedFormat(key)) return qty;
  return 0;
}

export function cartFlatbedSpots(items) {
  return (items || []).reduce((sum, item) => {
    const format = item.format || item.sizeOption || '';
    return sum + spotsForFormat(format, item.quantity);
  }, 0);
}

/**
 * Loose 24-ton walking-floor delivery — always delivered.
 * Do NOT treat flatbed pallet "truckloads" or bag/pallet lines as this.
 */
export function isWalkingFloorDeliveryFormat(format) {
  const key = String(format || '').toLowerCase();
  if (!key) return false;
  if (key.includes('pallet') || key.includes('tote') || key.includes('supersack') || key.includes('super sack')) {
    return false;
  }
  if (key.includes('flatbed')) return false;
  if (key.includes('bulk pickup')) return false;
  if (key.includes('truckload') && (key.includes('24') || key.includes('ton') || key.includes('cu yd') || key.includes('walking'))) {
    return true;
  }
  return key.includes('truckload') && !key.includes('pallet');
}

/** Loose bulk yard pickup (not walking-floor truckload delivery). */
export function isLooseBulkPickupFormat(format) {
  const key = String(format || '').toLowerCase();
  if (!key) return false;
  if (isWalkingFloorDeliveryFormat(key)) return false;
  return key.includes('bulk');
}

/**
 * Pallet / tote / super sack / loose bulk need a scheduled heads-up for pickup.
 * Bags-only carts can use ASAP (~30 min).
 */
export function requiresPickupHeadsUp(items) {
  return (items || []).some((item) => {
    const format = item.format || item.sizeOption || '';
    if (spotsForFormat(format, item.quantity) > 0) return true;
    return isLooseBulkPickupFormat(format);
  });
}

export function hasFullFlatbedDiscount(spots) {
  return spots === FLATBED_CAPACITY;
}

/**
 * Apply 10% product discount to flatbed-eligible lines when spots === 22.
 * Returns new items array (does not mutate). Non-eligible lines unchanged.
 */
export function applyFullFlatbedProductDiscount(items) {
  const spots = cartFlatbedSpots(items);
  if (!hasFullFlatbedDiscount(spots)) {
    return { items, spots, applied: false, discountAmount: 0 };
  }

  let discountAmount = 0;
  const priced = (items || []).map((item) => {
    if (resolvePromoBundle(item)) return item;
    const format = item.format || item.sizeOption || '';
    const spotsOnLine = spotsForFormat(format, item.quantity);
    if (spotsOnLine <= 0) return item;
    const price = Number(item.price ?? item.unitPrice) || 0;
    const discounted = +(price * (1 - FULL_LOAD_PRODUCT_DISCOUNT)).toFixed(2);
    discountAmount += (price - discounted) * (Number(item.quantity) || 0);
    if (item.price != null) return { ...item, price: discounted };
    return { ...item, unitPrice: discounted };
  });

  return {
    items: priced,
    spots,
    applied: true,
    discountAmount: +discountAmount.toFixed(2),
  };
}
