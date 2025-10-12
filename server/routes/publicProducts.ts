import { Router } from 'express';
import { supabase } from '../db/supabase.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { loadProductData } = require('../loadProducts.js');

const router = Router();

type RawProduct = {
  id: number;
  name: string;
  description: string;
  category: string;
  price: number | null;
  stock_quantity?: number;
  image_url?: string | null;
  texture_photo_url?: string | null;
  ingredients?: string | null;
  target_audience?: string | null;
  recommended_uses?: string | null;
  story?: string | null;
  usage?: string | null;
  certifications?: string | null;
  features?: string | null;
  size_options?: string | null;
  product_type?: string | null;
  display_title?: string | null;
  marketing_title?: string | null;
  seo_keywords?: string | null;
  marketing_note?: string | null;
  product_video_url?: string | null;
  product_video_title?: string | null;
  is_wholesale_only?: boolean | null;
  additional_images?: string[] | null;
  allow_bulk_pickup?: boolean | null;
  available_size_options?: string[] | null;
  min_order_quantity?: number | null;
  max_order_quantity?: number | null;
  is_price_negotiable?: boolean | null;
  requires_quote?: boolean | null;
  is_pay_and_pickup_enabled?: boolean | null;
  pay_and_pickup_display_order?: number | null;
  pay_and_pickup_badge?: string | null;
  pay_and_pickup_description?: string | null;
  pay_and_pickup_hero_image?: string | null;
};

const toPublicProduct = (record: RawProduct, fallbackId?: number) => {
  const priceInDollars =
    typeof record.price === 'number' ? record.price / 100 : record.price;

  return {
    id: record.id ?? fallbackId ?? 0,
    name: record.name,
    description: record.description,
    category: record.category,
    price: priceInDollars ?? 0,
    imageUrl: record.image_url ?? undefined,
    texturePhotoUrl: record.texture_photo_url ?? undefined,
    ingredients: record.ingredients ?? undefined,
    targetAudience: record.target_audience ?? undefined,
    recommendedUses: record.recommended_uses ?? undefined,
    story: record.story ?? undefined,
    usage: record.usage ?? undefined,
    certifications: record.certifications ?? undefined,
    features: record.features ?? undefined,
    sizeOptions: record.size_options ?? undefined,
    productType: record.product_type ?? undefined,
    displayTitle: record.display_title ?? undefined,
    marketingTitle: record.marketing_title ?? undefined,
    seoKeywords: record.seo_keywords ?? undefined,
    marketingNote: record.marketing_note ?? undefined,
    productVideoUrl: record.product_video_url ?? undefined,
    productVideoTitle: record.product_video_title ?? undefined,
    isWholesaleOnly: Boolean(record.is_wholesale_only),
    additionalImages: record.additional_images ?? [],
    allowBulkPickup: Boolean(record.allow_bulk_pickup),
    availableSizeOptions: record.available_size_options ?? [],
    minOrderQuantity: record.min_order_quantity ?? 1,
    maxOrderQuantity: record.max_order_quantity ?? undefined,
    isPriceNegotiable: Boolean(record.is_price_negotiable),
    requiresQuote: Boolean(record.requires_quote),
    payAndPickup: {
      isEnabled: Boolean(record.is_pay_and_pickup_enabled),
      displayOrder: record.pay_and_pickup_display_order ?? 0,
      badge: record.pay_and_pickup_badge ?? undefined,
      description: record.pay_and_pickup_description ?? undefined,
      heroImage: record.pay_and_pickup_hero_image ?? undefined
    }
  };
};

