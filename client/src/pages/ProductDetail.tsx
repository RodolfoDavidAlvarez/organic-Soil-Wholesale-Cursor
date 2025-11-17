import { useMemo } from "react";
import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import SEO from "@/components/layout/SEO";
import { OptimizedImage } from "@/components/OptimizedImage";
import { generateProductSlug } from "@/utils/generateSlug";
import { ArrowLeft, Package, Leaf, ShoppingBag, Truck, Sparkles } from "lucide-react";

type ApiProduct = {
  id: number;
  name: string;
  displayTitle?: string | null;
  display_title?: string | null;
  productType?: string | null;
  product_type?: string | null;
  category?: string | null;
  description?: string | null;
  marketingTitle?: string | null;
  marketing_title?: string | null;
  marketingNote?: string | null;
  marketing_note?: string | null;
  story?: string | null;
  usage?: string | null;
  features?: string | null;
  targetAudience?: string | null;
  target_audience?: string | null;
  recommendedUses?: string | null;
  recommended_uses?: string | null;
  ingredients?: string | null;
  price?: number | string | null;
  imageUrl?: string | null;
  image_url?: string | null;
  texturePhotoUrl?: string | null;
  texture_photo_url?: string | null;
  additionalImages?: string[] | null;
  additional_images?: string[] | null;
  sizePriceOptions?: unknown;
  size_price_options?: unknown;
  availableSizeOptions?: string[] | null;
  available_size_options?: string[] | null;
  payAndPickup?: {
    isEnabled?: boolean;
    badge?: string | null;
    description?: string | null;
    heroImage?: string | null;
  };
  slug?: string | null;
};

type SizeOption = {
  key: string;
  label: string;
  price?: number;
};

type NormalizedProduct = {
  id: number;
  slug: string;
  name: string;
  displayTitle: string;
  category: string;
  productType?: string;
  description: string;
  marketingTitle?: string;
  marketingNote?: string;
  story?: string;
  usage?: string;
  features?: string;
  targetAudience?: string;
  recommendedUses?: string;
  ingredients?: string;
  price?: number;
  imageUrl?: string;
  texturePhotoUrl?: string;
  additionalImages: string[];
  sizeOptions: SizeOption[];
  availableSizes: string[];
  payAndPickup?: {
    isEnabled: boolean;
    badge?: string;
    description?: string;
    heroImage?: string;
  };
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const parseSizeOptions = (input: unknown): SizeOption[] => {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((option: any) => {
      if (!option) return null;
      const label = (option.label ?? option.name ?? option.title ?? "").toString().trim();
      if (!label) return null;
      const price =
        typeof option.price === "number"
          ? option.price
          : typeof option.priceCents === "number"
            ? option.priceCents / 100
            : typeof option.price_cents === "number"
              ? option.price_cents / 100
              : undefined;
      return {
        key: option.key ?? slugify(label),
        label,
        price,
      };
    })
    .filter((option): option is SizeOption => Boolean(option));
};

const normalizeProduct = (record: ApiProduct): NormalizedProduct => {
  const additionalImages = Array.isArray(record.additionalImages)
    ? record.additionalImages
    : Array.isArray(record.additional_images)
      ? record.additional_images
      : [];

  const sizeOptions =
    parseSizeOptions(record.sizePriceOptions ?? record.size_price_options) ?? [];
  const availableSizes =
    record.availableSizeOptions ??
    record.available_size_options ??
    [];

  const payAndPickup = record.payAndPickup
    ? {
        isEnabled: Boolean(record.payAndPickup?.isEnabled),
        badge: record.payAndPickup?.badge ?? undefined,
        description: record.payAndPickup?.description ?? undefined,
        heroImage: record.payAndPickup?.heroImage ?? undefined,
      }
    : undefined;

  return {
    id: record.id,
    slug:
      record.slug ??
      generateProductSlug(record.product_type || record.productType, record.name) ??
      record.id.toString(),
    name: record.name ?? "Product",
    displayTitle:
      record.displayTitle ?? record.display_title ?? record.productType ?? record.product_type ?? record.name ?? "Product",
    category: record.category ?? "Uncategorized",
    productType: record.productType ?? record.product_type ?? undefined,
    description: record.description ?? "No description provided.",
    marketingTitle: record.marketingTitle ?? record.marketing_title ?? undefined,
    marketingNote: record.marketingNote ?? record.marketing_note ?? undefined,
    story: record.story ?? undefined,
    usage: record.usage ?? undefined,
    features: record.features ?? undefined,
    targetAudience: record.targetAudience ?? record.target_audience ?? undefined,
    recommendedUses: record.recommendedUses ?? record.recommended_uses ?? undefined,
    ingredients: record.ingredients ?? undefined,
    price:
      typeof record.price === "number"
        ? record.price
        : typeof record.price === "string"
          ? Number(record.price)
          : undefined,
    imageUrl: record.imageUrl ?? record.image_url ?? undefined,
    texturePhotoUrl: record.texturePhotoUrl ?? record.texture_photo_url ?? undefined,
    additionalImages,
    sizeOptions,
    availableSizes,
    payAndPickup,
  };
};

const fetchProduct = async (identifier: string): Promise<NormalizedProduct> => {
  const response = await fetch(`/api/public/products/${identifier}`);
  if (!response.ok) {
    throw new Error("Product not found");
  }
  const body = await response.json();
  return normalizeProduct(body);
};

const parseList = (value?: string, delimiterPattern = /[|,]/) =>
  value
    ? value
        .split(delimiterPattern)
        .map((entry) => entry.trim())
        .filter(Boolean)
    : [];

const formatCurrency = (value?: number) =>
  typeof value === "number"
    ? value.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 })
    : undefined;

