# Product Architecture — Organic Soil Wholesale

> Updated: March 10, 2026
> Source of truth: Airtable SSW Financial Base (`apphA2NyUgdrXxCU3`) → Products table
> Filter: `Company product = "Soil Seed and Water"`, completed products only

---

## Product Taxonomy

SSW produces and sells products across 6 types:

| Type | Description | Count |
|------|-------------|-------|
| **Base Products** | Massively produced core materials (dairy compost, worm castings) | 2 |
| **Simple Blends** | 2-7 ingredient blends built on base products | 10 |
| **Single-Source Ingredients** | Individual raw materials for specific soil needs | 3 |
| **Concentrates** | Highly concentrated organic amendments | 2 |
| **Potting Soils** | Ready-to-use container mixes | 7 |
| **Mulches** | Wood fiber mulch enhanced with compost | 2 |
| **Total** | | **28** |

### Base Products
The foundation of everything SSW makes. Produced at scale.

| Sort | Product ID | Name | What It Is |
|------|-----------|------|------------|
| 1 | SSW-001 | Simon's Gold | Dairy Compost — aged, screened, biologically active |
| 2 | SSW-002 | Mikey's Worm Poop | Worm Castings — pure vermicompost |

### Simple Blends (2-7 ingredients)
Built from base products + supplemental ingredients. Each targets a specific plant type or use case.

| Sort | Product ID | Name | Target Use |
|------|-----------|------|------------|
| 3 | SSW-006 | Artemis Root Boost Blend | Trees & shrubs planting |
| 4 | SSW-007 | Tee Top Divot Repair Blend | Golf course divot repair |
| 5 | SSW-008 | Turf Daddy Blend | Overseed & aeration topdress |
| 6 | SSW-013 | Carbo Charge | Biochar carbon soil conditioning |
| 7 | SSW-015 | Oasis Blend | Palm & date tree plant food |
| 8 | SSW-016 | Bacchus Blend | Vineyard blend |
| 9 | SSW-019 | Seriokai's Secret Blend | Avocado & citrus tree plant food |
| 10 | SSW-020 | Pomona Blend | Pome & stone fruit tree plant food |
| 11 | SSW-021 | Stoned Ape's Blend | Mycorrhizal root enhancer |
| 12 | SSW-027 | Desert Defender | Drought resilience amendment |
| 13 | SSW-029 | Silky Silt Saver | Silt soil drought blend |
| 14 | SSW-030 | Clay Cure | Clay soil drought blend |

### Single-Source Ingredients
Individual materials customers buy for specific soil problems. Not blends.

| Sort | Product ID | Name | Why Customers Buy It |
|------|-----------|------|---------------------|
| 15 | SSW-024 | Amazonian Dark Earth | Biochar (NOT pre-charged — mix with compost to activate) |
| 16 | SSW-025 | Zeolite | Water retention / mineral soil conditioner |
| 17 | SSW-026 | SKMicrosource | Lower pH (avg 2.5-3.5), sulfur-potassium boost |

### Concentrates
Highly concentrated organic amendments. More potent, smaller application rates.

| Sort | Product ID | Name | Target Use |
|------|-----------|------|------------|
| 18 | SSW-003 | SuperBooster | Fruits & vegetables concentrate |
| 19 | SSW-012 | Cultivator's Rose Blend | Organic rose plant food |

### Potting Soils
Ready-to-use container mixes. No blending needed by customer.

| Sort | Product ID | Name | Target Use |
|------|-----------|------|------------|
| 20 | SSW-004 | Garden Craft Blend | Premium all-purpose potting soil |
| 21 | SSW-009 | PlugBoost | Seedling & plug starter mix |
| 22 | SSW-010 | PropaGrow | Propagation & rooting mix |
| 23 | SSW-011 | PlantPal | All-purpose indoor potting mix |
| 24 | SSW-031 | Succulent Success | Succulent interior potting mix |
| 25 | SSW-032 | Tropic Treasure | Tropical plant interior potting mix |
| 26 | SSW-033 | Flower Flourish | Flowering plant interior potting mix |

### Mulches
Wood fiber mulch enhanced with SSW base products.

