# Organic Soil Wholesale Google Ads Handoff - 2026-06-27

## Business Goal

Organic Soil Wholesale ads should drive local yard pickup orders for the Phoenix yard at 1634 N 19th Ave.

Primary desired conversion:
- Pay online and pick up at the yard.

Secondary desired conversions:
- Qualified inbound phone calls.
- Qualified CRM/contact form leads.
- Bulk/local buyer inquiries that can become outbound sales follow-up.

## Customer Targets

Do not think of this as pure ecommerce. This is local bulk/pickup commerce.

Valuable buyer types:
- Homeowners and home gardeners buying pickup bags.
- Local landscapers who can pick up at the 19th Ave yard.
- Landscapers buying mulch, dairy compost, and bulk products.
- Nurseries buying across product categories.
- Farms buying high volume, lower margin.
- Contractors buying mulch and soil products.

Small pickup orders are acceptable because the current goal is traffic, visibility, and yard activity. Higher-volume orders are better, but do not exclude local homeowner pickup intent.

## Products To Push

The current paid pickup focus is the four OSW yard products:
- Dairy compost / Simon's Gold.
- Worm castings / Mikey's Worm Poop.
- Potting soil / Soil Craft.
- Premium dark mulch / Nature's Blanket Premium.

Messaging should emphasize:
- Local pickup.
- Pay online.
- Volume discounts.
- Bags to truckloads.
- Phoenix yard / 19th Ave.
- Local bulk sales, not shipped ecommerce.

## Known Tracking State

Website:
- `organicsoilwholesale.com`
- Main paid page: `/products`
- GTM container on site: `GTM-MRVDQ73P`
- GA4 measurement observed live: `G-RFRTHKGL0X`
- Vercel Analytics installed and firing.
- CallRail is active through GTM and swaps the public footer number on marketing pages.

Google Ads:
- Account ID: `122-325-9690`
- Campaign: `Soil Seed and Water | Wholesale | Search`
- Last checked range: May 28 - Jun 26, 2026.
- Spend: about `$601.90`.
- Clicks: `331`.
- Counted conversions: `5`.
- Cost per counted conversion: about `$120.38`.
- Bid strategy: Maximize clicks.
- Budget: `$32/day`.
- Negative keywords were empty during audit.

Ads conversion actions:
- `Phone Call`: active, had 5 conversions.
- `Form Capture`: primary but no recent conversions.
- `Purchase`: needs attention, 0 conversions.

GA4:
- Property label observed: `Soil Seed & Water Wholesale`.
- GA4 warned that Ads account `122-325-9690` was not linked.
- Last 7 days observed: 206 active users, 1.5K events, 0 key events, 112 Paid Search sessions.

Vercel Analytics:
- Last 7 days observed: 224 visitors, 483 page views, 65% bounce.
- Top events visible:
  - Route Viewed: 483 total.
  - Product Detail Viewed: 69 total.
  - Product Size Selected: 27 total.
  - Product Purchase Type Selected: 7 total.
  - Cart Item Added: 8 total.
- Checkout success / purchase event was not visible in top Vercel events.

Backend:
- Supabase orders table had recent paid orders.
- Last 30 days observed: 19 orders, 14 paid.
- Some order `total` / `total_amount` fields were 0 even when item totals had value, so revenue reporting needs cleanup.

## Main Diagnosis

The business is getting traffic and some real orders, but Ads/GA are not learning from the right conversion data.

Google Ads is mostly optimizing around phone calls because purchase and form conversion tracking are weak or incomplete.

The current most important work is:
1. Link GA4 and Google Ads.
2. Send standard GA4/dataLayer ecommerce and lead events from OSW.
3. Fix purchase/order value so Stripe, Supabase, GA4, Ads, and Vercel agree.
4. Add a negative keyword list carefully, without blocking good local pickup intent.
5. Move bidding toward conversions only after tracking is clean.

