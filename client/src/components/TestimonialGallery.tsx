import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { OptimizedImage } from "@/components/OptimizedImage";
import { Quote, MapPin } from "lucide-react";

type Testimonial = {
  id: number;
  name: string;
  company: string;
  location: string;
  product: string;
  title: string;
  body: string;
  media: string;
  mediaType: "image" | "video";
  poster?: string;
  mediaFit?: "cover" | "contain";
};

const TESTIMONIALS: Testimonial[] = [
  {
    id: 1,
    name: "Phoenix Grower",
    company: "Home Garden Trial",
    location: "Phoenix, AZ",
    product: "Soil Craft",
    title: "Same seed. Same water. Better soil.",
    body: "Both plants were started from the same seeds, same watering, same sunlight. The fuller, healthier plant was grown in your soil. Loving the product.",
    media: "/images/testimonials/optimized/client-testimonial-soil-craft-card.jpg",
    mediaType: "image",
    mediaFit: "cover",
  },
  {
    id: 2,
    name: "Pat Bernard",
    company: "The Bernard Company",
    location: "Yarnell, AZ",
    product: "Premium Nature's Blanket",
    title: "Product looked outstanding.",
    body: "Real delivery photo from a customer project using Premium Nature's Blanket. The note was simple: the product looked outstanding.",
    media: "/images/testimonials/database/pat-premium-nature-blanket-delivery-20c4ba70-07da-4986-99de-fc3745a0b72f.jpeg",
    mediaType: "image",
    mediaFit: "cover",
  },
  {
    id: 3,
    name: "Shane McCandless",
    company: "Trinity Landscaping",
    location: "Arizona",
    product: "Landscape project material",
    title: "Finished project proof.",
    body: "The customer sent finished project photos after the job was done. This is the kind of field proof landscapers need before trusting a supplier.",
    media: "/images/testimonials/database/shane-mccandless-20786956-cdcd-4608-b597-bedcad734e5f-20786956-cdcd-4608-b597-bedcad734e5f.jpeg",
    mediaType: "image",
    mediaFit: "cover",
  },
  {
    id: 4,
    name: "Flower of the Gods Nursery",
    company: "Horticulture",
    location: "Phoenix, AZ",
    product: "OMRI Mulch + Compost",
    title: "OMRI certified organic.",
    body: "Customer-facing post showing a fresh lush batch of aged mulch enriched with dairy compost.",
    media: "/images/testimonials/optimized/flower-of-the-gods-mulch-post-card.jpg",
    mediaType: "image",
    mediaFit: "contain",
  },
  {
    id: 5,
    name: "Eli Valde",
    company: "Mountain Country Landscaping",
    location: "Prescott, AZ",
    product: "Turf Daddy",
    title: "Before and after turf results.",
    body: "Before-and-after Turf Daddy result from a Mountain Country job. Visual proof for overseeding and lawn recovery.",
    media: "/images/testimonials/local/turf-daddy-before-after.jpg",
    mediaType: "image",
    mediaFit: "contain",
  },
  {
    id: 6,
    name: "Mountain Country Landscaping",
    company: "Delivery Day",
    location: "Prescott, AZ",
    product: "Top Soil Blend",
    title: "Top soil delivery in the field.",
    body: "Real delivery video showing product staged and delivered for customer work.",
    media: "/images/testimonials/optimized/top-soil-delivery-preview.mp4",
    mediaType: "video",
    poster: "/images/testimonials/optimized/top-soil-delivery-poster.jpg",
    mediaFit: "cover",
  },
  {
    id: 7,
    name: "Pat Bernard",
    company: "The Bernard Company",
    location: "Yarnell, AZ",
    product: "Clean Wood Fiber Blend",
    title: "Wood fiber + compost + castings.",
    body: "Clean wood fiber blended with worm castings and dairy compost. Moving proof of bulk material quality.",
    media: "/images/testimonials/optimized/clean-wood-fiber-preview.mp4",
    mediaType: "video",
    poster: "/images/testimonials/optimized/clean-wood-fiber-poster.jpg",
    mediaFit: "cover",
  },
  {
    id: 8,
    name: "Shane McCandless",
    company: "Trinity Landscaping",
    location: "Arizona",
    product: "Bulk delivery",
    title: "Material staged on-site.",
    body: "Shane's crew received a clean pallet drop and went straight to install. No re-staging, no rejected loads.",
    media: "/images/testimonials/database/shane-mccandless-73bc5a75-64b7-4c9c-8f29-38ab6cda2568-73bc5a75-64b7-4c9c-8f29-38ab6cda2568.jpeg",
    mediaType: "image",
    mediaFit: "cover",
  },
  {
    id: 9,
    name: "Shane McCandless",
    company: "Trinity Landscaping",
    location: "Arizona",
    product: "Job-site progress",
    title: "Mid-install proof.",
    body: "Crew shot during install — the product spreads clean, holds shape, and finishes the design line cleanly.",
    media: "/images/testimonials/database/shane-mccandless-fc52afbc-dd8d-4d3d-a7a7-e70d2f63918c-fc52afbc-dd8d-4d3d-a7a7-e70d2f63918c.jpeg",
    mediaType: "image",
    mediaFit: "cover",
  },
  {
    id: 10,
    name: "Shane McCandless",
    company: "Trinity Landscaping",
    location: "Arizona",
    product: "Finished landscape",
    title: "Final walkthrough.",
    body: "Buttoned-up final result. This is how a Trinity Landscaping job closes when the input material does its job.",
    media: "/images/testimonials/database/shane-mccandless-63bf816b-aa04-4008-9828-7894c8e16f15-63bf816b-aa04-4008-9828-7894c8e16f15.jpeg",
    mediaType: "image",
    mediaFit: "cover",
  },
  {
    id: 11,
    name: "Pat Bernard",
    company: "The Bernard Company",
    location: "Yarnell, AZ",
    product: "Premium Nature's Blanket",
    title: "Second delivery shot.",
    body: "Different angle from the same Yarnell project. Material color and consistency match across the load.",
    media: "/images/testimonials/database/pat-premium-nature-blanket-delivery-3bd4aaf4-1c85-4807-ba87-f5a06c2d3385.jpeg",
    mediaType: "image",
    mediaFit: "cover",
  },
  {
    id: 12,
    name: "Overseed Customer",
    company: "Independent contractor",
    location: "Arizona",
    product: "Turf Daddy Overseed",
    title: "Overseed blend, applied.",
    body: "Database submission showing Turf Daddy overseed mix in the field. Lighter customer-submitted graphic.",
    media: "/images/testimonials/database/ef31ba78-0bd1-4d57-b7d1-37a5646faa50-overseed-blend-turf-daddy-3cecd4f7-fc08-44e4-ad04-cf3fee9b141e.jpeg",
    mediaType: "image",
    mediaFit: "cover",
  },
];

