import { Router } from 'express';
import { supabase } from '../supabaseClient.js';

const router = Router();

// POST /available-dates — returns earliest pickup date based on cart items
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
      ? Math.max(...products.map(p => p.pickup_lead_days || 7))
      : 7;

    const hasYardItems = products.some(p => p.is_yard_available);
    const allYardAvailable = products.length > 0 && products.every(p => p.is_yard_available);

    const now = new Date();
    const cutoffHour = 14;
    const mstHour = now.getUTCHours() - 7;

    let leadDays = maxLeadDays;
    if (allYardAvailable && mstHour < cutoffHour) {
      leadDays = 1;
    }

    const earliest = new Date(now);
    earliest.setDate(earliest.getDate() + leadDays);
    while (earliest.getDay() === 0 || earliest.getDay() === 6) {
      earliest.setDate(earliest.getDate() + 1);
    }

    const dates: string[] = [];
    const d = new Date(earliest);
    for (let i = 0; i < 30; i++) {
      if (d.getDay() !== 0 && d.getDay() !== 6) {
        dates.push(d.toISOString().split('T')[0]);
      }
      d.setDate(d.getDate() + 1);
      if (dates.length >= 20) break;
    }

    const productAvailability = products.map(p => ({
      slug: p.slug,
      name: p.name,
      is_yard_available: p.is_yard_available,
      pickup_lead_days: p.pickup_lead_days,
    }));

    res.json({
      earliest_date: earliest.toISOString().split('T')[0],
      available_dates: dates,
      max_lead_days: maxLeadDays,
      all_yard_available: allYardAvailable,
      has_yard_items: hasYardItems,
      products: productAvailability,
    });
  } catch (error) {
    console.error('Scheduling error:', error);
    res.status(500).json({ error: 'Failed to fetch scheduling data' });
  }
});

// POST /time-slots — returns 30-min slots for a date
router.post('/time-slots', async (req, res) => {
  try {
    const { date } = req.body;
    if (!date) return res.status(400).json({ error: 'Date is required' });

    const d = new Date(date + 'T12:00:00');
    if (d.getDay() === 0 || d.getDay() === 6) {
      return res.json({ slots: [], message: 'No pickup/delivery on weekends' });
    }

    const slots: { time: string; available: boolean }[] = [];
    for (let hour = 7; hour < 14; hour++) {
      for (let min = 0; min < 60; min += 30) {
        const h = hour > 12 ? hour - 12 : hour;
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const label = `${h}:${min.toString().padStart(2, '0')} ${ampm}`;
        slots.push({ time: label, available: true });
      }
    }
    slots.push({ time: '2:00 PM', available: true });

    res.json({ date, slots });
  } catch (error) {
    console.error('Time slots error:', error);
    res.status(500).json({ error: 'Failed to fetch time slots' });
  }
});

export default router;
