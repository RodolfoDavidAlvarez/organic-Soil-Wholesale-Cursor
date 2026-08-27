import { Link } from "wouter";
import { ShoppingBag } from "lucide-react";
import { PROMO_BUNDLES, promoBundleCartItem, type PromoBundle } from "@shared/promoBundles.js";
import { cn } from "@/lib/utils";
import { useQuoteCart, type CartItem } from "@/contexts/QuoteCartContext";
import { useToast } from "@/components/ui/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { trackEvent } from "@/lib/analytics";

export const fmtDealPrice = (value: number) => `$${value.toFixed(0)}`;

export function useAddDeal() {
  const { addItem, openDrawer } = useQuoteCart();
  const { toast } = useToast();

  return (offer: PromoBundle) => {
    addItem(promoBundleCartItem(offer) as CartItem);
    trackEvent("Garden Bundle Added", { bundle: offer.slug, value: offer.salePrice, source: "deals-hub" });
    toast({
      title: "Added to your order",
      description: `${offer.title} · ${fmtDealPrice(offer.salePrice)} Phoenix pickup.`,
      duration: 4500,
      action: (
        <ToastAction
          altText="View order"
          onClick={() => openDrawer()}
          className="border-[#183a23]/25 bg-[#183a23] text-white hover:bg-[#0d2917] hover:text-white"
        >
          View order
        </ToastAction>
      ),
    });
    openDrawer();
  };
}

type DealRowContentProps = {
  deal: PromoBundle;
  showCaption?: boolean;
};

export function DealRowContent({ deal, showCaption = false }: DealRowContentProps) {
  return (
    <>
      <span className="flex w-full items-baseline justify-between gap-4">
        <span className="text-sm font-semibold text-foreground">{deal.shortTitle}</span>
        <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
          {fmtDealPrice(deal.salePrice)}
        </span>
      </span>
      {showCaption ? (
        <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{deal.listCaption}</span>
      ) : null}
    </>
  );
}

type DealRowProps = {
  deal: PromoBundle;
  showCaption?: boolean;
  className?: string;
  onClick?: () => void;
};

export function DealRow({ deal, showCaption = false, className, onClick }: DealRowProps) {
  return (
    <Link href={`/offers/${deal.slug}`}>
      <div
        onClick={onClick}
        className={cn(
          "flex min-h-11 w-full cursor-pointer flex-col justify-center rounded-lg px-3 py-2.5 text-left transition-colors duration-200 hover:bg-primary/5 hover:text-primary active:bg-primary/10",
          className,
        )}
      >
        <DealRowContent deal={deal} showCaption={showCaption} />
      </div>
    </Link>
  );
}

type DealListProps = {
  showCaption?: boolean;
  onNavigate?: () => void;
  className?: string;
};

export default function DealList({ showCaption = false, onNavigate, className }: DealListProps) {
  return (
    <ul className={cn("space-y-0.5", className)}>
      {PROMO_BUNDLES.map((deal) => (
        <li key={deal.slug}>
          <DealRow deal={deal} showCaption={showCaption} onClick={onNavigate} />
        </li>
      ))}
    </ul>
  );
}

export function DealHubCards() {
  const addDeal = useAddDeal();

  return (
    <div className="space-y-3 sm:space-y-4">
      {PROMO_BUNDLES.map((deal, index) => (
        <article
          key={deal.slug}
          className="relative overflow-hidden rounded-[1.5rem] bg-[#153b22] text-white shadow-[0_16px_36px_rgba(21,59,34,0.18)]"
        >
          <Link href={`/offers/${deal.slug}`} className="block">
            <img
              src={deal.bannerImage}
              alt=""
              className="h-[11.25rem] w-full object-cover object-left sm:h-[13.5rem] lg:h-[15.25rem]"
              fetchPriority={index === 0 ? "high" : undefined}
            />
            <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#102818] via-[#102818]/35 to-transparent" />
            <span className="pointer-events-none absolute inset-y-0 right-0 w-[42%] bg-gradient-to-l from-[#102818] to-transparent" />
          </Link>
          <div className="absolute inset-x-0 bottom-0 z-10 p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <Link href={`/offers/${deal.slug}`} className="min-w-0 sm:max-w-md">
                <h2 className="font-heading text-xl font-bold leading-tight sm:text-2xl">{deal.shortTitle}</h2>
                <p className="mt-1 text-sm leading-5 text-white/80">{deal.listCaption}</p>
              </Link>
              <div className="flex items-center justify-between gap-3 sm:justify-end">
                <p className="font-heading text-3xl font-bold tabular-nums text-[#e9c66c] sm:text-4xl">
                  {fmtDealPrice(deal.salePrice)}
                </p>
                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    addDeal(deal);
                  }}
                  className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-[#e9c66c] px-5 text-sm font-extrabold text-[#183a23] transition hover:bg-[#f1d6a6]"
                >
                  <ShoppingBag className="h-4 w-4" />
                  Buy Now
                </button>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

export { PROMO_BUNDLES };
