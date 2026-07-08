import { useMemo, useState, useCallback, useEffect, type KeyboardEvent } from "react";
import { useRoute, Link } from "wouter";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import SEO from "@/components/layout/SEO";
import { OptimizedImage } from "@/components/OptimizedImage";
import { generateProductSlug } from "@/utils/generateSlug";
import { extractYouTubeVideoId, YouTubePlayer } from "@/components/YouTubePlayer";
import { useQuoteCart } from "@/contexts/QuoteCartContext";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { getPayPickupProductContent, getPayPickupProductDescription } from "@/data/payPickupProductContent";
import { PayPickupProductFacts } from "@/components/PayPickupProductFacts";
import { CUSTOMER_SUPPORT_PHONE_DISPLAY, CUSTOMER_SUPPORT_PHONE_TEL } from "@/config/contact";
import { SITE_URL, SEO_BUSINESS_NAME, absoluteUrl, buildLocalBusinessSchema } from "@/config/seo";
import { trackEcommerceEvent, trackEvent } from "@/lib/analytics";
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
  Phone,
  X,
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
  cartLabel: string;
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

/** Hero bag photo per main pay-and-pickup product. Mirrors the HERO_OVERRIDES
 *  map in PayPickupGrid.tsx so the cart line item shows the SAME photo the
 *  customer just tapped on the list. Update both maps together. */
const HERO_BAG_PHOTO: Record<number, string> = {
  1000: "/images/optimized/dansgold9lbs-1.jpg",
  1001: "/images/optimized/mikeys-worm-poop9lbs.jpg",
  111: "/images/optimized/plantpal10lbs.jpg",
  3000: "/images/optimized/natures-blanket-bag-studio.jpg",
};

const GALLERY_DUPLICATE_GROUPS: Record<number, Record<string, string>> = {
  1000: {
    "/images/optimized/compost-texture-look.jpg": "simons-gold-hands-compost",
    "/uploads/products/1000/gallery-1/1763501397590-hb1oj0.webp": "simons-gold-hands-compost",
  },
  1001: {
    "/mikeys-worm-poop-bestfor.jpg": "mikeys-worm-hands",
    "/images/optimized/mikeys-worm-poop-bestfor.jpg": "mikeys-worm-hands",
    "/images/optimized/worm-castting-product-texture.jpg": "mikeys-worm-hands",
    "/uploads/products/1001/gallery-1/1763526684797-jzp3n6.webp": "mikeys-worm-hands",
    "/uploads/products/1001/gallery-1/1763526761040-2t7vpc.webp": "mikeys-worm-hands",
  },
};

const BLOCKED_GALLERY_IMAGES: Record<number, Set<string>> = {
  3000: new Set(["/uploads/products/3000/gallery-1/1764113182186-ohei8u.webp"]),
};

