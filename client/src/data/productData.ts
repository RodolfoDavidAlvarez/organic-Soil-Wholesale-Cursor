import { Product, SizeCategory } from "@/shared/schema";
import amendmentProducts from "./json/Amendment Products.json";
import pottingSoilProducts from "./json/Potting Soil Products.json";
import mulchProducts from "./json/Mulch Products.json";
import concentratedAmendmentProducts from "./json/Concentrated Amendment Products.json";
import productStories from "./json/product_stories_and_overview.json";

// Helper function to merge product info with photos and stories
const mergeProductData = (products: any[]) => {
  return products.map((product: any) => {
    // Find matching story data
    const storyData = productStories.find((story: any) => story["Product name"].toLowerCase() === product["Product name"].toLowerCase());

    return {
      id: products.indexOf(product) + 1,
      name: product["Product name"] as string,
      description: storyData?.["Brief Overview"] || (product["Brief Overview"] as string),
      category: product["Product Category"] as string,
      type: product["Product Category"] as string,
      price: 0,
      stockQuantity: 0,
      imageUrl: product["9lb Bag Photo URL"] || "",
      ingredients: product["Ingredients"] as string,
      targetAudience: product["Target audience"] as string,
      recommendedUses: product["Recommended Uses"] as string,
      story: storyData?.["Story"] || (product["Story"] as string),
      usage: product["Gardener Usage Instructions"] as string,
      certifications: product["Certifications"] as string,
      features: product["Key Features/benefits"] as string,
      sizeOptions: product["Size Categories"] as string,
      sizeCategories: [] as SizeCategory[],
      productType: product["Brand name"] as string,
      safetyPrecautions: product["Safety Precautions"] as string,
      warranty: product["Limited Warranty"] as string,
      isWholesaleOnly: false,
      additionalImages: [
        ...(product["additionalImages"] || []),
        ...(product["Product Texture Photo URL"] ? [product["Product Texture Photo URL"]] : []),
      ],
    };
  });
};

// Merge all product categories
const allProducts = [
  ...mergeProductData(amendmentProducts),
  ...mergeProductData(pottingSoilProducts),
  ...mergeProductData(mulchProducts),
  ...mergeProductData(concentratedAmendmentProducts),
];

// Export the merged product data
export const productsData: Product[] = allProducts;

// Helper functions to work with the data
export function getProductsData(): Product[] {
  return productsData;
}

export function getProductByName(name: string): Product | undefined {
  return productsData.find((product) => product.name === name);
}

export function getProductByIndex(index: number): Product | undefined {
  return productsData[index];
}

// New helper functions for category-specific data
export function getProductsByCategory(category: string): Product[] {
  return productsData.filter((product) => product.category === category);
}

export function getAmendmentProducts(): Product[] {
  return mergeProductData(amendmentProducts);
}

export function getPottingSoilProducts(): Product[] {
  return mergeProductData(pottingSoilProducts);
}

export function getMulchProducts(): Product[] {
  return mergeProductData(mulchProducts);
}

export function getConcentratedAmendmentProducts(): Product[] {
  return mergeProductData(concentratedAmendmentProducts);
}

// This file is now the single source of truth for product data, loaded from the CSV.
