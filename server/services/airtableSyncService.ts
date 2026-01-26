/**
 * Airtable Sync Service
 * Syncs products and size categories from Airtable SSW1 base
 * for use in the Work Order system
 */

import { supabase } from "../supabaseClient.js";

// Airtable configuration for SSW1 base
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY || "";
if (!AIRTABLE_API_KEY) {
  console.warn("AIRTABLE_API_KEY not set - Airtable sync will not work");
}
const SSW1_BASE_ID = "appDCKrxtJ7oG9O19";
const PRODUCTS_TABLE_ID = "tbltXMzV96FnmrjFw";
const SIZE_CATEGORIES_TABLE_ID = "tblkNN71Iiyh2GjEi";
const INGREDIENTS_TABLE_ID = "tblujGuwLKvJzgOR4";

/**
 * Mapping of product names to generic ingredient names
 * Used to replace branded product names with generic ingredients in recipes
 * Includes variations with different apostrophe characters (' vs ')
 */
const PRODUCT_TO_INGREDIENT_MAP: Record<string, string> = {
  // Worm castings products - all apostrophe and spelling variations
  "Mikey's Worm Poop": "Worm castings",
  "Mikey's Worm Poop": "Worm castings",
  "Mikeys Worm Poop": "Worm castings",
  "Mikey Worm Poop": "Worm castings",
  "Mikey\u2019s Worm Poop": "Worm castings",

  // Dairy compost products - all apostrophe variations
  "Dan's Gold": "Dairy Compost",
  "Dan's Gold": "Dairy Compost",
  "Dans Gold": "Dairy Compost",
  "Dan\u2019s Gold": "Dairy Compost",
  "Dan's Drought": "Dairy Compost",
  "Dan's Drought": "Dairy Compost",
  "Dans Drought": "Dairy Compost",
  "Dan\u2019s Drought": "Dairy Compost",
  "Simon's Gold": "Dairy Compost",
  "Simon's Gold": "Dairy Compost",
  "Simons Gold": "Dairy Compost",
  "Simon\u2019s Gold": "Dairy Compost",
};

/**
 * Replace product names with generic ingredient names in text
 * Handles different apostrophe characters by normalizing them first
 */
