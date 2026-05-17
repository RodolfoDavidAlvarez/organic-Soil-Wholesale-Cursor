import { Router } from 'express';
import { supabase } from '../db/supabase.js';
import { sendAdminQuoteRequestNotification } from '../services/email.js';
import { forwardToMosLeads } from '../services/forwardToMosLeads.js';

const router = Router();

// Submit quote request
router.post('/submit', async (req, res) => {
  try {
    const { name, email, phone, company, products, quantities, deliveryLocation, notes } = req.body;

    // Validate required fields
    if (!name || !email || !products || !quantities) {
      return res.status(400).json({ error: 'Name, email, products, and quantities are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const submittedAt = new Date().toISOString();

    // Save to database
    const { data, error } = await supabase
      .from('quote_requests')
      .insert({
        name,
        email,
        phone,
        company,
        products,
        quantities,
        delivery_location: deliveryLocation,
        notes,
        status: 'new',
        created_at: submittedAt
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving quote request:', error);
      return res.status(500).json({ error: 'Failed to submit quote request' });
    }

    // Send admin notification
    try {
      await sendAdminQuoteRequestNotification({
        name,
        email,
        phone,
        company,
        products,
        quantities,
        deliveryLocation,
        notes,
        submittedAt
      });
      console.log('Admin notification sent for quote request');
    } catch (emailError) {
      console.error('Failed to send admin notification:', emailError);
      // Don't fail the submission if email fails
    }

    const productSummary = Array.isArray(products)
      ? products.map((p: any, i: number) => `${p} x ${Array.isArray(quantities) ? quantities[i] : ''}`).join(', ')
      : String(products);
    forwardToMosLeads({
      full_name: name,
      email,
      phone: phone || undefined,
      company: company || undefined,
      message:
        `Quote request:\n${productSummary}` +
        (deliveryLocation ? `\nDelivery: ${deliveryLocation}` : '') +
        (notes ? `\nNotes: ${notes}` : ''),
      source: 'osw_quote_request',
      source_url: 'https://organicsoilwholesale.com/quote',
      source_data: { osw_quote_request_id: data.id, products, quantities, deliveryLocation },
    });

    res.json({ 
      success: true, 
      message: 'Your quote request has been received. We\'ll prepare your quote and contact you soon!',
      requestId: data.id
    });
  } catch (error) {
    console.error('Quote request submission error:', error);
    res.status(500).json({ error: 'Failed to process quote request' });
  }
});

// Get quote requests (admin only)
router.get('/requests', async (req, res) => {
  try {
    // Check for admin token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data, error } = await supabase
      .from('quote_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error('Error fetching quote requests:', error);
    res.status(500).json({ error: 'Failed to fetch quote requests' });
  }
});

export default router;