| Sort | Product ID | Name | What Makes It Different |
|------|-----------|------|------------------------|
| 27 | SSW-005 | Nature's Blanket | Wood fiber + dairy compost |
| 28 | SSW-005P | Nature's Blanket Premium | Wood fiber + dairy compost + worm castings |

---

## Product Detail Page Spec (Customer-Facing)

### Design Principle
Optimize for the customer's ability to USE the product. Remove manufacturer jargon. Keep it scannable. Mobile-first (90% of traffic).

### Above the Fold

```
┌──────────────────────────────────────────────────┐
│                                                  │
│  [TEXTURE PHOTO]       PRODUCT NAME              │
│  (primary image)       Subtitle (brand name)     │
│                        ─────────────             │
│                        Short description          │
│                        (2-3 sentences, customer   │
│                        benefit focused)           │
│                                                  │
│                        [OMRI] [Cert badges]      │
│                        NPK: X-X-X (if applicable)│
│                                                  │
│                        [ Request Quote ]         │
│                        [ Call (602) 637-0032 ]   │
└──────────────────────────────────────────────────┘
```

### Below the Fold

```
┌──────────────────────────────────────────────────┐
│  HOW TO USE                                      │
│  Simple 2-3 line instructions (gardener level)   │
│                                                  │
│  BEST FOR                                        │
│  • Landscapers  • Nurseries  • Farms  etc.       │
│                                                  │
│  AVAILABLE SIZES                                 │
│  [9lb Bag]  [1CF Bag]  [Tote]  [Bulk]            │
│                                                  │
│  [Product Video — if available]                  │
│                                                  │
│  [BAG PHOTO — secondary image]                   │
└──────────────────────────────────────────────────┘
```

### Data Fields Per Product

| Field | Source | Required | Notes |
|-------|--------|----------|-------|
| `name` | Airtable "Product Name" | Yes | e.g. "Simon's Gold" |
| `subtitle` | Brand name / marketing title | Yes | e.g. "Dairy Compost" |
| `shortDescription` | Brief Overview (trimmed) | Yes | 2-3 sentences max, customer benefit focused |
| `texturePhoto` | Local `/images/optimized/` | Yes | Close-up product texture |
| `bagPhoto` | Local `/images/optimized/` | Nice to have | Bag/packaging photo |
| `npk` | Airtable NPK field | If applicable | e.g. "3-2-1" |
| `certifications` | Airtable Certifications | If applicable | OMRI, US Compost Council |
| `bestFor` | Airtable Target Audience | Yes | Bullet list of customer types |
| `howToUse` | Airtable Gardener Usage (simplified) | Yes | 2-3 simple lines |
| `availableSizes` | Airtable Packaging Categories | Yes | What sizes we sell |
| `videoUrl` | YouTube URL if exists | Nice to have | Product demo video |
| `sortOrder` | Numeric (1-28) | Yes | Controls display order on catalog page |
| `productType` | Base/Blend/SingleSource/Concentrate/PottingSoil/Mulch | Yes | For filtering |

### Fields NOT Shown on Product Detail Page
These stay in Airtable for internal use but are **removed from the frontend**:

- Long origin stories (Story field)
- Commercial application rates
- Ingredient ratios / chemical breakdowns
- Safety precautions (move to FAQ or footer)
- Limited warranty text (move to Terms page)
- SEO keyword lists (meta tags only, not visible)
- Manufacturer marketing notes
- Detailed ingredient descriptions

---

## Product Images Inventory (as of March 10, 2026)

All product images live in `client/public/images/optimized/`.

### Texture Photos Available

| Product | Texture Photo File |
|---------|--------------------|
| Simon's Gold | `compost-texture-look.jpg` |
| Mikey's Worm Poop | `worm-castting-product-texture.jpg` |
| Amazonian Dark Earth | `biochar-product-texture-look.jpg` |
| SKMicrosource | `skm-product-texture-look.jpg` |
| SuperBooster | `concentrated-organic-amendment-fertilizer-product-look.jpg` |
| All other amendments | `compost-texture-look.jpg` (shared) |
| All potting soils | `default-potting-soil-texture.jpg` (shared) |
| Mulches | `raw-golden-looking-mulch-commercial-application-look.jpg` / `category-mulch.jpg` |

### Bag Photos Available