## Code Tracking Implemented 2026-06-27

Implemented in the OSW website code, not deployed yet:
- Standard `dataLayer` events now fire alongside Vercel Analytics.
- `view_item` fires on product detail pages with product ID, name, category, and OSW yard channel.
- `add_to_cart` fires when a product is added with item, quantity, unit price, and value.
- `begin_checkout` fires when the customer submits the checkout form for payment.
- `purchase` fires once on the order confirmation page with transaction ID, value, fulfillment, and item data.
- `purchase` is guarded so it only fires after `/api/checkout/confirm-paid` confirms payment, or when the saved order is explicitly marked as a confirmed/free order.
- `generate_lead` fires after successful contact form submissions and bulk order request submissions.
- `phone_click` fires for visible `tel:` phone links and button-based phone actions.
- `/api/checkout/confirm-paid` now returns order value and order items so the confirmation page can track paid order revenue accurately.

Local verification completed:
- `npm run --prefix client typecheck` passed.
- `npm run --prefix client build` passed.
- Full local app tested at `http://localhost:3000`.
- Verified `view_item` on `/products/simons-gold`.
- Verified `add_to_cart` for Simon's Gold 9 lb Bag, value `$12.46`.
- Verified `begin_checkout` with a stubbed checkout request, so no real order was created.
- Verified `phone_click` on a product page phone link.
- Verified `purchase` on `/order-confirmation` with fake local order data, value `$12.46`, and no real payment.
- Verified false-conversion guard: an unconfirmed saved order did not fire `purchase`; a confirmed/free saved order did fire `purchase`.

Important:
- This is code-side tracking only until deployed.
- After deploy, verify the same events in GA4 DebugView and Google Tag Assistant on `organicsoilwholesale.com`.
- Then mark/import the right GA4 events into Google Ads.

## Google Ads / GA4 Setup Still Needed

In GA4:
- Link GA4 property `Soil Seed & Water Wholesale` to Google Ads account `122-325-9690`.
- Mark or create key events for:
  - `purchase`
  - `generate_lead`
  - `phone_click`
- Keep `purchase` as the main business conversion.

In Google Ads:
- Import GA4 `purchase` as the primary conversion.
- Import `generate_lead` and `phone_click` as secondary conversions first.
- Do not switch bidding fully to conversions until live events are observed.
- Keep current budget around `$30-$40/day` during verification.
- After 7-14 days of clean conversion data, test `$50/day`.

Recommended campaign structure next:
- Campaign 1: Phoenix pickup intent for soil, compost, mulch, worm castings.
- Campaign 2: Landscaper/contractor local bulk pickup.
- Campaign 3 later: nursery/farm/high-volume leads, if budget allows.

## Negative Keyword Guidance

Do not block all homeowners. Do not block all "near me" searches.

Likely negatives to consider:
- `amazon`
- `home depot`
- `lowes`
- `walmart`
- `ace hardware`
- `fox farm`
- `happy frog`
- `miracle gro`
- `scotts`
- `free`
- `diy`
- `recipe`
- `how to make`
- `indoor plants`
- `houseplants`
- `cactus mix`

Be careful with:
- `garden soil`
- `potting soil`
- `mulch near me`
- `compost near me`
- `worm castings near me`

Those can be local pickup buyers if the ad copy and landing page clearly say Phoenix yard pickup and local bulk/bag pickup.

## Budget Thinking

Current budget was `$32/day`, about `$960/month`.

Recommended this week:
- Keep spend near `$30-$40/day` while tracking is fixed.
- Do not scale aggressively until purchase and lead tracking is accurate.
- After tracking is fixed and negatives are added, test `$50/day` for 7-14 days.
- If cost per real paid pickup order or qualified lead is acceptable, scale toward `$75-$100/day`.

Summer is a slow season, so the goal is clean learning, local visibility, and pickup flow validation before larger seasonal spend.
