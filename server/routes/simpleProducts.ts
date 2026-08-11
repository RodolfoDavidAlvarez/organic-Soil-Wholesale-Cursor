import { Router } from 'express';
import { productsData } from '../../client/src/data/productData';

const router = Router();

type ProductWithTexturePhoto = (typeof productsData)[number] & {
  texturePhotoUrl?: string;
};

const getTexturePhotoUrl = (product: (typeof productsData)[number]) =>
  (product as ProductWithTexturePhoto).texturePhotoUrl;

// Generate slug from product name or type
const generateSlug = (text: string): string => {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Get product slug prioritizing product type
const getProductSlug = (product: any): string => {
  return generateSlug(product.productType || product.name);
};

// Get all products with enhanced data
router.get('/', (req, res) => {
  try {
    const enhancedProducts = productsData.map(product => ({
      ...product,
      slug: getProductSlug(product),
      // Ensure we have proper URLs for images
      imageUrl: product.imageUrl || getTexturePhotoUrl(product),
      texturePhotoUrl: getTexturePhotoUrl(product) || product.imageUrl,
    }));

    res.json({ products: enhancedProducts });
  } catch (error) {
    console.error('Error getting products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single product by slug or ID
router.get('/:identifier', (req, res) => {
  try {
    const identifier = req.params.identifier;
    
    // Try to find by slug first
    let product = productsData.find(p => {
      const slug = getProductSlug(p);
      return slug === identifier;
    });

    // Fallback to numeric ID
    if (!product) {
      const numericId = Number(identifier);
      if (!Number.isNaN(numericId)) {
        product = productsData.find(p => p.id === numericId);
      }
    }

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Enhance product with slug and ensure image URLs
    const enhancedProduct = {
      ...product,
      slug: getProductSlug(product),
      imageUrl: product.imageUrl || getTexturePhotoUrl(product),
      texturePhotoUrl: getTexturePhotoUrl(product) || product.imageUrl,
    };

    res.json(enhancedProduct);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