function normalizeIngredientNames(text: string | null): string | null {
  if (!text) return null;

  // First normalize all types of apostrophes to standard single quote
  let normalized = text
    .replace(/[\u2018\u2019\u201B\u0060\u00B4]/g, "'"); // Normalize fancy apostrophes

  // Then apply product-to-ingredient mappings
  for (const [productName, genericName] of Object.entries(PRODUCT_TO_INGREDIENT_MAP)) {
    // Normalize the product name too
    const normalizedProductName = productName.replace(/[\u2018\u2019\u201B\u0060\u00B4]/g, "'");
    // Case-insensitive replacement
    const regex = new RegExp(normalizedProductName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    normalized = normalized.replace(regex, genericName);
  }

  return normalized;
}

export interface AirtableProduct {
  airtableId: string;
  productName: string;
  productId: string | null;
  ingredientRatios: string | null;
  ingredientsList: string | null;
  sizeCategories: string[];
  certifications: string[];
  illustrationUrl: string | null;
}

export interface AirtableSizeCategory {
  airtableId: string;
  name: string;
  code: string;
  unitsPerPallet: number | null;
  estimatedPalletWeight: string | null;
  illustrationUrl: string | null;
  palletConfiguration: string | null;
}

export interface CachedProduct {
  id: number;
  airtable_id: string;
  product_name: string;
  product_id: string | null;
  ingredient_ratios: string | null;
  ingredients_list: string | null;
  size_categories: string[] | null;
  certifications: string[] | null;
  illustration_url: string | null;
  last_synced_at: string;
}

export interface CachedSizeCategory {
  id: number;
  airtable_id: string;
  name: string;
  code: string;
  units_per_pallet: number | null;
  estimated_pallet_weight: string | null;
  illustration_url: string | null;
  pallet_configuration: string | null;
  last_synced_at: string;
}

/**
 * Fetch products from Airtable
 */
async function fetchProductsFromAirtable(): Promise<AirtableProduct[]> {
  const products: AirtableProduct[] = [];
  let offset: string | undefined;

  do {
    const url = new URL(`https://api.airtable.com/v0/${SSW1_BASE_ID}/${PRODUCTS_TABLE_ID}`);
    url.searchParams.set("pageSize", "100");
    if (offset) {
      url.searchParams.set("offset", offset);
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Airtable API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    for (const record of data.records || []) {
      const fields = record.fields || {};

      // Get illustration URL from "Illustrative Files" field
      const illustrativeFiles = fields["Illustrative Files"];
      let illustrationUrl: string | null = null;
      if (Array.isArray(illustrativeFiles) && illustrativeFiles.length > 0) {
        // Use local compressed version based on product ID
        const productId = fields["Product ID"];
        if (productId) {
          illustrationUrl = `/product-illustrations/${productId.toLowerCase()}-small.webp`;
        }
      }

      // Normalize ingredient names to use generic names instead of product names
      const rawIngredientRatios = fields["Ingredient Ratios"] || null;
      const rawIngredientsList = Array.isArray(fields["Ingredients"])
        ? fields["Ingredients"].join(", ")
        : fields["Ingredients"] || null;

      products.push({
        airtableId: record.id,
        productName: fields["Product Name "] || fields["Product Name"] || fields["Name"] || "Unknown Product",
        productId: fields["Product ID"] || null,
        ingredientRatios: normalizeIngredientNames(rawIngredientRatios),
        ingredientsList: normalizeIngredientNames(rawIngredientsList),
        sizeCategories: Array.isArray(fields["Size Categories"])
          ? fields["Size Categories"]
          : [],
        certifications: Array.isArray(fields["Certifications"])
          ? fields["Certifications"]
          : [],
        illustrationUrl,
      });
    }

    offset = data.offset;
  } while (offset);

  return products;
}

/**
 * Fetch size categories from Airtable
 */
async function fetchSizeCategoriesFromAirtable(): Promise<AirtableSizeCategory[]> {
  const categories: AirtableSizeCategory[] = [];
  let offset: string | undefined;

  do {
    const url = new URL(`https://api.airtable.com/v0/${SSW1_BASE_ID}/${SIZE_CATEGORIES_TABLE_ID}`);
    url.searchParams.set("pageSize", "100");
    if (offset) {
      url.searchParams.set("offset", offset);
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Airtable API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    for (const record of data.records || []) {
      const fields = record.fields || {};
      const name = fields["Name"] || "Unknown";

      // Generate code from name
      const code = generateSizeCategoryCode(name);

      categories.push({
        airtableId: record.id,
        name: name,
        code: code,
        unitsPerPallet: fields["Units per pallet"] || null,
        estimatedPalletWeight: fields["Estimated pallet weight"] || null,
        illustrationUrl: Array.isArray(fields["Size category illustration"]) && fields["Size category illustration"][0]
          ? fields["Size category illustration"][0].url
          : null,
        palletConfiguration: fields["Pallet Configuration"] || null,
      });
    }

    offset = data.offset;
  } while (offset);

  return categories;
}

/**
 * Generate a code from size category name
 */
function generateSizeCategoryCode(name: string): string {
  const lower = name.toLowerCase();

  if (lower.includes("9 lb") || lower.includes("9lb")) return "9lb";
  if (lower.includes("7.5 qt") || lower.includes("7.5qt")) return "7.5qt";
  if (lower.includes("1.5 cf") || lower.includes("1.5cf")) return "1.5cf";
  if (lower.includes("2 cf") || lower.includes("2cf")) return "2cf";
  if (lower.includes("1 cf") || lower.includes("1cf")) return "1cf";
  if (lower.includes("tote") || lower.includes("super sack")) return "tote";
  if (lower.includes("bulk") || lower.includes("cubic yard")) return "bulk";

  // Default: slugify the name
  return lower
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 20);
}

export class AirtableSyncService {
  /**
   * Sync products from Airtable to local cache
   */
  static async syncProducts(): Promise<{ synced: number; errors: string[] }> {
    const errors: string[] = [];
    let synced = 0;

    try {
      const products = await fetchProductsFromAirtable();

      for (const product of products) {
        const { error } = await supabase
          .from("ops_products_cache")
          .upsert(
            {
              airtable_id: product.airtableId,
              product_name: product.productName,
              product_id: product.productId,
              ingredient_ratios: product.ingredientRatios,
              ingredients_list: product.ingredientsList,
              size_categories: product.sizeCategories,
              certifications: product.certifications,
              illustration_url: product.illustrationUrl,
              last_synced_at: new Date().toISOString(),
            },
            {
              onConflict: "airtable_id",
            }
          );

        if (error) {
          errors.push(`Failed to sync product ${product.productName}: ${error.message}`);
        } else {
          synced++;
        }
      }
    } catch (error: any) {
      errors.push(`Airtable fetch error: ${error.message}`);
    }

    return { synced, errors };
  }

  /**
   * Sync size categories from Airtable to local cache
   */
  static async syncSizeCategories(): Promise<{ synced: number; errors: string[] }> {
    const errors: string[] = [];
    let synced = 0;

    try {
      const categories = await fetchSizeCategoriesFromAirtable();

      for (const category of categories) {
        const { error } = await supabase
          .from("ops_size_categories_cache")
          .upsert(
            {
              airtable_id: category.airtableId,
              name: category.name,
              code: category.code,
              units_per_pallet: category.unitsPerPallet,
              estimated_pallet_weight: category.estimatedPalletWeight,
              illustration_url: category.illustrationUrl,
              pallet_configuration: category.palletConfiguration,
              last_synced_at: new Date().toISOString(),
            },
            {
              onConflict: "airtable_id",
            }
          );

        if (error) {
          errors.push(`Failed to sync size category ${category.name}: ${error.message}`);
        } else {
          synced++;
        }
      }
    } catch (error: any) {
      errors.push(`Airtable fetch error: ${error.message}`);
    }

    return { synced, errors };
  }

  /**
   * Get cached products from local database
   */
  static async getCachedProducts(): Promise<CachedProduct[]> {
    const { data, error } = await supabase
      .from("ops_products_cache")
      .select("*")
      .order("product_name", { ascending: true });

    if (error) {
      console.error("Error fetching cached products:", error);
      return [];
    }

    return data || [];
  }

  /**
   * Get single cached product by ID
   */
  static async getCachedProductById(id: number): Promise<CachedProduct | null> {
    const { data, error } = await supabase
      .from("ops_products_cache")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching cached product:", error);
      return null;
    }

    return data;
  }

  /**
   * Get single cached product by Airtable ID
   */
  static async getCachedProductByAirtableId(airtableId: string): Promise<CachedProduct | null> {
    const { data, error } = await supabase
      .from("ops_products_cache")
      .select("*")
      .eq("airtable_id", airtableId)
      .single();

    if (error) {
      console.error("Error fetching cached product:", error);
      return null;
    }

    return data;
  }

  /**
   * Get cached size categories from local database
   */
  static async getCachedSizeCategories(): Promise<CachedSizeCategory[]> {
    const { data, error } = await supabase
      .from("ops_size_categories_cache")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching cached size categories:", error);
      return [];
    }

    return data || [];
  }

  /**
   * Get single cached size category by code
   */
  static async getCachedSizeCategoryByCode(code: string): Promise<CachedSizeCategory | null> {
    const { data, error } = await supabase
      .from("ops_size_categories_cache")
      .select("*")
      .eq("code", code)
      .single();

    if (error) {
      console.error("Error fetching cached size category:", error);
      return null;
    }

    return data;
  }

  /**
   * Sync all data from Airtable
   */
  static async syncAll(): Promise<{
    products: { synced: number; errors: string[] };
    sizeCategories: { synced: number; errors: string[] };
  }> {
    const [productsResult, sizeCategoriesResult] = await Promise.all([
      this.syncProducts(),
      this.syncSizeCategories(),
    ]);

    return {
      products: productsResult,
      sizeCategories: sizeCategoriesResult,
    };
  }
}
