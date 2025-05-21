import { Product, SizeCategory } from "@/shared/schema";
import productInfo from "./json/productInfo.json";
import productPhotos from "./json/productPhotos.json";

// Helper function to merge product info with photos
const mergeProductData = () => {
  return productInfo.map((product: any) => {
    const photoData = productPhotos.find((p: any) => p["Product Name"] === product["Product Name"]);
    return {
      id: productInfo.indexOf(product) + 1,
      name: product["Product Name"] as string,
      description: product["Brief Overview"] as string,
      category: product["Type"] as string,
      price: 0,
      stockQuantity: 0,
      imageUrl: photoData?.["9lb Bag Photo URL"] || "",
      ingredients: product["Ingredients"] as string,
      targetAudience: product["Target audience"] as string,
      recommendedUses: product["Recommended Uses"] as string,
      story: product["Story"] as string,
      usage: product["Gardener Usage Instructions"] as string,
      certifications: product["Certifications"] as string,
      features: product["Key Features/benefits"] as string,
      sizeOptions: product["Size Categories"] as string,
      sizeCategories: [] as SizeCategory[],
      productType: product["Generic Name"] as string,
      safetyPrecautions: product["Safety Precautions"] as string,
      warranty: product["Limited Warranty"] as string,
      isWholesaleOnly: false,
      additionalImages: photoData?.["Product Texture Photo URL"] ? [photoData["Product Texture Photo URL"]] : [],
    };
  });
};

// Export the merged product data
export const productsData: Product[] = mergeProductData();

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

// This file is now the single source of truth for product data, loaded from the CSV.
