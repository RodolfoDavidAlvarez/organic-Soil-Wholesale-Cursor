-- Match Garden Refresh / Plus / Big Garden Setup to Gabriela's current letter flyers.
-- Catalog stays disabled so they do not appear on /products. Checkout charges these prices via shared/promoBundles.js.

UPDATE products
SET
  name = 'Garden Refresh',
  display_title = 'Garden Refresh',
  slug = 'garden-refresh',
  category = 'Package',
  product_type = 'Garden bundle',
  price = 9900,
  description = 'Phoenix pickup bundle for one 4x8 raised bed: 5 Nature''s Blanket Premium (10 cu ft), 3 Simon''s Gold included (3 cu ft), 2 Mikey''s Worm Poop (2 cu ft). 15 cu ft / 10 bags. Pickup price $99.',
  image_url = '/images/offers/flyers/garden-refresh.webp',
  size_price_options = '[{"key":"10-Bag Phoenix Pickup Bundle","label":"10-bag Phoenix pickup bundle","price":99,"priceCents":9900,"unit":"per bundle","msrp":"$199","isActive":true}]'::jsonb,
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
  description = 'Phoenix pickup bundle for one 4x8 raised bed: 10 PlantPal (15 cu ft), 3 Nature''s Blanket Premium included (6 cu ft), 3 Mikey''s Worm Poop (3 cu ft). 24 cu ft / 16 bags. Pickup price $149.',
  image_url = '/images/offers/flyers/garden-refresh-plus.webp',
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
  price = 39900,
  description = 'Phoenix pickup bundle: 30 PlantPal (45 cu ft), 4 Simon''s Gold (4 cu ft), 3 Mikey''s Worm Poop (3 cu ft), and 3 Nature''s Blanket Premium (6 cu ft). 54 cu ft / 2.64 cu yd / 40 bags for 2-3 4x8 beds. Pickup price $399.',
  image_url = '/images/offers/flyers/big-garden-setup.webp',
  size_price_options = '[{"key":"40-Bag Phoenix Pickup Bundle","label":"40-bag Phoenix pickup bundle","price":399,"priceCents":39900,"unit":"per bundle","msrp":"$566","isActive":true}]'::jsonb,
  requires_quote = false,
  is_catalog_enabled = false,
  is_pay_and_pickup_enabled = false,
  product_status = 'active'
WHERE id = 4102;
