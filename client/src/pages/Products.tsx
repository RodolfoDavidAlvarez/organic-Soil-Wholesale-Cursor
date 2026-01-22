import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import SEO from "@/components/layout/SEO";
import ProductShowcase from "@/components/ProductShowcase";
import { Button } from "@/components/ui/button";
import { generateProductSlug } from "@/utils/generateSlug";

type ApiProduct = {
  id: number;
  name: string;
  description?: string | null;
  category?: string | null;
  price?: number | string | null;
  productType?: string | null;
  product_type?: string | null;
  displayTitle?: string | null;
  display_title?: string | null;
  marketingTitle?: string | null;
  marketing_title?: string | null;
  marketingNote?: string | null;
  marketing_note?: string | null;
  imageUrl?: string | null;
  image_url?: string | null;
  texturePhotoUrl?: string | null;
  texture_photo_url?: string | null;
  additionalImages?: string[] | null;
  additional_images?: string[] | null;
  availableSizeOptions?: string[] | null;
  available_size_options?: string[] | null;
  targetAudience?: string | null;
  target_audience?: string | null;
  recommendedUses?: string | null;
  recommended_uses?: string | null;
  story?: string | null;
  usage?: string | null;
  ingredients?: string | null;
  features?: string | null;
  seoKeywords?: string | null;
  seo_keywords?: string | null;
  catalog?: { isEnabled?: boolean; displayOrder?: number | null };
  isCatalogEnabled?: boolean | null;
  is_catalog_enabled?: boolean | null;
  catalogDisplayOrder?: number | null;
  catalog_display_order?: number | null;
  slug?: string | null;
};

// Fetch public products (restored for new system)
const fetchPublicProducts = async (): Promise<ApiProduct[]> => {
  const response = await fetch("/api/public/products");
  if (!response.ok) {
    throw new Error("Failed to load products");
  }

  const body = await response.json();
  if (Array.isArray(body)) {
    return body;
  }
  if (Array.isArray(body?.products)) {
    return body.products;
  }
  return [];
};

const normalizeProduct = (record: ApiProduct) => {
  const additionalImages = Array.isArray(record.additionalImages)
    ? record.additionalImages
    : Array.isArray(record.additional_images)
      ? record.additional_images
      : [];
  const availableSizeOptions = record.availableSizeOptions ?? record.available_size_options ?? undefined;

  const catalogOrder =
    record.catalogDisplayOrder ??
    record.catalog_display_order ??
    record.catalog?.displayOrder ??
    Number.MAX_SAFE_INTEGER;

  const imageUrl = record.imageUrl ?? record.image_url ?? undefined;
  const texturePhotoUrl = record.texturePhotoUrl ?? record.texture_photo_url ?? undefined;
  const marketingTitle = record.marketingTitle ?? record.marketing_title ?? undefined;
  const marketingNote = record.marketingNote ?? record.marketing_note ?? undefined;
  const seoKeywords = record.seoKeywords ?? record.seo_keywords ?? undefined;
  const previewCopy =
    marketingNote?.trim().length
      ? marketingNote.trim()
      : marketingTitle?.trim().length
        ? marketingTitle.trim()
        : record.description?.trim();

  return {
    id: record.id,
    name: record.name ?? "Product",
    description: record.description ?? undefined,
    previewCopy: previewCopy ?? undefined,
    category: record.category ?? "Uncategorized",
    ingredients: record.ingredients ?? undefined,
    targetAudience: record.targetAudience ?? record.target_audience ?? undefined,
    recommendedUses: record.recommendedUses ?? record.recommended_uses ?? undefined,
    story: record.story ?? undefined,
    usage: record.usage ?? undefined,
    features: record.features ?? undefined,
    productType: record.productType ?? record.product_type ?? undefined,
    marketingTitle,
    marketingNote,
    seoKeywords,
    additionalImages,
    availableSizeOptions,
    price:
      typeof record.price === "number"
        ? record.price
        : typeof record.price === "string"
          ? Number(record.price)
          : undefined,
    imageUrl,
    texturePhotoUrl,
    displayTitle: record.displayTitle ?? record.display_title ?? undefined,
    slug: record.slug ?? generateProductSlug(record.product_type || record.productType, record.name),
    catalogDisplayOrder: catalogOrder,
  };
};

const Products = () => {
  const [searchParams] = useState(() => new URLSearchParams(window.location.search));
  const initialCategory = searchParams.get("category") || "all";

  const {
    data: apiProducts,
    isLoading,
    error,
  } = useQuery<ApiProduct[]>({
    queryKey: ["publicProducts"],
    queryFn: fetchPublicProducts,
    staleTime: 60 * 1000,
  });

  const products = useMemo(() => {
    return (apiProducts ?? [])
      .map(normalizeProduct)
      .sort((productA, productB) => {
        if (productA.catalogDisplayOrder === productB.catalogDisplayOrder) {
          return productA.name.localeCompare(productB.name);
        }
        return (productA.catalogDisplayOrder ?? Number.MAX_SAFE_INTEGER) -
          (productB.catalogDisplayOrder ?? Number.MAX_SAFE_INTEGER);
      });
  }, [apiProducts]);

  const categories = useMemo(() => {
    const options = new Map<string, string>();
    options.set("all", "All Categories");
    products.forEach((product) => {
      const categoryLabel = product.category || "Uncategorized";
      if (!options.has(categoryLabel)) {
        options.set(categoryLabel, categoryLabel);
      }
    });
    return Array.from(options.entries()).map(([value, label]) => ({ value, label }));
  }, [products]);

  return (
    <>
      <SEO
        title="Wholesale Organic Soil Products"
        description="Browse every Soil Seed & Water product in one place. Real-time data from our catalog ensures accurate descriptions, media, and availability."
        keywords="soil seed and water products, organic soil catalog, wholesale compost, organic mulch, potting soil supplier"
        canonical="https://organicsoilwholesale.com/products"
      />

      <section className="relative bg-gradient-to-br from-arizona-desert/30 via-white to-arizona-sand/20 py-12 sm:py-16 overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(181,84,26,0.05),_transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(77,124,94,0.05),_transparent_50%)]" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-arizona-sage/10 border border-arizona-sage/20 mb-4">
              <div className="w-2 h-2 rounded-full bg-arizona-sage animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider text-arizona-sage">Wholesale Catalog</span>
            </div>

            <h1 className="text-3xl font-heading font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Premium <span className="text-primary">Organic Soil</span> Products
            </h1>

            <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
              Arizona-produced compost, amendments, and specialty blends for landscapers, farms, nurseries, and commercial growers.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Button size="lg" className="bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20" asChild>
                <a href="#catalog">Browse Products</a>
              </Button>
              <Button size="lg" variant="outline" className="border-arizona-copper/30 hover:bg-arizona-copper/5 hover:border-arizona-copper/50" asChild>
                <a href="/order">Request Quote</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section id="catalog" className="bg-white py-6 sm:py-8">
        <div className="container mx-auto px-4">
          {error ? (
            <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-10 text-center">
              <h2 className="text-2xl font-semibold text-destructive">Unable to load products</h2>
              <p className="mt-2 text-muted-foreground">
                Please refresh the page or try again in a moment. The catalog will automatically reconnect to
                the database when it’s available.
              </p>
              <Button
                className="mt-6"
                onClick={() => window.location.reload()}
              >
                Refresh
              </Button>
            </div>
          ) : (
            <ProductShowcase
              products={products}
              loading={isLoading}
              initialCategory={initialCategory}
              categories={categories}
            />
          )}
        </div>
      </section>
    </>
  );
};

export default Products;
