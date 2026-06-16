import { type KeyboardEvent } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { OptimizedImage } from "@/components/OptimizedImage";
import { CheckCircle2, Flame, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { getPayPickupProductDescription } from "@/data/payPickupCopy";

export interface PayPickupProductSize {
  key: string;
  label: string;
  price: number;
  priceCents: number;
  unit?: string;
  msrp?: string;
}

export interface PayPickupProduct {
  id: number;
  name: string;
  productType: string;
  slug?: string;
  imageUrl?: string;
  texturePhotoUrl?: string;
  sizes: PayPickupProductSize[];
}

interface PayPickupCardProps {
  product: PayPickupProduct;
  /** Override hero image — typically a bag studio shot from featured config */
  heroImageOverride?: string;
  /** Optional bestfor collage to sit behind the bag */
  backdropImageOverride?: string;
  className?: string;
  priority?: boolean;
  /**
   * Buy Now button style.
   * - "brand"   (default) — OSW phthalo green, used on /products
   * - "minimal" — black on white, used on /qr to match the minimal landing
   */
  buyButtonVariant?: "brand" | "minimal";
}

const parseMoney = (value?: string) => {
  if (!value) return undefined;
  const parsed = Number(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) ? parsed : undefined;
};

const productMsrpOverrides: Record<number, Record<string, { price: number; priceLabel?: string }>> = {
  1000: {
    "1CF Bag": { price: 24.9 },
    Tote: { price: 150 },
    "Truckload (~24 tons)": { price: 720 },
  },
  137: {
    "1CF Bag": { price: 15.99 },
    "Truckload (22 pallets)": { price: 5400 },
  },
  3000: {
    "Truckload (22 pallets)": { price: 2700 },
  },
};

const displayPriceFor = (productId: number, size: PayPickupProductSize) => {
  const override = productMsrpOverrides[Number(productId)]?.[size.key];
  const msrp = parseMoney(size.msrp);
  const price = override?.price ?? msrp ?? size.price;
  return {
    price,
    priceLabel: override?.priceLabel ?? `$${price.toFixed(2)}`,
  };
};

const getStartingPrice = (product: PayPickupProduct) => {
  // Defensive: prod payload may omit `key` on size options. Treat missing as non-Pallet.
  const firstSingle = product.sizes.find((size) => !(size.key ?? "").startsWith("Pallet"));
  return firstSingle ? displayPriceFor(product.id, firstSingle).priceLabel : null;
};

const PRODUCT_SIZE_SUMMARIES: Record<number, string[]> = {
  1000: ["9 lb bag", "40 lb bag (1 cu ft)", "super sack (~2,000 lb)", "truckload (~24 tons)"],
  1001: ["9 lb bag", "40 lb bag (1 cu ft)", "super sack (~2,000 lb)"],
  137: ["1.5 cu ft bag (~50 lb)", "super sack (2.2 cu yd)", "truckload (~90 cu yd)"],
  3000: ["2 cu ft bag (~60 lb)", "super sack (2.2 cu yd)", "truckload (~90 cu yd)"],
};

const STARTING_PRICE_CONTEXT: Record<number, string> = {
  1000: "for a 9 lb bag",
  1001: "for a 9 lb bag",
  137: "for a 1.5 cu ft bag (~50 lb)",
  3000: "for a 2 cu ft bag (~60 lb)",
};

/** Seasonal badges. Empty for now — re-introduce when we have a system-wide
 *  seasonality model so we're not flagging a single product as a one-off. */
const PRODUCT_SEASONAL_BADGES: Record<number, string> = {};

const sizeCategoryLabel = (key: string) => {
  if (!key) return "";
  if (key.includes("9lb")) return "9 lb bag";
  if (key.includes("1CF")) return "40 lb bag (1 cu ft)";
  if (key.includes("2CF")) return "2 cu ft bag";
  if (key.includes("Tote")) return "super sack";
  if (key.includes("Truckload") || key.includes("Bulk")) return "truckload";
  return key;
};

const getSizeCategories = (product: PayPickupProduct) => {
  const summary = PRODUCT_SIZE_SUMMARIES[Number(product.id)];
  if (summary) return summary;

  const categories = product.sizes
    .filter((size) => !(size.key ?? "").startsWith("Pallet"))
    .map((size) => sizeCategoryLabel(size.key ?? size.label ?? ""))
    .filter(Boolean);

  return Array.from(new Set(categories));
};

export function PayPickupCard({ product, heroImageOverride, backdropImageOverride, className, priority = false, buyButtonVariant = "brand" }: PayPickupCardProps) {
  const [, navigate] = useLocation();
  const goToDetail = () => {
    const slug = product.slug || String(product.id);
    navigate(`/products/${slug}`);
  };
  const goToBuy = () => {
    const slug = product.slug || String(product.id);
    window.location.assign(`/products/${slug}#buy`);
  };
  const handleCardKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      goToDetail();
    }
  };

  // Hero stays on the BRANDED BAG photo — customers want to see the product, not the pallet
  const baseHero = heroImageOverride || product.imageUrl || product.texturePhotoUrl;
  const heroImage = baseHero;
  const textureImage = product.texturePhotoUrl;
  const startingPrice = getStartingPrice(product);
  const sizeCategories = getSizeCategories(product);
  const description = getPayPickupProductDescription(product.id, "Open the product page to view available sizes, pricing, pickup, and quote options.");

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={goToDetail}
      onKeyDown={handleCardKeyDown}
      className={cn(
        "group flex h-full cursor-pointer flex-row gap-3 overflow-hidden rounded-2xl bg-white p-2 shadow-[0_4px_18px_rgba(38,64,39,0.07)] ring-1 ring-stone-200/60 transition-shadow duration-300 hover:shadow-[0_10px_28px_rgba(38,64,39,0.12)] focus:outline-none focus:ring-2 focus:ring-[#264027]/40 md:gap-4 md:p-4",
        className
      )}
    >
      {/* LEFT SIDE on desktop / TOP on mobile — mini gallery */}
      <div className="w-[36%] shrink-0 self-stretch md:w-[44%]">
        <div className="relative h-full min-h-[188px] w-full overflow-hidden rounded-xl bg-stone-50 md:min-h-[260px]">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              goToDetail();
            }}
            aria-label={`View ${product.name} details`}
            className="group/photo absolute inset-0 h-full w-full"
          >
            {heroImage && (
              <OptimizedImage
                src={heroImage}
                alt={product.name}
                className="absolute inset-0 h-full w-full object-contain bg-white p-1 transition-transform duration-300 group-hover/photo:scale-105"
                priority={priority}
                width={520}
                q={66}
              />
            )}
          </button>

          {/* PAY & PICK UP availability badge — these 4 mains are the only products
              that customers can pay for online + pick up at the yard */}
          <div className="pointer-events-none absolute left-1.5 top-1.5 z-10 inline-flex items-center gap-1 rounded-full bg-[#264027] px-2 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-white shadow-lg ring-2 ring-white/80 sm:left-2 sm:top-2 sm:px-3 sm:py-1.5 sm:text-[11px] md:text-xs">
            <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" strokeWidth={2.5} />
            <span className="sm:hidden">Pay</span>
            <span className="hidden sm:inline">Pay &amp; Pick Up</span>
          </div>

          {textureImage && (
            <div className="absolute bottom-2 left-2 hidden h-[72px] w-[72px] overflow-hidden rounded-xl border-2 border-white bg-white shadow-md ring-1 ring-stone-300/60 sm:block sm:h-[84px] sm:w-[84px]">
              <OptimizedImage
                src={textureImage}
                alt={`${product.name} texture`}
                className="h-full w-full scale-125 object-cover"
                width={120}
                q={60}
              />
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SIDE on desktop / BOTTOM on mobile — content column */}
      <div className="flex min-w-0 flex-1 flex-col md:pt-1">
        {/* Identity */}
        <div className="mt-0">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-heading text-base font-bold leading-tight text-stone-900 md:text-xl">
                {product.productType}
              </h3>
              <p className="truncate text-xs font-medium text-[#7a5a2e] md:text-sm">{product.name}</p>
            </div>
            {PRODUCT_SEASONAL_BADGES[product.id] && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#c62828] px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white shadow-sm">
                <Flame className="h-3 w-3" />
                {PRODUCT_SEASONAL_BADGES[product.id]}
              </span>
            )}
          </div>
        </div>

        <p className="mt-3 hidden text-sm leading-relaxed text-stone-600 md:block md:min-h-[88px]">
          {description}
        </p>

        <div className="mt-2 space-y-1 text-sm md:mt-3">
          {startingPrice && (
            <p className="text-sm font-semibold leading-snug text-[#264027]">
              Starts at {startingPrice} {STARTING_PRICE_CONTEXT[product.id] ?? ""}
            </p>
          )}
          {sizeCategories.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1" aria-label="Available sizes">
              {sizeCategories.map((size) => (
                <span
                  key={size}
                  className="rounded-full bg-stone-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-stone-600 md:px-2 md:text-[10px]"
                >
                  {size}
                </span>
              ))}
            </div>
          )}
        </div>

        <Button
          onClick={(event) => {
            event.stopPropagation();
            goToBuy();
          }}
          className={cn(
            "mt-auto h-9 w-full rounded-lg text-sm font-bold text-white md:mt-3 md:h-10",
            buyButtonVariant === "minimal"
              ? "bg-stone-900 hover:bg-stone-800"
              : "bg-[#264027] hover:bg-[#1f3320]",
          )}
        >
          <ShoppingBag className="mr-1.5 h-4 w-4" />
          Choose Size
        </Button>
      </div>
    </div>
  );
}

export default PayPickupCard;
