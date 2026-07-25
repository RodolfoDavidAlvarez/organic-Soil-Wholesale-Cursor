import { useMemo, useRef } from "react";
import Autoplay from "embla-carousel-autoplay";
import { motion } from "framer-motion";
import { CheckCircle2, Star } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  AMAZON_REVIEWS,
  amazonReviewsForProduct,
  type AmazonReview,
} from "@/data/amazonReviews";
import { cn } from "@/lib/utils";

function Stars({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${count} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn(
            "h-4 w-4 sm:h-[18px] sm:w-[18px]",
            i < count ? "fill-[#b38a58] text-[#b38a58]" : "fill-transparent text-stone-300",
          )}
          strokeWidth={1.75}
        />
      ))}
    </div>
  );
}

function ReviewCard({
  review,
  showProductTag,
}: {
  review: AmazonReview;
  showProductTag: boolean;
}) {
  return (
    <article
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-[0_10px_36px_-20px_rgba(38,64,39,0.45)] ring-1 ring-[#264027]/10",
        review.photo ? "sm:flex-row" : "",
      )}
    >
      {review.photo ? (
        <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-stone-100 sm:aspect-auto sm:w-[42%] sm:min-h-[260px]">
          <img
            src={review.photo}
            alt={`${review.name} — ${review.product} customer photo`}
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        </div>
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col justify-between p-5 sm:p-6">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <Stars count={review.stars} />
            {review.verifiedPurchase ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#eef3eb] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#264027]">
                <CheckCircle2 className="h-3 w-3" />
                Verified
              </span>
            ) : null}
          </div>
          <h3 className="mt-3 font-heading text-lg font-bold leading-snug text-[#264027] sm:text-xl">
            {review.title}
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-stone-600 sm:text-[15px]">
            “{review.quote}”
          </p>
        </div>
        <div className="mt-5 flex items-end justify-between gap-3 border-t border-stone-100 pt-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-stone-900">{review.name}</p>
            <p className="mt-0.5 text-[11px] font-medium text-stone-500">Amazon customer review</p>
          </div>
          {showProductTag ? (
            <span className="shrink-0 rounded-full bg-[#eef3eb] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#264027]">
              {review.product}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}

type Props = {
  /** When set, only show reviews for that website product id. */
  productId?: number;
  productName?: string;
  /** Compact padding for embedding under a PDP buy box. */
  variant?: "home" | "pdp";
  className?: string;
};

export default function AmazonReviewCarousel({
  productId,
  productName,
  variant = "home",
  className,
}: Props) {
  const reviews = useMemo(
    () => (productId != null ? amazonReviewsForProduct(productId) : AMAZON_REVIEWS),
    [productId],
  );

  const autoplay = useRef(
    Autoplay({
      delay: variant === "pdp" ? 4800 : 5200,
      stopOnInteraction: false,
      stopOnMouseEnter: true,
    }),
  );

  if (reviews.length === 0) return null;

  const isPdp = variant === "pdp";
  const headingProduct = productName || reviews[0]?.product;

  return (
    <section
      className={cn(
        "relative overflow-hidden",
        isPdp
          ? "rounded-2xl border border-[#264027]/12 bg-gradient-to-br from-[#f7f4ef] via-white to-[#eef3eb] py-5 sm:py-6"
          : "bg-gradient-to-b from-[#f7f4ef] via-white to-[#eef3eb] py-10 md:py-14",
        className,
      )}
    >
      {!isPdp ? (
        <>
          <div
            className="pointer-events-none absolute -left-24 top-10 h-56 w-56 rounded-full bg-[#b38a58]/15 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-[#264027]/10 blur-3xl"
            aria-hidden
          />
        </>
      ) : null}

      <div className={cn("relative mx-auto px-4", isPdp ? "max-w-none" : "container max-w-6xl")}>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.45 }}
          className={cn("mb-5 text-center md:mb-7", isPdp && "mb-4 text-left md:mb-5")}
        >
          <div className={cn("mb-2 inline-flex items-center gap-3", isPdp && "mb-1.5")}>
            {!isPdp ? <span className="h-px w-8 bg-[#b38a58]/40" /> : null}
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#b38a58]">
              {isPdp ? "Amazon reviews" : "What customers are saying"}
            </p>
            {!isPdp ? <span className="h-px w-8 bg-[#b38a58]/40" /> : null}
          </div>
          <h2
            className={cn(
              "font-heading font-bold tracking-tight text-stone-900",
              isPdp ? "text-lg sm:text-xl" : "text-2xl md:text-3xl",
            )}
          >
            {isPdp
              ? `What people say about ${headingProduct}`
              : "Real Amazon reviews. Real results."}
          </h2>
          {!isPdp ? (
            <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-stone-600">
              Stars, names, and words from people who bought Soil Seed &amp; Water on Amazon.
            </p>
          ) : (
            <p className="mt-1 text-sm text-stone-600">
              {reviews.length} real customer review{reviews.length === 1 ? "" : "s"}
            </p>
          )}
        </motion.div>

        <Carousel
          opts={{
            align: "start",
            loop: reviews.length > 1,
            containScroll: "trimSnaps",
          }}
          plugins={reviews.length > 1 ? [autoplay.current] : []}
          className="w-full"
        >
          <CarouselContent className="-ml-3 md:-ml-4">
            {reviews.map((review) => (
              <CarouselItem
                key={review.id}
                className={cn(
                  "pl-3 md:pl-4",
                  isPdp
                    ? "basis-[92%] sm:basis-[80%] md:basis-[70%]"
                    : "basis-[88%] sm:basis-[70%] md:basis-[58%] lg:basis-[48%]",
                )}
              >
                <ReviewCard review={review} showProductTag={!isPdp} />
              </CarouselItem>
            ))}
          </CarouselContent>
          {reviews.length > 1 ? (
            <>
              <CarouselPrevious className="left-1 top-[42%] hidden h-10 w-10 border-[#264027]/15 bg-white/95 shadow-md sm:inline-flex md:left-2" />
              <CarouselNext className="right-1 top-[42%] hidden h-10 w-10 border-[#264027]/15 bg-white/95 shadow-md sm:inline-flex md:right-2" />
            </>
          ) : null}
        </Carousel>

        {reviews.length > 1 ? (
          <p className="mt-3 text-center text-[11px] text-stone-500 sm:hidden">Swipe for more reviews</p>
        ) : null}
      </div>
    </section>
  );
}
