import { Router } from "express";
import { supabase } from "../../supabaseClient";
import { tempAdminAuthMiddleware, AdminRequest } from "../../middleware/tempAdminAuth";
import { ProductSyncService } from "../../services/productSyncService.js";
import { InventoryService, type InventoryUpdateInput } from "../../services/inventoryService.js";

const router = Router();

const parseQuantity = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.round(value));
  }

  if (typeof value === "string") {
    const cleaned = value.trim();
    if (!cleaned) {
      return null;
    }
    const parsed = Number.parseInt(cleaned, 10);
    if (Number.isFinite(parsed)) {
      return Math.max(0, parsed);
    }
  }

  return null;
};

const parseInventoryUpdates = (input: unknown): InventoryUpdateInput[] => {
  if (!Array.isArray(input)) {
    return [];
  }

  const updates: InventoryUpdateInput[] = [];

  for (const entry of input) {
    if (!entry || typeof entry !== "object") {
      continue;
    }

    const record = entry as Record<string, unknown>;
    const rawLabel =
      typeof record.size_option === "string"
        ? record.size_option
        : typeof record.sizeOption === "string"
          ? record.sizeOption
          : typeof record.label === "string"
            ? record.label
            : typeof record.name === "string"
              ? record.name
              : "";

    const label = rawLabel.trim();
    if (!label) {
      continue;
    }

    const quantity =
      parseQuantity(record.quantity_available) ??
      parseQuantity(record.quantityAvailable) ??
      parseQuantity(record.quantity) ??
      parseQuantity(record.stock);

    if (quantity === null) {
      continue;
    }

    const locationId =
      typeof record.location_id === "number"
        ? record.location_id
        : typeof record.locationId === "number"
          ? record.locationId
          : undefined;

    updates.push({
      size_option: label,
      quantity_available: quantity,
      location_id: locationId,
    });
  }

  return updates;
};

