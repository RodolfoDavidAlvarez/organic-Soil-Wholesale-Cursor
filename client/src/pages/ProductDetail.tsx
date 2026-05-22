import { useMemo, useState, useCallback, useEffect, type KeyboardEvent } from "react";
import { useRoute, Link } from "wouter";
import { useLocation } from "wouter";
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
import { useQuoteCart } from "@/contexts/QuoteCartContext";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Leaf,
  ShoppingBag,
  ShoppingCart,
  FileText,
  Minus,
  Plus,
  Check,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Play,
  ShieldCheck,
  ImagePlus,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ApiProduct = {
  id: number;
  name: string;
  displayTitle?: string | null;
  display_title?: string | null;
  productType?: string | null;
  product_type?: string | null;
  category?: string | null;
  description?: string | null;
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
  npk?: string | null;
  certifications?: string | null;
  seoKeywords?: string | null;
  seo_keywords?: string | null;
  slug?: string | null;
};

type PriceTier = {
  size: string;
  price: number;
  msrp: number | null;
  unit: string;
  qty: number | null;
};

type SizeChoice = PriceTier & {
  kind: "single" | "pallet" | "bulk";
  displayLabel: string;
  subLabel: string;
  displayPrice: number;
};

type SizeCategory = {
  key: string;
  label: string;
  price: number;
  priceLabel: string;
  image: string;
  choices: SizeChoice[];
};

type Product = {
  id: number;
  slug: string;
  name: string;
  displayTitle: string;
  category: string;
  productType?: string;
  description: string;
  marketingNote?: string;
  usage?: string;
  targetAudience: string[];
  npk?: string;
  certifications: string[];
  imageUrl?: string;
  texturePhotoUrl?: string;
  additionalImages: string[];
  videoUrls: string[];
  priceTiers: PriceTier[];
  seoKeywords?: string;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const parseDollars = (v: unknown): number | null => {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = parseFloat(v.replace(/[^0-9.]/g, ""));
    return Number.isFinite(n) ? n : null;
  }
  return null;
};