function useNearViewport<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [isNear, setIsNear] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsNear(true);
        }
      },
      { rootMargin: "250px 400px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return { ref, isNear };
}

function TestimonialCard({ t }: { t: Testimonial }) {
  const { ref: cardRef, isNear } = useNearViewport<HTMLDivElement>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loadVideo, setLoadVideo] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (!isNear || !loadVideo) {
      v.pause();
      return;
    }

    const play = () => {
      if (!videoRef.current) return;
      videoRef.current.play().catch(() => {});
    };

    play();
    document.addEventListener("touchstart", play, { once: true });
    return () => document.removeEventListener("touchstart", play);
  }, [isNear, loadVideo]);

  const fitClass = t.mediaFit === "contain" ? "object-contain bg-stone-100" : "object-cover";

  return (
    <div
      ref={cardRef}
      onMouseEnter={() => t.mediaType === "video" && setLoadVideo(true)}
      onFocus={() => t.mediaType === "video" && setLoadVideo(true)}
      onClick={() => t.mediaType === "video" && setLoadVideo(true)}
      className="group relative w-[300px] sm:w-[340px] md:w-[380px] shrink-0 overflow-hidden rounded-2xl bg-white shadow-[0_8px_30px_rgba(38,64,39,0.08)] ring-1 ring-stone-200/60 transition-all duration-300 hover:shadow-[0_16px_50px_rgba(38,64,39,0.18)] hover:-translate-y-1"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-stone-50">
        {!isNear ? (
          <div className="h-full w-full animate-pulse bg-gradient-to-br from-stone-100 via-stone-50 to-stone-200" />
        ) : t.mediaType === "video" && loadVideo ? (
          <video
            ref={videoRef}
            src={t.media}
            className={`h-full w-full ${fitClass}`}
            poster={t.poster}
            autoPlay
            muted
            loop
            playsInline
            preload="none"
          />
        ) : (
          <OptimizedImage
            src={t.media}
            alt={`${t.name} — ${t.product}`}
            className={`h-full w-full ${fitClass} transition-transform duration-700 group-hover:scale-105`}
            width={420}
            q={62}
          />
        )}
        {isNear && t.mediaType === "video" && !loadVideo && (
          <button
            type="button"
            className="absolute inset-0 h-full w-full"
            aria-label={`Play ${t.title}`}
            onClick={() => setLoadVideo(true)}
          >
            <OptimizedImage
              src={t.poster ?? t.media}
              alt={`${t.name} — ${t.product}`}
              className={`h-full w-full ${fitClass} transition-transform duration-700 group-hover:scale-105`}
              width={420}
              q={62}
            />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="rounded-full bg-black/55 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-white shadow-lg ring-1 ring-white/30">
                Play video
              </span>
            </span>
          </button>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5 text-white">
          <Quote className="mb-2 h-5 w-5 opacity-80" strokeWidth={2.2} />
          <p className="text-base font-semibold leading-tight drop-shadow">{t.title}</p>
        </div>
      </div>
      <div className="p-5">
        <p className="text-sm leading-relaxed text-stone-700">{t.body}</p>
        <div className="mt-4 flex items-start justify-between gap-3 border-t border-stone-100 pt-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-stone-900">{t.name}</p>
            <p className="truncate text-xs text-stone-500">{t.company}</p>
          </div>
          <div className="shrink-0 text-right">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#264027]/8 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-[#264027]">
              {t.product}
            </span>
            <p className="mt-1 inline-flex items-center gap-1 text-[10px] text-stone-500">
              <MapPin className="h-3 w-3" />
              {t.location}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MarqueeRow({ items, direction, speed }: { items: Testimonial[]; direction: "left" | "right"; speed: number }) {
  const [paused, setPaused] = useState(false);
  const doubled = [...items, ...items];

  return (
    <div
      className="group relative overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-stone-50 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-stone-50 to-transparent" />
      <div
        className="flex gap-5"
        style={{
          width: "max-content",
          animation: `marquee-${direction} ${speed}s linear infinite`,
          animationPlayState: paused ? "paused" : "running",
        }}
      >
        {doubled.map((t, idx) => (
          <TestimonialCard key={`${t.id}-${idx}`} t={t} />
        ))}
      </div>
    </div>
  );
}

function MobileTestimonialCarousel() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const pauseUntilRef = useRef(0);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const advance = () => {
      if (Date.now() < pauseUntilRef.current) return;

      const cards = Array.from(scroller.querySelectorAll<HTMLElement>("[data-mobile-testimonial-card]"));
      if (cards.length < 2) return;

      const current = cards.reduce((closest, card, index) => {
        const distance = Math.abs(card.offsetLeft - scroller.scrollLeft);
        return distance < closest.distance ? { index, distance } : closest;
      }, { index: 0, distance: Number.POSITIVE_INFINITY });

      const nextIndex = current.index >= cards.length - 1 ? 0 : current.index + 1;
      scroller.scrollTo({
        left: Math.max(cards[nextIndex].offsetLeft - 16, 0),
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
    };

    const intervalId = window.setInterval(advance, prefersReducedMotion ? 6500 : 3600);
    return () => window.clearInterval(intervalId);
  }, []);

  const pause = () => {
    pauseUntilRef.current = Date.now() + 6500;
  };

  return (
    <div className="md:hidden">
      <div
        ref={scrollerRef}
        onPointerDown={pause}
        onTouchStart={pause}
        onWheel={pause}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ scrollPaddingLeft: "1rem" }}
      >
        {TESTIMONIALS.map((t) => (
          <div key={t.id} data-mobile-testimonial-card className="snap-start">
            <TestimonialCard t={t} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TestimonialGallery() {
  const half = Math.ceil(TESTIMONIALS.length / 2);
  const topRow = TESTIMONIALS.slice(0, half);
  const bottomRow = TESTIMONIALS.slice(half);

  return (
    <section className="bg-stone-50 pt-6 pb-10 md:pt-8 md:pb-14">
      <style>{`
        @keyframes marquee-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes marquee-right {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
      `}</style>

      <div className="mx-auto mb-5 max-w-6xl px-4 text-center md:mb-7">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-3"
        >
          <span className="h-px w-8 bg-[#b38a58]/40" />
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#b38a58]">
            Field-tested · Customer-approved
          </p>
          <span className="h-px w-8 bg-[#b38a58]/40" />
        </motion.div>
      </div>

      {/* Desktop: two-row scrolling marquee */}
      <div className="hidden space-y-5 md:block">
        <MarqueeRow items={topRow} direction="left" speed={60} />
        <MarqueeRow items={bottomRow} direction="right" speed={70} />
      </div>

      {/* Mobile: auto-advancing scroll-snap carousel */}
      <MobileTestimonialCarousel />
    </section>
  );
}
