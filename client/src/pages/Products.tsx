import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import SEO from "@/components/layout/SEO";
import { Button } from "@/components/ui/button";
import { OptimizedImage } from "@/components/OptimizedImage";
import {
  SPECIALTY_BLENDS,
  MULCH_PRODUCTS,
  OTHER_AMENDMENTS,
  type FeaturedProductSlot,
} from "@/data/featuredProducts";
import { PayPickupGrid } from "@/components/PayPickupGrid";
import { AlertCircle, CheckCircle2, ChevronRight, FileText, Loader2, MapPin, Truck } from "lucide-react";

const PICKUP_FORMATS = [
  {
    title: "Bags and pallets",
    description: "Pickup one bag, full pallets, or boxed pallet orders from the Phoenix yard.",
    image: "/images/pickup-formats/pallet-bag-boxes.jpg",
  },
  {
    title: "Mixed truckloads",
    description: "Combine pallets and super sacks when the order needs more than one format.",
    image: "/images/pickup-formats/mixed-pallets-totes-truckload.jpg",
  },
  {
    title: "Bulk delivery",
    description: "Truckload deliveries are available when your site qualifies by location.",
    image: "/images/pickup-formats/bulk-walking-floor-delivery.jpg",
  },
];

function PickupFormatsSection() {
  return (
    <div className="mt-8 border-t border-stone-200 pt-8 md:mt-10 md:pt-10">
      <div className="mb-5 flex flex-col justify-between gap-2 md:mb-6 md:flex-row md:items-end">
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#264027]">
            Pickup and delivery formats
          </p>
          <h3 className="font-heading text-xl font-bold tracking-tight text-stone-900 md:text-2xl">
            Choose the format that fits the job.
          </h3>
        </div>
        <p className="max-w-md text-sm leading-relaxed text-stone-600">
          Start with bagged pickup, then scale up to pallets, super sacks, or truckloads when needed.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {PICKUP_FORMATS.map((format) => (
          <div key={format.title} className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-200">
            <div className="relative aspect-[16/10] overflow-hidden bg-stone-100">
              <img
                src={format.image}
                alt={format.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                loading="lazy"
              />
            </div>
            <div className="p-4">
              <h4 className="font-heading text-base font-bold text-stone-900">{format.title}</h4>
              <p className="mt-1 text-sm leading-relaxed text-stone-600">{format.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const DELIVERY_ORIGINS = [
  { name: "Phoenix", lat: 33.4484, lng: -112.074 },
  { name: "Congress", lat: 34.1625, lng: -112.8507 },
] as const;

const milesBetween = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadiusMiles = 3958.8;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return earthRadiusMiles * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};

function DeliveryEligibilityCheck() {
  const [zip, setZip] = useState("");
  const [status, setStatus] = useState<"idle" | "checking" | "locating" | "eligible" | "outside" | "unknown">("idle");
  const [message, setMessage] = useState("");

  const evaluateDeliveryRange = (coords: { lat: number; lng: number }, sourceLabel: string) => {
    const nearest = DELIVERY_ORIGINS
      .map((origin) => ({ ...origin, miles: milesBetween(origin, coords) }))
      .sort((a, b) => a.miles - b.miles)[0];

    if (nearest.miles <= 300) {
      setStatus("eligible");
      setMessage(`Delivery likely available. ${sourceLabel} is ${Math.round(nearest.miles)} miles from ${nearest.name}.`);
    } else {
      setStatus("outside");
      setMessage(`${sourceLabel} is about ${Math.round(nearest.miles)} miles from ${nearest.name}. Request a quote and we will confirm options.`);
    }
  };

  const checkDelivery = async () => {
    const cleanZip = zip.replace(/\D/g, "").slice(0, 5);
    setZip(cleanZip);

    if (cleanZip.length !== 5) {
      setStatus("unknown");
      setMessage("Enter a 5-digit ZIP code.");
      return;
    }

    setStatus("checking");
    setMessage("");

    try {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 5000);
      const response = await fetch(`https://api.zippopotam.us/us/${cleanZip}`, { signal: controller.signal });
      window.clearTimeout(timeout);

      if (!response.ok) throw new Error("ZIP lookup failed");
      const data = await response.json();
      const place = data?.places?.[0];
      const coords = {
        lat: Number(place?.latitude),
        lng: Number(place?.longitude),
      };
      if (!Number.isFinite(coords.lat) || !Number.isFinite(coords.lng)) throw new Error("ZIP lookup failed");

      evaluateDeliveryRange(coords, "This ZIP");
    } catch {
      setStatus("unknown");
      setMessage("We could not verify that ZIP. Request a quote and we will confirm delivery.");
    }
  };

  const checkCurrentLocation = () => {
    if (!navigator.geolocation) {
      setStatus("unknown");
      setMessage("Your browser does not allow location checks. Enter your ZIP code instead.");
      return;
    }

    setStatus("locating");
    setMessage("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        evaluateDeliveryRange(
          { lat: position.coords.latitude, lng: position.coords.longitude },
          "Your location",
        );
      },
      () => {
        setStatus("unknown");
        setMessage("Location was not allowed. Enter your ZIP code instead.");
      },
      { enableHighAccuracy: false, maximumAge: 300000, timeout: 10000 },
    );
  };

  const statusIcon =
    status === "checking" || status === "locating" ? <Loader2 className="h-4 w-4 animate-spin" /> :
      status === "eligible" ? <CheckCircle2 className="h-4 w-4" /> :
        status === "outside" || status === "unknown" ? <AlertCircle className="h-4 w-4" /> :
          <MapPin className="h-4 w-4" />;

  return (
    <div className="mt-5 flex flex-col gap-3 border-t border-stone-200 pt-4 md:mt-0 md:w-[420px] md:border-l md:border-t-0 md:pl-5 md:pt-0">
      <div className="flex items-start gap-2">
        <Truck className="mt-0.5 h-4 w-4 shrink-0 text-[#264027]" />
        <div>
          <p className="text-sm font-bold text-stone-900">Pickup today. Delivery when you qualify.</p>
          <p className="mt-0.5 text-xs leading-relaxed text-stone-600">
            Delivery is available within 300 miles of Phoenix or Congress, Arizona.
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <input
          value={zip}
          onChange={(event) => setZip(event.target.value.replace(/\D/g, "").slice(0, 5))}
          onKeyDown={(event) => {
            if (event.key === "Enter") checkDelivery();
          }}
          inputMode="numeric"
          placeholder="ZIP code"
          className="h-10 min-w-0 flex-1 rounded-lg border border-stone-300 bg-white px-3 text-sm font-medium outline-none ring-[#264027]/20 transition focus:border-[#264027] focus:ring-2"
        />
        <Button
          type="button"
          onClick={checkDelivery}
          className="h-10 rounded-lg bg-[#264027] px-3 text-sm font-bold text-white hover:bg-[#1f3320]"
        >
          Check
        </Button>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={checkCurrentLocation}
        className="h-10 justify-center gap-2 rounded-lg border-[#264027]/20 bg-white text-sm font-bold text-[#264027] hover:bg-[#264027]/5"
      >
        <MapPin className="h-4 w-4" />
        Use my location
      </Button>

      {status !== "idle" && (
        <div
          className={`flex items-start gap-2 text-xs font-medium ${
            status === "eligible" ? "text-[#264027]" : status === "checking" || status === "locating" ? "text-stone-600" : "text-amber-800"
          }`}
        >
          {statusIcon}
          <span>
            {status === "checking"
              ? "Checking delivery range..."
              : status === "locating"
                ? "Checking your location..."
                : message}
          </span>
        </div>
      )}
    </div>
  );
}

/** Smaller card for specialty / mulch / amendment rows */
function FeaturedRowCard({ slot, onOpen, ctaLabel = "Request a Quote" }: { slot: FeaturedProductSlot; onOpen: () => void; ctaLabel?: string }) {
  return (
    <motion.button
      type="button"
      onClick={onOpen}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -3 }}
      className="group flex h-full flex-col overflow-hidden rounded-3xl bg-white p-5 text-left shadow-[0_6px_22px_rgba(38,64,39,0.08)] ring-1 ring-stone-200/60 transition-shadow duration-300 hover:shadow-[0_14px_40px_rgba(38,64,39,0.16)]"
    >
      <div className="group/photo relative aspect-[16/10] overflow-hidden rounded-2xl bg-stone-100">
        <OptimizedImage
          src={slot.heroImage ?? slot.thumbnailImage}
          alt={slot.displayTitle}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        {slot.bagImage && (
          <div className="absolute bottom-2 right-2 h-16 w-16 overflow-hidden rounded-lg border-2 border-white bg-white shadow-md ring-1 ring-stone-300/60">
            <OptimizedImage
              src={slot.bagImage}
              alt={`${slot.displayTitle} bag`}
              className="h-full w-full object-contain"
            />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-2 pt-6">
        <h4 className="font-heading text-xl font-bold text-stone-900">{slot.displayTitle}</h4>
        <p className="text-sm font-medium text-[#7a5a2e]">{slot.tagline}</p>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-stone-600">{slot.blurb}</p>
        {slot.altImages && slot.altImages.length > 0 && (
          <div className="mt-3 flex gap-2">
            {slot.altImages.slice(0, 3).map((img) => (
              <div key={img.src} className="h-12 w-12 overflow-hidden rounded-lg ring-1 ring-stone-200">
                <OptimizedImage src={img.src} alt={img.label} className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        )}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {slot.sizes.map((size) => (
            <span
              key={size}
              className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-stone-600"
            >
              {size}
            </span>
          ))}
        </div>
        <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#264027] transition-transform duration-300 group-hover:translate-x-1">
          {slot.ctaLabel ?? ctaLabel} <ChevronRight className="h-4 w-4" />
        </div>
      </div>
    </motion.button>
  );
}

const Products = () => {
  const [, navigate] = useLocation();

  const openSlot = (slot: FeaturedProductSlot) => {
    if (slot.href?.startsWith("#")) {
      const el = document.querySelector(slot.href);
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (slot.href) {
      window.location.href = slot.href;
      return;
    }
    navigate(`/products/${slot.slug}`);
  };

  const requestQuoteForSlot = (slot: FeaturedProductSlot) => {
    const params = new URLSearchParams();
    if (slot.productId) params.set("productId", String(slot.productId));
    params.set("product", slot.displayTitle);
    navigate(`/order?${params.toString()}`);
  };

  return (
    <>
      <SEO
        title="Wholesale Organic Soil Products"
        description="Bulk soil products from Soil Seed & Water — dairy compost, worm castings, premium potting blends, amendments, mulch. Pallets, supersacks, truckloads."
        keywords="soil seed and water products, organic soil catalog, wholesale compost, organic mulch, potting soil supplier, dairy compost arizona, worm castings wholesale"
        canonical="https://organicsoilwholesale.com/products"
      />

      {/* Section 1 — Pay & Pick Up (the 4 mains, MOS-driven pricing, slot booking) */}
      <section id="pay-pickup" className="bg-gradient-to-b from-stone-50 to-white pt-5 pb-12 md:pt-7 md:pb-16">
        <div className="container mx-auto px-4">
          <div className="mb-4 flex flex-col justify-between gap-4 md:mb-6 md:flex-row md:items-end">
            <div>
              <p className="mb-1 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#264027]">
                <CheckCircle2 className="h-3 w-3" /> Agave Yard pickup · delivery available
              </p>
              <h2 className="font-heading text-2xl font-bold leading-tight text-stone-900 md:text-3xl">
                Welcome to the organic soil paradise.
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-stone-600">
                Anything you need for your garden, project, nursery, or farm.
              </p>
              <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#264027] px-3 py-1.5 text-xs font-bold text-white shadow-sm">
                <MapPin className="h-3.5 w-3.5" />
                Pickup at Phoenix Agave Yard: 1634 N 19th Ave.
              </p>
            </div>
            <DeliveryEligibilityCheck />
          </div>

          <PayPickupGrid />

          <PickupFormatsSection />

          <p className="mt-4 text-center text-xs text-stone-500 md:hidden">
            Need bulk or specialty? <a href="#request-quote" className="font-semibold text-stone-700 underline">Request a quote</a>.
          </p>
        </div>
      </section>

      {/* Section 2 — Request a Quote (Tier 2 begins here) */}
      <section id="request-quote" className="scroll-mt-20 bg-stone-100/60 py-10 md:py-14">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-2 inline-flex items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#7a5a2e]">
            <FileText className="h-3 w-3" /> Made to order · request a quote
          </p>
          <h2 className="mx-auto max-w-2xl font-heading text-2xl font-bold leading-tight text-stone-900 md:text-3xl">
            Specialty blends, mulch &amp; amendments.
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-stone-600 md:text-base">
            These products are prepared or scheduled on demand. Request a quote and we&apos;ll confirm product, lead time, and pricing.
          </p>
        </div>
      </section>

      {/* Specialty Blends (orchard / vineyard) */}
      <section className="bg-white py-10 md:py-14">
        <div className="container mx-auto px-4">
          <div className="mb-6 flex items-end justify-between gap-6 md:mb-8">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#7a5a2e]">
                Farmer-focused blends
              </p>
              <h3 className="font-heading text-xl font-bold tracking-tight text-stone-900 md:text-2xl">
                Specialty blends, mulch &amp; amendments.
              </h3>
            </div>
            <p className="hidden max-w-sm text-sm text-stone-600 md:block">
              Crop-specific products for orchards, vineyards, groves, and specialty farms.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {SPECIALTY_BLENDS.map((slot) => (
              <FeaturedRowCard key={slot.slug} slot={slot} onOpen={() => requestQuoteForSlot(slot)} />
            ))}
          </div>
        </div>
      </section>

      {/* Section 3 — Mulch */}
      <section className="bg-stone-50 py-10 md:py-14">
        <div className="container mx-auto px-4">
          <div className="mb-6 flex items-end justify-between gap-6 md:mb-8">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#7a5a2e]">
                Landscape mulch
              </p>
              <h3 className="font-heading text-xl font-bold tracking-tight text-stone-900 md:text-2xl">
                Nature&apos;s Blanket.
              </h3>
            </div>
            <p className="hidden max-w-sm text-sm text-stone-600 md:block">
              The mulch line that finishes every job and holds water in dry months.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {MULCH_PRODUCTS.map((slot) => (
              <FeaturedRowCard key={slot.slug} slot={slot} onOpen={() => openSlot(slot)} ctaLabel="Buy Now" />
            ))}
          </div>
        </div>
      </section>

      {/* Section 4 — Other amendments */}
      <section id="amendments-line" className="scroll-mt-20 bg-white py-10 md:py-14">
        <div className="container mx-auto px-4">
          <div className="mb-6 flex items-end justify-between gap-6 md:mb-8">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#7a5a2e]">
                Mineral &amp; biological
              </p>
              <h3 className="font-heading text-xl font-bold tracking-tight text-stone-900 md:text-2xl">
                Amendments to mix in.
              </h3>
            </div>
            <p className="hidden max-w-sm text-sm text-stone-600 md:block">
              Drop-in biochar, zeolite, and microbial inoculants to upgrade any blend.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
            {OTHER_AMENDMENTS.map((slot) => (
              <FeaturedRowCard key={slot.slug} slot={slot} onOpen={() => requestQuoteForSlot(slot)} />
            ))}
          </div>
        </div>
      </section>

    </>
  );
};

export default Products;
