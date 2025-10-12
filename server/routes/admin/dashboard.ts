import { Router } from "express";
import { supabase } from "../../supabaseClient";
import { tempAdminAuthMiddleware } from "../../middleware/tempAdminAuth";

const router = Router();

// Apply admin auth to all routes
router.use(tempAdminAuthMiddleware);

// Get dashboard stats
router.get("/stats", async (req, res) => {
  try {
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's revenue
    const { data: todayOrders, error: revenueError } = await supabase
      .from("orders")
      .select("total")
      .gte("created_at", today.toISOString())
      .lt("created_at", tomorrow.toISOString());

    const todayRevenue = todayOrders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;

    // Get total orders count by status
    const { data: orderStats, error: orderError } = await supabase.from("orders").select("status, count", { count: "exact" }).order("status");

    // Get low stock products
    const { data: lowStockProducts, error: stockError } = await supabase
      .from("products")
      .select("id, name, stock, min_stock_level")
      .lt("stock", "min_stock_level")
      .eq("active", true)
      .order("stock", { ascending: true })
      .limit(10);

    // Get popular products (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: popularProducts, error: popularError } = await supabase
      .from("order_items")
      .select("product_id, quantity, products(name, price)")
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("quantity", { ascending: false })
      .limit(5);

    // Get recent orders
    const { data: recentOrders, error: recentError } = await supabase
      .from("orders")
      .select("*, customers(name, email)")
      .order("created_at", { ascending: false })
      .limit(10);

    res.json({
      todayRevenue,
      orderStats: orderStats || [],
      lowStockProducts: lowStockProducts || [],
      popularProducts: popularProducts || [],
      recentOrders: recentOrders || [],
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
});

// Get revenue chart data
router.get("/revenue-chart", async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));
    startDate.setHours(0, 0, 0, 0);

    const { data: orders, error } = await supabase
      .from("orders")
      .select("created_at, total")
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: true });

    if (error) throw error;

    // Group by day
    const revenueByDay = orders.reduce(
      (acc, order) => {
        const date = new Date(order.created_at).toLocaleDateString();
        acc[date] = (acc[date] || 0) + (order.total || 0);
        return acc;
      },
      {} as Record<string, number>
    );

    const chartData = Object.entries(revenueByDay).map(([date, revenue]) => ({
      date,
      revenue,
    }));

    res.json(chartData);
  } catch (error) {
    console.error("Revenue chart error:", error);
    res.status(500).json({ error: "Failed to fetch revenue data" });
  }
});

// Get inventory alerts
router.get("/alerts", async (req, res) => {
  try {
    const { data: alerts, error } = await supabase
      .from("inventory_alerts")
      .select("*, products(name, sku)")
      .is("resolved_at", null)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json(alerts || []);
  } catch (error) {
    console.error("Inventory alerts error:", error);
    res.status(500).json({ error: "Failed to fetch alerts" });
  }
});

export default router;
