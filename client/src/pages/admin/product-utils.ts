import { SIZE_CATALOG, SIZE_CATALOG_BY_KEY, type SizeCatalogEntry } from "@/data/sizeCatalog";
import { generateProductSlug, generateSlug } from "@/utils/generateSlug";
import { getOptimizedImageSrc, getOriginalImageSrc } from "@/utils/getOptimizedImageSrc";

export type Product = {
  id: number;
  name: string;
  display_title?: string | null;
  slug?: string | null;
  description?: string | null;
  sku?: string | null;
  category?: string | null;
  product_type?: string | null;
  productType?: string | null;
  price?: number | null;
  stock_quantity?: number | null;
  is_catalog_enabled?: boolean | null;
  catalog_display_order?: number | null;
  is_pay_and_pickup_enabled?: boolean | null;
  pay_and_pickup_display_order?: number | null;
  pay_and_pickup_description?: string | null;
  pay_and_pickup_hero_image?: string | null;
  pay_and_pickup_badge?: string | null;
  texture_photo_url?: string | null;
  image_url?: string | null;
  marketing_title?: string | null;
  marketing_note?: string | null;
  seo_keywords?: string | null;
  ingredients?: string | null;
  target_audience?: string | null;
  recommended_uses?: string | null;
  features?: string | null;
  story?: string | null;
  usage?: string | null;
  additional_images?: string[] | string | null;
  available_size_options?: string[] | string | null;
  size_price_options?: ProductSizePriceOption[] | string | null;
  product_video_url?: string | null;
  product_video_title?: string | null;
  product_status?: string | null;
  inventory?:
    | Array<{
        id?: number;
        size_option?: string | null;
        sizeOption?: string | null;
        quantity_available?: number | null;
        quantityAvailable?: number | null;
        quantity_reserved?: number | null;
        quantityReserved?: number | null;
        price?: number | null;
        unit_price?: number | null;
      }>
    | string
    | null;
  [key: string]: unknown;
};

export type EditFormData = {
  name: string;
  display_title: string;
  slug: string;
  category: string;
  marketing_note: string;
  description: string;
  ingredients: string;
  recommended_uses: string;
  features: string;
  story: string;
  usage: string;
  target_audience: string;
  catalog_display_order: string;
  is_catalog_enabled: boolean;
  is_pay_and_pickup_enabled: boolean;
  pay_and_pickup_description: string;
  pay_and_pickup_badge: string;
  image_url: string;
  additional_images: string[];
  video_urls: string[]; // Array of YouTube video URLs
  thumbnail_index: number; // Index of the thumbnail image in additional_images array (-1 if using image_url)
  available_size_options: string[];
  size_price_options: SizePriceOptionFormValue[];
};

export const PRODUCT_IMAGE_FOLDER = "products";

export const formatPrice = (price?: number | null) => {
  if (price === null || price === undefined) return "0.00";
  const numericPrice = Number(price);
  if (!Number.isFinite(numericPrice)) {
    return "0.00";
  }

  const normalized = Number.isInteger(numericPrice) && Math.abs(numericPrice) >= 100 ? numericPrice / 100 : numericPrice;

  return normalized.toFixed(2);
};

export type ProductSizePriceOption = {
  key: string;
  label: string;
  price_cents?: number | null;
  price?: number | null;
  image?: string | null;
  description?: string | null;
  display_order?: number | null;
  is_active?: boolean | null;
};

export type SizePriceOptionFormValue = {
  key: string;
  label: string;
  description?: string;
  image?: string;
  price: string;
  isActive: boolean;
  inventoryQuantity: string;
  displayOrder?: number;
};

const PRICE_FIELDS = ["price_cents", "priceCents", "price", "amount", "value", "unit_price"];

const isSizeCatalogKey = (value: string): value is keyof typeof SIZE_CATALOG_BY_KEY =>
  Object.prototype.hasOwnProperty.call(SIZE_CATALOG_BY_KEY, value);

