import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import SEO from "@/components/layout/SEO";
import ProductShowcase from "@/components/ProductShowcase";
import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";
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
  imageUrl?: string | null;
  image_url?: string | null;
  texturePhotoUrl?: string | null;
  texture_photo_url?: string | null;
  additionalImages?: string[] | null;
  additional_images?: string[] | null;
  targetAudience?: string | null;
  target_audience?: string | null;
  recommendedUses?: string | null;
  recommended_uses?: string | null;
  story?: string | null;
  usage?: string | null;
  ingredients?: string | null;
  features?: string | null;
  catalog?: { isEnabled?: boolean; displayOrder?: number | null };
  isCatalogEnabled?: boolean | null;
  is_catalog_enabled?: boolean | null;
  catalogDisplayOrder?: number | null;
  catalog_display_order?: number | null;
  slug?: string | null;
};

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

  const catalogOrder =
    record.catalogDisplayOrder ??
    record.catalog_display_order ??
    record.catalog?.displayOrder ??
    Number.MAX_SAFE_INTEGER;

  const imageUrl = record.imageUrl ?? record.image_url ?? undefined;
  const texturePhotoUrl = record.texturePhotoUrl ?? record.texture_photo_url ?? undefined;

  return {
    id: record.id,
    name: record.name ?? "Product",
    description: record.description ?? undefined,
    category: record.category ?? "Uncategorized",
    ingredients: record.ingredients ?? undefined,
    targetAudience: record.targetAudience ?? record.target_audience ?? undefined,
    recommendedUses: record.recommendedUses ?? record.recommended_uses ?? undefined,
    story: record.story ?? undefined,
    usage: record.usage ?? undefined,
    features: record.features ?? undefined,
    productType: record.productType ?? record.product_type ?? undefined,
    additionalImages,
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

  const heroProduct = products[0];

  return (
    <>
      <SEO
        title="Wholesale Organic Soil Products"
        description="Browse every Soil Seed & Water product in one place. Real-time data from our catalog ensures accurate descriptions, media, and availability."
        keywords="soil seed and water products, organic soil catalog, wholesale compost, organic mulch, potting soil supplier"
        canonical="https://organicsoilwholesale.com/products"
      />

      <section className="bg-gradient-to-br from-primary/5 via-white to-white py-12 sm:py-16">
        <div className="container mx-auto px-4">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-primary">Premium Catalog</p>
              <h1 className="mt-4 text-3xl font-heading font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                All Soil Seed &amp; Water products, kept perfectly in sync
              </h1>
              <p className="mt-4 text-base text-muted-foreground">
                These listings pull directly from the live database used by the admin console and Pay &amp;
                Pickup system. Edit once in the dashboard and the entire site updates instantly.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button size="lg" className="bg-primary text-white hover:bg-primary/90" asChild>
                  <a href="#catalog">Explore Catalog</a>
                </Button>
                <Button size="lg" variant="ghost" asChild>
                  <a href="/order">Place an Order</a>
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 rounded-3xl bg-primary/10 blur-3xl" />
              <div className="relative rounded-3xl border bg-white/80 p-6 shadow-xl backdrop-blur">
                <div className="flex items-center gap-3">
                  <Package className="h-10 w-10 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Now editing</p>
                    <p className="text-lg font-semibold">
                      {heroProduct?.displayTitle || heroProduct?.name || "Catalog synced"}
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  {heroProduct?.description ??
                    "Choose any product below to see the full set of content, imagery, and Pay & Pickup data."}
                </p>
                <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                  <div className="rounded-xl border bg-muted/30 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Live images</p>
                    <p className="text-lg font-semibold">{heroProduct?.additionalImages?.length ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Pulled from admin gallery</p>
                  </div>
                  <div className="rounded-xl border bg-muted/30 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Size options</p>
                    <p className="text-lg font-semibold">
                      {heroProduct?.additionalImages?.length
                        ? "Customized"
                        : "Standard"}
                    </p>
                    <p className="text-xs text-muted-foreground">Updated instantly</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="catalog" className="bg-white py-12 sm:py-16">
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
