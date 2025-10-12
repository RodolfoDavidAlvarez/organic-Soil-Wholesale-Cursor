import { Router } from 'express';
import { supabase } from '../../db/supabase.js';
import { requireAuth } from '../../middleware/auth.js';

const router = Router();

// Get all admin notifications
router.get('/', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('admin_notifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error('Error fetching admin notifications:', error);
    res.status(500).json({ error: 'Failed to fetch admin notifications' });
  }
});

// Get a single admin notification
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('admin_notifications')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Admin notification not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching admin notification:', error);
    res.status(500).json({ error: 'Failed to fetch admin notification' });
  }
});

// Create new admin notification
router.post('/', requireAuth, async (req, res) => {
  try {
    const {
      email,
      name,
      role = 'admin',
      notify_new_orders = true,
      notify_arrivals = true,
      notify_trivia_leads = true,
      notify_contact_forms = true,
      notify_quote_requests = true,
      notify_special_requests = true,
      active = true
    } = req.body;

    // Validate required fields
    if (!email || !name) {
      return res.status(400).json({ error: 'Email and name are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const { data, error } = await supabase
      .from('admin_notifications')
      .insert({
        email,
        name,
        role,
        notify_new_orders,
        notify_arrivals,
        notify_trivia_leads,
        notify_contact_forms,
        notify_quote_requests,
        notify_special_requests,
        active
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ error: 'Admin with this email already exists' });
      }
      throw error;
    }

    res.status(201).json(data);
  } catch (error) {
    console.error('Error creating admin notification:', error);
    res.status(500).json({ error: 'Failed to create admin notification' });
  }
});

// Update admin notification
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove id from updates if present
    delete updates.id;

    // Validate email if being updated
    if (updates.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updates.email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }
    }

    const { data, error } = await supabase
      .from('admin_notifications')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ error: 'Admin with this email already exists' });
      }
      throw error;
    }

    if (!data) {
      return res.status(404).json({ error: 'Admin notification not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error updating admin notification:', error);
    res.status(500).json({ error: 'Failed to update admin notification' });
  }
});

// Delete admin notification
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if this is the last active admin
    const { data: activeAdmins, error: countError } = await supabase
      .from('admin_notifications')
      .select('id')
      .eq('active', true);

    if (countError) throw countError;

    if (activeAdmins && activeAdmins.length <= 1) {
      const { data: adminToDelete } = await supabase
        .from('admin_notifications')
        .select('active')
        .eq('id', id)
        .single();

      if (adminToDelete?.active) {
        return res.status(400).json({ 
          error: 'Cannot delete the last active admin. Please add another admin first.' 
        });
      }
    }

    const { error } = await supabase
      .from('admin_notifications')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting admin notification:', error);
    res.status(500).json({ error: 'Failed to delete admin notification' });
  }
});

// Toggle admin active status
router.patch('/:id/toggle-active', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Get current status
    const { data: current, error: fetchError } = await supabase
      .from('admin_notifications')
      .select('active')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    if (!current) {
      return res.status(404).json({ error: 'Admin notification not found' });
    }

    // If deactivating, check if this is the last active admin
    if (current.active) {
      const { data: activeAdmins, error: countError } = await supabase
        .from('admin_notifications')
        .select('id')
        .eq('active', true);

      if (countError) throw countError;

      if (activeAdmins && activeAdmins.length <= 1) {
        return res.status(400).json({ 
          error: 'Cannot deactivate the last active admin. Please activate another admin first.' 
        });
      }
    }

    // Toggle the status
    const { data, error } = await supabase
      .from('admin_notifications')
      .update({ active: !current.active })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Error toggling admin status:', error);
    res.status(500).json({ error: 'Failed to toggle admin status' });
  }
});

export default router;