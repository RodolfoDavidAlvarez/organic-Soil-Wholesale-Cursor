import { Router } from 'express';
import { supabase } from '../db/supabase.js';

const router = Router();

/**
 * Public MSRP pricing — canonical source of truth for retail MSRP per (product_id, size_category).
 * Mirrors what the MOS sales-portal app (and admin web UI) read from `sp_pricing`.
 *
 * Response shape:
 *   { pricing: [{ productId, sizeCategory, msrpCents }, ...] }
 */
router.get('/', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('sp_pricing')
      .select('product_id, size_category, msrp_cents')
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching sp_pricing:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }

    const pricing = (data ?? []).map((row: any) => ({
      productId: row.product_id,
      sizeCategory: row.size_category,
      msrpCents: row.msrp_cents,
    }));

    res.json({ pricing });
  } catch (error) {
    console.error('Error in msrp-pricing endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
