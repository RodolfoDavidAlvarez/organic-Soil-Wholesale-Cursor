import { Router } from "express";
import { supabase } from "../../supabaseClient";
import { tempAdminAuthMiddleware, AdminRequest } from "../../middleware/tempAdminAuth";
import { ProductSyncService } from "../../services/productSyncService.js";

const router = Router();

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

    const { data: product, error } = await supabase.from("products").select("*").eq("id", id).single();

    if (error) throw error;

    res.json(product);
  } catch (error) {
    console.error("Get product error:", error);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

// Create product
router.post("/", async (req: AdminRequest, res) => {
  try {
    const productData = req.body;

    const { data: product, error } = await supabase.from("products").insert(productData).select().single();

    if (error) throw error;

    // Sync product to customer portal
    try {
      await ProductSyncService.syncProductToCustomerPortal(product.id);
      console.log("✅ New product synced to customer portal");
    } catch (syncError) {
      console.error("⚠️ Product sync failed (non-critical):", syncError);
      // Don't fail the creation if sync fails
    }

    res.json(product);
  } catch (error) {
    console.error("Create product error:", error);
    res.status(500).json({ error: "Failed to create product" });
  }
});

// Update product
router.put("/:id", async (req: AdminRequest, res) => {
  try {
    const { id } = req.params;
    const productData = req.body;

    console.log("Updating product", id, "with data:", JSON.stringify(productData, null, 2));

    // Ensure additionalImages is properly formatted as an array
    if (productData.additionalImages !== undefined) {
      if (!Array.isArray(productData.additionalImages)) {
        productData.additionalImages = [];
      }
    }

    const { data: product, error } = await supabase.from("products").update(productData).eq("id", id).select().single();

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

    // Sync product to customer portal
    try {
      await ProductSyncService.syncProductToCustomerPortal(product.id);
      console.log("✅ Product synced to customer portal");
    } catch (syncError) {
      console.error("⚠️ Product sync failed (non-critical):", syncError);
      // Don't fail the update if sync fails
    }

    res.json(product);
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
