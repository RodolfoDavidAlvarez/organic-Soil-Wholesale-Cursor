import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Product } from "@/shared/schema";
import { Button } from "@/components/ui/button";
import { Award, Leaf, ChevronRight, Loader2, Package, Filter } from "lucide-react";
import ProductShowcase from "@/components/ProductShowcase";
import { productsData } from "@/data/productData";

const Products = () => {
  const [, setLocation] = useLocation();
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchParams] = useState(new URLSearchParams(window.location.search));
  const initialCategory = searchParams.get("category") || "all";

  // Load products with IDs
  useEffect(() => {
    // Add IDs to the products
    const productsWithIds = productsData.map((product, index) => ({
      ...product,
      id: index + 1,
      // Add any missing required fields with defaults
      story: product.story || null,
      usage: product.usage || null,
      productType: product.productType || null,
      safetyPrecautions: product.safetyPrecautions || null,
      warranty: product.warranty || null,
      additionalImages: product.additionalImages || null,
    }));

    setProducts(productsWithIds);
    setIsLoading(false);
  }, []);

  return (
    <>
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
