import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OptimizedImage } from "@/components/OptimizedImage";
import { Badge } from "@/components/ui/badge";
import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateProductSlug } from "@/utils/generateSlug";

// Default placeholder image for products that don't have images
const DEFAULT_IMAGE = "potting-soil.jpg";

// Define the main product categories
const PRODUCT_CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "Amendment", label: "Amendment" },
  { value: "Mulch", label: "Mulch" },
  { value: "Potting Soil", label: "Potting Soil" },
  { value: "Concentrated Amendment", label: "Concentrated Amendment" },
];

interface Product {
  id: number;
  name: string;
  description?: string;
  previewCopy?: string;
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
  texturePhotoUrl?: string;
  displayTitle?: string;
  marketingTitle?: string;
  marketingNote?: string;
  seoKeywords?: string;
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
  slug?: string;
  catalogDisplayOrder?: number;
}

interface ProductShowcaseProps {
  products: Product[];
  loading?: boolean;
  onProductSelect?: (product: Product) => void;
  initialCategory?: string;
  categories?: Array<{ value: string; label: string }>;
}

// Helper function to get the display name for products (copied from Home/ProductDetail)
const getProductDisplayName = (product: Product): string => {
  return product.displayTitle || product.productType || product.name;
};

export default function ProductShowcase({ products, loading = false, onProductSelect, initialCategory = "all", categories }: ProductShowcaseProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [, navigate] = useLocation();

  // Update selected category when initialCategory changes
  useEffect(() => {
    setSelectedCategory(initialCategory);
  }, [initialCategory]);

  const categoryOptions = categories && categories.length > 0 ? categories : PRODUCT_CATEGORIES;

  // Filter products based on search term and category
  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const normalizedCategory = selectedCategory.toLowerCase();

    return products.filter((product) => {
      const productCategory = product.category?.toLowerCase() ?? "";
      const matchesCategory = normalizedCategory === "all" || productCategory === normalizedCategory;
      if (!matchesCategory) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const description = product.description?.toLowerCase() ?? "";
      const preview = product.previewCopy?.toLowerCase() ?? "";
      const marketingTitle = product.marketingTitle?.toLowerCase() ?? "";
      const displayTitle = product.displayTitle?.toLowerCase() ?? "";
      const keywords = product.seoKeywords?.toLowerCase() ?? "";
      return (
        product.name.toLowerCase().includes(normalizedSearch) ||
        displayTitle.includes(normalizedSearch) ||
        marketingTitle.includes(normalizedSearch) ||
        description.includes(normalizedSearch) ||
        preview.includes(normalizedSearch) ||
        keywords.includes(normalizedSearch) ||
        productCategory.includes(normalizedSearch)
      );
    });
  }, [products, searchTerm, selectedCategory]);

  // Handle product click
  const handleProductClick = (product: Product) => {
    if (onProductSelect) {
      onProductSelect(product);
    } else {
      // Prefer slug for SEO-friendly URLs, fall back to ID if slug is missing
      const identifier = product.slug || (product.id ? String(product.id) : generateProductSlug(product.productType ?? undefined, product.name));

      // Route mulch products to the MulchDetail page
      if ((product.category || "").toLowerCase() === "mulch") {
        navigate(`/products/mulch/${identifier}`);
      } else {
        navigate(`/products/${identifier}`);
      }
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-4">
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
    <div className="container mx-auto px-4 py-4">
      {/* Search and Filter Section */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="w-full md:w-64">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="text-center py-12 bg-neutral-50 rounded-xl">
          <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Filter className="h-10 w-10 text-neutral-400" />
          </div>
          <h3 className="text-2xl font-semibold mb-3">No products found</h3>
          <p className="text-neutral-600 mb-6 max-w-md mx-auto">
            Try adjusting your search criteria or browse our full catalog of premium soil products.
          </p>
          <Button
            onClick={() => {
              setSearchTerm("");
              setSelectedCategory("all");
            }}
            variant="outline"
            className="bg-white border-primary text-primary hover:bg-primary hover:text-white transition-colors duration-300"
          >
            View All Products
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <Card
              key={product.id}
              className="overflow-hidden transition-all duration-300 border-0 hover:border-0 bg-white dark:bg-neutral-900 hover:shadow-[0_15px_35px_-5px_rgba(0,0,0,0.1)] rounded-2xl group relative"
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-t-2xl cursor-pointer" onClick={() => handleProductClick(product)}>
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 to-black/0 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors duration-300 z-10 flex items-center justify-center">
                  <div className="bg-white text-primary font-semibold px-4 py-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0 duration-300">
                    View Details
                  </div>
                </div>
                <OptimizedImage
                  src={product.imageUrl || product.additionalImages?.[0] || product.texturePhotoUrl || DEFAULT_IMAGE}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  decoding="async"
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
              </div>

              <div className="p-5 flex flex-col gap-3 h-full">
                <div className="flex items-center justify-between text-xs text-muted-foreground uppercase tracking-wide">
                  <Badge variant="outline" className="rounded-full px-3 py-1 text-[11px] font-medium text-muted-foreground">
                    {product.category || "Uncategorized"}
                  </Badge>
                  {product.previewCopy && <span className="text-primary/80 font-semibold">Catalog Preview</span>}
                </div>

                <div>
                  <h3 className="text-xl font-heading font-bold text-foreground group-hover:text-primary transition-colors duration-200">
                    {getProductDisplayName(product)}
                  </h3>
                </div>

                {product.description && <p className="text-foreground/70 line-clamp-3 text-sm">{product.description}</p>}

                {product.certifications && (
                  <div className="flex flex-wrap gap-1">
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
                  <Button
                    className="w-full bg-primary hover:bg-primary/90 text-white shadow-sm hover:shadow-md transition-all duration-200"
                    onClick={() => handleProductClick(product)}
                  >
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
