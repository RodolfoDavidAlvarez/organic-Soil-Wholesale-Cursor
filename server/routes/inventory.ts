import { Router } from 'express';
import { supabase } from '../db/supabase.js';

const router = Router();

// Get inventory for a specific location
router.get('/location/:locationId', async (req, res) => {
  try {
    const { locationId } = req.params;
    
    const { data, error } = await supabase
      .from('inventory')
      .select(`
        *,
        products (
          id,
          name,
          description,
          price,
          category,
          imageUrl,
          texturePhotoUrl,
          sizeOptions
        )
      `)
      .eq('location_id', locationId)
      .gt('quantity_available', 0);

    if (error) throw error;

    res.json(data);
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
      posTransactionId,
      notes 
    } = req.body;

    // Start a transaction
    const { data: inventory, error: invError } = await supabase
      .from('inventory')
      .select('id, quantity_available')
      .eq('product_id', productId)
      .eq('location_id', locationId)
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