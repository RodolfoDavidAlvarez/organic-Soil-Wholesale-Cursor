import { Router } from "express";
import { ProductSyncService } from "../services/productSyncService.js";

const router = Router();

/**
 * Sync a specific product to customer portal
 * POST /api/product-sync/:productId
 */
router.post("/:productId", async (req, res) => {
  try {
    const productId = parseInt(req.params.productId);

    if (isNaN(productId)) {
      return res.status(400).json({ error: "Invalid product ID" });
    }

    await ProductSyncService.syncProductToCustomerPortal(productId);

    res.json({
      success: true,
      message: `Product ${productId} synced to customer portal`,
    });
  } catch (error) {
    console.error("Product sync error:", error);
    res.status(500).json({ error: "Failed to sync product" });
  }
});

/**
 * Sync all products to customer portal
 * POST /api/product-sync/all
 */
router.post("/all", async (req, res) => {
  try {
    await ProductSyncService.syncAllProducts();

    res.json({
      success: true,
      message: "All products synced to customer portal",
    });
  } catch (error) {
    console.error("Bulk product sync error:", error);
    res.status(500).json({ error: "Failed to sync all products" });
  }
});

/**
 * Get products for customer portal
 * GET /api/product-sync/customer-products
 */
router.get("/customer-products", async (req, res) => {
  try {
    const { category, payAndPickup, search } = req.query;

    const filters = {
      category: category as string,
      payAndPickup: payAndPickup === "true",
      search: search as string,
    };

    const products = await ProductSyncService.getCustomerProducts(filters);

    res.json({
      success: true,
      products,
    });
  } catch (error) {
    console.error("Get customer products error:", error);
    res.status(500).json({ error: "Failed to fetch customer products" });
  }
});

/**
 * Invalidate customer product cache
 * POST /api/product-sync/invalidate-cache
 */
router.post("/invalidate-cache", async (req, res) => {
  try {
    await ProductSyncService.invalidateCustomerCache();

    res.json({
      success: true,
      message: "Customer product cache invalidated",
    });
  } catch (error) {
    console.error("Cache invalidation error:", error);
    res.status(500).json({ error: "Failed to invalidate cache" });
  }
});

export default router;




