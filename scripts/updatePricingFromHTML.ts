import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import * as cheerio from 'cheerio';
import { pricingService } from '../server/services/pricingService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: './server/.env' });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ParsedPricingData {
  productName: string;
  msrp_9lb?: number;
  case_9lb?: number;
  distributor_9lb?: number;
  pallet_9lb?: number;
  distributor_1cf?: number;
  pallet_1cf?: number;
  tote_price?: number;
  truckload_totes?: number;
  // Mulch specific
  local_retail?: number;
  flash_sale?: number;
  distributor_mulch?: number;
  pallet_mulch?: number;
}

function parseHTMLPricing(htmlPath: string): ParsedPricingData[] {
  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
  const $ = cheerio.load(htmlContent);
  const products: ParsedPricingData[] = [];

  // Parse Soil Amendments table
  const soilAmendmentsTable = $('table').first();
  soilAmendmentsTable.find('tbody tr').each((index, row) => {
    const cells = $(row).find('td');
    if (cells.length >= 10) {
      const productName = $(cells[0]).text().trim();
      const product: ParsedPricingData = {
        productName,
        msrp_9lb: parseFloat($(cells[1]).text().replace('$', '').replace(',', '')),
        case_9lb: parseFloat($(cells[3]).text().replace('$', '').replace(',', '')),
        distributor_9lb: parseFloat($(cells[4]).text().replace('$', '').replace(',', '')),
        pallet_9lb: parseFloat($(cells[5]).text().replace('$', '').replace(',', '')),
        distributor_1cf: parseFloat($(cells[6]).text().replace('$', '').replace(',', '')),
        pallet_1cf: parseFloat($(cells[7]).text().replace('$', '').replace(',', '')),
        tote_price: parseFloat($(cells[8]).text().replace('$', '').replace(',', '')),
        truckload_totes: parseFloat($(cells[9]).text().replace('$', '').replace(',', ''))
      };
      products.push(product);
    }
  });

  // Parse Mulch table
  const mulchTable = $('table').last();
  mulchTable.find('tbody tr').each((index, row) => {
    const cells = $(row).find('td');
    if (cells.length >= 6) {
      const productName = $(cells[0]).text().trim();
      const product: ParsedPricingData = {
        productName,
        local_retail: parseFloat($(cells[2]).text().replace('$', '').replace(',', '')),
        flash_sale: parseFloat($(cells[3]).text().replace('$', '').replace(',', '')),
        distributor_mulch: parseFloat($(cells[4]).text().replace('$', '').replace(',', '')),
        pallet_mulch: parseFloat($(cells[5]).text().replace('$', '').replace(',', ''))
      };
      products.push(product);
    }
  });

  return products;
}

function mapProductNameToDatabase(htmlName: string): string | null {
  const nameMapping: Record<string, string> = {
    'Amazonian Dark Earth Biochar': 'Amazonian Dark Earth',
    'Artemis Root Boost Blend': 'Artemis RootBoost',
    "Dan's Gold": "Dan's Gold Dairy Compost",
    'Oasis Blend Palm & Date Tree': 'Oasis Blend',
    "Mikey's Worm Poop": "Mikey's Worm Poop",
    'Pomona Blend Pome & Stonefruit': 'Pomona Blend',
    "Seriokai's Secret Avocado & Citrus": "Seriokai's Secret Blend",
    'Turf and Grass': 'Turf Daddy',
    'Vineyard Blend': 'Bacchus',
    "Nature's Blanket (2 Cubic Feet)": "Nature's Blanket",
    "Nature's Blanket Premium": "Nature's Blanket Premium"
  };

  return nameMapping[htmlName] || null;
}

