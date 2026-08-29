import { Link } from "wouter";
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

export function DealHubCards({ source = "deals-hub" }: { source?: string }) {
  return (
    <div className="space-y-3 sm:space-y-4">
      {PROMO_BUNDLES.map((deal, index) => (
        <Link key={deal.slug} href={`/offers/${deal.slug}`}>
          <a
            onClick={() =>
              trackEvent(source === "homepage-bundles" ? "Homepage Bundle CTA Clicked" : "Deal Banner Clicked", {
                bundle: deal.slug,
                source,
              })
            }
            className="block cursor-pointer overflow-hidden rounded-[1.25rem] bg-[#153b22] shadow-[0_12px_28px_rgba(21,59,34,0.14)] ring-1 ring-[#183a23]/10 transition hover:shadow-[0_18px_40px_rgba(21,59,34,0.22)]"
          >
            <img
              src={deal.bannerImage}
              alt={deal.heroAlt}
              width={1600}
              height={646}
              className="block h-auto w-full"
              fetchPriority={index === 0 ? "high" : undefined}
            />
          </a>
        </Link>
      ))}
    </div>
  );
}

export { PROMO_BUNDLES };
