import { Router } from 'express';
import { supabase } from '../db/supabase.js';
import { sendAdminSpecialRequestNotification } from '../services/emailNotifications.js';
import { forwardToMosLeads } from '../services/forwardToMosLeads.js';

const router = Router();

// Submit special request
router.post('/submit', async (req, res) => {
  try {
    const { name, email, phone, zipCode, message } = req.body;

    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const submittedAt = new Date().toISOString();

    // Save to database (using contact_submissions table with 'special_request' status)
    const { data, error } = await supabase
      .from('contact_submissions')
      .insert({
        name,
        email,
        phone,
        company: zipCode ? `ZIP: ${zipCode}` : null, // Store ZIP in company field
        subject: 'Special Request',
        message,
        status: 'special_request',
        created_at: submittedAt
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving special request:', error);
      return res.status(500).json({ error: 'Failed to submit special request' });
    }

    // Send admin notification
    try {
      await sendAdminSpecialRequestNotification({
        name,
        email,
        phone,
        zipCode,
        message,
        submittedAt
      });
      console.log('Admin notification sent for special request');
    } catch (emailError) {
      console.error('Failed to send admin notification:', emailError);
      // Don't fail the submission if email fails
    }

    forwardToMosLeads({
      full_name: name,
      email,
      phone: phone || undefined,
      message: (zipCode ? `ZIP: ${zipCode}\n\n` : '') + message,
      source: 'osw_special_request',
      source_url: 'https://organicsoilwholesale.com/special-request',
      source_data: { osw_contact_submission_id: data.id, zipCode },
    });

    res.json({ 
      success: true, 
      message: 'Your special request has been received. We\'ll contact you within 1-2 business days!',
      requestId: data.id
    });
  } catch (error) {
    console.error('Special request submission error:', error);
    res.status(500).json({ error: 'Failed to process special request' });
  }
});

export default router;