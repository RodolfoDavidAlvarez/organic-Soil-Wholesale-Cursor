import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import SEO from "@/components/layout/SEO";
import {
  ArrowRight,
  MapPin,
  ChevronRight,
  Package,
  Box,
  Container,
  ArrowUpRight,
  Building2,
  CalendarDays,
  Clock3,
  Compass,
  Phone,
  Sprout,
} from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { CUSTOMER_SUPPORT_PHONE_DISPLAY, CUSTOMER_SUPPORT_PHONE_TEL, PHOENIX_YARD_DIRECTIONS_URL, PHOENIX_YARD_ENTRANCE_COORDINATES } from "@/config/contact";
import { generateProductSlug } from "@/utils/generateSlug";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { OptimizedImage } from "@/components/OptimizedImage";
import DeferredMount from "@/components/DeferredMount";
import LazyYouTube from "@/components/LazyYouTube";
import { lazy, Suspense, useEffect, useState } from "react";

const AmazonReviewCarousel = lazy(() => import("@/components/AmazonReviewCarousel"));

function MobileResultsProof() {
  const [shouldLoad, setShouldLoad] = useState(false);
  const [loadState, setLoadState] = useState<"loading" | "loaded" | "error">("loading");

  useEffect(() => {
    const timerId = window.setTimeout(() => setShouldLoad(true), 1000);
    return () => window.clearTimeout(timerId);
  }, []);

  return (
    <figure className="relative aspect-[160/87] overflow-hidden rounded-2xl bg-gradient-to-br from-[#e8efe3] via-[#f5efe5] to-[#dbe7d4] shadow-2xl ring-1 ring-white/10">
      {loadState === "loading" && (
        <div className="absolute inset-0 overflow-hidden" role="status" aria-live="polite">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/55 to-transparent motion-safe:animate-pulse motion-reduce:animate-none" />
          <div className="absolute inset-x-0 top-0 flex justify-between p-3" aria-hidden="true">
            <span className="rounded-full bg-[#264027]/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white">Before</span>
            <span className="rounded-full bg-[#b38a58]/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white">After</span>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-2 text-xs font-semibold text-[#264027] shadow-sm ring-1 ring-[#264027]/10">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#264027]/25 border-t-[#264027] motion-reduce:animate-none" aria-hidden="true" />
              Loading customer result…
            </span>
          </div>
        </div>
      )}
      {shouldLoad && loadState !== "error" ? (
        <img
          src="/images/performance/home-results-640.webp"
          srcSet="/images/performance/home-results-640.webp 640w, /images/performance/home-results-768.webp 768w, /images/performance/home-results-1280.webp 1280w"
          sizes="calc(100vw - 2rem)"
          alt="Turf Daddy before-and-after lawn transformation"
          width="640"
          height="348"
          loading="lazy"
          decoding="async"
          onLoad={() => setLoadState("loaded")}
          onError={() => setLoadState("error")}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 motion-reduce:transition-none ${loadState === "loaded" ? "opacity-100" : "opacity-0"}`}
        />
      ) : null}
      {loadState === "error" && (
        <div className="absolute inset-0 flex items-center justify-center px-6 text-center" role="status">
          <div>
            <p className="text-sm font-bold text-[#264027]">Customer result photo unavailable</p>
            <p className="mt-1 text-xs text-stone-600">See verified customer stories below.</p>
          </div>
        </div>
      )}
      <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/55 to-transparent px-4 pb-3 pt-10">
        <p className="text-sm font-bold leading-tight text-white">
          Turf Daddy testimonial <span className="text-[#d6c1a0]">before / after results.</span>
        </p>
      </figcaption>
    </figure>
  );
}

type FeaturedProduct = {
  id: number;
  name: string;
  productName?: string;
  slug?: string;
  description?: string;
  category: string;
  imageUrl?: string;
  texturePhotoUrl?: string;
  productType?: string;
};

const Home = () => {
  const [, navigate] = useLocation();

  const [phoenixLat, phoenixLng] = PHOENIX_YARD_ENTRANCE_COORDINATES.split(",");
  const PHOENIX_COORDINATES = { lat: Number(phoenixLat), lng: Number(phoenixLng) };
  const PHOENIX_MAP_EMBED_URL = `https://www.google.com/maps?q=${PHOENIX_COORDINATES.lat},${PHOENIX_COORDINATES.lng}&z=13&output=embed`;
  const PHOENIX_DIRECTIONS_URL = PHOENIX_YARD_DIRECTIONS_URL;

  const sizeCategories = [
    {
      id: "pallet-boxes",
      name: "Pallet of 9 lb bags",
      description: "144 units (36 cases of 4 units)",
      image: "/images/performance/home-size-pallet-boxes-480.webp",
      icon: <Box className="h-6 w-6" />,
    },
    {
      id: "pallet-bags",
      name: "Pallet of 1CF bags",
      description: "50 bags (1CF each)",
      image: "/images/performance/home-size-pallet-bags-480.webp",
      icon: <Package className="h-6 w-6" />,
    },
    {
      id: "bulk",
      name: "Bulk Delivery",
      description: "22-24 tons (soil amendments and concentrates) / 90-110 CYs (potting soil and mulch)",
      image: "/images/performance/home-size-bulk-480.webp",
      icon: <Container className="h-6 w-6" />,
    },
    {
      id: "cubic-yard",
      name: "Buy in Cubic Yard",
      description: "Bulk pickup only",
      image: "/images/performance/home-size-yard-480.webp",
      icon: <Container className="h-6 w-6" />,
    },
  ];

  const handleProductSelect = (product: FeaturedProduct) => {
    const identifier = product.slug || generateProductSlug(product.productType, product.name) || product.id;
    if (product.category === "Mulch") {
      navigate(`/products/mulch/${identifier}`);
    } else {
      navigate(`/products/${identifier}`);
    }
  };

  const featuredProducts: FeaturedProduct[] = [
    {
      id: 1000,
      name: "Dairy Compost",
      productName: "Simon's Gold",
      slug: "simons-gold",
      imageUrl: "/images/performance/home-product-compost-480.webp",
      texturePhotoUrl: "Compost Texture Look.jpg",
      description: "All-natural dairy compost",
      category: "Amendment",
    },
    {
      id: 1001,
      name: "Worm Castings",
      productName: "Mikey's Worm Poop",
      slug: "mikeys-worm-poop",
      imageUrl: "/images/performance/home-product-worm-480.webp",
      texturePhotoUrl: "Worm castting product texture.png",
      description: "All-natural vermicompost",
      category: "Amendment",
    },
    {
      id: 4000,
      name: "Organic Concentrated Blend",
      productName: "SuperBooster",
      slug: "superbooster",
      imageUrl: "/images/performance/home-product-concentrate-480.webp",
      texturePhotoUrl: "Concentrated Organic Amendment Fertilizer Product look.jpeg",
      description: "Organic concentrated amendment",
      category: "Concentrated Amendment",
    },
    {
      id: 1002,
      name: "Biochar",
      productName: "Amazonian Dark Earth",
      slug: "amazonian-dark-earth",
      imageUrl: "/images/performance/home-product-biochar-480.webp",
      texturePhotoUrl: "Biochar Product Texture Look.jpg",
      description: "Biochar mineral amendment",
      category: "Amendment",
    },
  ];

  return (
    <div className="min-h-screen bg-background">

      <SEO
        title="Arizona-Made Organic Compost & Soil | Wholesale Bulk Supplier"
        description="Arizona's leading wholesale supplier of locally-produced organic soil amendments, compost, and potting soil in bulk. Serving landscapers, commercial growers, and farms with pallets, supersacks, and truckloads. Made in Arizona."
        keywords="Arizona compost, Arizona made soil, local compost Arizona, bulk organic soil, wholesale compost, dairy compost bulk, worm castings wholesale, commercial soil supplier, soil amendments wholesale, potting soil bulk, landscaper soil supplier, golf course soil, supersack soil, pallet soil, wholesale plant nutrients, HB 2819"
        canonical="https://organicsoilwholesale.com"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          speakable: {
            "@type": "SpeakableSpecification",
            cssSelector: ["h1", ".speakable"],
          },
          name: "Organic Soil Wholesale - Arizona-Made Premium Bulk Soil Products",
          url: "https://organicsoilwholesale.com",
          potentialAction: {
            "@type": "SearchAction",
            target: "https://organicsoilwholesale.com/products?category={search_term_string}",
            "query-input": "required name=search_term_string",
          },
        }}
      />

      {/* Turf Daddy Hero — Organic Soil Wholesale brand */}
      <section className="relative isolate overflow-hidden bg-stone-900 text-white">
        <div className="absolute inset-0 -z-10">
          <img
            src="/images/performance/home-hero-960.webp"
            srcSet="/images/performance/home-hero-640.webp 640w, /images/performance/home-hero-960.webp 960w, /images/performance/home-hero-1200.webp 1200w"
            sizes="100vw"
            alt="Turf Daddy applied to a lawn"
            width="1200"
            height="1200"
            className="h-full w-full object-cover opacity-40"
            loading="eager"
            decoding="async"
            {...{ fetchpriority: "high" }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-stone-950/90 via-stone-950/70 to-stone-950/40" />
          <div className="absolute inset-x-0 bottom-0 hidden h-32 bg-gradient-to-t from-stone-50 to-transparent lg:block" />
        </div>
        <div className="container mx-auto px-4 py-12 sm:py-16 md:py-28 lg:py-36">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <div className="mb-5">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-stone-300/80">
                  by Soil Seed &amp; Water
                </p>
              </div>
              <h1 className="font-heading text-4xl font-extrabold leading-[1.05] tracking-tight md:text-5xl lg:text-6xl">
                Bulk soil that <span className="text-[#d6c1a0]">grows results</span> you can see.
              </h1>
              <p className="mt-5 max-w-xl text-base text-stone-200 md:text-lg">
                Dairy compost, worm castings, premium potting blends and amendments — produced in Arizona, delivered by the pallet, supersack, or truckload to landscapers, farms, and nurseries.
              </p>
              <div className="mt-7 grid grid-cols-2 gap-3 sm:mt-8 sm:flex sm:flex-row">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => {
                    trackEvent("Hero CTA Clicked", { cta: "request_quote" });
                    navigate(`/order${window.location.search}`);
                  }}
                  className="h-14 min-w-0 justify-center px-2 text-[17px] font-extrabold leading-tight text-stone-950 sm:px-7 sm:text-lg"
                >
                  Request a Quote
                </Button>
                <Button
                  size="lg"
                  onClick={() => {
                    trackEvent("Hero CTA Clicked", { cta: "shop_products" });
                    navigate(`/products${window.location.search}`);
                  }}
                  className="h-14 min-w-0 justify-center gap-1 bg-[#d6c1a0] px-2 text-[17px] font-extrabold leading-tight tracking-tight text-stone-950 shadow-xl ring-1 ring-white/30 hover:bg-[#c4a878] sm:gap-1.5 sm:px-7 sm:text-lg"
                >
                  <span className="whitespace-nowrap">Get Soil Today</span>
                  <ArrowRight className="h-5 w-5 shrink-0 stroke-[3]" />
                </Button>
              </div>
              <a
                href={CUSTOMER_SUPPORT_PHONE_TEL}
                aria-label={`Call ${CUSTOMER_SUPPORT_PHONE_DISPLAY}`}
                data-official-support-phone="true"
                data-hero-phone-cta="true"
                data-phone-number={CUSTOMER_SUPPORT_PHONE_TEL.slice(4)}
                onClick={() => trackEvent("Hero CTA Clicked", { cta: "call" })}
                className="-mx-2 mt-2 inline-flex min-h-11 touch-manipulation items-center gap-2 rounded-lg px-2 text-sm font-semibold text-white/85 underline-offset-4 hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950"
              >
                <Phone className="h-4 w-4" />
                Need help? Call <span data-official-support-phone-text="true">{CUSTOMER_SUPPORT_PHONE_DISPLAY}</span>
              </a>
              <div className="mt-5 grid grid-cols-3 gap-3 border-t border-white/15 pt-5 text-sm text-stone-300 sm:mt-8 sm:gap-6 sm:pt-6">
                <div>
                  <p className="font-bold text-white">Made in AZ</p>
                  <p className="text-xs text-stone-400">Phoenix-based</p>
                </div>
                <div>
                  <p className="font-bold text-white">OMRI eligible</p>
                  <p className="text-xs text-stone-400">Organic-program ready</p>
                </div>
                <div>
                  <p className="font-bold text-white">Same-week</p>
                  <p className="text-xs text-stone-400">delivery across AZ</p>
                </div>
              </div>
            </div>
            <div className="hidden lg:col-span-7 lg:block">
              <div className="relative">
                <div className="absolute -inset-10 rounded-3xl bg-gradient-to-br from-[#d6c1a0]/40 to-transparent blur-3xl" />
                <figure className="relative overflow-hidden rounded-3xl shadow-2xl ring-1 ring-white/10">
                  <img
                    src="/images/performance/home-results-1280.webp"
                    srcSet="/images/performance/home-results-640.webp 640w, /images/performance/home-results-768.webp 768w, /images/performance/home-results-1280.webp 1280w"
                    sizes="55vw"
                    alt="Turf Daddy before-and-after lawn transformation"
                    width="1280"
                    height="696"
                    loading="lazy"
                    decoding="async"
                    className="block w-full"
                  />
                  <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent p-5 md:p-6">
                    <p className="text-base font-semibold leading-tight text-white md:text-lg">
                      Turf Daddy testimonial <span className="text-[#d6c1a0]">before / after results.</span>
                    </p>
                  </figcaption>
                </figure>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="bg-stone-900 px-4 pb-6 lg:hidden">
        <MobileResultsProof />
      </div>

      <section aria-labelledby="garden-classes-heading" className="border-y border-[#d9dfd4] bg-[#f4f0e5] px-4 py-9 sm:py-12">
        <div className="container mx-auto overflow-hidden rounded-[1.75rem] bg-[#264027] text-white shadow-xl ring-1 ring-[#264027]/10">
          <div className="grid lg:grid-cols-[1.18fr_0.82fr]">
            <div className="p-6 sm:p-9 lg:p-11">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#d7b77d] px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.16em] text-[#263527]">
                <CalendarDays className="h-4 w-4" /> Free Garden Classes · Phoenix
              </div>
              <h2 id="garden-classes-heading" className="mt-5 max-w-2xl font-heading text-3xl font-extrabold leading-tight sm:text-4xl">
                Be first to hear about the next Garden Class.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-white/80 sm:text-lg">
                Our first Garden Reset brought Phoenix gardeners together for practical soil and growing lessons. Join the alert list for future dates—and tell us which topics you want next.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
                  <CalendarDays className="h-5 w-5 text-[#d7b77d]" />
                  <p className="mt-3 font-bold">New dates</p>
                  <p className="mt-1 text-xs text-white/65">Get alerted first</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
                  <Clock3 className="h-5 w-5 text-[#d7b77d]" />
                  <p className="mt-3 font-bold">Your topics</p>
                  <p className="mt-1 text-xs text-white/65">Help shape the schedule</p>
                </div>
                <div className="col-span-2 rounded-2xl bg-white/10 p-4 ring-1 ring-white/10 sm:col-span-1">
                  <Sprout className="h-5 w-5 text-[#d7b77d]" />
                  <p className="mt-3 font-bold">Hands-on</p>
                  <p className="mt-1 text-xs text-white/65">Arizona-specific lessons</p>
                </div>
              </div>

              <Button
                size="lg"
                onClick={() => {
                  trackEvent("Homepage Garden Class CTA Clicked", { source: "homepage-class-card" });
                  navigate("/classes?source=homepage-class-card");
                }}
                className="mt-7 h-14 w-full bg-[#d7b77d] px-7 text-base font-extrabold text-[#263527] shadow-lg hover:bg-[#e2c794] sm:w-auto"
              >
                Alert Me About New Classes <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <p className="mt-3 text-sm text-white/65">Free alerts · Choose your interests · Unsubscribe anytime</p>
            </div>

            <div className="border-t border-white/10 bg-[#1d3422] p-6 sm:p-9 lg:border-l lg:border-t-0 lg:p-11">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d7b77d]">Topics you can request</p>
              <ol className="mt-6 space-y-5">
                {[
                  ["01", "Soil and compost", "Reset beds, use amendments, and build living soil."],
                  ["02", "Arizona planting", "Choose seasonal crops, seeds, and transplants."],
                  ["03", "Water and pests", "Read moisture, protect roots, and manage pests naturally."],
                  ["04", "Containers and trees", "Grow in small spaces or care for perennial gardens."],
                ].map(([number, title, detail]) => (
                  <li key={number} className="flex gap-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#d7b77d] text-xs font-black text-[#263527]">{number}</span>
                    <div>
                      <p className="font-bold text-white">{title}</p>
                      <p className="mt-1 text-sm leading-6 text-white/65">{detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="garden-bundles-heading" className="bg-[#f7f5ef] px-4 py-10 sm:py-14">
        <div className="container mx-auto">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#9a6f39]">Phoenix pickup · already priced</p>
              <h2 id="garden-bundles-heading" className="mt-3 max-w-2xl font-heading text-3xl font-extrabold leading-tight text-[#183a23] sm:text-4xl">
                Fall garden bundles. Pay now, pick up at the yard.
              </h2>
              <p className="mt-3 max-w-2xl text-base leading-7 text-[#5f6c62]">
                Three DIY soil packages for 4×8 beds. Add the bundle to your order, keep shopping Products, and check out together.
              </p>
            </div>
            <Button
              size="lg"
              variant="outline"
              onClick={() => {
                trackEvent("Homepage Bundle Hub Clicked", { source: "homepage-bundles" });
                navigate("/offers");
              }}
              className="h-12 min-h-12 border-[#183a23]/20 bg-white px-5 font-extrabold text-[#183a23] hover:bg-[#eaf0e6]"
            >
              All deals <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              {
                href: "/offers/garden-refresh",
                title: "Garden Refresh",
                price: "$69",
                was: "$91",
                detail: "7 bags · 10 cu ft · one 4×8 bed",
                image: "/images/offers/garden-refresh.png",
                event: "garden-refresh",
              },
              {
                href: "/offers/garden-refresh-plus",
                title: "Garden Refresh Plus",
                price: "$149",
                was: "$247",
                detail: "16 bags · 24 cu ft · mix, not just compost",
                image: "/images/offers/garden-refresh-plus.png",
                event: "garden-refresh-plus",
              },
              {
                href: "/offers/big-garden-setup",
                title: "Big Garden Setup",
                price: "$459",
                was: "$642",
                detail: "1 tote + 10 bags · 2–3 beds",
                image: "/images/offers/big-garden-setup.png",
                event: "big-garden-setup",
              },
            ].map((bundle) => (
              <button
                key={bundle.href}
                type="button"
                onClick={() => {
                  trackEvent("Homepage Bundle CTA Clicked", { bundle: bundle.event, source: "homepage-bundles" });
                  navigate(bundle.href);
                }}
                className="group overflow-hidden rounded-3xl bg-white text-left shadow-sm ring-1 ring-[#dfe5dc] transition hover:-translate-y-1 hover:shadow-xl"
              >
                <img src={bundle.image} alt="" className="aspect-[3/4] w-full bg-[#f4f2eb] object-contain" loading="lazy" />
                <div className="p-5">
                  <p className="font-heading text-xl font-bold text-[#183a23]">{bundle.title}</p>
                  <p className="mt-1 text-sm text-[#657066]">{bundle.detail}</p>
                  <div className="mt-3 flex items-end gap-2">
                    <span className="text-2xl font-extrabold text-[#183a23]">{bundle.price}</span>
                    <span className="pb-0.5 text-sm text-[#758077] line-through">{bundle.was}</span>
                  </div>
                  <span className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[#215330]">
                    Open offer <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Unified reviews: photo carousel + quote carousel + field strip */}
      <DeferredMount minHeight={680} rootMargin="1200px 0px">
        <Suspense fallback={<div className="min-h-[680px] bg-[#eef3eb]" aria-hidden />}>
          <AmazonReviewCarousel />
        </Suspense>
      </DeferredMount>

      <section className="bg-stone-50 py-10 md:py-14">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#7a5a2e]">
                Arizona-made soil
              </p>
              <h2 className="font-heading text-2xl font-bold leading-tight text-stone-900 md:text-3xl">
                Built in Arizona yards for working projects.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-stone-600 md:text-base">
                From Phoenix pickup to farm and orchard deliveries, our products are made, loaded, and used here in Arizona.
              </p>
              <Button
                onClick={() => navigate("/products")}
                className="mt-5 bg-primary px-6 text-white hover:bg-primary/90"
              >
                Shop pickup products
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <img
                src="/images/performance/field-application-360.webp"
                srcSet="/images/performance/field-application-360.webp 360w, /images/performance/field-application-720.webp 720w"
                sizes="33vw"
                alt="Growers reviewing compost in Arizona"
                width="720"
                height="960"
                className="h-56 w-full rounded-2xl object-cover shadow-sm"
                loading="lazy"
              />
              <img
                src="/images/performance/field-super-sack-360.webp"
                srcSet="/images/performance/field-super-sack-360.webp 360w, /images/performance/field-super-sack-720.webp 720w"
                sizes="33vw"
                alt="Super sack loading for wholesale order"
                width="720"
                height="1280"
                className="h-56 w-full rounded-2xl object-cover shadow-sm"
                loading="lazy"
              />
              <img
                src="/images/performance/field-orchard-360.webp"
                srcSet="/images/performance/field-orchard-360.webp 360w, /images/performance/field-orchard-720.webp 720w"
                sizes="33vw"
                alt="Compost applied in orchard rows"
                width="720"
                height="405"
                className="h-56 w-full rounded-2xl object-cover shadow-sm"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Distribution + Featured Products */}
      <section className="relative pt-10 md:pt-16 pb-16 bg-white overflow-hidden">
        <div className="container mx-auto px-4 relative z-10 h-full flex items-center">
          {/* Main Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">
            {/* Left Column - Availability Checker, and Size Categories */}
            <div className="order-2 lg:order-1 lg:col-span-4 flex flex-col gap-6 mt-8 lg:mt-0">
              <div className="text-center lg:text-left">
                <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-3 leading-tight">
                  Pickup, pallet, or truckload.
                </h2>
                <p className="text-base text-muted-foreground/80 max-w-md">
                  Locally produced soil amendments and bulk loads for landscapers, farms, nurseries, and commercial growers.
                </p>
              </div>

              {/* Pickup and Distribution Center */}
              <div className="bg-white rounded-xl border-2 border-border p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <MapPin className="h-6 w-6 text-primary" />
                  <h2 className="text-lg font-bold text-primary">Pickup & Distribution</h2>
                </div>
                <div className="space-y-5">
                  <p className="text-muted-foreground flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary/70" />
                    <span>1634 N 19th Ave, Phoenix AZ 85009</span>
                  </p>
                  <div className="rounded-2xl overflow-hidden border border-primary/10 shadow-inner h-56">
                    <iframe
                      title="Organic Soil Wholesale Phoenix Distribution Center Map"
                      src={PHOENIX_MAP_EMBED_URL}
                      loading="lazy"
                      allowFullScreen
                      referrerPolicy="no-referrer-when-downgrade"
                      className="h-full w-full border-0"
                    ></iframe>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Compass className="h-4 w-4 text-primary" />
                      <span>33&deg;28&apos;04.6&quot;N | 112&deg;06&apos;03.4&quot;W</span>
                    </div>
                    <Button asChild size="sm" className="gap-2">
                      <a href={PHOENIX_DIRECTIONS_URL} target="_blank" rel="noopener noreferrer">
                        Open directions
                        <ArrowUpRight className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Size Categories Carousel */}
              <div className="bg-white rounded-xl border-2 border-border p-6 shadow-sm">
                <h2 className="text-lg font-bold mb-4">Size Categories</h2>
                <Carousel
                  opts={{
                    align: "center",
                    loop: true,
                    skipSnaps: false,
                    containScroll: "trimSnaps",
                  }}
                  className="w-full"
                >
                  <CarouselContent>
                    {sizeCategories.map((category) => (
                      <CarouselItem key={category.id}>
                        <div className="relative aspect-[4/3] rounded-lg overflow-hidden group cursor-pointer hover:shadow-lg transition-all duration-300">
                          <OptimizedImage
                            src={category.image}
                            alt={category.name}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            width={480}
                            sizes="(max-width: 768px) 90vw, (max-width: 1024px) 45vw, 28vw"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent p-4 flex flex-col justify-end">
                            <div className="flex items-center gap-2 mb-2">
                              {category.icon}
                              <h3 className="text-white text-lg font-semibold">{category.name}</h3>
                            </div>
                            <p className="text-white/90 text-sm">{category.description}</p>
                          </div>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="left-2" />
                  <CarouselNext className="right-2" />
                </Carousel>
              </div>
            </div>

            {/* Right Column - Featured Products */}
            <div className="order-1 lg:order-2 lg:col-span-8 mt-0 lg:mt-0">
              <h2 className="mb-4 text-3xl font-heading font-bold text-primary lg:hidden text-center">Featured Products</h2>
              <div className="bg-white rounded-xl border-2 border-border p-6 shadow-sm">
                <h2 className="hidden text-xl font-bold mb-4 lg:block">Featured Products</h2>
                <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                  {featuredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="group cursor-pointer transition-transform duration-200 hover:scale-[1.02]"
                      onClick={() => handleProductSelect(product)}
                    >
                      <div className="relative aspect-square overflow-hidden rounded-2xl bg-neutral-50">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 to-black/0 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors duration-300 z-10 flex items-center justify-center">
                          <div className="bg-white text-primary font-semibold px-6 py-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0 duration-300 min-h-[44px] flex items-center">
                            View Details
                          </div>
                        </div>
                        <OptimizedImage
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          width={480}
                          sizes="(max-width: 768px) 90vw, (max-width: 1024px) 45vw, 25vw"
                        />
                      </div>
                      <div className="mt-4 text-center">
                        <h3 className="text-xl font-heading font-bold text-foreground group-hover:text-primary transition-colors duration-200">
                          {product.name}
                        </h3>
                        {product.productName && <p className="text-sm font-semibold text-muted-foreground mt-1">{product.productName}</p>}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-8 text-center">
                  <Button
                    onClick={() => navigate("/products")}
                    className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg rounded-xl shadow-sm hover:shadow transition-all duration-300 w-full max-w-md"
                  >
                    View All Products
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Showcase Photos Section */}
      <section className="py-16 px-4 md:px-8 bg-white border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-extrabold text-foreground mb-4 tracking-tight">
              Our Work in Action
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground mt-4 max-w-2xl mx-auto">
              Discover our premium organic soil products in action across various applications
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <Card className="group relative overflow-hidden border-2 border-border bg-white shadow-sm flex flex-col">
              <CardContent className="relative flex-1 p-0 bg-black">
                <div className="relative aspect-video w-full lg:h-full">
                  <LazyYouTube id="yZvjAPZ0dVQ" title="Simon's Gold Dairy Compost Video" className="absolute inset-0" />
                </div>
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 text-white">
                  <span className="text-xs uppercase tracking-[0.3em] text-white/60">Flagship Compost</span>
                  <h3 className="mt-2 text-2xl font-heading font-semibold sm:text-3xl">Simon&apos;s Gold Dairy Compost</h3>
                  <p className="mt-3 text-sm text-white/80 sm:text-base">
                    See how we transform raw dairy into living soil that feeds commercial landscapes and farms across the Southwest.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="bg-white/80 px-6 py-4 text-sm text-primary/80 backdrop-blur-sm sm:text-base">
                Watch the full process from dairy partnerships to screened finished compost.
              </CardFooter>
            </Card>

            <div className="flex flex-col gap-8">
              <Card className="border-2 border-border bg-white shadow-sm overflow-hidden flex flex-col h-full">
                <CardContent className="p-0 bg-black">
                  <div className="relative aspect-video w-full">
                    <LazyYouTube id="UBs6anRv2IY" title="Worm Farming Video" className="absolute inset-0" />
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3 bg-white p-6 text-left">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-lg font-semibold text-primary">Worm Farming Hub</h3>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary uppercase tracking-wide">
                      Vermicompost
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Follow our castings operation—from feedstock blends to gentle harvesting that preserves microbe diversity.
                  </p>
                </CardFooter>
              </Card>

              <Card className="border-2 border-border bg-white shadow-sm overflow-hidden flex flex-col h-full">
                <CardContent className="p-0 bg-black">
                  <div className="relative aspect-video w-full">
                    <LazyYouTube id="HbR7BH-6uxI" title="Compost Blend for Farmers Video" className="absolute inset-0" />
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3 bg-white p-6 text-left">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-lg font-semibold text-primary">Field Application</h3>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary uppercase tracking-wide">Bulk Loads</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    See the on-farm blends we craft for commercial growers and how we stage truckloads for fast delivery.
                  </p>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