const toMoneyInCents = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    if (Number.isInteger(value) && Math.abs(value) >= 100) {
      return value;
    }
    return Math.round(value * 100);
  }

  if (typeof value === "string") {
    const cleaned = value.replace(/[^0-9.]/g, "");
    if (!cleaned) return null;
    const numeric = Number(cleaned);
    if (Number.isNaN(numeric)) return null;
    if (cleaned.includes(".")) {
      return Math.round(numeric * 100);
    }
    if (numeric >= 1000) {
      return numeric;
    }
    return Math.round(numeric * 100);
  }

  return null;
};

const extractPriceCents = (option: Record<string, unknown>): number | null => {
  for (const field of PRICE_FIELDS) {
    if (!(field in option)) continue;
    const cents = toMoneyInCents(option[field]);
    if (cents !== null) {
      return cents;
    }
  }
  return null;
};

const normalizeBoolean = (value: unknown): boolean | null => {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    if (value === 1) return true;
    if (value === 0) return false;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "enabled", "active", "on"].includes(normalized)) {
      return true;
    }
    if (["false", "0", "no", "disabled", "inactive", "off", "hidden"].includes(normalized)) {
      return false;
    }
  }
  return null;
};

const normalizeSizeOptionRecord = (input: Record<string, unknown>): ProductSizePriceOption | null => {
  const rawKeyCandidates = [input.key, input.size_key, input.slug, input.id, input.code];
  const rawLabelCandidates = [input.label, input.name, input.title, input.display_name];

  const rawKey = rawKeyCandidates.find((candidate): candidate is string => typeof candidate === "string" && candidate.trim().length > 0);
  const rawLabel = rawLabelCandidates.find((candidate): candidate is string => typeof candidate === "string" && candidate.trim().length > 0);

  let key = rawKey?.trim();
  let label = rawLabel?.trim();

  if (!key && label) {
    const normalizedLabel = label.toLowerCase();
    const catalogMatch = SIZE_CATALOG.find((entry) => entry.label.toLowerCase() === normalizedLabel);
    key = catalogMatch?.key ?? normalizedLabel.replace(/[^a-z0-9]+/g, "-");
  }

  if (key && !label) {
    const catalogEntry = isSizeCatalogKey(key) ? SIZE_CATALOG_BY_KEY[key] : undefined;
    label = catalogEntry?.label ?? key;
  }

  if (!key && !label) {
    return null;
  }

  const priceCents = extractPriceCents(input);
  const imageCandidate =
    typeof input.image === "string"
      ? input.image
      : typeof input.image_url === "string"
        ? input.image_url
        : typeof input.photo === "string"
          ? input.photo
          : undefined;
  const descriptionCandidate = typeof input.description === "string" ? input.description : undefined;

  const displayOrderCandidate =
    typeof input.display_order === "number" ? input.display_order : typeof input.order === "number" ? input.order : undefined;

  const isActiveCandidate = normalizeBoolean(
    "is_active" in input
      ? input.is_active
      : "active" in input
        ? input.active
        : "enabled" in input
          ? input.enabled
          : "visible" in input
            ? input.visible
            : undefined
  );

  return {
    key: key ?? (label ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    label: label ?? key ?? "",
    price_cents: priceCents,
    price: priceCents !== null ? priceCents / 100 : undefined,
    image: imageCandidate ?? null,
    description: descriptionCandidate ?? null,
    display_order: displayOrderCandidate ?? null,
    is_active: isActiveCandidate,
  };
};

const parseSizePriceOptions = (value: unknown): ProductSizePriceOption[] => {
  if (value === null || value === undefined) {
    return [];
  }

  let parsedValue: unknown = value;

  if (typeof value === "string") {
    try {
      parsedValue = JSON.parse(value);
    } catch {
      return [];
    }
  }

  if (Array.isArray(parsedValue)) {
    return parsedValue
      .map((item) => {
        if (item && typeof item === "object") {
          return normalizeSizeOptionRecord(item as Record<string, unknown>);
        }
        return null;
      })
      .filter((item): item is ProductSizePriceOption => Boolean(item));
  }

  if (parsedValue && typeof parsedValue === "object") {
    // Handle map-like objects { key: {...} }
    const values = Object.values(parsedValue);
    return values
      .map((item) => {
        if (item && typeof item === "object") {
          return normalizeSizeOptionRecord(item as Record<string, unknown>);
        }
        return null;
      })
      .filter((item): item is ProductSizePriceOption => Boolean(item));
  }

  return [];
};

const toCamelCase = (value: string) => value.replace(/[_-](\w)/g, (_, char: string) => char.toUpperCase());

const createFieldCandidates = (key: string, extras: string[] = []) => {
  const camel = toCamelCase(key);
  const pascal = camel.charAt(0).toUpperCase() + camel.slice(1);
  const screaming = key.toUpperCase();

  return Array.from(new Set([key, camel, pascal, screaming, ...extras]));
};

const combineCandidates = (...groups: string[][]) => Array.from(new Set(groups.flat()));

const IMAGE_FILE_PATTERN = /\.(?:jpe?g|png|gif|webp|svg|avif|heic)$/i;
const EXTERNAL_IMAGE_PATTERN = /^(?:https?:)?\/\//i;

const decodeSegment = (segment: string) => {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
};

const encodePath = (path: string) => {
  const [pathname, query] = path.split("?", 2);
  const hasLeadingSlash = pathname.startsWith("/");
  const encodedPath = pathname
    .split("/")
    .filter((segment) => segment.length > 0)
    .map((segment) => encodeURIComponent(decodeSegment(segment)))
    .join("/");

  const rebuilt = `${hasLeadingSlash ? "/" : ""}${encodedPath}`;
  return query ? `${rebuilt}?${query}` : rebuilt;
};

const gatherImageCandidates = (value?: string | null): string[] => {
  if (typeof value !== "string") {
    return [];
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return [];
  }

  if (EXTERNAL_IMAGE_PATTERN.test(trimmed)) {
    return [trimmed];
  }

  const normalized = trimmed.replace(/^\/+/, "");
  const [pathPart] = normalized.split("?", 2);

  if (!IMAGE_FILE_PATTERN.test(pathPart)) {
    return [];
  }

  const candidateSet = new Set<string>();

  const pushCandidate = (candidate: string | undefined) => {
    if (!candidate) return;
    const encoded = encodePath(candidate);
    if (encoded.length > 0) {
      candidateSet.add(encoded);
    }
  };

  if (!normalized.includes("/")) {
    pushCandidate(getOptimizedImageSrc(normalized));
  }
  pushCandidate(getOriginalImageSrc(normalized));

  if (!normalized.includes("/")) {
    const prefixes = ["images", "images/products", "images/products/textures", "images/products/bags"];

    for (const prefix of prefixes) {
      pushCandidate(getOriginalImageSrc(`${prefix}/${normalized}`));
    }
  }

  return Array.from(candidateSet);
};

const selectBestImageCandidate = (...values: Array<string | undefined | null>): string => {
  for (const value of values) {
    const [candidate] = gatherImageCandidates(value);
    if (candidate) {
      return candidate;
    }
  }
  return "";
};

const parseStringArray = (value: unknown): string[] => {
  if (value === null || value === undefined) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
      }
    } catch {
      return trimmed
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  if (typeof value === "object") {
    const potentialArray = Object.values(value as Record<string, unknown>).filter(
      (item): item is string => typeof item === "string" && item.trim().length > 0
    );
    if (potentialArray.length > 0) {
      return potentialArray;
    }
  }

  return [];
};

