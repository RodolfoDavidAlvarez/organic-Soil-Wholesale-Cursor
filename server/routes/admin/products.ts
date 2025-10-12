import { Router } from "express";
import { supabase } from "../../supabaseClient";
import { tempAdminAuthMiddleware, AdminRequest } from "../../middleware/tempAdminAuth";

const router = Router();

// Apply admin auth to all routes
router.use(tempAdminAuthMiddleware);

// Get all products
router.get("/", async (req: AdminRequest, res) => {
  try {
    const { data: products, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });

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

    const { data: product, error } = await supabase.from("products").update(productData).eq("id", id).select().single();

    if (error) throw error;

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
    const { updates } = req.body; // Array of { id, stock }

    const promises = updates.map((update: any) => supabase.from("products").update({ stock: update.stock }).eq("id", update.id));

    await Promise.all(promises);

    res.json({ success: true, updated: updates.length });
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
    const { data, error } = await supabase
      .from("products")
      .update(updates)
      .in("id", productIds)
      .select();

    if (error) throw error;

    res.json({ 
      success: true, 
      updated: data?.length || 0,
      products: data 
    });
  } catch (error) {
    console.error("Bulk update error:", error);
    res.status(500).json({ error: "Failed to bulk update products" });
  }
});

export default router;
