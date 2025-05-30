export interface Product {
  id: number;
  productType: string;
  description: string;
  imageUrl: string;
  category: string;
  additionalImages?: string[];
}

export const productsData: Product[] = [
  {
    id: 1,
    productType: "ORGANIC DAIRY COMPOST",
    description: "Premium organic compost made from dairy manure, perfect for soil enrichment.",
    imageUrl: "/images/products/Dairy-Compost.jpg",
    category: "Compost",
    additionalImages: ["/images/products/Dairy-Compost-Texture.jpg"]
  },
  {
    id: 2,
    productType: "ORGANIC WORM CASTINGS",
    description: "Nutrient-rich worm castings for optimal plant growth and soil health.",
    imageUrl: "/images/products/Worm-Castings.jpg", 
    category: "Compost",
    additionalImages: ["/images/products/Worm-Castings-Texture.jpg"]
  },
  {
    id: 3,
    productType: "ORGANIC POTTING SOIL",
    description: "Premium potting soil blend for container gardening and indoor plants.",
    imageUrl: "/images/products/Potting-Soil.jpg",
    category: "Soil",
    additionalImages: ["/images/products/Potting-Soil-Texture.jpg"]
  },
  {
    id: 4,
    productType: "ORGANIC RAISED BED MIX",
    description: "Specially formulated mix for raised bed gardening success.",
    imageUrl: "/images/products/Raised-Bed-Mix.jpg",
    category: "Soil",
    additionalImages: ["/images/products/Raised-Bed-Mix-Texture.jpg"] 
  },
  {
    id: 5,
    productType: "ORGANIC LANDSCAPE MIX",
    description: "Professional-grade landscape soil for commercial and residential applications.",
    imageUrl: "/images/products/Landscape-Mix.jpg",
    category: "Soil",
    additionalImages: ["/images/products/Landscape-Mix-Texture.jpg"]
  },
  {
    id: 6,
    productType: "ORGANIC GARDEN BLEND",
    description: "All-purpose garden soil for vegetables, flowers, and herbs.",
    imageUrl: "/images/products/Garden-Blend.jpg",
    category: "Soil",
    additionalImages: ["/images/products/Garden-Blend-Texture.jpg"]
  },
];