async function getProductsFromDatabase(params: {
  category?: string | string[];
  payAndPickup?: string | string[];
}) {
  const { category, payAndPickup } = params;

  let query = supabase
    .from<RawProduct>('products')
    .select('*')
    .order('pay_and_pickup_display_order', { ascending: true })
    .order('name', { ascending: true });

  if (category && category !== 'all') {
    query = query.eq('category', category as string);
  }

  if (payAndPickup === 'true') {
    query = query.eq('is_pay_and_pickup_enabled', true);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data?.map((product) => toPublicProduct(product)) ?? [];
}

function getProductsFromFallback(category?: string | string[]) {
  const fallbackData = loadProductData();

  let products = fallbackData.map((product: any, index: number) =>
    toPublicProduct(
      {
        id: product.id ?? index + 1,
        name: product.name,
        description: product.description,
        category: product.category,
        price: Math.round((product.price ?? 0) * 100),
        image_url: product.imageUrl,
        texture_photo_url: product.texturePhotoUrl,
        ingredients: product.ingredients,
        target_audience: product.targetAudience,
        recommended_uses: product.recommendedUses,
        story: product.story,
        usage: product.usage,
        certifications: product.certifications,
        features: product.features,
        size_options: product.sizeOptions,
        product_type: product.productType,
        display_title: product.displayTitle,
        marketing_title: product.marketingTitle,
        seo_keywords: product.seoKeywords,
        marketing_note: product.marketingNote,
        product_video_url: product.productVideoUrl,
        product_video_title: product.productVideoTitle,
        is_wholesale_only: product.isWholesaleOnly,
        additional_images: product.additionalImages,
        allow_bulk_pickup: product.allowBulkPickup,
        available_size_options: product.availableSizeOptions,
        min_order_quantity: product.minOrderQuantity,
        max_order_quantity: product.maxOrderQuantity,
        is_price_negotiable: product.isPriceNegotiable,
        requires_quote: product.requiresQuote
      },
      index + 1
    )
  );

  if (category && category !== 'all') {
    products = products.filter((product: any) => product.category === category);
  }

  return products;
}

// Get all active products for public display
router.get('/', async (req, res) => {
  try {
    try {
      const products = await getProductsFromDatabase({
        category: req.query.category,
        payAndPickup: req.query.payAndPickup
      });

      if (products.length > 0) {
        return res.json({ products });
      }
    } catch (databaseError) {
      console.warn('Falling back to static product data:', databaseError);
    }

    const fallbackProducts = getProductsFromFallback(req.query.category);
    return res.json({ products: fallbackProducts });
  } catch (error) {
    console.error('Error in products endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single product details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let productResponse;

    try {
      const { data, error } = await supabase
        .from<RawProduct>('products')
        .select('*')
        .eq('id', Number(id))
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        productResponse = toPublicProduct(data);
      }
    } catch (databaseError) {
      console.warn('Falling back to static product data:', databaseError);
    }

    if (!productResponse) {
      const fallbackProducts = loadProductData();
      const fallback = fallbackProducts.find(
        (_product: any, index: number) => index + 1 === Number(id)
      );

      if (!fallback) {
        return res.status(404).json({ error: 'Product not found' });
      }

      productResponse = toPublicProduct(
        {
          id: Number(id),
          name: fallback.name,
          description: fallback.description,
          category: fallback.category,
          price: Math.round((fallback.price ?? 0) * 100),
          image_url: fallback.imageUrl,
          texture_photo_url: fallback.texturePhotoUrl,
          ingredients: fallback.ingredients,
          target_audience: fallback.targetAudience,
          recommended_uses: fallback.recommendedUses,
          story: fallback.story,
          usage: fallback.usage,
          certifications: fallback.certifications,
          features: fallback.features,
          size_options: fallback.sizeOptions,
          product_type: fallback.productType,
          display_title: fallback.displayTitle,
          marketing_title: fallback.marketingTitle,
          seo_keywords: fallback.seoKeywords,
          marketing_note: fallback.marketingNote,
          product_video_url: fallback.productVideoUrl,
          product_video_title: fallback.productVideoTitle,
          is_wholesale_only: fallback.isWholesaleOnly,
          additional_images: fallback.additionalImages,
          allow_bulk_pickup: fallback.allowBulkPickup,
          available_size_options: fallback.availableSizeOptions,
          min_order_quantity: fallback.minOrderQuantity,
          max_order_quantity: fallback.maxOrderQuantity,
          is_price_negotiable: fallback.isPriceNegotiable,
          requires_quote: fallback.requiresQuote
        },
        Number(id)
      );
    }

    res.json(productResponse);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get product availability by location (stub for now)
router.get('/:id/availability', async (_req, res) => {
  res.json({ availability: [] });
});

export default router;
