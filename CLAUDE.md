# Project-Specific Instructions

## Current OSW Handoff Snapshot - 2026-06-29

- Production deploy path: push GitHub branch `main-clean`; Vercel project `organic-soil-wholesale` deploys production from that branch. Do not run `vercel --prod` from a dirty tree.
- Main business goal: local Organic Soil Wholesale pickup orders at the Phoenix yard, plus qualified phone/form leads.
- Paid pickup products: Simon's Gold, Mikey's Worm Poop, Soil Craft, Nature's Blanket Premium.
- Tracking files to inspect first:
  - `client/index.html` for GTM `GTM-MRVDQ73P` and GA4 fallback `G-RFRTHKGL0X`.
  - `client/src/lib/analytics.ts` for Vercel Analytics, `dataLayer`, GA4 ecommerce events, and phone/lead events.
  - `client/src/pages/Checkout.tsx` for `begin_checkout`.
  - `client/src/pages/OrderConfirmation.tsx` for guarded `purchase`.
  - `OSW_GOOGLE_ADS_HANDOFF_2026-06-27.md` for Google Ads/GA4 audit notes.
- Latest Ads finding: Google Ads account `122-325-9690` has GA4-imported `Soil Seed & Water (web) purchase` as Primary, but it is `Misconfigured` because no conversions have been recorded in the last 7 days. Supabase showed no OSW orders in the last 48 hours during the 2026-06-29 check, so a real post-deploy `purchase` still needs proof.
- Do not create fake production purchases just to satisfy Ads/GA. Verify with the next legitimate paid checkout.

## Official Public Phone Number

- Use **(602) 637-0032** as the official public customer support line for Organic Soil Wholesale / Soil Seed & Water.
- Do **not** use Rodo's personal number (`928-550-1649`) on public customer-facing pages.
- Do **not** hardcode CallRail or other tracking numbers in React/server code. Call tracking should be handled through Google Tag Manager / tracking configuration.
- If a phone number from CallRail appears in screenshots or old code, treat it as a tracking number unless the user confirms it is the official public line.
- P0 prevention: read `docs/incidents/2026-08-07-callrail-malformed-tel.md` and follow `docs/RELEASE_CHECKLIST.md` before changing phone, CallRail, GTM, header, footer, hero, campaign, checkout, or quote behavior.
- Every source/rendered US dial target must be canonical E.164: `tel:+1` plus ten digits. After CallRail loads, visible text, `href`, and `aria-label` must match.

## Mobile-First Development Priority
- **90% of website visitors use mobile phones** - CRITICAL priority
- Always develop and test mobile view first before desktop
- Ensure all touch targets are minimum 44x44px for easy tapping
- Test all features on mobile viewport (375px-414px width)
- Avoid horizontal scrolling at all costs on mobile

## Product Image Display Order
- **ALWAYS display texture photo as the first/primary image** for all products
- Order: 1) Product Texture Photo, 2) Additional images, 3) Product bag photo
- This applies to all product detail pages and galleries

## Image Performance Concerns
- **High-resolution texture photos (7.5MB+) cause slow loading times**
- Need to implement image optimization: lazy loading, compression, responsive sizes
- Consider creating optimized versions (e.g., texture-photo-optimized.jpg at <500KB)
- Product images are already in client/public/ directory - use local files, not external URLs

## Pay & Pickup Landing Strategy
- **`/qr` IS THE MAIN ENTRANCE QR FOR THE OSW YARD.** The printed QR code at the front gate (1634 N 19th Ave, Phoenix — Agave yard) points to `https://organicsoilwholesale.com/qr`. Customers driving in scan it to either pay/order online or check in for an already-paid pickup.
- **Canonical route**: `/qr` (the printed signage URL). Aliases that render the same component: `/pay-and-pickup`, `/pay-and-pickup/:step?`, `/drive-through/:step?`. **Never rename or remove `/qr` — printed signage in the yard depends on it.**
- **Mobile-first, hyper-optimized.** 90%+ of scans are phone-in-hand at the gate. Some desktop access is possible but mobile is the priority.
- **Design pattern**: Welcome screen with two large card-style buttons + product thumbnails (see `PayAndPickup.tsx` for the canonical implementation). Bold, simple, 2-3 taps max to either order or check in.
- May become DEFAULT ordering interface for all users.
- Focus: Convert drive-by traffic to immediate orders.

## Catalog Consolidation — Pay-and-Pickup vs Quote (current model)

Historically there were two parallel pages: `/products` (quote-only) and an old `/pay-and-pickup` catalog (card-payment-only). **These were consolidated**: `/products` is now the single source of truth for browsing everything.

- **The 4 mains** are the ONLY products available for direct card payment / pickup. Everything else is quote-only.
- The 4 mains live in `client/src/components/PayPickupGrid.tsx` → `MAIN_PRODUCT_IDS = [1000, 1001, 137, 3000]` (Simon's Gold, Mikey's Worm Poop, Soil Craft, Nature's Blanket Premium). **Single source of truth — update this array to add/remove a pay-and-pickup product.**
- `/products` renders `PayPickupGrid` at the top (the buyable 4) + full catalog with `QuoteCart` (everything else).
- `/qr` (and aliases) renders the QR landing with `PayPickupGrid` behind the "Order & Pick Up" button. Same 4 mains, same source.
- **Do not** reintroduce a separate `/pay-and-pickup` catalog. The route exists only as an alias for the QR landing now, not as a duplicate listing.
- Anything outside the 4 mains is quote-only on every surface (QR landing, Products page, Pay & Pickup, etc.).

## Database Management
- Use Supabase MPC when needed modifications in the database

## API Keys Location (.env)

| Service | Key | Purpose |
|---------|-----|---------|
| **Supabase** | `VITE_SUPABASE_ANON_KEY` | Public/client-side - safe to expose, limited by Row Level Security (RLS) |
| **Supabase** | `SUPABASE_SERVICE_ROLE_KEY` | Server-side ONLY - bypasses RLS, full admin access. NEVER expose to client |
| **Stripe** | `STRIPE_SECRET_KEY` | Server-side - process payments, create invoices |
| **Stripe** | `VITE_STRIPE_PUBLISHABLE_KEY` | Client-side - safe to expose, used for Stripe.js |
| **HubSpot** | `HUBSPOT_ACCESS_TOKEN` | Server-side - API calls to create/read contacts |
| **HubSpot** | `HUBSPOT_CLIENT_SECRET` | Server-side - webhook signature validation |
| **Resend** | `RESEND_API_KEY` | Server-side - send transactional emails |
| **Grok** | `XAI_API_KEY` | Server-side - AI features |

### Key Types Explained

| Type | Can Expose? | Use Case |
|------|-------------|----------|
| **Anon/Public/Publishable** | ✅ Yes | Frontend code, browser - limited permissions |
| **Secret/Service Role** | ❌ Never | Backend only - full access, bypasses security |
| **Access Token** | ❌ Never | API authentication - treat like password |

## 2026-06-10 bulk delivery rule
- Public checkout uses walking-floor delivery capacity of 24 tons or 90 CY per load.
- Simon’s Gold / dairy compost bulk is sold by ton online using the current truckload price divided by 24.
- Trucking quote cost multiplies by required loads: ceil(tons/24) or ceil(CY/90).
- Legacy OrderForm also labels dairy compost bulk by ton and shows walking-floor load count.
