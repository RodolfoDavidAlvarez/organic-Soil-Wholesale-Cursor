export type GardenPromoContent = {
  productId: number;
  name: string;
  role: string;
  bags: number;
  cuFt: number;
  format: string;
  unitPrice: number;
  included: boolean;
  image: string;
};

export type GardenPromo = {
  productId: number;
  slug: string;
  title: string;
  shortTitle: string;
  salePrice: number;
  heroProductId: number;
  format: string;
  aliases: string[];
  eyebrow: string;
  summary: string;
  useCase: string;
  includedCallout: string;
  stripeDescription: string;
  pickList: string;
  contents: GardenPromoContent[];
  bagCount: number;
  cuFt: number;
  listPrice: number;
  savings: number;
  imageUrl: string;
};

export const GARDEN_PROMOS: readonly GardenPromo[];
export const GARDEN_PROMO_IDS: readonly number[];
export const GARDEN_PROMO_SLUGS: readonly string[];
export const BIG_GARDEN_SETUP_SLUG: "big-garden-setup";
export const GARDEN_PROMO_ALIASES: Readonly<Record<string, string>>;
export function findGardenPromo(slug?: string | null): GardenPromo | null;
export function findGardenPromoByProductId(productId?: number | string | null): GardenPromo | null;
export function gardenPromoYardNote(items?: Array<Record<string, unknown>> | null): string | null;
export function gardenPromoStripeDescription(productId?: number | string | null): string | null;
export function gardenPromoCartImage(productId?: number | string | null): string;
