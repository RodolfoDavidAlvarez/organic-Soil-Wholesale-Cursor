import { Router } from 'express';
import Stripe from 'stripe';
import { supabase } from '../db/supabase.js';
import { sendOrderConfirmationEmail } from '../services/email';

const router = Router();

// Initialize Stripe lazily to ensure env vars are loaded
let stripe: Stripe;

function getStripe() {
  if (!stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      console.warn('STRIPE_SECRET_KEY not configured - payments will not work');
      throw new Error('Stripe is not configured');
    }
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-06-20',
    });
  }
  return stripe;
}

// Create checkout session
router.post('/create-session', async (req, res) => {
  try {
    const { items, customerInfo, pickupTime, locationId, isQuickOrder } = req.body;

    // Use the provided locationId or default to Phoenix (1)
    const checkoutLocationId = locationId || 1;

    // Validate inventory availability
    const inventoryChecks = await Promise.all(
      items.map(async (item: any) => {
        const { data } = await supabase
          .from('inventory')
          .select('quantity_available')
          .eq('product_id', item.productId)
          .eq('location_id', checkoutLocationId)
          .eq('size_option', item.sizeOption)
          .single();

        return {
          productId: item.productId,
          requested: item.quantity,
          available: data?.quantity_available || 0,
          canFulfill: (data?.quantity_available || 0) >= item.quantity
        };
      })
    );

    const unavailableItems = inventoryChecks.filter(check => !check.canFulfill);
    if (unavailableItems.length > 0) {
      return res.status(400).json({
        error: 'Some items are not available',
        unavailableItems
      });
    }

    // Create order in database with pending status
    const orderData: any = {
      email: customerInfo.email || null,
      phone: customerInfo.phone,
      status: 'pending_payment',
      payment_status: 'pending',
      pickup_scheduled_at: pickupTime || null,
      total: items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0),
      location_id: checkoutLocationId
    };

    // Handle different customer info structures
    if (isQuickOrder) {
      // Quick order uses name field
      orderData.business_name = customerInfo.name;
      orderData.order_type = 'quick_order';
    } else {
      // Regular checkout uses businessName
      orderData.business_name = customerInfo.businessName;
      orderData.order_type = 'standard';
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single();

    if (orderError) throw orderError;

    // Create order items
    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: item.price,
      total_price: item.price * item.quantity,
      size_option: item.sizeOption,
      status: 'pending'
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    // Create Stripe line items
    const lineItems = items.map((item: any) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
          description: item.sizeOption,
          images: item.imageUrl ? [item.imageUrl] : [],
        },
        unit_amount: Math.round(item.price * 100), // Convert to cents
      },
      quantity: item.quantity,
    }));

    // Create Stripe checkout session
    const session = await getStripe().checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${req.headers.origin}/order-confirmation?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`,
      cancel_url: `${req.headers.origin}/checkout?canceled=true`,
      metadata: {
        order_id: order.id.toString(),
        pickup_time: pickupTime,
      },
      customer_email: customerInfo.email,
    });

    // Update order with Stripe session ID
    await supabase
      .from('orders')
      .update({ stripe_checkout_session_id: session.id })
      .eq('id', order.id);

    res.json({ 
      sessionId: session.id, 
      orderId: order.id,
      confirmationCode: order.confirmation_code,
      url: session.url
    });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Stripe webhook handler
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).send(`Webhook Error: ${err}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      await handlePaymentSuccess(session);
      break;

    case 'payment_intent.payment_failed':
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await handlePaymentFailure(paymentIntent);
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

// Handle successful payment
async function handlePaymentSuccess(session: Stripe.Checkout.Session) {
  const orderId = parseInt(session.metadata?.order_id || '0');
  
  if (!orderId) {
    console.error('No order ID in session metadata');
    return;
  }

  // Update order status
  const { error: orderError } = await supabase
    .from('orders')
    .update({
      status: 'paid',
      payment_status: 'paid',
      paid_at: new Date().toISOString(),
      stripe_payment_intent_id: session.payment_intent as string
    })
    .eq('id', orderId);

  if (orderError) {
    console.error('Error updating order:', orderError);
    return;
  }

  // Get order items to reserve inventory
  const { data: orderItems, error: itemsError } = await supabase
    .from('order_items')
    .select('product_id, quantity')
    .eq('order_id', orderId);

  if (itemsError || !orderItems) {
    console.error('Error fetching order items:', itemsError);
    return;
  }

  // Reserve inventory for each item
  for (const item of orderItems) {
    // Get current inventory
    const { data: inventory } = await supabase
      .from('inventory')
      .select('id, quantity_available, quantity_reserved')
      .eq('product_id', item.product_id)
      .eq('location_id', checkoutLocationId)
      .single();

    if (inventory) {
      // Update inventory
      await supabase
        .from('inventory')
        .update({
          quantity_available: inventory.quantity_available - item.quantity,
          quantity_reserved: inventory.quantity_reserved + item.quantity
        })
        .eq('id', inventory.id);

      // Record transaction
      await supabase
        .from('inventory_transactions')
        .insert({
          inventory_id: inventory.id,
          transaction_type: 'reservation',
          quantity: -item.quantity,
          reference_type: 'order',
          reference_id: orderId.toString(),
          notes: 'Automatic reservation after payment'
        });

      // Update order item status
      await supabase
        .from('order_items')
        .update({ 
          status: 'reserved',
          reserved_at: new Date().toISOString()
        })
        .eq('order_id', orderId)
        .eq('product_id', item.product_id);
    }
  }

  // Get full order details for email
  const { data: fullOrder, error: fullOrderError } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        quantity,
        unit_price,
        total_price,
        products (
          name
        )
      )
    `)
    .eq('id', orderId)
    .single();

  if (!fullOrderError && fullOrder) {
    // Send confirmation email
    try {
      await sendOrderConfirmationEmail(
        fullOrder.customer_email,
        {
          orderNumber: fullOrder.order_number,
          items: fullOrder.order_items.map((item: any) => ({
            name: item.products.name,
            quantity: item.quantity,
            price: item.total_price
          })),
          subtotal: fullOrder.subtotal,
          tax: fullOrder.tax_amount,
          total: fullOrder.total_amount,
          deliveryMethod: fullOrder.order_type === 'pickup' ? 'Pickup' : 'Delivery',
          estimatedDelivery: fullOrder.order_type === 'pickup' ? 'Ready within 24-48 hours' : undefined
        }
      );
      console.log(`Confirmation email sent for order ${orderId}`);
    } catch (emailError) {
      console.error('Failed to send order confirmation email:', emailError);
      // Don't fail the order process if email fails
    }
  }

  console.log(`Order ${orderId} successfully paid and inventory reserved`);
}

// Handle failed payment
async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
  // Find order by payment intent
  const { data: order } = await supabase
    .from('orders')
    .select('id')
    .eq('stripe_payment_intent_id', paymentIntent.id)
    .single();

  if (order) {
    await supabase
      .from('orders')
      .update({
        payment_status: 'failed',
        status: 'payment_failed'
      })
      .eq('id', order.id);
  }
}

// Generate confirmation code
function generateConfirmationCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default router;