/**
 * Gabriela Aug 14 flyer packages. Prices and bag counts come from those flyers.
 * Cubic feet and compare-at totals are live V5 bag sizes, not invented SKUs.
 */

const money = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const BAG_PRICES = Object.freeze({
  plantpal15: 10.99,
  naturesBlanket2: 10.99,
  simons1: 24.9,
  mikeys1: 34.9,
});

const PRODUCT_IMAGES = Object.freeze({
  111: "/images/optimized/plantpal-with-veggies.jpg",
  1000: "/images/optimized/simons-gold-bag-context.jpg",
  1001: "/images/optimized/mikeys-worm-poop-bag-context.jpg",
  3000: "/images/optimized/natures-blanket-bag-context.jpg",
});

function withCatalogMath(promo) {
  const listPrice = money(promo.contents.reduce((sum, item) => sum + item.bags * item.unitPrice, 0));
  const cuFt = promo.contents.reduce((sum, item) => sum + item.cuFt, 0);
  const bagCount = promo.contents.reduce((sum, item) => sum + item.bags, 0);
  return {
    ...promo,
    bagCount,
    cuFt,
    listPrice,
    savings: money(listPrice - promo.salePrice),
    imageUrl: PRODUCT_IMAGES[promo.heroProductId],
  };
}

export const GARDEN_PROMOS = Object.freeze([
  withCatalogMath({
    productId: 4100,
    slug: "garden-refresh",
    title: "Garden Refresh",
    shortTitle: "Refresh",
    salePrice: 99,
    heroProductId: 3000,
    format: "10-Bag Package",
    aliases: ["garden refresh", "garden refresh bundle", "garden refresh package"],
    eyebrow: "One 4x8 raised garden bed",
    summary: "Ten bags to feed and mulch one 4x8 raised garden bed. Dairy compost, worm castings, and mulch. $99.",
    useCase: "Use this package on an existing 4x8 raised garden bed. It feeds the soil and covers the surface. It does not include potting soil. If you need potting soil to fill a bed, use Garden Refresh Plus or Big Garden Setup.",
    includedCallout: "3 bags of Simon's Gold dairy compost are included with this package.",
    stripeDescription: "10 bags / 15 cu ft. 5 Nature's Blanket 2CF, 3 Simon's Gold 1CF included, 2 Mikey's Worm Poop 1CF.",
    pickList: "5 x Nature's Blanket Premium 2CF, 3 x Simon's Gold 1CF (included), 2 x Mikey's Worm Poop 1CF",
    contents: [
      { productId: 3000, name: "Nature's Blanket Premium", role: "Mulch cover", bags: 5, cuFt: 10, format: "2CF Bag", unitPrice: BAG_PRICES.naturesBlanket2, included: false, image: PRODUCT_IMAGES[3000] },
      { productId: 1000, name: "Simon's Gold", role: "Dairy compost", bags: 3, cuFt: 3, format: "1CF Bag", unitPrice: BAG_PRICES.simons1, included: true, image: PRODUCT_IMAGES[1000] },
      { productId: 1001, name: "Mikey's Worm Poop", role: "Worm castings", bags: 2, cuFt: 2, format: "1CF Bag", unitPrice: BAG_PRICES.mikeys1, included: false, image: PRODUCT_IMAGES[1001] },
    ],
  }),
  withCatalogMath({
    productId: 4101,
    slug: "garden-refresh-plus",
    title: "Garden Refresh Plus",
    shortTitle: "Refresh Plus",
    salePrice: 149,
    heroProductId: 111,
    format: "16-Bag Package",
    aliases: ["garden refresh plus", "garden refresh plus bundle", "garden refresh plus package"],
    eyebrow: "One 4x8 raised garden bed",
    summary: "Sixteen bags for one 4x8 raised garden bed. PlantPal potting soil, mulch, and worm castings. $149.",
    useCase: "Use this package to put potting soil in a 4x8 raised garden bed, then finish with mulch and worm castings. This is potting soil, not topsoil. We are not selling a physical garden bed. This is the soil package for the bed you already have or are building.",
    includedCallout: "3 bags of Nature's Blanket Premium mulch are included with this package.",
    stripeDescription: "16 bags / 24 cu ft. 10 PlantPal 1.5CF, 3 Nature's Blanket 2CF included, 3 Mikey's Worm Poop 1CF.",
    pickList: "10 x PlantPal 1.5CF, 3 x Nature's Blanket Premium 2CF (included), 3 x Mikey's Worm Poop 1CF",
    contents: [
      { productId: 111, name: "PlantPal", role: "Potting soil", bags: 10, cuFt: 15, format: "1.5CF Bag", unitPrice: BAG_PRICES.plantpal15, included: false, image: PRODUCT_IMAGES[111] },
      { productId: 3000, name: "Nature's Blanket Premium", role: "Mulch cover", bags: 3, cuFt: 6, format: "2CF Bag", unitPrice: BAG_PRICES.naturesBlanket2, included: true, image: PRODUCT_IMAGES[3000] },
      { productId: 1001, name: "Mikey's Worm Poop", role: "Worm castings", bags: 3, cuFt: 3, format: "1CF Bag", unitPrice: BAG_PRICES.mikeys1, included: false, image: PRODUCT_IMAGES[1001] },
    ],
  }),
  withCatalogMath({
    productId: 4102,
    slug: "big-garden-setup",
    title: "Big Garden Setup",
    shortTitle: "Big Garden Setup",
    salePrice: 399,
    heroProductId: 111,
    format: "40-Bag Package",
    aliases: ["big garden setup", "garden setup", "big garden setup bundle"],
    eyebrow: "Two to three 4x8 raised garden beds",
    summary: "Forty bags of potting soil, dairy compost, worm castings, and mulch for two to three 4x8 raised garden beds. $399.",
    useCase: "Use this package when you are filling more than one raised garden bed with potting soil. PlantPal is the potting soil. This is not topsoil, and we are not selling a physical garden bed SKU. Depth and bed count depend on how you fill.",
    includedCallout: "This package is 40 bags from the Aug 14 flyer. Live bag sizes come to 58 cubic feet.",
    stripeDescription: "40 bags / 58 cu ft. 30 PlantPal 1.5CF, 4 Simon's Gold 1CF, 3 Mikey's Worm Poop 1CF, 3 Nature's Blanket 2CF.",
    pickList: "30 x PlantPal 1.5CF, 4 x Simon's Gold 1CF, 3 x Mikey's Worm Poop 1CF, 3 x Nature's Blanket Premium 2CF",
    contents: [
      { productId: 111, name: "PlantPal", role: "Potting soil", bags: 30, cuFt: 45, format: "1.5CF Bag", unitPrice: BAG_PRICES.plantpal15, included: false, image: PRODUCT_IMAGES[111] },
      { productId: 1000, name: "Simon's Gold", role: "Dairy compost", bags: 4, cuFt: 4, format: "1CF Bag", unitPrice: BAG_PRICES.simons1, included: false, image: PRODUCT_IMAGES[1000] },
      { productId: 1001, name: "Mikey's Worm Poop", role: "Worm castings", bags: 3, cuFt: 3, format: "1CF Bag", unitPrice: BAG_PRICES.mikeys1, included: false, image: PRODUCT_IMAGES[1001] },
      { productId: 3000, name: "Nature's Blanket Premium", role: "Mulch cover", bags: 3, cuFt: 6, format: "2CF Bag", unitPrice: BAG_PRICES.naturesBlanket2, included: false, image: PRODUCT_IMAGES[3000] },
    ],
  }),
]);

