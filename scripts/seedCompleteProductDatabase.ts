import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: './server/.env' });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// CSV pricing data structure
interface CSVProduct {
  title: string;
  sku: string;
  price: number;
  keywords: string;
  b1: string;
  b2: string;
  b3: string;
  b4: string;
  b5: string;
  pictureToAdd: string;
  description?: string;
}

// JSON product data structure
interface JSONProduct {
  "Product name": string;
  "Brand name": string;
  "Ingredients": string;
  "Target audience": string;
  "Recommended Uses": string;
  "Gardener Usage Instructions": string;
  "Size Categories": string;
  "Certifications": string;
  "Product Category": string;
  "Brief Overview": string;
  "Key Features/benefits": string;
  "Website URL": string;
  "9lb Bag Photo URL": string;
  "Product Texture Photo URL": string;
}

// Database product structure
interface DatabaseProduct {
  name: string;
  description: string;
  category: string;
  price: number;
  stock_quantity: number;
  image_url?: string;
  texture_photo_url?: string;
  ingredients?: string;
  target_audience?: string;
  recommended_uses?: string;
  story?: string;
  usage?: string;
  certifications?: string;
  features?: string;
  size_options?: string;
  product_type?: string;
  display_title?: string;
  marketing_title?: string;
  seo_keywords?: string;
  marketing_note?: string;
  is_wholesale_only: boolean;
  additional_images?: string[];
  allow_bulk_pickup: boolean;
  available_size_options?: string[];
  min_order_quantity: number;
  max_order_quantity?: number;
  is_price_negotiable: boolean;
  requires_quote: boolean;
  is_pay_and_pickup_enabled: boolean;
  pay_and_pickup_display_order: number;
  pay_and_pickup_badge?: string;
  pay_and_pickup_description?: string;
  pay_and_pickup_hero_image?: string;
}

// Parse CSV data (simplified parser for the specific format)
function parseCSVData(): CSVProduct[] {
  const csvPath = path.join(__dirname, '../SSW product info to use as reference as of july 18,2025.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n');
  const products: CSVProduct[] = [];

  // Skip header and process data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const columns = line.split(',');
    if (columns.length >= 12) {
      products.push({
        title: columns[0] || '',
        sku: columns[1] || '',
        price: parseFloat(columns[2]) || 0,
        keywords: columns[4] || '',
        b1: columns[5] || '',
        b2: columns[6] || '',
        b3: columns[7] || '',
        b4: columns[8] || '',
        b5: columns[9] || '',
        pictureToAdd: columns[12] || '',
        description: columns[3] || columns[0] // Use title as fallback description
      });
    }
  }

  return products;
}

// Load JSON product data
function loadJSONProducts(): JSONProduct[] {
  const productTypes = [
    'Potting Soil Products.json',
    'Amendment Products.json', 
    'Mulch Products.json',
    'Concentrated Amendment Products.json'
  ];

  const allProducts: JSONProduct[] = [];

  productTypes.forEach(filename => {
    try {
      const filePath = path.join(__dirname, '../client/src/data/json', filename);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const products = JSON.parse(fileContent) as JSONProduct[];
      allProducts.push(...products);
    } catch (error) {
      console.warn(`Could not load ${filename}:`, error);
    }
  });

  return allProducts;
}

