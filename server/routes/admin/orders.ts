import { Router } from 'express';
import { db } from '../../db';
import { orders } from '../../../shared/schema';
import { eq, desc, and, or, ilike, sql } from 'drizzle-orm';
import { adminAuth } from '../../middleware/adminAuth';

const router = Router();

// Apply admin auth to all routes
router.use(adminAuth);

// Get orders with filters
router.get('/', async (req, res) => {
  try {
    const { 
      limit = '10', 
      offset = '0', 
      status, 
      orderType, 
      search 
    } = req.query;

    let query = db.select().from(orders);
    const conditions = [];

    // Add filters
    if (status) {
      conditions.push(eq(orders.status, status as string));
    }

    if (orderType) {
      conditions.push(eq(orders.orderType, orderType as string));
    }

    if (search) {
      conditions.push(
        or(
          ilike(orders.businessName, `%${search}%`),
          ilike(orders.email, `%${search}%`),
          sql`${orders.id}::text LIKE ${`%${search}%`}`
        )
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Add ordering and pagination
    const allOrders = await query
      .orderBy(desc(orders.createdAt))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

    // Get total count
    const countQuery = db.select({ count: sql<number>`count(*)` }).from(orders);
    if (conditions.length > 0) {
      countQuery.where(and(...conditions));
    }
    const [{ count }] = await countQuery;

    res.json({
      orders: allOrders,
      total: count,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get single order
router.get('/:id', async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Update order status
router.patch('/:id/status', async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const { status } = req.body;

    const [updatedOrder] = await db
      .update(orders)
      .set({ 
        status,
        ...(status === 'completed' ? { pickupCompletedAt: new Date() } : {})
      })
      .where(eq(orders.id, orderId))
      .returning();

    if (!updatedOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(updatedOrder);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

export default router;