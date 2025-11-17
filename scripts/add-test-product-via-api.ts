/**
 * Add test product via API endpoint
 * This ensures all field mappings are handled correctly
 */

async function addTestProductViaAPI() {
  console.log('🚀 Adding test product via API...\n');

  // First, we need an admin token - let's use a simple approach
  // In production, you'd get this from the login endpoint
  const testProduct = {
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
    product_video_url: null,
    product_video_title: null,
    available_size_options: ['1 cu ft', '2 cu ft', '3 cu ft'],
    size_price_options: [
      {
        key: '1-cu-ft',
        label: '1 cu ft',
        price_cents: 2499,
        price: 24.99,
        is_active: true,
        display_order: 0
      },
      {
        key: '2-cu-ft',
        label: '2 cu ft',
        price_cents: 4499,
        price: 44.99,
        is_active: true,
        display_order: 1
      },
      {
        key: '3-cu-ft',
        label: '3 cu ft',
        price_cents: 6499,
        price: 64.99,
        is_active: true,
        display_order: 2
      }
    ],
    inventory_updates: [
      {
        size_option: '1 cu ft',
        quantity_available: 50
      },
      {
        size_option: '2 cu ft',
        quantity_available: 75
      },
      {
        size_option: '3 cu ft',
        quantity_available: 25
      }
    ]
  };

  try {
    // Get admin token from localStorage or use a test token
    // For now, let's try without auth first to see the error
    console.log('📡 Calling API endpoint...');
    
    const response = await fetch('http://localhost:5000/api/admin/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: In a real scenario, you'd need to authenticate first
        // For testing, you might need to temporarily disable auth or use a test token
      },
      body: JSON.stringify(testProduct)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', response.status, errorText);
      throw new Error(`API returned ${response.status}: ${errorText}`);
    }

    const product = await response.json();
    
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
addTestProductViaAPI()
  .then(() => {
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

