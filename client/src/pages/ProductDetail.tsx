import { useMemo, useState, useCallback, useEffect, type KeyboardEvent, type ReactNode } from "react";
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
import {
  ArrowLeft,
  Leaf,
  ShoppingBag,
  Truck,
  Sparkles,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Youtube,
  ImagePlus,
  Play,
  ShieldCheck,
  Phone,
  MapPin,
  Package,
} from "lucide-react";
import { SIZE_CATALOG_BY_KEY } from "@/data/sizeCatalog";

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
  image?: string;
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

type InfoTab = {
  id: string;
  label: string;
  content: ReactNode;
  helper?: string;
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
      const key = option.key ?? slugify(label);
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
      // Fall back to SIZE_CATALOG image if option doesn't have one
      // Check for empty strings, null, or undefined
      const optionImage = typeof option.image === "string" && option.image.trim().length > 0 ? option.image.trim() : undefined;
      const catalogEntry = SIZE_CATALOG_BY_KEY[key as keyof typeof SIZE_CATALOG_BY_KEY];
      // Prioritize uploaded image, but fall back to catalog default if missing
      const image = optionImage || catalogEntry?.image;
      return {
        key,
        label,
        ...(price !== undefined && { price }),
        ...(displayOrder !== undefined && { displayOrder }),
        ...(description !== undefined && { description }),
        ...(image !== undefined && { image }),
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

  // Size image expansion
  const [expandedSizeImage, setExpandedSizeImage] = useState<{ url: string; label: string } | null>(null);

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
  const featureSpotlights = featureList.slice(0, 3);

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

  const heroStats = useMemo(
    () =>
      product
        ? [
            {
              label: "Category",
              value: product.category ?? "Specialty soil",
              icon: Leaf,
            },
            {
              label: "Format",
              value: product.productType ?? "Custom blend",
              icon: Sparkles,
            },
            {
              label: "Sizes",
              value: sizesToDisplay.length ? `${sizesToDisplay.length} option${sizesToDisplay.length > 1 ? "s" : ""}` : "Request sizing",
              icon: Package,
            },
            {
              label: "Availability",
              value: product.payAndPickup?.isEnabled ? "Pay & Pickup ready" : "Delivery planning included",
              icon: Truck,
            },
          ]
        : [],
    [product, sizesToDisplay.length]
  );

  const confidencePoints = [
    {
      icon: ShieldCheck,
      title: "Agronomist verified",
      description: "Every batch is checked for consistency and moisture before release.",
    },
    {
      icon: MapPin,
      title: "Regional logistics",
      description: "Coordinated delivery and pickup scheduling across California & Nevada.",
    },
    {
      icon: Phone,
      title: "Live soil reps",
      description: "Talk to Soil Seed & Water specialists for blends, sizing, and lead times.",
    },
  ];

  const infoTabs = useMemo<InfoTab[]>(() => {
    if (!product) {
      return [];
    }

    return [
      {
        id: "overview",
        label: "Overview",
        content: (
          <div className="space-y-4">
            <p className="text-base leading-relaxed text-muted-foreground">{primaryDescription}</p>
            {product.marketingNote && (
              <p className="rounded-2xl border border-dashed bg-muted/40 px-4 py-3 text-sm text-muted-foreground">{product.marketingNote}</p>
            )}
          </div>
        ),
      },
      {
        id: "features",
        label: "Highlights",
        content: featureList.length ? (
          <ul className="grid gap-3 sm:grid-cols-2">
            {featureList.map((item) => (
              <li key={item} className="flex items-start gap-3 rounded-2xl border bg-muted/30 px-4 py-3 text-sm leading-relaxed">
                <Sparkles className="mt-0.5 h-4 w-4 text-primary" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Add feature bullets in the admin editor to showcase agronomic benefits here.</p>
        ),
      },
      {
        id: "usage",
        label: "Usage",
        content: (
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {product.usage ?? "Include application guidance text in the admin editor so crews know how to deploy the material."}
            </p>
            {recommendedUses.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {recommendedUses.map((item) => (
                  <span key={item} className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                    {item}
                  </span>
                ))}
              </div>
            )}
          </div>
        ),
      },
      {
        id: "story",
        label: "Story",
        content: (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {product.story ?? "Share what makes this blend unique — growers love knowing the backstory and sourcing details."}
          </p>
        ),
      },
      {
        id: "composition",
        label: "Ingredients",
        content: (
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <p className="text-sm font-semibold text-foreground">Ingredients</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {ingredients.length > 0 ? (
                  ingredients.map((item) => (
                    <span key={item} className="rounded-full border px-3 py-1 text-xs">
                      {item}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">Populate the ingredient field to display the blend details.</p>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Ideal for</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {targetAudiences.length > 0 ? (
                  targetAudiences.map((item) => (
                    <span key={item} className="rounded-full border px-3 py-1 text-xs">
                      {item}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">Fill in the “target audience” field in the CMS to tailor this list.</p>
                )}
              </div>
            </div>
          </div>
        ),
      },
    ];
  }, [featureList, ingredients, primaryDescription, product, recommendedUses, targetAudiences]);

  const [activeInfoTab, setActiveInfoTab] = useState("overview");

  useEffect(() => {
    setActiveInfoTab("overview");
  }, [product?.id]);

  const activeTabContent = infoTabs.find((tab) => tab.id === activeInfoTab) ?? infoTabs[0];

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
            <div className="space-y-10">
              <div className="grid gap-10 items-start xl:grid-cols-[minmax(0,3fr)_minmax(320px,2fr)]">
                <section className="space-y-8">
                  <div className="relative overflow-hidden rounded-[32px] border bg-gradient-to-br from-white via-primary/5 to-primary/10 shadow-2xl">
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.7),_transparent_55%)]" />
                    <div className="relative z-10 grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
                      <div className="space-y-6 p-6 sm:p-10">
                        <div className="flex flex-wrap gap-2 text-xs font-semibold tracking-wide text-gray-600">
                          <Badge variant="secondary" className="bg-white/80 text-gray-900 shadow-sm">
                            {product.category}
                          </Badge>
                          {product.productType && (
                            <Badge variant="outline" className="border-white/70 bg-white/60 text-gray-900">
                              {product.productType}
                            </Badge>
                          )}
                          {product.payAndPickup?.isEnabled && (
                            <Badge className="bg-primary text-primary-foreground font-semibold shadow-lg">
                              <Truck className="mr-2 h-4 w-4" />
                              {product.payAndPickup?.badge ?? "Pay & Pickup"}
                            </Badge>
                          )}
                        </div>
                        <div className="space-y-4">
                          <div>
                            <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Soil Seed &amp; Water</p>
                            <h1 className="mt-2 text-3xl font-semibold leading-tight text-foreground sm:text-4xl">{product.displayTitle}</h1>
                          </div>
                          <p className="text-base leading-relaxed text-muted-foreground">
                            {product.previewCopy ?? primaryDescription ?? "Sustainable soil solutions for thriving landscapes."}
                          </p>
                          {featureSpotlights.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {featureSpotlights.map((item) => (
                                <span key={item} className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-foreground shadow-sm backdrop-blur">
                                  {item}
                                </span>
                              ))}
                            </div>
                          )}
                          {recommendedUses.length > 0 && (
                            <div>
                              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Top uses</p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {recommendedUses.map((item) => (
                                  <span
                                    key={item}
                                    className="rounded-full border border-white/60 bg-white/40 px-3 py-1 text-xs text-foreground backdrop-blur"
                                  >
                                    {item}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 shadow-sm">
                            <Leaf className="h-4 w-4 text-primary" />
                            <span>{product.category}</span>
                          </div>
                          {product.productType && (
                            <div className="flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 shadow-sm">
                              <Sparkles className="h-4 w-4 text-primary" />
                              <span>{product.productType}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 shadow-sm">
                            {product.payAndPickup?.isEnabled ? <Truck className="h-4 w-4 text-primary" /> : <MapPin className="h-4 w-4 text-primary" />}
                            <span>{product.payAndPickup?.isEnabled ? "Pickup ready" : "Delivery planning included"}</span>
                          </div>
                        </div>
                      </div>
                      <div className="px-6 pb-6 sm:pb-10">
                        {heroImage ? (
                          <div
                            className="group relative overflow-hidden rounded-[28px] border bg-white shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
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
                              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                            />
                            {totalGalleryItems > 0 && (
                              <div className="pointer-events-none absolute bottom-4 right-4 flex items-center gap-2 rounded-full bg-black/80 px-3 py-1.5 text-xs font-medium text-white shadow-lg">
                                <Maximize2 className="h-3.5 w-3.5" />
                                <span>Open gallery</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex min-h-[280px] items-center justify-center rounded-[28px] border border-dashed border-muted bg-white/40 text-sm text-muted-foreground">
                            Upload a feature image or video in the admin editor to showcase this blend.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {heroStats.length > 0 && (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      {heroStats.map((stat) => {
                        const Icon = stat.icon;
                        return (
                          <div key={stat.label} className="rounded-2xl border bg-white/90 p-4 shadow-sm backdrop-blur">
                            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-muted-foreground">
                              <Icon className="h-4 w-4 text-primary" />
                              {stat.label}
                            </div>
                            <p className="mt-2 text-lg font-semibold text-foreground">{stat.value}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {galleryItems.length > 1 && (
                    <div className="rounded-3xl border bg-white/90 p-4 shadow-sm">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Media</p>
                          <h2 className="text-lg font-semibold text-foreground">Gallery preview</h2>
                        </div>
                        <Button variant="ghost" size="sm" className="text-sm font-semibold" onClick={() => openGalleryAt(activeGalleryIndex)}>
                          <Maximize2 className="mr-2 h-4 w-4" />
                          View all
                        </Button>
                      </div>
                      <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
                        {galleryItems.map((item, index) => {
                          if (item.type === "image") {
                            return (
                              <button
                                key={item.url}
                                type="button"
                                onClick={() => openGalleryAt(index)}
                                className="h-28 w-40 flex-shrink-0 overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                                aria-label={`View image ${index + 1}`}
                              >
                                <OptimizedImage src={item.url} alt={`${product.displayTitle} ${index + 1}`} className="h-full w-full object-cover" />
                              </button>
                            );
                          }
                          const thumbnailUrl = `https://img.youtube.com/vi/${item.videoId}/maxresdefault.jpg`;
                          return (
                            <button
                              key={item.url}
                              type="button"
                              onClick={() => openGalleryAt(index)}
                              className="group relative h-28 w-40 flex-shrink-0 overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                              aria-label={`View video ${index + 1}`}
                            >
                              <img
                                src={thumbnailUrl}
                                alt="Video thumbnail"
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${item.videoId}/hqdefault.jpg`;
                                }}
                              />
                              <div className="absolute inset-0 flex items-end justify-between bg-gradient-to-t from-black/70 via-transparent to-transparent p-3 text-white">
                                <div className="rounded-full bg-red-600/90 p-2 shadow-lg transition-transform group-hover:scale-110">
                                  <Play className="h-4 w-4 fill-white text-white" />
                                </div>
                                <div className="rounded-full bg-black/70 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide">Video</div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {featureList.length > 0 && (
                    <Card className="rounded-3xl border bg-white p-6 shadow-lg">
                      <div className="flex flex-wrap items-center gap-3">
                        <Sparkles className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Highlights</p>
                          <h2 className="text-xl font-semibold">Why crews love it</h2>
                        </div>
                      </div>
                      <ul className="mt-6 grid gap-3 md:grid-cols-2">
                        {featureList.map((item) => (
                          <li key={item} className="rounded-2xl border bg-muted/20 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </Card>
                  )}

                  {infoTabs.length > 0 && (
                    <Card className="rounded-3xl border bg-white p-4 shadow-lg">
                      <div className="flex flex-wrap items-center gap-3">
                        <Leaf className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Knowledge base</p>
                          <h2 className="text-lg font-semibold">Details at a glance</h2>
                        </div>
                      </div>
                      <div className="hidden md:block">
                        <div className="mt-4 flex flex-wrap gap-2">
                          {infoTabs.map((tab) => (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() => setActiveInfoTab(tab.id)}
                              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                                activeInfoTab === tab.id ? "bg-primary text-primary-foreground shadow" : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {tab.label}
                            </button>
                          ))}
                        </div>
                        {activeTabContent && <div className="mt-6 text-sm text-muted-foreground">{activeTabContent.content}</div>}
                      </div>
                      <div className="mt-4 space-y-3 md:hidden">
                        {infoTabs.map((tab, index) => (
                          <details key={tab.id} className="rounded-2xl border bg-muted/30 p-4" open={index === 0}>
                            <summary className="cursor-pointer text-sm font-semibold text-foreground">{tab.label}</summary>
                            <div className="mt-3 text-sm text-muted-foreground">{tab.content}</div>
                          </details>
                        ))}
                      </div>
                    </Card>
                  )}

                  <div className="grid gap-6 lg:grid-cols-2">
                    <Card className="rounded-3xl border bg-white p-6 shadow-lg">
                      <div className="flex items-center gap-3">
                        <Sparkles className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Application</p>
                          <h2 className="text-xl font-semibold">Usage guidance</h2>
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

                    <Card className="rounded-3xl border bg-white p-6 shadow-lg">
                      <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Story</p>
                      <h2 className="mt-1 text-xl font-semibold">Product narrative</h2>
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                        {product.story ?? "Share the origin story or agronomic insight within the admin editor to highlight it here."}
                      </p>
                    </Card>
                  </div>

                  <Card className="rounded-3xl border bg-white p-6 shadow-lg">
                    <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Ingredients &amp; audiences</p>
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
                </section>

                <aside className="space-y-6">
                  <Card className="rounded-3xl border bg-gray-950 p-6 text-white shadow-2xl">
                    <p className="text-xs uppercase tracking-[0.3em] text-white/70">Order direct</p>
                    <h3 className="mt-2 text-2xl font-semibold leading-tight">Stage your soil order with Soil Seed &amp; Water</h3>
                    <p className="mt-3 text-sm text-white/80">
                      Dedicated reps coordinate blending, packaging, and logistics so you can focus on installs.
                    </p>
                    <div className="mt-6 space-y-3">
                      <Button size="lg" className="w-full text-base" asChild>
                        <Link href="/order">
                          <ShoppingBag className="mr-2 h-4 w-4" />
                          Request a Quote
                        </Link>
                      </Button>
                      {product.payAndPickup?.isEnabled && (
                        <Button
                          size="lg"
                          variant="secondary"
                          className="w-full border border-white/20 bg-white/10 text-white hover:bg-white/20"
                          asChild
                        >
                          <Link href={`/pay-and-pickup${product.id ? `?product=${product.id}` : ""}`}>
                            <Truck className="mr-2 h-4 w-4" />
                            Pay &amp; Pickup
                          </Link>
                        </Button>
                      )}
                      <Button
                        size="lg"
                        variant="outline"
                        className="w-full border-white/30 bg-transparent text-white hover:bg-white/10"
                        asChild
                      >
                        <Link href="/contact">
                          <Phone className="mr-2 h-4 w-4" />
                          Talk to an Expert
                        </Link>
                      </Button>
                    </div>
                    <div className="mt-6 flex items-center gap-3 text-xs text-white/70">
                      <Phone className="h-4 w-4" />
                      <span>Live support 7a–7p PT • Same-week scheduling available</span>
                    </div>
                  </Card>

                  <Card id="size-options" className="rounded-3xl border bg-white p-6 shadow-lg">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Available sizes</p>
                        <h3 className="text-lg font-semibold text-foreground">
                          {sizesToDisplay.length > 0 ? `${sizesToDisplay.length} size option${sizesToDisplay.length > 1 ? "s" : ""}` : "Size catalog"}
                        </h3>
                      </div>
                      {sizesToDisplay.length > 0 && <span className="text-xs text-muted-foreground">Tap to inspect imagery</span>}
                    </div>
                    <div className="mt-4 flex gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible">
                      {sizesToDisplay.length === 0 && (
                        <div className="rounded-2xl border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
                          Activate a size or add pricing in the admin editor to show options here.
                        </div>
                      )}
                      {sizesToDisplay.map((option) => {
                        const cardContent = (
                          <>
                            {option.image && (
                              <img src={option.image} alt={option.label} className="h-28 w-full rounded-xl object-cover" loading="lazy" />
                            )}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between gap-3">
                                <span className="font-semibold">{option.label}</span>
                                {option.price && <span className="text-sm font-semibold text-primary">{formatCurrency(option.price)}</span>}
                              </div>
                              {option.description && <p className="text-xs text-muted-foreground">{option.description}</p>}
                            </div>
                          </>
                        );

                        if (option.image) {
                          return (
                            <button
                              key={option.key}
                              type="button"
                              className="min-w-[220px] rounded-2xl border bg-muted/10 p-4 text-left shadow-sm transition hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                              onClick={() => setExpandedSizeImage({ url: option.image!, label: option.label })}
                              aria-label={`View larger image of ${option.label}`}
                            >
                              {cardContent}
                            </button>
                          );
                        }

                        return (
                          <div key={option.key} className="min-w-[220px] rounded-2xl border bg-muted/10 p-4 shadow-sm">
                            {cardContent}
                          </div>
                        );
                      })}
                    </div>
                  </Card>

                  <Card className="rounded-3xl border bg-white p-6 shadow-lg">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Confidence</p>
                        <h3 className="text-lg font-semibold">Why teams trust us</h3>
                      </div>
                    </div>
                    <ul className="mt-6 space-y-4">
                      {confidencePoints.map((point) => {
                        const Icon = point.icon;
                        return (
                          <li key={point.title} className="flex gap-3">
                            <div className="rounded-full bg-muted/60 p-2">
                              <Icon className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-foreground">{point.title}</p>
                              <p className="text-sm text-muted-foreground">{point.description}</p>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </Card>
                </aside>
              </div>
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

      {/* Expanded Size Image Dialog */}
      <Dialog open={expandedSizeImage !== null} onOpenChange={(open) => !open && setExpandedSizeImage(null)}>
        <DialogContent className="sm:max-w-4xl border-none bg-black/95 text-white duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-100">
          <DialogHeader className="sr-only">
            <DialogTitle>{expandedSizeImage?.label ?? "Size image"}</DialogTitle>
            <DialogDescription>Expanded view of the size category image.</DialogDescription>
          </DialogHeader>
          {expandedSizeImage && (
            <div className="space-y-4 animate-in fade-in-0 duration-300">
              <div className="relative overflow-hidden rounded-2xl bg-black">
                <OptimizedImage src={expandedSizeImage.url} alt={expandedSizeImage.label} className="w-full h-auto max-h-[80vh] object-contain" />
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold">{expandedSizeImage.label}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProductDetail;
