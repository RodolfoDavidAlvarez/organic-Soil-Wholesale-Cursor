# Regenerative Landscape Supply

Landscape-pro / regenerative landscape front door for Soil Seed & Water, hosted in this Organic Soil Wholesale repo.

- **Brand:** Regenerative Landscape Supply
- **Domain:** `regenerativelandscapesupply.com` (spelling: *landscape* with a **d**)
- **Parent:** Soil Seed & Water / Organic Soil Wholesale
- **Positioning source:** SSW Regenerative Landscape Soil Systems draft (customer-facing). The Agave Regenerative Landscape Management draft is related field context only — do not market Agave on this site.

This is not a second inventory, Stripe account, or admin portal. It shares OSW / MOS ops, the Phoenix yard, and the existing lead tables.

## How it is wired

| Surface | URL | What renders |
|---|---|---|
| Dedicated domain | `https://regenerativelandscapesupply.com/` | RLS marketing pages at `/`, `/soil-dashboard`, `/products`, `/programs`, `/professionals`, `/consult`, `/contact` |
| OSW preview (no DNS yet) | `https://organicsoilwholesale.com/rls` | Same RLS app under a `/rls` prefix |
| OSW catalog / checkout / QR | `https://organicsoilwholesale.com/products`, `/qr`, `/checkout` | Unchanged Organic Soil Wholesale paths |
| MOS | `https://myorganicsoil.com` | Sales portal / admin — not a storefront in this repo |

Brand resolution lives in `shared/brands.js` and is used by the Vite app, Express (`server/`), and the production Vercel handler (`api/index.js`).

Order of resolution:

1. Explicit `brand` on the API body (`"rls"` / `"osw"`)
2. Dedicated hostname `regenerativelandscapesupply.com` (and `www`)
3. Path prefix `/rls` on the OSW host
4. Query `?brand=rls` on `/` for local preview
5. Default: Organic Soil Wholesale

`/products`, `/checkout`, `/qr`, and `/admin` on `organicsoilwholesale.com` stay OSW. On the RLS domain, `/admin` and `/qr` still reach the existing OSW screens so ops are not forked.

## Shared SSW integration

RLS forms post to the **existing** public APIs:

| Form | Endpoint | Tables | MOS `source` |
|---|---|---|---|
| Consult | `POST /api/leads/submit` | `contact_messages` | `rls_consult_request` |
| Contact | `POST /api/contact/submit` | `contact_submissions` | `rls_contact_form` |
| Product quote | `POST /api/quote/submit` | `quote_requests` | `rls_quote_request` |

Every MOS payload also includes `source_data.brand = "rls"` and a `source_url` on `regenerativelandscapesupply.com` (or the `/rls` preview URL).

OSW sources are unchanged: `osw_lead_form`, `osw_contact_form`, `osw_quote_request`, `osw_order_callback`.

Paid pickup and card checkout stay on Organic Soil Wholesale (`/qr`, `/products`, `/checkout`) so Stripe, GA4 purchase, and yard QR signage are not duplicated.

Admin visibility:

- OSW admin → Contact / leads lists (`contact_messages`, `contact_submissions`)
- MOS web + mobile → `sp_leads` after MOS ingest
- Shop dashboard / printer → unchanged; RLS does not create pickup orders by itself

If MOS later allowlists `source` values, add the `rls_*` strings. Until then, rows still land in OSW tables even if MOS rejects an unknown source.

## Identity (distinct from OSW / MOS)

| | Organic Soil Wholesale | My Organic Soil | Regenerative Landscape Supply |
|---|---|---|---|
| Domain | organicsoilwholesale.com | myorganicsoil.com | regenerativelandscapesupply.com |
| Audience | Wholesale / yard pickup | Reps + yard ops | Landscape contractors + property owners |
| Theme | `#264027` / `#7BA05B` | Sales portal | `#1B2E1F` / `#C4A574` / paper `#F4EFE6` |
| Public phone | (623) 263-3386 | same | same |

Product names used on the site (do not rename):

- Simon's Gold (dairy compost)
- Mikey's Worm Poop (worm castings)
- Soil Craft
- Nature's Blanket Premium
- PlantPal
- Turf Daddy

The four card-pay mains remain PlantPal, Mikey's Worm Poop, Simon's Gold, and Nature's Blanket Premium. Soil Craft and Turf Daddy are quote / protocol products.

## Local preview

```bash
npm test
npm run dev
```

Then open:

- `http://localhost:3000/rls` (or the Vite client on 5173 proxied to the API)
- `http://localhost:5173/rls`
- `http://localhost:5173/?brand=rls` (home only)

## Environment variables

RLS reuses the current OSW / SSW secrets. **Do not invent or commit API keys.**

Already required for production OSW (no new secrets to launch the pages):

| Variable | Where | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` / `SUPABASE_URL` | Vercel | Shared SSW project `govktyrtmwzbzqkmzmrf` |
| `VITE_SUPABASE_ANON_KEY` | Vercel (public) | Client Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel (server only) | API writes to contact / quote tables |
| `MOS_LEAD_INGEST_SECRET` | Vercel | Must match MOS `LEAD_INGEST_SECRET` |
| `MOS_LEAD_INGEST_URL` | optional | Defaults to `https://myorganicsoil.com/api/leads` |
| `RESEND_API_KEY` | Vercel | Admin lead / contact email |
| `STRIPE_SECRET_KEY` / `VITE_STRIPE_PUBLISHABLE_KEY` | Vercel | OSW checkout only — RLS does not charge |

Optional later (placeholders only until Rodo sets them):

| Variable | Status | Purpose |
|---|---|---|
| `RLS_GTM_ID` | not wired | Separate GTM if Ads should not share `GTM-MRVDQ73P` |
| `RLS_GA4_ID` | not wired | Separate GA4 if `G-RFRTHKGL0X` should stay OSW-only |
| `RLS_FROM_EMAIL` | not wired | Branded Resend From if not `info@soilseedandwater.com` |
| `RESEND_API_KEY` rotate / domain | existing | Confirm `regenerativelandscapesupply.com` SPF/DKIM if sending from that domain |

## DNS + Vercel domain attach (Rodo)

Production already deploys from GitHub `main-clean` to Vercel project `organic-soil-wholesale`. Attach the new hostname to **that same project** so one build serves both brands.

1. In the registrar for `regenerativelandscapesupply.com`, add the records Vercel shows after you add the domain (usually `A` 10.0.1.2 and/or the `cname.vercel-dns.com` CNAME for `www`).
2. Vercel → Project `organic-soil-wholesale` → Settings → Domains → Add `regenerativelandscapesupply.com` and `www.regenerativelandscapesupply.com`.
3. Redirect `www` → apex (or the reverse). Keep the spelling *landscape*.
4. Wait for TLS. Do **not** create a second Vercel project or run `vercel --prod` from a dirty tree.
5. After DNS is live, open `/`, `/consult`, and submit one real internal test lead. Confirm:
   - `contact_messages.subject` starts with `[RLS]`
   - MOS `sp_leads.source` is `rls_consult_request` (or the row is at least in OSW admin)
6. Point printed landscape-pro materials at `https://regenerativelandscapesupply.com`. Yard gate QR stays `https://organicsoilwholesale.com/qr`.

## What still needs Rodo

- Registrar DNS for `regenerativelandscapesupply.com` / `www`
- Vercel domain attach + TLS on project `organic-soil-wholesale`
- Confirm `MOS_LEAD_INGEST_SECRET` is present on that project (already used by OSW)
- Decide whether RLS should share GTM `GTM-MRVDQ73P` / GA4 `G-RFRTHKGL0X` or get its own containers (`RLS_GTM_ID` / `RLS_GA4_ID` are not created here)
- Optional Resend domain / branded From for `regenerativelandscapesupply.com`
- Optional MOS allowlist update for `rls_*` lead sources
- Do **not** fabricate production purchases to “prove” the brand

## Tests

```bash
npm test
```

Runs `shared/brands.test.js` (Node's built-in test runner). Covers brand identity, host/path isolation from OSW `/products`, href prefixing, and MOS source strings.

There is no existing Jest/Vitest suite in this repo. Browser smoke of `/rls` should be done on a preview deploy or `npm run dev`.

## File map

| Path | Role |
|---|---|
| `shared/brands.js` | Brand identity + host/path resolution + lead source map |
| `shared/brands.test.js` | Unit tests |
| `client/src/pages/rls/*` | RLS pages |
| `client/src/components/rls/*` | RLS chrome + lead form |
| `client/src/lib/brand.ts` | Client hook |
| `client/src/App.tsx` | Host/path switch (OSW chrome hidden on RLS surfaces only) |
| `server/routes/contact.ts` / `quoteRequests.ts` / `services/leadSubmission.ts` | Express brand tagging |
| `api/index.js` | Production Vercel brand tagging + `/api/quote/submit` |
