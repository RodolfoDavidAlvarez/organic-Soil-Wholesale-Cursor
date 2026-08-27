import { Link } from "wouter";
import { PROMO_BUNDLES, type PromoBundle } from "@shared/promoBundles.js";
import { cn } from "@/lib/utils";

const fmt = (value: number) => `$${value.toFixed(0)}`;

type DealListVariant = "menu" | "page";

type DealRowContentProps = {
  deal: PromoBundle;
  variant?: DealListVariant;
};

export function DealRowContent({ deal, variant = "menu" }: DealRowContentProps) {
  const isPage = variant === "page";

  return (
    <>
      <span className="flex w-full items-baseline justify-between gap-4">
        <span className={cn("font-semibold text-foreground", isPage ? "text-base" : "text-sm")}>
          {deal.shortTitle}
        </span>
        <span
          className={cn(
            "shrink-0 font-semibold tabular-nums text-foreground",
            isPage ? "text-base" : "text-sm",
          )}
        >
          {fmt(deal.salePrice)}
        </span>
      </span>
      <span className={cn("leading-snug text-muted-foreground", isPage ? "text-sm" : "text-xs")}>
        {deal.listCaption}
      </span>
    </>
  );
}

type DealRowProps = {
  deal: PromoBundle;
  variant?: DealListVariant;
  className?: string;
  onClick?: () => void;
};

export function DealRow({ deal, variant = "menu", className, onClick }: DealRowProps) {
  const isPage = variant === "page";

  return (
    <Link href={`/offers/${deal.slug}`}>
      <div
        onClick={onClick}
        className={cn(
          "flex w-full cursor-pointer flex-col justify-center text-left transition-colors duration-200",
          isPage
            ? "min-h-[72px] gap-1 px-4 py-4 hover:bg-[#183a23]/5 active:bg-[#183a23]/10 sm:px-5"
            : "min-h-11 gap-0.5 rounded-lg px-3 py-2.5 hover:bg-primary/5 hover:text-primary active:bg-primary/10",
          className,
        )}
      >
        <DealRowContent deal={deal} variant={variant} />
      </div>
    </Link>
  );
}

type DealListProps = {
  variant?: DealListVariant;
  onNavigate?: () => void;
  className?: string;
};

export default function DealList({ variant = "menu", onNavigate, className }: DealListProps) {
  const isPage = variant === "page";

  return (
    <ul
      className={cn(
        isPage ? "overflow-hidden rounded-2xl border border-[#dfe5dc] bg-white" : "space-y-0.5",
        className,
      )}
    >
      {PROMO_BUNDLES.map((deal, index) => (
        <li key={deal.slug} className={cn(isPage && index > 0 && "border-t border-[#dfe5dc]")}>
          <DealRow deal={deal} variant={variant} onClick={onNavigate} />
        </li>
      ))}
    </ul>
  );
}

export { PROMO_BUNDLES };
