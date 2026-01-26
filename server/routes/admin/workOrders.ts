/**
 * Work Orders System API
 * Create, manage, and generate PDF Work Orders
 */

import { Router } from "express";
import { supabase } from "../../supabaseClient.js";
import { adminAuthMiddleware, AdminRequest } from "../../middleware/adminAuth.js";
import { AirtableSyncService } from "../../services/airtableSyncService.js";
import puppeteer from "puppeteer";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Apply auth middleware to all routes except PDF endpoint
router.use((req, res, next) => {
  if (req.path.includes("/pdf")) {
    return next();
  }
  return adminAuthMiddleware(req, res, next);
});

/**
 * Generate Work Order number (WO-YYYYMMDD-NNN)
 */
async function generateWONumber(): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().split("T")[0].replace(/-/g, "");

  const { count, error } = await supabase
    .from("ops_work_orders")
    .select("id", { count: "exact", head: true })
    .gte("created_at", `${today.toISOString().split("T")[0]}T00:00:00`)
    .lte("created_at", `${today.toISOString().split("T")[0]}T23:59:59`);

  if (error) throw error;

  const sequence = ((count || 0) + 1).toString().padStart(3, "0");
  return `WO-${dateStr}-${sequence}`;
}

/**
 * GET /api/admin/operations/work-orders/products
 * Get products from cache (or Airtable)
 * NOTE: Must be defined BEFORE /:id route
 */
router.get("/products", async (req: AdminRequest, res) => {
  try {
    const products = await AirtableSyncService.getCachedProducts();
    res.json(products);
  } catch (error: any) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: error.message || "Failed to fetch products" });
  }
});

/**
 * GET /api/admin/operations/work-orders/size-categories
 * Get size categories from cache
 * NOTE: Must be defined BEFORE /:id route
 */
router.get("/size-categories", async (req: AdminRequest, res) => {
  try {
    const categories = await AirtableSyncService.getCachedSizeCategories();
    res.json(categories);
  } catch (error: any) {
    console.error("Error fetching size categories:", error);
    res.status(500).json({ message: error.message || "Failed to fetch size categories" });
  }
});

/**
 * POST /api/admin/operations/work-orders/sync-products
 * Force sync products from Airtable
 * NOTE: Must be defined BEFORE /:id route
 */
router.post("/sync-products", async (req: AdminRequest, res) => {
  try {
    const result = await AirtableSyncService.syncAll();
    res.json({
      success: true,
      products: result.products,
      sizeCategories: result.sizeCategories,
    });
  } catch (error: any) {
    console.error("Error syncing from Airtable:", error);
    res.status(500).json({ message: error.message || "Failed to sync from Airtable" });
  }
});

/**
 * POST /api/admin/operations/work-orders/calculate-mix
 * AI-generate mixing guidelines
 * NOTE: Must be defined BEFORE /:id route
 */
router.post("/calculate-mix", async (req: AdminRequest, res) => {
  try {
    const { productName, ingredientRatios, sizeCategory, sizeCategoryName, unitsPerPallet, estimatedPalletWeight, quantity, quantityType } = req.body;

    // Parse estimated pallet weight (remove commas and "lbs")
    const palletWeightLbs = estimatedPalletWeight
      ? parseFloat(estimatedPalletWeight.replace(/,/g, "").replace(/\s*lbs?/i, ""))
      : 0;

    // Calculate total weight
    let totalWeight = 0;
    let palletConfig = "";

    if (quantityType === "pallet" && palletWeightLbs > 0) {
      totalWeight = quantity * palletWeightLbs;
      palletConfig = `${quantity} pallet${quantity > 1 ? "s" : ""} x ${estimatedPalletWeight} = ${totalWeight.toLocaleString()} lbs`;
    } else if (quantityType === "unit" && unitsPerPallet > 0 && palletWeightLbs > 0) {
      const weightPerUnit = palletWeightLbs / unitsPerPallet;
      totalWeight = quantity * weightPerUnit;
      palletConfig = `${quantity} unit${quantity > 1 ? "s" : ""} @ ~${Math.round(weightPerUnit)} lbs each = ${Math.round(totalWeight).toLocaleString()} lbs`;
    }

    // Parse ingredient ratios and calculate breakdown
    let ingredientBreakdown = "";
    if (ingredientRatios && totalWeight > 0) {
      const ratioLines: string[] = [];

      // Try to parse percentage-based ratios like "60% Dan's Gold, 30% Worm Castings, 10% Perlite"
      // or "100% Worm Castings"
      const ratioMatch = ingredientRatios.match(/(\d+)%\s*([^,]+)/g);

      if (ratioMatch) {
        for (const match of ratioMatch) {
          const [, percent, ingredient] = match.match(/(\d+)%\s*(.+)/) || [];
          if (percent && ingredient) {
            const percentage = parseInt(percent);
            const weight = Math.round((percentage / 100) * totalWeight);
            ratioLines.push(`- ${ingredient.trim()}: ${percentage}% → ${weight.toLocaleString()} lbs`);
          }
        }
        ingredientBreakdown = ratioLines.join("\n");
      } else {
        ingredientBreakdown = `- ${ingredientRatios}: 100% → ${Math.round(totalWeight).toLocaleString()} lbs`;
      }
    }

    // Build mixing guidelines text
    const guidelines = `Pallet configuration: ${sizeCategoryName || sizeCategory}${
      unitsPerPallet ? `, ${unitsPerPallet} units per pallet` : ""
    }

${palletConfig ? `Total estimated final weight: ${palletConfig}` : ""}

${ingredientBreakdown ? `Ingredient breakdown:\n${ingredientBreakdown}` : ""}

Total anticipated product weight: ${Math.round(totalWeight).toLocaleString()} lbs`.trim();

    res.json({
      mixingGuidelines: guidelines,
      totalWeightLbs: Math.round(totalWeight),
    });
  } catch (error: any) {
    console.error("Error calculating mix:", error);
    res.status(500).json({ message: error.message || "Failed to calculate mixing guidelines" });
  }
});

