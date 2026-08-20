import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { GARDEN_PROMOS } from "../shared/gardenPromos.js";

const files = [
  "shared/gardenPromos.js",
  "client/src/pages/GardenPromoPage.tsx",
  "client/src/pages/GardenPromosHub.tsx",
];

for (const file of files) {
  const source = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
  assert.doesNotMatch(source, /—/, `${file} customer promo copy must not use em dashes`);
  assert.doesNotMatch(source, /\bFounder\b/, `${file} must not use Founder`);
}

const hub = readFileSync(new URL("../client/src/pages/GardenPromosHub.tsx", import.meta.url), "utf8");
assert.match(hub, /Call <span data-official-support-phone-text="true">\{CUSTOMER_SUPPORT_PHONE_DISPLAY\}<\/span>/);
assert.match(hub, /Wholesale, bulk, pickup, and delivery are available/);
assert.match(hub, /potting soil/i);
assert.match(hub, /raised garden bed/i);
assert.doesNotMatch(hub, /\btopsoil\b/i);

const landing = readFileSync(new URL("../client/src/pages/GardenPromoPage.tsx", import.meta.url), "utf8");
assert.match(landing, /Call <span data-official-support-phone-text="true">\{CUSTOMER_SUPPORT_PHONE_DISPLAY\}<\/span>/);
assert.match(landing, /Wholesale available/);
assert.match(landing, /Bulk available/);
assert.match(landing, /Pickup available/);
assert.match(landing, /Delivery available/);
assert.match(landing, /sticky_mobile/);
assert.doesNotMatch(landing, /\btopsoil\b/i);

const app = readFileSync(new URL("../client/src/App.tsx", import.meta.url), "utf8");
assert.match(app, /path="\/garden-refresh"/);
assert.match(app, /path="\/garden-refresh-plus"/);
assert.match(app, /path="\/big-garden-setup"/);
assert.match(app, /path="\/promos"/);

const home = readFileSync(new URL("../client/src/pages/Home.tsx", import.meta.url), "utf8");
assert.match(home, /HomepagePromoBand/);

assert.deepEqual(
  GARDEN_PROMOS.map((promo) => [promo.slug, promo.salePrice, promo.bagCount]),
  [
    ["garden-refresh", 99, 10],
    ["garden-refresh-plus", 149, 16],
    ["big-garden-setup", 399, 40],
  ],
);

const plus = GARDEN_PROMOS.find((promo) => promo.slug === "garden-refresh-plus");
const setup = GARDEN_PROMOS.find((promo) => promo.slug === "big-garden-setup");
assert.match(plus.useCase, /potting soil/i);
assert.match(setup.useCase, /potting soil/i);
assert.match(plus.useCase, /raised garden bed/i);
assert.match(setup.useCase, /raised garden bed/i);
assert.doesNotMatch(plus.useCase + setup.useCase, /459/);
assert.equal(setup.salePrice, 399);

console.log("garden promo pages: call CTAs, copy rules, routes, and flyer prices ok");
