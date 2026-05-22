import { type KeyboardEvent } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { OptimizedImage } from "@/components/OptimizedImage";
import { ArrowRight, Flame, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

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
}

const parseMoney = (value?: string) => {
  if (!value) return undefined;
  const parsed = Number(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) ? parsed : undefined;
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

const displayPriceFor = (productId: number, size: PayPickupProductSize) => {
  const override = productMsrpOverrides[productId]?.[size.key];
  const msrp = parseMoney(size.msrp);
  const price = override?.price ?? msrp ?? size.price;
  return {
    price,
    priceLabel: override?.priceLabel ?? `$${price.toFixed(2)}`,
  };
};

const getStartingPrice = (product: PayPickupProduct) => {
  const firstSingle = product.sizes.find((size) => !size.key.startsWith("Pallet"));
  return firstSingle ? displayPriceFor(product.id, firstSingle).priceLabel : null;
};

const PRODUCT_SIZE_SUMMARIES: Record<number, string[]> = {
  1000: ["9 lb bag", "40 lb bag (1 cu ft)", "super sack (~2,000 lb)", "truckload (~24 tons)"],
  1001: ["9 lb bag", "40 lb bag (1 cu ft)", "super sack (~2,000 lb)", "truckload (~24 tons)"],
  137: ["1.5 cu ft bag (~50 lb)", "super sack (2.2 cu yd)", "truckload (~90 cu yd)"],
  3000: ["2 cu ft bag (~60 lb)", "super sack (2.2 cu yd)", "truckload (~90 cu yd)"],
};

const STARTING_PRICE_CONTEXT: Record<number, string> = {
  1000: "for a 9 lb bag",
  1001: "for a 9 lb bag",
  137: "for a 1.5 cu ft bag (~50 lb)",
  3000: "for a 2 cu ft bag (~60 lb)",
};

const PRODUCT_SEASONAL_BADGES: Record<number, string> = {
  3000: "Summer Hot",
};

const sizeCategoryLabel = (key: string) => {
  if (key.includes("9lb")) return "9 lb bag";
  if (key.includes("1CF")) return "40 lb bag (1 cu ft)";
  if (key.includes("2CF")) return "2 cu ft bag";
  if (key.includes("Tote")) return "super sack";
  if (key.includes("Truckload") || key.includes("Bulk")) return "truckload";
  return key;
};

const getSizeCategories = (product: PayPickupProduct) => {
  const summary = PRODUCT_SIZE_SUMMARIES[product.id];
  if (summary) return summary;

  const categories = product.sizes
    .filter((size) => !size.key.startsWith("Pallet"))
    .map((size) => sizeCategoryLabel(size.key));

  return Array.from(new Set(categories));
};

const PRODUCT_DESCRIPTIONS: Record<number, string> = {
  1000: "Slow-release nutrition and clean organic matter for feeding, rebuilding, and conserving soil. Easy to spread in beds, trees, and planted areas.",
  1001: "Nutrient-rich worm castings for pre-season feeding, root zones, top dressing, and mixing into soil blends.",
  137: "A ready-to-use potting soil for gardens, containers, nurseries, and raised beds.",
  3000: "Dark premium mulch for clean landscape finishes, moisture retention, and weed suppression.",
};

export function PayPickupCard({ product, heroImageOverride, backdropImageOverride, className }: PayPickupCardProps) {
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
  const description = PRODUCT_DESCRIPTIONS[product.id] ?? "Open the product page to view available sizes, pricing, pickup, and quote options.";

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={goToDetail}
      onKeyDown={handleCardKeyDown}
      className={cn(
        "group flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl bg-white p-3 shadow-[0_4px_18px_rgba(38,64,39,0.07)] ring-1 ring-stone-200/60 transition-shadow duration-300 hover:shadow-[0_10px_28px_rgba(38,64,39,0.12)] focus:outline-none focus:ring-2 focus:ring-[#264027]/40 md:flex-row md:gap-4 md:p-4",
        className
      )}
    >
      {/* LEFT SIDE on desktop / TOP on mobile — mini gallery */}
      <div className="md:w-[44%] md:shrink-0 md:self-stretch">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-stone-50 md:aspect-auto md:h-full md:min-h-[260px]">
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
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover/photo:scale-105"
              />
            )}
          </button>

          {textureImage && (
            <div className="absolute bottom-2 left-2 h-[72px] w-[72px] overflow-hidden rounded-xl border-2 border-white bg-white shadow-md ring-1 ring-stone-300/60 sm:h-[84px] sm:w-[84px]">
              <OptimizedImage
                src={textureImage}
                alt={`${product.name} texture`}
                className="h-full w-full scale-125 object-cover"
              />
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SIDE on desktop / BOTTOM on mobile — content column */}
      <div className="flex min-w-0 flex-1 flex-col md:pt-1">
        {/* Identity */}
        <div className="mt-3 md:mt-0">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-heading text-lg font-bold leading-tight text-stone-900 md:text-xl">
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

        <p className="mt-3 text-sm leading-relaxed text-stone-600 md:min-h-[88px]">
          {description}
        </p>

        <div className="mt-3 space-y-1 text-sm">
          {startingPrice && (
            <p className="font-semibold text-[#264027]">
              Starts at {startingPrice} {STARTING_PRICE_CONTEXT[product.id] ?? ""}
            </p>
          )}
          {sizeCategories.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1" aria-label="Available sizes">
              {sizeCategories.map((size) => (
                <span
                  key={size}
                  className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-stone-600"
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
          className="mt-3 h-10 w-full rounded-lg bg-[#264027] text-sm font-bold text-white hover:bg-[#1f3320]"
        >
          <ShoppingBag className="mr-1.5 h-4 w-4" />
          Buy Now
        </Button>

        {/* Secondary CTA — learn more */}
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            goToDetail();
          }}
          className="mt-2 inline-flex items-center justify-center gap-1 text-xs font-semibold text-[#264027] underline-offset-2 hover:underline"
        >
          Learn more
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

export default PayPickupCard;
