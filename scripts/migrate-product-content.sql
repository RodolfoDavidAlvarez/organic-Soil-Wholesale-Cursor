-- Migration script to update existing products with hardcoded content
-- This script will update products with rich content from the JSON files

-- Update Dan's Gold / Dairy Compost
UPDATE products SET
  description = 'Rich, aged compost for garden beds, raised beds & soil enrichment. Made from premium aged dairy manure composted for optimal nutrient availability. Feeds soil life with humus and microbes to build long-term soil health.',
  ingredients = 'Organic Dairy Compost',
  target_audience = 'Nursery Operators,Home Gardeners,Organic Farmers,Bad Conditions - Drought-resilient Agriculture,Floriculture,Fruit Growers,Vegetable Cultivators,Cannabis Cultivators,Garden Installation Organization',
  recommended_uses = 'As an organic soil amendment, to mix with existing soil or potting soil',
  usage = 'Mix equal parts Dan''s Gold with existing soil or planting soil when planting. Top dress plants, windrows, and trees with 1"-2" of Dan''s Gold.',
  certifications = 'OMRI,US Compost Council',
  features = 'Rich in Organic Matter: Made from aged dairy manure composted for optimal nutrient availability|Feeds Soil Life: Packed with humus and microbes to build long-term soil health|Ideal for Veggies & Flowers: Great for garden beds, containers, lawns, and tree planting|Fully Composted, No Smell: Screened and aged for odor-free, safe application|Farmer-Approved Quality: Sourced from responsible dairy farms, free of synthetic chemicals',
  seo_keywords = 'dairy compost, aged manure compost, organic compost soil, vegetable garden compost, flower bed soil amendment, compost for lawns, composted cow manure, raised bed soil booster, black gold soil, organic humus, garden compost organic, odorless compost, backyard compost mix, compost for trees, high quality compost',
  marketing_title = 'Dan''s Gold Organic Dairy Compost – Rich, Aged Compost for Garden Beds, Raised Beds & Soil Enrichment',
  marketing_note = 'Aging recreates natural biology and soil beneficial microbials',
  image_url = 'DansGold9lbs (1).jpg',
  texture_photo_url = 'Compost Texture Look.jpg',
  product_video_url = 'https://www.youtube.com/watch?v=WU5U9X1r3k8',
  product_video_title = 'Dan''s Gold Premium Dairy Compost - How It''s Made',
  additional_images = ARRAY['dans-gold-batch-22.png', 'dans-gold-batch-24.png'],
  available_size_options = ARRAY['Pallet of 9 lb bags', 'Pallet of 1CF bags', '2.2 CY Tote', 'Bulk Delivery', 'Bulk Pickup'],
  display_title = 'Organic Dairy Compost',
  product_type = 'DAIRY COMPOST'
WHERE name = 'Dan''s Gold' OR product_type = 'DAIRY COMPOST';

-- Update Mikey's Worm Poop / Worm Castings
UPDATE products SET
  description = 'Mikey''s Worm Poop is an all-natural vermicompost offering a unique and organic solution to soil enhancement. This product has been developed after extensive research and trials, utilizing the very best of worm castings. Suitable for various industries, including agriculture, horticulture, and home gardening, Mikey''s Worm Poop can transform soil health, boost plant vitality, and contribute to sustainable farming practices.',
  ingredients = 'Worm Castings',
  target_audience = 'Nursery Operators,Home Gardeners,Organic Farmers,Bad Conditions - Drought-resilient Agriculture,Floriculture,Fruit Growers,Vegetable Cultivators',
  recommended_uses = 'As an organic soil amendment, to mix with existing soil or potting soil',
  usage = 'As an Organic Amendment - When planting in containers, dig holes and mix equal parts Mikey''s Worm Poop with existing soil or potting mix to backfill the plant. For Garden Beds and Mixing with Existing/Potting Soil - Gently till or fold 2" of Mikey''s Worm Poop into the top 4"-6" of the existing soil before planting or seeding. Top-dress Plants, Rows, and Trees (1/2" to 2") - Evenly spread 1"-2" of Mikey''s Worm Poop on the soil surface around the base of plants, along rows, or at the tree drip line.',
  certifications = 'OMRI,US Compost Council',
  features = 'It boosts soil health, promotes moisture retention, and supports vibrant plant growth. Certified organic, it''s the eco-friendly way to nourish your plants naturally.',
  image_url = 'Mikeys Worm Poop9lbs.jpg',
  texture_photo_url = 'Worm castting product texture.png',
  available_size_options = ARRAY['Pallet of 9 lb bags', 'Pallet of 1CF bags', '2.2 CY Tote', 'Bulk Delivery', 'Bulk Pickup'],
  product_type = 'WORM CASTINGS'
WHERE name = 'Mikey''s Worm Poop' OR product_type = 'WORM CASTINGS';

-- Update Amazonian Dark Earth / Biochar Mineral
UPDATE products SET
  description = 'Enhanced nutrient content biochar soil amendment for expert gardeners seeking superior soil performance.',
  ingredients = 'Biochar',
  target_audience = 'Expert Gardeners',
  recommended_uses = 'To enhance nutrient content in soil, can be mixed with existing soil',
  usage = 'Mix 1 part Amazonian Dark Earth with 4 parts existing soil for new plantings or garden beds. For established plants, top-dress with 1/2" layer and gently work into the soil surface.',
  certifications = 'OMRI,US Compost Council',
  available_size_options = ARRAY['Pallet of 9 lb bags', 'Pallet of 1CF bags', '2.2 CY Tote', 'Bulk Delivery'],
  product_type = 'BIOCHAR MINERAL'
WHERE name = 'Amazonian Dark Earth' OR product_type = 'BIOCHAR MINERAL';

-- Set all products to be catalog enabled by default if not already set
UPDATE products SET 
  is_catalog_enabled = COALESCE(is_catalog_enabled, true),
  catalog_display_order = COALESCE(catalog_display_order, 0)
WHERE is_catalog_enabled IS NULL;

-- Set pay and pickup enabled for products that should appear there
UPDATE products SET 
  is_pay_and_pickup_enabled = true,
  pay_and_pickup_display_order = COALESCE(pay_and_pickup_display_order, 0)
WHERE name IN ('Dan''s Gold', 'Mikey''s Worm Poop', 'Amazonian Dark Earth') 
   OR product_type IN ('DAIRY COMPOST', 'WORM CASTINGS', 'BIOCHAR MINERAL');

-- Add slug support by creating a computed column approach (PostgreSQL doesn't have computed columns, so we'll use a function)
-- First create a function to generate slugs
CREATE OR REPLACE FUNCTION generate_product_slug(product_name text, product_type text DEFAULT NULL)
RETURNS text AS $$
BEGIN
    -- Use product_type if available, otherwise use name
    RETURN lower(
        regexp_replace(
            COALESCE(product_type, product_name),
            '[^a-zA-Z0-9]+',
            '-',
            'g'
        )
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add a slug column to products table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'slug') THEN
        ALTER TABLE products ADD COLUMN slug text;
    END IF;
END $$;

-- Update slugs for existing products
UPDATE products SET slug = generate_product_slug(name, product_type) WHERE slug IS NULL;

-- Create an index on slug for fast lookups
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);

-- Make slug unique where not null
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug_unique ON products(slug) WHERE slug IS NOT NULL;