/**
 * Pay-cart load grouping for QuoteCart + checkout.
 *
 * Promo letter-flyer bundles (4100–4102) always sit under Offers.
 * Regular bags/totes keep their existing groups.
 */
import { isPromoBundleProductId } from "./promoBundles.js";
import { isWalkingFloorDeliveryFormat, spotsForFormat } from "./flatbedSpots.js";

export const CART_LOAD_GROUP_LABELS = Object.freeze({
  offers: "Offers",
  bags: "Bags & small items",
  flatbed: "Flatbed load",
  walkingFloor: "Walking-floor delivery",
});

export const CART_LOAD_GROUP_HINTS = Object.freeze({
  offers: "Pickup or delivery at checkout",
  bags: "Pickup or delivery at checkout",
});

function lineFormat(item) {
  return item?.format || item?.sizeOption || "";
}

export function partitionPayCartItems(payItems) {
  const offerItems = [];
  const walkingFloorItems = [];
  const flatbedItems = [];
  const yardItems = [];
  const otherItems = [];

  for (const item of payItems || []) {
    if (isPromoBundleProductId(item.productId ?? item.product_id)) {
      offerItems.push(item);
      continue;
    }
    otherItems.push(item);
    const format = lineFormat(item);
    if (isWalkingFloorDeliveryFormat(format)) {
      walkingFloorItems.push(item);
      continue;
    }
    if (spotsForFormat(format, item.quantity) > 0) {
      flatbedItems.push(item);
      continue;
    }
    yardItems.push(item);
  }

  return { offerItems, walkingFloorItems, flatbedItems, yardItems, otherItems };
}
