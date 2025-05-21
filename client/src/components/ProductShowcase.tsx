import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { productsData } from "@/data/productData";

// Default placeholder image for products that don't have images
const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80";

interface Product {
  id: number;
  name: string;
  description?: string;
  category: string;
  ingredients?: string;
  targetAudience?: string;
  recommendedUses?: string;
  story?: string | null;
  usage?: string | null;
  productType?: string | null;
  safetyPrecautions?: string | null;
  warranty?: string | null;
  additionalImages?: string[] | null;
  price?: number;
  imageUrl?: string;
  certifications?:
    | string
    | Array<{
        name: string;
        icon: JSX.Element;
      }>;
  sizeOptions?: Array<{
    name: string;
    price: number;
  }>;
}

interface ProductShowcaseProps {
  products: Product[];
  loading?: boolean;
  onProductSelect?: (product: Product) => void;
}

// Helper function to get the display name for products (copied from Home/ProductDetail)
const getProductDisplayName = (product: Product): string => {
  return product.productType || product.name;
};

export default function ProductShowcase({ products, loading = false, onProductSelect }: ProductShowcaseProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [, navigate] = useLocation();
  const [textureLoaded, setTextureLoaded] = useState<{ [key: number]: boolean }>({});

  // Filter products based on search term
  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle product click
  const handleProductClick = (product: Product) => {
    if (onProductSelect) {
      onProductSelect(product);
    } else {
      navigate(`/products/${product.id}`);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden animate-pulse">
              <div className="h-48 bg-neutral-200 rounded-b-xl relative">
                <div className="absolute bottom-2 right-2 w-24 h-24 bg-neutral-300 rounded-lg" />
              </div>
              <CardHeader>
                <div className="h-6 bg-neutral-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-neutral-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-neutral-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
              </CardContent>
              <CardFooter>
                <div className="h-10 bg-neutral-200 rounded w-full"></div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground">
            <span className="relative inline-block">
              <span className="relative z-10">Our Products</span>
              <span className="absolute bottom-0 left-0 w-full h-3 bg-accent/30 -rotate-1 z-0"></span>
            </span>
          </h2>
          <p className="text-foreground/70 mt-2 max-w-xl">Explore our premium range of organic soil products for your growing needs</p>
        </div>
        <div className="relative w-full md:w-auto flex-1 md:max-w-md">
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 pr-4 py-6 border border-neutral-200 hover:border-primary focus:border-primary rounded-xl w-full transition-all duration-200 shadow-sm"
          />
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-primary h-5 w-5">
            <Search className="h-full w-full" />
          </div>
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-neutral-50 rounded-xl">
          <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Filter className="h-10 w-10 text-neutral-400" />
          </div>
          <h3 className="text-2xl font-semibold mb-3">No products found</h3>
          <p className="text-neutral-600 mb-6 max-w-md mx-auto">
            Try adjusting your search criteria or browse our full catalog of premium soil products.
          </p>
          <Button
            onClick={() => setSearchTerm("")}
            variant="outline"
            className="bg-white border-primary text-primary hover:bg-primary hover:text-white transition-colors duration-300"
          >
            View All Products
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map((product) => (
            <Card
              key={product.id}
              className="overflow-hidden transition-all duration-300 cursor-pointer border-0 hover:border-0 bg-white dark:bg-neutral-900 hover:shadow-[0_15px_35px_-5px_rgba(0,0,0,0.1)] rounded-2xl group"
              onClick={() => handleProductClick(product)}
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-t-2xl">
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 to-black/0 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors duration-300 z-10 flex items-center justify-center">
                  <div className="bg-white text-primary font-semibold px-4 py-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0 duration-300">
                    View Details
                  </div>
                </div>
                <img
                  src={product.additionalImages?.[0] || product.imageUrl || DEFAULT_IMAGE}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />

                {/* 9-pound Bag Preview Thumbnail */}
                {product.imageUrl && (
                  <div className="absolute bottom-3 right-3 flex flex-col items-end z-20">
                    <span className="mb-1 text-xs bg-white px-2 py-0.5 rounded-full shadow-md text-primary font-semibold">9lb Bag</span>
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden border-2 border-white shadow-lg bg-neutral-200 relative transform transition-transform duration-300 group-hover:scale-110 hover:scale-125">
                      {!textureLoaded[product.id] && (
                        <div className="absolute inset-0 bg-neutral-200 animate-pulse flex items-center justify-center">
                          <div className="h-8 w-8 text-neutral-400 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
                        </div>
                      )}
                      <img
                        src={product.imageUrl}
                        alt={`${product.name} 9lb bag preview`}
                        className={`w-full h-full object-cover transition-all duration-700 ${textureLoaded[product.id] ? "opacity-100 blur-0" : "opacity-0 blur-sm"}`}
                        loading="lazy"
                        sizes="100px"
                        onLoad={() => setTextureLoaded((prev) => ({ ...prev, [product.id]: true }))}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6">
                <h3 className="text-xl font-heading font-bold text-foreground mb-2 group-hover:text-primary transition-colors duration-200">
                  {getProductDisplayName(product)}
                </h3>
                {/* Show description only if it is different from the display name */}
                {product.description && product.description !== getProductDisplayName(product) && (
                  <p className="text-foreground/70 line-clamp-2 mb-4 text-sm">{product.description}</p>
                )}

                {product.certifications && (
                  <div className="flex flex-wrap gap-1 mb-6">
                    {(typeof product.certifications === "string"
                      ? product.certifications.split(",").map((cert: string) => cert.trim())
                      : product.certifications
                    ).map((cert: string | { name: string; icon: JSX.Element }) => (
                      <Badge
                        key={typeof cert === "string" ? cert : cert.name}
                        variant="outline"
                        className="bg-primary/5 text-primary text-[10px] font-normal px-2"
                      >
                        {typeof cert === "string" ? cert : cert.name}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="mt-auto pt-2">
                  <Button className="w-full bg-primary hover:bg-primary/90 text-white shadow-sm hover:shadow-md transition-all duration-200">
                    View Details
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
