import { Router } from 'express';
import { supabase } from '../../db/supabase.js';
import { adminAuth as requireAdminAuth } from '../../middleware/adminAuth.js';
import multer from 'multer';
import Papa from 'papaparse';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Export products to CSV
router.get('/export', requireAdminAuth, async (req, res) => {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
      return res.status(500).json({ error: 'Failed to fetch products' });
    }

    // Convert to CSV
    const csv = Papa.unparse(products || [], {
      header: true,
      columns: [
        'name',
        'product_type',
        'display_title',
        'marketing_title',
        'description',
        'category',
        'price',
        'stock_quantity',
        'image_url',
        'texture_photo_url',
        'ingredients',
        'target_audience',
        'recommended_uses',
        'story',
        'usage',
        'certifications',
        'features',
        'size_options',
        'is_wholesale_only',
        'min_order_quantity',
        'max_order_quantity',
        'is_price_negotiable',
        'requires_quote',
        'allow_bulk_pickup',
        'seo_keywords',
        'marketing_note'
      ]
    });

    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="products-export.csv"');
    res.send(csv);
  } catch (error) {
    console.error('Error exporting products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Import products from CSV
router.post('/import', requireAdminAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const csvData = req.file.buffer.toString('utf-8');
    
    // Parse CSV
    Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const products = results.data.map(row => ({
          name: row.name || '',
          product_type: row.product_type || '',
          display_title: row.display_title || '',
          marketing_title: row.marketing_title || '',
          description: row.description || '',
          category: row.category || 'Potting Soil',
          price: parseFloat(row.price) || 0,
          stock_quantity: parseInt(row.stock_quantity) || 0,
          image_url: row.image_url || '',
          texture_photo_url: row.texture_photo_url || '',
          ingredients: row.ingredients || '',
          target_audience: row.target_audience || '',
          recommended_uses: row.recommended_uses || '',
          story: row.story || '',
          usage: row.usage || '',
          certifications: row.certifications || '',
          features: row.features || '',
          size_options: row.size_options || '',
          is_wholesale_only: row.is_wholesale_only === 'true' || row.is_wholesale_only === '1',
          min_order_quantity: parseInt(row.min_order_quantity) || 1,
          max_order_quantity: parseInt(row.max_order_quantity) || 1000,
          is_price_negotiable: row.is_price_negotiable === 'true' || row.is_price_negotiable === '1',
          requires_quote: row.requires_quote === 'true' || row.requires_quote === '1',
          allow_bulk_pickup: row.allow_bulk_pickup === 'true' || row.allow_bulk_pickup === '1',
          seo_keywords: row.seo_keywords || '',
          marketing_note: row.marketing_note || ''
        }));

        // Insert products
        const { data, error } = await supabase
          .from('products')
          .insert(products)
          .select();

        if (error) {
          console.error('Error importing products:', error);
          return res.status(500).json({ 
            error: 'Failed to import products',
            details: error.message
          });
        }

        res.json({
          success: true,
          message: `Successfully imported ${data?.length || 0} products`,
          imported: data?.length || 0
        });
      },
      error: (error) => {
        console.error('CSV parsing error:', error);
        res.status(400).json({ 
          error: 'Invalid CSV format',
          details: error.message
        });
      }
    });
  } catch (error) {
    console.error('Error importing products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get import template
router.get('/template', requireAdminAuth, (req, res) => {
  const template = Papa.unparse([{
    name: 'Example Product',
    product_type: 'Potting Mix',
    display_title: 'Premium Example Product',
    marketing_title: 'Best Example Product for Gardens',
    description: 'This is an example product description',
    category: 'Potting Soil',
    price: '29.99',
    stock_quantity: '100',
    image_url: 'https://example.com/product.jpg',
    texture_photo_url: 'https://example.com/texture.jpg',
    ingredients: 'Compost, Peat Moss, Perlite',
    target_audience: 'Landscapers, Nurseries',
    recommended_uses: 'Gardens, Containers, Raised Beds',
    story: 'Our story about this product',
    usage: 'Mix with existing soil at 1:1 ratio',
    certifications: 'OMRI, CDFA OIM',
    features: 'Organic|pH Balanced|Nutrient Rich',
    size_options: '1CF,2CF,Bulk',
    is_wholesale_only: 'false',
    min_order_quantity: '1',
    max_order_quantity: '1000',
    is_price_negotiable: 'false',
    requires_quote: 'false',
    allow_bulk_pickup: 'true',
    seo_keywords: 'organic soil, potting mix, wholesale',
    marketing_note: 'Featured product for spring season'
  }], {
    header: true
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="products-import-template.csv"');
  res.send(template);
});

export default router;