const extractSizeOptionMeta = (raw: unknown) => {
  let source: unknown = raw;

  if (typeof source === "string") {
    try {
      source = JSON.parse(source);
    } catch {
      source = [];
    }
  }

  if (!Array.isArray(source)) {
    return {
      priceMap: new Map<string, number | null>(),
      activeSizes: new Set<string>(),
    };
  }

  const priceMap = new Map<string, number | null>();
  const activeSizes = new Set<string>();

  for (const option of source) {
    if (!option || typeof option !== "object") {
      continue;
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
              : "";

    const label = labelCandidate.trim();
    if (!label) {
      continue;
    }

    const lowerLabel = label.toLowerCase();

    if (!priceMap.has(lowerLabel)) {
      const directNumberFields = ["price", "unit_price", "unitPrice"];
      let resolvedPrice: number | null = null;

      for (const field of directNumberFields) {
        const value = record[field];
        if (typeof value === "number" && Number.isFinite(value)) {
          resolvedPrice = value;
          break;
        }
      }

      if (resolvedPrice === null) {
        const centFields = ["price_cents", "priceCents"];
        for (const field of centFields) {
          const value = record[field];
          if (typeof value === "number" && Number.isFinite(value)) {
            resolvedPrice = Number((value / 100).toFixed(2));
            break;
          }
        }
      }

      if (resolvedPrice === null) {
        const stringFields = ["price", "price_cents", "priceCents", "unit_price", "unitPrice"];
        for (const field of stringFields) {
          const rawValue = record[field];
          if (typeof rawValue === "string") {
            const parsed = Number.parseFloat(rawValue.replace(/[^0-9.]/g, ""));
            if (Number.isFinite(parsed)) {
              resolvedPrice = parsed;
              break;
            }
          }
        }
      }

      priceMap.set(lowerLabel, resolvedPrice);
    }

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
            ? !["false", "0", "no", "off", "hidden"].includes(activeField.toLowerCase())
            : true;

    if (isActive) {
      activeSizes.add(lowerLabel);
    }
  }

  return { priceMap, activeSizes };
};


// Apply admin auth to all routes
router.use(tempAdminAuthMiddleware);

// Get all products
router.get("/", async (req: AdminRequest, res) => {
  try {
    const { data: products, error } = await supabase
      .from("products")
      .select("*")
      .order("pay_and_pickup_display_order", { ascending: true, nullsFirst: true })
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json(products || []);
  } catch (error) {
    console.error("Get products error:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// Get single product
router.get("/:id", async (req: AdminRequest, res) => {
  try {
    const { id } = req.params;
    const productId = Number(id);

    if (!Number.isFinite(productId)) {
      return res.status(400).json({ error: "Invalid product ID" });
    }

    const { data: product, error } = await supabase.from("products").select("*").eq("id", productId).single();

    if (error) throw error;

    const inventory = await InventoryService.getProductInventory(productId);

    res.json({
      ...product,
      inventory,
    });
  } catch (error) {
    console.error("Get product error:", error);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

// Create product
router.post("/", async (req: AdminRequest, res) => {
  try {
    const { inventory_updates, ...remaining } = (req.body ?? {}) as Record<string, unknown>;
    const inventoryUpdates = parseInventoryUpdates(inventory_updates);
    const productPayload = { ...remaining } as Record<string, unknown>;

    if (productPayload.additionalImages !== undefined && !Array.isArray(productPayload.additionalImages)) {
      productPayload.additionalImages = [];
    }

    if (productPayload.additional_images !== undefined && !Array.isArray(productPayload.additional_images)) {
      productPayload.additional_images = [];
    }

    const { data: product, error } = await supabase.from("products").insert(productPayload).select().single();

    if (error) throw error;

    if (product && inventoryUpdates.length > 0) {
      const { priceMap, activeSizes } = extractSizeOptionMeta(product.size_price_options);
      await InventoryService.upsertInventoryEntries({
        productId: product.id,
        entries: inventoryUpdates,
        priceMap,
        activeSizes,
      });
    }

    // Sync product to customer portal
    try {
      await ProductSyncService.syncProductToCustomerPortal(product.id);
      console.log("✅ New product synced to customer portal");
    } catch (syncError) {
      console.error("⚠️ Product sync failed (non-critical):", syncError);
      // Don't fail the creation if sync fails
    }

    const inventory = product ? await InventoryService.getProductInventory(product.id) : [];

    res.json(product ? { ...product, inventory } : product);
  } catch (error) {
    console.error("Create product error:", error);
    res.status(500).json({ error: "Failed to create product" });
  }
});

// Update product
router.put("/:id", async (req: AdminRequest, res) => {
  try {
    const { id } = req.params;
    const { inventory_updates, ...remaining } = (req.body ?? {}) as Record<string, unknown>;
    const inventoryUpdates = parseInventoryUpdates(inventory_updates);
    const productPayload = { ...remaining } as Record<string, any>;

    console.log("Updating product", id, "with data:", JSON.stringify(remaining, null, 2));

    // Ensure additionalImages is properly formatted as an array
    if (productPayload.additionalImages !== undefined && !Array.isArray(productPayload.additionalImages)) {
      productPayload.additionalImages = [];
    }

    if (productPayload.additional_images !== undefined && !Array.isArray(productPayload.additional_images)) {
      productPayload.additional_images = [];
    }

    const { data: product, error } = await supabase.from("products").update(productPayload).eq("id", id).select().single();

    if (error) {
      console.error("Update product error:", error);
      return res.status(400).json({
        error: "Failed to update product",
        details: error.message,
        hint: error.hint,
        code: error.code,
      });
    }

    console.log("✅ Product updated successfully:", product.id);

    if (product && inventoryUpdates.length > 0) {
      const { priceMap, activeSizes } = extractSizeOptionMeta(product.size_price_options);
      await InventoryService.upsertInventoryEntries({
        productId: product.id,
        entries: inventoryUpdates,
        priceMap,
        activeSizes,
      });
    }

    // Sync product to customer portal
    try {
      await ProductSyncService.syncProductToCustomerPortal(product.id);
      console.log("✅ Product synced to customer portal");
    } catch (syncError) {
      console.error("⚠️ Product sync failed (non-critical):", syncError);
      // Don't fail the update if sync fails
    }

    const inventory = await InventoryService.getProductInventory(product.id);

    res.json({
      ...product,
      inventory,
    });
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({ error: "Failed to update product" });
  }
});

// Delete product
router.delete("/:id", async (req: AdminRequest, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

// Bulk update stock
router.post("/bulk-stock-update", async (req: AdminRequest, res) => {
  try {
    const { updates } = req.body; // Array of { id, stock_quantity?, stock? }

    if (!Array.isArray(updates)) {
      return res.status(400).json({ error: "Updates payload must be an array" });
    }

    const normalizedUpdates = updates
      .map((update: any) => {
        const id = update?.id;
        const quantityInput = update?.stock_quantity ?? update?.stock;
        const parsedQuantity =
          typeof quantityInput === "number"
            ? quantityInput
            : typeof quantityInput === "string" && quantityInput.trim().length > 0
              ? Number.parseInt(quantityInput, 10)
              : null;

        if (!id || parsedQuantity === null || Number.isNaN(parsedQuantity)) {
          return null;
        }

        return { id, quantity: parsedQuantity };
      })
      .filter((item): item is { id: string | number; quantity: number } => Boolean(item));

    if (normalizedUpdates.length === 0) {
      return res.json({ success: true, updated: 0 });
    }

    const results = await Promise.all(
      normalizedUpdates.map(({ id, quantity }) => supabase.from("products").update({ stock_quantity: quantity }).eq("id", id))
    );

    const failed = results.find((result) => result?.error);
    if (failed?.error) {
      throw failed.error;
    }

    res.json({ success: true, updated: normalizedUpdates.length });
  } catch (error) {
    console.error("Bulk stock update error:", error);
    res.status(500).json({ error: "Failed to update stock" });
  }
});

// Bulk update products
router.post("/bulk-update", async (req: AdminRequest, res) => {
  try {
    const { productIds, updates } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ error: "Invalid product IDs" });
    }

    if (!updates || typeof updates !== "object") {
      return res.status(400).json({ error: "Invalid updates" });
    }

    // Update all products with the given IDs
    const { data, error } = await supabase.from("products").update(updates).in("id", productIds).select();

    if (error) throw error;

    res.json({
      success: true,
      updated: data?.length || 0,
      products: data,
    });
  } catch (error) {
    console.error("Bulk update error:", error);
    res.status(500).json({ error: "Failed to bulk update products" });
  }
});

export default router;
