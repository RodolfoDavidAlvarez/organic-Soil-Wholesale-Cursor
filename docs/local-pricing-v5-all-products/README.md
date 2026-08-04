# V5 All Products — Organic Soil Wholesale Local Pricing

Expanded catalog companion to **V5 core** (hero sheet). Same discount rules; more SKUs.

**Not named V6.** Brand titles: **V5 All Products · Local Pricing**.

## Files

- `Organic-Soil-Wholesale-Local-Pricing-V5-All-Products.pdf` — share/print PDF
- `Organic-Soil-Wholesale-Local-Pricing-V5-All-Products-EDIT.html` — editable browser version
- `Organic-Soil-Wholesale-Local-Pricing-V5-All-Products.html` — static HTML (same content)
- `OSW-LOCAL-PRICING-V5-ALL-PRODUCTS-UPDATE-LOG.md` — companion notes + deploy path

## Pages (5)

1. Potting soils (Soil Craft, PlantPal, PropaGrow, PlugBoost) + Mulch (Premium + Nature's Blanket)
2. Core amendments — Simon's Gold + Mikey's Worm Poop (same numbers as V5 heroes)
3. Specialty amendments — standard MSRP ladder; pickup/truckload = Quote
4. Concentrated amendments — SuperBooster + Cultivator's Rose
5. Pickup and Delivery Notes (ops page; no size-guide)

## Rules (same as V5 core)

- Pallet **20%** off bag×qty list (struck list + discounted)
- Potting: **1.5 CF · 30 bags/pallet**
- Mulch: **2 CF · 25 bags**
- Amendments: **144 × 9 lb** and **50 × 1 CF**
- Full flatbed (22 spots) **+10%** (byline)

## Render PDF

```bash
cd "../../"
node scripts/render-simple-tables-pdf.mjs \
  --input "official/V5-All-Products-Organic-Soil-Wholesale-Local-Pricing/Organic-Soil-Wholesale-Local-Pricing-V5-All-Products-EDIT.html" \
  --output "official/V5-All-Products-Organic-Soil-Wholesale-Local-Pricing/Organic-Soil-Wholesale-Local-Pricing-V5-All-Products.pdf"
```

## Website

`myorganicsoil.com` / OSW website repo → `docs/local-pricing-v5-all-products/`

Use **V5 core** (`docs/local-pricing-v5/`) for the short hero sheet; use this pack when the full catalog is needed.
