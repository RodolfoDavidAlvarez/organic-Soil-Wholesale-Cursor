import { supabase } from "../db/supabase.js";
import { InventoryService } from "./inventoryService.js";

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

type NormalizedSizeOption = {
  key: string;
  label: string;
  price: number | null;
  price_cents: number | null;
  is_active: boolean;
  display_order?: number | null;
};

const parseMoneyCents = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.round(value);
  }

  if (typeof value === "string") {
    const numeric = Number.parseFloat(value.replace(/[^0-9.]/g, ""));
    if (Number.isFinite(numeric)) {
      return Math.round(numeric * 100);
    }
  }

  return null;
};

const normalizeSizePriceOptions = (input: unknown): NormalizedSizeOption[] => {
  let source: unknown = input;

  if (typeof source === "string") {
    try {
      source = JSON.parse(source);
    } catch {
      return [];
    }
  }

  if (!Array.isArray(source)) {
    return [];
  }

  return (source as unknown[])
    .map((option, index) => {
      if (!option || typeof option !== "object") {
        return null;
      }

      const record = option as Record<string, unknown>;

      const labelCandidate =
        typeof record.label === "string"
          ? record.label
          : typeof record.name === "string"
            ? record.name
            : typeof record.title === "string"
              ? record.title
              : typeof record.display_name === "string"
                ? record.display_name
                : typeof record.size === "string"
                  ? record.size
                  : "";

      const label = labelCandidate.trim();
      if (!label) {
        return null;
      }

      const keyCandidate =
        typeof record.key === "string"
          ? record.key
          : label.toLowerCase().replace(/[^a-z0-9]+/g, "-");

      const priceCents =
        parseMoneyCents(record.price_cents) ??
        parseMoneyCents(record.priceCents) ??
        parseMoneyCents(record.price) ??
        parseMoneyCents(record.amount) ??
        parseMoneyCents(record.value) ??
        parseMoneyCents(record.unit_price);

      const activeField =
        record.is_active ??
        record.isActive ??
        record.active ??
        record.enabled ??
        record.visible;

      const isActive =
        typeof activeField === "boolean"
          ? activeField
          : typeof activeField === "number"
            ? activeField !== 0
            : typeof activeField === "string"
              ? !["false", "0", "no", "off"].includes(activeField.toLowerCase())
              : true;

      const displayOrder =
        typeof record.display_order === "number"
          ? record.display_order
          : typeof record.displayOrder === "number"
            ? record.displayOrder
            : index;

      return {
        key: keyCandidate,
        label,
        price: priceCents !== null ? Number((priceCents / 100).toFixed(2)) : null,
        price_cents: priceCents,
        is_active: isActive,
        display_order: displayOrder,
      };
    })
    .filter((option): option is NormalizedSizeOption => Boolean(option));
};

const buildPriceMap = (options: NormalizedSizeOption[]) => {
  const map = new Map<string, number | null>();
  for (const option of options) {
    const key = option.label.toLowerCase();
    map.set(key, option.price);
  }
  return map;
};

const buildActiveSizeSet = (options: NormalizedSizeOption[]) => {
  const active = new Set<string>();
  for (const option of options) {
    if (option.is_active) {
      active.add(option.label.toLowerCase());
    }
  }
  return active;
};

const toArray = <T>(input: unknown): T[] => {
  if (Array.isArray(input)) {
    return input as T[];
  }
  if (typeof input === "string") {
    try {
      const parsed = JSON.parse(input);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  }
  return [];
};

const resolvePrimaryImage = (product: any) => {
  const additionalImages = toArray<string>(product.additional_images);
  return (
    product.texture_photo_url ||
    product.pay_and_pickup_hero_image ||
    product.image_url ||
    additionalImages[0] ||
    null
  );
};

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
    const sizeOptions = normalizeSizePriceOptions(product.size_price_options);
    const payload = {
      product_id: product.id,
      name: product.name,
      display_title: product.display_title,
      description: product.description,
      category: product.category,
      image_url: product.image_url ?? resolvePrimaryImage(product),
      texture_photo_url: product.texture_photo_url,
      pay_and_pickup_description: product.pay_and_pickup_description,
      pay_and_pickup_display_order: product.pay_and_pickup_display_order ?? 0,
      pay_and_pickup_hero_image: product.pay_and_pickup_hero_image ?? resolvePrimaryImage(product),
      pay_and_pickup_badge: product.pay_and_pickup_badge,
      is_pay_and_pickup_enabled: Boolean(product.is_pay_and_pickup_enabled),
      catalog_display_order: product.catalog_display_order ?? 0,
      is_catalog_enabled: product.is_catalog_enabled ?? true,
      active: product.is_catalog_enabled ?? true,
      size_price_options: sizeOptions,
      updated_at: new Date().toISOString(),
      marketing_title: product.marketing_title,
      marketing_note: product.marketing_note,
      seo_keywords: product.seo_keywords,
    };

    const { error } = await supabase.from("customer_portal_products").upsert(payload, {
      onConflict: "product_id",
    });

    if (error) {
      console.error("Failed to upsert customer_portal_products record:", error);
    } else {
      console.log(`Updated customer cache for product: ${product.name}`);
    }
  }

  /**
   * Update pay & pickup inventory when product settings change
   */
  private static async updatePayAndPickupInventory(product: any): Promise<void> {
    try {
      const sizeOptions = normalizeSizePriceOptions(product.size_price_options);
      const activeSizeSet = buildActiveSizeSet(sizeOptions);
      const priceMap = buildPriceMap(sizeOptions);

      if (!product.is_pay_and_pickup_enabled) {
        await InventoryService.deactivateMissingSizes({
          productId: product.id,
          activeSizes: new Set(),
        });
        return;
      }

      const existingInventory = await InventoryService.getProductInventory(product.id);

      const entries = sizeOptions
        .filter((option) => option.is_active)
        .map((option) => {
          const existing = existingInventory.find(
            (row) => row.size_option?.toLowerCase() === option.label.toLowerCase()
          );

          return {
            size_option: option.label,
            quantity_available: existing?.quantity_available ?? 50,
          };
        });

      if (entries.length === 0) {
        console.log(`No active size options found for product ${product.id}; skipping inventory sync`);
        return;
      }

      await InventoryService.upsertInventoryEntries({
        productId: product.id,
        entries,
        priceMap,
        activeSizes: activeSizeSet,
      });
    } catch (error) {
      console.error("Error updating pay & pickup inventory:", error);
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

