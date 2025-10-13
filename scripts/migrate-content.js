#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('Starting product content migration...');

  try {
    // First, let's see what products exist
    const { data: existingProducts, error: listError } = await supabase
      .from('products')
      .select('id, name, product_type');
    
    if (listError) {
      console.error('Error listing products:', listError);
      return;
    }

    console.log('Existing products:', existingProducts);

    // Add slug column if it doesn't exist
    console.log('Adding slug column...');
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$ 
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'slug') THEN
                ALTER TABLE products ADD COLUMN slug text;
            END IF;
        END $$;
      `
    });

    if (alterError) {
      console.log('Note: Could not add slug column via RPC, continuing anyway:', alterError.message);
    }

    // Update Dan's Gold / Dairy Compost
    console.log('Updating Dan\'s Gold...');
    const { error: dansGoldError } = await supabase
      .from('products')
      .update({
        description: 'Rich, aged compost for garden beds, raised beds & soil enrichment. Made from premium aged dairy manure composted for optimal nutrient availability. Feeds soil life with humus and microbes to build long-term soil health.',
        ingredients: 'Organic Dairy Compost',
        target_audience: 'Nursery Operators,Home Gardeners,Organic Farmers,Bad Conditions - Drought-resilient Agriculture,Floriculture,Fruit Growers,Vegetable Cultivators,Cannabis Cultivators,Garden Installation Organization',
        recommended_uses: 'As an organic soil amendment, to mix with existing soil or potting soil',
        usage: 'Mix equal parts Dan\'s Gold with existing soil or planting soil when planting. Top dress plants, windrows, and trees with 1"-2" of Dan\'s Gold.',
        certifications: 'OMRI,US Compost Council',
        features: 'Rich in Organic Matter: Made from aged dairy manure composted for optimal nutrient availability|Feeds Soil Life: Packed with humus and microbes to build long-term soil health|Ideal for Veggies & Flowers: Great for garden beds, containers, lawns, and tree planting|Fully Composted, No Smell: Screened and aged for odor-free, safe application|Farmer-Approved Quality: Sourced from responsible dairy farms, free of synthetic chemicals',
        seo_keywords: 'dairy compost, aged manure compost, organic compost soil, vegetable garden compost, flower bed soil amendment, compost for lawns, composted cow manure, raised bed soil booster, black gold soil, organic humus, garden compost organic, odorless compost, backyard compost mix, compost for trees, high quality compost',
        marketing_title: 'Dan\'s Gold Organic Dairy Compost – Rich, Aged Compost for Garden Beds, Raised Beds & Soil Enrichment',
        marketing_note: 'Aging recreates natural biology and soil beneficial microbials',
        image_url: 'DansGold9lbs (1).jpg',
        texture_photo_url: 'Compost Texture Look.jpg',
        product_video_url: 'https://www.youtube.com/watch?v=WU5U9X1r3k8',
        product_video_title: 'Dan\'s Gold Premium Dairy Compost - How It\'s Made',
        additional_images: ['dans-gold-batch-22.png', 'dans-gold-batch-24.png'],
        available_size_options: ['Pallet of 9 lb bags', 'Pallet of 1CF bags', '2.2 CY Tote', 'Bulk Delivery', 'Bulk Pickup'],
        display_title: 'Organic Dairy Compost',
        product_type: 'DAIRY COMPOST',
        is_catalog_enabled: true,
        is_pay_and_pickup_enabled: true,
        pay_and_pickup_display_order: 1,
        catalog_display_order: 1
      })
      .or('name.eq.Dan\'s Gold,product_type.eq.DAIRY COMPOST');

    if (dansGoldError) {
      console.error('Error updating Dan\'s Gold:', dansGoldError);
    } else {
      console.log('Dan\'s Gold updated successfully');
    }

    // Update Mikey's Worm Poop
    console.log('Updating Mikey\'s Worm Poop...');
    const { error: wormPoopError } = await supabase
      .from('products')
      .update({
        description: 'Mikey\'s Worm Poop is an all-natural vermicompost offering a unique and organic solution to soil enhancement. This product has been developed after extensive research and trials, utilizing the very best of worm castings. Suitable for various industries, including agriculture, horticulture, and home gardening, Mikey\'s Worm Poop can transform soil health, boost plant vitality, and contribute to sustainable farming practices.',
        ingredients: 'Worm Castings',
        target_audience: 'Nursery Operators,Home Gardeners,Organic Farmers,Bad Conditions - Drought-resilient Agriculture,Floriculture,Fruit Growers,Vegetable Cultivators',
        recommended_uses: 'As an organic soil amendment, to mix with existing soil or potting soil',
        usage: 'As an Organic Amendment - When planting in containers, dig holes and mix equal parts Mikey\'s Worm Poop with existing soil or potting mix to backfill the plant. For Garden Beds and Mixing with Existing/Potting Soil - Gently till or fold 2" of Mikey\'s Worm Poop into the top 4"-6" of the existing soil before planting or seeding. Top-dress Plants, Rows, and Trees (1/2" to 2") - Evenly spread 1"-2" of Mikey\'s Worm Poop on the soil surface around the base of plants, along rows, or at the tree drip line.',
        certifications: 'OMRI,US Compost Council',
        features: 'It boosts soil health, promotes moisture retention, and supports vibrant plant growth. Certified organic, it\'s the eco-friendly way to nourish your plants naturally.',
        image_url: 'Mikeys Worm Poop9lbs.jpg',
        texture_photo_url: 'Worm castting product texture.png',
        available_size_options: ['Pallet of 9 lb bags', 'Pallet of 1CF bags', '2.2 CY Tote', 'Bulk Delivery', 'Bulk Pickup'],
        product_type: 'WORM CASTINGS',
        is_catalog_enabled: true,
        is_pay_and_pickup_enabled: true,
        pay_and_pickup_display_order: 2,
        catalog_display_order: 2
      })
      .or('name.eq.Mikey\'s Worm Poop,product_type.eq.WORM CASTINGS');

    if (wormPoopError) {
      console.error('Error updating Mikey\'s Worm Poop:', wormPoopError);
    } else {
      console.log('Mikey\'s Worm Poop updated successfully');
    }

    // Update Amazonian Dark Earth
    console.log('Updating Amazonian Dark Earth...');
    const { error: biocharError } = await supabase
      .from('products')
      .update({
        description: 'Enhanced nutrient content biochar soil amendment for expert gardeners seeking superior soil performance.',
        ingredients: 'Biochar',
        target_audience: 'Expert Gardeners',
        recommended_uses: 'To enhance nutrient content in soil, can be mixed with existing soil',
        usage: 'Mix 1 part Amazonian Dark Earth with 4 parts existing soil for new plantings or garden beds. For established plants, top-dress with 1/2" layer and gently work into the soil surface.',
        certifications: 'OMRI,US Compost Council',
        available_size_options: ['Pallet of 9 lb bags', 'Pallet of 1CF bags', '2.2 CY Tote', 'Bulk Delivery'],
        product_type: 'BIOCHAR MINERAL',
        is_catalog_enabled: true,
        is_pay_and_pickup_enabled: true,
        pay_and_pickup_display_order: 3,
        catalog_display_order: 3
      })
      .or('name.eq.Amazonian Dark Earth,product_type.eq.BIOCHAR MINERAL');

    if (biocharError) {
      console.error('Error updating Amazonian Dark Earth:', biocharError);
    } else {
      console.log('Amazonian Dark Earth updated successfully');
    }

    // Update all products to have slugs
    console.log('Generating slugs for all products...');
    const { data: allProducts, error: getAllError } = await supabase
      .from('products')
      .select('id, name, product_type');

    if (getAllError) {
      console.error('Error getting all products:', getAllError);
    } else {
      for (const product of allProducts) {
        const slug = (product.product_type || product.name)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        
        const { error: updateSlugError } = await supabase
          .from('products')
          .update({ slug })
          .eq('id', product.id);

        if (updateSlugError) {
          console.error(`Error updating slug for product ${product.id}:`, updateSlugError);
        } else {
          console.log(`Updated slug for ${product.name}: ${slug}`);
        }
      }
    }

    console.log('Migration completed successfully!');

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();