function createPricingTiersFromParsedData(product: ParsedPricingData, productId: number): any[] {
  const tiers: any[] = [];

  // For soil amendments
  if (product.msrp_9lb) {
    // 9lb Bag pricing tiers
    tiers.push({
      product_id: productId,
      size_option: '9lb Bag',
      tier_name: 'retail',
      min_quantity: 1,
      max_quantity: 3,
      fixed_price: product.msrp_9lb,
      customer_type: 'regular',
      is_active: true
    });

    if (product.case_9lb) {
      tiers.push({
        product_id: productId,
        size_option: '9lb Bag',
        tier_name: 'case',
        min_quantity: 4,
        max_quantity: 143,
        fixed_price: product.case_9lb / 4, // Price per unit in case
        customer_type: 'regular',
        is_active: true
      });
    }

    if (product.distributor_9lb) {
      tiers.push({
        product_id: productId,
        size_option: '9lb Bag',
        tier_name: 'distributor',
        min_quantity: 1,
        max_quantity: null,
        fixed_price: product.distributor_9lb,
        customer_type: 'wholesale',
        is_active: true
      });
    }

    if (product.pallet_9lb) {
      tiers.push({
        product_id: productId,
        size_option: '9lb Bag',
        tier_name: 'pallet',
        min_quantity: 144,
        max_quantity: null,
        fixed_price: product.pallet_9lb / 144, // Price per unit in pallet
        customer_type: 'regular',
        is_active: true
      });
    }
  }

  // 1 CF Bag pricing
  if (product.distributor_1cf) {
    tiers.push({
      product_id: productId,
      size_option: '1 CF Bag',
      tier_name: 'distributor',
      min_quantity: 1,
      max_quantity: null,
      fixed_price: product.distributor_1cf,
      customer_type: 'wholesale',
      is_active: true
    });
  }

  if (product.pallet_1cf) {
    tiers.push({
      product_id: productId,
      size_option: '1 CF Bag',
      tier_name: 'pallet',
      min_quantity: 50,
      max_quantity: null,
      fixed_price: product.pallet_1cf / 50, // Price per unit in pallet
      customer_type: 'regular',
      is_active: true
    });
  }

  // Tote pricing
  if (product.tote_price) {
    tiers.push({
      product_id: productId,
      size_option: '2.2 CY Tote',
      tier_name: 'retail',
      min_quantity: 1,
      max_quantity: 21,
      fixed_price: product.tote_price,
      customer_type: 'regular',
      is_active: true
    });
  }

  if (product.truckload_totes) {
    tiers.push({
      product_id: productId,
      size_option: '2.2 CY Tote',
      tier_name: 'truckload',
      min_quantity: 22,
      max_quantity: null,
      fixed_price: product.truckload_totes / 22, // Price per tote in truckload
      customer_type: 'regular',
      is_active: true
    });
  }

  // For mulch products
  if (product.local_retail) {
    tiers.push({
      product_id: productId,
      size_option: '2 CF Bag',
      tier_name: 'retail',
      min_quantity: 1,
      max_quantity: 24,
      fixed_price: product.local_retail,
      customer_type: 'regular',
      is_active: true
    });
  }

  if (product.flash_sale) {
    tiers.push({
      product_id: productId,
      size_option: '2 CF Bag',
      tier_name: 'flash_sale',
      min_quantity: 1,
      max_quantity: 24,
      fixed_price: product.flash_sale,
      customer_type: 'member',
      is_active: true
    });
  }

  if (product.distributor_mulch) {
    tiers.push({
      product_id: productId,
      size_option: '2 CF Bag',
      tier_name: 'distributor',
      min_quantity: 1,
      max_quantity: null,
      fixed_price: product.distributor_mulch,
      customer_type: 'wholesale',
      is_active: true
    });
  }

  if (product.pallet_mulch) {
    tiers.push({
      product_id: productId,
      size_option: '2 CF Bag',
      tier_name: 'pallet',
      min_quantity: 25,
      max_quantity: null,
      fixed_price: product.pallet_mulch / 25, // Price per unit in pallet
      customer_type: 'regular',
      is_active: true
    });
  }

  return tiers;
}

async function updatePricingFromHTML() {
  console.log('🚀 Starting pricing update from HTML...');

  try {
    // Parse HTML pricing data
    const htmlPath = '/Users/rodolfoalvarez/Downloads/updated-pricing-sheet.html';
    console.log('📊 Parsing HTML pricing data...');
    const parsedProducts = parseHTMLPricing(htmlPath);
    console.log(`Found ${parsedProducts.length} products in pricing sheet`);

    let updatedCount = 0;
    let errorCount = 0;

    for (const product of parsedProducts) {
      try {
        console.log(`\n🔍 Processing: ${product.productName}`);
        
        // Map to database product name
        const dbProductName = mapProductNameToDatabase(product.productName);
        if (!dbProductName) {
          console.warn(`⚠️  No mapping found for: ${product.productName}`);
          continue;
        }

        // Find product in database
        const { data: dbProduct, error: productError } = await supabase
          .from('products')
          .select('id, name')
          .ilike('name', `%${dbProductName}%`)
          .single();

        if (productError || !dbProduct) {
          console.warn(`⚠️  Product not found in database: ${dbProductName}`);
          continue;
        }

        console.log(`✅ Found product in database: ${dbProduct.name} (ID: ${dbProduct.id})`);

        // Clear existing pricing tiers for this product
        await supabase
          .from('pricing_tiers')
          .delete()
          .eq('product_id', dbProduct.id);

        // Create new pricing tiers
        const pricingTiers = createPricingTiersFromParsedData(product, dbProduct.id);
        console.log(`📋 Creating ${pricingTiers.length} pricing tiers...`);

        if (pricingTiers.length > 0) {
          const { error: tierError } = await supabase
            .from('pricing_tiers')
            .insert(pricingTiers);

          if (tierError) {
            console.error(`❌ Error inserting pricing tiers for ${dbProduct.name}:`, tierError);
            errorCount++;
          } else {
            console.log(`✅ Updated pricing for ${dbProduct.name}`);
            updatedCount++;
          }
        }

        // Update base inventory prices
        const basePrice = product.msrp_9lb || product.local_retail || 25.00;
        await supabase
          .from('inventory')
          .update({ price: basePrice })
          .eq('product_id', dbProduct.id)
          .eq('size_option', product.msrp_9lb ? '9lb Bag' : '2 CF Bag');

      } catch (error) {
        console.error(`❌ Error processing ${product.productName}:`, error);
        errorCount++;
      }
    }

    console.log('\n🎉 Pricing update completed!');
    console.log('=' .repeat(50));
    console.log(`✅ Successfully updated: ${updatedCount} products`);
    console.log(`❌ Errors: ${errorCount} products`);
    console.log('=' .repeat(50));

    // Verify some pricing
    console.log('\n🔍 Verifying updated pricing...');
    const { data: samplePricing } = await supabase
      .from('pricing_tiers')
      .select('*, products(name)')
      .limit(5);

    if (samplePricing) {
      console.log('\n📋 Sample pricing tiers:');
      samplePricing.forEach(tier => {
        console.log(`- ${tier.products?.name}: ${tier.size_option} ${tier.tier_name} = $${tier.fixed_price} (min: ${tier.min_quantity})`);
      });
    }

  } catch (error) {
    console.error('💥 Unexpected error during pricing update:', error);
  }
}

// Run the update
updatePricingFromHTML();