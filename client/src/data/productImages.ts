// Product images with local file references
export const productImages = [
  {
    name: "Dan's Gold",
    url: "DansGold9lbs (1).jpg"
  },
  {
    name: "Mikey's Worm Poop",
    url: "Mikeys Worm Poop9lbs.jpg"
  },
  {
    name: "CannaBag",
    url: "Cannabag10lbs.jpg"
  },
  {
    name: "Amazonian Dark Earth",
    url: "Amazonian1CF.jpg"
  },
  {
    name: "Dan's Drought",
    url: "Dans Drought10lbs.jpg"
  },
  {
    name: "Artemis Root Boost Blend",
    url: "Artemis10lbs (1).jpg"
  },
  {
    name: "Bacchus Blend",
    url: "Bacchus1CF.jpg"
  },
  {
    name: "SuperBooster",
    url: "SuperBooster (1).jpg"
  },
  {
    name: "Ready Go Garden",
    url: "RGG9lbs.jpg"
  },
  {
    name: "Plant Pal",
    url: "PlantPal10lbs.jpg"
  }
];

// Helper function to get image URL for a product name
export function getProductImageUrlByName(productName: string): string | undefined {
  // Default fallback for when there are no matches
  const fallbackUrl = "hero-main-photo-v2-optimized.jpg";
  
  // Normalize product name and check for partial matches
  const normalizedProductName = productName.toLowerCase();
  
  const foundImage = productImages.find(img => 
    normalizedProductName.includes(img.name.toLowerCase()) || 
    img.name.toLowerCase().includes(normalizedProductName)
  );
  
  return foundImage?.url || fallbackUrl;
}