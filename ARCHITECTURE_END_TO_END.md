# OSW ↔ MOS ↔ Shop Dashboard — End-to-End Architecture

> **READ THIS FIRST** before editing the OSW website's quote form, contact form, pickup checkout, or any flow that creates a record downstream. Every customer touch on OSW eventually shows up in MOS (sales portal app + admin web), the shop dashboard, and/or the SSW printer.

## The systems

| System | Repo | What it is | Audience |
|---|---|---|---|
| **OSW** | `Organic Soil Wholesale Website/` | Customer-facing wholesale site — products, quote form, pickup checkout, contact form | Customers |
| **MOS backend + web admin** | `myorganicsoil.com/` (Vercel) | Express API + Vite/React admin panel. All `sp_*` tables live in SSW Supabase. | Reps + admins (web) |
| **MOS mobile (Sales Portal)** | `myorganicsoil-mobile/` (Expo/iOS) | Native rep app — leads, contacts, orders, earnings, yard pickups | Sales reps in the field |
| **Shop dashboard** | `myorganicsoil.com/client/public/shop-dashboard.html` | HDMI kiosk in the SSW shop — live pickups, leads, recent orders, product photos | Whoever's in the shop |
| **Print server** | `myorganicsoil.com/print-server/` (runs on Raspberry Pi) | Express service that takes JSON receipts and prints to Star TSP100IIIU thermal printer | Auto-print on shop floor |

All five share one SSW Supabase database (`govktyrtmwzbzqkmzmrf`). Same Stripe account (`acct_1LW3cXG0O2r9Aau4`).

---

## The five flows that matter

### 1. Lead submission (customer fills OSW contact / quote form)

```
OSW form
  │ POST /api/contact OR /api/quote-request   (OSW backend)
  ▼
OSW backend forwards to MOS
  │ POST https://myorganicsoil.com/api/leads
  │ Headers: X-Lead-Source-Key: <LEAD_INGEST_SECRET>
  │ Body: { full_name, company, email, phone, message, source: 'osw_lead_form' | 'osw_quote_request' }
  ▼
MOS backend (api/index.js, /leads handler ~line 1499)
  ├── Insert into sp_leads (status='available')
  ├── Fan out: SMS + email to all active reps via distributeLeadToReps()
  ├── Expo push notifications to all reps with notify_push=true
  └── Returns { id, status, notified }
  ▼
Immediate visible effects
  ├── Mobile MOS app — fires full-screen lead push notification on every rep's phone
  ├── Shop dashboard — KPI counter ticks up + lead arrives in side panel
  │                    + FULL-SCREEN HERO overlay with name/company/message + chime
  └── Web admin /admin/leads — new row at top
```

**OSW side env var**: `MOS_LEAD_INGEST_SECRET` — must match MOS `LEAD_INGEST_SECRET`.

**OSW side endpoint to call**: `POST https://myorganicsoil.com/api/leads` with the secret header.

Once a rep taps "Accept" in the mobile app:
- `sp_leads.status` → `'accepted'`, `accepted_by_user_id` set
- A `sp_customers` row is created (or matched) with `stage='lead'` so the rep can manage them in Contacts
- Shop dashboard "Lead History" view shows the accepted-by name

---

### 2. Pickup checkout (customer pays + books pickup slot on OSW)

```
OSW pickup checkout
  │ Stripe payment succeeds
  ▼
OSW backend
  │ POST https://myorganicsoil.com/api/pickup-orders
  │ Headers: X-Lead-Source-Key: <LEAD_INGEST_SECRET>  (reused for now; can split later)
  │ Body: {
  │   osw_order_id: <number — unique key, idempotent>,
  │   osw_order_number: 'PU-12345',
  │   customer_name, customer_phone, customer_email,
  │   items: [{ product_name, size_option, quantity, unit_price_cents, total_price_cents }],
  │   pickup_at: '2026-05-23T14:00:00Z',
  │   slot_label: '2:00 PM',
  │   total_cents: 14288,
  │   payment_status: 'paid',
  │   source: 'osw_pay_pickup'
  │ }
  ▼
MOS backend (/pickup-orders handler ~line 1858)
  ├── Upsert into sp_pickup_orders (osw_order_id is the unique conflict key — idempotent)
  ├── Fan out via distributePickupToYardReps() — SMS + email + push to yard reps
  ├── AUTO-PRINT receipt to the shop printer (3 retries with backoff)
  └── Returns { id, status, notified, printed }
  ▼
Immediate visible effects
  ├── Yard reps get push: "New pickup · Heritage HQ · 2:00 PM"
  ├── Shop dashboard — KPI counter ticks up, pickup arrives in main column, chime plays
  ├── Mobile MOS app (Pickup tab) — new row at top with red badge count
  └── Star thermal printer in the shop prints the receipt immediately (no human action)
```

