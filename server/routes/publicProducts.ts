import { Router } from 'express';
import { supabase } from '../db/supabase.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { loadProductData } = require('../loadProducts.js');

const router = Router();

type FallbackProduct = ReturnType<typeof loadProductData>[number];

type FallbackCacheEntry = {
  product: FallbackProduct;
  normalizedValues: string[];
  slugValues: string[];
};

type FallbackCache = {
  products: FallbackProduct[];
  entries: FallbackCacheEntry[];
  byId: Map<number, FallbackProduct>;
};

const normalizeValue = (value?: string | null) =>
  typeof value === 'string' ? value.trim().toLowerCase() : undefined;

const slugify = (value?: string | null) => {
  if (!value) return undefined;
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || undefined;
};

let fallbackProductCache: FallbackCache | null = null;

const ensureFallbackCache = (): FallbackCache => {
  if (!fallbackProductCache) {
    const products = (loadProductData() ?? []) as FallbackProduct[];
    const byId = new Map<number, FallbackProduct>();
    const entries: FallbackCacheEntry[] = products.map((product) => {
      if (typeof product?.id === 'number') {
        byId.set(product.id, product);
      }

      const values = [
        product?.name,
        product?.productType,
        product?.displayTitle,
        product?.marketingTitle
      ] as Array<string | undefined>;

      const normalizedValues = values
        .map(normalizeValue)
        .filter((value): value is string => Boolean(value));

      const slugValues = values
        .map(slugify)
        .filter((value): value is string => Boolean(value));

      return {
        product,
        normalizedValues,
        slugValues
      };
    });

    fallbackProductCache = { products, entries, byId };
  }

  return fallbackProductCache;
};

const getFallbackProducts = () => ensureFallbackCache().products;

const hasLooseMatch = (recordValues: string[], fallbackValues: string[]) => {
  for (const recordValue of recordValues) {
    for (const fallbackValue of fallbackValues) {
      if (!recordValue || !fallbackValue) {
        continue;
      }

      if (recordValue === fallbackValue) {
        return true;
      }

      const minLength = Math.min(recordValue.length, fallbackValue.length);
      if (
        minLength >= 5 &&
        (recordValue.includes(fallbackValue) || fallbackValue.includes(recordValue))
      ) {
        return true;
      }
    }
  }

  return false;
};

const findFallbackProduct = (record: RawProduct, fallbackId?: number) => {
  const cache = ensureFallbackCache();

  if (typeof record.id === 'number') {
    const directMatch = cache.byId.get(record.id);
    if (directMatch) {
      return directMatch;
    }
  }

  if (typeof fallbackId === 'number') {
    const fallbackIdMatch = cache.byId.get(fallbackId);
    if (fallbackIdMatch) {
      return fallbackIdMatch;
    }
  }

  const recordValues = [
    record?.name,
    record?.product_type,
    record?.display_title,
    record?.marketing_title
  ] as Array<string | undefined>;

  const recordNormalized = recordValues
    .map(normalizeValue)
    .filter((value): value is string => Boolean(value));

  const recordSlugs = recordValues
    .map(slugify)
    .filter((value): value is string => Boolean(value));

  for (const entry of cache.entries) {
    if (
      hasLooseMatch(recordNormalized, entry.normalizedValues) ||
      hasLooseMatch(recordSlugs, entry.slugValues)
    ) {
      return entry.product;
    }
  }

  return undefined;
};

type PublicSizePriceOption = {
  key: string;
  label: string;
  price: number;
  priceCents: number;
  image?: string;
  description?: string;
  isActive: boolean;
  displayOrder?: number;
};

const toMoneyCents = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    if (Number.isInteger(value) && Math.abs(value) >= 100) {
      return value;
    }
    return Math.round(value * 100);
  }

  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.]/g, '');
    if (!cleaned) return null;
    const numeric = Number(cleaned);
    if (Number.isNaN(numeric)) return null;
    if (cleaned.includes('.')) {
      return Math.round(numeric * 100);
    }
    if (numeric >= 1000) {
      return numeric;
    }
    return Math.round(numeric * 100);
  }

  return null;
};

const extractOptionPriceCents = (option: Record<string, unknown>): number | null => {
  const fields = ['price_cents', 'priceCents', 'price', 'amount', 'value', 'unit_price'];
  for (const field of fields) {
    if (!(field in option)) continue;
    const cents = toMoneyCents(option[field]);
    if (cents !== null) {
      return cents;
    }
  }
  return null;
};

