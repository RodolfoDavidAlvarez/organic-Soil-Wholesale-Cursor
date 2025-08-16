import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';

const router = Router();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://govktyrtmwzbzqkmzmrf.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdvdmt0eXJ0bXd6Ynpxa216bXJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDc2OTU2NiwiZXhwIjoyMDcwMzQ1NTY2fQ.Zf6HI1O9ROsRersiYukXzwznHVXALs2EDYiSGLchyVI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Simple auth middleware
const simpleAuth = async (req: any, res: any, next: any) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // For now, accept any authenticated user as admin
    req.user = user;
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// Apply admin auth to all routes
router.use(simpleAuth);

// GET /api/admin/products - List all products
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
    const transformedProducts = (products || []).map(product => ({
      id: product.id,
      name: product.name,
      productType: product.product_type,
      category: product.category,
      price: product.price,
      stockQuantity: product.stock_quantity || 0,
      imageUrl: product.image_url,
      texturePhotoUrl: product.texture_photo_url,
      isWholesaleOnly: product.is_wholesale_only || false,
      allowBulkPickup: product.allow_bulk_pickup !== false,
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

// GET /api/admin/products/:id - Get single product
router.get('/:id', async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    
    if (isNaN(productId)) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }
    
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
      stockQuantity: product.stock_quantity || 0,
      imageUrl: product.image_url,
      texturePhotoUrl: product.texture_photo_url,
      isWholesaleOnly: product.is_wholesale_only || false,
      allowBulkPickup: product.allow_bulk_pickup !== false,
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

// POST /api/admin/products - Create new product
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
      allow_bulk_pickup: productData.allowBulkPickup !== false,
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

// PUT /api/admin/products/:id - Update product
router.put('/:id', async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    
    if (isNaN(productId)) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }
    
    const productData = req.body;
    
    // Convert frontend field names to database field names
    const dbData: any = {};
    if (productData.name !== undefined) dbData.name = productData.name;
    if (productData.productType !== undefined) dbData.product_type = productData.productType;
    if (productData.category !== undefined) dbData.category = productData.category;
    if (productData.price !== undefined) dbData.price = productData.price;
    if (productData.stockQuantity !== undefined) dbData.stock_quantity = productData.stockQuantity;
    if (productData.imageUrl !== undefined) dbData.image_url = productData.imageUrl;
    if (productData.texturePhotoUrl !== undefined) dbData.texture_photo_url = productData.texturePhotoUrl;
    if (productData.isWholesaleOnly !== undefined) dbData.is_wholesale_only = productData.isWholesaleOnly;
    if (productData.allowBulkPickup !== undefined) dbData.allow_bulk_pickup = productData.allowBulkPickup;
    if (productData.certifications !== undefined) dbData.certifications = productData.certifications;
    if (productData.description !== undefined) dbData.description = productData.description;
    if (productData.unit !== undefined) dbData.unit = productData.unit;
    if (productData.availableSizes !== undefined) dbData.available_sizes = productData.availableSizes;

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

// DELETE /api/admin/products/:id - Delete product
router.delete('/:id', async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    
    if (isNaN(productId)) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (error) {
      console.error('Error deleting product:', error);
      return res.status(500).json({ error: 'Failed to delete product' });
    }
    
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

export default router;