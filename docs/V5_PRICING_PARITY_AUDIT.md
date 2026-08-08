# V5 pricing parity audit

Date: 2026-08-07  
Scope: Organic Soil Wholesale website only  
Authoritative references:

- `Organic Soil Wholesale/_pricing-v4/official/V5-Organic-Soil-Wholesale-Local-Pricing/`
- `Better Systems AI Business/Mobile SSW Sales Portal/lib/palletPricing.ts`
- `Better Systems AI Business/Mobile SSW Sales Portal/app/(tabs)/order.tsx`

## Confirmed V5 rules

- PlantPal is the current name. “Stage Potting Mix” is a retired compatibility name.
- PlantPal and Soil Craft use 1.5 CF bags and 30 bags per pallet.
- Nature's Blanket Premium uses 2 CF bags and 25 bags per pallet.
- A full pallet is 20% off the bag-by-quantity list price.
- Exactly 22 flatbed spots receives the existing additional 10% product discount.
- Product subtotal, delivery, tax, and discounts remain separate values.

## Conflicts found before implementation

| Surface | Current OSW behavior | V5 requirement |
|---|---|---|
| Product detail pallet rule | 10% off | 20% off |
| PlantPal pallet count | 40 bags | 30 bags |
| PlantPal size label | 1 CF in API | 1.5 CF |
| PlantPal pallet price | API $439.60; UI-derived $395.64 | $263.76, list $329.70 |
| PlantPal bulk pickup | API $36/cu yd | $80/cu yd |
| Nature's Blanket Premium pallet | API $137.50; UI-derived $247.28 | $219.80, list $274.75 |
| Nature's Blanket Premium bulk pickup | API $24/cu yd | $44/cu yd |
| Simon's Gold 9 lb pallet | UI-derived $1,614.82 | $1,435.39, list $1,794.24 |
| Simon's Gold 1 CF pallet | UI-derived $1,120.50 | $996.00, list $1,245.00 |
| Mikey's Worm Poop 9 lb pallet | UI-derived $2,345.76 | $2,085.12, list $2,606.40 |
| Mikey's Worm Poop 1 CF pallet | UI-derived $1,570.50 | $1,396.00, list $1,745.00 |
| Cart/order payload | Client price is accepted by checkout | Server must validate canonical V5 product price |
| Cart summaries | No pallet list/savings fields | List, 20% discount, savings, and subtotal must agree |

The database/API values above are older wholesale values. V5 is explicitly authoritative for this OSW local-sales flow, so the website will normalize the active V5 products at the API boundary and validate checkout prices on the server. SSW World and SSW Mobile code are reference-only and must not be modified by this work.

## Canonical V5 examples

- PlantPal pallet: `30 × $10.99 = $329.70`; 20% savings `$65.94`; sale `$263.76`.
- Nature's Blanket Premium pallet: `25 × $10.99 = $274.75`; savings `$54.95`; sale `$219.80`.
- Simon's Gold 9 lb pallet: `144 × $12.46 = $1,794.24`; savings `$358.85`; sale `$1,435.39` after cent rounding.
- Mikey's Worm Poop 1 CF pallet: `50 × $34.90 = $1,745.00`; savings `$349.00`; sale `$1,396.00`.

## Required regression coverage

- Single-unit and full-pallet boundaries.
- Mixed carts and exact 22-flatbed-spot discount.
- Currency rounding at the line and subtotal level.
- Delivery and tax separated from product discounts.
- PlantPal and retired Stage Potting Mix name compatibility.
- Mobile and desktop display parity.
- Checkout rejects or replaces client-tampered pricing with the canonical server price.
