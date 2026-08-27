/**
 * Phoenix yard pickup promo bundles.
 *
 * These are already-discounted pay-and-pickup SKUs. Checkout must charge the
 * freeze sale price as a single cart line. Survey 30% and other percent
 * discounts stay off these lines (TEST / 100% QA still applies to the whole order).
 *
 * Product rows 4100–4102 already exist in Supabase (catalog disabled) so
 * order_items.product_id FK inserts succeed. Do not invent coupon codes.
 */

export const PROMO_BUNDLE_PRODUCT_IDS = Object.freeze([4100, 4101, 4102]);

const productImages = {
  plantpal: {
    image: "/images/optimized/plantpal-bag-context.webp",
    alt: "PlantPal all-stage potting mix bag with fresh vegetables",
  },
  plantpalTote: {
    image: "/images/optimized/2-2-cy-tote-supersack.jpg",
    alt: "PlantPal 2.2 cubic yard living-soil tote",
  },
  simons: {
    image: "/images/optimized/simons-gold-bag-context.webp",
    alt: "Simon's Gold dairy compost bag with fresh vegetables",
  },
  mikeys: {
    image: "/images/optimized/mikeys-worm-poop-bag-context.webp",
    alt: "Mikey's Worm Poop worm castings bag with vegetables and soil",
  },
  mulch: {
    image: "/images/optimized/natures-blanket-bag-context.webp",
    alt: "Nature's Blanket Premium mulch bag with rich brown mulch",
  },
};

export const PROMO_BUNDLES = Object.freeze([
  {
    productId: 4100,
    slug: "garden-refresh",
    aliases: ["raised-bed-refresh"],
    eyebrow: "The 4×8 raised-bed reset",
    title: "Garden Refresh",
    shortTitle: "Garden Refresh",
    description:
      "Ten cubic feet across seven bags: compost, worm castings, and mulch—exactly what one 4×8 raised bed needs for fall.",
    heroImage: "/images/offers/garden-refresh.png",
    heroAlt: "Garden Refresh offer: seven bags for one 4 by 8 raised bed, $69 pickup price",
    listPrice: 91,
    salePrice: 69,
    savings: 22,
    badge: "Save $22",
    format: "7-bag Phoenix pickup bundle",
    unit: "per bundle",
    volumeLabel: "10 cu ft",
    bagLabel: "7 bags",
    bedLabel: "One 4×8 bed",
    idealFor: "Refreshing one existing 4×8 raised bed for fall",
    result: "Four cubic feet feed the soil at 1½″ and six cubic feet of mulch cover the same bed at 2¼″.",
    pickupNote: "Phoenix yard pickup. Add other bags from Products and check out together.",
    wormBagUpsell:
      "Walked in with a free worm bag? This is the fall bed reset that goes with it—compost, castings, and mulch in one pickup.",
    items: [
      { name: "Nature's Blanket Premium mulch", amount: "3 bags · 6 cu ft", ...productImages.mulch },
      { name: "Mikey's Worm Poop worm castings", amount: "3 bags · 3 cu ft", ...productImages.mikeys },
      { name: "Simon's Gold dairy compost", amount: "1 bag · 1 cu ft", ...productImages.simons },
    ],
  },
  {
    productId: 4101,
    slug: "garden-refresh-plus",
    aliases: [],
    eyebrow: "Mix, not just compost",
    title: "Garden Refresh Plus",
    shortTitle: "Garden Refresh Plus",
    description:
      "Twenty-four cubic feet across sixteen bags: PlantPal mix, three free mulch bags, and worm castings for one 4×8 raised bed.",
    heroImage: "/images/offers/garden-refresh-plus.png",
    heroAlt: "Garden Refresh Plus offer: sixteen bags including free mulch, $149 pickup price",
    listPrice: 247,
    salePrice: 149,
    savings: 98,
    badge: "Save $98",
    format: "16-bag Phoenix pickup bundle",
    unit: "per bundle",
    volumeLabel: "24 cu ft",
    bagLabel: "16 bags",
    bedLabel: "One 4×8 bed",
    idealFor: "Filling and feeding one 4×8 raised bed with living mix, not just compost",
    result: "Fifteen cubic feet of PlantPal, three cubic feet of castings, and six cubic feet of mulch included free.",
    pickupNote: "Phoenix yard pickup. The three Nature's Blanket bags are included—already in this bundle price.",
    items: [
      { name: "PlantPal all-stage potting mix", amount: "10 bags · 15 cu ft", ...productImages.plantpal },
      { name: "Nature's Blanket Premium mulch", amount: "3 bags · 6 cu ft included", ...productImages.mulch },
      { name: "Mikey's Worm Poop worm castings", amount: "3 bags · 3 cu ft", ...productImages.mikeys },
    ],
  },
  {
    productId: 4102,
    slug: "big-garden-setup",
    aliases: ["garden-bed-builder"],
    eyebrow: "Fill the beds. Feed the soil. Finish the surface.",
    title: "Big Garden Setup",
    shortTitle: "Big Garden Setup",
    description:
      "One 2.2-cubic-yard PlantPal tote plus ten bags of compost, worm castings, and mulch for two to three 4×8 beds.",
    heroImage: "/images/offers/big-garden-setup.png",
    heroAlt: "Big Garden Setup offer: one PlantPal tote and ten bags for $459",
    listPrice: 642,
    salePrice: 459,
    savings: 183,
    badge: "Save $183",
    format: "1 tote + 10 bags · Phoenix pickup",
    unit: "per bundle",
    volumeLabel: "72.4 cu ft / 2.64 cu yd",
    bagLabel: "1 tote + 10 bags",
    bedLabel: "2–3 4×8 beds",
    idealFor: "Building or deeply resetting two to three 4×8 garden beds",
    result: "Fills two beds at 12″ deep—or nearly three at 8″. Use the tote within about one week.",
    pickupNote: "Phoenix yard pickup. The tote needs a scheduled slot so we can stage the load.",
    items: [
      { name: "PlantPal living soil tote", amount: "1 tote · 2.2 cu yd (59.4 cu ft)", ...productImages.plantpalTote },
      { name: "Simon's Gold dairy compost", amount: "4 bags · 4 cu ft", ...productImages.simons },
      { name: "Mikey's Worm Poop worm castings", amount: "3 bags · 3 cu ft", ...productImages.mikeys },
      { name: "Nature's Blanket Premium mulch", amount: "3 bags · 6 cu ft", ...productImages.mulch },
    ],
  },
]);

