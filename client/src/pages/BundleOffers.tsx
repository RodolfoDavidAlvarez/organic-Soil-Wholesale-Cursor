import { Helmet } from "react-helmet-async";
import { Link, useRoute } from "wouter";
import { ShoppingBag } from "lucide-react";
import { useMemo, useState } from "react";
import {
  CUSTOMER_SUPPORT_PHONE_DISPLAY,
  CUSTOMER_SUPPORT_PHONE_TEL,
  PHOENIX_YARD_ADDRESS,
} from "@/config/contact";
import { DealHubCards, fmtDealPrice, useAddDeal } from "@/components/DealList";
import { getPromoBundleBySlug, type PromoBundle } from "@shared/promoBundles.js";

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
    <main className="bg-[#f4f1ea] pb-12 pt-5 sm:pt-7">
      <Helmet>
        <title>Deals | Organic Soil Wholesale</title>
        <meta
          name="description"
          content="Phoenix pickup deals from Organic Soil Wholesale. Garden Refresh $69, Garden Refresh Plus $149, and Big Garden Setup $459."
        />
        <link rel="canonical" href="https://organicsoilwholesale.com/offers" />
      </Helmet>
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <h1 className="font-heading text-sm font-semibold uppercase tracking-[0.22em] text-[#8f7000]">Deals</h1>
        <div className="mt-4">
          <DealHubCards />
        </div>
        <p className="mt-6 text-center text-sm text-[#657066]">
          Need a truckload? Call {CUSTOMER_SUPPORT_PHONE_DISPLAY} — quote only.
        </p>
        <div className="mt-4">
          <PickupStrip />
        </div>
      </div>
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
              <img src={item.image} alt={item.alt} className="aspect-square w-full rounded-2xl object-cover" />
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
