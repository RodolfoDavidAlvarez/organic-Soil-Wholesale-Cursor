import { supabase } from "../db/supabase.js";

export interface OrderStatus {
  id: number;
  order_id: number;
  status: string;
  notes?: string;
  created_at: string;
  updated_by?: string;
}

export interface OrderUpdate {
  status?: string;
  payment_status?: string;
  notes?: string;
  estimated_ready_time?: string;
  actual_ready_time?: string;
  pickup_completed_at?: string;
}

export class OrderManagementService {
  /**
   * Get orders for admin dashboard with filtering and pagination
   */
  static async getAdminOrders(filters?: {
    status?: string;
    paymentStatus?: string;
    orderType?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    try {
      let query = supabase
        .from("orders")
        .select(
          `
          *,
          order_items (
            id,
            product_id,
            quantity,
            unit_price,
            total_price,
            size_option,
            products (
              name,
              display_title
            )
          )
        `
        )
        .order("created_at", { ascending: false });

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }

      if (filters?.paymentStatus) {
        query = query.eq("payment_status", filters.paymentStatus);
      }

      if (filters?.orderType) {
        query = query.eq("order_type", filters.orderType);
      }

      if (filters?.dateFrom) {
        query = query.gte("created_at", filters.dateFrom);
      }

      if (filters?.dateTo) {
        query = query.lte("created_at", filters.dateTo);
      }

      if (filters?.search) {
        query = query.or(`order_number.ilike.%${filters.search}%,business_name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
      }

      const { data: orders, error } = await query;

      if (error) {
        console.error("Error fetching admin orders:", error);
        return { orders: [], total: 0 };
      }

      // Get total count for pagination
      const { count } = await supabase.from("orders").select("*", { count: "exact", head: true });

      return {
        orders: orders || [],
        total: count || 0,
      };
    } catch (error) {
      console.error("Error in getAdminOrders:", error);
      return { orders: [], total: 0 };
    }
  }

  /**
   * Update order status and details
   */
  static async updateOrder(orderId: number, updates: OrderUpdate, updatedBy?: string) {
    try {
      // Update the order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId)
        .select()
        .single();

      if (orderError) {
        console.error("Error updating order:", orderError);
        throw new Error("Failed to update order");
      }

      // Record status change in order history
      if (updates.status) {
        await this.recordOrderStatusChange(orderId, updates.status, updates.notes, updatedBy);
      }

      // If order is marked as ready, update inventory
      if (updates.status === "ready_for_pickup") {
        await this.markOrderAsReady(orderId);
      }

      // If order is completed, finalize inventory
      if (updates.status === "completed") {
        await this.completeOrder(orderId);
      }

      return order;
    } catch (error) {
      console.error("Error updating order:", error);
      throw error;
    }
  }

  /**
   * Record order status change in history
   */
  private static async recordOrderStatusChange(orderId: number, status: string, notes?: string, updatedBy?: string) {
    try {
      const { error } = await supabase.from("order_status_history").insert({
        order_id: orderId,
        status,
        notes,
        updated_by: updatedBy || "system",
        created_at: new Date().toISOString(),
      });

      if (error) {
        console.error("Error recording status change:", error);
      }
    } catch (error) {
      console.error("Error recording status change:", error);
    }
  }

  /**
   * Mark order as ready for pickup
   */
  private static async markOrderAsReady(orderId: number) {
    try {
      // Get order items to update inventory
      const { data: orderItems, error: itemsError } = await supabase
        .from("order_items")
        .select("product_id, quantity, size_option, status")
        .eq("order_id", orderId)
        .eq("status", "reserved");

      if (itemsError || !orderItems) {
        console.error("Error fetching order items for ready status:", itemsError);
        return;
      }

      // Update order items to ready status
      for (const item of orderItems) {
        await supabase
          .from("order_items")
          .update({
            status: "ready",
            ready_at: new Date().toISOString(),
          })
          .eq("order_id", orderId)
          .eq("product_id", item.product_id)
          .eq("size_option", item.size_option);
      }

      console.log(`Order ${orderId} marked as ready for pickup`);
    } catch (error) {
      console.error("Error marking order as ready:", error);
    }
  }

  /**
   * Complete order and finalize inventory
   */
  private static async completeOrder(orderId: number) {
    try {
      // Get order items
      const { data: orderItems, error: itemsError } = await supabase
        .from("order_items")
        .select("product_id, quantity, size_option")
        .eq("order_id", orderId);

      if (itemsError || !orderItems) {
        console.error("Error fetching order items for completion:", itemsError);
        return;
      }

      // Update inventory - move from reserved to sold
      for (const item of orderItems) {
        // Get current inventory
        const { data: inventory } = await supabase
          .from("inventory")
          .select("id, quantity_reserved, quantity_sold")
          .eq("product_id", item.product_id)
          .eq("location_id", 1) // Phoenix warehouse
          .eq("size_option", item.size_option)
          .single();

        if (inventory) {
          // Update inventory
          await supabase
            .from("inventory")
            .update({
              quantity_reserved: inventory.quantity_reserved - item.quantity,
              quantity_sold: inventory.quantity_sold + item.quantity,
              last_updated: new Date().toISOString(),
            })
            .eq("id", inventory.id);

          // Record transaction
          await supabase.from("inventory_transactions").insert({
            inventory_id: inventory.id,
            transaction_type: "sale",
            quantity: -item.quantity,
            reference_type: "order",
            reference_id: orderId.toString(),
            notes: "Order completed - final sale",
          });
        }

        // Update order item status
        await supabase
          .from("order_items")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
          })
          .eq("order_id", orderId)
          .eq("product_id", item.product_id);
      }

      console.log(`Order ${orderId} completed and inventory finalized`);
    } catch (error) {
      console.error("Error completing order:", error);
    }
  }

  /**
   * Get order details for customer view
   */
  static async getCustomerOrder(orderId: number, customerPhone?: string) {
    try {
      let query = supabase
        .from("orders")
        .select(
          `
          *,
          order_items (
            id,
            product_id,
            quantity,
            unit_price,
            total_price,
            size_option,
            status,
            products (
              name,
              display_title,
              image_url
            )
          )
        `
        )
        .eq("id", orderId);

      // If customer phone provided, verify ownership
      if (customerPhone) {
        query = query.eq("phone", customerPhone);
      }

      const { data: order, error } = await query.single();

      if (error) {
        console.error("Error fetching customer order:", error);
        return null;
      }

      return order;
    } catch (error) {
      console.error("Error in getCustomerOrder:", error);
      return null;
    }
  }

  /**
   * Get order status history
   */
  static async getOrderStatusHistory(orderId: number) {
    try {
      const { data: history, error } = await supabase
        .from("order_status_history")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching order status history:", error);
        return [];
      }

      return history || [];
    } catch (error) {
      console.error("Error in getOrderStatusHistory:", error);
      return [];
    }
  }

  /**
   * Get dashboard statistics
   */
  static async getDashboardStats() {
    try {
      const today = new Date().toISOString().split("T")[0];
      const thisWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      // Get today's orders
      const { count: todayOrders } = await supabase.from("orders").select("*", { count: "exact", head: true }).gte("created_at", today);

      // Get this week's orders
      const { count: weekOrders } = await supabase.from("orders").select("*", { count: "exact", head: true }).gte("created_at", thisWeek);

      // Get pending orders
      const { count: pendingOrders } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .in("status", ["pending", "pending_payment", "paid", "ready_for_pickup"]);

      // Get ready for pickup orders
      const { count: readyOrders } = await supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "ready_for_pickup");

      return {
        todayOrders: todayOrders || 0,
        weekOrders: weekOrders || 0,
        pendingOrders: pendingOrders || 0,
        readyOrders: readyOrders || 0,
      };
    } catch (error) {
      console.error("Error getting dashboard stats:", error);
      return {
        todayOrders: 0,
        weekOrders: 0,
        pendingOrders: 0,
        readyOrders: 0,
      };
    }
  }
}

export default OrderManagementService;




