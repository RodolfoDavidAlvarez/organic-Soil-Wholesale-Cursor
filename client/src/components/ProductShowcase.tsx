import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OptimizedImage } from "@/components/OptimizedImage";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, ArrowRight, Leaf, Package } from "lucide-react";
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
    <div className="container mx-auto px-4 py-6">
      {/* Search and Filter Section */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              type="text"
              placeholder="Search products by name, type, or use..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 bg-white border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm"
            />
          </div>
        </div>
        <div className="w-full md:w-72">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="h-12 bg-white border-gray-200 rounded-xl shadow-sm">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Filter by category" />
              </div>
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

      {/* Results count */}
      {filteredProducts.length > 0 && (
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{filteredProducts.length}</span> product{filteredProducts.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {filteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-gradient-to-br from-arizona-sand/30 to-white rounded-3xl border border-gray-100">
          <div className="w-20 h-20 bg-arizona-sage/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Package className="h-10 w-10 text-arizona-sage" />
          </div>
          <h3 className="text-2xl font-heading font-semibold mb-3 text-foreground">No products found</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Try adjusting your search criteria or browse our full catalog of premium organic soil products.
          </p>
          <Button
            onClick={() => {
              setSearchTerm("");
              setSelectedCategory("all");
            }}
            className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
          >
            View All Products
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map((product) => (
            <Card
              key={product.id}
              className="overflow-hidden transition-all duration-300 bg-white border border-gray-100 hover:border-arizona-sage/30 hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] rounded-3xl group relative cursor-pointer"
              onClick={() => handleProductClick(product)}
            >
              {/* Image Container */}
              <div className="relative aspect-[4/3] overflow-hidden">
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Category badge positioned over image */}
                <div className="absolute top-4 left-4 z-20">
                  <Badge className="bg-white/95 backdrop-blur-sm text-foreground shadow-lg border-0 rounded-full px-3 py-1.5 text-xs font-semibold">
                    <Leaf className="h-3 w-3 mr-1.5 text-arizona-sage" />
                    {product.category || "Specialty"}
                  </Badge>
                </div>

                {/* View button on hover */}
                <div className="absolute bottom-4 left-4 right-4 z-20 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                  <Button
                    className="w-full bg-white/95 backdrop-blur-sm text-foreground hover:bg-white shadow-xl border-0 font-semibold"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleProductClick(product);
                    }}
                  >
                    View Product
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>

                <OptimizedImage
                  src={product.imageUrl || product.additionalImages?.[0] || product.texturePhotoUrl || DEFAULT_IMAGE}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  decoding="async"
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
              </div>

              {/* Content */}
              <div className="p-6 flex flex-col gap-3">
                <div>
                  <h3 className="text-xl font-heading font-bold text-foreground group-hover:text-primary transition-colors duration-200 line-clamp-1">
                    {getProductDisplayName(product)}
                  </h3>
                  {product.productType && product.productType !== getProductDisplayName(product) && (
                    <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">{product.productType}</p>
                  )}
                </div>

                {product.description && (
                  <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed">{product.description}</p>
                )}

                {/* Tags/certifications */}
                {product.certifications && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {(typeof product.certifications === "string"
                      ? product.certifications.split(",").map((cert: string) => cert.trim())
                      : product.certifications
                    ).slice(0, 3).map((cert: string | { name: string; icon: JSX.Element }) => (
                      <span
                        key={typeof cert === "string" ? cert : cert.name}
                        className="bg-arizona-sage/10 text-arizona-sage text-[10px] font-medium px-2.5 py-1 rounded-full"
                      >
                        {typeof cert === "string" ? cert : cert.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Bottom action area */}
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                  <span className="text-xs text-muted-foreground">Wholesale available</span>
                  <span className="text-primary font-semibold text-sm flex items-center gap-1 group-hover:gap-2 transition-all duration-200">
                    Details
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
