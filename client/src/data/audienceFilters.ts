/**
 * Audience-oriented product filters so prospects can find products by what they're looking for.
 * Tags are strict and product-specific: each filter shows only congruent products.
 */

export interface AudienceFilterOption {
  value: string;
  label: string;
}

/** Filter options in display order */
export const AUDIENCE_FILTERS: AudienceFilterOption[] = [
  { value: "all", label: "All Products" },
  { value: "turf-grass", label: "Turf & Grass" },
  { value: "trees-shrubs", label: "Trees & Shrubs" },
  { value: "vineyard", label: "Vineyard" },
  { value: "drought", label: "Drought" },
  { value: "planter-potting", label: "Potting Soil" },
  { value: "concentrates", label: "Concentrates" },
  { value: "mulch", label: "Mulch" },
  { value: "single-ingredients", label: "Single Ingredients" },
];

export type AudienceTag = (typeof AUDIENCE_FILTERS)[number]["value"];

const norm = (s: string | undefined | null) => (s ?? "").toLowerCase();

/** Returns which audience filter tags apply to this product. */
export function getAudienceTagsForProduct(product: {
  category?: string | null;
  productType?: string | null;
  name?: string;
  targetAudience?: string | null;
  ingredients?: string | null;
  recommendedUses?: string | null;
}): AudienceTag[] {
  const tags = new Set<AudienceTag>();
  const cat = norm(product.category);
  const type = norm(product.productType ?? "");
  const name = norm(product.name ?? "");

  // Mulch
  if (cat === "mulch" || name.includes("nature's blanket")) {
    tags.add("mulch");
  }

  // Turf & Grass: Tee Top, Turf Daddy
  if (name.includes("tee top") || name.includes("turf daddy")) {
    tags.add("turf-grass");
  }

  // Trees & Shrubs: Artemis, Oasis, Seriokai's, Pomona, Stoned Ape's
  if (
    name.includes("artemis") ||
    name.includes("oasis") ||
    name.includes("seriokai") ||
    name.includes("pomona") ||
    name.includes("stoned ape")
  ) {
    tags.add("trees-shrubs");
  }

  // Vineyard: Bacchus
  if (name.includes("bacchus")) {
    tags.add("vineyard");
  }

  // Drought: Desert Defender (Silky Silt Saver and Clay Cure are hidden)
  if (name.includes("desert defender") || name.includes("silky silt") || name.includes("clay cure")) {
    tags.add("drought");
  }

  // Potting Soil
  if (
    cat.includes("potting") ||
    name.includes("soil craft") ||
    name.includes("plugboost") ||
    name.includes("propagrow") ||
    name.includes("plantpal") ||
    name.includes("succulent success") ||
    name.includes("tropic treasure") ||
    name.includes("flower flourish")
  ) {
    tags.add("planter-potting");
  }

  // Concentrates: SuperBooster, Cultivator's Rose
  if (cat === "concentrate" || name.includes("superbooster") || name.includes("cultivator")) {
    tags.add("concentrates");
  }

  // Single Ingredients: Amazonian Dark Earth, Zeolite, SKMicrosource
  if (name.includes("amazonian") || name.includes("zeolite") || name.includes("skmicrosource")) {
    tags.add("single-ingredients");
  }

  // Fallback: base products and blends without specific tags get nothing extra
  if (tags.size === 0) {
    if (cat === "mulch") tags.add("mulch");
    else if (cat.includes("potting")) tags.add("planter-potting");
  }

  return Array.from(tags);
}
