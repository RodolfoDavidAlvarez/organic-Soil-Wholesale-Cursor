import { useMemo, useState, useCallback, type KeyboardEvent } from "react";
import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import SEO from "@/components/layout/SEO";
import { OptimizedImage } from "@/components/OptimizedImage";
import { generateProductSlug } from "@/utils/generateSlug";
import { extractYouTubeVideoId, YouTubePlayer } from "@/components/YouTubePlayer";
import { ArrowLeft, Package, Leaf, ShoppingBag, Truck, Sparkles, Maximize2, ChevronLeft, ChevronRight, Youtube, ImagePlus, Play } from "lucide-react";

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
  videoUrls?: string[] | null;
  video_urls?: string[] | null;
  productVideoUrl?: string | null;
  product_video_url?: string | null;
  sizePriceOptions?: unknown;
  size_price_options?: unknown;
  availableSizeOptions?: string[] | null;
  available_size_options?: string[] | null;
  seoKeywords?: string | null;
  seo_keywords?: string | null;
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
  displayOrder?: number;
  description?: string;
};

type NormalizedProduct = {
  id: number;
  slug: string;
  name: string;
  displayTitle: string;
  category: string;
  productType?: string;
  description: string;
  previewCopy?: string;
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
  videoUrls: string[];
  sizeOptions: SizeOption[];
  availableSizes: string[];
  seoKeywords?: string;
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
    .map((option: any): SizeOption | null => {
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
      const displayOrder =
        typeof option.display_order === "number" ? option.display_order : typeof option.displayOrder === "number" ? option.displayOrder : undefined;
      const description = typeof option.description === "string" && option.description.trim().length > 0 ? option.description.trim() : undefined;
      return {
        key: option.key ?? slugify(label),
        label,
        ...(price !== undefined && { price }),
        ...(displayOrder !== undefined && { displayOrder }),
        ...(description !== undefined && { description }),
      };
    })
    .filter((option): option is SizeOption => option !== null)
    .sort((a, b) => (a.displayOrder ?? Number.MAX_SAFE_INTEGER) - (b.displayOrder ?? Number.MAX_SAFE_INTEGER));
};

const normalizeProduct = (record: ApiProduct): NormalizedProduct => {
  const additionalImages = Array.isArray(record.additionalImages)
    ? record.additionalImages
    : Array.isArray(record.additional_images)
      ? record.additional_images
      : [];

  const videoUrls = (() => {
    // Support both array and single video URL
    if (Array.isArray(record.videoUrls)) {
      return record.videoUrls.filter((url): url is string => typeof url === "string" && url.trim().length > 0);
    }
    if (Array.isArray(record.video_urls)) {
      return record.video_urls.filter((url): url is string => typeof url === "string" && url.trim().length > 0);
    }
    // Legacy support for single video
    const singleVideo = record.productVideoUrl ?? record.product_video_url;
    if (typeof singleVideo === "string" && singleVideo.trim().length > 0) {
      return [singleVideo.trim()];
    }
    return [];
  })();

  const sizeOptions = parseSizeOptions(record.sizePriceOptions ?? record.size_price_options) ?? [];
  const availableSizes = record.availableSizeOptions ?? record.available_size_options ?? [];

  const marketingTitle = record.marketingTitle ?? record.marketing_title ?? undefined;
  const marketingNote = record.marketingNote ?? record.marketing_note ?? undefined;
  const previewCopy = marketingNote?.trim().length ? marketingNote.trim() : record.description?.trim();

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
    slug: record.slug ?? generateProductSlug(record.product_type || record.productType, record.name) ?? record.id.toString(),
    name: record.name ?? "Product",
    displayTitle: record.displayTitle ?? record.display_title ?? record.productType ?? record.product_type ?? record.name ?? "Product",
    category: record.category ?? "Uncategorized",
    productType: record.productType ?? record.product_type ?? undefined,
    description: record.description ?? "No description provided.",
    previewCopy: previewCopy ?? undefined,
    marketingTitle,
    marketingNote,
    story: record.story ?? undefined,
    usage: record.usage ?? undefined,
    features: record.features ?? undefined,
    targetAudience: record.targetAudience ?? record.target_audience ?? undefined,
    recommendedUses: record.recommendedUses ?? record.recommended_uses ?? undefined,
    ingredients: record.ingredients ?? undefined,
    price: typeof record.price === "number" ? record.price : typeof record.price === "string" ? Number(record.price) : undefined,
    imageUrl: record.imageUrl ?? record.image_url ?? undefined,
    texturePhotoUrl: record.texturePhotoUrl ?? record.texture_photo_url ?? undefined,
    additionalImages,
    videoUrls,
    sizeOptions,
    availableSizes,
    seoKeywords: record.seoKeywords ?? record.seo_keywords ?? undefined,
    payAndPickup,
  };
};

