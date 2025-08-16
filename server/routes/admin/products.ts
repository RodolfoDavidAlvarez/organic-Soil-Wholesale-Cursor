import { Router } from 'express';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { adminAuth, logAdminAction } from '../../middleware/adminAuth';

const router = Router();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://govktyrtmwzbzqkmzmrf.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdvdmt0eXJ0bXd6Ynpxa216bXJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDc2OTU2NiwiZXhwIjoyMDcwMzQ1NTY2fQ.Zf6HI1O9ROsRersiYukXzwznHVXALs2EDYiSGLchyVI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Apply admin auth to all routes
router.use(adminAuth);

// Get all products
router.get('/', async (req, res) => {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
      return res.status(500).json({ error: 'Failed to fetch products' });
    }

    // Transform data to match frontend expectations
    const transformedProducts = products.map(product => ({
      id: product.id,
      name: product.name,
      productType: product.product_type,
      category: product.category,
      price: product.price,
      stockQuantity: product.stock_quantity,
      imageUrl: product.image_url,
      texturePhotoUrl: product.texture_photo_url,
      isWholesaleOnly: product.is_wholesale_only,
      allowBulkPickup: product.allow_bulk_pickup,
      certifications: product.certifications,
      description: product.description,
      unit: product.unit,
      availableSizes: product.available_sizes
    }));

    res.json({ products: transformedProducts });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();
    
    if (error || !product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Transform data
    const transformedProduct = {
      id: product.id,
      name: product.name,
      productType: product.product_type,
      category: product.category,
      price: product.price,
      stockQuantity: product.stock_quantity,
      imageUrl: product.image_url,
      texturePhotoUrl: product.texture_photo_url,
      isWholesaleOnly: product.is_wholesale_only,
      allowBulkPickup: product.allow_bulk_pickup,
      certifications: product.certifications,
      description: product.description,
      unit: product.unit,
      availableSizes: product.available_sizes
    };
    
    res.json(transformedProduct);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Create new product
router.post('/', async (req, res) => {
  try {
    const productData = req.body;
    
    // Convert frontend field names to database field names
    const dbData = {
      name: productData.name,
      product_type: productData.productType,
      category: productData.category,
      price: productData.price,
      stock_quantity: productData.stockQuantity || 0,
      image_url: productData.imageUrl,
      texture_photo_url: productData.texturePhotoUrl,
      is_wholesale_only: productData.isWholesaleOnly || false,
      allow_bulk_pickup: productData.allowBulkPickup || true,
      certifications: productData.certifications,
      description: productData.description,
      unit: productData.unit || 'cubic_yard',
      available_sizes: productData.availableSizes || ['1', '2', '3', '5', '10']
    };

    const { data: newProduct, error } = await supabase
      .from('products')
      .insert([dbData])
      .select()
      .single();

    if (error) {
      console.error('Error creating product:', error);
      return res.status(500).json({ error: 'Failed to create product' });
    }
    
    // Log admin action
    await logAdminAction(
      req.admin!.id.toString(),
      'create_product',
      'product',
      newProduct.id,
      null,
      newProduct,
      req
    );
    
    // Transform response
    const transformedProduct = {
      id: newProduct.id,
      name: newProduct.name,
      productType: newProduct.product_type,
      category: newProduct.category,
      price: newProduct.price,
      stockQuantity: newProduct.stock_quantity,
      imageUrl: newProduct.image_url,
      texturePhotoUrl: newProduct.texture_photo_url,
      isWholesaleOnly: newProduct.is_wholesale_only,
      allowBulkPickup: newProduct.allow_bulk_pickup,
      certifications: newProduct.certifications,
      description: newProduct.description,
      unit: newProduct.unit,
      availableSizes: newProduct.available_sizes
    };
    
    res.status(201).json(transformedProduct);
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
    const { data: currentProduct } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();
    
    if (!currentProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Convert frontend field names to database field names
    const dbData = {
      name: productData.name,
      product_type: productData.productType,
      category: productData.category,
      price: productData.price,
      stock_quantity: productData.stockQuantity,
      image_url: productData.imageUrl,
      texture_photo_url: productData.texturePhotoUrl,
      is_wholesale_only: productData.isWholesaleOnly,
      allow_bulk_pickup: productData.allowBulkPickup,
      certifications: productData.certifications,
      description: productData.description,
      unit: productData.unit,
      available_sizes: productData.availableSizes
    };

    const { data: updatedProduct, error } = await supabase
      .from('products')
      .update(dbData)
      .eq('id', productId)
      .select()
      .single();

    if (error) {
      console.error('Error updating product:', error);
      return res.status(500).json({ error: 'Failed to update product' });
    }
    
    // Log admin action
    await logAdminAction(
      req.admin!.id.toString(),
      'update_product',
      'product',
      productId,
      currentProduct,
      updatedProduct,
      req
    );
    
    // Transform response
    const transformedProduct = {
      id: updatedProduct.id,
      name: updatedProduct.name,
      productType: updatedProduct.product_type,
      category: updatedProduct.category,
      price: updatedProduct.price,
      stockQuantity: updatedProduct.stock_quantity,
      imageUrl: updatedProduct.image_url,
      texturePhotoUrl: updatedProduct.texture_photo_url,
      isWholesaleOnly: updatedProduct.is_wholesale_only,
      allowBulkPickup: updatedProduct.allow_bulk_pickup,
      certifications: updatedProduct.certifications,
      description: updatedProduct.description,
      unit: updatedProduct.unit,
      availableSizes: updatedProduct.available_sizes
    };
    
    res.json(transformedProduct);
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
    const { data: currentProduct } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();
    
    if (!currentProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (error) {
      console.error('Error deleting product:', error);
      return res.status(500).json({ error: 'Failed to delete product' });
    }
    
    // Log admin action
    await logAdminAction(
      req.admin!.id.toString(),
      'delete_product',
      'product',
      productId,
      currentProduct,
      null,
      req
    );
    
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

export default router;