import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer";
import { V5_PRODUCT_PRICING } from "../shared/oswPricing.js";

const baseUrl = process.env.OSW_PREVIEW_URL || "http://127.0.0.1:4317";
const artifactDir = process.env.OSW_UX_ARTIFACT_DIR || "/tmp/osw-ux-verification";
await mkdir(artifactDir, { recursive: true });

const products = [
  { id: 111, name: "PlantPal", slug: "plantpal", displayTitle: "PlantPal", productType: "All-Stage Nursery Mix", description: "All-stage nursery and potting mix.", imageUrl: "/images/quote-products/plantpal.webp", sizePriceOptions: V5_PRODUCT_PRICING[111].options },
  { id: 1000, name: "Simon's Gold", slug: "simons-gold", displayTitle: "Simon's Gold", productType: "Dairy Compost", description: "Arizona dairy compost.", imageUrl: "/images/quote-products/simons-gold.webp", sizePriceOptions: V5_PRODUCT_PRICING[1000].options },
  { id: 1001, name: "Mikey's Worm Poop", slug: "mikeys-worm-poop", displayTitle: "Mikey's Worm Poop", productType: "Worm Castings", description: "Arizona worm castings.", imageUrl: "/images/quote-products/mikeys-worm-poop.webp", sizePriceOptions: V5_PRODUCT_PRICING[1001].options },
  { id: 3000, name: "Nature's Blanket Premium", slug: "natures-blanket-premium", displayTitle: "Nature's Blanket Premium", productType: "Premium Dark Mulch", description: "Premium healthy soil mulch.", imageUrl: "/images/quote-products/natures-blanket-premium.webp", sizePriceOptions: V5_PRODUCT_PRICING[3000].options },
];

const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage();
let leadStatus = 200;
let leadReturnsJson = true;
let capturedLeadBody = null;
let delayProof = false;
let failProof = false;

await page.setCacheEnabled(false);
await page.setRequestInterception(true);
page.on("request", async (request) => {
  const url = request.url();
  try {
    if (/googletagmanager|google-analytics|callrail|doubleclick|clarity/i.test(url)) return request.abort();
    if (url.includes("/api/public/products/plantpal")) {
      return request.respond({ status: 200, contentType: "application/json", body: JSON.stringify(products[0]) });
    }
    if (url.includes("/api/public/products")) {
      return request.respond({ status: 200, contentType: "application/json", body: JSON.stringify({ products }) });
    }
    if (url.includes("/api/leads/submit")) {
      capturedLeadBody = JSON.parse(request.postData() || "{}");
      return request.respond({
        status: leadStatus,
        contentType: leadReturnsJson ? "application/json" : "text/plain",
        body: leadReturnsJson
          ? JSON.stringify(leadStatus === 200 ? { success: true, fixture: true } : { error: "Fixture failure" })
          : "accepted upstream",
      });
    }
    if (url.includes("/images/performance/home-results-640.webp") && (delayProof || failProof)) {
      if (failProof) return request.abort();
      const response = await fetch(url);
      const body = Buffer.from(await response.arrayBuffer());
      await new Promise((resolve) => setTimeout(resolve, 1800));
      return request.respond({ status: 200, contentType: "image/webp", body });
    }
    return request.continue();
  } catch {
    if (!request.isInterceptResolutionHandled()) request.abort();
  }
});

await page.evaluateOnNewDocument(() => {
  window.__oswCls = 0;
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (!entry.hadRecentInput) window.__oswCls += entry.value;
    }
  }).observe({ type: "layout-shift", buffered: true });
});

await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
delayProof = true;
await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });
await new Promise((resolve) => setTimeout(resolve, 350));
assert.match(await page.evaluate(() => document.body.innerText), /Loading customer result…/);
const proofBefore = await page.$eval('[role="status"]', (status) => {
  const figure = status.closest("figure");
  const rect = figure.getBoundingClientRect();
  return { width: Math.round(rect.width), height: Math.round(rect.height) };
});
assert.ok(proofBefore.width > 340 && proofBefore.height > 180, `proof reserves its mobile aspect ratio: ${JSON.stringify(proofBefore)}`);
await page.screenshot({ path: path.join(artifactDir, "home-mobile-proof-loading.png"), fullPage: false });
await page.waitForFunction(() => [...document.querySelectorAll('img[alt="Turf Daddy before-and-after lawn transformation"]')].some((image) => image.getBoundingClientRect().width > 0 && getComputedStyle(image).opacity === "1"), { timeout: 7000 });
assert.doesNotMatch(await page.evaluate(() => document.body.innerText), /Loading customer result…/);
assert.equal(await page.evaluate(() => window.__oswCls), 0);
await page.screenshot({ path: path.join(artifactDir, "home-mobile-proof-loaded.png"), fullPage: false });