| Product | Bag Photo File |
|---------|----------------|
| Simon's Gold | `dansgold9lbs-1.jpg` |
| Mikey's Worm Poop | `mikeys-worm-poop9lbs.jpg` |
| Amazonian Dark Earth | `amazonian1cf.jpg` |
| Tee Top | `tee-top1cf.jpg` |
| Turf Daddy | `turf-daddy1cf.jpg` |
| Artemis | `artemis10lbs-1.jpg` |
| Bacchus | `bacchus1cf.jpg` |
| Seriokai's Secret | `seriokai10lbs.jpg` |
| Pomona | `pomona10lbs.jpg` |
| Stoned Ape's | `stoned-ape10lbs.jpg` |
| Oasis | `oasis-9lb-wb.jpg` |
| Zeolite | `zeolite10lbs.jpg` |
| SKMicrosource | `sk-microsource10lbs.jpg` |
| Desert Defender | `dans-drought10lbs.jpg` |
| SuperBooster | `superbooster-1.jpg` |
| Cultivator's Rose | `cultivators-9lb-wb.jpg` |
| Garden Craft (RGG) | `rgg9lbs.jpg` |
| PlugBoost | `plugboost10lbs.jpg` |
| PropaGrow | `propagrow10lbs.jpg` |
| PlantPal | `plantpal10lbs.jpg` |

### Missing Bag Photos
- Silky Silt Saver
- Clay Cure
- Carbo Charge
- Succulent Success
- Tropic Treasure
- Flower Flourish
- Nature's Blanket (has PDF label only)
- Nature's Blanket Premium (has PDF label only)

---

## Sorting & Display Order

Products are sorted by a numeric `sortOrder` field (1-28). This replaces the old SSW-XXX product ID sorting which mixed letters and numbers.

The sort order groups products by type:
1. **Base products first** (1-2) — these are the heroes
2. **Simple blends** (3-14) — the variety
3. **Single-source ingredients** (15-17) — specialty items
4. **Concentrates** (18-19)
5. **Potting soils** (20-26)
6. **Mulches** (27-28)

---

## Wholesale Pricing Reference (from SSW-Wholesale-Pricing-2026.pdf)

### Amendments (9lb bags, 144/pallet)

| Product | 9lb MSRP | 9lb Wholesale | Pallet (144) | 1CF MSRP | 1CF Wholesale | Tote |
|---------|----------|--------------|--------------|----------|--------------|------|
| Simon's Gold | $12.46 | $4.45 | $640.80 | $12.90 | $6.45 | $149.00 |
| Mikey's Worm Poop | $18.10 | $6.45 | $928.80 | $19.70 | $9.85 | $399.00 |
| Standard blends* | $20.58 | $7.35 | $1,058.40 | $24.90 | $12.45 | $459.00 |

*Standard = Artemis, Oasis, Pomona, Seriokai's, Turf Daddy, Bacchus, Amazonian Dark Earth, Tee Top, Stoned Ape's, Desert Defender, Silky Silt Saver, Clay Cure, Carbo Charge, Zeolite, SKMicrosource

### Concentrates

| Product | 9lb MSRP | 9lb Wholesale | Pallet (144) | 1CF MSRP | 1CF Wholesale | Tote |
|---------|----------|--------------|--------------|----------|--------------|------|
| Cultivator's Rose | $44.95 | $22.48 | $3,236.40 | $155.00 | $77.50 | $4,188.00 |
| SuperBooster | $24.95 | $12.48 | $1,796.40 | $34.95 | $17.48 | $1,290.90 |

### Bagged Soils (1CF, 50/pallet)

| Product | MSRP | Wholesale | Pallet (50) | Tote | Truckload (22) |
|---------|------|-----------|------------|------|---------------|
| Soil Craft | $15.99 | $8.00 | $399.75 | $359.78 | $7,123.55 |
| PlantPal | $10.99 | $5.50 | $274.75 | $247.28 | $4,896.05 |
| PropaGrow | $10.99 | $5.50 | $274.75 | $247.28 | $4,896.05 |
| PlugBoost | $10.99 | $5.50 | $274.75 | $247.28 | $4,896.05 |

Interior potting soils (Succulent Success, Tropic Treasure, Flower Flourish) follow PlantPal pricing.

### Mulch (2CF, 25/pallet)

