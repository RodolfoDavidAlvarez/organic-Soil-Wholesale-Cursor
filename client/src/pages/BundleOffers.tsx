import { Helmet } from "react-helmet-async";
import { Link, useRoute } from "wouter";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { useMemo, useState } from "react";
import {
  CUSTOMER_SUPPORT_PHONE_DISPLAY,
  CUSTOMER_SUPPORT_PHONE_TEL,
  PHOENIX_YARD_ADDRESS,
} from "@/config/contact";
import { fmtDealPrice, useAddDeal } from "@/components/DealList";
import { getPromoBundleBySlug, PROMO_BUNDLES, type PromoBundle } from "@shared/promoBundles.js";
import { trackEvent } from "@/lib/analytics";

const legacyOfferAliases: Record<string, string> = {
  "raised-bed-refresh": "garden-refresh",
  "garden-bed-builder": "big-garden-setup",
};

export default function BundleOffers() {
  const [, params] = useRoute("/offers/:slug");
  const requestedSlug = (params as { slug?: string } | null)?.slug;
  const slug = requestedSlug ? legacyOfferAliases[requestedSlug] || requestedSlug : undefined;
  const offer = useMemo(() => (slug ? getPromoBundleBySlug(slug) : undefined), [slug]);

  if (!slug || !offer) return <OffersIndex />;
  return <OfferPage offer={offer} />;
}

function PickupStrip() {
  return (
    <p className="text-center text-sm leading-6 text-[#5f6c62]">
      Tue–Sat 8–1 and 2–4 · {PHOENIX_YARD_ADDRESS.replace(", AZ 85009", "")} ·{" "}
      <a href={CUSTOMER_SUPPORT_PHONE_TEL} className="font-semibold text-[#183a23] underline-offset-2 hover:underline">
        {CUSTOMER_SUPPORT_PHONE_DISPLAY}
      </a>
    </p>
  );
}

function OffersIndex() {
  return (
    <main className="bg-[#f4f1ea] px-4 pb-14 pt-8 text-[#183a23] sm:px-6 sm:pt-10">
      <Helmet>
        <title>Deals | Organic Soil Wholesale</title>
        <meta
          name="description"
          content="Phoenix pickup deals from Organic Soil Wholesale. Garden Refresh $99, Garden Refresh Plus $149, and Big Garden Setup $399."
        />
        <link rel="canonical" href="https://organicsoilwholesale.com/offers" />
      </Helmet>
      <section aria-labelledby="deals-heading" className="mx-auto max-w-6xl">
        <div className="mb-6 max-w-2xl sm:mb-8">
          <h1 id="deals-heading" className="font-heading text-4xl font-black leading-tight sm:text-5xl">Garden bundles</h1>
          <p className="mt-3 text-base leading-7 text-[#5f6c62]">
            Three ready-priced Phoenix pickup offers for refreshing, filling, or building garden beds.
          </p>
        </div>

          <div className="grid gap-4 md:grid-cols-3">
            {PROMO_BUNDLES.map((deal) => (
              <article key={deal.slug} className="flex flex-col overflow-hidden rounded-3xl border border-[#d9d2c3] bg-[#fffdf8] shadow-[0_10px_24px_rgba(24,58,35,0.07)]">
                    <img
                      src={deal.bannerImage}
                      alt={deal.heroAlt}
                      width={1600}
                      height={646}
                      className="aspect-[1600/646] w-full object-cover"
                      loading="lazy"
                    />
                    <div className="flex flex-1 flex-col p-5 sm:p-6">
                      <div className="flex items-baseline justify-between gap-3">
                        <h2 className="font-heading text-xl font-black leading-tight">{deal.title}</h2>
                        <p className="shrink-0 text-2xl font-black text-[#27703f]">{fmtDealPrice(deal.salePrice)}</p>
                      </div>
                      <p className="mt-3 flex-1 text-sm font-semibold leading-6 text-[#4f5f54]">{deal.listCaption}</p>
                    <Link href={`/offers/${deal.slug}`}>
                      <a
                        onClick={() => trackEvent("Deal Card CTA Clicked", { bundle: deal.slug, source: "offers-index" })}
                          className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#173d25] px-5 text-sm font-black text-white transition hover:bg-[#0d2917]"
                      >
                        View offer <ArrowRight className="h-4 w-4" />
                      </a>
                    </Link>
                    </div>
              </article>
            ))}
          </div>
      </section>
    </main>
  );
}