failProof = true;
delayProof = false;
await page.goto(`${baseUrl}/?proof=failure-fixture`, { waitUntil: "domcontentloaded" });
await page.waitForFunction(() => document.body.innerText.includes("Customer result photo unavailable"), { timeout: 5000 });
assert.match(await page.evaluate(() => document.body.innerText), /See verified customer stories below/);
failProof = false;

await page.goto(`${baseUrl}/order?utm_source=google&utm_medium=cpc&utm_campaign=preview-audit&gclid=TEST-NO-AD-CLICK`, { waitUntil: "networkidle2" });
const mobileLayout = await page.evaluate(() => ({
  overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  heading: document.querySelector("h1")?.textContent,
  inputs: [...document.querySelectorAll("input,select,textarea")].map((field) => ({
    id: field.id,
    label: field.id ? document.querySelector(`label[for="${CSS.escape(field.id)}"]`)?.textContent?.trim() : "",
  })),
}));
assert.ok(mobileLayout.overflow <= 1, "quote form has no mobile horizontal overflow");
assert.equal(mobileLayout.heading, "Request a Quote");
assert.ok(mobileLayout.inputs.every((field) => field.label), "every form field has a programmatic label");
await page.select('select[aria-label="Product 1"], #product-' + await page.$eval('select[id^="product-"]', (el) => el.id.split("product-")[1]), "111");
await page.waitForSelector('img[alt="PlantPal product package"]');
const formatOptions = await page.$$eval('select[id^="format-"] option', (options) => options.map((option) => option.textContent));
assert.ok(formatOptions.includes("Pallet (30 x 1.5CF)"));
await page.select('select[id^="format-"]', "Pallet (30 x 1.5CF)");
await page.evaluate(() => window.scrollTo(0, 0));
await page.screenshot({ path: path.join(artifactDir, "quote-mobile-product-selected.png"), fullPage: false });
await page.click('button[type="submit"]');
await page.waitForFunction(() => document.body.innerText.includes("Please fix the highlighted fields"));
assert.equal(await page.evaluate(() => document.activeElement?.id), "name");
await page.type("#name", "Preview Fixture");
await page.type("#email", "preview@example.com");
await page.type("#phone", "6235550100");
await page.select("#customer_category", "home-gardener");
leadStatus = 200;
await page.click('button[type="submit"]');
await page.waitForFunction(() => document.body.innerText.includes("Quote request received"));
assert.match(capturedLeadBody.source_url, /utm_source=google/);
assert.match(capturedLeadBody.source_url, /gclid=TEST-NO-AD-CLICK/);
assert.match(capturedLeadBody.notes, /PlantPal/);
assert.match(capturedLeadBody.notes, /Pallet \(30 x 1\.5CF\)/);
await page.screenshot({ path: path.join(artifactDir, "quote-mobile-success.png"), fullPage: false });

leadStatus = 200;
leadReturnsJson = false;
await page.goto(`${baseUrl}/order?utm_source=accepted-without-json-fixture`, { waitUntil: "networkidle2" });
await page.type("#name", "Accepted Fixture");
await page.type("#email", "accepted@example.com");
await page.type("#phone", "6235550102");
await page.select("#customer_category", "home-gardener");
await page.click('button[type="submit"]');
await page.waitForFunction(() => document.body.innerText.includes("Quote request received"));
assert.doesNotMatch(await page.evaluate(() => document.body.innerText), /Submission Failed/);

