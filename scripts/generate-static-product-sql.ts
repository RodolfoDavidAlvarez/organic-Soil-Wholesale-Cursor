#!/usr/bin/env ts-node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type RawProduct = Record<string, any>;

interface SourceConfig {
  file: string;
  baseId: number;
}

const SOURCE_FILES: SourceConfig[] = [
  { file: 'Amendment Products.json', baseId: 1000 },
  { file: 'Potting Soil Products.json', baseId: 2000 },
  { file: 'Mulch Products.json', baseId: 3000 },
  { file: 'Concentrated Amendment Products.json', baseId: 4000 },
];

const DATA_DIR = path.join(__dirname, '../client/src/data/json');
const STORY_PATH = path.join(DATA_DIR, 'product_stories_and_overview.json');
const OUTPUT_PATH = path.join(__dirname, 'static-product-seed.sql');

const loadJson = (filePath: string) => {
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
};

const DEFAULT_IMAGE_FALLBACK = 'Compost Texture Look.jpg';

const productStories: RawProduct[] = loadJson(STORY_PATH);

const buildStoryMap = () => {
  const map = new Map<string, RawProduct>();
  productStories.forEach((story) => {
    const name = typeof story['Product name'] === 'string' ? story['Product name'].toLowerCase() : null;
    if (name) {
      map.set(name, story);
    }
  });
  return map;
};

