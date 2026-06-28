export const PAY_PICKUP_PRODUCT_DESCRIPTIONS: Record<number, string> = {
  1000: "Slow-release nutrition and clean organic matter for feeding, rebuilding, and conserving soil. Easy to spread in beds, trees, and planted areas.",
  1001: "Nutrient-rich worm castings for pre-season feeding, root zones, top dressing, and mixing into soil blends.",
  137: "A ready-to-use potting soil for gardens, containers, nurseries, and raised beds.",
  3000: "Premium healthy soil mulch made with wood fiber, worm castings, and dairy compost for clean landscape finish, moisture retention, and weed suppression.",
};

export const getPayPickupProductDescription = (productId?: number, fallback = ""): string =>
  productId ? PAY_PICKUP_PRODUCT_DESCRIPTIONS[productId] ?? fallback : fallback;