const DEFAULT_IMAGE = "/potting-soil.jpg";

const ProductDetail = () => {
  const [, params] = useRoute<{ slug: string }>("/products/:slug");
  const slug = params?.slug ?? "";

  const {
    data: product,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["publicProduct", slug],
    queryFn: () => fetchProduct(slug),
    enabled: Boolean(slug),
  });

  const galleryImages = useMemo(() => {
    if (!product) {
      return [];
    }
    const collection = [
      product.texturePhotoUrl,
      product.imageUrl,
      product.payAndPickup?.heroImage,
      ...product.additionalImages,
    ].filter(Boolean) as string[];
    return Array.from(new Set(collection));
  }, [product]);

  const heroImage = galleryImages[0] ?? DEFAULT_IMAGE;

  const featureList = useMemo(() => parseList(product?.features, /\|/), [product]);
  const recommendedUses = useMemo(() => parseList(product?.recommendedUses), [product]);
  const targetAudiences = useMemo(() => parseList(product?.targetAudience), [product]);
  const ingredients = useMemo(() => parseList(product?.ingredients), [product]);

  const sizesToDisplay = useMemo(() => {
    if (product?.sizeOptions?.length) {
      return product.sizeOptions;
    }
    return (product?.availableSizes ?? []).map((label) => ({
      key: slugify(label),
      label,
    }));
  }, [product]);

  const priceLabel = formatCurrency(product?.price);

  return (
    <>
      <SEO
        title={product ? `${product.displayTitle} — Soil Seed & Water` : "Product Detail"}
        description={product?.description ?? "Detailed information about this Soil Seed & Water product."}
        canonical={`https://organicsoilwholesale.com/products/${product?.slug ?? slug}`}
        keywords={`${product?.category ?? ""}, ${product?.productType ?? ""}, Soil Seed and Water`}
      />

      <section className="bg-gradient-to-br from-muted/20 via-white to-white py-6 sm:py-10">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <Button variant="ghost" className="text-muted-foreground" asChild>
              <Link href="/products">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Products
              </Link>
            </Button>
          </div>

          {isLoading && (
            <div className="grid gap-6 lg:grid-cols-2">
              <Skeleton className="h-[420px] rounded-3xl" />
              <Skeleton className="h-[420px] rounded-3xl" />
            </div>
          )}

          {!isLoading && error && (
            <Card className="rounded-3xl border-destructive/30 bg-destructive/5 p-8 text-center">
              <h2 className="text-2xl font-semibold text-destructive">Product not available</h2>
              <p className="mt-2 text-muted-foreground">
                We couldn&apos;t find that product in the catalog. It may have been archived or renamed in
                the admin dashboard.
              </p>
              <div className="mt-6">
                <Button asChild>
                  <Link href="/products">Return to catalog</Link>
                </Button>
              </div>
            </Card>
          )}

          {!isLoading && product && (
            <div className="space-y-12">
              <div className="grid gap-10 lg:grid-cols-2">
                <div className="space-y-4">
                  <div className="relative overflow-hidden rounded-3xl border bg-white shadow-xl">
                    <OptimizedImage
                      src={heroImage}
                      alt={product.displayTitle}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute left-6 top-6 flex flex-wrap gap-2">
                      <Badge variant="secondary">{product.category}</Badge>
                      {product.payAndPickup?.isEnabled && (
                        <Badge className="bg-primary text-white">
                          {product.payAndPickup?.badge ?? "Pay & Pickup Ready"}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {galleryImages.length > 1 && (
                    <div className="grid grid-cols-4 gap-3">
                      {galleryImages.slice(0, 4).map((image, index) => (
                        <div key={image} className="overflow-hidden rounded-2xl border bg-white">
                          <OptimizedImage src={image} alt={`${product.displayTitle} ${index + 1}`} className="h-24 w-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Product Overview</p>
                    <h1 className="text-3xl font-heading font-bold tracking-tight text-foreground sm:text-4xl">
                      {product.displayTitle}
                    </h1>
                    {product.marketingTitle && (
                      <p className="text-lg text-muted-foreground">{product.marketingTitle}</p>
                    )}
                  </div>
                  <p className="text-base leading-relaxed text-muted-foreground">{product.description}</p>
                  {product.marketingNote && (
                    <div className="rounded-2xl bg-muted/40 p-4 text-sm text-muted-foreground">
                      {product.marketingNote}
                    </div>
                  )}
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Card className="rounded-2xl border bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Price</p>
                      <p className="mt-2 text-xl font-semibold">{priceLabel ?? "Contact for pricing"}</p>
                      <p className="text-xs text-muted-foreground">Pricing synced from admin</p>
                    </Card>
                    <Card className="rounded-2xl border bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Category</p>
                      <p className="mt-2 text-xl font-semibold">{product.category}</p>
                      <p className="text-xs text-muted-foreground">Used for catalog filtering</p>
                    </Card>
                    <Card className="rounded-2xl border bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Audiences</p>
                      <p className="mt-2 text-xl font-semibold">
                        {targetAudiences.length ? targetAudiences.length : "Flexible"}
                      </p>
                      <p className="text-xs text-muted-foreground">Directly from product metadata</p>
                    </Card>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button size="lg" className="bg-primary text-white hover:bg-primary/90" asChild>
                      <Link href="/order">
                        <ShoppingBag className="mr-2 h-4 w-4" />
                        Start Order
                      </Link>
                    </Button>
                    {product.payAndPickup?.isEnabled && (
                      <Button variant="secondary" size="lg" asChild>
                        <Link href="/pay-and-pickup">
                          <Truck className="mr-2 h-4 w-4" />
                          Pay &amp; Pickup Menu
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="rounded-3xl border bg-white p-6">
                  <div className="flex items-center gap-3">
                    <Leaf className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Benefits</p>
                      <h2 className="text-xl font-semibold">Features &amp; Soil Impact</h2>
                    </div>
                  </div>
                  <ul className="mt-4 space-y-3">
                    {featureList.length > 0 ? (
                      featureList.map((feature) => (
                        <li key={feature} className="flex items-start gap-3 text-sm text-muted-foreground">
                          <span className="mt-1 h-2 w-2 rounded-full bg-primary/70" />
                          {feature}
                        </li>
                      ))
                    ) : (
                      <li className="text-sm text-muted-foreground">
                        Update the &quot;features&quot; field in the admin detail page to populate this list.
                      </li>
                    )}
                  </ul>
                </Card>

                <Card className="rounded-3xl border bg-white p-6">
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Sizing</p>
                      <h2 className="text-xl font-semibold">Sizes &amp; Pricing Options</h2>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {sizesToDisplay.length === 0 && (
                      <div className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">
                        Activate a size or add pricing in the admin editor to show options here.
                      </div>
                    )}
                    {sizesToDisplay.map((option) => (
                      <div key={option.key} className="rounded-2xl border bg-muted/30 p-4">
                        <p className="text-sm font-semibold text-foreground">{option.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {option.price ? formatCurrency(option.price) : "Custom pricing"}
                        </p>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="rounded-3xl border bg-white p-6">
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Application</p>
                  <h2 className="mt-1 text-xl font-semibold">Usage Guidance</h2>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {product.usage ??
                      "Add usage instructions in the admin editor to provide application guidance here."}
                  </p>
                  {recommendedUses.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {recommendedUses.map((item) => (
                        <span key={item} className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                          {item}
                        </span>
                      ))}
                    </div>
                  )}
                </Card>

                <Card className="rounded-3xl border bg-white p-6">
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Story</p>
                  <h2 className="mt-1 text-xl font-semibold">Product Narrative</h2>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {product.story ??
                      "Share the origin story or agronomic insight within the admin editor to highlight it here."}
                  </p>
                </Card>
              </div>

              <Card className="rounded-3xl border bg-white p-6">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Ingredients &amp; Audiences</p>
                <h2 className="mt-1 text-xl font-semibold">What’s inside &amp; who it’s for</h2>
                <div className="mt-6 grid gap-6 md:grid-cols-3">
                  <div>
                    <p className="text-sm font-semibold">Ingredients</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {ingredients.length > 0 ? (
                        ingredients.map((item) => (
                          <span key={item} className="rounded-full border px-3 py-1 text-xs">
                            {item}
                          </span>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Add ingredient text in the admin panel to show it here.
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Best for</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {targetAudiences.length > 0 ? (
                        targetAudiences.map((item) => (
                          <span key={item} className="rounded-full border px-3 py-1 text-xs">
                            {item}
                          </span>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Fill in the “target audience” field in admin to populate this list.
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Pay &amp; Pickup</p>
                    {product.payAndPickup?.isEnabled ? (
                      <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                        <p>{product.payAndPickup.description ?? "Available for quick pickup scheduling."}</p>
                        <Button variant="outline" size="sm" asChild>
                          <Link href="/pay-and-pickup">View menu</Link>
                        </Button>
                      </div>
                    ) : (
                      <p className="mt-3 text-xs text-muted-foreground">
                        Enable Pay &amp; Pickup in the admin editor to showcase pickup-specific messaging.
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default ProductDetail;
