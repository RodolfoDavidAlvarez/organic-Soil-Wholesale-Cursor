import { Router } from "express";
import { OrderManagementService } from "../services/orderManagementService.js";

const router = Router();

/**
 * Get orders for admin dashboard
 * GET /api/orders/admin
 */
router.get("/admin", async (req, res) => {
  try {
    const { status, paymentStatus, orderType, dateFrom, dateTo, search, limit = 50, offset = 0 } = req.query;

    const filters = {
      status: status as string,
      paymentStatus: paymentStatus as string,
      orderType: orderType as string,
      dateFrom: dateFrom as string,
      dateTo: dateTo as string,
      search: search as string,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    };

    const result = await OrderManagementService.getAdminOrders(filters);

    res.json({
      success: true,
      orders: result.orders,
      total: result.total,
      limit: filters.limit,
      offset: filters.offset,
    });
  } catch (error) {
    console.error("Get admin orders error:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

/**
 * Update order status
 * PUT /api/orders/:orderId
 */
router.put("/:orderId", async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);
    const updates = req.body;
    const updatedBy = (req.headers["x-admin-user"] as string) || "admin";

    if (isNaN(orderId)) {
      return res.status(400).json({ error: "Invalid order ID" });
    }

    const updatedOrder = await OrderManagementService.updateOrder(orderId, updates, updatedBy);

    res.json({
      success: true,
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Update order error:", error);
    res.status(500).json({ error: "Failed to update order" });
  }
});

/**
 * Get order details for customer
 * GET /api/orders/:orderId/customer
 */
router.get("/:orderId/customer", async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);
    const customerPhone = req.query.phone as string;

    if (isNaN(orderId)) {
      return res.status(400).json({ error: "Invalid order ID" });
    }

    const order = await OrderManagementService.getCustomerOrder(orderId, customerPhone);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Get customer order error:", error);
    res.status(500).json({ error: "Failed to fetch order" });
  }
});

/**
 * Get order status history
 * GET /api/orders/:orderId/history
 */
router.get("/:orderId/history", async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);

    if (isNaN(orderId)) {
      return res.status(400).json({ error: "Invalid order ID" });
    }

    const history = await OrderManagementService.getOrderStatusHistory(orderId);

    res.json({
      success: true,
      history,
    });
  } catch (error) {
    console.error("Get order history error:", error);
    res.status(500).json({ error: "Failed to fetch order history" });
  }
});

/**
 * Get dashboard statistics
 * GET /api/orders/dashboard-stats
 */
router.get("/dashboard-stats", async (req, res) => {
  try {
    const stats = await OrderManagementService.getDashboardStats();

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    res.status(500).json({ error: "Failed to fetch dashboard statistics" });
  }
});

/**
 * Mark order as ready for pickup
 * POST /api/orders/:orderId/ready
 */
router.post("/:orderId/ready", async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);
    const { estimatedReadyTime, notes } = req.body;
    const updatedBy = (req.headers["x-admin-user"] as string) || "admin";

    if (isNaN(orderId)) {
      return res.status(400).json({ error: "Invalid order ID" });
    }

    const updates: any = {
      status: "ready_for_pickup",
      estimated_ready_time: estimatedReadyTime,
    };

    if (notes) {
      updates.notes = notes;
    }

    const updatedOrder = await OrderManagementService.updateOrder(orderId, updates, updatedBy);

    res.json({
      success: true,
      order: updatedOrder,
      message: "Order marked as ready for pickup",
    });
  } catch (error) {
    console.error("Mark order ready error:", error);
    res.status(500).json({ error: "Failed to mark order as ready" });
  }
});

/**
 * Complete order (customer picked up)
 * POST /api/orders/:orderId/complete
 */
router.post("/:orderId/complete", async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);
    const { notes } = req.body;
    const updatedBy = (req.headers["x-admin-user"] as string) || "admin";

    if (isNaN(orderId)) {
      return res.status(400).json({ error: "Invalid order ID" });
    }

    const updates: any = {
      status: "completed",
      pickup_completed_at: new Date().toISOString(),
    };

    if (notes) {
      updates.notes = notes;
    }

    const updatedOrder = await OrderManagementService.updateOrder(orderId, updates, updatedBy);

    res.json({
      success: true,
      order: updatedOrder,
      message: "Order completed successfully",
    });
  } catch (error) {
    console.error("Complete order error:", error);
    res.status(500).json({ error: "Failed to complete order" });
  }
});

export default router;




