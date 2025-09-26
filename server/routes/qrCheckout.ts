import { Router } from 'express';
import { supabase } from '../db/supabase.js';
import Stripe from 'stripe';

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

// Create order from QR code landing page
router.post('/create-order', async (req, res) => {
  try {
    const { items, customerInfo, orderType } = req.body;

    // Validate input
    if (!items || !items.length) {
      return res.status(400).json({ error: 'No items in order' });
    }

    if (!customerInfo.name || !customerInfo.phone) {
      return res.status(400).json({ error: 'Customer name and phone are required' });
    }

    // Create or find customer
    let customerId = null;
    if (customerInfo.email) {
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('email', customerInfo.email)
        .single();

      if (existingCustomer) {
        customerId = existingCustomer.id;
      } else {
        const { data: newCustomer, error: customerError } = await supabase
          .from('customers')
          .insert({
            email: customerInfo.email,
            full_name: customerInfo.name,
            phone: customerInfo.phone
          })
          .select()
          .single();

        if (!customerError && newCustomer) {
          customerId = newCustomer.id;
        }
      }
    }

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const taxRate = 0.08; // 8% tax
    const taxAmount = subtotal * taxRate;
    const totalAmount = subtotal + taxAmount;

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_id: customerId,
        customer_name: customerInfo.name,
        customer_email: customerInfo.email,
        customer_phone: customerInfo.phone,
        order_type: orderType || 'drive_thru',
        status: 'pending',
        subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        payment_method: 'pending',
        payment_status: 'pending',
        estimated_ready_time: new Date(Date.now() + 20 * 60000).toISOString(), // 20 minutes
        notes: customerInfo.notes
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error('Error creating order:', orderError);
      return res.status(500).json({ error: 'Failed to create order' });
    }

    // Create order items
    const orderItems = items.map(item => ({
      order_id: order.id,
      product_id: item.productId,
      product_name: item.productName,
      quantity: item.quantity,
      size: item.size,
      price_per_unit: item.price,
      total_price: item.price * item.quantity
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Error creating order items:', itemsError);
      // Don't fail the whole order if items fail
    }

    res.json({
      success: true,
      orderId: order.id,
      orderNumber: order.order_number,
      totalAmount: order.total_amount,
      estimatedReadyTime: order.estimated_ready_time
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create Stripe checkout session for QR orders
router.post('/create-checkout-session', async (req, res) => {
  try {
    const { orderId } = req.body;

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Create line items for Stripe
    const lineItems = order.order_items.map(item => ({
      price_data: {
        currency: 'usd',
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
          currency: 'usd',
          product_data: {
            name: 'Sales Tax',
          },
          unit_amount: Math.round(order.tax_amount * 100),
        },
        quantity: 1,
      });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL || (process.env.NODE_ENV === 'production' ? 'https://' + process.env.VERCEL_URL : 'http://localhost:5173')}/order-confirmation?orderId=${orderId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL || (process.env.NODE_ENV === 'production' ? 'https://' + process.env.VERCEL_URL : 'http://localhost:5173')}/qr`,
      metadata: {
        orderId,
        orderNumber: order.order_number,
      },
    });

    // Update order with Stripe session ID
    await supabase
      .from('orders')
      .update({ stripe_payment_intent_id: session.id })
      .eq('id', orderId);

    res.json({ sessionId: session.id, sessionUrl: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Notify arrival for pickup
router.post('/notify-arrival', async (req, res) => {
  try {
    const { customerInfo, vehicleInfo } = req.body;

    if (!customerInfo.name || !customerInfo.phone) {
      return res.status(400).json({ error: 'Customer name and phone are required' });
    }

    // Create a simple notification entry
    const { data, error } = await supabase
      .from('arrival_notifications')
      .insert({
        customer_name: customerInfo.name,
        customer_phone: customerInfo.phone,
        vehicle_info: vehicleInfo,
        arrival_time: new Date().toISOString(),
        status: 'waiting'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return res.status(500).json({ error: 'Failed to notify arrival' });
    }

    // TODO: Send real-time notification to admin dashboard
    // TODO: Send SMS notification to staff

    res.json({
      success: true,
      message: 'Staff has been notified of your arrival',
      notificationId: data.id
    });
  } catch (error) {
    console.error('Error notifying arrival:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;