import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OptimizedImage } from "@/components/OptimizedImage";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, ArrowRight, Leaf, Package, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateProductSlug } from "@/utils/generateSlug";

// Default placeholder image for products that don't have images
const DEFAULT_IMAGE = "/images/optimized/default-potting-soil-texture.jpg";

// Define the main product categories
const PRODUCT_CATEGORIES = [
  { value: "all", label: "All Products" },
  { value: "Compost", label: "Compost" },
  { value: "Worm Castings", label: "Worm Castings" },
  { value: "Amendment", label: "Amendments" },
  { value: "Mulch", label: "Mulch" },
  { value: "Potting Soil", label: "Potting Soil" },
];

// Helper to get the best product image - TEXTURE PHOTO FIRST per guidelines
const getProductImage = (product: Product): string => {
  // Priority: texture photo > image URL > additional images > default
  if (product.texturePhotoUrl && product.texturePhotoUrl.trim()) {
    return product.texturePhotoUrl;
  }
  if (product.imageUrl && product.imageUrl.trim() && !product.imageUrl.startsWith(" ")) {
    return product.imageUrl;
  }
  if (product.additionalImages?.length && product.additionalImages[0]?.trim()) {
    return product.additionalImages[0];
  }
  return DEFAULT_IMAGE;
};

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
      <div className="w-full">
        {/* Mobile-optimized loading skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden bg-white border border-gray-100 animate-pulse">
              <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-50" />
              <div className="p-4 space-y-3">
                <div className="h-5 bg-gray-200 rounded-full w-20" />
                <div className="h-6 bg-gray-200 rounded w-3/4" />
                <div className="space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-full" />
                  <div className="h-4 bg-gray-100 rounded w-2/3" />
                </div>
                <div className="h-11 bg-primary/10 rounded-xl mt-4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Mobile-optimized Search and Filter - sticky on mobile */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md -mx-4 px-4 py-3 sm:relative sm:bg-transparent sm:backdrop-blur-none sm:mx-0 sm:px-0 sm:py-0 sm:mb-6 border-b border-gray-100 sm:border-0">
        <div className="flex gap-2 sm:gap-4">
          {/* Search input - 48px height for reliable touch */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 sm:pl-12 min-h-[48px] h-12 text-base bg-gray-50 sm:bg-white border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary touch-manipulation"
            />
          </div>
          {/* Category filter - 48px square on mobile for easy tapping */}
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="min-h-[48px] h-12 w-12 sm:w-auto sm:min-w-[160px] bg-gray-50 sm:bg-white border-gray-200 rounded-xl px-3 sm:px-4 touch-manipulation">
              <Filter className="h-5 w-5 text-muted-foreground sm:mr-2" />
              <span className="hidden sm:inline">
                <SelectValue placeholder="Category" />
              </span>
            </SelectTrigger>
            <SelectContent align="end">
              {categoryOptions.map((category) => (
                <SelectItem key={category.value} value={category.value} className="min-h-[44px] text-base sm:text-sm py-3">
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results count - mobile adjusted with proper touch targets */}
      {filteredProducts.length > 0 && (
        <div className="flex items-center justify-between py-3 sm:py-4 sm:mb-2">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{filteredProducts.length}</span> product{filteredProducts.length !== 1 ? 's' : ''}
          </p>
          {selectedCategory !== "all" && (
            <button
              onClick={() => setSelectedCategory("all")}
              className="min-h-[44px] px-3 text-sm text-primary font-medium hover:underline active:opacity-70 touch-manipulation"
            >
              Clear filter
            </button>
          )}
        </div>
      )}

      {filteredProducts.length === 0 ? (
        <div className="text-center py-12 sm:py-16 px-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <Package className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
          </div>
          <h3 className="text-xl sm:text-2xl font-heading font-semibold mb-2 sm:mb-3 text-foreground">No products found</h3>
          <p className="text-muted-foreground mb-5 sm:mb-6 text-sm sm:text-base max-w-sm mx-auto">
            Try a different search or browse all our premium organic soil products.
          </p>
          <Button
            onClick={() => {
              setSearchTerm("");
              setSelectedCategory("all");
            }}
            className="bg-primary hover:bg-primary/90 text-white min-h-[48px] h-12 px-6 rounded-xl font-medium"
          >
            View All Products
          </Button>
        </div>
      ) : (
        /* Mobile-first product grid - single column on mobile for max readability */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          {filteredProducts.map((product) => (
            <Card
              key={product.id}
              className="overflow-hidden bg-white border border-gray-100 active:scale-[0.99] sm:hover:border-primary/30 sm:hover:shadow-xl transition-all duration-200 rounded-2xl group cursor-pointer touch-manipulation"
              onClick={() => handleProductClick(product)}
            >
              {/* Image Container - square on mobile for consistency */}
              <div className="relative aspect-square sm:aspect-[4/3] overflow-hidden bg-gray-50">
                {/* Category badge - solid green for visibility on any background */}
                <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 z-10">
                  <Badge className="bg-primary text-white shadow-md border-0 rounded-full px-3 py-1.5 text-xs font-semibold">
                    <Leaf className="h-3.5 w-3.5 mr-1.5" />
                    {product.category || "Specialty"}
                  </Badge>
                </div>

                {/* Gradient overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent z-[1]" />

                <OptimizedImage
                  src={getProductImage(product)}
                  alt={getProductDisplayName(product)}
                  className="w-full h-full object-cover sm:transition-transform sm:duration-500 sm:group-hover:scale-105"
                  loading="lazy"
                  decoding="async"
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                />
              </div>

              {/* Content - optimized for mobile touch and readability */}
              <div className="p-4 sm:p-5">
                {/* Product name - larger on mobile for readability */}
                <h3 className="text-lg sm:text-lg font-heading font-bold text-foreground leading-snug line-clamp-2 sm:group-hover:text-primary transition-colors mb-1.5">
                  {getProductDisplayName(product)}
                </h3>

                {/* Description - clear and readable */}
                {(product.previewCopy || product.description) && (
                  <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed mb-4">
                    {product.previewCopy || product.description}
                  </p>
                )}

                {/* CTA Button - 48px height for reliable touch targets */}
                <button
                  className="w-full min-h-[48px] h-12 sm:h-11 flex items-center justify-center gap-2 bg-primary text-white hover:bg-primary/90 rounded-xl font-semibold text-base sm:text-sm transition-all duration-200 shadow-sm active:scale-[0.98]"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleProductClick(product);
                  }}
                >
                  <span>View Details</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