export const GARDEN_PROMO_IDS = Object.freeze(GARDEN_PROMOS.map((promo) => promo.productId));
export const GARDEN_PROMO_SLUGS = Object.freeze(GARDEN_PROMOS.map((promo) => promo.slug));
export const BIG_GARDEN_SETUP_SLUG = "big-garden-setup";

export const GARDEN_PROMO_ALIASES = Object.freeze({
  "garden-setup": BIG_GARDEN_SETUP_SLUG,
  "raised-bed-refresh": "garden-refresh",
  "garden-bed-builder": BIG_GARDEN_SETUP_SLUG,
});

export function findGardenPromo(slug) {
  const resolved = GARDEN_PROMO_ALIASES[slug] || slug;
  return GARDEN_PROMOS.find((promo) => promo.slug === resolved) || null;
}

export function findGardenPromoByProductId(productId) {
  return GARDEN_PROMOS.find((promo) => promo.productId === Number(productId)) || null;
}

export function gardenPromoYardNote(items) {
  const notes = [];
  for (const promo of GARDEN_PROMOS) {
    const qty = (items || [])
      .filter((item) => Number(item.productId ?? item.product_id) === promo.productId)
      .reduce((sum, item) => sum + Math.max(1, Number(item.quantity) || 1), 0);
    if (!qty) continue;
    const packs = qty === 1 ? `1 ${promo.title}` : `${qty} ${promo.title} packages`;
    notes.push(`${packs}. Yard pick list per package: ${promo.pickList}.`);
  }
  return notes.length ? notes.join(" ") : null;
}

export function gardenPromoStripeDescription(productId) {
  return findGardenPromoByProductId(productId)?.stripeDescription || null;
}

export function gardenPromoCartImage(productId) {
  return findGardenPromoByProductId(productId)?.imageUrl || PRODUCT_IMAGES[111];
}

export { BAG_PRICES, PRODUCT_IMAGES };