const normalizeSizePriceOptions = (input: unknown): PublicSizePriceOption[] => {
  if (input === null || input === undefined) {
    return [];
  }

  let parsed: unknown = input;

  if (typeof input === 'string') {
    try {
      parsed = JSON.parse(input);
    } catch {
      return [];
    }
  }

  const toNormalized = (value: unknown): PublicSizePriceOption | null => {
    if (!value || typeof value !== 'object') {
      return null;
    }

    const record = value as Record<string, unknown>;
    const rawKeyCandidates = [record.key, record.size_key, record.slug, record.id, record.code];
    const rawLabelCandidates = [record.label, record.name, record.title, record.display_name];

    const rawKey = rawKeyCandidates.find(
      (candidate): candidate is string => typeof candidate === 'string' && candidate.trim().length > 0,
    );
    const rawLabel = rawLabelCandidates.find(
      (candidate): candidate is string => typeof candidate === 'string' && candidate.trim().length > 0,
    );

    let key = rawKey?.trim();
    let label = rawLabel?.trim();

    if (!key && label) {
      key = label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }

    if (!label && key) {
      label = key;
    }

    if (!key && !label) {
      return null;
    }

    const priceCents = extractOptionPriceCents(record);
    if (priceCents === null) {
      return null;
    }

    const image =
      typeof record.image === 'string'
        ? record.image
        : typeof record.image_url === 'string'
          ? record.image_url
          : undefined;

    const description =
      typeof record.description === 'string' ? record.description : undefined;

    const displayOrder =
      typeof record.display_order === 'number'
        ? record.display_order
        : typeof record.order === 'number'
          ? record.order
          : undefined;

    const activeField =
      'is_active' in record
        ? record.is_active
        : 'active' in record
          ? record.active
          : 'enabled' in record
            ? record.enabled
            : 'visible' in record
              ? record.visible
              : undefined;

    let isActive = true;
    if (typeof activeField === 'boolean') {
      isActive = activeField;
    } else if (typeof activeField === 'string') {
      isActive = !['false', '0', 'no', 'off', 'hidden', 'inactive'].includes(activeField.toLowerCase());
    } else if (typeof activeField === 'number') {
      isActive = activeField !== 0;
    }

    return {
      key: key ?? label ?? '',
      label: label ?? key ?? '',
      priceCents,
      price: priceCents / 100,
      image,
      description,
      isActive,
      displayOrder,
    };
  };

  if (Array.isArray(parsed)) {
    return parsed
      .map(toNormalized)
      .filter((item): item is PublicSizePriceOption => Boolean(item));
  }

  if (parsed && typeof parsed === 'object') {
    return Object.values(parsed)
      .map(toNormalized)
      .filter((item): item is PublicSizePriceOption => Boolean(item));
  }

  return [];
};

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
  is_catalog_enabled?: boolean | null;
  catalog_display_order?: number | null;
  size_price_options?: unknown;
};