const getStringField = (product: Product, keys: string[]): string => {
  for (const key of keys) {
    const value = product[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return "";
};

const getNumberField = (product: Product, keys: string[]): number | null => {
  for (const key of keys) {
    const value = product[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string" && value.trim().length > 0) {
      const parsed = Number(value);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
  }
  return null;
};

const getBooleanField = (product: Product, keys: string[], defaultValue = false): boolean => {
  for (const key of keys) {
    const value = product[key];

    if (typeof value === "boolean") {
      return value;
    }

    if (typeof value === "number") {
      if (value === 1) return true;
      if (value === 0) return false;
    }

    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (["true", "1", "yes", "enabled", "active", "on"].includes(normalized)) {
        return true;
      }
      if (["false", "0", "no", "disabled", "inactive", "off", "hidden"].includes(normalized)) {
        return false;
      }
    }
  }

  return defaultValue;
};

const getArrayField = (product: Product, keys: string[]): string[] => {
  for (const key of keys) {
    if (!(key in product)) continue;
    const parsed = parseStringArray(product[key]);
    if (parsed.length > 0) {
      return parsed;
    }
  }
  return [];
};

const NAME_KEYS = combineCandidates(createFieldCandidates("name"), createFieldCandidates("product_name"), ["productTitle"]);

const DISPLAY_TITLE_KEYS = combineCandidates(
  createFieldCandidates("display_title"),
  createFieldCandidates("displayTitle"),
  createFieldCandidates("title"),
  ["productTitle", "headline", "label"]
);

const SLUG_KEYS = combineCandidates(createFieldCandidates("slug"), ["product_slug", "productSlug"]);

const CATEGORY_KEYS = combineCandidates(createFieldCandidates("category"), createFieldCandidates("product_category"), ["collection"]);

const CATALOG_ORDER_KEYS = combineCandidates(createFieldCandidates("catalog_display_order"), createFieldCandidates("catalogDisplayOrder"), [
  "catalog_order",
  "catalogOrder",
  "catalog_sort",
  "catalogSort",
  "display_order",
  "displayOrder",
]);

const CATALOG_ENABLED_KEYS = combineCandidates(createFieldCandidates("is_catalog_enabled"), createFieldCandidates("catalog_enabled"), [
  "catalogVisible",
  "isCatalogVisible",
  "show_in_catalog",
  "showInCatalog",
  "display_in_catalog",
  "displayInCatalog",
]);

const PAY_PICKUP_DESCRIPTION_KEYS = combineCandidates(
  createFieldCandidates("pay_and_pickup_description"),
  createFieldCandidates("payAndPickupDescription"),
  createFieldCandidates("pickup_description"),
  createFieldCandidates("description"),
  ["overview", "summary"]
);

const PAY_PICKUP_BADGE_KEYS = combineCandidates(createFieldCandidates("pay_and_pickup_badge"), createFieldCandidates("payAndPickupBadge"), [
  "badge",
  "pickupBadge",
  "heroBadge",
]);

const DESCRIPTION_KEYS = combineCandidates(createFieldCandidates("description"), [
  "briefOverview",
  "overview",
  "summary",
  "long_description",
  "productDescription",
]);

const MARKETING_NOTE_KEYS = combineCandidates(createFieldCandidates("marketing_note"), createFieldCandidates("marketingNote"), [
  "promo_note",
  "tagline",
  "highlight",
]);

const INGREDIENTS_KEYS = combineCandidates(createFieldCandidates("ingredients"), ["composition", "components", "inputs"]);

const RECOMMENDED_USES_KEYS = combineCandidates(createFieldCandidates("recommended_uses"), createFieldCandidates("recommendedUses"), [
  "bestUses",
  "use_cases",
  "applications",
]);

const FEATURES_KEYS = combineCandidates(createFieldCandidates("features"), ["benefits", "key_features", "highlights"]);

const TARGET_AUDIENCE_KEYS = combineCandidates(createFieldCandidates("target_audience"), createFieldCandidates("targetAudience"), [
  "audience",
  "best_for",
  "bestFor",
  "target_market",
]);

const STORY_KEYS = combineCandidates(createFieldCandidates("story"), ["origin_story", "background", "narrative"]);

const USAGE_KEYS = combineCandidates(createFieldCandidates("usage"), ["instructions", "how_to_use", "application"]);

const PAY_PICKUP_ENABLED_KEYS = combineCandidates(
  createFieldCandidates("is_pay_and_pickup_enabled"),
  createFieldCandidates("pay_and_pickup_enabled"),
  ["isPayAndPickupEnabled", "payAndPickup", "payAndPickupEnabled", "pay_and_pickup"]
);

const HERO_IMAGE_KEYS = combineCandidates(
  createFieldCandidates("pay_and_pickup_hero_image"),
  createFieldCandidates("hero_image_url"),
  createFieldCandidates("hero_image"),
  ["payAndPickupHeroImageUrl"]
);

const TEXTURE_IMAGE_KEYS = combineCandidates(
  createFieldCandidates("texture_photo_url"),
  createFieldCandidates("texture_photo"),
  createFieldCandidates("texture_image_url"),
  createFieldCandidates("texture_image"),
  ["texturePhoto", "textureImage"]
);

const IMAGE_URL_KEYS = combineCandidates(
  createFieldCandidates("image_url"),
  createFieldCandidates("primary_image_url"),
  createFieldCandidates("image"),
  ["imageUrl", "primaryImage"]
);

const ADDITIONAL_IMAGES_KEYS = combineCandidates(
  createFieldCandidates("additional_images", ["additionalImages", "images", "photos", "gallery"]),
  createFieldCandidates("gallery_images"),
  ["galleryImages"]
);

const SIZE_OPTIONS_KEYS = combineCandidates(createFieldCandidates("available_size_options"), createFieldCandidates("size_options"), [
  "availableSizes",
  "sizes",
  "sizeOptions",
  "availableSizeOptions",
]);

const SIZE_PRICE_OPTIONS_KEYS = combineCandidates(createFieldCandidates("size_price_options"), createFieldCandidates("sizePriceOptions"), [
  "sizePricing",
  "size_price",
  "sizePrices",
  "sizeOptionPricing",
]);

const getSizePriceOptions = (product: Product): ProductSizePriceOption[] => {
  if (Array.isArray(product.size_price_options) && product.size_price_options.length > 0) {
    return product.size_price_options
      .map((item) => (item && typeof item === "object" ? normalizeSizeOptionRecord(item as Record<string, unknown>) : null))
      .filter((item): item is ProductSizePriceOption => Boolean(item));
  }

  for (const key of SIZE_PRICE_OPTIONS_KEYS) {
    if (!(key in product)) continue;
    const parsed = parseSizePriceOptions(product[key]);
    if (parsed.length > 0) {
      return parsed;
    }
  }

  return [];
};

const buildProductImageCandidates = (product: Product): string[] => {
  const hero = getStringField(product, HERO_IMAGE_KEYS);
  const texture = getStringField(product, TEXTURE_IMAGE_KEYS);
  const base = getStringField(product, IMAGE_URL_KEYS);
  const gallery = getArrayField(product, ADDITIONAL_IMAGES_KEYS);

  // Order: hero image first, then pay & pickup hero, then texture, then gallery
  const orderedSources = [base, hero, texture, ...gallery];
  const result: string[] = [];

  for (const source of orderedSources) {
    const candidates = gatherImageCandidates(source);
    for (const candidate of candidates) {
      if (!result.includes(candidate)) {
        result.push(candidate);
      }
    }
  }

  return result;
};

export const buildEditForm = (product: Product): EditFormData => {
  const catalogOrderValue =
    getNumberField(product, CATALOG_ORDER_KEYS) ?? (typeof product.catalog_display_order === "number" ? product.catalog_display_order : null);

  const generalDescription = getStringField(product, DESCRIPTION_KEYS) || (typeof product.description === "string" ? product.description : "");

  const payPickupDescription = getStringField(product, PAY_PICKUP_DESCRIPTION_KEYS) || generalDescription;

  const inventoryEntries = (() => {
    if (Array.isArray(product.inventory)) {
      return product.inventory;
    }

    if (typeof product.inventory === "string") {
      try {
        const parsed = JSON.parse(product.inventory);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch {
        // ignore parse errors
      }
    }

    return [];
  })();

  const inventoryMap = new Map<string, number>();

  for (const entry of inventoryEntries) {
    if (!entry) continue;
    const rawLabel = (typeof entry.size_option === "string" && entry.size_option) || (typeof entry.sizeOption === "string" && entry.sizeOption) || "";

    if (!rawLabel) continue;
    const normalizedLabel = rawLabel.trim().toLowerCase();
    if (!normalizedLabel) continue;

    const quantityValue =
      (typeof entry.quantity_available === "number" && Number.isFinite(entry.quantity_available) ? entry.quantity_available : null) ??
      (typeof entry.quantityAvailable === "number" && Number.isFinite(entry.quantityAvailable) ? entry.quantityAvailable : null);

    const quantity = quantityValue ?? 0;
    inventoryMap.set(normalizedLabel, quantity);
  }

  const heroImageRaw = getStringField(product, HERO_IMAGE_KEYS);
  const textureImageRaw = getStringField(product, TEXTURE_IMAGE_KEYS);
  const baseImageRaw = getStringField(product, IMAGE_URL_KEYS);
  const galleryImagesRaw = getArrayField(product, ADDITIONAL_IMAGES_KEYS);

  const payPickupHeroImage = selectBestImageCandidate(heroImageRaw, baseImageRaw, galleryImagesRaw[0]);
  const primaryImage = selectBestImageCandidate(baseImageRaw, heroImageRaw, textureImageRaw);
  const textureImage = selectBestImageCandidate(textureImageRaw, heroImageRaw, baseImageRaw);
  const galleryImages = galleryImagesRaw.map((image) => selectBestImageCandidate(image)).filter((image): image is string => Boolean(image));
  const sizeOptions = getArrayField(product, SIZE_OPTIONS_KEYS);
  const sizePriceOptions = getSizePriceOptions(product);
  const availableSizeSet = new Set(sizeOptions.map((option) => option.toLowerCase()));

  const findSizeOptionByCatalog = (entry: SizeCatalogEntry): ProductSizePriceOption | undefined => {
    const byKey = sizePriceOptions.find((option) => option.key === entry.key);
    if (byKey) return byKey;
    return sizePriceOptions.find((option) => option.label?.toLowerCase() === entry.label.toLowerCase());
  };

  const getProductSizePriceCents = (option?: ProductSizePriceOption | null): number | null => {
    if (!option) return null;
    if (typeof option.price_cents === "number" && Number.isFinite(option.price_cents)) {
      return option.price_cents;
    }
    if (typeof option.price === "number" && Number.isFinite(option.price)) {
      return Math.round(option.price * 100);
    }
    return null;
  };

  const baseSizePriceFormValues: SizePriceOptionFormValue[] = SIZE_CATALOG.map((entry) => {
    const existing = findSizeOptionByCatalog(entry);
    const priceCents = getProductSizePriceCents(existing);
    // Use uploaded image if it exists and is not empty, otherwise fall back to catalog default
    const existingImage = existing?.image && typeof existing.image === "string" && existing.image.trim().length > 0 ? existing.image.trim() : undefined;
    const image = existingImage ?? entry.image;
    const inventoryQuantity = inventoryMap.get(entry.label.toLowerCase());

    const isActive =
      existing?.is_active != null
        ? Boolean(existing.is_active)
        : availableSizeSet.has(entry.label.toLowerCase()) || availableSizeSet.has(entry.key.toLowerCase());

      return {
        key: entry.key,
        label: entry.label,
        description: entry.description,
        image: image, // Already has fallback to entry.image above
        price: priceCents !== null ? formatPrice(priceCents) : "",
        isActive,
        inventoryQuantity: inventoryQuantity != null && Number.isFinite(inventoryQuantity) ? String(inventoryQuantity) : "",
        displayOrder: existing?.display_order ?? undefined,
      };
  });

  const catalogKeys = new Set<string>(SIZE_CATALOG.map((entry) => entry.key));

  const extraSizePriceFormValues: SizePriceOptionFormValue[] = sizePriceOptions
    .filter((option) => !catalogKeys.has(option.key))
    .map((option) => {
      const priceCents = getProductSizePriceCents(option);
      const label = option.label && option.label.trim().length > 0 ? option.label : option.key;
      const normalizedLabel = label.toLowerCase();
      const isActive =
        option.is_active != null
          ? Boolean(option.is_active)
          : availableSizeSet.has(normalizedLabel) || availableSizeSet.has(option.key.toLowerCase());
      const inventoryQuantity = inventoryMap.get(normalizedLabel);

      return {
        key: option.key,
        label,
        description: option.description ?? undefined,
        image: option.image ?? undefined,
        price: priceCents !== null ? formatPrice(priceCents) : "",
        isActive,
        inventoryQuantity: inventoryQuantity != null && Number.isFinite(inventoryQuantity) ? String(inventoryQuantity) : "",
        displayOrder: option.display_order ?? undefined,
      };
    });

  const allSizePriceFormValues = [...baseSizePriceFormValues, ...extraSizePriceFormValues];
  const activeSizeLabels = Array.from(new Set(allSizePriceFormValues.filter((option) => option.isActive).map((option) => option.label)));

  const catalogEnabled = getBooleanField(
    product,
    CATALOG_ENABLED_KEYS,
    product.is_catalog_enabled != null ? Boolean(product.is_catalog_enabled) : true
  );

  const slugValue = getStringField(product, SLUG_KEYS);
  const productTypeSource =
    typeof product.product_type === "string" && product.product_type.trim().length > 0
      ? product.product_type.trim()
      : typeof product.productType === "string" && product.productType.trim().length > 0
        ? product.productType.trim()
        : undefined;
  const fallbackSlug = slugValue || generateProductSlug(productTypeSource, product.name) || `${product.id}`;

  return {
    name: getStringField(product, NAME_KEYS) || "",
    display_title: getStringField(product, DISPLAY_TITLE_KEYS) || "",
    slug: fallbackSlug,
    category: getStringField(product, CATEGORY_KEYS) || "",
    marketing_note: getStringField(product, MARKETING_NOTE_KEYS) || "",
    description: generalDescription,
    ingredients: getStringField(product, INGREDIENTS_KEYS) || "",
    recommended_uses: getStringField(product, RECOMMENDED_USES_KEYS) || "",
    features: getStringField(product, FEATURES_KEYS) || "",
    story: getStringField(product, STORY_KEYS) || "",
    usage: getStringField(product, USAGE_KEYS) || "",
    target_audience: getStringField(product, TARGET_AUDIENCE_KEYS) || "",
    catalog_display_order: catalogOrderValue !== null ? String(catalogOrderValue) : "0",
    is_catalog_enabled: catalogEnabled,
    is_pay_and_pickup_enabled: getBooleanField(product, PAY_PICKUP_ENABLED_KEYS, Boolean(product.is_pay_and_pickup_enabled)),
    pay_and_pickup_description: payPickupDescription,
    pay_and_pickup_badge: getStringField(product, PAY_PICKUP_BADGE_KEYS) || "",
    image_url: primaryImage || "",
    additional_images: galleryImages,
    video_urls: (() => {
      // Support both single product_video_url and array of video URLs
      const singleVideo = getStringField(product, ["product_video_url", "productVideoUrl"]);
      if (singleVideo) {
        return [singleVideo];
      }
      // Check for array of video URLs (future support)
      const videoArray = product.video_urls;
      if (Array.isArray(videoArray)) {
        return videoArray.filter((url): url is string => typeof url === "string" && url.trim().length > 0);
      }
      return [];
    })(),
    thumbnail_index: (() => {
      // Find the index of image_url in additional_images, or use -1 if not found
      if (primaryImage && galleryImages.length > 0) {
        const index = galleryImages.findIndex((img) => img === primaryImage);
        return index >= 0 ? index : -1;
      }
      // If no primary image but we have gallery images, use first one
      return galleryImages.length > 0 ? 0 : -1;
    })(),
    available_size_options: activeSizeLabels,
    size_price_options: allSizePriceFormValues,
  };
};

export const getPrimaryImage = (product: Product) => buildProductImageCandidates(product)[0] ?? "";

export const buildAdminProductRouteParam = (product: Product): string => {
  const slugSource =
    (typeof product.slug === "string" && product.slug.trim().length > 0
      ? product.slug
      : generateProductSlug(product.product_type ?? product.productType, product.display_title ?? product.name)) ?? "";

  const normalizedSlug = slugSource ? generateSlug(slugSource) : "";
  return normalizedSlug ? `${product.id}-${normalizedSlug}` : `${product.id}`;
};

export const createEmptyEditForm = (): EditFormData => ({
  name: "",
  display_title: "",
  slug: "",
  category: "",
  marketing_note: "",
  description: "",
  ingredients: "",
  recommended_uses: "",
  features: "",
  story: "",
  usage: "",
  target_audience: "",
  catalog_display_order: "0",
  is_catalog_enabled: false,
  is_pay_and_pickup_enabled: false,
  pay_and_pickup_description: "",
  pay_and_pickup_badge: "",
  image_url: "",
  additional_images: [],
  video_urls: [],
  thumbnail_index: -1,
  available_size_options: [],
  size_price_options: SIZE_CATALOG.map((entry) => ({
    key: entry.key,
    label: entry.label,
    description: entry.description,
    image: entry.image,
    price: "",
    isActive: false,
    inventoryQuantity: "",
  })),
});
