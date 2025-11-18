import { Router } from 'express';
import { supabase } from '../db/supabase.js';
import { pricingService, CustomerType } from '../services/pricingService.js';

const router = Router();

// Helper function to determine display order for size options
function getSizeDisplayOrder(sizeOption: string): number {
  const orderMap: Record<string, number> = {
    '9lb Bag': 1,
    '25lb Bag': 2,
    '1 CF Bag': 3,
    'Bulk (50lb)': 4,
    'Bulk Pickup': 5,
    'Bulk Delivery': 6
  };
  
  return orderMap[sizeOption] || 99;
}

// Get inventory for a specific location with pricing
router.get('/location/:locationId', async (req, res) => {
  try {
    const { locationId } = req.params;
    const { customerType = 'regular', includeOutOfStock = 'false', payAndPickup = 'false' } = req.query;
    
    let query = supabase
      .from('inventory')
      .select(`
        *,
        products (
          id,
          name,
          description,
          category,
          image_url,
          texture_photo_url
        )
      `)
      .eq('location_id', locationId);

    // Filter out of stock items unless requested
    if (includeOutOfStock !== 'true') {
      query.gt('quantity_available', 0);
    }

    // Skip payAndPickup filtering for now - column doesn't exist
    // if (payAndPickup === 'true') {
    //   query = query.eq('products.is_pay_and_pickup_enabled', true);
    // }

    const { data, error } = await query;

    if (error) throw error;

    // Enhance with pricing information
    const parsedLocationId = parseInt(locationId);

    const inventoryWithPricing = await Promise.all(
      data.map(async (item) => {
        const basePrice = item?.price != null ? Number(item.price) : undefined;
        const pricing = await pricingService.calculatePrice(
          item.product_id,
          item.size_option,
          1, // Single unit price
          customerType as CustomerType['type'],
          parsedLocationId,
          { basePrice }
        );

        return {
          ...item,
          pricing: {
            base_price: pricing.base_price,
            final_price: pricing.final_price,
            discount_amount: pricing.discount_amount,
            tier_applied: pricing.tier_applied,
            savings: pricing.savings
          }
        };
      })
    );

    res.json(inventoryWithPricing);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

// Check specific product availability
router.get('/check/:productId/:locationId', async (req, res) => {
  try {
    const { productId, locationId } = req.params;
    
    const { data, error } = await supabase
      .from('inventory')
      .select('quantity_available, quantity_reserved')
      .eq('product_id', productId)
      .eq('location_id', locationId)
      .single();

    if (error) throw error;

    const available = data ? data.quantity_available : 0;
    const canOrder = available > 0;

    res.json({
      productId,
      locationId,
      available,
      reserved: data?.quantity_reserved || 0,
      canOrder
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({ error: 'Failed to check availability' });
  }
});

// Record POS transaction (for external POS systems)
router.post('/transaction', async (req, res) => {
  try {
    const { 
      productId, 
      locationId, 
      quantity, 
      sizeOption,
      posTransactionId,
      notes 
    } = req.body;

    // Start a transaction
    const { data: inventory, error: invError } = await supabase
      .from('inventory')
      .select('id, quantity_available')
      .eq('product_id', productId)
      .eq('location_id', locationId)
      .eq('size_option', sizeOption)
      .single();

    if (invError) throw invError;

    if (!inventory || inventory.quantity_available < quantity) {
      return res.status(400).json({ 
        error: 'Insufficient inventory',
        available: inventory?.quantity_available || 0
      });
    }

    // Update inventory
    const { error: updateError } = await supabase
      .from('inventory')
      .update({ 
        quantity_available: inventory.quantity_available - quantity 
      })
      .eq('id', inventory.id);

    if (updateError) throw updateError;

    // Record transaction
    const { error: transError } = await supabase
      .from('inventory_transactions')
      .insert({
        inventory_id: inventory.id,
        transaction_type: 'sale',
        quantity: -quantity,
        reference_type: 'pos',
        reference_id: posTransactionId,
        notes: notes || 'POS sale'
      });

    if (transError) throw transError;

    res.json({ 
      success: true,
      newQuantity: inventory.quantity_available - quantity
    });
  } catch (error) {
    console.error('Error recording POS transaction:', error);
    res.status(500).json({ error: 'Failed to record transaction' });
  }
});

// Get inventory levels for sync
router.get('/sync/:locationId', async (req, res) => {
  try {
    const { locationId } = req.params;
    
    const { data, error } = await supabase
      .from('inventory')
      .select(`
        product_id,
        quantity_available,
        quantity_reserved,
        products (
          name,
          sku
        )
      `)
      .eq('location_id', locationId);

    if (error) throw error;

    res.json({
      locationId,
      timestamp: new Date().toISOString(),
      inventory: data
    });
  } catch (error) {
    console.error('Error syncing inventory:', error);
    res.status(500).json({ error: 'Failed to sync inventory' });
  }
});

// Get product inventory for QR system with enhanced data
router.get('/products/:locationId', async (req, res) => {
  try {
    const { locationId } = req.params;
    const {
      category,
      customerType = 'regular',
      payAndPickup = 'false',
      includeOutOfStock = 'false',
    } = req.query;
    
    const parsedLocationId = parseInt(locationId);
    const payAndPickupOnly = payAndPickup === 'true';
    const includeSoldOut = includeOutOfStock === 'true' || payAndPickupOnly;

    let query = supabase
      .from('inventory')
      .select(`
        *,
        products!inner (
          id,
          name,
          description,
          category,
          image_url,
          texture_photo_url,
          display_title,
          marketing_title,
          ingredients,
          recommended_uses,
          target_audience,
          story,
          usage,
          certifications,
          features,
          additional_images,
          available_size_options,
          pay_and_pickup_badge,
          pay_and_pickup_description,
          pay_and_pickup_hero_image,
          pay_and_pickup_display_order,
          is_pay_and_pickup_enabled,
          product_video_url,
          product_video_title
        )
      `)
      .eq('location_id', locationId);

    if (!includeSoldOut) {
      query = query.gt('quantity_available', 0);
    }

    // Filter by category if provided
    if (category) {
      query = query.eq('products.category', category);
    }

    if (payAndPickupOnly) {
      query = query
        .eq('products.is_pay_and_pickup_enabled', true);
      // Remove active check - column might not exist
      // .eq('products.active', true);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Debug logging
    if (payAndPickupOnly) {
      console.log('Pay & Pickup filter active - found', data?.length || 0, 'inventory items');
      if (data && data.length > 0) {
        console.log('First item is_pay_and_pickup_enabled:', data[0].products?.is_pay_and_pickup_enabled);
      }
    }

    // Enrich inventory rows with pricing in parallel
    const enrichedInventory = await Promise.all(
      data.map(async (item) => {
        const basePrice = item?.price != null ? Number(item.price) : undefined;
        const pricing = await pricingService.calculatePrice(
          item.product_id,
          item.size_option,
          1,
          customerType as CustomerType['type'],
          parsedLocationId,
          { basePrice }
        );

        return {
          ...item,
          pricing
        };
      })
    );

    // Group by product and enhance with pricing
    const productMap = new Map();
    
    for (const item of enrichedInventory) {
      const productId = item.product_id;
      
      // Additional check for pay & pickup filter
      if (payAndPickupOnly && !item.products?.is_pay_and_pickup_enabled) {
        console.log(`Skipping product ${productId} - is_pay_and_pickup_enabled: ${item.products?.is_pay_and_pickup_enabled}`);
        continue;
      }
      
      const productRecord = productMap.get(productId) ?? {
        ...item.products,
        inventory: [],
        sizePriceOptions: [] // Initialize for synthesized data
      };

      productRecord.inventory.push({
        size_option: item.size_option,
        quantity_available: item.quantity_available,
        quantity_reserved: item.quantity_reserved,
        price: item.price,
        pricing: {
          base_price: item.pricing.base_price,
          final_price: item.pricing.final_price,
          discount_amount: item.pricing.discount_amount,
          tier_applied: item.pricing.tier_applied,
          savings: item.pricing.savings
        }
      });

      // Synthesize size_price_options from inventory data for client compatibility
      const sizeKey = item.size_option.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[()]/g, '');

      const displayOrder = getSizeDisplayOrder(item.size_option);
      
      const sizePriceOption = {
        key: sizeKey,
        label: item.size_option,
        price: item.pricing.final_price,
        priceCents: Math.round(item.pricing.final_price * 100),
        isActive: true,
        displayOrder
      };

      // Add to sizePriceOptions if not already present
      if (!productRecord.sizePriceOptions.some((opt: any) => opt.key === sizeKey)) {
        productRecord.sizePriceOptions.push(sizePriceOption);
      }

      productMap.set(productId, productRecord);
    }

    // Sort size price options by display order for each product
    for (const product of productMap.values()) {
      (product as any).sizePriceOptions.sort((a: any, b: any) => a.displayOrder - b.displayOrder);
    }

    const products = Array.from(productMap.values()).sort((a: any, b: any) => {
      const orderA = a.pay_and_pickup_display_order ?? 0;
      const orderB = b.pay_and_pickup_display_order ?? 0;
      return orderA - orderB;
    });

    res.json({
      success: true,
      location_id: locationId,
      category: category || 'all',
      customer_type: customerType,
      products: products
    });
  } catch (error) {
    console.error('Error fetching products inventory:', error);
    res.status(500).json({ error: 'Failed to fetch products inventory' });
  }
});

// Reserve inventory for checkout
router.post('/reserve', async (req, res) => {
  try {
    const { items, sessionId } = req.body;
    
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Items array is required' });
    }

    const reservations = [];
    
    for (const item of items) {
      const { productId, locationId, sizeOption, quantity } = item;
      
      // Check availability
      const { data: inventory, error } = await supabase
        .from('inventory')
        .select('id, quantity_available, quantity_reserved')
        .eq('product_id', productId)
        .eq('location_id', locationId)
        .eq('size_option', sizeOption)
        .single();

      if (error || !inventory) {
        return res.status(404).json({ 
          error: `Inventory not found for product ${productId}, size ${sizeOption}` 
        });
      }

      if (inventory.quantity_available < quantity) {
        return res.status(400).json({ 
          error: `Insufficient inventory for product ${productId}, size ${sizeOption}. Available: ${inventory.quantity_available}, Requested: ${quantity}` 
        });
      }

      // Reserve inventory
      const { error: updateError } = await supabase
        .from('inventory')
        .update({
          quantity_available: inventory.quantity_available - quantity,
          quantity_reserved: inventory.quantity_reserved + quantity
        })
        .eq('id', inventory.id);

      if (updateError) {
        throw updateError;
      }

      reservations.push({
        productId,
        locationId,
        sizeOption,
        quantity,
        reservedAt: new Date().toISOString(),
        sessionId
      });
    }

    res.json({
      success: true,
      reservations,
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutes
    });
  } catch (error) {
    console.error('Error reserving inventory:', error);
    res.status(500).json({ error: 'Failed to reserve inventory' });
  }
});

// Release inventory reservations
router.post('/release', async (req, res) => {
  try {
    const { items } = req.body;
    
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Items array is required' });
    }

    for (const item of items) {
      const { productId, locationId, sizeOption, quantity } = item;
      
      // Get current inventory
      const { data: inventory, error } = await supabase
        .from('inventory')
        .select('id, quantity_available, quantity_reserved')
        .eq('product_id', productId)
        .eq('location_id', locationId)
        .eq('size_option', sizeOption)
        .single();

      if (error || !inventory) {
        console.warn(`Inventory not found for release: product ${productId}, size ${sizeOption}`);
        continue;
      }

      // Release reservation
      await supabase
        .from('inventory')
        .update({
          quantity_available: inventory.quantity_available + quantity,
          quantity_reserved: Math.max(0, inventory.quantity_reserved - quantity)
        })
        .eq('id', inventory.id);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error releasing inventory:', error);
    res.status(500).json({ error: 'Failed to release inventory' });
  }
});

// Webhook endpoint for POS updates
router.post('/webhook', async (req, res) => {
  try {
    // Verify webhook signature if needed
    const { updates } = req.body;

    for (const update of updates) {
      const { productId, locationId, newQuantity } = update;
      
      // Update inventory to match POS system
      await supabase
        .from('inventory')
        .update({ quantity_available: newQuantity })
        .eq('product_id', productId)
        .eq('location_id', locationId);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;
