# Organic Soil Wholesale release handoff — July 23, 2026

This release consolidates the recent OSW customer-experience, checkout, fulfillment, certification, email-engagement, and product-media work into one production release.

## Customer purchase experience

- Reworked product detail pages into a concise, mobile-first size-selection flow.
- Added consistent bag, pallet, tote/super sack, loose bulk pickup, and truckload choices.
- Added 10% pallet/full-flatbed incentives with server-authoritative discount calculation.
- Added flatbed capacity tracking (22 pallet spots), mixed-cart spot counting, and load guidance.
- Added dual-unit bulk context where useful (price per ton and cubic-yard equivalent).
- Added product-specific size/weight labels and clearer step transitions.
- Fixed size selection so the next purchase step scrolls into view.
- Added warmer visual styling while keeping the buy flow compact.
- Moved detailed ingredient education below the purchase flow.
- Added PlantPal ingredient content and downloadable specification sheet.
- Added new contextual product/lifestyle/use-case images.
- Kept certification marks beside product titles and removed duplicate certification images from galleries.

## Certifications

- Added reusable OMRI and U.S. Compost Council certification marks.
- Added product-to-OMRI certificate mapping.
- Added optimized certificate previews and downloadable certificate PDFs.
- Added certification marks to product cards/detail surfaces without duplicating them in media galleries.

## Pickup and delivery

- Preserved the two-location operating model:
  - Congress: faster loose-bulk pickup.
  - Phoenix: scheduled loose-bulk pickup by appointment.
- Added location-specific pickup guidance and scheduling copy.
- Integrated ZIP-based trucking estimates directly into the truckload product flow.
- Persisted delivery estimates from product detail to checkout.
- Added street-address autocomplete and city/state/ZIP prefill.
- Added delivery availability ranges and preferred delivery windows.
- Added semi-access and rough/off-pavement access confirmation.
- Corrected flatbed-versus-walking-floor truck selection and multi-load counting.
- Added OSW delivery intake/work-order creation and richer fulfillment metadata.

## Checkout

- Reorganized checkout around fulfillment, timing, customer details, and Stripe payment.
- Added delivery-address confirmation after ZIP pricing.
- Added delivery estimate, product totals, flatbed occupancy, and discount summaries.
- Added authoritative server-side full-flatbed pricing protection.
- Improved legacy order compatibility by always supplying a business/display name.
- Added preferred delivery range/window metadata to orders and Stripe sessions.
- Improved delivery and pickup information carried into notifications and downstream operations.

## Catalog, content, and SEO

- Changed the homepage primary CTA to the more immediate “Get Soil Today.”
- Updated featured products, size catalog, product cards, quote cart, pickup, distributor, and mulch surfaces to use the revised product/fulfillment model.
- Updated product titles, descriptions, packaging context, and image ordering.
- Added new product imagery in JPG and WebP formats.
- Updated local-business and product SEO configuration.
- Added Phoenix yard entrance map assets for customer email/directions use.

## Newsletter and engagement infrastructure

- Consolidated Resend webhook signature verification for Express and Vercel handlers.
- Synchronized the production signing secret with the canonical OSW Resend endpoint and verified signed webhook acceptance.
- Expanded delivery, open, click, bounce, complaint, and unsubscribe event processing.
- Added safer unsubscribe handling and suppression updates.
- Added DB-first campaign send tracking, versioning, audit, approval/preflight, scheduling, and send-mode migrations.
- Production Supabase already contains the required newsletter tables and columns; the migration files are retained as source-controlled schema history.

## Main files and modules

- `client/src/pages/ProductDetail.tsx`
- `client/src/pages/Checkout.tsx`
- `client/src/components/DeliveryQuoteWidget.tsx`
- `client/src/components/AddressAutocomplete.tsx`
- `client/src/components/FlatbedLoadMeter.tsx`
- `client/src/components/ProductCertificationMarks.tsx`
- `client/src/contexts/QuoteCartContext.tsx`
- `client/src/lib/deliveryDraft.ts`
- `client/src/lib/flatbedSpots.ts`
- `server/routes/checkout.ts`
- `server/routes/quoteRequests.ts`
- `server/routes/addressSuggest.ts`
- `shared/flatbedSpots.js`
- `shared/oswDeliveryIntake.js`
- `shared/newsletterEngagement.js`
- `shared/resendWebhookVerify.js`
- `api/index.js`
- `api/resend/webhook.js`

## Verification

- Production client build: passed.
- Git whitespace/conflict check: passed.
- Local API health endpoint: passed.
- PlantPal public product API: passed.
- Browser smoke test: Simon's Gold product → truckload → ZIP `85009` → quoted delivery → checkout prefill passed.
- Certification gallery cleanup verified: certificate remains accessible beside the title and duplicate gallery media is removed.
- Root TypeScript check still reports pre-existing server typing debt outside this release; the production Vite/Vercel build succeeds.

## Deployment

- Git target: GitHub `main`.
- Vercel project: `organic-soil-wholesale`.
- Production deployment method: Vercel CLI from a clean committed tree.
- Production URL and deployment ID are recorded in the release commit/deployment output.

## Known follow-up

- Supabase reports broad pre-existing RLS exposure across legacy/public tables. Do not enable RLS globally without first defining and testing policies, because doing so would break current server/client access.
- The repository-wide TypeScript errors should be addressed separately from this customer-experience release.