const extractQty = (size: string): number | null => {
  const m = size.match(/\((\d+)/);
  return m ? parseInt(m[1], 10) : null;
};

const fmt = (n: number): string => {
  if (n >= 1000) return n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
  return `$${n.toFixed(2)}`;
};

const SIZE_CATEGORY_PHOTO: Record<string, string> = {
  "9lb Bag": "/images/sizes/9lb-bag-single.jpg",
  "Pallet (144 x 9lb)": "/images/sizes/9lb-pallet.jpg",
  "1CF Bag": "/images/sizes/1cf-bag-single.png",
  "Pallet (50 x 1CF)": "/images/sizes/1cf-pallet.jpg",
  "2CF Bag": "/images/sizes/2cf-bag-single.png",
  "Pallet (25 x 2CF)": "/images/sizes/2cf-pallet.jpg",
  Tote: "/images/sizes/2-2cy-tote.png",
  "Truckload (~24 tons)": "/images/sizes/truckload.png",
  "Truckload (22 pallets)": "/images/sizes/truckload.png",
  "Bulk Pickup": "/images/categories/sizes/CY of Bulk for pick only.png",
};

const productMsrpOverrides: Record<number, Record<string, { price: number; priceLabel?: string }>> = {
  1000: {
    "1CF Bag": { price: 24.9 },
    Tote: { price: 60 },
    "Truckload (~24 tons)": { price: 30, priceLabel: "$30.00/ton" },
  },
  137: {
    "1CF Bag": { price: 15.99 },
    "Truckload (22 pallets)": { price: 60, priceLabel: "$60.00/yd" },
  },
  3000: {
    "Truckload (22 pallets)": { price: 30, priceLabel: "$30.00/yd" },
  },
};

const categoryLabel = (size: string, productId?: number) => {
  if (size.includes("9lb")) return "9 lb Bag";
  if (size.includes("1CF")) return productId === 137 ? "1.5 cu ft Bag" : "40 lb Bag (1 cu ft)";
  if (size.includes("2CF")) return "2 cu ft Bag";
  if (size.includes("Tote")) return productId === 137 || productId === 3000 ? "Super Sack (2.2 cu yd)" : "Super Sack (~2,000 lb)";
  if (size.includes("Truckload") || size.includes("Bulk")) return productId === 137 || productId === 3000 ? "Truckload (~90 cu yd)" : "Truckload (~24 tons)";
  return size;
};

const priceForTier = (productId: number, tier: PriceTier) => {
  const override = productMsrpOverrides[productId]?.[tier.size];
  const price = override?.price ?? tier.msrp ?? tier.price;
  return {
    price,
    priceLabel: override?.priceLabel ?? fmt(price),
  };
};

const imageForChoice = (choice: SizeChoice, fallback: string) => {
  return SIZE_CATEGORY_PHOTO[choice.size] || fallback;
};

const parsePriceTiers = (raw: unknown): PriceTier[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((opt: any) => opt && (opt.isActive !== false && opt.is_active !== false))
    .map((opt: any): PriceTier | null => {
      const size = (opt.size || opt.label || opt.key || "").toString().trim();
      if (!size) return null;
      const price = parseDollars(opt.price) ?? (parseDollars(opt.priceCents ?? opt.price_cents) !== null ? (parseDollars(opt.priceCents ?? opt.price_cents)! / 100) : null);
      if (price === null) return null;
      const msrp = parseDollars(opt.msrp);
      const unit = (opt.unit || opt.description || "").toString().trim();
      const qty = extractQty(size);
      return { size, price, msrp, unit, qty };
    })
    .filter((t): t is PriceTier => t !== null);
};

const isBagTier = (tier: PriceTier): boolean => {
  const s = tier.size.toLowerCase();
  return s.includes("bag") && !s.includes("pallet") && !s.includes("tote") && !s.includes("truck") && !s.includes("bulk");
};

const buildSizeCategories = (product: Product): SizeCategory[] => {
  const categoryMap = new Map<string, SizeCategory>();

  product.priceTiers.forEach((tier) => {
    if (tier.size.startsWith("Pallet")) return;

    const pricing = priceForTier(product.id, tier);
    const key = categoryLabel(tier.size, product.id);
    categoryMap.set(key, {
      key,
      label: key,
      price: pricing.price,
      priceLabel: pricing.priceLabel,
      image: SIZE_CATEGORY_PHOTO[tier.size] || product.imageUrl || product.texturePhotoUrl || "",
      choices: [
        {
          ...tier,
          kind: tier.size.includes("Truckload") || tier.size.includes("Bulk") ? "bulk" : "single",
          displayLabel: key.includes("Truckload") ? "Truckload" : key.includes("Super Sack") ? "Super Sack" : "Single bag",
          subLabel: key.includes("Truckload")
            ? tier.size.includes("24") ? "24 tons" : "90 cubic yards"
            : key.includes("Super Sack")
              ? product.id === 137 || product.id === 3000 ? "2.2 cubic yards" : "about 2,000 lb"
              : "one bag",
          displayPrice: pricing.price,
        },
      ],
    });
  });

  product.priceTiers.forEach((tier) => {
    if (!tier.size.startsWith("Pallet")) return;

    const baseKey = tier.size.includes("9lb")
      ? "9 lb Bag"
      : tier.size.includes("1CF")
        ? categoryLabel("1CF Bag", product.id)
        : tier.size.includes("2CF")
          ? categoryLabel("2CF Bag", product.id)
          : categoryLabel(tier.size, product.id);
    const category = categoryMap.get(baseKey);
    if (!category) return;

    const unitPrice = category.choices.find((choice) => choice.kind === "single")?.displayPrice;
    const price = tier.qty && unitPrice ? tier.qty * unitPrice : priceForTier(product.id, tier).price;

    category.choices.unshift({
      ...tier,
      kind: "pallet",
      displayLabel: "Pallet",
      subLabel: tier.qty ? `Pallet of ${tier.qty}` : "Pallet",
      displayPrice: price,
    });
  });

  return Array.from(categoryMap.values());
};

const parseList = (value?: string | null, delimiter = /[|,]/): string[] =>
  value ? value.split(delimiter).map((s) => s.trim()).filter(Boolean) : [];

const normalizeProduct = (record: ApiProduct): Product => {
  const additionalImages = (Array.isArray(record.additionalImages) ? record.additionalImages : Array.isArray(record.additional_images) ? record.additional_images : []) as string[];

  const videoUrls = (() => {
    if (Array.isArray(record.videoUrls)) return record.videoUrls.filter((u): u is string => typeof u === "string" && u.trim().length > 0);
    if (Array.isArray(record.video_urls)) return record.video_urls.filter((u): u is string => typeof u === "string" && u.trim().length > 0);
    const single = record.productVideoUrl ?? record.product_video_url;
    return typeof single === "string" && single.trim().length > 0 ? [single.trim()] : [];
  })();

  const priceTiers = parsePriceTiers(record.sizePriceOptions ?? record.size_price_options);

  return {
    id: record.id,
    slug: record.slug ?? generateProductSlug(record.product_type || record.productType, record.name) ?? record.id.toString(),
    name: record.name ?? "Product",
    displayTitle: record.displayTitle ?? record.display_title ?? record.name ?? "Product",
    category: record.category ?? "Soil amendment",
    productType: record.productType ?? record.product_type ?? undefined,
    description: record.description ?? "",
    marketingNote: record.marketingNote ?? record.marketing_note ?? undefined,
    usage: record.usage ?? undefined,
    targetAudience: parseList(record.targetAudience ?? record.target_audience),
    npk: record.npk ?? undefined,
    certifications: parseList(record.certifications),
    imageUrl: record.imageUrl ?? record.image_url ?? undefined,
    texturePhotoUrl: record.texturePhotoUrl ?? record.texture_photo_url ?? undefined,
    additionalImages,
    videoUrls,
    priceTiers,
    seoKeywords: record.seoKeywords ?? record.seo_keywords ?? undefined,
  };
};

const fetchProduct = async (identifier: string): Promise<Product> => {
  const response = await fetch(`/api/public/products/${identifier}`);
  if (!response.ok) throw new Error("Product not found");
  return normalizeProduct(await response.json());
};

const PAY_PICKUP_PRODUCT_IDS = new Set([1000, 1001, 137, 3000]);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ProductDetail = () => {
  const [, params] = useRoute<{ slug: string }>("/products/:slug");
  const [, navigate] = useLocation();
  const { addItem, openDrawer } = useQuoteCart();
  const { toast } = useToast();
  const slug = params?.slug ?? "";

  const { data: product, isLoading, error } = useQuery({
    queryKey: ["publicProduct", slug],
    queryFn: () => fetchProduct(slug),
    enabled: Boolean(slug),
  });

  // --- Gallery ---
  type GalleryItem = { type: "image"; url: string } | { type: "video"; url: string; videoId: string };

  const galleryItems = useMemo((): GalleryItem[] => {
    if (!product) return [];
    const items: GalleryItem[] = [];
    const seen = new Set<string>();
    const norm = (u: string) => u.trim().toLowerCase().replace(/\?.*$/, "").replace(/#.*$/, "");

    [product.texturePhotoUrl, product.imageUrl, ...product.additionalImages]
      .filter((u): u is string => Boolean(u?.trim()))
      .forEach((url) => {
        const key = norm(url);
        if (!seen.has(key)) { seen.add(key); items.push({ type: "image", url: url.trim() }); }
      });

    product.videoUrls.forEach((videoUrl) => {
      const videoId = extractYouTubeVideoId(videoUrl);
      if (videoId) items.push({ type: "video", url: videoUrl, videoId });
    });

    return items;
  }, [product]);

  const heroImage = galleryItems.find((i) => i.type === "image")?.url ?? null;
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
  const activeGalleryItem = galleryItems[activeGalleryIndex];

  const openGalleryAt = useCallback((index: number) => {
    if (!galleryItems.length) return;
    setActiveGalleryIndex(((index % galleryItems.length) + galleryItems.length) % galleryItems.length);
    requestAnimationFrame(() => setIsGalleryOpen(true));
  }, [galleryItems.length]);

  const goToPrev = useCallback(() => {
    if (!galleryItems.length) return;
    setActiveGalleryIndex((p) => (p - 1 + galleryItems.length) % galleryItems.length);
  }, [galleryItems.length]);

  const goToNext = useCallback(() => {
    if (!galleryItems.length) return;
    setActiveGalleryIndex((p) => (p + 1) % galleryItems.length);
  }, [galleryItems.length]);

  const msrpPreview = useMemo(() => {
    if (!product?.priceTiers.length) return null;
    return product.priceTiers.find((tier) => isBagTier(tier) && tier.msrp) ?? product.priceTiers.find((tier) => tier.msrp) ?? null;
  }, [product?.priceTiers]);

  const sizeCategories = useMemo(() => {
    if (!product) return [];
    return buildSizeCategories(product);
  }, [product]);

  const [selectedCategoryKey, setSelectedCategoryKey] = useState("");
  const [selectedChoiceSize, setSelectedChoiceSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const selectedCategory = useMemo(
    () => sizeCategories.find((category) => category.key === selectedCategoryKey),
    [selectedCategoryKey, sizeCategories]
  );

  const needsChoice = (selectedCategory?.choices.length ?? 0) > 1;
  const selectedChoice = useMemo(
    () =>
      selectedCategory?.choices.find((choice) => choice.size === selectedChoiceSize) ??
      (needsChoice ? undefined : selectedCategory?.choices[0]),
    [needsChoice, selectedCategory, selectedChoiceSize]
  );

  const selectedTotal = (selectedChoice?.displayPrice ?? 0) * quantity;
  const canPayOnline = product ? PAY_PICKUP_PRODUCT_IDS.has(product.id) : false;

  // Reset gallery index on product change
  useEffect(() => {
    setActiveGalleryIndex(0);
    setSelectedCategoryKey("");
    setSelectedChoiceSize("");
    setQuantity(1);
  }, [product?.id]);

  useEffect(() => {
    if (!product || window.location.hash !== "#buy") return;
    const timer = window.setTimeout(() => {
      document.getElementById("buy")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);
    return () => window.clearTimeout(timer);
  }, [product]);

  const addSelectionToCart = useCallback((next?: "products" | "checkout" | "quote") => {
    if (!product || !selectedChoice) return;

    addItem({
      productId: product.id,
      productName: product.displayTitle,
      productSlug: product.slug,
      format: selectedChoice.displayLabel === "Single bag" ? selectedCategory?.label ?? selectedChoice.size : selectedChoice.displayLabel,
      quantity,
      unitPrice: selectedChoice.displayPrice,
      unit: selectedChoice.unit || "per unit",
      mode: canPayOnline ? "pay" : "quote",
      imageUrl: product.imageUrl || product.texturePhotoUrl,
    });

    setJustAdded(true);
    toast({
      title: "Added to cart",
      description: `${quantity}x ${product.displayTitle} (${selectedChoice.displayLabel})`,
    });
    window.setTimeout(() => setJustAdded(false), 1400);

    if (next === "products") navigate("/products");
    if (next === "checkout") canPayOnline ? openDrawer() : navigate("/order");
    if (next === "quote") navigate("/order");
  }, [addItem, canPayOnline, navigate, openDrawer, product, quantity, selectedCategory?.label, selectedChoice, toast]);

  // --- SEO ---
  const seoDescription = product?.marketingNote || product?.description || "Wholesale organic soil products from Soil Seed & Water.";
  const seoKeywords = product?.seoKeywords || [product?.category, product?.productType, "organic soil", "wholesale"].filter(Boolean).join(", ");

  // --- Thumbnails (excluding hero) ---
  const thumbnails = useMemo(() => {
    return galleryItems
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => !(item.type === "image" && item.url === heroImage));
  }, [galleryItems, heroImage]);

  return (
    <>
      <SEO
        title={product ? `${product.displayTitle} — Soil Seed & Water` : "Product Detail"}
        description={seoDescription}
        canonical={`https://organicsoilwholesale.com/products/${product?.slug ?? slug}`}
        keywords={seoKeywords}
      />

      <section className="py-4 sm:py-8 lg:py-10 bg-muted/20" aria-label="Product details">
        <div className="container mx-auto px-3 sm:px-4 max-w-6xl">
          {/* Back */}
          <Button variant="ghost" className="text-muted-foreground hover:text-foreground h-11 min-h-[44px] px-3 touch-manipulation rounded-lg mb-4" asChild>
            <Link href="/products">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Products
            </Link>
          </Button>

          {/* Loading */}
          {isLoading && (
            <div className="grid gap-6 lg:grid-cols-2">
              <Skeleton className="h-[400px] rounded-2xl" />
              <Skeleton className="h-[400px] rounded-2xl" />
            </div>
          )}

          {/* Error */}
          {!isLoading && error && (
            <Card className="rounded-2xl border-destructive/30 bg-destructive/5 p-8 text-center">
              <h2 className="text-2xl font-semibold text-destructive">Product not available</h2>
              <p className="mt-2 text-muted-foreground">We couldn&apos;t find that product. It may have been archived or renamed.</p>
              <Button asChild className="mt-6"><Link href="/products">Return to catalog</Link></Button>
            </Card>
          )}

          {/* Product Content */}
          {!isLoading && product && (
            <div className="space-y-6 sm:space-y-8">

              {/* ============================================================ */}
              {/* HERO: Image + Product Info                                    */}
              {/* ============================================================ */}
              <div className="bg-white rounded-2xl sm:rounded-3xl border shadow-sm overflow-hidden">
                <div className="flex flex-col lg:grid lg:grid-cols-2">
                  {/* Image */}
                  <div
                    className="relative bg-gray-50 min-h-[280px] sm:min-h-[360px] lg:min-h-[440px] cursor-pointer group"
                    role={galleryItems.length > 0 ? "button" : undefined}
                    tabIndex={galleryItems.length > 0 ? 0 : -1}
                    onClick={() => galleryItems.length > 0 && openGalleryAt(0)}
                    onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
                      if (galleryItems.length && (e.key === "Enter" || e.key === " ")) {
                        e.preventDefault(); openGalleryAt(0);
                      }
                    }}
                    aria-label={galleryItems.length > 0 ? "Open product gallery" : undefined}
                  >
                    {heroImage ? (
                      <OptimizedImage
                        src={heroImage}
                        alt={product.displayTitle}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground text-sm p-8">
                        No image available
                      </div>
                    )}
                    {galleryItems.length > 1 && (
                      <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
                        <Maximize2 className="h-3 w-3" />
                        {galleryItems.length} photos
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-5 sm:p-6 lg:p-8 flex flex-col justify-center">
                    {/* Badges */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <Badge className="bg-primary text-primary-foreground border-0 text-xs">
                        <Leaf className="h-3 w-3 mr-1" />
                        {product.category}
                      </Badge>
                      {product.certifications.map((cert) => (
                        <Badge key={cert} className="bg-green-50 text-green-700 border-green-200 text-xs font-medium">
                          <ShieldCheck className="h-3 w-3 mr-1" />
                          {cert}
                        </Badge>
                      ))}
                      {product.npk && (
                        <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 text-xs font-medium">
                          NPK: {product.npk}
                        </Badge>
                      )}
                    </div>

                    {/* Name */}
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold tracking-tight text-foreground">
                      {product.displayTitle}
                    </h1>

                    {/* Description */}
                    {product.description && (
                      <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
                        {product.marketingNote || product.description}
                      </p>
                    )}

                    {/* MSRP preview */}
                    {msrpPreview?.msrp && (
                      <div className="mt-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          Starts at
                        </p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl sm:text-3xl font-bold text-primary">
                            {fmt(msrpPreview.msrp)}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            / {categoryLabel(msrpPreview.size, product.id)}
                          </span>
                        </div>
                      </div>
                    )}

                    <div id="buy" className="mt-5 scroll-mt-24">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Choose size</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Pick a size, then choose single, pallet, super sack, or truckload when available.
                          </p>
                        </div>
                        {selectedCategory && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCategoryKey("");
                              setSelectedChoiceSize("");
                              setQuantity(1);
                            }}
                            className="text-left text-sm font-semibold text-primary hover:text-primary/80 sm:text-right"
                          >
                            Previous
                          </button>
                        )}
                      </div>

                      {!selectedCategory && sizeCategories.length > 0 && (
                        <div className="mt-3 space-y-3">
                          <div className="divide-y divide-border/70 border-y border-border/70">
                            {sizeCategories.map((category) => (
                              <button
                                key={category.key}
                                type="button"
                                onClick={() => {
                                  setSelectedCategoryKey(category.key);
                                  setSelectedChoiceSize("");
                                  setQuantity(1);
                                }}
                                className="flex min-h-[62px] w-full items-center gap-3 py-2.5 text-left transition hover:bg-muted/40 touch-manipulation"
                              >
                                {category.image && (
                                  <span className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-white ring-1 ring-border/70">
                                    <OptimizedImage src={category.image} alt="" className="h-full w-full object-cover" />
                                  </span>
                                )}
                                <span className="flex min-w-0 flex-1 items-baseline justify-between gap-3">
                                  <span className="block text-sm font-bold text-foreground">{category.label}</span>
                                  <span className="mt-0.5 block text-sm font-bold text-primary">{category.priceLabel}</span>
                                </span>
                              </button>
                            ))}
                          </div>
                          <Button
                            size="lg"
                            className="min-h-[48px] w-full rounded-xl font-semibold shadow-none touch-manipulation"
                            disabled
                          >
                            {canPayOnline ? <ShoppingCart className="mr-2 h-4 w-4" /> : <FileText className="mr-2 h-4 w-4" />}
                            {canPayOnline ? "Add to Cart" : "Request a Quote"}
                          </Button>
                        </div>
                      )}

                      {selectedCategory && (
                        <div className="mt-3 space-y-3">
                          <div className="flex items-center gap-3 border-y border-border/70 py-3">
                            {selectedCategory.image && (
                              <span className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-border/70">
                                <OptimizedImage src={selectedCategory.image} alt="" className="h-full w-full object-cover" />
                              </span>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Selected size</p>
                              <p className="text-sm font-bold text-foreground">{selectedCategory.label}</p>
                            </div>
                            <p className="shrink-0 text-sm font-bold text-primary">{selectedCategory.priceLabel}</p>
                          </div>

                          {needsChoice && (
                            <div>
                              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Pick pallet or single
                              </p>
                              <div className="divide-y divide-border/70 border-y border-border/70">
                                {selectedCategory.choices.map((choice) => {
                                  const isSelected = choice.size === selectedChoiceSize;
                                  const choiceImage = imageForChoice(choice, selectedCategory.image);
                                  return (
                                    <button
                                      key={choice.size}
                                      type="button"
                                      onClick={() => {
                                        setSelectedChoiceSize(choice.size);
                                        setQuantity(1);
                                      }}
                                      className={cn(
                                        "flex w-full items-center justify-between gap-3 py-3 text-left transition touch-manipulation",
                                        isSelected
                                          ? "bg-primary/[0.06] px-2"
                                          : "hover:bg-muted/40"
                                      )}
                                    >
                                        <span className="min-w-0">
                                        <span className="flex items-center gap-3">
                                          {choiceImage && (
                                            <span className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-white ring-1 ring-border/70">
                                              <OptimizedImage src={choiceImage} alt="" className="h-full w-full object-cover" />
                                            </span>
                                          )}
                                          <span className="min-w-0">
                                            <span className="block text-sm font-bold text-foreground">{choice.displayLabel}</span>
                                            <span className="mt-0.5 block text-xs text-muted-foreground">{choice.subLabel}</span>
                                          </span>
                                        </span>
                                      </span>
                                      <span className="shrink-0 text-lg font-bold text-primary">{fmt(choice.displayPrice)}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          <div className="border-t border-border/70 pt-3">
                            <div className="flex items-end justify-between gap-3">
                              <div>
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quantity</p>
                                <div className="inline-flex items-center gap-1 rounded-lg border border-border/70 bg-white p-1">
                                  <button
                                    type="button"
                                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                    className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted touch-manipulation"
                                    aria-label="Decrease quantity"
                                  >
                                    <Minus className="h-4 w-4" />
                                  </button>
                                  <span className="w-10 text-center text-base font-bold">{quantity}</span>
                                  <button
                                    type="button"
                                    onClick={() => setQuantity((q) => q + 1)}
                                    className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted touch-manipulation"
                                    aria-label="Increase quantity"
                                  >
                                    <Plus className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-muted-foreground">
                                  {selectedChoice ? `${quantity}x ${selectedChoice.displayLabel}` : "Choose a format"}
                                </p>
                                <p className="mt-0.5 text-2xl font-bold text-primary">{selectedChoice ? fmt(selectedTotal) : "$0.00"}</p>
                              </div>
                            </div>
                          </div>

                          {canPayOnline ? (
                            <div className="grid gap-2 sm:grid-cols-2">
                              <Button
                                size="lg"
                                className="min-h-[48px] rounded-xl font-semibold shadow-md touch-manipulation sm:col-span-2"
                                disabled={!selectedChoice}
                                onClick={() => addSelectionToCart()}
                              >
                                {justAdded ? <Check className="mr-2 h-4 w-4" /> : <ShoppingCart className="mr-2 h-4 w-4" />}
                                {justAdded ? "Added" : "Add to Cart"}
                              </Button>
                              <Button
                                size="lg"
                                variant="outline"
                                className="min-h-[48px] rounded-xl font-semibold touch-manipulation sm:col-span-2"
                                disabled={!selectedChoice}
                                onClick={() => addSelectionToCart("checkout")}
                              >
                                Buy Now
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="lg"
                              className="min-h-[48px] w-full rounded-xl font-semibold shadow-md touch-manipulation"
                              disabled={!selectedChoice}
                              onClick={() => addSelectionToCart("quote")}
                            >
                              <FileText className="mr-2 h-4 w-4" />
                              Request a Quote
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Thumbnail strip */}
                {thumbnails.length > 0 && (
                  <div className="px-4 pb-4 sm:px-6 sm:pb-5 border-t border-border/50 pt-3">
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {thumbnails.map(({ item, index: gi }) => {
                        if (item.type === "image") {
                          return (
                            <button key={item.url} type="button" onClick={() => openGalleryAt(gi)}
                              className="h-14 w-18 sm:h-16 sm:w-20 flex-shrink-0 overflow-hidden rounded-lg border bg-white shadow-sm hover:shadow-md hover:border-primary/30 transition touch-manipulation"
                              aria-label={`View image ${gi + 1}`}>
                              <OptimizedImage src={item.url} alt="" className="h-full w-full object-cover" />
                            </button>
                          );
                        }
                        return (
                          <button key={item.url} type="button" onClick={() => openGalleryAt(gi)}
                            className="relative h-14 w-18 sm:h-16 sm:w-20 flex-shrink-0 overflow-hidden rounded-lg border bg-white shadow-sm hover:shadow-md transition touch-manipulation"
                            aria-label={`View video ${gi + 1}`}>
                            <img src={`https://img.youtube.com/vi/${item.videoId}/hqdefault.jpg`} alt="" className="h-full w-full object-cover" />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                              <div className="rounded-full bg-red-600 p-1"><Play className="h-2.5 w-2.5 fill-white text-white" /></div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* ============================================================ */}
              {/* PRODUCT DETAILS: How to Use + Best For                        */}
              {/* ============================================================ */}
              {(product.usage || product.targetAudience.length > 0) && (
                <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                  {product.usage && (
                    <Card className="rounded-2xl border bg-white p-5 sm:p-6 shadow-sm">
                      <h2 className="text-base sm:text-lg font-semibold mb-3">How to Use</h2>
                      <p className="text-sm leading-relaxed text-muted-foreground">{product.usage}</p>
                    </Card>
                  )}
                  {product.targetAudience.length > 0 && (
                    <Card className="rounded-2xl border bg-white p-5 sm:p-6 shadow-sm">
                      <h2 className="text-base sm:text-lg font-semibold mb-3">Best For</h2>
                      <ul className="space-y-2">
                        {product.targetAudience.map((item) => (
                          <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Leaf className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </Card>
                  )}
                </div>
              )}

              {/* ============================================================ */}
              {/* VIDEO                                                         */}
              {/* ============================================================ */}
              {product.videoUrls.length > 0 && (() => {
                const videoId = extractYouTubeVideoId(product.videoUrls[0]);
                if (!videoId) return null;
                return (
                  <Card className="rounded-2xl border bg-white overflow-hidden shadow-sm">
                    <YouTubePlayer videoId={videoId} title={product.displayTitle} className="w-full" />
                  </Card>
                );
              })()}

              {/* ============================================================ */}
              {/* BOTTOM CTA                                                    */}
              {/* ============================================================ */}
              <div className="bg-gray-900 rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-center text-white">
                <h2 className="text-xl sm:text-2xl font-heading font-bold">
                  Need help with <span className="text-primary-light">{product.displayTitle}</span>?
                </h2>
                <p className="mt-2 text-sm text-white/70">Call us for delivery timing, bulk questions, or product fit.</p>
                <div className="mt-5 flex flex-col sm:flex-row justify-center gap-3">
                  <Button size="lg" className="min-h-[48px] bg-primary hover:bg-primary/90 shadow-lg touch-manipulation" asChild>
                    <a href="tel:+16027267211">
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      Call (602) 726-7211
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ================================================================== */}
      {/* GALLERY DIALOG                                                      */}
      {/* ================================================================== */}
      <Dialog open={isGalleryOpen} onOpenChange={setIsGalleryOpen}>
        <DialogContent className="sm:max-w-5xl border-none bg-black/95 text-white">
          <DialogHeader className="sr-only">
            <DialogTitle>{product?.displayTitle ?? "Product gallery"}</DialogTitle>
            <DialogDescription>Product images and videos.</DialogDescription>
          </DialogHeader>
          {galleryItems.length > 0 ? (
            <div className="space-y-4">
              <div className="relative overflow-hidden rounded-2xl bg-black">
                <div key={activeGalleryIndex} className="animate-in fade-in-0 duration-300">
                  {activeGalleryItem?.type === "video" ? (
                    <YouTubePlayer videoId={activeGalleryItem.videoId} title={product?.displayTitle ?? "Video"} className="w-full" autoPlay muted={false} />
                  ) : activeGalleryItem?.type === "image" ? (
                    <OptimizedImage src={activeGalleryItem.url} alt={product?.displayTitle ?? "Product"} className="mx-auto max-h-[70vh] w-full object-contain" />
                  ) : null}
                </div>
                {galleryItems.length > 1 && (
                  <>
                    <button type="button" className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-3 text-white hover:bg-white/40 backdrop-blur-sm transition" onClick={goToPrev} aria-label="Previous">
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-3 text-white hover:bg-white/40 backdrop-blur-sm transition" onClick={goToNext} aria-label="Next">
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}
              </div>
              {galleryItems.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {galleryItems.map((item, index) => {
                    const isActive = index === activeGalleryIndex;
                    if (item.type === "image") {
                      return (
                        <button key={`${item.url}-${index}`} type="button" onClick={() => setActiveGalleryIndex(index)}
                          className={`h-14 w-18 flex-shrink-0 overflow-hidden rounded-lg border transition ${isActive ? "border-white ring-2 ring-white/50 scale-105" : "border-white/30 hover:border-white/60"}`}
                          aria-label={`Image ${index + 1}`} aria-current={isActive}>
                          <OptimizedImage src={item.url} alt="" className="h-full w-full object-cover" />
                        </button>
                      );
                    }
                    return (
                      <button key={`${item.url}-${index}`} type="button" onClick={() => setActiveGalleryIndex(index)}
                        className={`relative h-14 w-18 flex-shrink-0 overflow-hidden rounded-lg border transition ${isActive ? "border-white ring-2 ring-white/50 scale-105" : "border-white/30 hover:border-white/60"}`}
                        aria-label={`Video ${index + 1}`} aria-current={isActive}>
                        <img src={`https://img.youtube.com/vi/${item.videoId}/hqdefault.jpg`} alt="" className="h-full w-full object-cover" />
                        <div className="absolute bottom-1 right-1 rounded-full bg-red-600 p-0.5">
                          <Play className="h-2.5 w-2.5 text-white fill-white" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
              <p className="text-center text-xs text-white/60">{activeGalleryIndex + 1} of {galleryItems.length}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center py-12 text-center">
              <ImagePlus className="h-12 w-12 text-white/40 mb-4" />
              <p className="text-sm text-white/60">No media available.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProductDetail;
