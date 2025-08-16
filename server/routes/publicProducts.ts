import { Router } from 'express';
import { supabase } from '../db/supabase.js';

const router = Router();

// Get all active products for public display
router.get('/', async (req, res) => {
  try {
    const { category, wholesale_only } = req.query;
    
    let query = supabase
      .from('products')
      .select(`
        id,
        name,
        product_type,
        display_title,
        description,
        category,
        price,
        stock_quantity,
        image_url,
        texture_photo_url,
        ingredients,
        certifications,
        features,
        size_options,
        is_wholesale_only,
        allow_bulk_pickup,
        min_order_quantity,
        max_order_quantity
      `)
      .gt('stock_quantity', 0) // Only show in-stock items
      .order('name');

    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }
    
    if (wholesale_only !== undefined) {
      query = query.eq('is_wholesale_only', wholesale_only === 'true');
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching products:', error);
      return res.status(500).json({ error: 'Failed to fetch products' });
    }

    // Transform data for frontend
    const products = (data || []).map(product => ({
      id: product.id,
      name: product.name,
      productType: product.product_type,
      displayTitle: product.display_title || product.name,
      description: product.description,
      category: product.category,
      price: product.price,
      stockQuantity: product.stock_quantity,
      imageUrl: product.image_url,
      texturePhotoUrl: product.texture_photo_url,
      ingredients: product.ingredients,
      certifications: product.certifications,
      features: product.features ? product.features.split('|').map(f => f.trim()) : [],
      sizeOptions: product.size_options ? product.size_options.split(',').map(s => s.trim()) : ['1 bag'],
      isWholesaleOnly: product.is_wholesale_only,
      allowBulkPickup: product.allow_bulk_pickup,
      minOrderQuantity: product.min_order_quantity || 1,
      maxOrderQuantity: product.max_order_quantity || 100
    }));

    res.json({ products });
  } catch (error) {
    console.error('Error in products endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single product details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Transform data
    const product = {
      id: data.id,
      name: data.name,
      productType: data.product_type,
      displayTitle: data.display_title || data.name,
      marketingTitle: data.marketing_title,
      description: data.description,
      category: data.category,
      price: data.price,
      stockQuantity: data.stock_quantity,
      imageUrl: data.image_url,
      texturePhotoUrl: data.texture_photo_url,
      additionalImages: data.additional_images || [],
      productVideoUrl: data.product_video_url,
      productVideoTitle: data.product_video_title,
      ingredients: data.ingredients,
      targetAudience: data.target_audience,
      recommendedUses: data.recommended_uses,
      story: data.story,
      usage: data.usage,
      certifications: data.certifications,
      features: data.features ? data.features.split('|').map(f => f.trim()) : [],
      sizeOptions: data.size_options ? data.size_options.split(',').map(s => s.trim()) : ['1 bag'],
      isWholesaleOnly: data.is_wholesale_only,
      allowBulkPickup: data.allow_bulk_pickup,
      minOrderQuantity: data.min_order_quantity || 1,
      maxOrderQuantity: data.max_order_quantity || 100,
      isPriceNegotiable: data.is_price_negotiable,
      requiresQuote: data.requires_quote
    };

    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get product availability by location
router.get('/:id/availability', async (req, res) => {
  try {
    const { id } = req.params;
    const { location_id } = req.query;

    let query = supabase
      .from('inventory')
      .select(`
        *,
        locations (
          id,
          name,
          address,
          phone
        )
      `)
      .eq('product_id', id)
      .gt('quantity_available', 0);

    if (location_id) {
      query = query.eq('location_id', location_id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching availability:', error);
      return res.status(500).json({ error: 'Failed to fetch availability' });
    }

    res.json({ availability: data || [] });
  } catch (error) {
    console.error('Error in availability endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;