leadStatus = 500;
leadReturnsJson = true;
capturedLeadBody = null;
await page.goto(`${baseUrl}/order?utm_source=failure-fixture`, { waitUntil: "networkidle2" });
await page.type("#name", "Failure Fixture");
await page.type("#email", "failure@example.com");
await page.type("#phone", "6235550101");
await page.select("#customer_category", "contractor");
await page.click('button[type="submit"]');
await page.waitForFunction(() => document.body.innerText.includes("Submission Failed"));
assert.match(await page.evaluate(() => document.body.innerText), /try again or call us/i);

await page.goto(`${baseUrl}/?utm_source=direct-test`, { waitUntil: "networkidle2" });
const mobileActions = await page.evaluate(() => [...document.querySelectorAll('[data-mobile-phone-cta="true"], a[href^="/order"]')]
  .filter((node) => node.closest(".fixed"))
  .map((node) => ({ text: node.textContent?.replace(/\s+/g, " ").trim(), rect: node.getBoundingClientRect().toJSON(), href: node.getAttribute("href"), aria: node.getAttribute("aria-label") })));
assert.ok(mobileActions.some((action) => action.text?.includes("Call")), JSON.stringify(mobileActions));
assert.ok(mobileActions.some((action) => action.text?.includes("Request a Quote")), JSON.stringify(mobileActions));
assert.ok(mobileActions.every((action) => action.rect.height >= 44));
const callAction = mobileActions.find((action) => action.text?.includes("Call"));
assert.equal(callAction.href, "tel:+16232633386");
assert.equal(callAction.aria, "Call (623) 263-3386");

await page.goto(`${baseUrl}/products/plantpal`, { waitUntil: "networkidle2" });
const productSchema = await page.evaluate(() => [...document.querySelectorAll('script[type="application/ld+json"]')]
  .map((script) => {
    try { return JSON.parse(script.textContent || "null"); } catch { return null; }
  })
  .find((schema) => schema?.['@type'] === "Product"));
assert.ok(productSchema, "PlantPal product structured data is present");
assert.ok(
  productSchema.offers.some((offer) => /Pallet of 1\.5 cu ft bags/i.test(offer.name) && Number(offer.price) === 263.76),
  JSON.stringify(productSchema.offers),
);
const clickedPlantPalSize = await page.evaluate(() => {
  const button = [...document.querySelectorAll("#buy button")]
    .find((candidate) => candidate.textContent?.includes("1.5 cu ft Bag"));
  button?.click();
  return Boolean(button);
});
assert.ok(clickedPlantPalSize, "PlantPal bag size option is rendered");
await new Promise((resolve) => setTimeout(resolve, 500));
const buyBoxText = await page.$eval("#buy", (buyBox) => buyBox.textContent?.replace(/\s+/g, " ").trim());
assert.match(buyBoxText, /20% off/i, buyBoxText);
const pdpText = await page.evaluate(() => document.body.innerText);
assert.match(pdpText, /20% off/i);
assert.match(pdpText, /30 × 1\.5 cu ft/);
assert.match(pdpText, /\$263\.76/);
assert.match(pdpText, /\$329\.70/);

await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });
await page.evaluate(() => localStorage.setItem("osw-quote-cart", JSON.stringify([{
  productId: 111,
  productName: "Stage Potting Mix",
  productSlug: "plantpal",
  format: "Pallet of 1.5 cu ft Bags",
  quantity: 1,
  unitPrice: 1,
  unit: "per pallet",
  mode: "pay",
  imageUrl: "/images/quote-products/plantpal.webp"
}])));
await page.goto(`${baseUrl}/checkout`, { waitUntil: "networkidle2" });
const checkoutText = await page.evaluate(() => document.body.innerText);
assert.match(checkoutText, /PlantPal/);
assert.match(checkoutText, /\$263\.76/);
assert.doesNotMatch(checkoutText, /Stage Potting Mix/);

await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
leadStatus = 200;
await page.goto(`${baseUrl}/order?utm_source=desktop-preview`, { waitUntil: "networkidle2" });
assert.ok((await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)) <= 1);
await page.screenshot({ path: path.join(artifactDir, "quote-desktop.png"), fullPage: false });

await browser.close();
console.log(`OSW UX: mobile/desktop quote, mocked success/failure, attribution, proof loading/error/CLS, CTA, PDP pricing, and stale-cart checkout normalization ok (${artifactDir})`);
