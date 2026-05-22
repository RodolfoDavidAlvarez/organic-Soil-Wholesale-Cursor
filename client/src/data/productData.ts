import { Product, SizeCategory } from "@/shared/schema";
import amendmentProducts from "./json/Amendment Products.json";
import pottingSoilProducts from "./json/Potting Soil Products.json";
import mulchProducts from "./json/Mulch Products.json";
import concentratedAmendmentProducts from "./json/Concentrated Amendment Products.json";

// Helper function to merge product info with clean data
const mergeProductData = (products: any[]) => {
  return products.map((product: any) => {
    const baseId = products === amendmentProducts ? 1000 :
                  products === pottingSoilProducts ? 2000 :
                  products === mulchProducts ? 3000 :
                  products === concentratedAmendmentProducts ? 4000 : 5000;

    return {
      id: baseId + products.indexOf(product),
      name: product["Product name"] as string,
      description: product["Brief Overview"] as string,
      category: product["Product Category"] as string,
      type: product["Product Category"] as string,
      price: 0,
      stockQuantity: 0,
      imageUrl: product["9lb Bag Photo URL"] || "",
      texturePhotoUrl: product["Product Texture Photo URL"] || "",
      ingredients: "" as string,
      targetAudience: product["Target audience"] as string,
      recommendedUses: product["Recommended Uses"] as string,
      story: "" as string,
      usage: product["Gardener Usage Instructions"] as string,
      certifications: product["Certifications"] as string,
      features: product["Key Features/benefits"] as string,
      sizeOptions: product["Size Categories"] as string,
      sizeCategories: [] as SizeCategory[],
      productType: product["Brand name"] as string,
      displayTitle: product["Display Title"] as string,
      marketingTitle: "" as string,
      seoKeywords: "" as string,
      marketingNote: "" as string,
      productVideoUrl: product["Product Video URL"] as string,
      productVideoTitle: product["Product Video Title"] as string,
      safetyPrecautions: "" as string,
      warranty: "" as string,
      isWholesaleOnly: false,
      additionalImages: product["additionalImages"] || [],
      sortOrder: product["sortOrder"] as number,
      isHidden: product["isHidden"] as boolean,
      sizePriceOptions: product["sizePriceOptions"] || [],
      npk: product["NPK"] as string,
      isCatalogEnabled: !product["isHidden"],
      catalogDisplayOrder: product["sortOrder"] as number || null,
      productStatus: "active" as string | null,
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

// Export the merged product data sorted by sortOrder
export const productsData: Product[] = allProducts.sort((a, b) => (a.sortOrder || 999) - (b.sortOrder || 999));

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

// Helper function to create a URL-friendly slug from a product name
export function createProductSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

// Helper function to get a product by slug
export function getProductBySlug(slug: string): Product | undefined {
  return productsData.find(
    (product) =>
      createProductSlug(product.name) === slug ||
      (product.productType && createProductSlug(product.productType) === slug)
  );
}
