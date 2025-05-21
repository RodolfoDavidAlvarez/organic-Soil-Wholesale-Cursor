// Product images with public URLs from Firebase Storage
export const productImages = [
  {
    name: "Dan's Gold",
    url: "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/SSWwholesale.com%2FDansGold9lbs%20(1).jpg?alt=media&token=b0f2e6d8-0290-4044-835a-6f103dde1825"
  },
  {
    name: "Mikey's Worm Poop",
    url: "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/SSWwholesale.com%2FMikeys%20Worm%20Poop9lbs.jpg?alt=media&token=51ec4f5e-8802-4be3-a9ee-2bc7ebdf55f1"
  },
  {
    name: "CannaBag",
    url: "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/SSWwholesale.com%2FCannabag10lbs.jpg?alt=media&token=17087b73-37fa-4e7b-a3a4-c1562400d263"
  },
  {
    name: "Amazonian Dark Earth",
    url: "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/SSWwholesale.com%2FAmazonian1CF.jpg?alt=media&token=5dc7a4a4-8d93-4a67-8eb7-67031e2bd104"
  },
  {
    name: "Dan's Drought",
    url: "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/SSWwholesale.com%2FDans%20Drought10lbs.jpg?alt=media&token=37181ac4-1e34-44c0-8e10-5b990785380f"
  },
  {
    name: "Artemis Root Boost Blend",
    url: "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/SSWwholesale.com%2FArtemis10lbs%20(1).jpg?alt=media&token=06e1d610-504d-4745-8e59-9ae28a475297"
  },
  {
    name: "Bacchus Blend",
    url: "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/SSWwholesale.com%2FBacchus1CF.jpg?alt=media&token=9bef6263-5f5e-4579-91b9-fc14ba1421c3"
  },
  {
    name: "SuperBooster",
    url: "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/SSWwholesale.com%2FCultivators%209LB%20WB.jpg?alt=media&token=dde1c11a-e6f9-4bae-af25-ccfa2817ddb1"
  },
  {
    name: "Ready Go Garden",
    url: "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/SSWwholesale.com%2FOasis%209LB%20WB.jpg?alt=media&token=cc4f6af4-1bba-42ab-97ad-c7a7829720d5"
  },
  {
    name: "Plant Pal",
    url: "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/SSWwholesale.com%2FPlantPal10lbs.jpg?alt=media&token=5289eae1-571d-4826-9f74-818b171021b8"
  }
];

// Helper function to get image URL for a product name
export function getProductImageUrlByName(productName: string): string | undefined {
  // Default fallback for when there are no matches
  const fallbackUrl = "https://images.unsplash.com/photo-1605000797499-95a51c5269ae?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80";
  
  // Normalize product name and check for partial matches
  const normalizedProductName = productName.toLowerCase();
  
  const foundImage = productImages.find(img => 
    normalizedProductName.includes(img.name.toLowerCase()) || 
    img.name.toLowerCase().includes(normalizedProductName)
  );
  
  return foundImage?.url || fallbackUrl;
}