export interface Product {
  id: number;
  productType: string;
  description: string;
  imageUrl: string;
  sizeOptions?: string[];
  availableCategories?: string[];
  restrictedToLocations?: string[];
  allowBulkPickup?: boolean;
  additionalDetails?: {
    ingredients?: string;
    applications?: string;
    benefits?: string;
  };
}

export const productsData: Product[] = [
  {
    id: 1,
    productType: "ORGANIC DAIRY COMPOST",
    description: "Premium organic compost made from dairy manure, perfect for soil enrichment.",
    imageUrl: "/images/products/dairy-compost.jpg",
    sizeOptions: ["boxes", "bags", "totes", "bulk", "bulk-pickup", "truckload-totes"],
    allowBulkPickup: true,
    additionalDetails: {
      ingredients: "100% organic dairy manure, professionally composted and screened",
      applications: "Garden beds, landscape applications, soil amendment",
      benefits: "Improves soil structure, adds organic matter, enhances nutrient content",
    },
  },
  {
    id: 2,
    productType: "ORGANIC WORM CASTINGS",
    description: "Nutrient-rich worm castings for optimal plant growth and soil health.",
    imageUrl: "/images/products/worm-castings.jpg",
    sizeOptions: ["boxes", "bags", "totes", "bulk", "bulk-pickup", "truckload-totes"],
    allowBulkPickup: true,
    additionalDetails: {
      ingredients: "100% pure worm castings from red wigglers",
      applications: "Garden beds, container gardens, seed starting, topdressing",
      benefits: "Improves soil biology, adds micronutrients, enhances plant immunity",
    },
  },
  {
    id: 3,
    productType: "ORGANIC POTTING SOIL",
    description: "Premium potting soil blend for container gardening and indoor plants.",
    imageUrl: "/images/products/potting-soil.jpg",
    sizeOptions: ["boxes", "bags", "totes", "bulk", "truckload-totes"],
    allowBulkPickup: false,
    additionalDetails: {
      ingredients: "Compost, coconut coir, perlite, worm castings, organic fertilizers",
      applications: "Container plants, raised beds, indoor gardening",
      benefits: "Well-draining, nutrient-rich, perfect balance of water retention and aeration",
    },
  },
  {
    id: 4,
    productType: "ORGANIC RAISED BED MIX",
    description: "Specially formulated mix for raised bed gardening success.",
    imageUrl: "/images/products/raised-bed-mix.jpg",
    sizeOptions: ["boxes", "bags", "totes", "bulk", "truckload-totes"],
    allowBulkPickup: false,
    additionalDetails: {
      ingredients: "Compost, topsoil, peat moss, organic fertilizers",
      applications: "Raised bed gardens, in-ground garden amendments",
      benefits: "Balanced nutrients, good drainage, supports healthy root development",
    },
  },
  {
    id: 5,
    productType: "ORGANIC LANDSCAPE MIX",
    description: "Professional-grade landscape soil for commercial and residential applications.",
    imageUrl: "/images/products/landscape-mix.jpg",
    sizeOptions: ["totes", "bulk", "truckload-totes"],
    allowBulkPickup: false,
    additionalDetails: {
      ingredients: "Topsoil, compost, sand, organic amendments",
      applications: "Landscape installations, lawn establishment, garden beds",
      benefits: "Consistent quality, excellent drainage, supports healthy plant growth",
    },
  },
  {
    id: 6,
    productType: "ORGANIC GARDEN BLEND",
    description: "All-purpose garden soil for vegetables, flowers, and herbs.",
    imageUrl: "/images/products/garden-blend.jpg",
    sizeOptions: ["boxes", "bags", "totes", "bulk", "truckload-totes"],
    allowBulkPickup: false,
    additionalDetails: {
      ingredients: "Compost, topsoil, organic fertilizers, beneficial microbes",
      applications: "Vegetable gardens, flower beds, herb gardens",
      benefits: "Balanced nutrition, good moisture retention, supports robust plant growth",
    },
  },
];
