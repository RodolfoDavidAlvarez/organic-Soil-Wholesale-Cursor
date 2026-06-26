import { Router } from 'express';
import { supabase } from '../supabaseClient.js';
import {
  getAvailableDatesForProducts,
  getTimeSlotsForDate,
} from '../../shared/pickupSchedule.js';

const router = Router();

router.post('/available-dates', async (req, res) => {
  try {
    const { product_slugs = [] } = req.body;

    let products: any[] = [];
    if (product_slugs.length > 0) {
      const { data } = await supabase
        .from('products')
        .select('slug, name, pickup_lead_days, is_yard_available')
        .in('slug', product_slugs);
      products = data || [];
    }

    const maxLeadDays = products.length > 0
      ? Math.max(...products.map((p) => p.pickup_lead_days || 7))
      : 7;

    const hasYardItems = products.some((p) => p.is_yard_available);
    const allYardAvailable = products.length > 0 && products.every((p) => p.is_yard_available);

    const schedule = getAvailableDatesForProducts({ allYardAvailable, maxLeadDays });

    const productAvailability = products.map((p) => ({
      slug: p.slug,
      name: p.name,
      is_yard_available: p.is_yard_available,
      pickup_lead_days: p.pickup_lead_days,
    }));

    res.json({
      ...schedule,
      has_yard_items: hasYardItems,
      products: productAvailability,
    });
  } catch (error) {
    console.error('Scheduling error:', error);
    res.status(500).json({ error: 'Failed to fetch scheduling data' });
  }
});

router.post('/time-slots', async (req, res) => {
  try {
    const { date } = req.body;
    if (!date) return res.status(400).json({ error: 'Date is required' });
    res.json(getTimeSlotsForDate(date));
  } catch (error) {
    console.error('Time slots error:', error);
    res.status(500).json({ error: 'Failed to fetch time slots' });
  }
});

export default router;