/**
 * POST /api/admin/operations/work-orders/delete
 * Delete one or more work orders
 * NOTE: Must be defined BEFORE /:id route
 */
router.post("/delete", async (req: AdminRequest, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No IDs provided" });
    }

    const { error } = await supabase.from("ops_work_orders").delete().in("id", ids);

    if (error) throw error;

    res.json({ success: true, deleted: ids.length });
  } catch (error: any) {
    console.error("Error deleting work orders:", error);
    res.status(500).json({ message: error.message || "Failed to delete work orders" });
  }
});

/**
 * GET /api/admin/operations/work-orders
 * List all work orders with filters
 */
router.get("/", async (req: AdminRequest, res) => {
  try {
    const { status, dateFilter, search } = req.query;

    let query = supabase
      .from("ops_work_orders")
      .select("*")
      .order("created_at", { ascending: false });

    // Apply status filter
    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    // Apply date filter
    if (dateFilter && dateFilter !== "all") {
      const now = new Date();
      let startDate = new Date();

      switch (dateFilter) {
        case "today":
          startDate.setHours(0, 0, 0, 0);
          break;
        case "week":
          startDate.setDate(now.getDate() - 7);
          break;
        case "month":
          startDate.setMonth(now.getMonth() - 1);
          break;
        case "3months":
          startDate.setMonth(now.getMonth() - 3);
          break;
      }

      query = query.gte("created_at", startDate.toISOString());
    }

    const { data, error } = await query;

    if (error) throw error;

    // Apply search filter client-side (Supabase doesn't support OR across multiple columns easily)
    let filteredData = data || [];
    if (search && typeof search === "string" && search.trim()) {
      const searchLower = search.toLowerCase().trim();
      filteredData = filteredData.filter(
        (wo) =>
          wo.wo_number?.toLowerCase().includes(searchLower) ||
          wo.product_name?.toLowerCase().includes(searchLower) ||
          wo.product_id?.toLowerCase().includes(searchLower)
      );
    }

    res.json(filteredData);
  } catch (error: any) {
    console.error("Error fetching work orders:", error);
    res.status(500).json({ message: error.message || "Failed to fetch work orders" });
  }
});

/**
 * POST /api/admin/operations/work-orders
 * Create a new work order
 */