function OfferPage({ offer }: { offer: PromoBundle }) {
  const addDeal = useAddDeal();
  const [justAdded, setJustAdded] = useState(false);
  const add = () => {
    addDeal(offer);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1400);
  };

  return (
    <main className="bg-[#f4f1ea] pb-28 text-[#183a23] lg:pb-12">
      <Helmet>
        <title>{offer.title} | Organic Soil Wholesale</title>
        <meta name="description" content={`${offer.title}: ${offer.lpLine} Phoenix pickup for ${fmtDealPrice(offer.salePrice)}.`} />
        <link rel="canonical" href={`https://organicsoilwholesale.com/offers/${offer.slug}`} />
      </Helmet>

      <div className="mx-auto max-w-3xl px-4 pt-5 sm:px-6 sm:pt-8">
        <Link href="/offers" className="text-sm font-semibold text-[#215330] underline-offset-4 hover:underline">
          Deals
        </Link>

        <figure className="mt-4 overflow-hidden rounded-[1.5rem] bg-[#183a23] shadow-[0_18px_40px_rgba(21,59,34,0.16)] ring-1 ring-[#183a23]/10">
          <img
            src={offer.heroImage}
            alt={offer.heroAlt}
            className="w-full bg-[#f4f2eb] object-contain"
            fetchPriority="high"
          />
        </figure>

        <div className="mt-6">
          <h1 className="font-heading text-3xl font-bold leading-tight sm:text-4xl">
            {offer.lpHeadline} {fmtDealPrice(offer.salePrice)}
          </h1>
          <p className="mt-3 text-base text-[#3d5141]">{offer.lpLine}</p>
          <p className="mt-2 text-base text-[#5f6c62]">{offer.lpUse}</p>
          <p className="mt-3 text-sm text-[#758077]">
            Was {fmtDealPrice(offer.listPrice)} · save {fmtDealPrice(offer.savings)}
          </p>
        </div>

        <div className="mt-7 flex gap-3 overflow-x-auto pb-1">
          {offer.items.map((item) => (
            <figure key={`${item.name}-${item.amount}`} className="w-32 shrink-0 sm:w-36">
              <Link href={item.href}>
                <a className="block overflow-hidden rounded-2xl ring-1 ring-[#183a23]/10 transition hover:ring-2 hover:ring-[#215330]">
                  <img src={item.image} alt={item.alt} className="aspect-square w-full object-cover" />
                </a>
              </Link>
              <figcaption className="mt-2 text-xs leading-snug text-[#657066]">{item.amount}</figcaption>
            </figure>
          ))}
        </div>

        <button
          type="button"
          onClick={add}
          className="mt-8 hidden min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#183a23] px-5 font-bold text-white transition hover:bg-[#0d2917] lg:inline-flex"
        >
          <ShoppingBag className="h-4 w-4" />
          {justAdded ? "Added" : `Add to order · ${fmtDealPrice(offer.salePrice)}`}
        </button>

        <div className="mt-8 pb-4">
          <PickupStrip />
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#d9e1d5] bg-[#f4f1ea]/95 px-3 pt-3 shadow-[0_-10px_30px_rgba(24,58,35,0.12)] backdrop-blur lg:hidden pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={add}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#183a23] px-4 text-base font-extrabold text-white"
        >
          <ShoppingBag className="h-4 w-4" />
          {justAdded ? "Added" : `Add to order · ${fmtDealPrice(offer.salePrice)}`}
        </button>
      </div>
    </main>
  );
}
