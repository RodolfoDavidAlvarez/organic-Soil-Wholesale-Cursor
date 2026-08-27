-- Freeze Garden Refresh / Plus / Big Garden Setup as already-priced pickup bundles.
-- Catalog stays disabled so they do not appear on /products. Checkout charges these prices via shared/promoBundles.js.

UPDATE products
SET
  name = 'Garden Refresh',
  display_title = 'Garden Refresh',
  slug = 'garden-refresh',
  category = 'Package',
  product_type = 'Garden bundle',
  price = 6900,
  description = 'Phoenix pickup bundle for one 4x8 raised bed: 3 Nature''s Blanket Premium (6 cu ft), 3 Mikey''s Worm Poop (3 cu ft), 1 Simon''s Gold (1 cu ft). 10 cu ft total. Pickup price $69.',
  image_url = '/images/offers/garden-refresh.png',
  size_price_options = '[{"key":"7-Bag Phoenix Pickup Bundle","label":"7-bag Phoenix pickup bundle","price":69,"priceCents":6900,"unit":"per bundle","msrp":"$91","isActive":true}]'::jsonb,
  requires_quote = false,
  is_catalog_enabled = false,
  is_pay_and_pickup_enabled = false,
  product_status = 'active'
WHERE id = 4100;

UPDATE products
SET
  name = 'Garden Refresh Plus',
  display_title = 'Garden Refresh Plus',
  slug = 'garden-refresh-plus',
  category = 'Package',
  product_type = 'Garden bundle',
  price = 14900,
  description = 'Phoenix pickup bundle for one 4x8 raised bed: 10 PlantPal (15 cu ft), 3 Nature''s Blanket Premium included (6 cu ft), 3 Mikey''s Worm Poop (3 cu ft). 24 cu ft total. Pickup price $149.',
  image_url = '/images/offers/garden-refresh-plus.png',
  size_price_options = '[{"key":"16-Bag Phoenix Pickup Bundle","label":"16-bag Phoenix pickup bundle","price":149,"priceCents":14900,"unit":"per bundle","msrp":"$247","isActive":true}]'::jsonb,
  requires_quote = false,
  is_catalog_enabled = false,
  is_pay_and_pickup_enabled = false,
  product_status = 'active'
WHERE id = 4101;

UPDATE products
SET
  name = 'Big Garden Setup',
  display_title = 'Big Garden Setup',
  slug = 'big-garden-setup',
  category = 'Package',
  product_type = 'Garden bundle',
  price = 45900,
  description = 'Phoenix pickup bundle: 1 PlantPal tote (2.2 cu yd) plus 4 Simon''s Gold, 3 Mikey''s Worm Poop, and 3 Nature''s Blanket Premium. 72.4 cu ft / 2.64 cu yd for 2-3 4x8 beds. Use the tote within about one week. Pickup price $459.',
  image_url = '/images/offers/big-garden-setup.png',
  size_price_options = '[{"key":"1 Tote + 10 Bags Phoenix Pickup","label":"1 tote + 10 bags · Phoenix pickup","price":459,"priceCents":45900,"unit":"per bundle","msrp":"$642","isActive":true}]'::jsonb,
  requires_quote = false,
  is_catalog_enabled = false,
  is_pay_and_pickup_enabled = false,
  product_status = 'active'
WHERE id = 4102;
