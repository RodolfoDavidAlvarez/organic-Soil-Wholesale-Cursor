import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../server/.env' });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedInitialProducts() {
  console.log('Seeding initial products...');

  try {
    // Step 1: Insert the three initial products
    const products = [
      {
        name: "Dan's Gold Dairy Compost",
        description: "Premium dairy compost made from aged cow manure. Rich in nutrients and organic matter, perfect for improving soil structure and fertility. OMRI listed for organic use.",
        price: 19.99,
        category: 'Compost',
        imageUrl: '/dans-gold-bag.png',
        texturePhotoUrl: '/dans-gold-texture.png',
        sizeOptions: ['1 cu ft'],
        displayTitle: "Dan's Gold Dairy Compost",
        briefOverview: "Premium dairy compost, 1 cubic foot bag",
        isWholesaleOnly: false,
        allowBulkPickup: true
      },
      {
        name: 'Plant Pal Potting Soil',
        description: 'All-purpose premium potting soil blend. Contains coconut coir, perlite, and organic compost. Ideal for containers, raised beds, and general gardening.',
        price: 29.99,
        category: 'Soil',
        imageUrl: '/plant-pal-bag.png',
        texturePhotoUrl: '/plant-pal-texture.png',
        sizeOptions: ['2 cu ft'],
        displayTitle: 'Plant Pal Potting Soil',
        briefOverview: 'All-purpose potting soil, 2 cubic foot bag',
        isWholesaleOnly: false,
        allowBulkPickup: true
      },
      {
        name: 'Oasis Blend',
        description: 'Specialized soil blend formulated specifically for date palms and palm trees. Enhanced drainage and nutrient profile for optimal palm health in desert climates.',
        price: 24.99,
        category: 'Specialty Soil',
        imageUrl: '/oasis-blend-bag.png',
        texturePhotoUrl: '/oasis-blend-texture.png',
        sizeOptions: ['1 cu ft'],
        displayTitle: 'Oasis Blend for Palms',
        briefOverview: 'Specialized blend for date and palm trees, 1 cubic foot bag',
        isWholesaleOnly: false,
        allowBulkPickup: true
      }
    ];

    const { data: insertedProducts, error: productsError } = await supabase
      .from('products')
      .insert(products)
      .select();

    if (productsError) {
      console.error('Error inserting products:', productsError);
      return;
    }

    console.log('Products inserted successfully:', insertedProducts);

    // Step 2: Get the Phoenix location
    const { data: locations, error: locationError } = await supabase
      .from('locations')
      .select('id')
      .eq('name', 'Phoenix Warehouse')
      .single();

    if (locationError || !locations) {
      console.error('Error finding Phoenix location:', locationError);
      console.log('Creating Phoenix location...');
      
      const { data: newLocation, error: createError } = await supabase
        .from('locations')
        .insert({
          name: 'Phoenix Warehouse',
          address: '123 Main Street',
          city: 'Phoenix',
          state: 'AZ',
          zip: '85001',
          phone: '(602) 555-0123',
          type: 'both',
          pickup_instructions: 'Drive to the back of the building. Look for the "Order Pickup" sign.',
          business_hours: {
            monday: { open: '7:00 AM', close: '5:00 PM' },
            tuesday: { open: '7:00 AM', close: '5:00 PM' },
            wednesday: { open: '7:00 AM', close: '5:00 PM' },
            thursday: { open: '7:00 AM', close: '5:00 PM' },
            friday: { open: '7:00 AM', close: '5:00 PM' },
            saturday: { open: '8:00 AM', close: '2:00 PM' },
            sunday: { closed: true }
          }
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating location:', createError);
        return;
      }
      
      locations.id = newLocation.id;
    }

    const locationId = locations.id;
    console.log('Using location ID:', locationId);

    // Step 3: Add inventory for each product
    if (insertedProducts && insertedProducts.length > 0) {
      const inventoryItems = insertedProducts.map((product, index) => ({
        product_id: product.id,
        location_id: locationId,
        quantity_available: 50,
        quantity_reserved: 0,
        reorder_point: 10,
        reorder_quantity: 50
      }));

      const { data: inventory, error: inventoryError } = await supabase
        .from('inventory')
        .insert(inventoryItems)
        .select();

      if (inventoryError) {
        console.error('Error inserting inventory:', inventoryError);
        return;
      }

      console.log('Inventory added successfully:', inventory);
    }

    console.log('\n✅ Initial products and inventory seeded successfully!');
    console.log('\nProducts added:');
    console.log("- Dan's Gold Dairy Compost (1 cu ft) - 50 units");
    console.log('- Plant Pal Potting Soil (2 cu ft) - 50 units');
    console.log('- Oasis Blend (1 cu ft) - 50 units');
    console.log('\nLocation: Phoenix Warehouse');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the seeding function
seedInitialProducts();