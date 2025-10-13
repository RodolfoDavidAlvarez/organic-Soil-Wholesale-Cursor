import { supabase } from "../db/supabase.js";

export interface ProductSyncData {
  id: number;
  name: string;
  display_title?: string;
  description?: string;
  image_url?: string;
  texture_photo_url?: string;
  is_pay_and_pickup_enabled: boolean;
  pay_and_pickup_description?: string;
  pay_and_pickup_display_order?: number;
  size_price_options?: Array<{
    key: string;
    label: string;
    price: string;
    isActive: boolean;
  }>;
  active: boolean;
  updated_at: string;
}

export class ProductSyncService {
  /**
   * Sync product data from admin updates to customer-facing systems
   */
  static async syncProductToCustomerPortal(productId: number): Promise<void> {
    try {
      // Get the updated product from admin
      const { data: product, error } = await supabase.from("products").select("*").eq("id", productId).single();

      if (error || !product) {
        console.error("Error fetching product for sync:", error);
        return;
      }

      // Update the customer-facing product cache/API
      await this.updateCustomerProductCache(product);

      // Update inventory if product is enabled for pay & pickup
      if (product.is_pay_and_pickup_enabled) {
        await this.updatePayAndPickupInventory(product);
      }

      console.log(`Product ${productId} synced to customer portal`);
    } catch (error) {
      console.error("Error syncing product to customer portal:", error);
    }
  }

  /**
   * Update the customer product cache with latest admin data
   */
  private static async updateCustomerProductCache(product: any): Promise<void> {
    // This could update a Redis cache, CDN cache, or trigger a rebuild
    // For now, we'll just log the update
    console.log(`Updating customer cache for product: ${product.name}`);

    // In a production system, you might:
    // 1. Update a Redis cache
    // 2. Trigger a CDN cache invalidation
    // 3. Update a search index
    // 4. Send a webhook to external systems
  }

  /**
   * Update pay & pickup inventory when product settings change
   */
  private static async updatePayAndPickupInventory(product: any): Promise<void> {
    try {
      // Check if inventory entries exist for this product
      const { data: existingInventory, error: inventoryError } = await supabase
        .from("inventory")
        .select("id, size_option")
        .eq("product_id", product.id)
        .eq("location_id", 1); // Phoenix warehouse

      if (inventoryError) {
        console.error("Error checking inventory:", inventoryError);
        return;
      }

      // If product is enabled for pay & pickup but no inventory exists, create it
      if (product.is_pay_and_pickup_enabled && (!existingInventory || existingInventory.length === 0)) {
        await this.createDefaultInventoryEntries(product);
      }
    } catch (error) {
      console.error("Error updating pay & pickup inventory:", error);
    }
  }

  /**
   * Create default inventory entries for pay & pickup products
   */
  private static async createDefaultInventoryEntries(product: any): Promise<void> {
    if (!product.size_price_options || product.size_price_options.length === 0) {
      console.log(`No size options found for product ${product.id}, skipping inventory creation`);
      return;
    }

    const inventoryEntries = product.size_price_options
      .filter((option: any) => option.isActive && option.price)
      .map((option: any) => ({
        product_id: product.id,
        location_id: 1, // Phoenix warehouse
        size_option: option.label,
        quantity_available: 50, // Default stock
        quantity_reserved: 0,
        unit_price: parseFloat(option.price) || 0,
        last_updated: new Date().toISOString(),
      }));

    if (inventoryEntries.length > 0) {
      const { error } = await supabase.from("inventory").insert(inventoryEntries);

      if (error) {
        console.error("Error creating inventory entries:", error);
      } else {
        console.log(`Created ${inventoryEntries.length} inventory entries for product ${product.id}`);
      }
    }
  }

  /**
   * Sync all products (useful for initial setup or bulk updates)
   */
  static async syncAllProducts(): Promise<void> {
    try {
      const { data: products, error } = await supabase.from("products").select("id").eq("active", true);

      if (error) {
        console.error("Error fetching products for sync:", error);
        return;
      }

      if (!products || products.length === 0) {
        console.log("No products found to sync");
        return;
      }

      console.log(`Syncing ${products.length} products to customer portal...`);

      // Sync each product
      for (const product of products) {
        await this.syncProductToCustomerPortal(product.id);
      }

      console.log("All products synced successfully");
    } catch (error) {
      console.error("Error syncing all products:", error);
    }
  }

  /**
   * Get products for customer portal with optimized data
   */
  static async getCustomerProducts(filters?: { category?: string; payAndPickup?: boolean; search?: string }): Promise<ProductSyncData[]> {
    try {
      let query = supabase
        .from("products")
        .select(
          `
          id,
          name,
          display_title,
          description,
          image_url,
          texture_photo_url,
          is_pay_and_pickup_enabled,
          pay_and_pickup_description,
          pay_and_pickup_display_order,
          size_price_options,
          active,
          updated_at
        `
        )
        .eq("active", true);

      if (filters?.payAndPickup) {
        query = query.eq("is_pay_and_pickup_enabled", true);
      }

      if (filters?.category) {
        query = query.eq("category", filters.category);
      }

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { data: products, error } = await query
        .order("pay_and_pickup_display_order", { ascending: true, nullsFirst: true })
        .order("name", { ascending: true });

      if (error) {
        console.error("Error fetching customer products:", error);
        return [];
      }

      return products || [];
    } catch (error) {
      console.error("Error getting customer products:", error);
      return [];
    }
  }

  /**
   * Invalidate customer product cache
   */
  static async invalidateCustomerCache(): Promise<void> {
    // In a production system, this would:
    // 1. Clear Redis cache
    // 2. Invalidate CDN cache
    // 3. Update search indexes
    // 4. Send cache invalidation webhooks

    console.log("Customer product cache invalidated");
  }
}

export default ProductSyncService;
