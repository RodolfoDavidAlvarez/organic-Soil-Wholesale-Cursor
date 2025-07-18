# Project-Specific Instructions

## Mobile-First Development Priority
- **90% of website visitors use mobile phones** - CRITICAL priority
- Always develop and test mobile view first before desktop
- Ensure all touch targets are minimum 44x44px for easy tapping
- Test all features on mobile viewport (375px-414px width)
- Avoid horizontal scrolling at all costs on mobile

## Product Image Display Order
- **ALWAYS display texture photo as the first/primary image** for all products
- Order: 1) Product Texture Photo, 2) Additional images, 3) Product bag photo
- This applies to all product detail pages and galleries

## Image Performance Concerns
- **High-resolution texture photos (7.5MB+) cause slow loading times**
- Need to implement image optimization: lazy loading, compression, responsive sizes
- Consider creating optimized versions (e.g., texture-photo-optimized.jpg at <500KB)
- Product images are already in client/public/ directory - use local files, not external URLs