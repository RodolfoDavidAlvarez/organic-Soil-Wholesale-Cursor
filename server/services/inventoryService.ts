import { supabase } from "../db/supabase.js";

export interface InventoryRecord {
  id: number;
  product_id: number;
  location_id: number;
  size_option: string;
  quantity_available: number;
  quantity_reserved: number;
  price?: number | null;
  unit_price?: number | null;
  last_updated?: string | null;
}

export interface InventoryUpdateInput {
  size_option: string;
  quantity_available: number;
  location_id?: number;
}

const DEFAULT_LOCATION_ID = 1;

const normalizeSizeOption = (value: string) => value.trim();

const getSafeQuantity = (requested: number, reserved: number | null | undefined) => {
  const normalizedRequested = Number.isFinite(requested) ? requested : 0;
  const normalizedReserved = Number.isFinite(reserved ?? 0) ? Math.max(0, reserved ?? 0) : 0;

  if (normalizedRequested < normalizedReserved) {
    return normalizedReserved;
  }

  return Math.max(0, normalizedRequested);
};

export class InventoryService {
  /**
   * Fetch inventory entries for a product at a specific location.
   */
  static async getProductInventory(productId: number, locationId: number = DEFAULT_LOCATION_ID) {
    const { data, error } = await supabase
      .from("inventory")
      .select("*")
      .eq("product_id", productId)
      .eq("location_id", locationId)
      .order("size_option", { ascending: true });

    if (error) {
      console.error("Error fetching product inventory:", error);
      return [];
    }

    return data ?? [];
  }

  /**
   * Upsert inventory entries based on admin provided quantities.
   */
  static async upsertInventoryEntries(options: {
    productId: number;
    entries: InventoryUpdateInput[];
    priceMap?: Map<string, number | null>;
    activeSizes?: Set<string>;
    locationId?: number;
  }) {
    const { productId, entries, priceMap = new Map(), activeSizes = new Set(), locationId } = options;
    const targetLocationId = locationId ?? DEFAULT_LOCATION_ID;

    if (!productId || !Array.isArray(entries) || entries.length === 0) {
      return;
    }

    const { data: existingRows, error: existingError } = await supabase
      .from("inventory")
      .select("*")
      .eq("product_id", productId)
      .eq("location_id", targetLocationId);

    if (existingError) {
      console.error("Failed to load existing inventory rows:", existingError);
      return;
    }

    const existingBySize = new Map<string, InventoryRecord>();
    (existingRows ?? []).forEach((row) => {
      existingBySize.set(row.size_option?.toLowerCase() ?? "", row as InventoryRecord);
    });

    for (const entry of entries) {
      if (!entry || typeof entry.size_option !== "string") {
        continue;
      }

      const normalizedLabel = normalizeSizeOption(entry.size_option);
      if (!normalizedLabel) {
        continue;
      }

      const sizeKey = normalizedLabel.toLowerCase();
      const price = priceMap.get(sizeKey);

      const existing = existingBySize.get(sizeKey);
      const quantity = getSafeQuantity(entry.quantity_available, existing?.quantity_reserved);

      const payload: Record<string, any> = {
        quantity_available: quantity,
        last_updated: new Date().toISOString(),
      };

      if (price !== undefined) {
        payload.price = price;
        payload.unit_price = price;
      }

      if (existing) {
        const { error: updateError } = await supabase
          .from("inventory")
          .update(payload)
          .eq("id", existing.id);

        if (updateError) {
          console.error(`Failed to update inventory for ${normalizedLabel}:`, updateError);
        }
      } else {
        const insertPayload = {
          product_id: productId,
          location_id: targetLocationId,
          size_option: normalizedLabel,
          quantity_available: quantity,
          quantity_reserved: 0,
          price: price ?? 0,
          unit_price: price ?? 0,
          last_updated: new Date().toISOString(),
        };

        const { error: insertError } = await supabase.from("inventory").insert(insertPayload);

        if (insertError) {
          console.error(`Failed to insert inventory for ${normalizedLabel}:`, insertError);
        }
      }
    }

    await InventoryService.deactivateMissingSizes({
      productId,
      locationId: targetLocationId,
      activeSizes,
    });

    await InventoryService.recalculateProductStock(productId);
  }

  /**
   * Set quantity to zero for inventory rows no longer active.
   */
  static async deactivateMissingSizes(params: {
    productId: number;
    locationId?: number;
    activeSizes: Set<string>;
  }) {
    const { productId, locationId, activeSizes } = params;
    const targetLocationId = locationId ?? DEFAULT_LOCATION_ID;

    const { data: rows, error } = await supabase
      .from("inventory")
      .select("id, size_option")
      .eq("product_id", productId)
      .eq("location_id", targetLocationId);

    if (error) {
      console.error("Failed to fetch inventory rows for deactivation:", error);
      return;
    }

    for (const row of rows ?? []) {
      const label = typeof row.size_option === "string" ? row.size_option.toLowerCase() : "";
      if (!label || activeSizes.has(label)) {
        continue;
      }

      const { error: updateError } = await supabase
        .from("inventory")
        .update({
          quantity_available: 0,
          last_updated: new Date().toISOString(),
        })
        .eq("id", row.id);

      if (updateError) {
        console.error(`Failed to deactivate inventory size ${row.size_option}:`, updateError);
      }
    }
  }

  /**
   * Recalculate product stock quantity from inventory totals.
   */
  static async recalculateProductStock(productId: number) {
    const { data, error } = await supabase
      .from("inventory")
      .select("quantity_available")
      .eq("product_id", productId);

    if (error) {
      console.error("Failed to recalculate product stock:", error);
      return;
    }

    const total = (data ?? []).reduce((sum, row) => sum + (row.quantity_available ?? 0), 0);

    const { error: updateError } = await supabase
      .from("products")
      .update({
        stock_quantity: total,
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId);

    if (updateError) {
      console.error("Failed to update product stock quantity:", updateError);
    }
  }
}