router.post("/", async (req: AdminRequest, res) => {
  try {
    const {
      productType,
      productName,
      productId,
      airtableProductId,
      sizeCategory,
      sizeCategoryName,
      unitsPerPallet,
      estimatedPalletWeight,
      quantity,
      quantityType,
      ingredientRatios,
      ingredientsList,
      mixingGuidelines,
      totalWeightLbs,
      customNotes,
      needsTransportation,
      destinationAddress,
      destinationCity,
      destinationState,
      destinationZip,
      preferredDeliveryDate,
      preferredDeliveryTime,
      linkedBolId,
      priority,
      orderType,
      createdByName,
      createdByEmail,
    } = req.body;

    // Validation
    if (!sizeCategory) {
      return res.status(400).json({ message: "Size category is required" });
    }

    if (!quantity || quantity < 1) {
      return res.status(400).json({ message: "Quantity must be at least 1" });
    }

    // Generate WO number
    const woNumber = await generateWONumber();

    // Use provided name/email or fall back to admin info from token
    const createdBy = createdByName || req.adminEmail || "Operations Team";
    const creatorEmail = createdByEmail || req.adminEmail || "operations@soilseedandwater.com";

    // Insert work order
    const { data, error } = await supabase
      .from("ops_work_orders")
      .insert({
        wo_number: woNumber,
        product_type: productType || "standard",
        product_name: productName,
        product_id: productId,
        airtable_product_id: airtableProductId,
        size_category: sizeCategory,
        size_category_name: sizeCategoryName,
        units_per_pallet: unitsPerPallet,
        estimated_pallet_weight: estimatedPalletWeight,
        quantity: parseInt(quantity),
        quantity_type: quantityType || "pallet",
        ingredient_ratios: ingredientRatios,
        ingredients_list: ingredientsList,
        mixing_guidelines: mixingGuidelines,
        total_weight_lbs: totalWeightLbs ? parseFloat(totalWeightLbs) : null,
        custom_notes: customNotes,
        needs_transportation: needsTransportation || false,
        destination_address: destinationAddress,
        destination_city: destinationCity,
        destination_state: destinationState,
        destination_zip: destinationZip,
        preferred_delivery_date: preferredDeliveryDate || null,
        preferred_delivery_time: preferredDeliveryTime,
        linked_bol_id: linkedBolId || null,
        status: "pending",
        priority: priority || "normal",
        order_type: orderType || "wholesale",
        created_by: createdBy,
        created_by_email: creatorEmail,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error: any) {
    console.error("Error creating work order:", error);
    res.status(500).json({ message: error.message || "Failed to create work order" });
  }
});

/**
 * GET /api/admin/operations/work-orders/:id
 * Get a single work order by ID
 */
router.get("/:id", async (req: AdminRequest, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("ops_work_orders")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ message: "Work order not found" });
    }

    res.json(data);
  } catch (error: any) {
    console.error("Error fetching work order:", error);
    res.status(500).json({ message: error.message || "Failed to fetch work order" });
  }
});

/**
 * PATCH /api/admin/operations/work-orders/:id
 * Update a work order
 */
router.patch("/:id", async (req: AdminRequest, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Convert camelCase to snake_case
    const snakeCaseUpdates: Record<string, any> = {};
    const fieldMap: Record<string, string> = {
      productType: "product_type",
      productName: "product_name",
      productId: "product_id",
      airtableProductId: "airtable_product_id",
      sizeCategory: "size_category",
      sizeCategoryName: "size_category_name",
      unitsPerPallet: "units_per_pallet",
      estimatedPalletWeight: "estimated_pallet_weight",
      quantityType: "quantity_type",
      ingredientRatios: "ingredient_ratios",
      ingredientsList: "ingredients_list",
      mixingGuidelines: "mixing_guidelines",
      totalWeightLbs: "total_weight_lbs",
      customNotes: "custom_notes",
      needsTransportation: "needs_transportation",
      destinationAddress: "destination_address",
      destinationCity: "destination_city",
      destinationState: "destination_state",
      destinationZip: "destination_zip",
      preferredDeliveryDate: "preferred_delivery_date",
      preferredDeliveryTime: "preferred_delivery_time",
      linkedBolId: "linked_bol_id",
    };

    for (const [key, value] of Object.entries(updates)) {
      const snakeKey = fieldMap[key] || key;
      snakeCaseUpdates[snakeKey] = value;
    }

    snakeCaseUpdates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("ops_work_orders")
      .update(snakeCaseUpdates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ message: "Work order not found" });
    }

    res.json(data);
  } catch (error: any) {
    console.error("Error updating work order:", error);
    res.status(500).json({ message: error.message || "Failed to update work order" });
  }
});

/**
 * GET /api/admin/operations/work-orders/:id/pdf
 * Generate and download Work Order PDF
 */
/**
 * GET /:id/pdf - Generate PDF for work order
 * Query params:
 *   - token: JWT auth token (required)
 *   - type: 'workorder' | 'label' | 'both' (default: 'workorder')
 */
