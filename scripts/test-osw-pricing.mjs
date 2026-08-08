import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  calculateV5OrderTotals,
  normalizeV5CheckoutItems,
  normalizeV5ProductRecord,
  resolveV5CartPricing,
} from "../shared/oswPricing.js";
import { applyFullFlatbedProductDiscount } from "../shared/flatbedSpots.js";

const line = (productId, productName, sizeOption, quantity = 1, price = 0.01) => ({
  productId,
  productName,
  name: productName,
  sizeOption,
  format: sizeOption,
  quantity,
  price,
  unitPrice: price,
});

assert.deepEqual(resolveV5CartPricing(line(111, "Stage Potting Mix", "Pallet of 1.5 cu ft Bags")), {
  productId: 111,
  productName: "PlantPal",
  format: "Pallet (30 x 1.5CF)",
  unitPrice: 263.76,
  listUnitPrice: 329.7,
  savingsPerUnit: 65.94,
  discountPercent: 20,
  unitsPerPallet: 30,
  unit: "per pallet",
});

const exactCases = [
  [137, "Soil Craft", "1.5CF Bag", 15.99, 15.99],
  [137, "Soil Craft", "Pallet (30 x 1.5CF)", 383.76, 479.7],
  [111, "PlantPal", "1.5CF Bag", 10.99, 10.99],
  [111, "PlantPal", "Pallet (30 x 1.5CF)", 263.76, 329.7],
  [3000, "Nature's Blanket Premium", "2CF Bag", 10.99, 10.99],
  [3000, "Nature's Blanket Premium", "Pallet of 2CF Bags", 219.8, 274.75],
  [1000, "Simon's Gold", "9lb Bag", 12.46, 12.46],
  [1000, "Simon's Gold", "Pallet of 9 lb Bags", 1435.39, 1794.24],
  [1000, "Simon's Gold", "1CF Bag", 24.9, 24.9],
  [1000, "Simon's Gold", "Pallet of 1CF Bags", 996, 1245],
  [1001, "Mikey's Worm Poop", "9lb Bag", 18.1, 18.1],
  [1001, "Mikey's Worm Poop", "Pallet of 9 lb Bags", 2085.12, 2606.4],
  [1001, "Mikey's Worm Poop", "1CF Bag", 34.9, 34.9],
  [1001, "Mikey's Worm Poop", "Pallet of 1CF Bags", 1396, 1745],
];

for (const [productId, name, format, expectedSale, expectedList] of exactCases) {
  const pricing = resolveV5CartPricing(line(productId, name, format));
  assert.ok(pricing, `${name} ${format} resolves`);
  assert.equal(pricing.unitPrice, expectedSale);
  assert.equal(pricing.listUnitPrice, expectedList);
  assert.equal(pricing.savingsPerUnit, Math.round((expectedList - expectedSale) * 100) / 100);
  assert.equal(pricing.discountPercent, expectedList > expectedSale ? 20 : 0);
}

const tampered = normalizeV5CheckoutItems([
  line(111, "Stage Potting Mix", "Pallet of 1.5 cu ft Bags", 1, 1),
  line(3000, "Nature's Blanket Premium", "Pallet of 2CF Bags", 1, 9999),
]);
assert.equal(tampered[0].productName, "PlantPal");
assert.equal(tampered[0].price, 263.76);
assert.equal(tampered[1].price, 219.8);

const totals = calculateV5OrderTotals({
  items: tampered,
  deliveryCents: 5000,
  taxRate: 0.091,
});
assert.equal(totals.productSubtotalCents, 48356);
assert.equal(totals.deliveryCents, 5000);
assert.equal(totals.taxableCents, 53356);
assert.equal(totals.taxCents, 4855);
assert.equal(totals.totalCents, 58211);

for (const quantity of [21, 22, 23]) {
  const canonical = normalizeV5CheckoutItems([line(111, "PlantPal", "Pallet of 1.5 cu ft Bags", quantity)]);
  const result = applyFullFlatbedProductDiscount(canonical);
  assert.equal(result.applied, quantity === 22, `flatbed boundary ${quantity}`);
  if (quantity === 22) {
    assert.equal(result.items[0].price, 237.38);
    assert.equal(result.items[0].listUnitPrice, 329.7);
  }
}

const product = normalizeV5ProductRecord({ id: 111, name: "Stage Potting Mix", size_price_options: [] });
assert.equal(product.name, "PlantPal");
assert.equal(product.sizePriceOptions.find((entry) => entry.label.includes("Pallet")).unitsPerPallet, 30);
assert.equal(product.sizePriceOptions.find((entry) => entry.label.includes("Pallet")).price, 263.76);

assert.throws(
  () => normalizeV5CheckoutItems([line(111, "PlantPal", "Mystery pallet")]),
  /Unsupported V5 format/,
);

const wholesaleSource = readFileSync(new URL("../client/src/pages/Wholesale.tsx", import.meta.url), "utf8");
assert.doesNotMatch(wholesaleSource, /PlantPal[^\n]*(?:1CF|50\/pallet)/, "PlantPal wholesale request option uses the V5 physical pack");
assert.match(wholesaleSource, /PlantPal Potting Mix \(1\.5CF, 30\/pallet\)/);
const workOrderSource = readFileSync(new URL("../client/src/pages/admin/CreateWorkOrder.tsx", import.meta.url), "utf8");
assert.match(workOrderSource, /code: '1\.5cf'.*unitsPerPallet: 30/);
assert.match(workOrderSource, /code: '2cf'.*unitsPerPallet: 25/);

console.log("OSW V5 pricing: exact prices, pallet boundaries, mixed totals, rounding, delivery/tax separation, aliases, and tamper normalization ok");
