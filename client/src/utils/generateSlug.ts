/**
 * Generate a URL-friendly slug from a product name or type
 */
export function generateSlug(text: string): string {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Generate a product slug prioritizing product type over name
 * This matches the pattern: "dairy-compost", "worm-castings", etc.
 */
export function generateProductSlug(productType?: string, productName?: string): string {
  // Prioritize product type (brand name) for cleaner URLs
  const text = productType || productName || '';
  return generateSlug(text);
}

/**
 * Get the display name for a product route
 */
export function getProductDisplayName(productType?: string, displayTitle?: string, productName?: string): string {
  return displayTitle || productType || productName || 'Unknown Product';
}