const normalizedGalleryUrl = (url: string) => {
  const clean = url.trim().toLowerCase().replace(/\?.*$/, "").replace(/#.*$/, "");
  if (!clean) return "";
  if (!clean.startsWith("/") && !clean.startsWith("http://") && !clean.startsWith("https://")) {
    return `/${clean}`;
  }
  try {
    const parsed = new URL(clean, window.location.origin);
    return parsed.pathname.toLowerCase();
  } catch {
    return clean;
  }
};

const isBlockedGalleryImage = (productId: number, url: string) => {
  return BLOCKED_GALLERY_IMAGES[productId]?.has(normalizedGalleryUrl(url)) ?? false;
};

const guideImageDedupeKey = (url: string) => {
  const normalized = normalizedGalleryUrl(url);
  if (!normalized) return "";
  if (normalized.includes("plantpal-bag-in-context")) return "plantpal-bag-in-context";
  if (normalized.includes("plantpal-with-veggies")) return "plantpal-with-veggies";
  return normalized.replace(/-2(?=\.(jpg|jpeg|webp|png)$)/, "");
};

const uniqueGuideImages = (images: string[]) => {
  const seen = new Set<string>();
  return images.filter((url) => {
    const key = guideImageDedupeKey(url);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const galleryDedupeKey = (productId: number, url: string) => {
  const normalized = normalizedGalleryUrl(url);
  return GALLERY_DUPLICATE_GROUPS[productId]?.[normalized] ?? normalized;
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
    Tote: { price: 150 },
    "Truckload (~24 tons)": { price: 720 },
  },
  111: {
    "1CF Bag": { price: 10.99 },
    "Truckload (22 pallets)": { price: 4896.05 },
  },
  3000: {
    "Truckload (22 pallets)": { price: 2700 },
  },
};

const normalizeProductId = (productId?: number | string) => Number(productId);

const isPlantPalOrSoilCraftBag = (productId?: number | string) => {
  const id = normalizeProductId(productId);
  return id === 137 || id === 111;
};

const categoryLabel = (size: string, productId?: number | string) => {
  const id = normalizeProductId(productId);
  if (size.includes("9lb")) return "9 lb Bag";
  if (size.includes("1CF")) return isPlantPalOrSoilCraftBag(productId) ? "1.5 cu ft Bag (~50 lb)" : "40 lb Bag (1 cu ft)";
  if (size.includes("2CF")) return "2 cu ft Bag";
  if (size.includes("Tote")) return id === 137 || id === 111 || id === 3000 ? "Super Sack (2.2 cu yd)" : "Super Sack (~2,000 lb)";
  if (size.includes("Truckload") || size.includes("Bulk")) {
    if (id === 137 || id === 3000) return "Truckload (~90 cu yd)";
    if (id === 111) return "Truckload (22 pallets)";
    return "Truckload (~24 tons)";
  }
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

const isDairyCompostBulkTier = (productId: number, size: string) =>
  productId === 1000 && /truckload|bulk/i.test(size);

const dairyCompostTonPrice = (price: number) => Number((price / 24).toFixed(2));

const palletSizeForBag = (size: string, productId?: number | string) => {
  if (size.includes("9lb")) return { size: "Pallet (144 x 9lb)", qty: 144, cartLabel: "Pallet of 9 lb Bags" };
  if (size.includes("1CF")) {
    return {
      size: "Pallet (50 x 1CF)",
      qty: 50,
      cartLabel: isPlantPalOrSoilCraftBag(productId) ? "Pallet of 1.5 cu ft Bags" : "Pallet of 1CF Bags",
    };
  }
  if (size.includes("2CF")) return { size: "Pallet (25 x 2CF)", qty: 25, cartLabel: "Pallet of 2CF Bags" };
  return null;
};

const singleCartLabelForSize = (size: string, productId?: number | string) => {
  const id = normalizeProductId(productId);
  if (size.includes("9lb")) return "9 lb Bag";
  if (size.includes("1CF")) return isPlantPalOrSoilCraftBag(productId) ? "1.5 cu ft Bag" : "1CF Bag";
  if (size.includes("2CF")) return "2CF Bag";
  return categoryLabel(size, productId);
};

const imageForChoice = (choice: SizeChoice, fallback: string) => {
  return SIZE_CATEGORY_PHOTO[choice.size] || fallback;
};

const HIDDEN_PAY_PICKUP_TIER_TERMS: Record<number, string[]> = {
  1001: ["truckload", "bulk"],
};

const shouldHidePayPickupTier = (productId: number | string, size: string) => {
  const hiddenTerms = HIDDEN_PAY_PICKUP_TIER_TERMS[normalizeProductId(productId)] ?? [];
  const normalized = size.toLowerCase();
  return hiddenTerms.some((term) => normalized.includes(term));
};

const schemaTierLabel = (size: string, productId?: number | string) => {
  if (size.startsWith("Pallet") && size.includes("9lb")) return "Pallet of 9 lb Bags";
  if (size.startsWith("Pallet") && size.includes("1CF")) {
    return isPlantPalOrSoilCraftBag(productId) ? "Pallet of 1.5 cu ft bags" : "Pallet of 1 cu ft bags";
  }
  if (size.startsWith("Pallet") && size.includes("2CF")) return "Pallet of 2 cu ft Bags";
  return categoryLabel(size, productId);
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

  product.priceTiers
    .filter((tier) => !shouldHidePayPickupTier(product.id, tier.size))
    .forEach((tier) => {
    if (tier.size.startsWith("Pallet")) return;

    const pricing = priceForTier(product.id, tier);
    const key = categoryLabel(tier.size, product.id);
    const dairyBulk = isDairyCompostBulkTier(product.id, tier.size);
    const displayPrice = dairyBulk ? dairyCompostTonPrice(pricing.price) : pricing.price;
    categoryMap.set(key, {
      key,
      label: key,
      price: displayPrice,
      priceLabel: dairyBulk ? `$${displayPrice.toFixed(2)}/ton` : pricing.priceLabel,
      image: SIZE_CATEGORY_PHOTO[tier.size] || product.imageUrl || product.texturePhotoUrl || "",
      choices: [
        {
          ...tier,
          kind: tier.size.includes("Truckload") || tier.size.includes("Bulk") ? "bulk" : "single",
          displayLabel: dairyBulk ? "Bulk tons" : key.includes("Truckload") ? "Truckload" : key.includes("Super Sack") ? "Super Sack" : "Single bag",
          subLabel: dairyBulk
            ? "24 tons per walking-floor truckload"
            : key.includes("Truckload")
            ? tier.size.includes("24") ? "24 tons" : "90 cubic yards"
            : key.includes("Super Sack")
              ? product.id === 137 || product.id === 111 || product.id === 3000 ? "2.2 cubic yards" : "about 2,000 lb"
              : "one bag",
          cartLabel: dairyBulk
            ? "Bulk Dairy Compost (tons)"
            : key.includes("Truckload") || key.includes("Super Sack")
            ? key
            : singleCartLabelForSize(tier.size, product.id),
          displayPrice,
          unit: dairyBulk ? "ton" : tier.unit,
        },
      ],
    });
  });

  product.priceTiers
    .filter((tier) => !shouldHidePayPickupTier(product.id, tier.size))
    .forEach((tier) => {
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
    const palletMeta = palletSizeForBag(tier.size, product.id);

    category.choices.unshift({
      ...tier,
      kind: "pallet",
      displayLabel: "Pallet",
      subLabel: tier.qty ? `Pallet of ${tier.qty}` : "Pallet",
      cartLabel: palletMeta?.cartLabel ?? "Pallet",
      displayPrice: price,
    });
  });

  categoryMap.forEach((category) => {
    const single = category.choices.find((choice) => choice.kind === "single");
    if (!single || category.choices.some((choice) => choice.kind === "pallet")) return;

    const palletMeta = palletSizeForBag(single.size, product.id);
    if (!palletMeta) return;

    category.choices.unshift({
      ...single,
      size: palletMeta.size,
      qty: palletMeta.qty,
      unit: "per pallet",
      kind: "pallet",
      displayLabel: "Pallet",
      subLabel: `Pallet of ${palletMeta.qty}`,
      cartLabel: palletMeta.cartLabel,
      displayPrice: single.displayPrice * palletMeta.qty,
    });
  });

  return Array.from(categoryMap.values());
};

const parseList = (value?: string | null, delimiter = /[|,]/): string[] =>
  value ? value.split(delimiter).map((s) => s.trim()).filter(Boolean) : [];

const usageSteps = (usage?: string) =>
  usage
    ? usage
        .split(/(?<=\.)\s+/)
        .map((step) => step.trim())
        .filter(Boolean)
        .slice(0, 3)
    : [];

const PRODUCT_DETAIL_CONTENT: Record<number, {
  includes?: string[];
  benefits?: string[];
  usageSteps: string[];
  bestFor: string[];
  note: string;
  seoKeywords: string[];
  guideImages: string[];
}> = {
  1000: {
    usageSteps: [
      "Mix with existing soil or potting soil when planting to improve organic matter and soil structure.",
      "Top dress beds, trees, and planted areas with a light layer, then water thoroughly.",
      "Use as a steady compost amendment when you want cleaner biology, moisture support, and long-term soil improvement.",
    ],
    bestFor: [
      "Home gardeners",
      "Vegetable beds",
      "Fruit trees",
      "Raised beds",
      "Nurseries",
      "Organic farms",
      "Soil rebuilding",
      "Arizona gardens",
    ],
    note: "Strong fit when you want pure dairy compost, slow-release nutrition, improved soil structure, and better water conservation.",
    seoKeywords: [
      "dairy compost",
      "organic dairy compost",
      "soil amendment",
      "compost for gardens",
      "compost for trees",
      "Arizona compost",
      "bulk compost Phoenix",
      "organic matter for soil",
    ],
    guideImages: [
      "/images/product-guides/simons-gold-01.webp",
      "/images/product-guides/simons-gold-02.webp",
      "/images/product-guides/simons-gold-03.webp",
      "/images/product-guides/simons-gold-04.webp",
    ],
  },
  1001: {
    usageSteps: [
      "Mix into potting soil, raised beds, or garden soil to add concentrated worm castings near the root zone.",
      "Top dress plants lightly during the growing season, then water in to activate nutrients.",
      "Use when plants need gentle feeding, better moisture retention, and stronger soil biology.",
    ],
    bestFor: [
      "Home gardeners",
      "Vegetable beds",
      "Fruit trees",
      "Container growers",
      "Nurseries",
      "Organic farms",
      "Seed starts",
      "Root zones",
    ],
    note: "Best when you want nutrient-rich worm castings for stronger root zones, moisture retention, and steady natural plant feeding.",
    seoKeywords: [
      "worm castings",
      "organic worm castings",
      "vermicompost",
      "worm poop fertilizer",
      "natural plant food",
      "worm castings Phoenix",
      "soil biology",
      "root zone amendment",
    ],
    guideImages: [
      "/images/product-guides/mikeys-worm-poop-01.webp",
      "/images/product-guides/mikeys-worm-poop-02.webp",
      "/images/product-guides/mikeys-worm-poop-03.webp",
      "/images/product-guides/mikeys-worm-poop-04.webp",
    ],
  },
  111: {
    usageSteps: [
      "Use PlantPal directly in pots and containers — no mixing required.",
      "Fill containers or transplant nursery stock into PlantPal as your all-stage growing medium.",
      "Water thoroughly after planting and maintain regular moisture while roots establish.",
    ],
    bestFor: [
      "Nurseries",
      "Home gardeners",
      "Container growers",
      "Seed starts",
      "Propagation",
      "Indoor plants",
      "Patio planters",
      "Vegetables and herbs",
    ],
    note: "Built for nurseries and container growers who need a balanced all-stage mix with strong root development.",
    seoKeywords: [
      "nursery potting mix",
      "all stage potting soil",
      "PlantPal",
      "container gardening soil",
      "seed starter mix",
      "propagation soil",
      "organic potting mix Phoenix",
      "nursery mix Arizona",
    ],
    guideImages: [
      "/images/optimized/plantpal10lbs.jpg",
      "/images/optimized/plantpal-bestfor.jpg",
      "/images/optimized/plantpal-lifestyle.jpg",
    ],
  },
  137: {
    includes: ["Dairy compost", "Worm castings", "Perlite", "Peat-free coir"],
    benefits: ["Ready-to-use planting soil", "Supports root development", "Balanced for containers and beds"],
    usageSteps: [
      "Fill containers, raised beds, or planting holes with Soil Craft as a ready-to-use growing medium.",
      "Plant directly into the blend; no extra amendments are needed for most everyday garden and container uses.",
      "Water thoroughly after planting and keep moisture consistent while roots establish.",
    ],
    bestFor: [
      "Home gardeners",
      "Container growers",
      "Raised beds",
      "Nurseries",
      "Potted plants",
      "Vegetable beds",
      "Flowers",
      "Patio gardens",
    ],
    note: "Built for easy planting when you need balanced organic potting soil, strong roots, and clean growing conditions.",
    seoKeywords: [
      "organic potting soil",
      "premium potting soil",
      "raised bed soil",
      "container gardening soil",
      "garden soil Phoenix",
      "ready to plant soil",
      "nursery potting mix",
      "Soil Craft blend",
    ],
    guideImages: [
      "/images/product-guides/soil-craft-01.webp",
      "/images/product-guides/soil-craft-02.webp",
      "/images/product-guides/soil-craft-03.webp",
      "/images/product-guides/soil-craft-04.webp",
    ],
  },
  3000: {
    usageSteps: [
      "Spread evenly over clean landscape beds at a depth of about 2-3 inches.",
      "Keep mulch pulled slightly away from trunks, stems, and crowns to protect plant health.",
      "Water after application so the mulch settles and begins supporting moisture retention and temperature control.",
    ],
    bestFor: [
      "Landscapers",
      "Home gardeners",
      "Trees and shrubs",
      "Flower beds",
      "Raised beds",
      "Pathways",
      "Commercial beds",
      "Weed suppression",
    ],
    note: "Use it when you want the best all-around healthy soil mulch: premium wood fiber blended with worm castings and dairy compost for cleaner beds, moisture retention, cooler roots, and long-lasting soil cover.",
    seoKeywords: [
      "organic mulch",
      "premium mulch",
      "wood fiber mulch",
      "worm castings mulch",
      "dairy compost mulch",
      "healthy soil mulch",
      "landscape mulch Phoenix",
      "mulch for garden beds",
      "weed suppression mulch",
      "moisture retention mulch",
      "bulk mulch delivery",
    ],
    guideImages: [
      "/images/product-guides/natures-blanket-premium-01.webp",
      "/images/product-guides/natures-blanket-premium-02.webp",
      "/images/product-guides/natures-blanket-premium-03.webp",
      "/images/product-guides/natures-blanket-premium-04.webp",
    ],
  },
};

const mergeUnique = (items: string[]) => Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));

const audienceLabel = (item: string) => {
  const value = item.toLowerCase();
  if (value.includes("home gardener")) return "Home gardeners";
  if (value.includes("fruit")) return "Fruit trees";
  if (value.includes("vegetable")) return "Vegetable beds";
  if (value.includes("nursery")) return "Nurseries";
  if (value.includes("organic")) return "Organic farms";
  if (value.includes("drought")) return "Dry Arizona sites";
  if (value.includes("floriculture")) return "Flowers";
  if (value.includes("cannabis")) return "Specialty growers";
  if (value.includes("garden installation")) return "New installs";
  return item;
};

const priorityAudiences = (items: string[]) => {
  const order = ["Home gardeners", "Vegetable beds", "Fruit trees", "Flowers", "New installs", "Nurseries", "Organic farms", "Dry Arizona sites"];
  const unique = Array.from(new Set(items.map(audienceLabel)));
  return unique.sort((a, b) => {
    const ai = order.indexOf(a);
    const bi = order.indexOf(b);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
};

const PRODUCT_AUDIENCE_FALLBACKS: Record<number, string[]> = {
  1000: PRODUCT_DETAIL_CONTENT[1000].bestFor,
  1001: PRODUCT_DETAIL_CONTENT[1001].bestFor,
  111: PRODUCT_DETAIL_CONTENT[111].bestFor,
  137: PRODUCT_DETAIL_CONTENT[137].bestFor,
  3000: [
    ...PRODUCT_DETAIL_CONTENT[3000].bestFor,
    "Water retention",
  ],
};

const bestFitAudiences = (product: Product) => {
  const fallback = PRODUCT_AUDIENCE_FALLBACKS[product.id] || [];
  const combined = [...product.targetAudience, ...fallback];
  return priorityAudiences(combined).slice(0, 8);
};

const bestFitNote = (product: Product) => {
  return PRODUCT_DETAIL_CONTENT[product.id]?.note || "Strong fit when you want steady nutrition, cleaner soil biology, and better performance in beds, trees, or planted areas.";
};

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
    slug: record.slug ?? generateProductSlug(record.product_type ?? record.productType ?? undefined, record.name) ?? record.id.toString(),
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

const PAY_PICKUP_PRODUCT_IDS = new Set([1000, 1001, 111, 3000]);

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

  const productDetailContent = product ? PRODUCT_DETAIL_CONTENT[product.id] : undefined;

  // --- Gallery ---
  type GalleryItem = { type: "image"; url: string } | { type: "video"; url: string; videoId: string };

  const galleryItems = useMemo((): GalleryItem[] => {
    if (!product) return [];
    const items: GalleryItem[] = [];
    const seen = new Set<string>();

    // CRITICAL: the list card (PayPickupGrid → PayPickupCard) overrides
    // product.imageUrl with HERO_BAG_PHOTO so the BAG photo is shown, not the
    // lifestyle / dirt-close-up that the API returns as imageUrl. The detail
    // page MUST use the same override or the hero will not match the card the
    // customer just tapped.
    const heroBagOverride = HERO_BAG_PHOTO[product.id];
    [heroBagOverride, product.imageUrl, product.texturePhotoUrl, ...product.additionalImages]
      .filter((u): u is string => Boolean(u?.trim()))
      .filter((url) => !isBlockedGalleryImage(product.id, url))
      .forEach((url) => {
        const key = galleryDedupeKey(product.id, url);
        if (!seen.has(key)) { seen.add(key); items.push({ type: "image", url: url.trim() }); }
      });

    product.videoUrls.forEach((videoUrl) => {
      const videoId = extractYouTubeVideoId(videoUrl);
      if (!videoId) return;
      const key = `video:${videoId}`;
      if (!seen.has(key)) {
        seen.add(key);
        items.push({ type: "video", url: videoUrl, videoId });
      }
    });

    return items;
  }, [product]);

  const heroImage = galleryItems.find((i) => i.type === "image")?.url ?? null;
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
  const [isGuideGalleryOpen, setIsGuideGalleryOpen] = useState(false);
  const [activeGuideImageIndex, setActiveGuideImageIndex] = useState(0);
  const activeGalleryItem = galleryItems[activeGalleryIndex];
  const guideImages = useMemo(
    () => uniqueGuideImages(productDetailContent?.guideImages ?? []),
    [productDetailContent?.guideImages],
  );
  const activeGuideImage = guideImages[activeGuideImageIndex];

  const openGalleryAt = useCallback((index: number) => {
    if (!galleryItems.length) return;
    setActiveGalleryIndex(((index % galleryItems.length) + galleryItems.length) % galleryItems.length);
    requestAnimationFrame(() => setIsGalleryOpen(true));
  }, [galleryItems.length]);

  const openHeroGallery = useCallback(() => {
    if (!galleryItems.length) return;
    const isDesktopPointer = window.matchMedia("(min-width: 768px)").matches;
    if (isDesktopPointer) openGalleryAt(activeGalleryIndex);
  }, [activeGalleryIndex, galleryItems.length, openGalleryAt]);

  const goToPrev = useCallback(() => {
    if (!galleryItems.length) return;
    setActiveGalleryIndex((p) => (p - 1 + galleryItems.length) % galleryItems.length);
  }, [galleryItems.length]);

  const goToNext = useCallback(() => {
    if (!galleryItems.length) return;
    setActiveGalleryIndex((p) => (p + 1) % galleryItems.length);
  }, [galleryItems.length]);

  const openGuideImageAt = useCallback((index: number) => {
    if (!guideImages.length) return;
    setActiveGuideImageIndex(((index % guideImages.length) + guideImages.length) % guideImages.length);
    requestAnimationFrame(() => setIsGuideGalleryOpen(true));
  }, [guideImages.length]);

  const goToPrevGuideImage = useCallback(() => {
    if (!guideImages.length) return;
    setActiveGuideImageIndex((p) => (p - 1 + guideImages.length) % guideImages.length);
  }, [guideImages.length]);

  const goToNextGuideImage = useCallback(() => {
    if (!guideImages.length) return;
    setActiveGuideImageIndex((p) => (p + 1) % guideImages.length);
  }, [guideImages.length]);

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

  const pricingSummary = useMemo(() => {
    if (!product) return null;

    if (selectedChoice && selectedCategory) {
      const formatLine = needsChoice
        ? `${selectedCategory.label} · ${selectedChoice.displayLabel}`
        : selectedCategory.label;
      return {
        key: `choice-${selectedChoice.size}-${quantity}`,
        eyebrow: "Your selection",
        price: fmt(selectedChoice.displayPrice),
        unitSuffix: selectedChoice.unit?.replace(/^per\s/i, "") ?? "",
        subtitle: formatLine,
        detail: selectedChoice.subLabel || selectedChoice.cartLabel,
        totalLine:
          quantity > 1 ? `${quantity} × ${fmt(selectedChoice.displayPrice)} = ${fmt(selectedTotal)}` : undefined,
      };
    }

    if (selectedCategory) {
      return {
        key: `category-${selectedCategory.key}`,
        eyebrow: needsChoice ? "Selected size" : "Your selection",
        price: selectedCategory.priceLabel,
        subtitle: selectedCategory.label,
        detail: needsChoice ? "Choose pallet or single format below" : undefined,
      };
    }

    if (msrpPreview?.msrp) {
      return {
        key: "overview",
        eyebrow: "Starts at",
        price: fmt(msrpPreview.msrp),
        subtitle: categoryLabel(msrpPreview.size, product.id),
      };
    }

    return null;
  }, [
    msrpPreview,
    needsChoice,
    product,
    quantity,
    selectedCategory,
    selectedChoice,
    selectedTotal,
  ]);

  // Reset gallery index on product change
  useEffect(() => {
    setActiveGalleryIndex(0);
    setSelectedCategoryKey("");
    setSelectedChoiceSize("");
    setQuantity(1);
  }, [product?.id]);

  useEffect(() => {
    if (!product) return;
    if (window.location.hash === "#buy") {
      window.setTimeout(() => {
        document.getElementById("buy")?.scrollIntoView({ block: "start" });
      }, 0);
    } else {
      window.scrollTo(0, 0);
    }
    trackEvent("Product Detail Viewed", {
      product_id: product.id,
      product_slug: product.slug,
      product_name: product.displayTitle,
      category: product.category,
      pay_online: canPayOnline,
    });
    trackEcommerceEvent("view_item", {
      items: [{
        item_id: product.id,
        item_name: product.displayTitle,
        item_category: product.category,
      }],
      pay_online: canPayOnline,
      pickup_sales_channel: "osw_yard",
    });
  }, [product?.id]);

  const addSelectionToCart = useCallback((next?: "products" | "checkout" | "quote") => {
    if (!product || !selectedChoice) return;

    trackEvent(next === "checkout" ? "Buy Now Clicked" : "Add To Cart Clicked", {
      product_id: product.id,
      product_slug: product.slug,
      product_name: product.displayTitle,
      size_category: selectedCategory?.label ?? "",
      format: selectedChoice.cartLabel,
      quantity,
      unit_price: selectedChoice.displayPrice,
      mode: canPayOnline ? "pay" : "quote",
      next: next ?? "cart_drawer",
    });

    addItem({
      productId: product.id,
      productName: product.displayTitle,
      productSlug: product.slug,
      format: selectedChoice.cartLabel,
      quantity,
      unitPrice: selectedChoice.displayPrice,
      unit: selectedChoice.unit || "per unit",
      mode: canPayOnline ? "pay" : "quote",
      // Show the SAME bag/hero photo the customer tapped on the list. Fall back
      // gracefully if no override exists for this product.
      imageUrl: HERO_BAG_PHOTO[product.id] || product.imageUrl || product.texturePhotoUrl,
      sizeImage: SIZE_CATEGORY_PHOTO[selectedChoice.size] || undefined,
    });

    setJustAdded(true);
    // Only show the toast when we're navigating away. When we're opening the
    // cart drawer, the drawer itself is the confirmation — the toast would
    // just stack on top and cover the drawer header.
    if (next) {
      toast({
        title: "Added to cart",
        description: `${quantity}x ${product.displayTitle} (${selectedChoice.displayLabel})`,
      });
    }
    window.setTimeout(() => setJustAdded(false), 1400);

    if (next === "products") navigate("/products");
    if (next === "checkout") canPayOnline ? navigate("/checkout") : navigate("/order");
    if (next === "quote") navigate("/order");
    // Plain "Add to Cart" (no `next`) — open the drawer so the customer can
    // see what's in their cart and choose to continue or keep shopping.
    if (!next) openDrawer();
  }, [addItem, canPayOnline, navigate, openDrawer, product, quantity, selectedCategory?.label, selectedChoice, toast]);

  // --- SEO ---
  const resolvedUsageSteps = product
    ? mergeUnique([...usageSteps(product.usage), ...(productDetailContent?.usageSteps ?? [])]).slice(0, 3)
    : [];
  const syncedProductDescription = product
    ? getPayPickupProductDescription(product.id, product.marketingNote || product.description)
    : "";
  const seoDescription = syncedProductDescription || "Wholesale organic soil products from Soil Seed & Water.";
  const seoKeywords = mergeUnique([
    ...(product?.seoKeywords ? product.seoKeywords.split(",") : []),
    ...(productDetailContent?.seoKeywords ?? []),
    product?.category ?? "",
    product?.productType ?? "",
    "organic soil",
    "wholesale",
  ]).join(", ");
  const productStructuredData = product
    ? [
        buildLocalBusinessSchema(),
        {
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.displayTitle,
          alternateName: product.name,
          description: seoDescription,
          image: galleryItems
            .filter((item): item is Extract<GalleryItem, { type: "image" }> => item.type === "image")
            .slice(0, 6)
            .map((item) => absoluteUrl(item.url)),
          brand: {
            "@type": "Brand",
            name: "Soil Seed & Water",
          },
          category: product.category || product.productType || "Organic soil product",
          sku: String(product.id),
          url: `${SITE_URL}/products/${product.slug}`,
          offers: product.priceTiers
            .filter((tier) => !shouldHidePayPickupTier(product.id, tier.size))
            .map((tier) => ({ tier, pricing: priceForTier(product.id, tier) }))
            .filter(({ pricing }) => Number.isFinite(pricing.price) && pricing.price > 0)
            .map(({ tier, pricing }) => ({
              "@type": "Offer",
              name: `${product.displayTitle} - ${schemaTierLabel(tier.size, product.id)}`,
              price: Number(pricing.price.toFixed(2)),
              priceCurrency: "USD",
              availability: "https://schema.org/InStock",
              url: `${SITE_URL}/products/${product.slug}`,
              seller: {
                "@type": "LocalBusiness",
                name: SEO_BUSINESS_NAME,
              },
            })),
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Products", item: `${SITE_URL}/products` },
            { "@type": "ListItem", position: 2, name: product.displayTitle, item: `${SITE_URL}/products/${product.slug}` },
          ],
        },
      ]
    : undefined;

  return (
    <>
      <SEO
        title={product ? `${product.displayTitle} — Soil Seed & Water` : "Product Detail"}
        description={seoDescription}
        canonical={`https://organicsoilwholesale.com/products/${product?.slug ?? slug}`}
        keywords={seoKeywords}
        structuredData={productStructuredData}
      />

      <section className="bg-muted/20 py-2 sm:py-8 lg:py-10" aria-label="Product details">
        <div className="container mx-auto px-3 sm:px-4 max-w-6xl">
          {/* Back */}
          <Button variant="ghost" className="mb-2 h-10 min-h-[40px] rounded-lg px-2 text-muted-foreground hover:text-foreground touch-manipulation sm:mb-4 sm:h-11 sm:min-h-[44px] sm:px-3" asChild>
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
            <div className="space-y-4 sm:space-y-8">

              {/* ============================================================ */}
              {/* HERO: Image + Product Info                                    */}
              {/* ============================================================ */}
              <div className="overflow-hidden rounded-2xl border bg-white shadow-sm sm:rounded-3xl">
                <div className="flex flex-col lg:grid lg:grid-cols-2">
                  {/* Image gallery */}
                  <div className="bg-gradient-to-b from-white to-stone-50 p-3 sm:p-4 lg:self-start">
                    <div className="flex flex-col gap-3 lg:flex-row-reverse">
                      <div
                        className="group relative h-[245px] rounded-xl bg-white sm:h-[390px] md:cursor-pointer lg:h-[600px] lg:flex-1"
                        role={galleryItems.length > 0 ? "button" : undefined}
                        tabIndex={galleryItems.length > 0 ? 0 : -1}
                        onClick={openHeroGallery}
                        onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
                          if (galleryItems.length && (e.key === "Enter" || e.key === " ")) {
                            e.preventDefault(); openGalleryAt(activeGalleryIndex);
                          }
                        }}
                        aria-label={galleryItems.length > 0 ? "Product media" : undefined}
                      >
                        {activeGalleryItem?.type === "image" ? (
                          <OptimizedImage
                            src={activeGalleryItem.url}
                            alt={product.displayTitle}
                            className="h-full w-full object-contain p-3 transition-transform duration-500 group-hover:scale-[1.02] sm:p-5 lg:p-6"
                          />
                        ) : activeGalleryItem?.type === "video" ? (
                          <>
                            <img
                              src={`https://img.youtube.com/vi/${activeGalleryItem.videoId}/hqdefault.jpg`}
                              alt={`${product.displayTitle} video`}
                              className="h-full w-full object-contain p-3 sm:p-5 lg:p-6"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white shadow-lg">
                                <Play className="h-6 w-6 fill-white" />
                              </span>
                            </div>
                          </>
                        ) : heroImage ? (
                          <OptimizedImage
                            src={heroImage}
                            alt={product.displayTitle}
                            className="h-full w-full object-contain p-3 sm:p-5 lg:p-6"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center p-8 text-sm text-muted-foreground">
                            No image available
                          </div>
                        )}
                        {galleryItems.length > 1 && (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              openGalleryAt(activeGalleryIndex);
                            }}
                            className="absolute bottom-3 right-3 flex min-h-[40px] items-center gap-1.5 rounded-full bg-black/70 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition hover:bg-black/80"
                            aria-label="Open product gallery"
                          >
                            <Maximize2 className="h-3 w-3" />
                            {activeGalleryIndex + 1} / {galleryItems.length}
                          </button>
                        )}
                      </div>

                      {galleryItems.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto pb-1 lg:w-20 lg:flex-col lg:overflow-x-visible lg:overflow-y-auto lg:pb-0">
                          {galleryItems.map((item, index) => {
                            const isActive = index === activeGalleryIndex;
                            return (
                              <button
                                key={`${item.type}-${item.url}`}
                                type="button"
                                onClick={() => setActiveGalleryIndex(index)}
                                aria-current={isActive ? "true" : undefined}
                                className={cn(
                                  "relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg border bg-white shadow-sm transition touch-manipulation sm:h-16 sm:w-16 lg:h-20 lg:w-20",
                                  isActive ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/60"
                                )}
                                aria-label={`Show gallery item ${index + 1}`}
                              >
                                {item.type === "image" ? (
                                  <OptimizedImage src={item.url} alt="" className="h-full w-full object-contain bg-white p-1" width={120} q={55} />
                                ) : (
                                  <>
                                    <img src={`https://img.youtube.com/vi/${item.videoId}/hqdefault.jpg`} alt="" className="h-full w-full object-contain bg-white p-1" />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                                      <Play className="h-4 w-4 fill-white text-white" />
                                    </div>
                                  </>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="flex flex-col justify-start p-4 sm:p-6 lg:p-8">
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
                    {syncedProductDescription && (
                      <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
                        {syncedProductDescription}
                      </p>
                    )}

                    {(() => {
                      const payPickupContent = product ? getPayPickupProductContent(product.id) : undefined;
                      const includes = payPickupContent?.includes ?? productDetailContent?.includes ?? [];
                      const benefits = payPickupContent?.benefits ?? productDetailContent?.benefits ?? [];
                      if (includes.length === 0 && benefits.length === 0) return null;
                      return (
                        <div className="mt-4">
                          <PayPickupProductFacts includes={includes} benefits={benefits} variant="detail" />
                        </div>
                      );
                    })()}

                    {/* Dynamic pricing — overview until a size/format is chosen */}
                    {pricingSummary && (
                      <div
                        key={pricingSummary.key}
                        className="mt-4 rounded-2xl border border-primary/10 bg-primary/[0.03] px-4 py-3 transition-all duration-200"
                      >
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          {pricingSummary.eyebrow}
                        </p>
                        <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                          <span className="text-2xl font-bold text-primary sm:text-3xl">
                            {pricingSummary.price}
                          </span>
                          {pricingSummary.unitSuffix ? (
                            <span className="text-sm text-muted-foreground">/ {pricingSummary.unitSuffix}</span>
                          ) : null}
                        </div>
                        {pricingSummary.subtitle ? (
                          <p className="mt-1 text-sm font-semibold text-foreground">{pricingSummary.subtitle}</p>
                        ) : null}
                        {pricingSummary.detail ? (
                          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{pricingSummary.detail}</p>
                        ) : null}
                        {pricingSummary.totalLine ? (
                          <p className="mt-2 text-sm font-semibold text-primary">{pricingSummary.totalLine}</p>
                        ) : null}
                      </div>
                    )}

                    <div id="buy" className="mt-5 scroll-mt-24 rounded-2xl border border-border/70 bg-stone-50/60 p-3 sm:bg-transparent sm:p-0 sm:border-0">
                      <div className="mb-3 flex flex-col gap-3 rounded-xl border border-border/70 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <div className="mb-1.5 flex items-center gap-2">
                            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-primary">
                              {selectedCategory ? "Step 2" : "Step 1"}
                            </span>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                              {selectedCategory ? "Purchase type" : "Choose size"}
                            </p>
                          </div>
                          <p className="text-base font-bold leading-tight text-foreground">
                            {selectedCategory ? `How do you want ${selectedCategory.label}?` : "Select the product package"}
                          </p>
                          <p className="mt-1 text-sm leading-snug text-muted-foreground">
                            {selectedCategory
                              ? "Choose single, pallet, super sack, or truckload when available."
                              : "Start with the package size, then pick the buying format if needed."}
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
                            className="inline-flex min-h-[40px] items-center justify-center gap-2 self-start rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm font-bold text-primary transition hover:bg-primary/10 sm:self-auto"
                          >
                            <ArrowLeft className="h-4 w-4" />
                            Back to sizes
                          </button>
                        )}
                      </div>

                      {!selectedCategory && sizeCategories.length > 0 && (
                        <div className="mt-3 space-y-3">
                          <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-2 xl:grid-cols-3">
                            {sizeCategories.map((category) => (
                              <button
                                key={category.key}
                                type="button"
                                onClick={() => {
                                  setSelectedCategoryKey(category.key);
                                  setSelectedChoiceSize("");
                                  setQuantity(1);
                                  trackEvent("Product Size Selected", {
                                    product_id: product.id,
                                    product_slug: product.slug,
                                    size_category: category.label,
                                    price: category.price,
                                  });
                                }}
                                className="group flex min-h-[178px] flex-col overflow-hidden rounded-xl border border-border bg-white text-left shadow-sm transition hover:border-primary hover:shadow-md focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 touch-manipulation sm:min-h-0"
                              >
                                <div className="relative h-28 w-full shrink-0 overflow-hidden bg-white sm:aspect-[4/3] sm:h-auto">
                                  {category.image ? (
                                    <OptimizedImage
                                      src={category.image}
                                      alt={category.label}
                                      className="h-full w-full object-contain p-2 transition-transform duration-200 group-hover:scale-[1.03]"
                                    />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                                      No photo
                                    </div>
                                  )}
                                </div>
                                <div className="flex flex-1 flex-col justify-between gap-1 px-3 py-2.5">
                                  <span className="block text-sm font-bold leading-tight text-foreground">
                                    {category.label}
                                  </span>
                                  <span className="block text-sm font-extrabold text-primary">
                                    {category.priceLabel}
                                  </span>
                                </div>
                              </button>
                            ))}
                          </div>
                          <Button
                            size="lg"
                            className="min-h-[46px] w-full rounded-xl font-semibold shadow-none touch-manipulation"
                            disabled
                          >
                            {canPayOnline ? <ShoppingCart className="mr-2 h-4 w-4" /> : <FileText className="mr-2 h-4 w-4" />}
                            Select a size first
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
                              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Package size</p>
                              <p className="text-sm font-bold text-foreground">{selectedCategory.label}</p>
                            </div>
                          </div>

                          {needsChoice && (
                            <div>
                              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Pick pallet or single
                              </p>
                              <div className="grid grid-cols-2 gap-2 sm:gap-3">
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
                                        trackEvent("Product Purchase Type Selected", {
                                          product_id: product.id,
                                          product_slug: product.slug,
                                          size_category: selectedCategory.label,
                                          format: choice.cartLabel,
                                          price: choice.displayPrice,
                                        });
                                      }}
                                      className={cn(
                                        "group flex min-h-[188px] flex-col overflow-hidden rounded-xl border bg-white text-left transition touch-manipulation sm:min-h-0",
                                        isSelected
                                          ? "border-primary ring-2 ring-primary/30 shadow-md"
                                          : "border-border hover:border-primary hover:shadow-sm"
                                      )}
                                    >
                                      <div className="relative h-28 w-full shrink-0 overflow-hidden bg-white sm:aspect-[4/3] sm:h-auto">
                                        {choiceImage ? (
                                          <OptimizedImage
                                            src={choiceImage}
                                            alt={choice.displayLabel}
                                            className="h-full w-full object-contain p-2 transition-transform duration-200 group-hover:scale-[1.03]"
                                          />
                                        ) : (
                                          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                                            No photo
                                          </div>
                                        )}
                                        {isSelected && (
                                          <span className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white">
                                            ✓
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex min-w-0 flex-1 flex-col justify-between gap-1 px-3 py-2.5">
                                        <div className="min-w-0">
                                          <span className="block text-sm font-bold leading-tight text-foreground">
                                            {choice.displayLabel}
                                          </span>
                                          <span className="mt-0.5 block text-xs leading-tight text-muted-foreground">
                                            {choice.subLabel}
                                          </span>
                                        </div>
                                        <span className="block text-base font-extrabold text-primary">
                                          {fmt(choice.displayPrice)}
                                        </span>
                                      </div>
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
                                  {selectedChoice
                                    ? quantity > 1
                                      ? `${quantity} × ${selectedChoice.cartLabel}`
                                      : selectedChoice.cartLabel
                                    : "Choose a format"}
                                </p>
                                {selectedChoice && quantity > 1 ? (
                                  <p className="mt-0.5 text-xl font-bold text-primary">{fmt(selectedTotal)}</p>
                                ) : null}
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

              </div>

              {productDetailContent?.guideImages.length ? (
                <Card className="overflow-hidden rounded-2xl border bg-white p-4 shadow-sm sm:p-5">
                  <div className="mb-3 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Product guide</p>
                      <h2 className="mt-1 text-base font-semibold sm:text-lg">What this product does</h2>
                    </div>
                    <p className="hidden max-w-sm text-right text-xs leading-relaxed text-muted-foreground sm:block">
                      Quick visual notes from the product guide.
                    </p>
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-1">
                    {productDetailContent.guideImages.map((image, index) => (
                      <button
                        type="button"
                        key={image}
                        onClick={() => openGuideImageAt(index)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            openGuideImageAt(index);
                          }
                        }}
                        className="group relative aspect-square w-[168px] flex-shrink-0 overflow-hidden rounded-xl border border-stone-200 bg-stone-50 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/50 sm:w-[190px] lg:w-[210px]"
                        aria-label={`Open ${product.displayTitle} guide image ${index + 1}`}
                      >
                        <OptimizedImage
                          src={image}
                          alt={`${product.displayTitle} guide ${index + 1}`}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                          width={420}
                          q={72}
                        />
                        <span className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-primary opacity-0 shadow-sm ring-1 ring-black/5 transition group-hover:opacity-100 group-focus:opacity-100">
                          <Maximize2 className="h-4 w-4" />
                        </span>
                      </button>
                    ))}
                  </div>
                </Card>
              ) : null}

              {/* ============================================================ */}
              {/* PRODUCT DETAILS: How to Use + Best For                        */}
              {/* ============================================================ */}
              {(resolvedUsageSteps.length > 0 || bestFitAudiences(product).length > 0) && (
                <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                  {resolvedUsageSteps.length > 0 && (
                    <Card className="rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Garden use</p>
                          <h2 className="mt-1 text-base font-semibold sm:text-lg">How to Use</h2>
                        </div>
                        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">Quick guide</span>
                      </div>
                      <div className="space-y-3">
                        {resolvedUsageSteps.map((step, index) => (
                          <div key={step} className="flex gap-3 rounded-xl bg-stone-50 p-3">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                              {index + 1}
                            </span>
                            <p className="text-sm leading-relaxed text-stone-600">{step}</p>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}
                  {bestFitAudiences(product).length > 0 && (
                    <Card className="rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
                      <div className="mb-4">
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#b38a58]">Best fit</p>
                        <h2 className="mt-1 text-base font-semibold sm:text-lg">Best For</h2>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {bestFitAudiences(product).map((item) => (
                          <div key={item} className="flex min-h-[42px] items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-700">
                            <Leaf className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                      <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-sm leading-relaxed text-amber-900">
                        {bestFitNote(product)}
                      </p>
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
                    <a href={CUSTOMER_SUPPORT_PHONE_TEL}>
                      <Phone className="mr-2 h-4 w-4" />
                      Call {CUSTOMER_SUPPORT_PHONE_DISPLAY}
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
        <DialogContent
          hideCloseButton
          className="flex h-[100svh] max-h-[100svh] w-screen !max-w-[100vw] !gap-0 overflow-hidden rounded-none border-none bg-[#061827] !p-0 text-white shadow-2xl sm:h-[92vh] sm:max-h-[92vh] sm:max-w-6xl sm:rounded-2xl"
        >
          {galleryItems.length > 0 ? (
            <div className="flex h-full min-h-0 w-full min-w-0 flex-col">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-[#07111e] px-3 py-2.5 sm:px-5 sm:py-3">
                <div className="min-w-0 text-left">
                  <DialogTitle className="truncate text-base font-bold leading-tight text-white sm:text-lg">
                    {product?.displayTitle ?? "Product gallery"}
                  </DialogTitle>
                  <DialogDescription className="mt-0.5 text-xs text-white/55">
                    Product images and videos · {activeGalleryIndex + 1} of {galleryItems.length}
                  </DialogDescription>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="hidden rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-white/80 sm:inline-flex">
                    {activeGalleryIndex + 1} of {galleryItems.length}
                  </span>
                  <DialogClose className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-bold text-[#061827] shadow-lg shadow-black/30 transition hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white/70">
                    <X className="h-4 w-4" />
                    Close
                  </DialogClose>
                </div>
              </div>

              <div className="flex min-h-0 flex-1 flex-col pb-[env(safe-area-inset-bottom)]">
                <div className="relative flex min-h-0 flex-1 bg-[#071b2b] p-3 sm:p-5">
                  <div className="flex h-full max-h-[calc(100svh-166px-env(safe-area-inset-bottom))] min-h-0 w-full items-center justify-center overflow-hidden rounded-xl bg-white shadow-2xl shadow-black/25 sm:max-h-[calc(92vh-190px)] sm:rounded-2xl">
                    <div key={activeGalleryIndex} className="flex h-full w-full animate-in items-center justify-center fade-in-0 duration-300">
                      {activeGalleryItem?.type === "video" ? (
                        <div className="flex h-full w-full items-center justify-center">
                          <YouTubePlayer videoId={activeGalleryItem.videoId} title={product?.displayTitle ?? "Video"} className="w-full" autoPlay muted={false} />
                        </div>
                      ) : activeGalleryItem?.type === "image" ? (
                        <OptimizedImage
                          src={activeGalleryItem.url}
                          alt={product?.displayTitle ?? "Product"}
                          className="h-full max-h-full w-full max-w-full object-contain p-3 sm:p-4"
                        />
                      ) : null}
                    </div>
                  </div>
                  {galleryItems.length > 1 && (
                    <>
                      <button
                        type="button"
                        className="absolute left-3 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-[#061827]/85 text-white shadow-lg ring-1 ring-white/20 backdrop-blur transition hover:bg-[#061827] sm:left-7 sm:h-14 sm:w-14"
                        onClick={goToPrev}
                        aria-label="Previous"
                      >
                        <ChevronLeft className="h-6 w-6" />
                      </button>
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-[#061827]/85 text-white shadow-lg ring-1 ring-white/20 backdrop-blur transition hover:bg-[#061827] sm:right-7 sm:h-14 sm:w-14"
                        onClick={goToNext}
                        aria-label="Next"
                      >
                        <ChevronRight className="h-6 w-6" />
                      </button>
                    </>
                  )}
                </div>

                {galleryItems.length > 1 && (
                  <div className="border-t border-white/10 bg-[#07111e] px-3 py-3 sm:px-5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="shrink-0 text-xs font-bold uppercase tracking-[0.18em] text-white/45">
                        {activeGalleryIndex + 1} / {galleryItems.length}
                      </p>
                      <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto py-1">
                        {galleryItems.map((item, index) => {
                          const isActive = index === activeGalleryIndex;
                          if (item.type === "image") {
                            return (
                              <button key={`${item.url}-${index}`} type="button" onClick={() => setActiveGalleryIndex(index)}
                                className={cn(
                                  "h-14 w-16 flex-shrink-0 overflow-hidden rounded-lg border bg-white transition sm:h-16 sm:w-20",
                                  isActive ? "border-white ring-2 ring-white/60 scale-105" : "border-white/20 opacity-70 hover:opacity-100"
                                )}
                                aria-label={`Image ${index + 1}`} aria-current={isActive}>
                                <OptimizedImage src={item.url} alt="" className="h-full w-full object-contain bg-white p-1" />
                              </button>
                            );
                          }
                          return (
                            <button key={`${item.url}-${index}`} type="button" onClick={() => setActiveGalleryIndex(index)}
                              className={cn(
                                "relative h-14 w-16 flex-shrink-0 overflow-hidden rounded-lg border bg-white transition sm:h-16 sm:w-20",
                                isActive ? "border-white ring-2 ring-white/60 scale-105" : "border-white/20 opacity-70 hover:opacity-100"
                              )}
                              aria-label={`Video ${index + 1}`} aria-current={isActive}>
                              <img src={`https://img.youtube.com/vi/${item.videoId}/hqdefault.jpg`} alt="" className="h-full w-full object-contain bg-white p-1" />
                              <div className="absolute bottom-1 right-1 rounded-full bg-red-600 p-1">
                                <Play className="h-2.5 w-2.5 text-white fill-white" />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-[#07111e] px-4 py-3 sm:px-5">
                <DialogTitle className="text-base font-bold text-white">Product gallery</DialogTitle>
                <DialogClose className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-bold text-[#061827]">
                  <X className="h-4 w-4" />
                  Close
                </DialogClose>
              </div>
              <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
                <ImagePlus className="h-12 w-12 text-white/40 mb-4" />
                <p className="text-sm text-white/60">No media available.</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isGuideGalleryOpen} onOpenChange={setIsGuideGalleryOpen}>
        <DialogContent
          hideCloseButton
          className="flex h-[100svh] max-h-[100svh] w-screen !max-w-[100vw] !gap-0 overflow-hidden rounded-none border-none bg-[#061827] !p-0 text-white shadow-2xl sm:h-auto sm:max-h-[88vh] sm:max-w-4xl sm:rounded-2xl"
        >
          {activeGuideImage ? (
            <div className="flex h-full min-h-0 w-full min-w-0 flex-col">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-[#07111e] px-3 py-2.5 sm:px-5 sm:py-3">
                <div className="min-w-0 text-left">
                  <DialogTitle className="truncate text-base font-bold leading-tight text-white sm:text-lg">
                    {product?.displayTitle ?? "Product guide"}
                  </DialogTitle>
                  <DialogDescription className="mt-0.5 text-xs text-white/55">
                    Product guide · {activeGuideImageIndex + 1} of {guideImages.length}
                  </DialogDescription>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="hidden rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-white/80 sm:inline-flex">
                    {activeGuideImageIndex + 1} of {guideImages.length}
                  </span>
                  <DialogClose className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-bold text-[#061827] shadow-lg shadow-black/30 transition hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white/70">
                    <X className="h-4 w-4" />
                    Close
                  </DialogClose>
                </div>
              </div>

              <div className="relative flex min-h-0 flex-1 bg-[#071b2b] p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:max-h-[calc(88vh-70px)] sm:p-5">
                <div className="flex h-full min-h-0 w-full items-center justify-center overflow-hidden rounded-xl bg-white shadow-2xl shadow-black/25 sm:max-h-[calc(88vh-110px)] sm:rounded-2xl">
                  <div key={activeGuideImageIndex} className="flex h-full w-full animate-in items-center justify-center fade-in-0 duration-300">
                    <OptimizedImage
                      src={activeGuideImage}
                      alt={`${product?.displayTitle ?? "Product"} guide ${activeGuideImageIndex + 1}`}
                      className="h-full max-h-[calc(100svh-86px)] w-full max-w-full object-contain p-2 sm:max-h-[calc(88vh-112px)] sm:p-4"
                      width={1200}
                      q={82}
                    />
                  </div>
                </div>
                {guideImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      className="absolute left-3 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-[#061827]/85 text-white shadow-lg ring-1 ring-white/20 backdrop-blur transition hover:bg-[#061827] sm:left-7 sm:h-14 sm:w-14"
                      onClick={goToPrevGuideImage}
                      aria-label="Previous guide image"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-[#061827]/85 text-white shadow-lg ring-1 ring-white/20 backdrop-blur transition hover:bg-[#061827] sm:right-7 sm:h-14 sm:w-14"
                      onClick={goToNextGuideImage}
                      aria-label="Next guide image"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProductDetail;
