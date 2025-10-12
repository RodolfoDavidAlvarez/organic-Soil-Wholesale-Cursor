import { Router } from 'express';
import { supabase } from '../db/supabase.js';
import { sendAdminLeadNotification } from '../services/emailNotifications.js';

const router = Router();

// Submit lead
router.post('/submit', async (req, res) => {
  try {
    const { name, email, phone, notes } = req.body;

    // Validate required fields
    if (!name || !email || !phone) {
      return res.status(400).json({ error: 'Name, email, and phone are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const submittedAt = new Date().toISOString();

    // Save to database (using contact_submissions table with 'lead' status)
    const { data, error } = await supabase
      .from('contact_submissions')
      .insert({
        name,
        email,
        phone,
        subject: 'Lead Form Submission',
        message: notes || 'No additional notes',
        status: 'lead',
        created_at: submittedAt
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving lead:', error);
      return res.status(500).json({ error: 'Failed to submit lead' });
    }

    // Send admin notification
    try {
      await sendAdminLeadNotification({
        name,
        email,
        phone,
        notes,
        submittedAt
      });
      console.log('Admin notification sent for lead');
    } catch (emailError) {
      console.error('Failed to send admin notification:', emailError);
      // Don't fail the submission if email fails
    }

    res.json({ 
      success: true, 
      message: 'Thank you! We\'ll contact you shortly.',
      leadId: data.id
    });
  } catch (error) {
    console.error('Lead submission error:', error);
    res.status(500).json({ error: 'Failed to process lead' });
  }
});

export default router;