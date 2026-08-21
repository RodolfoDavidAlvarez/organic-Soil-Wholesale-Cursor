import { useEffect } from "react";
import { ArrowRight, CalendarDays, ExternalLink, Gift } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { trackEvent } from "@/lib/analytics";

const instagramUtm = "utm_source=instagram&utm_medium=social&utm_campaign=link-in-bio";

const links = {
  wormCastings: `/free-worm-castings?source=instagram-bio&${instagramUtm}&utm_content=free-worm-castings`,
  gardenClass: `/fall-garden-workshop?source=instagram-bio&${instagramUtm}&utm_content=garden-reset`,
  organicSoil: `/?${instagramUtm}&utm_content=organic-soil-wholesale`,
  soilSeedWater: `https://soilseedandwater.com/?${instagramUtm}&utm_content=soil-seed-water`,
};

export default function InstagramLinks() {
  useEffect(() => {
    trackEvent("Social Bio Page Viewed", {
      source: "instagram",
      campaign: "link-in-bio",
    });
  }, []);

  const recordClick = (destination: string) => {
    trackEvent("Social Bio Link Clicked", {
      source: "instagram",
      campaign: "link-in-bio",
      destination,
    });
  };

  return (
    <main className="min-h-screen bg-[#f4f0e3] text-[#133d2a]">
      <Helmet>
        <title>Choose Your Next Step | Organic Soil Wholesale</title>
        <meta
          name="description"
          content="Claim free worm castings, register for The Garden Reset, or explore Organic Soil Wholesale and Soil Seed & Water."
        />
      </Helmet>

      <div className="mx-auto w-full max-w-xl px-4 pb-10 pt-7 sm:px-6 sm:pt-10">
        <header className="text-center">
          <p className="font-heading text-xl font-bold text-[#20251f] sm:text-2xl">Welcome to Soil Seed and Water</p>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-[#8b6940]">Welcome, Instagram friends</p>
          <h1 className="mt-2 font-heading text-3xl font-bold leading-tight sm:text-4xl">What would you like to do?</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#4f6255] sm:text-base">Choose an option below. Free pickup and class registration are available now.</p>
        </header>

        <section className="mt-7 space-y-3" aria-label="Featured links">
          <a
            href={links.wormCastings}
            onClick={() => recordClick("free-worm-castings")}
            className="group grid min-h-36 grid-cols-[1fr_112px] overflow-hidden rounded-3xl bg-[#133d2a] text-white shadow-[0_12px_32px_rgba(19,61,42,0.18)] transition-transform active:scale-[0.99] sm:grid-cols-[1fr_155px]"
          >
            <span className="flex flex-col justify-center p-5 sm:p-6">
              <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#f0d498]"><Gift className="h-4 w-4" /> Free community gift</span>
              <span className="mt-2 font-heading text-2xl font-bold leading-tight">Claim your free 9-lb bag</span>
              <span className="mt-3 flex items-center gap-2 text-sm font-bold text-[#f8edcf]">Get my bag <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
            </span>
            <img src="/images/performance/campaign-worm-thumb-384.webp" alt="Mikey's Worm Poop worm castings" className="h-full w-full object-cover" />
          </a>

          <a
            href={links.gardenClass}
            onClick={() => recordClick("garden-reset-class")}
            className="group flex min-h-36 items-center gap-4 rounded-3xl border-2 border-[#d6b470] bg-white p-5 shadow-[0_10px_26px_rgba(87,62,29,0.1)] transition-transform active:scale-[0.99] sm:p-6"
          >
            <span className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-[#e8d3a8] leading-none text-[#133d2a]">
              <span className="text-[10px] font-extrabold uppercase tracking-widest">Aug</span>
              <span className="mt-1 text-2xl font-black">22</span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#8b6940]"><CalendarDays className="h-4 w-4" /> Free garden class</span>
              <span className="mt-1 block font-heading text-xl font-bold leading-tight sm:text-2xl">Register for The Garden Reset</span>
              <span className="mt-2 block text-sm font-semibold text-[#526457]">Saturday · 8:00–9:30 AM · New time</span>
            </span>
            <ArrowRight className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-1" />
          </a>

          <a
            href={links.organicSoil}
            onClick={() => recordClick("organic-soil-wholesale")}
            aria-label="Shop Organic Soil Wholesale for local soil sales"
            className="group flex min-h-24 items-center gap-4 rounded-2xl border-2 border-[#9fbb93] bg-[#dce8d6] px-5 py-4 shadow-[0_8px_22px_rgba(19,61,42,0.1)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(19,61,42,0.16)] active:scale-[0.99]"
          >
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block font-heading text-lg font-bold text-[#20251f] sm:text-xl">
                Organic <span className="text-primary">Soil</span>{" "}
                <span className="font-display italic text-[#8f7000]">Wholesale</span>
              </span>
              <span className="mt-0.5 block text-[8px] font-semibold uppercase tracking-[0.14em] text-[#6b746c]">by Soil Seed &amp; Water</span>
              <span className="mt-2 inline-flex rounded-full bg-white px-3 py-1 text-xs font-extrabold uppercase tracking-[0.08em] text-[#133d2a] shadow-sm">Local soil sales</span>
            </span>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#133d2a] text-white shadow-sm"><ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" /></span>
          </a>

          <a
            href={links.soilSeedWater}
            onClick={() => recordClick("soil-seed-and-water")}
            aria-label="Visit the Soil Seed and Water ecommerce retail store"
            className="group flex min-h-24 items-center gap-4 rounded-2xl border-2 border-[#d6b470] bg-white px-5 py-4 shadow-[0_8px_22px_rgba(87,62,29,0.1)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(87,62,29,0.16)] active:scale-[0.99]"
          >
            <span className="min-w-0 flex-1">
              <img src="/images/soil-seed-and-water-logo.png" alt="Soil Seed and Water" className="h-auto w-44 max-w-full object-contain object-left" />
              <span className="mt-2 inline-flex rounded-full bg-[#f4e6c6] px-3 py-1 text-xs font-extrabold uppercase tracking-[0.08em] text-[#6d4c25]">Ecommerce retail store</span>
            </span>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#8b6940] text-white shadow-sm"><ExternalLink className="h-5 w-5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></span>
          </a>
        </section>

        <footer className="mt-7 text-center text-xs leading-5 text-[#637166]">
          Phoenix, Arizona · Locally made for healthier soil
        </footer>
      </div>
    </main>
  );
}