| Product | MSRP | Wholesale | Pallet (25) | Tote | Truckload (22) |
|---------|------|-----------|------------|------|---------------|
| Nature's Blanket | $8.99 | $4.50 | $112.38 | $112.38 | $2,224.72 |
| Nature's Blanket Premium | $10.99 | $5.50 | $137.50 | $137.50 | $2,722.50 |

### Bulk/Loose

| Product | $/Ton | Truckload (24 tons) |
|---------|-------|-------------------|
| Simon's Gold | $30.00 | $720.00 |
| Mikey's Worm Poop | $175.00 | $4,200.00 |

---

## Hidden Products (awaiting bag photos)

6 products are fully built in the system but hidden from the catalog (`isHidden: true`) until bag photos are ready:
- Silky Silt Saver (SSW-029)
- Clay Cure (SSW-030)
- Carbo Charge (SSW-013)
- Succulent Success (SSW-031)
- Tropic Treasure (SSW-032)
- Flower Flourish (SSW-033)

Email sent to Gabriela requesting photos. Once received, set `isHidden: false` in the JSON and `is_catalog_enabled = true` in Supabase.

---

## Key Technical Notes

### Data Flow
```
Airtable (source of truth)
  → JSON files in client/src/data/json/ (build-time snapshot)
  → Supabase products table (runtime, admin-managed)
  → Public API /api/public/products (serves to frontend)
  → Frontend ProductShowcase component (renders catalog)
```

### Product Categories for Frontend Filtering
The frontend uses audience-based filters, not manufacturer categories:

| Filter Label | Products Included |
|-------------|-------------------|
| All Products | Everything |
| Turf & Grass | Tee Top, Turf Daddy |
| Trees & Shrubs | Artemis, Oasis, Seriokai's, Pomona, Stoned Ape's |
| Vineyard | Bacchus |
| Drought | Desert Defender, Silky Silt Saver, Clay Cure |
| Potting Soil | All 7 potting soils |
| Concentrates | SuperBooster, Cultivator's Rose |
| Mulch | Nature's Blanket, Nature's Blanket Premium |
| Single Ingredients | Amazonian Dark Earth, Zeolite, SKMicrosource |

### Products NOT on the Website (excluded per rules)
These exist in Airtable but are NOT customer-facing:

| Product ID | Name | Reason Excluded |
|-----------|------|-----------------|
| SSW-014 | Mid-Summer Ass Kick Blend | In-development |
| SSW-017 | Mikey's Worm Tea (Liquid) | Not applicable |
| SSW-018 | Mikey's Worm Tea (Granular) | Not applicable |
| SSW-022 | Bacchus Foliar Spray | Not applicable |
| SSW-023 | Cyanobacteria | Not applicable |
| SSW-028 | CannaBag | Not applicable |
| SSW-001 (old) | Dan's Drought | Discarded |
| 5 | Cyclone Dust | Discarded |
| 10A | Raw Dairy Manure | Discarded |
| 10B | Screened Raw Dairy Manure | Discarded |
| M | Randy's Drought Mix | Discarded |
| FSN-001 | FishNure (Fish only) | External (not SSW) |
| FSN-002 | FishNure (Fish + worm castings) | External (not SSW) |
| FSN-002 | FishNure Thermometers | External (not SSW) |

---

## Manufacturer Notes (Internal Context)

### Base Product Production
- **Dairy Compost**: Sourced from dairy farm partnerships. Thermophilic composting process. Screened to consistent texture.
- **Worm Castings**: In-house vermicompost operation. Controlled feeding, gentle harvesting preserves microbe diversity.

### Single-Source Ingredient Notes
- **Amazonian Dark Earth (Biochar)**: Sold UN-CHARGED. Customer must mix with compost to "charge" the biochar before use. This is important for the product page — customers need to know they can't just dump biochar alone.
- **Zeolite**: Bought for water retention properties. Natural mineral.
- **SKMicrosource**: pH 2.5-3.5. Customers buy it to lower soil pH. Sulfur + potassium.

### Mulch Distinction
- **Nature's Blanket**: Wood fiber enhanced with dairy compost only
- **Nature's Blanket Premium**: Wood fiber enhanced with dairy compost AND worm castings (the upgrade)
- Both share SSW-005 in Airtable. Use SSW-005 / SSW-005P to differentiate.