**Critical**: `osw_order_id` MUST be unique per pickup order. The upsert key prevents double-fires from webhook retries.

---

### 3. Sales-rep-created order (rep uses MOS mobile to build + send invoice)

```
Mobile MOS app (rep flow)
  ├── Rep builds cart → /api/documents/quote/send OR /api/documents/invoice/send
  └── For invoice: creates Stripe hosted invoice, emails customer, inserts sp_orders + sp_order_items
  ▼
MOS backend (api/index.js)
  ├── Insert sp_orders (subtotal_cents, delivery_fee_cents, tax_cents stored as CENTS)
  ├── Insert sp_order_items rows (unit_price + subtotal stored as CENTS)
  ├── Stripe webhook eventually flips payment_status='paid' when customer pays
  └── recordCommissionIfNeeded() fires when status moves to delivered/complete
  ▼
Immediate visible effects
  ├── Shop dashboard "Recent Orders" panel — new row at top
  ├── Mobile app Orders tab updates
  └── (When rep taps Print Receipt on the order) — printer fires the v3 pro receipt
```

---

### 4. Print receipt (manual trigger from rep OR auto from pickup arrival)

```
Trigger source                                     Path
──────────────────────────────────────────────────────────────────────────
Mobile MOS "Print Receipt" button on an order  →  POST /api/orders/:id/print-receipt
OSW pickup webhook (auto)                       →  inline in /pickup-orders handler
                                                    │
                                                    ▼
MOS backend resolves the print server URL
  ├── Read sp_settings.print_tunnel_url (current Pi tunnel)
  ├── Fall back to env PRINT_SERVER_URL
  └── POST {url}/print/sales-receipt with X-Print-Secret + receipt JSON
                                                    │
                                                    ▼
Pi (ssw-print.local) print server
  ├── receipt-pro.js builds an SVG receipt at 576-dot width
  ├── sharp renders to PNG → star-raster.js packs to 1-bit Star raster bytes
  └── Writes directly to /dev/usb/lp0 — printer cuts & ejects in ~2s
```

The cloudflared "quick tunnel" URL rotates whenever cloudflared restarts. **Self-healing watcher** on the Pi (`ssw-tunnel-watcher.service`) detects the URL change every 30s and POSTs the new URL to `/api/admin/print-tunnel-url`, which writes it to `sp_settings`. No human action required, no Vercel redeploy required.

---

### 5. Shop dashboard data refresh (HDMI in the shop)

Pi runs Chromium in kiosk mode → loads `https://myorganicsoil.com/shop-dashboard?key=<SHOP_DISPLAY_KEY>`.

Dashboard polls `/api/shop/dashboard.json?key=...` every **2 seconds** and renders three rotating views (live ops · lead history · product showcase) every **25 seconds**.

API payload includes:
- `pickups_today` (from `sp_pickup_orders` where `pickup_at` is today — labeled **via OSW**)
- `unclaimed_leads` (from `sp_leads.status='available'`, last 24h)
- `recent_orders` (from `sp_orders` last 24h — labeled **via Sales Portal**)
- `recent_accepted_leads` (last 7 days, with `accepted_by_name`)
- `today_metrics` (orders created/paid + revenue)
- `counts` (header KPIs)

---

## Tables that get touched

| Table | Created by | Read by |
|---|---|---|
| `sp_leads` | OSW lead/quote forms (via `/api/leads`) | Mobile app (Leads tab), web admin (`/admin/leads`), shop dashboard |
| `sp_customers` | Lead accept flow + manual create | Mobile (Contacts tab), web admin |
| `sp_pickup_orders` | OSW pickup checkout (via `/api/pickup-orders`) | Mobile (Pickup tab), shop dashboard, web admin |
| `sp_orders` | Mobile MOS rep flow (`/api/orders`) + invoice/quote send | Mobile (Orders tab), web admin, shop dashboard, Stripe webhook |
| `sp_order_items` | Same as sp_orders | Same — joined for line item rendering |
| `sp_commissions` | Auto-inserted by `recordCommissionIfNeeded()` when an order is delivered | Mobile (Earnings tab), web admin |
| `sp_settings` | Pi tunnel watcher | MOS backend (looks up `print_tunnel_url`) |
| `notification_log` | Every SMS/email/push send | Web admin Notifications page |

---

## Field-name and unit conventions (CRITICAL)

When OSW posts to MOS endpoints, follow these exactly:

### Money is ALWAYS in cents (integer)

| Wrong | Right |
|---|---|
| `total: 14.28` (dollars) | `total_cents: 1428` (cents) |
| `unit_price: 1099` (ambiguous) | `unit_price_cents: 1099` |
| `subtotal: 720.00` (dollars) | `subtotal: 72000` (cents) |

Inside `sp_orders` the `subtotal`, `delivery_fee`, `tax_cents` columns are all CENTS. Inside `sp_order_items` the `unit_price` and `subtotal` columns are CENTS. Don't divide by 100 anywhere except at the rendering boundary (web, mobile, PDF, receipt).

### Status enums

| Table | Field | Values |
|---|---|---|
| `sp_leads.status` | `available` `accepted` `converted` `lost` `expired` |
| `sp_pickup_orders.status` | `queued` `in_progress` `picked_up` `no_show` `cancelled` |
| `sp_orders.status` | `draft` `quote` `submitted` `verified` `accepted` `in_progress` `on_the_way` `delivered` `complete` `cancelled` `rejected` |
| `sp_orders.payment_status` | `pending` `deposit_due` `paid` `refunded` |

---

## When editing OSW, ALWAYS

1. **Match the field names above** when posting to MOS endpoints
2. **Send money in CENTS** (integer, no decimals)
3. **Include the `X-Lead-Source-Key` header** with the shared `LEAD_INGEST_SECRET`
4. **Set `osw_order_id` uniquely** on every pickup POST so retries are idempotent
5. **Use `source` values that MOS already recognizes**: `osw_lead_form`, `osw_contact_form`, `osw_quote_request`, `osw_pay_pickup`
6. **Test the round trip** — submit a real test lead/order, verify it appears in mobile app + shop dashboard within 5 seconds
7. **Use small `customer_email` test values** like `test+osw@example.com` so they're easy to filter out later

---

## Environment variables that MUST stay in sync

| Variable | OSW value | MOS value | Purpose |
|---|---|---|---|
| Lead ingest secret | `MOS_LEAD_INGEST_SECRET` | `LEAD_INGEST_SECRET` | Auths OSW → MOS posts |
| MOS API base | `MOS_API_BASE` = `https://myorganicsoil.com/api` | — | Where OSW posts |

Plus on MOS (Vercel) — already set, don't change without knowing what you're doing:
- `PRINT_SERVER_URL` (legacy fallback; sp_settings.print_tunnel_url takes priority)
- `PRINT_SERVER_SECRET` (for /print/* auth)
- `SHOP_DISPLAY_KEY` (for the dashboard URL)

---

## Where to look when something breaks

| Symptom | First check |
|---|---|
| OSW lead/quote form submits but nothing appears in mobile | Check OSW backend logs — is it actually hitting MOS? Check MOS Vercel logs for the lead POST. Check `LEAD_INGEST_SECRET` matches both sides. |
| Pickup order in OSW but no print + no mobile notification | Check `/api/pickup-orders` returned 201. Check `osw_order_id` was set + unique. Check shop dashboard — if pickup appears there, the issue is downstream (push delivery / printer). |
| Print receipt fires but printer doesn't print | SSH to Pi → `curl localhost:3940/health` → check service status → check `journalctl -u ssw-print-server` |
| Dashboard says "Reconnecting…" | Cloudflared tunnel down — `ssh pi@ssw-print.local 'sudo systemctl restart ssw-print-tunnel'` and watcher will catch up in 30s |
| Mobile app says "Printer not connected" | Same as dashboard reconnecting — tunnel + watcher need to recover |
| Money shows wrong (e.g., $0.30 instead of $30) | Cents/dollars mismatch in OSW payload. Fix to CENTS at OSW side. |

---

## File map

| Where | What it has |
|---|---|
| `myorganicsoil.com/api/index.js` | All MOS backend routes — leads, pickup-orders, orders, print-receipt, shop dashboard, etc. |
| `myorganicsoil.com/api/document-payload.js` | Quote + invoice payload builders for PDF + email |
| `myorganicsoil.com/api/quote-pdf.js` | Quote PDF generator |
| `myorganicsoil.com/api/quote-email.js` | Quote email HTML |
| `myorganicsoil.com/print-server/lib/receipt-pro.js` | Receipt template for Star raster printer |
| `myorganicsoil.com/print-server/lib/star-raster.js` | TSP100IIIU raster command encoder |
| `myorganicsoil.com/client/public/shop-dashboard.html` | HDMI dashboard (single file) |
| `Credentials/raspberry-pi-print-server.md` | Pi credentials + recovery procedures |

---

_Last updated: 2026-05-22_
