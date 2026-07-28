/**
 * Shared content for the 4 pay-and-pickup main products.
 * Used on /products cards and product detail pages — add new mains here.
 */
export interface IngredientDetail {
  name: string;
  text: string;
}

export interface PayPickupProductContent {
  /** Customer-facing product type label (overrides API productType when set) */
  displayType?: string;
  description: string;
  /** Ingredients / components — rendered under an "Includes" label */
  includes: string[];
  /** Optional short story for each ingredient (product detail) */
  ingredientDetails?: IngredientDetail[];
  /** Product-specific benefits or uses — optional, unique per product */
  benefits?: string[];
  startingPriceContext?: string;
  sizeSummaries?: string[];
  /** Public URL for downloadable spec sheet PDF */
  specSheetUrl?: string;
  specSheetLabel?: string;
}

export const PAY_PICKUP_PRODUCT_CONTENT: Record<number, PayPickupProductContent> = {
  1000: {
    description:
      "Slow-release nutrition and clean organic matter for feeding, rebuilding, and conserving soil. Easy to spread in beds, trees, and planted areas.",
    includes: ["Composted dairy manure"],
    benefits: ["Slow-release organic matter", "Improves soil structure", "Supports water conservation"],
    startingPriceContext: "for a 9 lb bag",
    sizeSummaries: ["9 lb bag", "40 lb bag (1 cu ft)", "super sack (~2,000 lb)", "bulk pickup (per ton)", "truckload (~24 tons)"],
  },
  1001: {
    description:
      "Nutrient-rich worm castings for pre-season feeding, root zones, top dressing, and mixing into soil blends.",
    includes: ["Premium worm castings"],
    benefits: ["Feeds root zones naturally", "Helps retain moisture", "Supports stronger soil biology"],
    startingPriceContext: "for a 9 lb bag",
    sizeSummaries: ["9 lb bag", "40 lb bag (1 cu ft)", "super sack (~2,000 lb)", "bulk pickup (per ton)"],
  },
  111: {
    displayType: "All-Stage Potting Mix",
    description:
      "All-stage potting mix for seed starts, propagation, containers, and patio planters.",
    includes: [
      "Dairy compost",
      "Worm castings",
      "Clean wood fiber",
      "Calcium",
      "Zinc sulfate",
      "8-3-1 granules",
    ],
    ingredientDetails: [
      {
        name: "Organic dairy compost",
        text: "Steady nutrition, better structure, and stronger water holding.",
      },
      {
        name: "Worm castings",
        text: "Gentle nutrients plus living microbes for healthier roots.",
      },
      {
        name: "Clean wood fiber",
        text: "Keeps the mix open so roots get air and drainage.",
      },
      {
        name: "Calcium",
        text: "Supports cell strength and balanced nutrient uptake.",
      },
      {
        name: "Zinc sulfate",
        text: "Essential zinc for growth, flowering, and shoot development.",
      },
      {
        name: "8-3-1 granules",
        text: "Balanced organic N-P-K for steady all-stage feeding.",
      },
    ],
    benefits: ["All-stage potting mix", "Balanced organic nutrition", "Ready out of the bag"],
    startingPriceContext: "for a 1.5 cu ft bag (~50 lb)",
    sizeSummaries: ["1.5 cu ft bag (~50 lb)", "super sack (2.2 cu yd)", "bulk pickup (per cu yd)", "truckload (~60 cu yd)"],
    specSheetUrl: "/documents/specsheets/PlantPal-All-Stage-Nursery-Mix-Spec-Sheet.pdf",
    specSheetLabel: "Download PlantPal spec sheet",
  },
  3000: {
    description:
      "Premium dark mulch for clean landscape finish, moisture retention, and long-lasting soil cover.",
    includes: ["Wood fiber", "Worm castings", "Dairy compost"],
    benefits: [
      "Suppresses weeds",
      "Adds organic matter to beds",
      "Retains soil moisture",
      "Keeps root zones cooler",
    ],
    startingPriceContext: "for a 2 cu ft bag (~60 lb)",
    sizeSummaries: ["2 cu ft bag (~60 lb)", "super sack (2.2 cu yd)", "bulk pickup (per cu yd)", "truckload (~60 cu yd)"],
  },
};

export const getPayPickupProductContent = (productId?: number): PayPickupProductContent | undefined =>
  productId ? PAY_PICKUP_PRODUCT_CONTENT[productId] : undefined;

export const getPayPickupProductDescription = (productId?: number, fallback = ""): string =>
  getPayPickupProductContent(productId)?.description ?? fallback;

export const getPayPickupProductType = (productId?: number, fallback?: string): string | undefined =>
  getPayPickupProductContent(productId)?.displayType ?? fallback;
