import { Router } from "express";
import { supabase } from "../db/supabase.js";

interface DriveThruSizeInput {
  id?: string;
  label: string;
  unit: string;
  priceCents: number;
  stockQty: number;
  pickupWindowMinutes?: number;
  isDefault?: boolean;
}

interface DriveThruProductInput {
  slug: string;
  name: string;
  displayTitle?: string;
  headline?: string;
  description?: string;
  heroImageUrl?: string;
  textureImageUrl?: string;
  status?: "active" | "inactive";
  orderIndex?: number;
}

const router = Router();

const mapProductResponse = (product: any) => ({
  id: product.id,
  slug: product.slug,
  name: product.name,
  displayTitle: product.display_title ?? "",
  headline: product.headline ?? "",
  description: product.description ?? "",
  heroImageUrl: product.hero_image_url ?? "",
  textureImageUrl: product.texture_image_url ?? "",
  status: product.status ?? "active",
  orderIndex: product.order_index ?? 0,
  sizes: (product.sizes ?? []).map((size: any) => ({
    id: size.id,
    label: size.label,
    unit: size.unit,
    priceCents: size.price_cents,
    stockQty: size.stock_qty,
    pickupWindowMinutes: size.pickup_window_minutes,
    isDefault: size.is_default,
  })),
});

router.get("/products", async (_req, res) => {
  const { data, error } = await supabase
    .from("drive_thru_products")
    .select("*, sizes:drive_thru_sizes(*)")
    .order("order_index", { ascending: true });

  if (error) {
    console.error("Failed to fetch drive-thru products:", error);
    return res.status(500).json({ error: "Failed to fetch products" });
  }

  const products = (data ?? []).map(mapProductResponse);
  return res.json({ products });
});

router.post("/products", async (req, res) => {
  const productInput: DriveThruProductInput = req.body.product;
  const sizes: DriveThruSizeInput[] = req.body.sizes ?? [];

  if (!productInput?.slug || !productInput?.name) {
    return res.status(400).json({ error: "Product slug and name are required" });
  }

  const { data: product, error: insertError } = await supabase
    .from("drive_thru_products")
    .insert({
      slug: productInput.slug,
      name: productInput.name,
      display_title: productInput.displayTitle ?? null,
      headline: productInput.headline ?? null,
      description: productInput.description ?? null,
      hero_image_url: productInput.heroImageUrl ?? null,
      texture_image_url: productInput.textureImageUrl ?? null,
      status: productInput.status ?? "active",
      order_index: productInput.orderIndex ?? 0,
    })
    .select("*, sizes:drive_thru_sizes(*)")
    .single();

  if (insertError || !product) {
    console.error("Failed to create drive-thru product:", insertError);
    return res.status(500).json({ error: "Failed to create product" });
  }

  if (sizes.length > 0) {
    const sizePayload = sizes.map((size) => ({
      product_id: product.id,
      label: size.label,
      unit: size.unit,
      price_cents: size.priceCents,
      stock_qty: size.stockQty,
      pickup_window_minutes: size.pickupWindowMinutes ?? 20,
      is_default: size.isDefault ?? false,
    }));

    const { error: sizeInsertError } = await supabase
      .from("drive_thru_sizes")
      .insert(sizePayload);

    if (sizeInsertError) {
      console.error("Failed to create drive-thru sizes:", sizeInsertError);
      return res.status(500).json({ error: "Failed to create size options" });
    }
  }

  const { data: refreshed, error: refreshError } = await supabase
    .from("drive_thru_products")
    .select("*, sizes:drive_thru_sizes(*)")
    .eq("id", product.id)
    .single();

  if (refreshError || !refreshed) {
    console.error("Failed to reload drive-thru product:", refreshError);
    return res.status(500).json({ error: "Failed to load product" });
  }

  return res.status(201).json({ product: mapProductResponse(refreshed) });
});

