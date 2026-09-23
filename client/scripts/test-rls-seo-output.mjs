import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

const dist = new URL("../dist/", import.meta.url);
const guides = JSON.parse(await readFile(new URL("../src/features/landscaper-supply/material-guides.json", import.meta.url), "utf8"));
const [html, robots, sitemap, llms, manifest] = await Promise.all([
  readFile(new URL("index.html", dist), "utf8"),
  readFile(new URL("robots.txt", dist), "utf8"),
  readFile(new URL("sitemap.xml", dist), "utf8"),
  readFile(new URL("llms.txt", dist), "utf8"),
  readFile(new URL("rls.webmanifest", dist), "utf8"),
]);

const canonical = "https://regenerativelandscapersupply.com/";
assert.equal((html.match(/<title>/g) || []).length, 1, "page must have one title");
assert.equal((html.match(/<meta name="description"/g) || []).length, 1, "page must have one description");
assert.equal((html.match(/<link rel="canonical"/g) || []).length, 1, "page must have one canonical URL");
assert.match(html, /<title>Landscape Materials for Contractors in Phoenix, AZ \| Regenerative Landscaper Supply<\/title>/);
assert.match(html, /<div id="root">\s*<main id="main-content"/);
assert.doesNotMatch(html.slice(0, html.indexOf("<body")), /organicsoilwholesale\.com/);
assert.match(html, /https:\/\/regenerativelandscapersupply\.com\/rls-mark\.svg/);
assert.doesNotMatch(html, /home-hero/);

const schemas = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
  .map((match) => JSON.parse(match[1]));
const faq = schemas.find((schema) => schema["@type"] === "FAQPage");
assert.equal(faq?.mainEntity?.length, 5, "FAQ structured data must include all visible answers");
for (const item of faq.mainEntity) {
  assert.ok(html.includes(item.name), `visible page must include FAQ: ${item.name}`);
  assert.ok(html.includes(item.acceptedAnswer.text), `visible page must include FAQ answer: ${item.name}`);
}

assert.match(robots, /User-agent: OAI-SearchBot\nAllow: \/+/);
assert.match(robots, /Sitemap: https:\/\/regenerativelandscapersupply\.com\/sitemap\.xml/);
assert.ok(sitemap.includes(`<loc>${canonical}</loc>`), "sitemap must list the canonical RLS homepage");
assert.doesNotMatch(sitemap, /organicsoilwholesale\.com/);
assert.equal((sitemap.match(/<url>/g) || []).length, guides.length + 1, "sitemap must list the homepage and all material guides");
for (const guide of guides) {
  const url = `https://regenerativelandscapersupply.com/materials/${guide.slug}`;
  const guideHtml = await readFile(new URL(`../dist/materials/${guide.slug}/index.html`, import.meta.url), "utf8");
  await access(new URL(`../dist${guide.image}`, import.meta.url));
  assert.ok(llms.includes(`${url} — ${guide.name}`), `AI-readable brand file must link to ${guide.name}`);
  assert.ok(html.includes(`href="/materials/${guide.slug}"`), `homepage must link to ${guide.name}`);
  assert.ok(sitemap.includes(`<loc>${url}</loc>`), `sitemap must include ${guide.name}`);
  assert.ok(guideHtml.includes(`<link rel="canonical" href="${url}"`), `${guide.name} must have a self-canonical URL`);
  assert.ok(guideHtml.includes(`<h1>${guide.name}</h1>`), `${guide.name} page must have crawlable page content`);
  assert.match(guideHtml, /"@type":"Product"/);
  assert.doesNotMatch(guideHtml.slice(0, guideHtml.indexOf("<body")), /organicsoilwholesale\.com/);
}
assert.equal(JSON.parse(manifest).name, "Regenerative Landscaper Supply");

console.log("RLS SEO output checks passed (canonical metadata, crawlable content, schema, FAQs, sitemap, AI crawler access, llms.txt, and brand manifest).");
