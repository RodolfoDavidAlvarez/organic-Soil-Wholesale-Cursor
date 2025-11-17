import { Router } from "express";
import { supabase } from "../supabaseClient.js";
import Stripe from "stripe";
import { sendAdminOrderNotification, sendAdminArrivalNotification } from "../services/email.js";
import { ProductSyncService } from "../services/productSyncService.js";

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
});

const toArrayOfStrings = (input: unknown): string[] => {
  if (Array.isArray(input)) {
    return input
      .map((value) => (typeof value === "string" ? value.trim() : ""))
      .filter((value): value is string => Boolean(value));
  }

  if (typeof input === "string") {
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) {
        return parsed
          .map((value) => (typeof value === "string" ? value.trim() : ""))
          .filter((value): value is string => Boolean(value));
      }
    } catch {
      return input
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
    }
  }

  return [];
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

const normalizeSizePriceOptions = (input: unknown) => {
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

  return source
    .map((option) => {
      if (!option || typeof option !== "object") {
        return null;
      }

      const record = option as Record<string, unknown>;
      const rawLabel = typeof record.label === "string" ? record.label : typeof record.name === "string" ? record.name : null;
      if (!rawLabel) {
        return null;
      }
      const label = rawLabel.trim();
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
        parseMoneyCents(record.value);

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

      const displayOrder =
        typeof record.display_order === "number"
          ? record.display_order
          : typeof record.displayOrder === "number"
            ? record.displayOrder
            : undefined;

      return {
        key: keyCandidate,
        label,
        price: priceCents !== null ? Number((priceCents / 100).toFixed(2)) : null,
        priceCents,
        isActive,
        displayOrder,
      };
    })
    .filter((option): option is { key: string; label: string; price: number | null; priceCents: number | null; isActive: boolean; displayOrder?: number } => Boolean(option))
    .sort((a, b) => (a.displayOrder ?? Number.MAX_SAFE_INTEGER) - (b.displayOrder ?? Number.MAX_SAFE_INTEGER));
};

