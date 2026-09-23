import { isPayOnlineProduct, shouldHidePhoenixYardBulkSize } from '@shared/phoenixYardPickup.js';
import type { CartItem } from '@/contexts/QuoteCartContext';
export const JOBS = ['All materials', 'Turf', 'Trees & shrubs', 'Beds & mulch'] as const;
export const selections: Record<number, { job: string; use: string }> = {
  1004: { job: 'Turf', use: 'A topdress blend for overseeding and aeration jobs. Request quantities and scheduling for your site.' },
  1005: { job: 'Trees & shrubs', use: 'Planting amendment for tree and shrub installations. Confirm your mix and application rate with the supply team.' },
  3000: { job: 'Beds & mulch', use: 'Dark mulch for landscape beds and a clean finish around established plantings.' },
  1000: { job: 'Beds & mulch', use: 'Dairy compost for soil amendment jobs. Choose bags, pallets, totes, or available bulk formats.' },
  1001: { job: 'Trees & shrubs', use: 'Worm castings for planting mixes and soil amendment work. Order to suit the size of your job.' },
  111: { job: 'Beds & mulch', use: 'Potting mix for container planting and nursery work. Available in contractor quantities.' },
};
export type Size = { key: string; label: string; price: number; unit: string; isActive?: boolean; is_active?: boolean };
export type Product = { id: number; name: string; slug: string; texturePhotoUrl?: string; imageUrl?: string; sizePriceOptions: Size[]; product_status?: string; is_catalog_enabled?: boolean };
export const availableSizes = (p: Product) => (p.sizePriceOptions || []).filter(s => s.isActive !== false && s.is_active !== false && Number.isFinite(s.price) && s.price > 0 && !shouldHidePhoenixYardBulkSize(p.id, s.key));
export function lineFor(p: Product, s: Size, quantity: number): CartItem {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 9999) throw new Error('Enter a whole quantity from 1 to 9,999.');
  return { productId: p.id, productName: p.name, productSlug: p.slug, format: s.key, quantity, unitPrice: s.price, unit: s.unit, mode: isPayOnlineProduct(p.id) ? 'pay' : 'quote', imageUrl: p.texturePhotoUrl || p.imageUrl };
}
export async function fetchCatalog(): Promise<Product[]> {
  const res = await fetch('/api/public/products');
  if (!res.ok) throw new Error('Catalog unavailable');
  const body = await res.json();
  const rows: Product[] = Array.isArray(body) ? body : body.products;
  if (!Array.isArray(rows)) throw new Error('Invalid catalog response');
  return Object.keys(selections).map(Number).map(id => rows.find(p => p.id === id && p.product_status === 'active' && p.is_catalog_enabled !== false)).filter((p): p is Product => !!p);
}
