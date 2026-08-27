import { resolvePromoBundle } from "@shared/promoBundles.js";

/** Flatbed / Moffett capacity: one pallet or tote (super sack) = 1 spot. */
export const FLATBED_CAPACITY = 22;
/** Extra product discount when the cart fills exactly one flatbed (22 spots). */
export const FULL_LOAD_PRODUCT_DISCOUNT = 0.1;

export type SpotLine = {
  productId?: number;
  format: string;
  quantity: number;
  unitPrice?: number;
};

/** True when the format rides a flatbed (pallet, tote, or 22-pallet truckload SKU). */
export function isFlatbedFormat(format: string): boolean {
  const key = String(format || "").toLowerCase();
  if (!key) return false;
  if (key.includes("flatbed")) return true;
  if (key.includes("truckload") && key.includes("pallet")) return true;
  if (key.includes("pallet") || key.includes("tote") || key.includes("supersack") || key.includes("super sack")) {
    return true;
  }
  return false;
}

/**
 * Spots for one cart/quote line.
 * - "Truckload (22 pallets)" qty 1 → 22
 * - pallet / tote / super sack → qty
 * - bags / bulk walking-floor → 0
 */
export function spotsForFormat(format: string, quantity = 1): number {
  const key = String(format || "");
  const qty = Math.max(0, Number(quantity) || 0);
  if (!key || qty <= 0) return 0;

  const match = key.match(/(\d+)\s*pallets?/i);
  if (match) return Number(match[1]) * qty;

  if (isFlatbedFormat(key)) return qty;
  return 0;
}

export function cartFlatbedSpots(items: SpotLine[]): number {
  return items.reduce((sum, item) => sum + spotsForFormat(item.format, item.quantity), 0);
}

/**
 * Loose 24-ton walking-floor delivery — always delivered.
 * Do NOT treat flatbed pallet "truckloads" or bag/pallet lines as this.
 */
export function isWalkingFloorDeliveryFormat(format: string): boolean {
  const key = String(format || "").toLowerCase();
  if (!key) return false;
  if (key.includes("pallet") || key.includes("tote") || key.includes("supersack") || key.includes("super sack")) {
    return false;
  }
  if (key.includes("flatbed")) return false;
  if (key.includes("bulk pickup")) return false;
  // Standardized cart label + legacy size strings
  if (key.includes("truckload") && (key.includes("24") || key.includes("ton") || key.includes("cu yd") || key.includes("walking"))) {
    return true;
  }
  return key.includes("truckload") && !key.includes("pallet");
}

/** Loose bulk yard pickup (not walking-floor truckload delivery). */
export function isLooseBulkPickupFormat(format: string): boolean {
  const key = String(format || "").toLowerCase();
  if (!key) return false;
  if (isWalkingFloorDeliveryFormat(key)) return false;
  return key.includes("bulk");
}

/**
 * Pallet / tote / super sack / loose bulk need a scheduled heads-up for pickup.
 * Bags-only carts can use ASAP (~30 min).
 */
export function requiresPickupHeadsUp(items: SpotLine[]): boolean {
  return (items || []).some((item) => {
    const format = item.format || "";
    if (spotsForFormat(format, item.quantity) > 0) return true;
    return isLooseBulkPickupFormat(format);
  });
}

export function flatbedLoadCount(spots: number): number {
  if (spots <= 0) return 0;
  return Math.ceil(spots / FLATBED_CAPACITY);
}

/** Launch rule: 10% off spot-eligible product lines only when spots === 22. */
export function hasFullFlatbedDiscount(spots: number): boolean {
  return spots === FLATBED_CAPACITY;
}

export function flatbedEligibleSubtotal(items: SpotLine[]): number {
  return items.reduce((sum, item) => {
    if (resolvePromoBundle(item as Record<string, unknown>)) return sum;
    if (spotsForFormat(item.format, item.quantity) <= 0) return sum;
    const price = Number(item.unitPrice) || 0;
    return sum + price * Math.max(0, Number(item.quantity) || 0);
  }, 0);
}

export function fullLoadDiscountAmount(items: SpotLine[]): number {
  const spots = cartFlatbedSpots(items);
  if (!hasFullFlatbedDiscount(spots)) return 0;
  return +(flatbedEligibleSubtotal(items) * FULL_LOAD_PRODUCT_DISCOUNT).toFixed(2);
}

/** Unit price after full-load discount (only when cart is exactly 22 spots). */
export function discountedUnitPrice(unitPrice: number, spots: number): number {
  if (!hasFullFlatbedDiscount(spots)) return unitPrice;
  return +(unitPrice * (1 - FULL_LOAD_PRODUCT_DISCOUNT)).toFixed(2);
}
