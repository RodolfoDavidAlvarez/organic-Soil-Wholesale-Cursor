import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Autoplay from "embla-carousel-autoplay";
import { motion } from "framer-motion";
import { CheckCircle2, Quote, Star } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import {
  AMAZON_REVIEWS,
  amazonReviewsForProduct,
  type AmazonReview,
} from "@/data/amazonReviews";
import { FIELD_PROOF_IMAGES } from "@/data/fieldProofImages";
import { cn } from "@/lib/utils";

function Stars({ count, size = "md" }: { count: number; size?: "sm" | "md" }) {
  const cls = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4 sm:h-[18px] sm:w-[18px]";
  return (
    <div className="flex items-center gap-0.5" aria-label={`${count} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn(
            cls,
            i < count ? "fill-[#b38a58] text-[#b38a58]" : "fill-transparent text-stone-300",
          )}
          strokeWidth={1.75}
        />
      ))}
    </div>
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function Avatar({ name }: { name: string }) {
  return (
    <span
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#264027] text-[11px] font-bold tracking-wide text-[#f7f4ef] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]"
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}

function ProductChip({ label, tone = "light" }: { label: string; tone?: "light" | "dark" }) {
  return (
    <span
      className={cn(
        "max-w-[9.5rem] truncate rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]",
        tone === "light"
          ? "bg-[#eef3eb] text-[#264027]"
          : "bg-white/15 text-[#f7f4ef] ring-1 ring-white/20",
      )}
    >
      {label}
    </span>
  );
}

/** Image-forward card — photo always on top so every slide matches. */
function PhotoReviewCard({ review }: { review: AmazonReview }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[1.35rem] bg-white shadow-[0_14px_40px_-24px_rgba(38,64,39,0.55)] ring-1 ring-[#264027]/12 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_48px_-22px_rgba(38,64,39,0.5)]">
      <div className="relative aspect-[5/4] w-full overflow-hidden bg-stone-100">
        <img
          src={review.photo}
          alt={`${review.name} — ${review.product} customer photo`}
          className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.04]"
          loading="lazy"
          decoding="async"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
        <div className="absolute left-3 top-3">
          <ProductChip label={review.product} tone="dark" />
        </div>
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
          <Stars count={review.stars} size="sm" />
          {review.verifiedPurchase ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#264027] shadow-sm">
              <CheckCircle2 className="h-3 w-3 text-[#3c5233]" />
              Verified
            </span>
          ) : null}
        </div>
      </div>
      <div className="relative flex flex-1 flex-col justify-between p-4 sm:p-5">
        <Quote
          className="pointer-events-none absolute right-3 top-3 h-8 w-8 text-[#264027]/[0.07]"
          aria-hidden
        />
        <div className="relative">
          <h3 className="pr-6 font-heading text-base font-bold leading-snug tracking-tight text-[#264027] sm:text-[1.05rem]">
            {review.title}
          </h3>
          <p className="mt-2 line-clamp-3 text-[13.5px] leading-relaxed text-stone-600 sm:line-clamp-4">
            “{review.quote}”
          </p>
        </div>
        <div className="mt-4 flex items-center gap-2.5 border-t border-stone-100/90 pt-3">
          <Avatar name={review.name} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-stone-900">{review.name}</p>
            <p className="text-[11px] text-stone-500">Amazon customer</p>
          </div>
        </div>
      </div>
    </article>
  );
}

/** Dense quote-only card — no empty media column. */
function QuoteReviewCard({
  review,
  showProductTag,
}: {
  review: AmazonReview;
  showProductTag: boolean;
}) {
  return (
    <article className="relative flex h-full min-h-[220px] flex-col justify-between overflow-hidden rounded-[1.35rem] bg-[#264027] p-4 text-[#f7f4ef] shadow-[0_14px_36px_-22px_rgba(38,64,39,0.65)] sm:min-h-[236px] sm:p-5">
      <div
        className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full bg-[#b38a58]/20 blur-2xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-10 left-8 h-24 w-24 rounded-full bg-white/10 blur-2xl"
        aria-hidden
      />
      <Quote
        className="pointer-events-none absolute right-3 top-3 h-10 w-10 text-white/[0.08]"
        aria-hidden
      />

      <div className="relative">
        <div className="flex flex-wrap items-center gap-2">
          <Stars count={review.stars} size="sm" />
          {review.verifiedPurchase ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-[#e8dcc8]">
              <CheckCircle2 className="h-3 w-3" />
              Verified
            </span>
          ) : null}
        </div>
        <h3 className="mt-3 pr-8 font-heading text-[15px] font-bold leading-snug tracking-tight text-white sm:text-base">
          {review.title}
        </h3>
        <p className="mt-2 line-clamp-4 text-[13.5px] leading-relaxed text-white/78">
          “{review.quote}”
        </p>
      </div>

      <div className="relative mt-4 flex items-center justify-between gap-2 border-t border-white/12 pt-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#b38a58] text-[11px] font-bold tracking-wide text-[#264027]">
            {initials(review.name)}
          </span>
          <p className="truncate text-sm font-semibold text-white">{review.name}</p>
        </div>
        {showProductTag ? <ProductChip label={review.product} tone="dark" /> : null}
      </div>
    </article>
  );
}

function CarouselDots({
  count,
  selected,
  onSelect,
}: {
  count: number;
  selected: number;
  onSelect: (index: number) => void;
}) {
  if (count <= 1) return null;
  return (
    <div className="mt-3.5 flex items-center justify-center gap-1.5" role="tablist" aria-label="Review slides">
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          role="tab"
          aria-selected={i === selected}
          aria-label={`Go to review ${i + 1}`}
          onClick={() => onSelect(i)}
          className={cn(
            "h-1.5 rounded-full transition-all duration-300",
            i === selected ? "w-5 bg-[#264027]" : "w-1.5 bg-[#264027]/25 hover:bg-[#264027]/45",
          )}
        />
      ))}
    </div>
  );
}

/** Continuous marquee — cards stay on screen and keep scrolling; no snap/jump. */
function ReviewMarqueeRow({
  reviews,
  mode,
  showProductTag,
  durationSec,
  cardClass,
  direction = "ltr",
}: {
  reviews: AmazonReview[];
  mode: "photo" | "quote";
  showProductTag: boolean;
  durationSec: number;
  cardClass: string;
  direction?: "ltr" | "rtl";
}) {
  if (reviews.length === 0) return null;

  // Always two identical halves so translateX(-50%) loops seamlessly.
  const loop = [...reviews, ...reviews];

  return (
    <div className="relative -mx-4 overflow-hidden sm:mx-0">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-[#eef3eb] via-[#eef3eb]/90 to-transparent sm:w-14" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-[#ffffff] via-[#ffffff]/90 to-transparent sm:w-14" />
      <div
        className={cn(
          "review-marquee flex w-max gap-3 py-1 sm:gap-4",
          direction === "rtl" && "review-marquee--rtl",
        )}
        style={{ animationDuration: `${durationSec}s` }}
      >
        {loop.map((review, i) => (
          <div
            key={`${review.id}-${i}`}
            className={cn("shrink-0", cardClass)}
            aria-hidden={i >= reviews.length}
          >
            {mode === "photo" ? (
              <PhotoReviewCard review={review} />
            ) : (
              <QuoteReviewCard review={review} showProductTag={showProductTag} />
            )}
          </div>
        ))}
      </div>
      <style>{`
        .review-marquee {
          animation-name: amazon-review-marquee;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        .review-marquee--rtl {
          animation-direction: reverse;
        }
        .review-marquee:hover {
          animation-play-state: paused;
        }
        @keyframes amazon-review-marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .review-marquee {
            animation: none !important;
            flex-wrap: wrap;
            width: 100% !important;
            max-width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}

function FieldPhotoStrip() {
  const doubled = [...FIELD_PROOF_IMAGES, ...FIELD_PROOF_IMAGES];
  return (
    <div className="relative mt-10 overflow-hidden border-t border-[#264027]/10 pt-8 md:mt-12 md:pt-10">
      <div className="mb-4 flex flex-col items-center gap-1 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#b38a58]">
          In the field
        </p>
        <p className="text-sm font-semibold text-[#264027]">Arizona jobs · soil in the ground</p>
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-[#eef3eb] via-[#eef3eb]/85 to-transparent sm:w-20" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-[#e4ebe0] via-[#e4ebe0]/85 to-transparent sm:w-20" />
      <div
        className="field-marquee flex w-max gap-3 py-1 [animation:amazon-field-marquee_52s_linear_infinite] hover:[animation-play-state:paused]"
      >
        {doubled.map((img, i) => (
          <div
            key={`${img.src}-${i}`}
            className="relative h-[7.25rem] w-44 shrink-0 overflow-hidden rounded-2xl bg-stone-200 shadow-[0_8px_20px_-12px_rgba(38,64,39,0.45)] ring-1 ring-[#264027]/10 sm:h-36 sm:w-52"
          >
            <img
              src={img.src}
              alt={img.alt}
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
            <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10" />
          </div>
        ))}
      </div>
      <style>{`
        @keyframes amazon-field-marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .field-marquee { animation: none !important; }
        }
      `}</style>
    </div>
  );
}

/** Spread products so the quote carousel doesn't clump same SKU. */
function interleaveByProduct(reviews: AmazonReview[]): AmazonReview[] {
  const buckets = new Map<string, AmazonReview[]>();
  for (const review of reviews) {
    const key = review.product;
    const list = buckets.get(key) ?? [];
    list.push(review);
    buckets.set(key, list);
  }
  const queues = [...buckets.values()];
  const out: AmazonReview[] = [];
  let added = true;
  while (added) {
    added = false;
    for (const q of queues) {
      const next = q.shift();
      if (next) {
        out.push(next);
        added = true;
      }
    }
  }
  return out;
}

type Props = {
  productId?: number;
  productName?: string;
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

  const photoReviews = useMemo(
    () => reviews.filter((r) => Boolean(r.photo)).sort((a, b) => b.stars - a.stars),
    [reviews],
  );
  const quoteReviews = useMemo(
    () => interleaveByProduct(reviews.filter((r) => !r.photo).sort((a, b) => b.stars - a.stars)),
    [reviews],
  );
  const pdpAutoplay = useRef(
    Autoplay({ delay: 4800, stopOnInteraction: false, stopOnMouseEnter: true }),
  );
  const [pdpApi, setPdpApi] = useState<CarouselApi>();
  const [pdpSelected, setPdpSelected] = useState(0);
  const [pdpSnaps, setPdpSnaps] = useState(0);

  const onPdpSelect = useCallback((embla: CarouselApi) => {
    if (!embla) return;
    setPdpSelected(embla.selectedScrollSnap());
    setPdpSnaps(embla.scrollSnapList().length);
  }, []);

  useEffect(() => {
    if (!pdpApi) return;
    onPdpSelect(pdpApi);
    pdpApi.on("reInit", onPdpSelect);
    pdpApi.on("select", onPdpSelect);
    return () => {
      pdpApi.off("reInit", onPdpSelect);
      pdpApi.off("select", onPdpSelect);
    };
  }, [pdpApi, onPdpSelect]);

  if (reviews.length === 0) return null;

  const isPdp = variant === "pdp";
  const headingProduct = productName || reviews[0]?.product;
  const avgStars =
    Math.round((reviews.reduce((sum, r) => sum + r.stars, 0) / reviews.length) * 10) / 10;
  const fiveStarCount = reviews.filter((r) => r.stars === 5).length;
  const productCount = new Set(reviews.map((r) => r.product)).size;

  // PDP: one carousel, but each slide uses the matching card type (no empty media column).
  if (isPdp) {
    return (
      <section
        className={cn(
          "relative overflow-hidden rounded-[1.35rem] border border-[#264027]/12 bg-gradient-to-br from-[#f7f4ef] via-white to-[#eef3eb] py-5 sm:py-6",
          className,
        )}
      >
        <div className="relative mx-auto max-w-none px-4">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div className="text-left">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#b38a58]">
                Amazon reviews
              </p>
              <h2 className="mt-1 font-heading text-lg font-bold tracking-tight text-stone-900 sm:text-xl">
                What people say about {headingProduct}
              </h2>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs shadow-sm ring-1 ring-[#264027]/10">
              <Stars count={5} size="sm" />
              <span className="font-semibold text-stone-900">{avgStars}</span>
              <span className="text-stone-400">·</span>
              <span className="text-stone-600">{reviews.length} reviews</span>
            </div>
          </div>
          <Carousel
            setApi={setPdpApi}
            opts={{ align: "start", loop: reviews.length > 1, containScroll: "trimSnaps" }}
            plugins={reviews.length > 1 ? [pdpAutoplay.current] : []}
            className="w-full"
          >
            <CarouselContent className="-ml-3 md:-ml-4">
              {reviews.map((review) => (
                <CarouselItem
                  key={review.id}
                  className="basis-[92%] pl-3 sm:basis-[80%] md:basis-[70%] md:pl-4"
                >
                  {review.photo ? (
                    <PhotoReviewCard review={review} />
                  ) : (
                    <QuoteReviewCard review={review} showProductTag={false} />
                  )}
                </CarouselItem>
              ))}
            </CarouselContent>
            {reviews.length > 1 ? (
              <>
                <CarouselPrevious className="left-1 top-[42%] hidden h-10 w-10 border-[#264027]/15 bg-white/95 text-[#264027] shadow-md sm:inline-flex md:left-2" />
                <CarouselNext className="right-1 top-[42%] hidden h-10 w-10 border-[#264027]/15 bg-white/95 text-[#264027] shadow-md sm:inline-flex md:right-2" />
              </>
            ) : null}
          </Carousel>
          <CarouselDots
            count={pdpSnaps}
            selected={pdpSelected}
            onSelect={(index) => pdpApi?.scrollTo(index)}
          />
        </div>
      </section>
    );
  }

  // Home: two carousels + slim field-photo strip.
  return (
    <section
      className={cn(
        "relative overflow-hidden bg-[linear-gradient(180deg,#eef3eb_0%,#ffffff_40%,#e4ebe0_100%)] py-12 md:py-16",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-24 top-16 h-64 w-64 rounded-full bg-[#b38a58]/16 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-[#264027]/10 blur-3xl"
        aria-hidden
      />

      <div className="container relative mx-auto max-w-6xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8 text-center md:mb-10"
        >
          <div className="mb-3 inline-flex items-center gap-3">
            <span className="h-px w-8 bg-[#b38a58]/45" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#b38a58]">
              Customer love
            </p>
            <span className="h-px w-8 bg-[#b38a58]/45" />
          </div>
          <h2 className="font-heading text-3xl font-bold tracking-tight text-[#1c2e1d] md:text-4xl">
            Reviews from people who used it.
          </h2>
          <p className="mx-auto mt-2.5 max-w-lg text-sm leading-relaxed text-stone-600 md:text-[15px]">
            Stars, names, and photos from Amazon buyers — plus Arizona crews putting soil in the ground.
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3.5 py-2 text-sm shadow-sm ring-1 ring-[#264027]/10">
              <Stars count={5} size="sm" />
              <span className="font-semibold text-stone-900">{avgStars} avg</span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#264027] px-3.5 py-2 text-sm font-semibold text-white shadow-sm">
              {fiveStarCount}
              <span className="font-medium text-white/75">five-star reviews</span>
            </div>
            <div className="inline-flex items-center rounded-full bg-white/90 px-3.5 py-2 text-sm font-medium text-stone-600 shadow-sm ring-1 ring-[#264027]/10">
              Across {productCount} products
            </div>
          </div>
        </motion.div>

        {photoReviews.length > 0 ? (
          <div className="mb-9 md:mb-11">
            <div className="mb-4 flex items-end justify-between gap-3 px-0.5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#b38a58]">
                  With customer photos
                </p>
                <p className="mt-1 font-heading text-lg font-bold tracking-tight text-[#264027]">
                  See what they grew
                </p>
              </div>
              <p className="hidden rounded-full bg-white/80 px-2.5 py-1 text-xs font-medium text-stone-500 ring-1 ring-[#264027]/8 sm:block">
                {photoReviews.length} photo reviews
              </p>
            </div>
            <ReviewMarqueeRow
              reviews={photoReviews}
              mode="photo"
              showProductTag
              durationSec={48}
              cardClass="w-[16.5rem] sm:w-[18.5rem] md:w-[20rem]"
            />
          </div>
        ) : null}

        {quoteReviews.length > 0 ? (
          <div>
            <div className="mb-4 flex items-end justify-between gap-3 px-0.5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#b38a58]">
                  From the reviews
                </p>
                <p className="mt-1 font-heading text-lg font-bold tracking-tight text-[#264027]">
                  What they’re saying
                </p>
              </div>
              <p className="hidden rounded-full bg-white/80 px-2.5 py-1 text-xs font-medium text-stone-500 ring-1 ring-[#264027]/8 sm:block">
                {quoteReviews.length} quotes
              </p>
            </div>
            <ReviewMarqueeRow
              reviews={quoteReviews}
              mode="quote"
              showProductTag
              durationSec={56}
              direction="rtl"
              cardClass="w-[15.5rem] sm:w-[17.5rem] md:w-[18.5rem]"
            />
          </div>
        ) : null}

        <FieldPhotoStrip />
      </div>
    </section>
  );
}