router.get("/:id/pdf", async (req: AdminRequest, res) => {
  try {
    // Verify token from query param
    const token = req.query.token as string;
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    try {
      jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const { id } = req.params;
    const pdfType = (req.query.type as string) || "workorder"; // 'workorder', 'label', or 'both'

    // Fetch work order data
    const { data: wo, error } = await supabase
      .from("ops_work_orders")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    if (!wo) {
      return res.status(404).json({ message: "Work order not found" });
    }

    // Get illustration URL and load as base64 if exists
    let illustrationBase64 = null;
    if (wo.product_id) {
      const { data: product } = await supabase
        .from("ops_products_cache")
        .select("illustration_url")
        .eq("product_id", wo.product_id)
        .single();

      if (product?.illustration_url) {
        const isProduction = process.env.VERCEL === "1" || process.env.NODE_ENV === "production";

        if (isProduction) {
          // In Vercel/production, fetch image via HTTP from public URL
          try {
            const baseUrl = process.env.VERCEL_URL
              ? `https://${process.env.VERCEL_URL}`
              : "https://organicsoilwholesale.com";
            const imageUrl = `${baseUrl}${product.illustration_url}`;
            console.log("Fetching illustration from:", imageUrl);

            const imageResponse = await fetch(imageUrl);
            if (imageResponse.ok) {
              const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
              const ext = path.extname(product.illustration_url).slice(1);
              const mimeType = ext === "webp" ? "image/webp" : ext === "png" ? "image/png" : "image/jpeg";
              illustrationBase64 = `data:${mimeType};base64,${imageBuffer.toString("base64")}`;
            } else {
              console.warn("Failed to fetch illustration:", imageResponse.status);
            }
          } catch (imgError) {
            console.warn("Could not fetch illustration:", imgError);
          }
        } else {
          // In development, use filesystem
          const illustrationPath = path.join(__dirname, "../../../client/public", product.illustration_url);
          try {
            if (fs.existsSync(illustrationPath)) {
              const imageBuffer = fs.readFileSync(illustrationPath);
              const ext = path.extname(illustrationPath).slice(1);
              const mimeType = ext === "webp" ? "image/webp" : ext === "png" ? "image/png" : "image/jpeg";
              illustrationBase64 = `data:${mimeType};base64,${imageBuffer.toString("base64")}`;
            }
          } catch (imgError) {
            console.warn("Could not load illustration:", imgError);
          }
        }
      }
    }
    wo.illustration_base64 = illustrationBase64;

    // Generate HTML based on type
    let html: string;
    let filename: string;

    switch (pdfType) {
      case "label":
        html = generatePalletLabelHTML(wo);
        filename = `${wo.wo_number}-label.pdf`;
        break;
      case "both":
        html = generateCombinedPDFHTML(wo);
        filename = `${wo.wo_number}-complete.pdf`;
        break;
      case "workorder":
      default:
        html = generateWorkOrderPDFHTML(wo);
        filename = `${wo.wo_number}.pdf`;
        break;
    }

    // Generate PDF using Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "Letter",
      printBackground: true,
      margin: {
        top: "0.3in",
        right: "0.3in",
        bottom: "0.3in",
        left: "0.3in",
      },
    });

    await browser.close();

    // Send PDF
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    res.end(pdfBuffer);
  } catch (error: any) {
    console.error("Error generating PDF:", error);
    res.status(500).json({ message: error.message || "Failed to generate PDF" });
  }
});

/**
 * Generate HTML for Work Order PDF
 */
