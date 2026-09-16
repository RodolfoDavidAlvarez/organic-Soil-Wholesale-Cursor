/**
 * Phoenix yard loadability — single source of truth.
 *
 * The Phoenix yard (1634 N 19th Ave) only loads what is on the ground right now.
 * Do not advertise cubic-yard / loose bulk pickup for SKUs the yard cannot load.
 *
 * Keep list (Rodo / SSW fulfillment, 2026-09):
 *   - Simon's Gold (dairy compost) — 1000
 *   - Nature's Blanket — 134
 *   - Nature's Blanket Premium (mulch) — 3000
 *
 * PlantPal / plant power is not available at Phoenix (machine capacity may exist later).
 * Mikey's worm castings bulk / cy-style yard options are off; bagged Mikey's can still
 * check out for Phoenix pickup until the yard says otherwise.
 *
 * Delivery, bags, pallets, totes, and Congress pickup stay unless they imply Phoenix
 * loose-yard loading.
 */
import { resolvePromoBundle } from "./promoBundles.js";

export const PHOENIX_YARD_PICKUP_PRODUCT_IDS = Object.freeze([1000, 134, 3000]);

/** /products + /qr pay-and-pickup grid order. */
export const PHOENIX_YARD_PICKUP_GRID_IDS = PHOENIX_YARD_PICKUP_PRODUCT_IDS;

/**
 * Products that can still be paid online (bags, pallets, totes, delivery, Congress).
 * Includes SKUs the Phoenix yard is not loading so delivery/Congress still work.
 */
export const PAY_ONLINE_PRODUCT_IDS = Object.freeze([1000, 134, 3000, 1001, 111]);

/** Loose bulk the Phoenix yard can actually load (priced SKUs only). */
const PHOENIX_YARD_LOOSE_BULK_PRODUCT_IDS = Object.freeze([1000, 3000]);

export const PHOENIX_YARD_PICKUP_BLOCKED_MESSAGE =
  "Phoenix yard is only loading Simon's Gold and Nature's Blanket right now. Choose Congress pickup or delivery.";

export function isPhoenixYardPickupProduct(productId) {
  return PHOENIX_YARD_PICKUP_PRODUCT_IDS.includes(Number(productId));
}

export function isPayOnlineProduct(productId) {
  return PAY_ONLINE_PRODUCT_IDS.includes(Number(productId));
}

export function isPhoenixYardLooseBulkProduct(productId) {
  return PHOENIX_YARD_LOOSE_BULK_PRODUCT_IDS.includes(Number(productId));
}

/** Loose bulk / cy yard pickup — not walking-floor truckload delivery. */
export function isLooseYardBulkFormat(format) {
  const key = String(format || "").toLowerCase();
  if (!key) return false;
  if (key.includes("truckload") || key.includes("walking")) return false;
  if (key.includes("pallet") || key.includes("tote") || key.includes("supersack") || key.includes("super sack")) {
    return false;
  }
  return key.includes("bulk");
}

export function shouldHidePhoenixYardBulkSize(productId, format) {
  if (!isLooseYardBulkFormat(format)) return false;
  return !isPhoenixYardLooseBulkProduct(productId);
}

function lineFormat(item) {
  return item?.format || item?.sizeOption || item?.size || "";
}

function lineProductId(item) {
  return Number(item?.productId ?? item?.product_id);
}

export function cartItemAllowsPhoenixYardPickup(item) {
  if (!item) return false;
  const bundle = resolvePromoBundle(item);
  if (bundle) return bundle.phoenixYardPickup === true;
  const productId = lineProductId(item);
  if (!Number.isInteger(productId) || productId <= 0) return false;
  if (shouldHidePhoenixYardBulkSize(productId, lineFormat(item))) return false;
  if (isPhoenixYardPickupProduct(productId)) return true;
  // Bagged / pallet / tote Mikey's only — bulk already rejected above.
  return productId === 1001;
}

export function cartAllowsPhoenixYardPickup(items) {
  const list = Array.isArray(items) ? items : [];
  if (list.length === 0) return true;
  return list.every(cartItemAllowsPhoenixYardPickup);
}
