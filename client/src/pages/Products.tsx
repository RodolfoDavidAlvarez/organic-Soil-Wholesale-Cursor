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
  const [activeCategory, setActiveCategory] = useState("all");
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);

  // Get URL parameters
  const searchParams = new URLSearchParams(window.location.search);
  const categoryParam = searchParams.get("category");

  // Use the product data from our file with sample data
  // We're using this data directly instead of fetching from API for this demo
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  useEffect(() => {
    if (products.length > 0) {
      if (categoryParam) {
        setActiveCategory(categoryParam);
      }

      if (activeCategory === "all") {
        setFilteredProducts(products);
      } else {
        setFilteredProducts(products.filter((product) => product.category.toLowerCase() === activeCategory));
      }
    }
  }, [products, activeCategory, categoryParam]);

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    if (category === "all") {
      searchParams.delete("category");
    } else {
      searchParams.set("category", category);
    }
    const newUrl = searchParams.toString() ? `?${searchParams.toString()}` : "";
    window.history.pushState({}, "", `/products${newUrl}`);
  };

  const categories = [
    { id: "all", name: "All Products" },
    { id: "compost", name: "Compost" },
    { id: "amendment", name: "Soil Amendments" },
    { id: "potting", name: "Potting Soils" },
    { id: "specialty", name: "Specialty Blends" },
  ];

  return (
    <>
      {/* Products Header */}
      <section className="bg-neutral-50 py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-heading font-bold text-primary mb-4">Our Product Catalog</h1>
          <p className="text-lg text-neutral-800 max-w-3xl">
            Discover our comprehensive range of premium soil products and amendments for optimal growth.
          </p>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          {/* Product Categories */}
          <div className="flex flex-wrap justify-center mb-12">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={activeCategory === category.id ? "default" : "outline"}
                className={`m-2 ${
                  activeCategory === category.id ? "bg-primary text-white" : "bg-white text-primary border border-primary hover:bg-neutral-100"
                }`}
                onClick={() => handleCategoryChange(category.id)}
              >
                {category.name}
              </Button>
            ))}
          </div>

          {/* Products Showcase */}
          <ProductShowcase products={filteredProducts} loading={isLoading} />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-neutral-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-center">
              <div className="md:w-2/3 mb-6 md:mb-0 md:pr-8">
                <h2 className="text-2xl md:text-3xl font-heading font-bold text-primary mb-4">Interested in Wholesale Pricing?</h2>
                <p className="text-neutral-700 mb-6">
                  Create an account to access wholesale pricing and place bulk orders. Our team is ready to support your growing needs with premium
                  organic soil products.
                </p>
                <Link href="/onboarding">
                  <Button size="lg" className="bg-primary hover:bg-primary-light text-white">
                    Become a Wholesale Partner
                  </Button>
                </Link>
              </div>
              <div className="md:w-1/3">
                <img
                  src="https://images.unsplash.com/photo-1605000797499-95a51c5269ae?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
                  alt="Wholesale partnership"
                  className="rounded-lg shadow-md"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Products;