// Fetch product by slug (restored for new system)
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
  typeof value === "number" ? value.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }) : undefined;

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

  // Create unified gallery with images and videos
  type GalleryItem = { type: "image"; url: string } | { type: "video"; url: string; videoId: string };

  const galleryItems = useMemo((): GalleryItem[] => {
    if (!product) {
      return [];
    }
    const items: GalleryItem[] = [];

    // Add images
    const images = [product.imageUrl, ...product.additionalImages].filter(Boolean) as string[];
    images.forEach((url) => {
      if (url && !items.some((item) => item.type === "image" && item.url === url)) {
        items.push({ type: "image", url });
      }
    });

    // Add videos
    product.videoUrls.forEach((videoUrl) => {
      const videoId = extractYouTubeVideoId(videoUrl);
      if (videoId) {
        items.push({ type: "video", url: videoUrl, videoId });
      }
    });

    return items;
  }, [product]);

  const hasImages = galleryItems.some((item) => item.type === "image");
  const heroImage = hasImages ? (galleryItems.find((item) => item.type === "image")?.url ?? DEFAULT_IMAGE) : null;
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
  const totalGalleryItems = galleryItems.length;
  const activeGalleryItem = galleryItems[activeGalleryIndex];
  const showGalleryControls = totalGalleryItems > 1;

  const openGalleryAt = useCallback(
    (index: number) => {
      if (!totalGalleryItems) return;
      const normalizedIndex = ((index % totalGalleryItems) + totalGalleryItems) % totalGalleryItems;
      // Set index first, then open with a tiny delay for smoother animation
      setActiveGalleryIndex(normalizedIndex);
      // Use requestAnimationFrame for smooth transition
      requestAnimationFrame(() => {
        setIsGalleryOpen(true);
      });
    },
    [totalGalleryItems]
  );

  const goToPreviousItem = useCallback(() => {
    if (!totalGalleryItems) return;
    setActiveGalleryIndex((prev) => (prev - 1 + totalGalleryItems) % totalGalleryItems);
  }, [totalGalleryItems]);

  const goToNextItem = useCallback(() => {
    if (!totalGalleryItems) return;
    setActiveGalleryIndex((prev) => (prev + 1) % totalGalleryItems);
  }, [totalGalleryItems]);
  const primaryDescription = product?.description?.trim().length
    ? product.description
    : product?.previewCopy?.trim().length
      ? product.previewCopy
      : "Detailed information about this Soil Seed & Water product.";
  const fallbackKeywords =
    [product?.category, product?.productType, "Soil Seed and Water"].filter((value): value is string => Boolean(value && value.trim())).join(", ") ||
    "Soil Seed and Water";
  const keywordList = product?.seoKeywords?.trim().length ? product.seoKeywords : fallbackKeywords;

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
      price: undefined,
    }));
  }, [product]);

  // Get price from first active size option, or fall back to product.price
  const priceLabel = useMemo(() => {
    if (product?.sizeOptions && product.sizeOptions.length > 0) {
      const firstPricedOption = product.sizeOptions.find((opt) => opt.price && opt.price > 0);
      if (firstPricedOption?.price) {
        return formatCurrency(firstPricedOption.price);
      }
    }
    return formatCurrency(product?.price);
  }, [product?.price, product?.sizeOptions]);

  return (
    <>
      <SEO
        title={product ? `${product.displayTitle} — Soil Seed & Water` : "Product Detail"}
        description={primaryDescription}
        canonical={`https://organicsoilwholesale.com/products/${product?.slug ?? slug}`}
        keywords={keywordList}
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
                We couldn&apos;t find that product in the catalog. It may have been archived or renamed in the admin dashboard.
              </p>
              <div className="mt-6">
                <Button asChild>
                  <Link href="/products">Return to catalog</Link>
                </Button>
              </div>
            </Card>
          )}

          {!isLoading && product && (
            <div className="grid gap-10 xl:grid-cols-[minmax(0,3fr)_minmax(320px,2fr)]">
              <div className="space-y-8">
                <div className="space-y-4">
                  {heroImage ? (
                    <>
                      <div
                        className="group relative overflow-hidden rounded-3xl border bg-white shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                        role={totalGalleryItems > 0 ? "button" : undefined}
                        tabIndex={totalGalleryItems > 0 ? 0 : -1}
                        onClick={() => totalGalleryItems > 0 && openGalleryAt(0)}
                        onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
                          if (!totalGalleryItems) return;
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            openGalleryAt(0);
                          }
                        }}
                      >
                        <OptimizedImage
                          src={heroImage}
                          alt={product.displayTitle}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                        />
                        <div className="absolute left-6 top-6 flex flex-wrap gap-2">
                          <Badge
                            variant="secondary"
                            className="bg-gray-900/90 backdrop-blur-sm text-white font-semibold px-3 py-1.5 shadow-lg border border-gray-700/50"
                          >
                            {product.category}
                          </Badge>
                          {product.payAndPickup?.isEnabled && (
                            <Badge className="bg-primary text-white shadow-2xl text-base font-bold px-5 py-2.5 border-2 border-white/60 ring-2 ring-primary/50">
                              <Truck className="mr-2 h-5 w-5 inline-block" />
                              {product.payAndPickup?.badge ?? "Pay & Pickup Ready"}
                            </Badge>
                          )}
                        </div>
                        {totalGalleryItems > 0 && (
                          <div className="pointer-events-none absolute bottom-4 right-4 flex items-center gap-2 rounded-full bg-black/80 px-3 py-1.5 text-xs font-medium text-white shadow-lg">
                            <Maximize2 className="h-3.5 w-3.5" />
                            <span>Open gallery</span>
                          </div>
                        )}
                      </div>

                      {galleryItems.length > 1 && (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                          {galleryItems.slice(0, 4).map((item, index) => {
                            if (item.type === "image") {
                              return (
                                <button
                                  key={item.url}
                                  type="button"
                                  className="overflow-hidden rounded-2xl border bg-white ring-offset-background transition hover:ring-2 hover:ring-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                                  onClick={() => openGalleryAt(index)}
                                  aria-label={`View image ${index + 1}`}
                                >
                                  <OptimizedImage src={item.url} alt={`${product.displayTitle} ${index + 1}`} className="h-24 w-full object-cover" />
                                </button>
                              );
                            } else {
                              const thumbnailUrl = `https://img.youtube.com/vi/${item.videoId}/maxresdefault.jpg`;
                              return (
                                <button
                                  key={item.url}
                                  type="button"
                                  className="group relative overflow-hidden rounded-2xl border bg-white ring-offset-background transition hover:ring-2 hover:ring-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                                  onClick={() => openGalleryAt(index)}
                                  aria-label={`View video ${index + 1}`}
                                >
                                  <img
                                    src={thumbnailUrl}
                                    alt="Video thumbnail"
                                    className="h-24 w-full object-cover"
                                    onError={(e) => {
                                      // Fallback to hqdefault if maxresdefault fails
                                      (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${item.videoId}/hqdefault.jpg`;
                                    }}
                                  />
                                  {/* Play button in bottom-right corner */}
                                  <div className="absolute bottom-2 right-2 rounded-full bg-red-600 p-2 shadow-lg transition-transform group-hover:scale-110">
                                    <Play className="h-4 w-4 text-white fill-white" />
                                  </div>
                                  {/* YouTube badge in top-left */}
                                  <div className="absolute top-2 left-2 rounded bg-black/70 px-2 py-1 text-xs font-semibold text-white flex items-center gap-1">
                                    <Youtube className="h-3 w-3" />
                                    <span>Video</span>
                                  </div>
                                </button>
                              );
                            }
                          })}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex h-96 items-center justify-center rounded-3xl border-2 border-dashed border-border/50 bg-muted/20">
                      <div className="text-center">
                        <ImagePlus className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-lg font-medium text-muted-foreground">No media available</p>
                        <p className="text-sm text-muted-foreground mt-2">Images and videos will appear here once added</p>
                      </div>
                    </div>
                  )}
                </div>

                <Card className="rounded-3xl border bg-white p-6 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Product Overview</p>
                      <h1 className="mt-2 text-3xl font-heading font-bold tracking-tight text-foreground sm:text-4xl">{product.displayTitle}</h1>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Package className="h-4 w-4" />
                      <span>{product.slug}</span>
                    </div>
                  </div>
                  <p className="mt-4 text-base leading-relaxed text-muted-foreground">{primaryDescription}</p>
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border bg-muted/30 p-4">
                      <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Price</p>
                      <p className="mt-2 text-xl font-semibold">{priceLabel ?? "Contact for pricing"}</p>
                    </div>
                    <div className="rounded-2xl border bg-muted/30 p-4">
                      <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Category</p>
                      <p className="mt-2 text-xl font-semibold">{product.category}</p>
                    </div>
                  </div>
                </Card>

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
                        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Application</p>
                        <h2 className="text-xl font-semibold">Usage Guidance</h2>
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                      {product.usage ?? "Add usage instructions in the admin editor to provide application guidance here."}
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
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <Card className="rounded-3xl border bg-white p-6">
                    <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Story</p>
                    <h2 className="mt-1 text-xl font-semibold">Product Narrative</h2>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {product.story ?? "Share the origin story or agronomic insight within the admin editor to highlight it here."}
                    </p>
                  </Card>

                  <Card className="rounded-3xl border bg-white p-6">
                    <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Ingredients &amp; Audiences</p>
                    <h2 className="mt-1 text-xl font-semibold">What’s inside &amp; who it’s for</h2>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
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
                            <p className="text-xs text-muted-foreground">Add ingredient text in the admin panel to show it here.</p>
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
                            <p className="text-xs text-muted-foreground">Fill in the “target audience” field in admin to populate this list.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>

              <aside className="space-y-6">
                <div className="sticky top-6 space-y-3">
                  <Button size="lg" className="w-full bg-primary text-white hover:bg-primary/90" asChild>
                    <Link href="/order">
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      Request a Quote
                    </Link>
                  </Button>
                  {product.payAndPickup?.isEnabled && (
                    <Button size="lg" variant="secondary" className="w-full border-2" asChild>
                      <Link href={`/pay-and-pickup${product.id ? `?product=${product.id}` : ""}`}>
                        <Truck className="mr-2 h-4 w-4" />
                        Pay &amp; Pickup
                      </Link>
                    </Button>
                  )}
                </div>

                <Card className="rounded-3xl border bg-white p-6">
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-3">Available sizes</p>
                  <div className="space-y-2">
                    {sizesToDisplay.length === 0 && (
                      <div className="rounded-xl border border-dashed p-3 text-xs text-muted-foreground">
                        Activate a size or add pricing in the admin editor to show options here.
                      </div>
                    )}
                    {sizesToDisplay.map((option) => (
                      <div key={option.key} className="rounded-lg border bg-muted/10 px-3 py-2 text-sm hover:bg-muted/20 transition-colors">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-foreground">{option.label}</span>
                          {option.price ? <span className="text-sm font-semibold text-foreground">{formatCurrency(option.price)}</span> : null}
                        </div>
                        {option.description && <p className="text-xs text-muted-foreground mt-1">{option.description}</p>}
                      </div>
                    ))}
                  </div>
                </Card>
              </aside>
            </div>
          )}
        </div>
      </section>
      <Dialog open={isGalleryOpen} onOpenChange={setIsGalleryOpen}>
        <DialogContent className="sm:max-w-5xl border-none bg-black/90 text-white duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-100 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          <DialogHeader className="sr-only">
            <DialogTitle>{product?.displayTitle ?? "Product gallery"}</DialogTitle>
            <DialogDescription>Expanded view of the product imagery.</DialogDescription>
          </DialogHeader>
          {totalGalleryItems > 0 ? (
            <div className="space-y-4 animate-in fade-in-0 duration-300">
              <div className="relative overflow-hidden rounded-2xl bg-black">
                <div key={activeGalleryIndex} className="animate-in fade-in-0 zoom-in-95 duration-500">
                  {activeGalleryItem?.type === "video" ? (
                    <YouTubePlayer
                      videoId={activeGalleryItem.videoId}
                      title={product?.displayTitle ?? "Product video"}
                      className="w-full"
                      autoPlay={true}
                      muted={false}
                    />
                  ) : activeGalleryItem?.type === "image" ? (
                    <OptimizedImage
                      src={activeGalleryItem.url}
                      alt={product?.displayTitle ?? "Product image"}
                      className="mx-auto max-h-[70vh] w-full object-contain"
                    />
                  ) : null}
                </div>
                {showGalleryControls && (
                  <>
                    <button
                      type="button"
                      className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-3 text-white transition-all duration-200 hover:bg-white/40 hover:scale-110 backdrop-blur-sm"
                      onClick={goToPreviousItem}
                      aria-label="Previous item"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-3 text-white transition-all duration-200 hover:bg-white/40 hover:scale-110 backdrop-blur-sm"
                      onClick={goToNextItem}
                      aria-label="Next item"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}
              </div>
              {showGalleryControls && (
                <div className="flex gap-2 overflow-x-auto animate-in fade-in-0 slide-in-from-bottom-2 duration-500 delay-150">
                  {galleryItems.map((item, index) => {
                    const isActive = index === activeGalleryIndex;
                    if (item.type === "image") {
                      return (
                        <button
                          key={`${item.url}-${index}`}
                          type="button"
                          onClick={() => {
                            setActiveGalleryIndex(index);
                          }}
                          className={`h-16 w-20 flex-shrink-0 overflow-hidden rounded-lg border transition-all duration-200 ${isActive ? "border-white scale-105 ring-2 ring-white/50" : "border-white/30 hover:border-white/60"}`}
                          aria-label={`Show image ${index + 1}`}
                          aria-current={isActive}
                        >
                          <OptimizedImage src={item.url} alt="" className="h-full w-full object-cover transition-transform duration-200" />
                        </button>
                      );
                    } else {
                      const thumbnailUrl = `https://img.youtube.com/vi/${item.videoId}/maxresdefault.jpg`;
                      return (
                        <button
                          key={`${item.url}-${index}`}
                          type="button"
                          onClick={() => {
                            setActiveGalleryIndex(index);
                          }}
                          className={`relative h-16 w-20 flex-shrink-0 overflow-hidden rounded-lg border transition-all duration-200 ${isActive ? "border-white scale-105 ring-2 ring-white/50" : "border-white/30 hover:border-white/60"}`}
                          aria-label={`Show video ${index + 1}`}
                          aria-current={isActive}
                        >
                          <img
                            src={thumbnailUrl}
                            alt="Video thumbnail"
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              // Fallback to hqdefault if maxresdefault fails
                              (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${item.videoId}/hqdefault.jpg`;
                            }}
                          />
                          {/* Play button in bottom-right corner */}
                          <div className="absolute bottom-1 right-1 rounded-full bg-red-600 p-1 shadow-lg">
                            <Play className="h-3 w-3 text-white fill-white" />
                          </div>
                        </button>
                      );
                    }
                  })}
                </div>
              )}
              <p className="text-center text-xs text-white/70 animate-in fade-in-0 slide-in-from-bottom-2 duration-500 delay-300">
                {activeGalleryIndex + 1} of {totalGalleryItems}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ImagePlus className="h-12 w-12 text-white/50 mb-4" />
              <p className="text-sm text-white/70">No media available for this product yet.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProductDetail;