const BUNDLE_BY_ID = new Map(PROMO_BUNDLES.map((bundle) => [bundle.productId, bundle]));
const BUNDLE_BY_SLUG = new Map();
for (const bundle of PROMO_BUNDLES) {
  BUNDLE_BY_SLUG.set(bundle.slug, bundle);
  for (const alias of bundle.aliases) BUNDLE_BY_SLUG.set(alias, bundle);
}

const normalizedText = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[’]/g, "'")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export function isPromoBundleProductId(productId) {
  const id = Number(productId);
  return Number.isInteger(id) && BUNDLE_BY_ID.has(id);
}

export function getPromoBundleBySlug(slug) {
  if (!slug) return null;
  return BUNDLE_BY_SLUG.get(String(slug).trim().toLowerCase()) || null;
}

export function getPromoBundleByProductId(productId) {
  const id = Number(productId);
  return Number.isInteger(id) ? BUNDLE_BY_ID.get(id) || null : null;
}

export function resolvePromoBundle(item) {
  if (!item || typeof item !== "object") return null;
  const byId = getPromoBundleByProductId(item.productId ?? item.product_id);
  if (byId) return byId;
  const bySlug = getPromoBundleBySlug(item.productSlug ?? item.product_slug ?? item.slug);
  if (bySlug) return bySlug;
  const name = normalizedText(item.productName ?? item.name);
  if (!name) return null;
  return PROMO_BUNDLES.find((bundle) => normalizedText(bundle.title) === name) || null;
}

export function promoBundleHref(productId) {
  const bundle = getPromoBundleByProductId(productId);
  return bundle ? `/offers/${bundle.slug}` : null;
}

export function promoBundleCartItem(bundle, quantity = 1) {
  const qty = Math.max(1, Math.round(Number(quantity) || 1));
  return {
    productId: bundle.productId,
    productName: bundle.title,
    name: bundle.title,
    productSlug: bundle.slug,
    format: bundle.format,
    sizeOption: bundle.format,
    quantity: qty,
    unitPrice: bundle.salePrice,
    price: bundle.salePrice,
    listUnitPrice: bundle.listPrice,
    savingsPerUnit: bundle.savings,
    discountPercent: 0,
    unit: bundle.unit,
    mode: "pay",
    imageUrl: bundle.heroImage,
  };
}

export function applyPromoBundlePricing(item) {
  const bundle = resolvePromoBundle(item);
  if (!bundle) return item;
  const quantity = Math.max(1, Math.round(Number(item.quantity) || 1));
  return {
    ...item,
    ...promoBundleCartItem(bundle, quantity),
    quantity,
  };
}

/**
 * Percent discounts (survey 30%, etc.) must not reduce already-priced bundles.
 * TEST / 100% QA still applies to the whole order in checkout.
 */
export function nonBundleProductSubtotal(items) {
  return (items || []).reduce((sum, item) => {
    if (resolvePromoBundle(item)) return sum;
    const price = Number(item.price ?? item.unitPrice) || 0;
    const quantity = Math.max(0, Number(item.quantity) || 0);
    return sum + price * quantity;
  }, 0);
}
