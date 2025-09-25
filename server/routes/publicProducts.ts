import { Router } from 'express';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { loadProductData } = require('../loadProducts.js');

const productsData = loadProductData();

const router = Router();

// Get all active products for public display
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    
    let products = productsData.map((product, index) => ({
      ...product,
      id: index + 1 // Ensure products have IDs
    }));
    
    // Apply filters
    if (category && category !== 'all') {
      products = products.filter(p => p.category === category);
    }

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
    const productId = parseInt(id);
    
    const product = productsData[productId - 1]; // IDs are 1-based
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ ...product, id: productId });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get product availability by location (stub for now)
router.get('/:id/availability', async (req, res) => {
  res.json({ availability: [] });
});

export default router;