import { Router } from "express";
import { supabase } from "../../supabaseClient";
import { adminAuthMiddleware, AdminRequest } from "../../middleware/adminAuth";

const router = Router();

// Apply admin auth to all routes
router.use(adminAuthMiddleware);

// Get orders with filters
router.get("/", async (req: AdminRequest, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    let query = supabase
      .from("orders")
      .select(
        `
        *,
        customers (
          id,
          name,
          email,
          phone
        ),
        order_items (
          id,
          quantity,
          price,
          products (
            id,
            name,
            sku
          )
        )
      `
      )
      .order("created_at", { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (status) {
      query = query.eq("status", status);
    }

    const { data: orders, error } = await query;

    if (error) throw error;

    // Calculate item count for each order
    const ordersWithCount = orders?.map((order) => ({
      ...order,
      item_count: order.order_items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0,
      customer_name: order.customers?.name,
      customer_email: order.customers?.email,
    }));

    res.json(ordersWithCount || []);
  } catch (error) {
    console.error("Get orders error:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// Get order statistics
router.get("/stats", async (req: AdminRequest, res) => {
  try {
    // Get order counts by status
    const { data: statusCounts, error: statusError } = await supabase.from("orders").select("status").order("status");

    if (statusError) throw statusError;

    // Group by status
    const orderStats = statusCounts?.reduce(
      (acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    res.json({
      statusCounts: orderStats || {},
      total: statusCounts?.length || 0,
    });
  } catch (error) {
    console.error("Get order stats error:", error);
    res.status(500).json({ error: "Failed to fetch order statistics" });
  }
});

// Update order status
router.put("/:id/status", async (req: AdminRequest, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const { data: order, error } = await supabase
      .from("orders")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // Log status change
    await supabase.from("order_status_history").insert({
      order_id: id,
      status,
      changed_by: req.admin?.id,
      changed_at: new Date().toISOString(),
    });

    res.json(order);
  } catch (error) {
    console.error("Update order status error:", error);
    res.status(500).json({ error: "Failed to update order status" });
  }
});

export default router;