// Test endpoint to check database connection
router.get("/test", async (req, res) => {
  try {
    console.log("🧪 Testing database connection...");
    const { data, error } = await supabase.from("products").select("id, name").limit(1);

    if (error) {
      console.error("❌ Database error:", error);
      return res.status(500).json({ error: error.message });
    }

    console.log("✅ Database connection successful:", data);
    res.json({ success: true, data });
  } catch (error) {
    console.error("❌ Test error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Test endpoint to check pay-and-pickup products
router.get("/test-pay-pickup", async (req, res) => {
  try {
    console.log("🧪 Testing pay-and-pickup products...");
    const { data, error } = await supabase
      .from("products")
      .select("id, name, is_pay_and_pickup_enabled, pay_and_pickup_display_order, active")
      .eq("is_pay_and_pickup_enabled", true)
      .limit(5);

    if (error) {
      console.error("❌ Pay-and-pickup query error:", error);
      return res.status(500).json({ error: error.message });
    }

    console.log("✅ Pay-and-pickup products found:", data?.length || 0);
    console.log("📊 Products:", data);
    res.json({ success: true, count: data?.length || 0, data });
  } catch (error) {
    console.error("❌ Test pay-and-pickup error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get Pay & Pickup menu (products enabled for pickup)
router.get("/menu", async (req, res) => {
  try {
    console.log("🔍 Fetching pay-and-pickup products...");

    const { data: products, error } = await supabase
      .from("products")
      .select(
        `
        id,
        name,
        display_title,
        category,
        description,
        price,
        image_url,
        texture_photo_url,
        additional_images,
        available_size_options,
        size_price_options,
        is_pay_and_pickup_enabled,
        pay_and_pickup_display_order,
        pay_and_pickup_description,
        pay_and_pickup_hero_image,
        pay_and_pickup_badge,
        product_status
      `
      )
      .eq("is_pay_and_pickup_enabled", true)
      .order("pay_and_pickup_display_order", { ascending: true, nullsFirst: true });

    if (error) {
      console.error("❌ Error fetching pay-and-pickup products:", error);
      console.error("❌ Error details:", JSON.stringify(error, null, 2));
      return res.status(500).json({ error: "Failed to fetch menu", details: error.message });
    }

    const normalizedProducts = (products || [])
      .filter((product) => {
        if (!product?.is_pay_and_pickup_enabled) {
          return false;
        }
        const rawStatus =
          typeof product.product_status === "string" ? product.product_status.toLowerCase().trim() : "";
        return rawStatus === "" || rawStatus === "active";
      })
      .map((product) => {
        const availableSizes = toArrayOfStrings(product.available_size_options);
        const gallery = toArrayOfStrings(product.additional_images);
        const sizePriceOptions = normalizeSizePriceOptions(product.size_price_options);
        const heroImage =
          typeof product.pay_and_pickup_hero_image === "string" && product.pay_and_pickup_hero_image.trim().length > 0
            ? product.pay_and_pickup_hero_image
            : product.texture_photo_url ||
              product.image_url ||
              gallery[0] ||
              null;

        const normalizedDescription = product.pay_and_pickup_description ?? product.description ?? null;
        return {
          id: product.id,
          name: product.name,
          display_title: product.display_title,
          displayTitle: product.display_title,
          category: product.category,
          description: product.description,
          price: product.price,
          pay_and_pickup_description: normalizedDescription,
          payAndPickupDescription: normalizedDescription,
          pay_and_pickup_display_order: product.pay_and_pickup_display_order ?? 0,
          payAndPickupDisplayOrder: product.pay_and_pickup_display_order ?? 0,
          pay_and_pickup_hero_image: heroImage,
          payAndPickupHeroImage: heroImage,
          pay_and_pickup_badge: product.pay_and_pickup_badge,
          payAndPickupBadge: product.pay_and_pickup_badge,
          available_size_options: availableSizes,
          availableSizeOptions: availableSizes,
          additional_images: gallery,
          additionalImages: gallery,
          size_price_options: sizePriceOptions,
          sizePriceOptions: sizePriceOptions,
        };
      })
      .sort(
        (productA, productB) =>
          (productA.pay_and_pickup_display_order ?? Number.MAX_SAFE_INTEGER) -
          (productB.pay_and_pickup_display_order ?? Number.MAX_SAFE_INTEGER)
      );

    console.log(`📦 Found ${normalizedProducts.length} products for pay-and-pickup`);
    res.json(normalizedProducts);
  } catch (error) {
    console.error("❌ Pay & Pickup menu error:", error);
    res.status(500).json({ error: "Failed to fetch menu" });
  }
});

// Create order from Pay & Pickup landing page
router.post("/create-order", async (req, res) => {
  try {
    const {
      items,
      customerInfo,
      orderType = "drive_through",
      locationId = 1,
      pickupLocation,
      paymentMethod = "mock_card",
      paymentStatus = "paid",
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "No items in order" });
    }

    if (!customerInfo?.name || !customerInfo?.phone) {
      return res.status(400).json({ error: "Customer name and phone are required" });
    }

    const normalizedLocationId = Number(locationId) || 1;

    // Resolve pricing and availability directly from inventory to prevent tampering
    const inventorySnapshots = [];
    let subtotalCents = 0;

    for (const item of items) {
      const productId = Number(item.productId);
      const quantity = Number(item.quantity) || 0;
      const sizeOption = item.size || item.sizeOption;
      const requestedLocation = Number(item.locationId) || normalizedLocationId;

      if (!productId || !sizeOption || quantity <= 0) {
        return res.status(400).json({ error: "Invalid item payload" });
      }

      const { data: inventoryItem, error: inventoryError } = await supabase
        .from("inventory")
        .select(
          `
          id,
          price,
          quantity_available,
          quantity_reserved,
          size_option,
          products!inner (
            name,
            is_pay_and_pickup_enabled
          )
        `
        )
        .eq("product_id", productId)
        .eq("size_option", sizeOption)
        .eq("location_id", requestedLocation)
        .single();

      if (inventoryError || !inventoryItem) {
        console.error("Inventory lookup failed:", inventoryError);
        return res.status(404).json({ error: `Inventory not found for product ${productId} (${sizeOption})` });
      }

      if (!inventoryItem.products?.is_pay_and_pickup_enabled) {
        return res.status(400).json({ error: `${inventoryItem.products?.name ?? "Product"} is not available for Pay & Pickup.` });
      }

      if (inventoryItem.quantity_available < quantity) {
        return res.status(400).json({
          error: `Insufficient inventory for ${inventoryItem.products?.name ?? "product"} (${sizeOption}). Available: ${inventoryItem.quantity_available}`,
        });
      }

      const pricePerUnit = Number(inventoryItem.price) || 0;
      const pricePerUnitCents = Math.round(pricePerUnit * 100);
      subtotalCents += pricePerUnitCents * quantity;

      inventorySnapshots.push({
        inventoryId: inventoryItem.id,
        productId,
        productName: inventoryItem.products?.name ?? item.productName ?? "Product",
        size_option: sizeOption,
        quantity,
        locationId: requestedLocation,
        unitPrice: pricePerUnit,
        unitPriceCents: pricePerUnitCents,
        quantity_available: inventoryItem.quantity_available,
        quantity_reserved: inventoryItem.quantity_reserved ?? 0,
      });
    }

    const taxRate = 0.08; // 8% sales tax
    const taxCents = Math.round(subtotalCents * taxRate);
    const totalCents = subtotalCents + taxCents;
    const subtotal = subtotalCents / 100;
    const tax = taxCents / 100;
    const total = totalCents / 100;
    const orderStatus = paymentStatus === "paid" ? "processing" : "pending";

    // Look up or create customer profile if email provided
    let customerId: string | number | null = null;
    if (customerInfo.email) {
      const { data: existingCustomer, error: existingError } = await supabase.from("customers").select("id").eq("email", customerInfo.email).single();

      if (!existingError && existingCustomer) {
        customerId = existingCustomer.id;
      } else {
        const { data: newCustomer, error: customerError } = await supabase
          .from("customers")
          .insert({
            email: customerInfo.email,
            full_name: customerInfo.name,
            phone: customerInfo.phone,
          })
          .select("id")
          .single();

        if (!customerError && newCustomer) {
          customerId = newCustomer.id;
        }
      }
    }

    const orderItemsJson = inventorySnapshots.map((snapshot) => ({
      product_id: snapshot.productId,
      product_name: snapshot.productName,
      size_option: snapshot.size_option,
      quantity: snapshot.quantity,
      unit_price_cents: snapshot.unitPriceCents,
      location_id: snapshot.locationId,
    }));

    const estimatedReadyTime = new Date(Date.now() + 20 * 60 * 1000).toISOString();

    const orderPayload: Record<string, any> = {
      customer_id: customerId,
      business_name: customerInfo.company || customerInfo.name || "Pay & Pickup Customer",
      email: customerInfo.email || "walkin@organicsoilwholesale.com",
      phone: customerInfo.phone,
      delivery_type: "pickup",
      pickup_location: pickupLocation || "Phoenix Warehouse",
      order_items: orderItemsJson,
      subtotal,
      discount: 0,
      total,
      status: orderStatus,
      notes: customerInfo.notes ?? null,
      order_type: orderType,
      customer_name: customerInfo.name,
      customer_email: customerInfo.email ?? null,
      estimated_ready_time: estimatedReadyTime,
      payment_method: paymentMethod,
      payment_status: paymentStatus,
    };

    const { data: order, error: orderError } = await supabase.from("orders").insert(orderPayload).select("*").single();

    if (orderError || !order) {
      console.error("Error creating order:", orderError);
      return res.status(500).json({ error: "Failed to create order" });
    }

    // Insert line items into order_items table (normalized)
    const orderItems = inventorySnapshots.map((snapshot) => ({
      order_id: order.id,
      product_id: snapshot.productId,
      size_option: snapshot.size_option,
      quantity: snapshot.quantity,
      unit_price: snapshot.unitPrice,
      total_price: snapshot.unitPrice * snapshot.quantity,
    }));

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
    if (itemsError) {
      console.error("Error inserting order items:", itemsError);
    }

    // Reserve inventory by reducing available quantity and increasing reserved count
    const inventoryUpdates = inventorySnapshots.map((snapshot) =>
      supabase
        .from("inventory")
        .update({
          quantity_available: snapshot.quantity_available - snapshot.quantity,
          quantity_reserved: (snapshot.quantity_reserved || 0) + snapshot.quantity,
          last_updated: new Date().toISOString(),
        })
        .eq("id", snapshot.inventoryId)
    );

    await Promise.all(inventoryUpdates);

    const resolvedPaymentMethod = paymentMethod === "mock_card" ? "Mock Card (Test)" : paymentMethod;
    const resolvedPaymentStatus = paymentStatus ? paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1) : undefined;

    // Send admin notification email
    try {
      await sendAdminOrderNotification({
        orderNumber: order.order_number,
        customerName: customerInfo.name,
        customerEmail: customerInfo.email || undefined,
        customerPhone: customerInfo.phone,
        orderType: "pay_and_pickup",
        items: inventorySnapshots.map((snapshot) => ({
          name: snapshot.productName,
          quantity: snapshot.quantity,
          price: snapshot.unitPrice * snapshot.quantity,
          size: snapshot.size_option,
        })),
        subtotal,
        tax,
        total,
        deliveryMethod: "Pickup",
        pickupLocation: pickupLocation || "Phoenix Warehouse",
        estimatedReadyTime: estimatedReadyTime,
        notes: customerInfo.notes || undefined,
        paymentMethod: resolvedPaymentMethod,
        paymentStatus: resolvedPaymentStatus,
      });
      console.log("Admin notification email sent for Pay & Pickup order:", order.order_number);
    } catch (emailError) {
      console.error("Failed to send admin notification email:", emailError);
      // Don't fail the order if email fails
    }

    res.json({
      success: true,
      orderId: order.id,
      orderNumber: order.order_number,
      totalAmount: total,
      estimatedReadyTime,
      subtotal,
      tax,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create Stripe checkout session for Pay & Pickup orders
router.post("/create-checkout-session", async (req, res) => {
  try {
    const { orderId } = req.body;

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(
        `
        *,
        order_items (*)
      `
      )
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Create line items for Stripe
    const lineItems = order.order_items.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: `${item.product_name} (${item.size})`,
        },
        unit_amount: Math.round(item.price_per_unit * 100), // Convert to cents
      },
      quantity: item.quantity,
    }));

    // Add tax as a line item
    if (order.tax_amount > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: "Sales Tax",
          },
          unit_amount: Math.round(order.tax_amount * 100),
        },
        quantity: 1,
      });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${process.env.CLIENT_URL || (process.env.NODE_ENV === "production" ? "https://" + process.env.VERCEL_URL : "http://localhost:5173")}/order-confirmation?orderId=${orderId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL || (process.env.NODE_ENV === "production" ? "https://" + process.env.VERCEL_URL : "http://localhost:5173")}/pay-and-pickup`,
      metadata: {
        orderId,
        orderNumber: order.order_number,
      },
    });

    // Update order with Stripe session ID
    await supabase.from("orders").update({ stripe_payment_intent_id: session.id }).eq("id", orderId);

    res.json({ sessionId: session.id, sessionUrl: session.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

// Notify arrival for pickup
router.post("/notify-arrival", async (req, res) => {
  try {
    const { customerInfo, vehicleInfo } = req.body;

    if (!customerInfo.name || !customerInfo.phone) {
      return res.status(400).json({ error: "Customer name and phone are required" });
    }

    // Create a simple notification entry
    const { data, error } = await supabase
      .from("arrival_notifications")
      .insert({
        customer_name: customerInfo.name,
        customer_phone: customerInfo.phone,
        vehicle_info: vehicleInfo,
        arrival_time: new Date().toISOString(),
        status: "waiting",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating notification:", error);
      return res.status(500).json({ error: "Failed to notify arrival" });
    }

    // Send admin notification email
    try {
      await sendAdminArrivalNotification({
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        vehicleInfo: vehicleInfo,
        arrivalTime: data.arrival_time,
        notificationId: data.id,
      });
      console.log("Admin arrival notification email sent for:", customerInfo.name);
    } catch (emailError) {
      console.error("Failed to send admin arrival notification email:", emailError);
      // Don't fail the request if email fails
    }

    res.json({
      success: true,
      message: "Staff has been notified of your arrival",
      notificationId: data.id,
    });
  } catch (error) {
    console.error("Error notifying arrival:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