router.put("/products/:id", async (req, res) => {
  const productId = req.params.id;
  const productInput: DriveThruProductInput = req.body.product;
  const sizes: DriveThruSizeInput[] = req.body.sizes ?? [];

  if (!productId) {
    return res.status(400).json({ error: "Product ID is required" });
  }

  const { error: updateError } = await supabase
    .from("drive_thru_products")
    .update({
      slug: productInput.slug,
      name: productInput.name,
      display_title: productInput.displayTitle ?? null,
      headline: productInput.headline ?? null,
      description: productInput.description ?? null,
      hero_image_url: productInput.heroImageUrl ?? null,
      texture_image_url: productInput.textureImageUrl ?? null,
      status: productInput.status ?? "active",
      order_index: productInput.orderIndex ?? 0,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId);

  if (updateError) {
    console.error("Failed to update drive-thru product:", updateError);
    return res.status(500).json({ error: "Failed to update product" });
  }

  const { data: existingSizes, error: sizeFetchError } = await supabase
    .from("drive_thru_sizes")
    .select("id")
    .eq("product_id", productId);

  if (sizeFetchError) {
    console.error("Failed to fetch drive-thru sizes:", sizeFetchError);
    return res.status(500).json({ error: "Failed to fetch size options" });
  }

  const payload = sizes.map((size) => ({
    ...(size.id ? { id: size.id } : {}),
    product_id: productId,
    label: size.label,
    unit: size.unit,
    price_cents: size.priceCents,
    stock_qty: size.stockQty,
    pickup_window_minutes: size.pickupWindowMinutes ?? 20,
    is_default: size.isDefault ?? false,
  }));

  if (payload.length > 0) {
    const { error: sizeUpsertError } = await supabase
      .from("drive_thru_sizes")
      .upsert(payload, { onConflict: "id" });

    if (sizeUpsertError) {
      console.error("Failed to upsert drive-thru sizes:", sizeUpsertError);
      return res.status(500).json({ error: "Failed to save size options" });
    }
  }

  const existingIds = new Set((existingSizes ?? []).map((size) => size.id));
  const incomingIds = new Set(
    sizes.filter((size) => size.id).map((size) => size.id as string)
  );
  const idsToDelete = Array.from(existingIds).filter(
    (id) => !incomingIds.has(id)
  );

  if (idsToDelete.length > 0) {
    const { error: deleteError } = await supabase
      .from("drive_thru_sizes")
      .delete()
      .in("id", idsToDelete);

    if (deleteError) {
      console.error("Failed to delete drive-thru sizes:", deleteError);
      return res.status(500).json({ error: "Failed to remove size options" });
    }
  }

  const { data: refreshed, error: refreshError } = await supabase
    .from("drive_thru_products")
    .select("*, sizes:drive_thru_sizes(*)")
    .eq("id", productId)
    .single();

  if (refreshError || !refreshed) {
    console.error("Failed to reload drive-thru product:", refreshError);
    return res.status(500).json({ error: "Failed to load product" });
  }

  return res.json({ product: mapProductResponse(refreshed) });
});

router.patch("/products/:id/status", async (req, res) => {
  const productId = req.params.id;
  const { status } = req.body as { status?: "active" | "inactive" };

  if (!productId || !status) {
    return res.status(400).json({ error: "Product ID and status are required" });
  }

  const { error } = await supabase
    .from("drive_thru_products")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId);

  if (error) {
    console.error("Failed to update drive-thru product status:", error);
    return res.status(500).json({ error: "Failed to update status" });
  }

  return res.json({ success: true });
});

router.delete("/products/:id", async (req, res) => {
  const productId = req.params.id;

  if (!productId) {
    return res.status(400).json({ error: "Product ID is required" });
  }

  const { error } = await supabase
    .from("drive_thru_products")
    .delete()
    .eq("id", productId);

  if (error) {
    console.error("Failed to delete drive-thru product:", error);
    return res.status(500).json({ error: "Failed to delete product" });
  }

  return res.json({ success: true });
});

export default router;
