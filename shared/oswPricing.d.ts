export type V5CartPricing = {
  productId: number;
  productName: string;
  format: string;
  unitPrice: number;
  listUnitPrice: number;
  savingsPerUnit: number;
  discountPercent: number;
  unitsPerPallet: number | null;
  unit: string;
};

export const PALLET_VOLUME_DISCOUNT: number;
export {
  GARDEN_PROMOS,
  GARDEN_PROMO_IDS,
  gardenPromoStripeDescription,
  gardenPromoYardNote,
} from "./gardenPromos.js";
export const V5_PRODUCT_PRICING: Readonly<Record<number, { name: string; aliases: string[]; options: Array<Record<string, unknown>> }>>;
export function resolveV5ProductId(productId?: number | string | null, productName?: string | null): number | null;
export function resolveV5CartPricing(item: Record<string, unknown>): V5CartPricing | null;
export function normalizeV5CartItem<T extends Record<string, unknown>>(item: T): T & Partial<V5CartPricing>;
export function normalizeV5CheckoutItems<T extends Record<string, unknown>>(items: T[]): Array<T & Partial<V5CartPricing>>;
export function normalizeV5ProductRecord<T extends Record<string, unknown>>(product: T): T;
export function calculateV5OrderTotals(input: {
  items: Array<Record<string, unknown>>;
  deliveryCents?: number;
  taxRate?: number;
  orderDiscountCents?: number;
}): {
  items: Array<Record<string, unknown>>;
  productSubtotalCents: number;
  orderDiscountCents: number;
  deliveryCents: number;
  taxableCents: number;
  taxCents: number;
  totalCents: number;
};