const sanitizeText = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const escapeLiteral = (value: string) => value.replace(/'/g, "''");

const sqlLiteral = (value: string | null | undefined) => {
  if (!value) {
    return 'NULL';
  }
  return `'${escapeLiteral(value)}'`;
};

const sqlBoolean = (value: boolean) => (value ? 'TRUE' : 'FALSE');

const sqlNumber = (value: number | null | undefined) => (typeof value === 'number' && Number.isFinite(value) ? value.toString() : 'NULL');

const sqlTextArray = (values?: string[] | null) => {
  if (!values || values.length === 0) {
    return 'NULL';
  }
  const filtered = values
    .map((entry) => sanitizeText(entry))
    .filter((entry): entry is string => Boolean(entry));

  if (filtered.length === 0) {
    return 'NULL';
  }

  return `ARRAY[${filtered.map((entry) => sqlLiteral(entry)).join(', ')}]`;
};

const storyMap = buildStoryMap();

const buildDefaultDescription = (name: string) =>
  `${name} is part of Soil Seed & Water's professional wholesale collection, crafted for demanding growers and landscapers.`;

const buildDefaultFeatures = (name: string) =>
  `${name} improves soil structure, balances moisture, and feeds biology for consistent performance at scale.`;

const buildDefaultStory = (name: string) =>
  `${name} is blended in small batches by the Soil Seed & Water team using screened compost, minerals, and bioactive inputs for predictable results.`;

const buildDefaultUsage = (name: string) =>
  `Apply ${name} evenly, incorporate into the top few inches of soil, and water thoroughly to activate microbial life.`;

const buildDefaultRecommendedUses = (name: string) =>
  `Blend ${name} into raised beds, landscape installs, planter mixes, turf renovations, and specialty grow projects.`;

const buildDefaultIngredients = (name: string) =>
  `${name} combines premium composted organics with mineral-rich amendments and biochar to nourish soil life.`;

const DEFAULT_AUDIENCE = 'Landscape contractors, commercial growers, nurseries, and retail partners.';

const collectProducts = () => {
  let catalogOrder = 0;
  const records: Array<Record<string, any>> = [];

  SOURCE_FILES.forEach((source) => {
    const filePath = path.join(DATA_DIR, source.file);
    const rawProducts: RawProduct[] = loadJson(filePath);

    rawProducts.forEach((rawProduct, index) => {
      const productName = sanitizeText(rawProduct['Product name']);
      if (!productName) {
        return;
      }

      const nameKey = productName.toLowerCase();
      const brandName = sanitizeText(rawProduct['Brand name']);
      const storyEntry = storyMap.get(nameKey) || (brandName ? storyMap.get(brandName.toLowerCase()) : undefined);

      const description =
        sanitizeText(storyEntry?.['Brief Overview']) ||
        sanitizeText(rawProduct['Brief Overview']) ||
        sanitizeText(rawProduct['Key Features/benefits']) ||
        null;

      const bagPhoto = sanitizeText(rawProduct['9lb Bag Photo URL']);
      const texturePhoto = sanitizeText(rawProduct['Product Texture Photo URL']);
      const heroImage = texturePhoto || bagPhoto || null;
      const safeHeroImage = heroImage || DEFAULT_IMAGE_FALLBACK;

      const sizeCategories = sanitizeText(rawProduct['Size Categories']);
      const availableSizes = sizeCategories
        ? sizeCategories.split(',').map((entry) => entry.trim()).filter(Boolean)
        : [];

      const additionalImages: string[] = Array.isArray(rawProduct.additionalImages) ? rawProduct.additionalImages : [];

      const marketingTitleRaw = sanitizeText(rawProduct['Marketing Title']);
      const marketingNoteRaw = sanitizeText(rawProduct['Marketing Note']);
      const ingredientsRaw = sanitizeText(rawProduct['Ingredients']);
      const targetAudienceRaw = sanitizeText(rawProduct['Target audience']);
      const recommendedUsesRaw = sanitizeText(rawProduct['Recommended Uses']);
      const featuresRaw = sanitizeText(rawProduct['Key Features/benefits']);
      const storyRaw = sanitizeText(storyEntry?.['Story']) || sanitizeText(rawProduct['Story']);
      const usageRaw = sanitizeText(rawProduct['Gardener Usage Instructions']);

      const safeDescription = description ?? buildDefaultDescription(productName);
      const safeMarketingTitle = marketingTitleRaw ?? `${productName} — Soil Seed & Water`;
      const safeMarketingNote = marketingNoteRaw ?? safeDescription;
      const safeIngredients = ingredientsRaw ?? buildDefaultIngredients(productName);
      const safeAudience = targetAudienceRaw ?? DEFAULT_AUDIENCE;
      const safeRecommendedUses = recommendedUsesRaw ?? buildDefaultRecommendedUses(productName);
      const safeFeatures = featuresRaw ?? buildDefaultFeatures(productName);
      const safeStory = storyRaw ?? buildDefaultStory(productName);
      const safeUsage = usageRaw ?? buildDefaultUsage(productName);
      const safeTexturePhoto = texturePhoto || safeHeroImage;
      const safeImageUrl = bagPhoto || safeHeroImage;

      const record = {
        id: source.baseId + index,
        name: productName,
        display_title: sanitizeText(rawProduct['Display Title']) || productName,
        description: safeDescription,
        category: sanitizeText(rawProduct['Product Category']) || 'General',
        product_type: brandName || sanitizeText(rawProduct['Product Category']),
        marketing_title: safeMarketingTitle,
        marketing_note: safeMarketingNote,
        seo_keywords: sanitizeText(rawProduct['SEO Keywords']) || productName.toLowerCase().replace(/\s+/g, ', '),
        ingredients: safeIngredients,
        target_audience: safeAudience,
        recommended_uses: safeRecommendedUses,
        features: safeFeatures,
        story: safeStory,
        usage: safeUsage,
        size_options: sizeCategories,
        image_url: safeImageUrl,
        texture_photo_url: safeTexturePhoto,
        additional_images: additionalImages,
        available_size_options: availableSizes,
        price: 0,
        stock_quantity: 0,
        is_catalog_enabled: true,
        catalog_display_order: catalogOrder,
        pay_and_pickup_description: safeDescription,
        pay_and_pickup_hero_image: safeHeroImage,
        is_pay_and_pickup_enabled: false,
        pay_and_pickup_display_order: catalogOrder,
        product_status: 'active',
      };

      catalogOrder += 1;
      records.push(record);
    });
  });

  return records;
};

const buildStatements = (records: Array<Record<string, any>>) => {
  const columns = [
    'id',
    'name',
    'display_title',
    'description',
    'category',
    'product_type',
    'marketing_title',
    'marketing_note',
    'seo_keywords',
    'ingredients',
    'target_audience',
    'recommended_uses',
    'features',
    'story',
    'usage',
    'size_options',
    'image_url',
    'texture_photo_url',
    'additional_images',
    'available_size_options',
    'price',
    'stock_quantity',
    'is_catalog_enabled',
    'catalog_display_order',
    'pay_and_pickup_description',
    'pay_and_pickup_hero_image',
    'is_pay_and_pickup_enabled',
    'pay_and_pickup_display_order',
    'product_status',
  ];

  return records.map((record) => {
    const values = [
      sqlNumber(record.id),
      sqlLiteral(record.name),
      sqlLiteral(record.display_title),
      sqlLiteral(record.description),
      sqlLiteral(record.category),
      sqlLiteral(record.product_type),
      sqlLiteral(record.marketing_title),
      sqlLiteral(record.marketing_note),
      sqlLiteral(record.seo_keywords),
      sqlLiteral(record.ingredients),
      sqlLiteral(record.target_audience),
      sqlLiteral(record.recommended_uses),
      sqlLiteral(record.features),
      sqlLiteral(record.story),
      sqlLiteral(record.usage),
      sqlLiteral(record.size_options),
      sqlLiteral(record.image_url),
      sqlLiteral(record.texture_photo_url),
      sqlTextArray(record.additional_images),
      sqlTextArray(record.available_size_options),
      sqlNumber(record.price),
      sqlNumber(record.stock_quantity),
      sqlBoolean(record.is_catalog_enabled),
      sqlNumber(record.catalog_display_order),
      sqlLiteral(record.pay_and_pickup_description),
      sqlLiteral(record.pay_and_pickup_hero_image),
      sqlBoolean(record.is_pay_and_pickup_enabled),
      sqlNumber(record.pay_and_pickup_display_order),
      sqlLiteral(record.product_status),
    ];

    const updateClause = columns
      .filter((column) => column !== 'id')
      .map((column) => `${column} = EXCLUDED.${column}`)
      .join(', ');

    return `INSERT INTO products (${columns.join(', ')})\nVALUES (${values.join(', ')})\nON CONFLICT (id) DO UPDATE SET ${updateClause};`;
  });
};

const main = () => {
  const records = collectProducts();
  const statements = buildStatements(records);
  fs.writeFileSync(OUTPUT_PATH, statements.join('\n\n') + '\n');
  console.log(`Generated SQL for ${records.length} products → ${OUTPUT_PATH}`);
};

main();