function generateWorkOrderPDFHTML(wo: any): string {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const today = formatDate(new Date().toISOString());
  const createdDate = wo.created_at ? formatDate(wo.created_at) : today;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${wo.wo_number} - Production Guide</title>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Montserrat:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    @page {
      size: letter;
      margin: 0;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Inter', sans-serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #1a1a1a;
    }

    /* Page 1: Production Guide */
    .page {
      width: 8.5in;
      min-height: 11in;
      padding: 0.5in;
      page-break-after: always;
      position: relative;
    }
    .page:last-child {
      page-break-after: auto;
    }

    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 3px solid #264027;
    }
    .logo-section {
      flex: 1;
    }
    .company-name {
      font-family: 'Cormorant Garamond', serif;
      font-size: 26pt;
      font-weight: 600;
      color: #264027;
      margin-bottom: 4px;
    }
    .tagline {
      font-family: 'Montserrat', sans-serif;
      font-size: 10pt;
      font-weight: 500;
      color: #6f732f;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .doc-info {
      text-align: right;
    }
    .wo-number {
      font-family: 'Montserrat', sans-serif;
      font-size: 28pt;
      font-weight: 700;
      color: #264027;
      letter-spacing: -1px;
    }
    .doc-date {
      font-size: 11pt;
      color: #666;
      margin-top: 4px;
    }

    /* Section styling */
    .section {
      margin-bottom: 20px;
    }
    .section-title {
      font-family: 'Montserrat', sans-serif;
      font-size: 12pt;
      font-weight: 600;
      color: #264027;
      background: linear-gradient(135deg, #f8faf8 0%, #f0f4f0 100%);
      padding: 8px 12px;
      border-left: 4px solid #264027;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Product info */
    .product-header {
      display: flex;
      gap: 24px;
      margin-bottom: 20px;
    }
    .product-image {
      width: 180px;
      height: 180px;
      background: #f5f5f5;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid #e0e0e0;
    }
    .product-image img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
    .product-details {
      flex: 1;
    }
    .product-name {
      font-family: 'Cormorant Garamond', serif;
      font-size: 22pt;
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 12px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 140px 1fr;
      gap: 6px 16px;
    }
    .info-label {
      font-weight: 600;
      color: #555;
      font-size: 10pt;
    }
    .info-value {
      color: #1a1a1a;
      font-size: 10pt;
    }

    /* Size & Quantity box */
    .highlight-box {
      background: linear-gradient(135deg, #e8f5e9 0%, #dcedc8 100%);
      border: 2px solid #264027;
      border-radius: 8px;
      padding: 16px 20px;
      margin: 16px 0;
    }
    .highlight-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
    }
    .highlight-row + .highlight-row {
      border-top: 1px solid rgba(38, 64, 39, 0.2);
    }
    .highlight-label {
      font-family: 'Montserrat', sans-serif;
      font-weight: 600;
      color: #264027;
      font-size: 11pt;
    }
    .highlight-value {
      font-family: 'Montserrat', sans-serif;
      font-weight: 700;
      font-size: 14pt;
      color: #264027;
    }

    /* Mixing guidelines */
    .mixing-box {
      background: #fafafa;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 16px;
    }
    .mixing-content {
      white-space: pre-wrap;
      font-family: 'Inter', sans-serif;
      font-size: 11pt;
      line-height: 1.6;
    }

    /* Notes section */
    .notes-box {
      background: #fff9e6;
      border: 1px solid #f0e0a0;
      border-radius: 8px;
      padding: 12px 16px;
    }

    /* Status badge */
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 10pt;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .status-pending { background: #fff3cd; color: #856404; }
    .status-scheduled { background: #cce5ff; color: #004085; }
    .status-in_progress { background: #d4edda; color: #155724; }
    .status-completed { background: #264027; color: white; }

    /* Footer */
    .footer {
      position: absolute;
      bottom: 0.5in;
      left: 0.5in;
      right: 0.5in;
      padding-top: 12px;
      border-top: 1px solid #ddd;
      font-size: 8pt;
      color: #999;
      text-align: center;
    }

    /* Page 2: Pallet Label */
    .label-page {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 1in;
    }
    .pallet-label {
      width: 100%;
      border: 4px solid #264027;
      border-radius: 12px;
      padding: 40px;
      text-align: center;
    }
    .label-company {
      font-family: 'Cormorant Garamond', serif;
      font-size: 20pt;
      color: #264027;
      margin-bottom: 8px;
    }
    .label-wo {
      font-family: 'Montserrat', sans-serif;
      font-size: 48pt;
      font-weight: 700;
      color: #264027;
      margin: 16px 0;
      letter-spacing: -2px;
    }
    .label-product {
      font-family: 'Cormorant Garamond', serif;
      font-size: 28pt;
      font-weight: 600;
      color: #1a1a1a;
      margin: 24px 0;
    }
    .label-info {
      font-size: 16pt;
      margin: 12px 0;
    }
    .label-date {
      font-size: 14pt;
      color: #666;
      margin-top: 24px;
    }
    .label-pallet-number {
      font-family: 'Montserrat', sans-serif;
      font-size: 24pt;
      font-weight: 600;
      color: #264027;
      margin-top: 20px;
    }
    .label-footer {
      margin-top: 32px;
      padding-top: 16px;
      border-top: 2px solid #264027;
      font-size: 10pt;
      color: #666;
    }
  </style>
</head>
<body>
  <!-- Page 1: Production Guide -->
  <div class="page">
    <div class="header">
      <div class="logo-section">
        <div class="company-name">Soil Seed & Water</div>
        <div class="tagline">Regenerative Soil Solutions</div>
      </div>
      <div class="doc-info">
        <div class="wo-number">${wo.wo_number}</div>
        <div class="doc-date">${createdDate}</div>
        <div style="margin-top: 8px;">
          <span class="status-badge status-${wo.status}">${wo.status.replace("_", " ")}</span>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Product Information</div>
      <div class="product-header">
        <div class="product-image">
          ${wo.illustration_base64
            ? `<img src="${wo.illustration_base64}" alt="${wo.product_name}" style="max-width: 100%; max-height: 100%; object-fit: contain;" />`
            : `<span style="color: #999; font-size: 10pt;">No Image</span>`
          }
        </div>
        <div class="product-details">
          <div class="product-name">${wo.product_name || "Custom Product"}</div>
          <div class="info-grid">
            ${wo.product_id ? `
            <span class="info-label">Product ID:</span>
            <span class="info-value">${wo.product_id}</span>
            ` : ""}
            <span class="info-label">Work Order:</span>
            <span class="info-value">${wo.wo_number}</span>
            <span class="info-label">Order Type:</span>
            <span class="info-value" style="text-transform: capitalize;">${(wo.order_type || "wholesale").replace("_", " ")}</span>
            <span class="info-label">Created:</span>
            <span class="info-value">${createdDate}</span>
            <span class="info-label">Priority:</span>
            <span class="info-value" style="text-transform: capitalize;">${wo.priority || "Normal"}</span>
            ${wo.created_by ? `
            <span class="info-label">Created By:</span>
            <span class="info-value">${wo.created_by}${wo.created_by_email ? ` (${wo.created_by_email})` : ""}</span>
            ` : ""}
          </div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Size & Quantity</div>
      <div class="highlight-box">
        <div class="highlight-row">
          <span class="highlight-label">Size Category</span>
          <span class="highlight-value">${wo.size_category_name || wo.size_category}</span>
        </div>
        <div class="highlight-row">
          <span class="highlight-label">Quantity</span>
          <span class="highlight-value">${wo.quantity} ${wo.quantity_type === "pallet" ? "Pallet" : "Unit"}${wo.quantity > 1 ? "s" : ""}</span>
        </div>
        ${wo.units_per_pallet ? `
        <div class="highlight-row">
          <span class="highlight-label">Units per Pallet</span>
          <span class="highlight-value">${wo.units_per_pallet}</span>
        </div>
        ` : ""}
        ${wo.total_weight_lbs ? `
        <div class="highlight-row">
          <span class="highlight-label">Total Estimated Weight</span>
          <span class="highlight-value">${wo.total_weight_lbs.toLocaleString()} lbs</span>
        </div>
        ` : ""}
      </div>
    </div>

    ${wo.ingredient_ratios || wo.ingredients_list ? `
    <div class="section">
      <div class="section-title">Ingredients</div>
      <div class="info-grid" style="padding: 0 8px;">
        ${wo.ingredient_ratios ? `
        <span class="info-label">Ingredient Ratios:</span>
        <span class="info-value">${wo.ingredient_ratios}</span>
        ` : ""}
        ${wo.ingredients_list ? `
        <span class="info-label">Ingredients:</span>
        <span class="info-value">${wo.ingredients_list}</span>
        ` : ""}
      </div>
    </div>
    ` : ""}

    ${wo.mixing_guidelines ? `
    <div class="section">
      <div class="section-title">Mixing Guidelines</div>
      <div class="mixing-box">
        <div class="mixing-content">${wo.mixing_guidelines}</div>
      </div>
    </div>
    ` : ""}

    ${wo.custom_notes ? `
    <div class="section">
      <div class="section-title">Notes</div>
      <div class="notes-box">
        ${wo.custom_notes}
      </div>
    </div>
    ` : ""}

    ${wo.needs_transportation ? `
    <div class="section">
      <div class="section-title">Delivery Information</div>
      <div class="info-grid" style="padding: 0 8px;">
        <span class="info-label">Destination:</span>
        <span class="info-value">${wo.destination_address || ""}${wo.destination_city ? `, ${wo.destination_city}` : ""}${wo.destination_state ? `, ${wo.destination_state}` : ""} ${wo.destination_zip || ""}</span>
        ${wo.preferred_delivery_date ? `
        <span class="info-label">Preferred Date:</span>
        <span class="info-value">${formatDate(wo.preferred_delivery_date)}</span>
        ` : ""}
        ${wo.preferred_delivery_time ? `
        <span class="info-label">Preferred Time:</span>
        <span class="info-value">${wo.preferred_delivery_time}</span>
        ` : ""}
      </div>
    </div>
    ` : ""}

    <div class="footer">
      Soil Seed & Water | 18980 Stanton Rd, Congress, AZ 85332 | (928) 632-7125 | info@soilseedandwater.com
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generate HTML for Pallet Label PDF (single page)
 */
function generatePalletLabelHTML(wo: any): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${wo.wo_number} - Pallet Label</title>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    @page {
      size: letter;
      margin: 0;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Montserrat', sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 11in;
      width: 8.5in;
      padding: 1in;
    }
    .pallet-label {
      width: 100%;
      border: 4px solid #264027;
      border-radius: 12px;
      padding: 40px;
      text-align: center;
    }
    .label-company {
      font-family: 'Cormorant Garamond', serif;
      font-size: 24pt;
      color: #264027;
      margin-bottom: 8px;
    }
    .label-wo {
      font-family: 'Montserrat', sans-serif;
      font-size: 56pt;
      font-weight: 700;
      color: #264027;
      margin: 20px 0;
      letter-spacing: -2px;
    }
    .label-product {
      font-family: 'Cormorant Garamond', serif;
      font-size: 32pt;
      font-weight: 600;
      color: #1a1a1a;
      margin: 24px 0;
    }
    .label-info {
      font-size: 18pt;
      margin: 12px 0;
    }
    .label-date {
      font-size: 16pt;
      color: #666;
      margin-top: 28px;
    }
    .label-pallet-number {
      font-family: 'Montserrat', sans-serif;
      font-size: 28pt;
      font-weight: 600;
      color: #264027;
      margin-top: 24px;
    }
    .label-footer {
      margin-top: 36px;
      padding-top: 16px;
      border-top: 2px solid #264027;
      font-size: 11pt;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="pallet-label">
    <div class="label-company">Soil Seed & Water</div>
    <div class="label-wo">${wo.wo_number}</div>
    <div class="label-product">${wo.product_name || "Custom Product"}</div>
    <div class="label-info">
      <strong>${wo.size_category_name || wo.size_category}</strong>
    </div>
    ${wo.units_per_pallet ? `
    <div class="label-info">
      ${wo.units_per_pallet} units per pallet
    </div>
    ` : ""}
    <div class="label-date">
      Date Produced: _______________
    </div>
    <div class="label-pallet-number">
      Pallet ___ of ${wo.quantity}
    </div>
    <div class="label-footer">
      SSW BioSoils | Regenerative Soil Solutions | OMRI Listed
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generate HTML for Combined PDF (Work Order + Pallet Label)
 */
function generateCombinedPDFHTML(wo: any): string {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const today = formatDate(new Date().toISOString());
  const createdDate = wo.created_at ? formatDate(wo.created_at) : today;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${wo.wo_number} - Complete</title>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Montserrat:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    @page {
      size: letter;
      margin: 0;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Inter', sans-serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #1a1a1a;
    }
    .page {
      width: 8.5in;
      min-height: 11in;
      padding: 0.5in;
      page-break-after: always;
      position: relative;
    }
    .page:last-child {
      page-break-after: auto;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 3px solid #264027;
    }
    .logo-section { flex: 1; }
    .company-name {
      font-family: 'Cormorant Garamond', serif;
      font-size: 26pt;
      font-weight: 600;
      color: #264027;
      margin-bottom: 4px;
    }
    .tagline {
      font-family: 'Montserrat', sans-serif;
      font-size: 9pt;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #666;
    }
    .doc-info { text-align: right; }
    .wo-number {
      font-family: 'Montserrat', sans-serif;
      font-size: 18pt;
      font-weight: 700;
      color: #264027;
    }
    .doc-date { font-size: 10pt; color: #666; }
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 9pt;
      font-weight: 600;
      text-transform: uppercase;
    }
    .status-pending { background: #FEF3C7; color: #92400E; }
    .status-in_progress { background: #DBEAFE; color: #1E40AF; }
    .status-completed { background: #D1FAE5; color: #065F46; }
    .section { margin-bottom: 20px; }
    .section-title {
      font-family: 'Montserrat', sans-serif;
      font-size: 11pt;
      font-weight: 600;
      color: #264027;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 10px;
      padding-bottom: 4px;
      border-bottom: 1px solid #e5e5e5;
    }
    .product-header {
      display: flex;
      gap: 20px;
      align-items: flex-start;
    }
    .product-image {
      width: 120px;
      height: 120px;
      border: 1px solid #e5e5e5;
      border-radius: 8px;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #fafafa;
    }
    .product-image img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
    .product-details { flex: 1; }
    .product-name {
      font-family: 'Cormorant Garamond', serif;
      font-size: 22pt;
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 8px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 120px 1fr;
      gap: 4px 12px;
      font-size: 10pt;
    }
    .info-label { color: #666; font-weight: 500; }
    .info-value { color: #1a1a1a; }
    .highlight-box {
      background: #f8fdf8;
      border: 1px solid #264027;
      border-radius: 8px;
      padding: 16px;
    }
    .highlight-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      border-bottom: 1px solid #e8f0e8;
    }
    .highlight-row:last-child { border-bottom: none; }
    .highlight-label { font-weight: 500; color: #264027; }
    .highlight-value { font-weight: 600; color: #1a1a1a; }
    .notes-box {
      background: #fffef0;
      border: 1px solid #e5e0a0;
      border-radius: 6px;
      padding: 12px;
      font-size: 10pt;
    }
    .footer {
      position: absolute;
      bottom: 0.5in;
      left: 0.5in;
      right: 0.5in;
      font-size: 8pt;
      color: #999;
      text-align: center;
    }
    /* Page 2: Pallet Label */
    .label-page {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 1in;
    }
    .pallet-label {
      width: 100%;
      border: 4px solid #264027;
      border-radius: 12px;
      padding: 40px;
      text-align: center;
    }
    .label-company {
      font-family: 'Cormorant Garamond', serif;
      font-size: 24pt;
      color: #264027;
      margin-bottom: 8px;
    }
    .label-wo {
      font-family: 'Montserrat', sans-serif;
      font-size: 56pt;
      font-weight: 700;
      color: #264027;
      margin: 20px 0;
      letter-spacing: -2px;
    }
    .label-product {
      font-family: 'Cormorant Garamond', serif;
      font-size: 32pt;
      font-weight: 600;
      color: #1a1a1a;
      margin: 24px 0;
    }
    .label-info { font-size: 18pt; margin: 12px 0; }
    .label-date { font-size: 16pt; color: #666; margin-top: 28px; }
    .label-pallet-number {
      font-family: 'Montserrat', sans-serif;
      font-size: 28pt;
      font-weight: 600;
      color: #264027;
      margin-top: 24px;
    }
    .label-footer {
      margin-top: 36px;
      padding-top: 16px;
      border-top: 2px solid #264027;
      font-size: 11pt;
      color: #666;
    }
  </style>
</head>
<body>
  <!-- Page 1: Work Order -->
  <div class="page">
    <div class="header">
      <div class="logo-section">
        <div class="company-name">Soil Seed & Water</div>
        <div class="tagline">Regenerative Soil Solutions</div>
      </div>
      <div class="doc-info">
        <div class="wo-number">${wo.wo_number}</div>
        <div class="doc-date">${createdDate}</div>
        <div style="margin-top: 8px;">
          <span class="status-badge status-${wo.status}">${wo.status.replace("_", " ")}</span>
        </div>
      </div>
    </div>
    <div class="section">
      <div class="section-title">Product Information</div>
      <div class="product-header">
        <div class="product-image">
          ${wo.illustration_base64
            ? `<img src="${wo.illustration_base64}" alt="${wo.product_name}" />`
            : `<span style="color: #999; font-size: 10pt;">No Image</span>`
          }
        </div>
        <div class="product-details">
          <div class="product-name">${wo.product_name || "Custom Product"}</div>
          <div class="info-grid">
            ${wo.product_id ? `<span class="info-label">Product ID:</span><span class="info-value">${wo.product_id}</span>` : ""}
            <span class="info-label">Work Order:</span><span class="info-value">${wo.wo_number}</span>
            <span class="info-label">Order Type:</span><span class="info-value" style="text-transform: capitalize;">${(wo.order_type || "wholesale").replace("_", " ")}</span>
            <span class="info-label">Priority:</span><span class="info-value" style="text-transform: capitalize;">${wo.priority || "Normal"}</span>
            ${wo.created_by ? `<span class="info-label">Created By:</span><span class="info-value">${wo.created_by}${wo.created_by_email ? ` (${wo.created_by_email})` : ""}</span>` : ""}
          </div>
        </div>
      </div>
    </div>
    <div class="section">
      <div class="section-title">Size & Quantity</div>
      <div class="highlight-box">
        <div class="highlight-row">
          <span class="highlight-label">Size Category</span>
          <span class="highlight-value">${wo.size_category_name || wo.size_category}</span>
        </div>
        <div class="highlight-row">
          <span class="highlight-label">Quantity</span>
          <span class="highlight-value">${wo.quantity} ${wo.quantity_type === "pallet" ? "Pallet" : "Unit"}${wo.quantity > 1 ? "s" : ""}</span>
        </div>
        ${wo.units_per_pallet ? `<div class="highlight-row"><span class="highlight-label">Units per Pallet</span><span class="highlight-value">${wo.units_per_pallet}</span></div>` : ""}
        ${wo.total_weight_lbs ? `<div class="highlight-row"><span class="highlight-label">Total Estimated Weight</span><span class="highlight-value">${wo.total_weight_lbs.toLocaleString()} lbs</span></div>` : ""}
      </div>
    </div>
    ${wo.ingredient_ratios || wo.ingredients_list ? `
    <div class="section">
      <div class="section-title">Ingredients</div>
      <div class="info-grid" style="padding: 0 8px;">
        ${wo.ingredient_ratios ? `<span class="info-label">Ratios:</span><span class="info-value">${wo.ingredient_ratios}</span>` : ""}
        ${wo.ingredients_list ? `<span class="info-label">Ingredients:</span><span class="info-value">${wo.ingredients_list}</span>` : ""}
      </div>
    </div>
    ` : ""}
    ${wo.custom_notes ? `
    <div class="section">
      <div class="section-title">Notes</div>
      <div class="notes-box">${wo.custom_notes}</div>
    </div>
    ` : ""}
    <div class="footer">
      Soil Seed & Water | 18980 Stanton Rd, Congress, AZ 85332 | (928) 632-7125 | info@soilseedandwater.com
    </div>
  </div>
  <!-- Page 2: Pallet Label -->
  <div class="page label-page">
    <div class="pallet-label">
      <div class="label-company">Soil Seed & Water</div>
      <div class="label-wo">${wo.wo_number}</div>
      <div class="label-product">${wo.product_name || "Custom Product"}</div>
      <div class="label-info"><strong>${wo.size_category_name || wo.size_category}</strong></div>
      ${wo.units_per_pallet ? `<div class="label-info">${wo.units_per_pallet} units per pallet</div>` : ""}
      <div class="label-date">Date Produced: _______________</div>
      <div class="label-pallet-number">Pallet ___ of ${wo.quantity}</div>
      <div class="label-footer">SSW BioSoils | Regenerative Soil Solutions | OMRI Listed</div>
    </div>
  </div>
</body>
</html>
  `;
}

export default router;
