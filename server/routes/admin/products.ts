import { Router } from 'express';
import { z } from 'zod';
import { db } from '../../db';
import { products } from '../../../shared/schema';
import { eq } from 'drizzle-orm';
import { adminAuth, logAdminAction } from '../../middleware/adminAuth';

const router = Router();

// Apply admin auth to all routes
router.use(adminAuth);

// Get all products
router.get('/', async (req, res) => {
  try {
    const allProducts = await db.select().from(products).orderBy(products.id);
    res.json({ products: allProducts });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const product = await db.select().from(products).where(eq(products.id, productId)).limit(1);
    
    if (product.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(product[0]);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Create new product
router.post('/', async (req, res) => {
  try {
    const productData = req.body;
    
    // Process array fields
    if (productData.additionalImages && !Array.isArray(productData.additionalImages)) {
      productData.additionalImages = productData.additionalImages.split(',').map((s: string) => s.trim());
    }
    
    if (productData.availableSizeOptions && !Array.isArray(productData.availableSizeOptions)) {
      productData.availableSizeOptions = productData.availableSizeOptions.split(',').map((s: string) => s.trim());
    }

    const [newProduct] = await db.insert(products).values(productData).returning();
    
    // Log admin action
    await logAdminAction(
      req.admin!.id,
      'create_product',
      'product',
      newProduct.id,
      null,
      newProduct,
      req
    );
    
    res.json(newProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Update product
router.put('/:id', async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const productData = req.body;
    
    // Get current product for audit log
    const [currentProduct] = await db.select().from(products).where(eq(products.id, productId)).limit(1);
    
    if (!currentProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Process array fields
    if (productData.additionalImages && !Array.isArray(productData.additionalImages)) {
      productData.additionalImages = productData.additionalImages.split(',').map((s: string) => s.trim());
    }
    
    if (productData.availableSizeOptions && !Array.isArray(productData.availableSizeOptions)) {
      productData.availableSizeOptions = productData.availableSizeOptions.split(',').map((s: string) => s.trim());
    }

    const [updatedProduct] = await db
      .update(products)
      .set(productData)
      .where(eq(products.id, productId))
      .returning();
    
    // Log admin action
    await logAdminAction(
      req.admin!.id,
      'update_product',
      'product',
      productId,
      currentProduct,
      updatedProduct,
      req
    );
    
    res.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product
router.delete('/:id', async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    
    // Get current product for audit log
    const [currentProduct] = await db.select().from(products).where(eq(products.id, productId)).limit(1);
    
    if (!currentProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    await db.delete(products).where(eq(products.id, productId));
    
    // Log admin action
    await logAdminAction(
      req.admin!.id,
      'delete_product',
      'product',
      productId,
      currentProduct,
      null,
      req
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

export default router;