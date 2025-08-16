import { Router } from 'express';
import { supabase } from '../../db/supabase.js';
import { adminAuth as requireAdminAuth } from '../../middleware/adminAuth.js';

const router = Router();

// Get all orders with optional filters
router.get('/', requireAdminAuth, async (req, res) => {
  try {
    const { order_type, status, date_from, date_to, limit = 50, offset = 0 } = req.query;
    
    let query = supabase
      .from('orders')
      .select(`
        *,
        customer:customer_id(
          id,
          email,
          full_name,
          phone
        ),
        items:order_items(
          id,
          product_id,
          product_name,
          quantity,
          size,
          price_per_unit,
          total_price
        )
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (order_type) {
      query = query.eq('order_type', order_type);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    if (date_from) {
      query = query.gte('created_at', date_from);
    }
    
    if (date_to) {
      query = query.lte('created_at', date_to);
    }

    // Apply pagination
    query = query.range(Number(offset), Number(offset) + Number(limit) - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching orders:', error);
      return res.status(500).json({ error: 'Failed to fetch orders' });
    }

    res.json({
      orders: data || [],
      total: count || 0
    });
  } catch (error) {
    console.error('Error in orders endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single order by ID
router.get('/:id', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        customer:customer_id(
          id,
          email,
          full_name,
          phone,
          address
        ),
        items:order_items(
          id,
          product_id,
          product_name,
          quantity,
          size,
          price_per_unit,
          total_price
        )
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update order status
router.patch('/:id/status', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'preparing', 'ready', 'picked_up', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Update order
    const { data, error } = await supabase
      .from('orders')
      .update({ 
        status,
        ...(status === 'picked_up' ? { pickup_time: new Date().toISOString() } : {}),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating order status:', error);
      return res.status(500).json({ error: 'Failed to update order status' });
    }

    // If order is ready, send notification (placeholder for actual implementation)
    if (status === 'ready') {
      // TODO: Implement SMS/email notification
      console.log(`Order ${id} is ready for pickup - send notification`);
    }

    res.json(data);
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add notes to order
router.post('/:id/notes', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const { data, error } = await supabase
      .from('orders')
      .update({ 
        admin_notes: notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating order notes:', error);
      return res.status(500).json({ error: 'Failed to update order notes' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error updating notes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Cancel order
router.post('/:id/cancel', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const { data, error } = await supabase
      .from('orders')
      .update({ 
        status: 'cancelled',
        cancellation_reason: reason,
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error cancelling order:', error);
      return res.status(500).json({ error: 'Failed to cancel order' });
    }

    // TODO: Process refund if payment was made
    // TODO: Send cancellation notification

    res.json(data);
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get order statistics
router.get('/stats/summary', requireAdminAuth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get today's stats
    const { data: todayOrders, error: todayError } = await supabase
      .from('orders')
      .select('id, status, total_amount, order_type')
      .gte('created_at', today.toISOString());

    if (todayError) {
      throw todayError;
    }

    const stats = {
      totalToday: todayOrders?.length || 0,
      pending: todayOrders?.filter(o => o.status === 'pending').length || 0,
      preparing: todayOrders?.filter(o => o.status === 'preparing').length || 0,
      ready: todayOrders?.filter(o => o.status === 'ready').length || 0,
      completed: todayOrders?.filter(o => o.status === 'picked_up' || o.status === 'delivered').length || 0,
      revenue: todayOrders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0,
      driveThruCount: todayOrders?.filter(o => o.order_type === 'drive_thru').length || 0,
      avgWaitTime: 15 // Placeholder - would calculate from actual data
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching order stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;