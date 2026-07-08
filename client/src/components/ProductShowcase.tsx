import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OptimizedImage } from "@/components/OptimizedImage";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, ArrowRight, Leaf, Package, ChevronRight, Star, Truck, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateProductSlug } from "@/utils/generateSlug";
import { AUDIENCE_FILTERS, getAudienceTagsForProduct, type AudienceTag } from "@/data/audienceFilters";

// Default placeholder image for products that don't have images
const DEFAULT_IMAGE = "/images/optimized/default-potting-soil-texture.jpg";

/** Label for audience tag (for badges and dropdown) */
const getAudienceLabel = (value: AudienceTag): string => {
  const found = AUDIENCE_FILTERS.find((f) => f.value === value);
  return found ? found.label : value;
};

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
  sortOrder?: number;
  isHidden?: boolean;
  sizePriceOptions?: any[];
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

  // Map legacy category names to audience filter values for URL / initial state
  const resolveFilterValue = (raw: string): string => {
    const r = raw.trim().toLowerCase();
    if (AUDIENCE_FILTERS.some((f) => f.value === r)) return r;
    const legacy: Record<string, string> = {
      amendment: "amendment",
      amendments: "amendment",
      mulch: "mulch",
      compost: "compost",
      "worm castings": "worm-castings",
      "potting soil": "planter-potting",
      "potting": "planter-potting",
    };
    return legacy[r] ?? "all";
  };

  // Sync with URL ?category= or initialCategory
  useEffect(() => {
    const urlCategory = new URLSearchParams(window.location.search).get("category");
    const resolved = urlCategory ? resolveFilterValue(urlCategory) : resolveFilterValue(initialCategory);
    setSelectedCategory(resolved || "all");
  }, [initialCategory]);

  // Audience-oriented filter options (what prospects look for)
  const categoryOptions = AUDIENCE_FILTERS;

  // Keep URL in sync with filter for shareable links
  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    const params = new URLSearchParams(window.location.search);
    if (value === "all") {
      params.delete("category");
    } else {
      params.set("category", value);
    }
    const newUrl = params.toString() ? `${window.location.pathname}?${params}` : window.location.pathname;
    window.history.replaceState(null, "", newUrl);
  };

  // Precompute tags per product for filtering and badges
  const productTagsMap = useMemo(() => {
    const map = new Map<number, AudienceTag[]>();
    products.forEach((p) => map.set(p.id, getAudienceTagsForProduct(p)));
    return map;
  }, [products]);

  // Filter by selected audience tag + search (also exclude hidden products)
  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return products.filter((product) => {
      // Skip hidden products (no bag photos yet)
      if ((product as any).isHidden) return false;

      const tags = productTagsMap.get(product.id) ?? [];
      const matchesFilter =
        selectedCategory === "all" || tags.includes(selectedCategory as AudienceTag);
      if (!matchesFilter) return false;

      if (!normalizedSearch) return true;

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
        tags.some((t) => getAudienceLabel(t).toLowerCase().includes(normalizedSearch))
      );
    });
  }, [products, searchTerm, selectedCategory, productTagsMap]);

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
      {/* Search + filter strip — accent background and border for contrast */}
      <div className="sticky top-0 z-30 -mx-4 px-4 py-3 sm:mx-0 sm:px-0 sm:py-0 sm:mb-6 rounded-xl sm:rounded-2xl bg-primary/5 border border-primary/10 sm:border-primary/15">
        <div className="flex gap-2 sm:gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/70" />
            <Input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 sm:pl-12 min-h-[48px] h-12 text-base bg-white border-primary/20 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary touch-manipulation shadow-sm"
            />
          </div>
          <Select value={selectedCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger className="min-h-[48px] h-12 w-auto min-w-[130px] sm:min-w-[180px] bg-white border-primary/20 rounded-xl px-3 sm:px-4 touch-manipulation shadow-sm font-medium text-foreground">
              <Filter className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
              <span className="truncate text-left">
                <SelectValue placeholder="What do you need?" />
              </span>
            </SelectTrigger>
            <SelectContent align="end" className="border-primary/10">
              {categoryOptions.map((category) => (
                <SelectItem key={category.value} value={category.value} className="min-h-[44px] text-base sm:text-sm py-3 font-medium">
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results count — pill-style for quick scan */}
      {filteredProducts.length > 0 && (
        <div className="flex items-center justify-between py-3 sm:py-4 sm:mb-2">
          <p className="text-sm">
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 font-semibold text-primary">
              {filteredProducts.length}
            </span>
            <span className="ml-2 text-muted-foreground">product{filteredProducts.length !== 1 ? "s" : ""}</span>
          </p>
          {selectedCategory !== "all" && (
            <button
              onClick={() => handleCategoryChange("all")}
              className="min-h-[44px] px-3 py-1.5 rounded-lg text-sm font-medium text-primary bg-primary/10 hover:bg-primary/15 active:opacity-70 touch-manipulation transition-colors"
            >
              Clear filter
            </button>
          )}
        </div>
      )}

      {filteredProducts.length === 0 ? (
        <div className="text-center py-12 sm:py-16 px-4 rounded-2xl border border-primary/10 bg-primary/[0.02]">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 ring-2 ring-primary/20">
            <Package className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
          </div>
          <h3 className="text-xl sm:text-2xl font-heading font-semibold mb-2 sm:mb-3 text-foreground">No products found</h3>
          <p className="text-muted-foreground mb-6 text-sm sm:text-base max-w-sm mx-auto">
            Try a different search or browse all our premium organic soil products.
          </p>
          <Button
            onClick={() => {
              setSearchTerm("");
              handleCategoryChange("all");
            }}
            className="bg-primary hover:bg-primary/90 text-primary-foreground min-h-[48px] h-12 px-6 rounded-xl font-semibold shadow-md shadow-primary/20"
          >
            View All Products
          </Button>
        </div>
      ) : (
        /* Mobile-first product grid - single column on mobile for max readability */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredProducts.map((product) => (
            <Card
              key={product.id}
              className="overflow-hidden bg-white border-l-4 border-l-primary border border-gray-200/80 active:scale-[0.99] sm:hover:border-primary sm:hover:shadow-lg sm:hover:shadow-primary/5 transition-all duration-200 rounded-2xl group cursor-pointer touch-manipulation"
              onClick={() => handleProductClick(product)}
            >
              <div className="relative aspect-square sm:aspect-[4/3] overflow-hidden bg-gray-100">
                {/* Best Seller + Certification badges */}
                <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 z-10 flex flex-wrap gap-1.5 max-w-[85%]">
                  {(product.name === "Simon's Gold" || product.name === "PlantPal" || product.name === "Mikey's Worm Poop") && (
                    <Badge className="bg-amber-500 text-white shadow border-0 rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ring-black/10">
                      <Star className="h-2.5 w-2.5 mr-1 fill-current" />
                      Best Seller
                    </Badge>
                  )}
                  {(() => {
                    const certs = typeof product.certifications === 'string' ? product.certifications : '';
                    if (certs.includes('OMRI')) return (
                      <Badge className="bg-white/90 text-green-700 shadow border-0 rounded-full px-2 py-0.5 text-[10px] font-semibold backdrop-blur-sm">
                        <ShieldCheck className="h-2.5 w-2.5 mr-0.5" />
                        OMRI
                      </Badge>
                    );
                    return null;
                  })()}
                </div>
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

              <div className="p-4 sm:p-4">
                {/* Generic type — big and scannable (e.g. "Dairy Compost") */}
                {product.productType && (
                  <p className="text-sm font-bold text-primary uppercase tracking-wide leading-tight">
                    {product.productType}
                  </p>
                )}
                {/* Brand name + arrow */}
                <div className="flex items-start justify-between gap-2 mt-0.5">
                  <h3 className="text-base font-heading font-bold text-foreground leading-snug line-clamp-1 sm:group-hover:text-primary transition-colors">
                    {getProductDisplayName(product)}
                  </h3>
                  <ArrowRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-0.5 flex-shrink-0 mt-0.5 transition-all" />
                </div>
                {/* Price + Best For row */}
                <div className="flex items-center justify-between mt-1.5">
                  {(() => {
                    const opts = product.sizePriceOptions || [];
                    const cfBag = opts.find((o: any) => (o.size || o.label || '').includes('1CF') || (o.size || o.label || '').includes('2CF'));
                    const nlbBag = opts.find((o: any) => (o.size || o.label || '').includes('9lb'));
                    const msrpItem = cfBag || nlbBag;
                    if (!msrpItem?.msrp) return <span />;
                    const sizeLabel = (msrpItem.size || msrpItem.label || '').replace(' Bag', '');
                    return (
                      <p className="text-sm font-bold text-primary">
                        {typeof msrpItem.msrp === 'string' ? msrpItem.msrp : `$${msrpItem.msrp}`}
                        <span className="text-[10px] font-normal text-muted-foreground ml-1">/ {sizeLabel}</span>
                      </p>
                    );
                  })()}
                  {/* Best for tag */}
                  {(() => {
                    const tags = productTagsMap.get(product.id) ?? [];
                    const mainTag = tags.find(t => t !== 'amendment') || tags[0];
                    if (!mainTag) return null;
                    return (
                      <span className="text-[10px] text-muted-foreground bg-muted/60 rounded-full px-2 py-0.5 flex-shrink-0">
                        {getAudienceLabel(mainTag)}
                      </span>
                    );
                  })()}
                </div>
                {/* Quick use hint — what it's for at a glance */}
                {product.usage && (
                  <p className="text-[11px] text-primary/70 font-medium mt-1.5 line-clamp-1">
                    {product.usage.split(/[.\n]/)[0].trim()}
                  </p>
                )}
                {/* Short description */}
                {(product.previewCopy || product.description) && (
                  <p className="text-muted-foreground line-clamp-2 text-xs leading-relaxed mt-1">
                    {product.previewCopy || product.description}
                  </p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