const toPublicProduct = (record: RawProduct, fallbackId?: number) => {
  const priceInDollars =
    typeof record.price === 'number' ? record.price / 100 : record.price;

  const fallbackProduct = findFallbackProduct(record, fallbackId);

  const primaryImageUrl =
    (typeof record.texture_photo_url === 'string' && record.texture_photo_url.trim().length > 0
      ? record.texture_photo_url
      : undefined) ??
    (typeof record.image_url === 'string' && record.image_url.trim().length > 0
      ? record.image_url
      : undefined) ??
    (typeof fallbackProduct?.texturePhotoUrl === 'string' &&
    fallbackProduct.texturePhotoUrl.trim().length > 0
      ? fallbackProduct.texturePhotoUrl
      : undefined) ??
    (typeof fallbackProduct?.imageUrl === 'string' && fallbackProduct.imageUrl.trim().length > 0
      ? fallbackProduct.imageUrl
      : undefined);

  const textureImageUrl =
    (typeof record.texture_photo_url === 'string' && record.texture_photo_url.trim().length > 0
      ? record.texture_photo_url
      : undefined) ??
    (typeof fallbackProduct?.texturePhotoUrl === 'string' &&
    fallbackProduct.texturePhotoUrl.trim().length > 0
      ? fallbackProduct.texturePhotoUrl
      : undefined);

  const resolvedAdditionalImages =
    Array.isArray(record.additional_images) && record.additional_images.length > 0
      ? record.additional_images
      : Array.isArray(fallbackProduct?.additionalImages)
        ? fallbackProduct.additionalImages
        : [];

  const primarySizePriceOptions = normalizeSizePriceOptions(record.size_price_options);
  const sizePriceOptions =
    primarySizePriceOptions.length > 0
      ? primarySizePriceOptions
      : normalizeSizePriceOptions(fallbackProduct?.sizePriceOptions);

  return {
    id: record.id ?? fallbackId ?? 0,
    name: record.name ?? fallbackProduct?.name ?? '',
    description: record.description ?? fallbackProduct?.description ?? undefined,
    category: record.category ?? fallbackProduct?.category,
    price: priceInDollars ?? 0,
    imageUrl: primaryImageUrl,
    texturePhotoUrl: textureImageUrl,
    ingredients: record.ingredients ?? fallbackProduct?.ingredients ?? undefined,
    targetAudience: record.target_audience ?? fallbackProduct?.targetAudience ?? undefined,
    recommendedUses: record.recommended_uses ?? fallbackProduct?.recommendedUses ?? undefined,
    story: record.story ?? fallbackProduct?.story ?? undefined,
    usage: record.usage ?? fallbackProduct?.usage ?? undefined,
    certifications: record.certifications ?? fallbackProduct?.certifications ?? undefined,
    features: record.features ?? fallbackProduct?.features ?? undefined,
    sizeOptions: record.size_options ?? fallbackProduct?.sizeOptions ?? undefined,
    productType: record.product_type ?? fallbackProduct?.productType ?? undefined,
    displayTitle: record.display_title ?? fallbackProduct?.displayTitle ?? undefined,
    marketingTitle: record.marketing_title ?? fallbackProduct?.marketingTitle ?? undefined,
    seoKeywords: record.seo_keywords ?? fallbackProduct?.seoKeywords ?? undefined,
    marketingNote: record.marketing_note ?? fallbackProduct?.marketingNote ?? undefined,
    productVideoUrl: record.product_video_url ?? fallbackProduct?.productVideoUrl ?? undefined,
    productVideoTitle:
      record.product_video_title ?? fallbackProduct?.productVideoTitle ?? undefined,
    isWholesaleOnly: Boolean(record.is_wholesale_only),
    additionalImages: resolvedAdditionalImages,
    allowBulkPickup: Boolean(record.allow_bulk_pickup),
    availableSizeOptions:
      record.available_size_options ?? fallbackProduct?.availableSizeOptions ?? [],
    sizePriceOptions,
    minOrderQuantity: record.min_order_quantity ?? fallbackProduct?.minOrderQuantity ?? 1,
    maxOrderQuantity: record.max_order_quantity ?? fallbackProduct?.maxOrderQuantity ?? undefined,
    isPriceNegotiable:
      record.is_price_negotiable !== undefined
        ? Boolean(record.is_price_negotiable)
        : Boolean(fallbackProduct?.isPriceNegotiable),
    requiresQuote:
      record.requires_quote !== undefined
        ? Boolean(record.requires_quote)
        : Boolean(fallbackProduct?.requiresQuote),
    catalog: {
      isEnabled:
        record.is_catalog_enabled !== undefined
          ? Boolean(record.is_catalog_enabled)
          : fallbackProduct?.isCatalogEnabled ?? true,
      displayOrder: record.catalog_display_order ?? fallbackProduct?.catalogDisplayOrder ?? 0,
    },
    isCatalogEnabled:
      record.is_catalog_enabled !== undefined
        ? Boolean(record.is_catalog_enabled)
        : fallbackProduct?.isCatalogEnabled ?? true,
    catalogDisplayOrder: record.catalog_display_order ?? fallbackProduct?.catalogDisplayOrder ?? 0,
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

  let query = supabase.from<RawProduct>('products').select('*');

  if (category && category !== 'all') {
    query = query.eq('category', category as string);
  }

  if (payAndPickup === 'true') {
    query = query
      .eq('is_pay_and_pickup_enabled', true)
      .order('pay_and_pickup_display_order', { ascending: true, nullsFirst: false })
      .order('name', { ascending: true });
  } else {
    query = query
      .eq('is_catalog_enabled', true)
      .order('catalog_display_order', { ascending: true, nullsFirst: false })
      .order('name', { ascending: true });
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data?.map((product) => toPublicProduct(product)) ?? [];
}

function getProductsFromFallback(category?: string | string[]) {
  const fallbackData = getFallbackProducts();

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
        size_price_options: product.sizePriceOptions,
        min_order_quantity: product.minOrderQuantity,
        max_order_quantity: product.maxOrderQuantity,
        is_price_negotiable: product.isPriceNegotiable,
        requires_quote: product.requiresQuote,
        is_catalog_enabled: product.isCatalogEnabled ?? true,
        catalog_display_order: product.catalogDisplayOrder ?? index
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
      const fallbackProducts = getFallbackProducts();
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
          size_price_options: fallback.sizePriceOptions,
          min_order_quantity: fallback.minOrderQuantity,
          max_order_quantity: fallback.maxOrderQuantity,
          is_price_negotiable: fallback.isPriceNegotiable,
          requires_quote: fallback.requiresQuote,
          is_catalog_enabled: fallback.isCatalogEnabled ?? true,
          catalog_display_order: fallback.catalogDisplayOrder ?? Number(id) - 1
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
