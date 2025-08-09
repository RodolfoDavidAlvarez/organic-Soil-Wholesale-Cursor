import { Router } from 'express';
import { db } from '../../db';
import { products, orders, users } from '../../../shared/schema';
import { eq, sql, and, gte } from 'drizzle-orm';
import { adminAuth } from '../../middleware/adminAuth';

const router = Router();

// Apply admin auth to all routes
router.use(adminAuth);

// Get dashboard stats
router.get('/stats', async (req, res) => {
  try {
    // Get today's start
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch various stats in parallel
    const [
      productStats,
      orderStats,
      todayOrderStats,
      driveThruStats,
      customerStats,
      lowStockItems
    ] = await Promise.all([
      // Total products
      db.select({ count: sql<number>`count(*)` }).from(products),
      
      // Total orders and revenue
      db.select({
        count: sql<number>`count(*)`,
        totalRevenue: sql<number>`COALESCE(sum(total), 0)`,
        pendingCount: sql<number>`count(*) FILTER (WHERE status = 'pending')`
      }).from(orders),
      
      // Today's orders
      db.select({
        count: sql<number>`count(*)`,
        revenue: sql<number>`COALESCE(sum(total), 0)`
      }).from(orders).where(gte(orders.createdAt, today)),
      
      // Drive-through orders today
      db.select({
        count: sql<number>`count(*)`
      }).from(orders).where(
        and(
          eq(orders.orderType, 'quick_order'),
          gte(orders.createdAt, today)
        )
      ),
      
      // Active customers
      db.select({
        count: sql<number>`count(DISTINCT email)`
      }).from(orders),
      
      // Low stock items (less than 50)
      db.select({
        count: sql<number>`count(*)`
      }).from(products).where(sql`stock_quantity < 50`)
    ]);

    res.json({
      totalProducts: productStats[0]?.count || 0,
      totalOrders: orderStats[0]?.count || 0,
      pendingOrders: orderStats[0]?.pendingCount || 0,
      driveThruOrders: driveThruStats[0]?.count || 0,
      totalRevenue: orderStats[0]?.totalRevenue || 0,
      todayRevenue: todayOrderStats[0]?.revenue || 0,
      lowStockItems: lowStockItems[0]?.count || 0,
      activeCustomers: customerStats[0]?.count || 0
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

export default router;