// Merge CSV and JSON data to create complete product entries
function mergeProductData(csvProducts: CSVProduct[], jsonProducts: JSONProduct[]): DatabaseProduct[] {
  const products: DatabaseProduct[] = [];

  // Process CSV products as primary source
  csvProducts.forEach((csvProduct, index) => {
    // Find matching JSON product by name similarity
    const matchingJSON = jsonProducts.find(json => 
      json["Product name"].toLowerCase().includes(csvProduct.title.split(' ')[0].toLowerCase()) ||
      csvProduct.title.toLowerCase().includes(json["Product name"].toLowerCase())
    );

    // Determine product category
    let category = 'Soil Amendment';
    if (csvProduct.title.toLowerCase().includes('potting') || csvProduct.title.toLowerCase().includes('mix')) {
      category = 'Potting Soil';
    } else if (csvProduct.title.toLowerCase().includes('mulch')) {
      category = 'Mulch';
    } else if (csvProduct.title.toLowerCase().includes('compost')) {
      category = 'Compost';
    }

    // Build comprehensive description
    const description = [
      csvProduct.description || csvProduct.title,
      csvProduct.b1,
      csvProduct.b2,
      csvProduct.b3,
      csvProduct.b4,
      csvProduct.b5
    ].filter(Boolean).join(' ');

    // Determine size options based on product type
    const sizeOptions = ['9lb Bag', '25lb Bag', '1 CF Bag'];
    if (category === 'Potting Soil') {
      sizeOptions.push('2 CF Bag', '1.5 CF Bag');
    }
    if (!csvProduct.title.includes('Concentrated')) {
      sizeOptions.push('Bulk (50lb)', 'Bulk Pickup');
    }

    const product: DatabaseProduct = {
      name: csvProduct.title,
      description: description,
      category: category,
      price: Math.round(csvProduct.price * 100), // Convert to cents for database
      stock_quantity: 100, // Default stock
      image_url: csvProduct.pictureToAdd || `${csvProduct.sku.toLowerCase()}-bag.jpg`,
      texture_photo_url: matchingJSON?.["Product Texture Photo URL"] || `${csvProduct.sku.toLowerCase()}-texture.jpg`,
      ingredients: matchingJSON?.["Ingredients"],
      target_audience: matchingJSON?.["Target audience"],
      recommended_uses: matchingJSON?.["Recommended Uses"],
      story: description,
      usage: matchingJSON?.["Gardener Usage Instructions"],
      certifications: matchingJSON?.["Certifications"],
      features: matchingJSON?.["Key Features/benefits"],
      size_options: sizeOptions.join(','),
      product_type: category,
      display_title: csvProduct.title,
      marketing_title: csvProduct.description || csvProduct.title,
      seo_keywords: csvProduct.keywords,
      marketing_note: matchingJSON?.["Brief Overview"],
      is_wholesale_only: false,
      additional_images: [],
      allow_bulk_pickup: !csvProduct.title.includes('Concentrated'),
      available_size_options: sizeOptions,
      min_order_quantity: 1,
      max_order_quantity: csvProduct.title.includes('Concentrated') ? 20 : 100,
      is_price_negotiable: false,
      requires_quote: false,
      is_pay_and_pickup_enabled: false,
      pay_and_pickup_display_order: index,
      pay_and_pickup_badge: undefined,
      pay_and_pickup_description: matchingJSON?.["Brief Overview"] || description,
      pay_and_pickup_hero_image: csvProduct.pictureToAdd || matchingJSON?.["Product Texture Photo URL"]
    };

    products.push(product);
  });

  // Add JSON-only products that weren't matched
  jsonProducts.forEach(jsonProduct => {
    const alreadyExists = products.some(p => 
      p.name.toLowerCase().includes(jsonProduct["Product name"].toLowerCase())
    );

    if (!alreadyExists) {
      const product: DatabaseProduct = {
        name: jsonProduct["Product name"],
        description: jsonProduct["Brief Overview"] || jsonProduct["Key Features/benefits"] || jsonProduct["Product name"],
        category: jsonProduct["Product Category"] || 'Potting Soil',
        price: 2500, // Default $25.00 in cents
        stock_quantity: 100,
        image_url: jsonProduct["9lb Bag Photo URL"] || `${jsonProduct["Product name"].toLowerCase().replace(/\s+/g, '-')}-bag.jpg`,
        texture_photo_url: jsonProduct["Product Texture Photo URL"],
        ingredients: jsonProduct["Ingredients"],
        target_audience: jsonProduct["Target audience"],
        recommended_uses: jsonProduct["Recommended Uses"],
        story: jsonProduct["Brief Overview"],
        usage: jsonProduct["Gardener Usage Instructions"],
        certifications: jsonProduct["Certifications"],
        features: jsonProduct["Key Features/benefits"],
        size_options: jsonProduct["Size Categories"]?.replace(/,/g, ',') || '9lb Bag,25lb Bag,1 CF Bag',
        product_type: jsonProduct["Product Category"],
        display_title: jsonProduct["Product name"],
        marketing_title: jsonProduct["Brand name"],
        seo_keywords: jsonProduct["Product name"].toLowerCase().replace(/\s+/g, ', '),
        marketing_note: jsonProduct["Brief Overview"],
        is_wholesale_only: false,
        additional_images: [],
        allow_bulk_pickup: true,
        available_size_options: (jsonProduct["Size Categories"] || '9lb Bag,25lb Bag,1 CF Bag').split(',').map(s => s.trim()),
        min_order_quantity: 1,
        max_order_quantity: 50,
        is_price_negotiable: false,
        requires_quote: false,
        is_pay_and_pickup_enabled: false,
        pay_and_pickup_display_order: products.length,
        pay_and_pickup_badge: undefined,
        pay_and_pickup_description: jsonProduct["Brief Overview"],
        pay_and_pickup_hero_image: jsonProduct["Product Texture Photo URL"] || jsonProduct["9lb Bag Photo URL"]
      };

      products.push(product);
    }
  });

  return products;
}

