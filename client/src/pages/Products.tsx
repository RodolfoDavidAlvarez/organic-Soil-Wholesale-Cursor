import { useState, useEffect, useMemo } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Product } from "@/shared/schema";
import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";
import ProductShowcase from "@/components/ProductShowcase";
import { productsData } from "@/data/productData";
import SEO from "@/components/layout/SEO";

const Products = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchParams] = useState(new URLSearchParams(window.location.search));
  const initialCategory = searchParams.get("category") || "all";

  const prepareCatalogProducts = (list: any[]) =>
    list
      .filter((product) => {
        const catalogEnabled =
          product?.catalog?.isEnabled ?? product?.isCatalogEnabled ?? true;
        return catalogEnabled !== false;
      })
      .sort((productA, productB) => {
        const orderA =
          productA?.catalog?.displayOrder ??
          productA?.catalogDisplayOrder ??
          Number.MAX_SAFE_INTEGER;
        const orderB =
          productB?.catalog?.displayOrder ??
          productB?.catalogDisplayOrder ??
          Number.MAX_SAFE_INTEGER;

        if (orderA !== orderB) {
          return orderA - orderB;
        }

        const nameA = (productA.displayTitle || productA.name || "").toLowerCase();
        const nameB = (productB.displayTitle || productB.name || "").toLowerCase();
        return nameA.localeCompare(nameB);
      });

  const fallbackProducts = useMemo(
    () =>
      prepareCatalogProducts(
        productsData.map((product, index) => ({
          ...product,
          id: product.id ?? index + 1,
          story: product.story || null,
          usage: product.usage || null,
          productType: product.productType || null,
          safetyPrecautions: product.safetyPrecautions || null,
          warranty: product.warranty || null,
          additionalImages: product.additionalImages || [],
        }))
      ),
    []
  );

  const { data: apiProducts, isLoading: apiLoading } = useQuery({
    queryKey: ["publicProducts"],
    queryFn: async () => {
      const response = await fetch("/api/products");
      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }
      const body = await response.json();
      const fetchedProducts = (body?.products || []) as any[];
      return prepareCatalogProducts(
        fetchedProducts.map((product, index) => ({
          ...product,
          id: product.id ?? index + 1,
        }))
      );
    },
    staleTime: 60 * 1000,
    retry: 1,
  });

  useEffect(() => {
    if (apiProducts && apiProducts.length > 0) {
      setProducts(apiProducts);
      setIsLoading(false);
    } else if (!apiLoading) {
      setProducts(fallbackProducts);
      setIsLoading(false);
    }
  }, [apiProducts, apiLoading, fallbackProducts]);

  return (
    <>
      <SEO 
        title="Wholesale Organic Soil Products"
        description="Browse our complete collection of premium organic soil products available in bulk for commercial applications. Featuring amendments, composts, potting soils, and specialty blends for landscapers and growers."
        keywords="bulk soil products, wholesale soil amendments, commercial compost, organic soil wholesale, landscaper soil supplies, worm castings wholesale, dairy compost bulk, potting soil bulk, zeolite wholesale, biochar commercial, soil supersacks, soil pallets"
        canonical="https://organicsoilwholesale.com/products"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          "itemListElement": products.slice(0, 10).map((product, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "item": {
              "@type": "Product",
              "name": product.productType || product.name,
              "description": product.description,
              "url": `https://organicsoilwholesale.com/products/${product.id}`,
              "image": product.imageUrl,
              "category": product.category
            }
          }))
        }}
      />
      {/* Products Section */}
      <section className="pt-0 pb-12 bg-white">
        <div className="container mx-auto px-4">
          {/* Products Showcase */}
          <ProductShowcase products={products} loading={isLoading} initialCategory={initialCategory} />
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary/5 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-6">Ready to Transform Your Soil?</h2>
            <p className="text-lg text-foreground/70 mb-8">
              Browse our complete catalog of premium organic soil products and find the perfect solution for your growing needs.
            </p>
            <Link href="/order">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white">
                <Package className="h-5 w-5 mr-2" />
                Place Your Order
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default Products;
