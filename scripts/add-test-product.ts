import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addTestProduct() {
  console.log('🚀 Adding test product to database...\n');

  // Use only essential fields that should exist in the database
  const testProduct: Record<string, unknown> = {
    name: 'Premium Organic Potting Soil',
    display_title: 'Premium Organic Potting Soil',
    description: 'A premium blend of organic materials designed for optimal plant growth. Rich in nutrients and perfect for container gardening, houseplants, and seed starting.',
    category: 'Potting Soil',
    price: 2499, // $24.99 in cents
    stock_quantity: 150,
    product_status: 'active',
    is_catalog_enabled: true,
    catalog_display_order: 1,
    is_pay_and_pickup_enabled: true,
    pay_and_pickup_display_order: 1,
    pay_and_pickup_badge: 'Phoenix Pickup • 24hr Turnaround',
    pay_and_pickup_description: 'Available for immediate pickup at our Phoenix location. Order online and pick up within 24 hours.',
    image_url: '/images/products/potting-soil.jpg',
    texture_photo_url: '/images/products/potting-soil-texture.jpg',
    pay_and_pickup_hero_image: '/images/products/potting-soil-hero.jpg',
    additional_images: [
      '/images/products/potting-soil-1.jpg',
      '/images/products/potting-soil-2.jpg'
    ],
    features: 'Organic Certified|Rich in Nutrients|Drainage Optimized|pH Balanced|No Synthetic Additives',
    usage: 'Fill containers 2/3 full with soil. Plant seeds or transplants at recommended depth. Water thoroughly after planting.',
    story: 'Crafted from locally sourced organic compost and premium ingredients, our potting soil has been trusted by gardeners for over a decade.',
    ingredients: 'Composted Forest Products|Peat Moss|Perlite|Vermiculite|Organic Fertilizer',
    target_audience: 'Home Gardeners|Professional Growers|Nurseries|Landscapers',
    recommended_uses: 'Container Gardening|Seed Starting|Houseplants|Vegetable Gardens|Flower Beds',
    marketing_title: 'The Foundation of Healthy Plants',
    marketing_note: 'Start your plants right with our premium organic potting soil blend.',
    seo_keywords: 'organic potting soil, premium soil, container gardening, plant soil, organic gardening',
    available_size_options: ['1 cu ft', '2 cu ft', '3 cu ft']
  };

  try {
    console.log('📦 Inserting product...');
    const { data: product, error: insertError } = await supabase
      .from('products')
      .insert(testProduct)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error inserting product:', insertError);
      throw insertError;
    }

    console.log('✅ Product created successfully!');
    console.log(`   ID: ${product.id}`);
    console.log(`   Name: ${product.name}`);
    console.log(`   Category: ${product.category}`);
    console.log(`   Catalog Enabled: ${product.is_catalog_enabled}`);
    console.log(`   Pay & Pickup Enabled: ${product.is_pay_and_pickup_enabled}`);
    console.log('\n📋 Next steps:');
    console.log('   1. Check /admin/products to see it in the admin panel');
    console.log('   2. Check /products to see it in the public catalog');
    console.log('   3. Check /pay-and-pickup to see it in the pickup menu');
    console.log(`   4. Edit it at /admin/products/${product.id}`);

    return product;
  } catch (error) {
    console.error('❌ Failed to add test product:', error);
    throw error;
  }
}

// Run the script
addTestProduct()
  .then(() => {
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