// Create inventory entries for each product size
async function createInventoryEntries(products: any[], locationId: number) {
  const inventoryEntries = [];

  for (const product of products) {
    const sizeOptions = product.available_size_options || ['9lb Bag', '25lb Bag', '1 CF Bag'];
    
    for (const sizeOption of sizeOptions) {
      // Calculate price based on size
      let price = product.price / 100; // Convert back to dollars
      
      // Adjust price based on size
      if (sizeOption.includes('25lb') || sizeOption.includes('2 CF')) {
        price = price * 1.8;
      } else if (sizeOption.includes('50lb') || sizeOption.includes('Bulk')) {
        price = price * 3.2;
      } else if (sizeOption.includes('1.5 CF')) {
        price = price * 1.5;
      }

      inventoryEntries.push({
        product_id: product.id,
        location_id: locationId,
        size_option: sizeOption,
        quantity_available: Math.floor(Math.random() * 50) + 20, // Random stock 20-70
        quantity_reserved: 0,
        price: Math.round(price * 100) / 100, // Round to 2 decimal places
        unit: sizeOption.includes('Bag') ? 'bag' : sizeOption.includes('CF') ? 'cubic_foot' : 'bulk',
        last_updated: new Date().toISOString()
      });
    }
  }

  return inventoryEntries;
}

async function seedCompleteProductDatabase() {
  console.log('🚀 Starting complete product database seeding...');

  try {
    // Clear existing data
    console.log('🧹 Clearing existing inventory and products...');
    await supabase.from('inventory').delete().neq('id', 0);
    await supabase.from('products').delete().neq('id', 0);

    // Load data sources
    console.log('📊 Loading CSV pricing data...');
    const csvProducts = parseCSVData();
    console.log(`Found ${csvProducts.length} products in CSV`);

    console.log('📋 Loading JSON product data...');
    const jsonProducts = loadJSONProducts();
    console.log(`Found ${jsonProducts.length} products in JSON files`);

    // Merge data
    console.log('🔄 Merging product data...');
    const mergedProducts = mergeProductData(csvProducts, jsonProducts);
    console.log(`Created ${mergedProducts.length} complete product records`);

    // Insert products
    console.log('💾 Inserting products into database...');
    const { data: insertedProducts, error: productsError } = await supabase
      .from('products')
      .insert(mergedProducts)
      .select();

    if (productsError) {
      console.error('❌ Error inserting products:', productsError);
      return;
    }

    console.log(`✅ Successfully inserted ${insertedProducts?.length} products`);

    // Get Phoenix location
    console.log('📍 Getting Phoenix location...');
    const { data: location, error: locationError } = await supabase
      .from('locations')
      .select('id')
      .eq('name', 'Phoenix Warehouse')
      .single();

    if (locationError || !location) {
      console.error('❌ Error finding Phoenix location:', locationError);
      return;
    }

    const locationId = location.id;

    // Create inventory entries
    console.log('📦 Creating inventory entries...');
    const inventoryEntries = await createInventoryEntries(insertedProducts!, locationId);
    
    const { data: inventory, error: inventoryError } = await supabase
      .from('inventory')
      .insert(inventoryEntries)
      .select();

    if (inventoryError) {
      console.error('❌ Error inserting inventory:', inventoryError);
      return;
    }

    console.log(`✅ Successfully created ${inventory?.length} inventory entries`);

    // Summary
    console.log('\n🎉 Complete Product Database Seeding Successful!');
    console.log('=' .repeat(50));
    console.log(`📦 Products: ${insertedProducts?.length}`);
    console.log(`📋 Inventory Items: ${inventory?.length}`);
    console.log(`🏭 Location: Phoenix Warehouse (ID: ${locationId})`);
    console.log('=' .repeat(50));

    // List some example products
    if (insertedProducts && insertedProducts.length > 0) {
      console.log('\n📋 Sample Products Added:');
      insertedProducts.slice(0, 5).forEach((product, index) => {
        console.log(`${index + 1}. ${product.name} - $${(product.price / 100).toFixed(2)}`);
      });
      if (insertedProducts.length > 5) {
        console.log(`... and ${insertedProducts.length - 5} more products`);
      }
    }

  } catch (error) {
    console.error('💥 Unexpected error during seeding:', error);
  }
}

// Run the seeding function
seedCompleteProductDatabase();

export { seedCompleteProductDatabase };
