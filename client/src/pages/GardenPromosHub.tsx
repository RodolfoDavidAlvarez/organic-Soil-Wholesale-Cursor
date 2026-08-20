import { Link } from "wouter";
import { ArrowRight, Phone } from "lucide-react";
import SEO from "@/components/layout/SEO";
import {
  CUSTOMER_SUPPORT_PHONE_DIAL,
  CUSTOMER_SUPPORT_PHONE_DISPLAY,
  CUSTOMER_SUPPORT_PHONE_TEL,
} from "@/config/contact";
import { trackEvent } from "@/lib/analytics";
import { GARDEN_PROMOS, type GardenPromo } from "@shared/gardenPromos.js";

const fmt = (value: number) => `$${value.toFixed(0)}`;

function PromoCard({ promo }: { promo: GardenPromo }) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-[#dfe5dc]">
      <img src={promo.imageUrl} alt={promo.title} className="h-44 w-full object-cover" />
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9a6f39]">{promo.eyebrow}</p>
        <h2 className="mt-2 font-heading text-2xl font-bold text-[#183a23]">{promo.title}</h2>
        <p className="mt-2 text-sm leading-6 text-[#5f6c62]">{promo.summary}</p>
        <div className="mt-4 flex items-end gap-2">
          <span className="font-heading text-3xl font-bold text-[#183a23]">{fmt(promo.salePrice)}</span>
          <span className="pb-1 text-sm text-[#758077] line-through">{fmt(promo.listPrice)}</span>
        </div>
        <p className="mt-1 text-sm font-semibold text-[#215330]">You save {fmt(promo.savings)} · {promo.bagCount} bags</p>
        <div className="mt-5 grid gap-2">
          <a
            href={CUSTOMER_SUPPORT_PHONE_TEL}
            aria-label={`Call ${CUSTOMER_SUPPORT_PHONE_DISPLAY}`}
            data-official-support-phone="true"
            data-phone-number={CUSTOMER_SUPPORT_PHONE_DIAL}
            onClick={() => trackEvent("Garden Promo Call CTA", { promo: promo.slug, placement: "hub_card" })}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#16351f] px-4 font-bold text-white"
          >
            <Phone className="h-4 w-4" />
            Call <span data-official-support-phone-text="true">{CUSTOMER_SUPPORT_PHONE_DISPLAY}</span>
          </a>
          <Link
            href={`/${promo.slug}`}
            onClick={() => trackEvent("Garden Promo Opened", { promo: promo.slug, placement: "hub_card" })}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#16351f] px-4 font-bold text-[#16351f]"
          >
            See {promo.shortTitle} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}

export function HomepagePromoBand() {
  return (
    <section className="bg-[#16351f] py-8 text-white sm:py-10">
      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f1d6a6]">Fall garden packages</p>
            <h2 className="mt-2 font-heading text-3xl font-bold leading-tight sm:text-4xl">Call in a raised garden bed package.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/80 sm:text-base">
              Potting soil, compost, worm castings, and mulch for raised garden beds. Wholesale, bulk, pickup, and delivery are available.
            </p>
          </div>
          <Link
            href="/promos"
            onClick={() => trackEvent("Garden Promo Hub Opened", { placement: "homepage" })}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#f6e5c4] px-5 font-extrabold text-[#16351f]"
          >
            See all packages <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {GARDEN_PROMOS.map((promo) => (
            <div key={promo.slug} className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15">
              <p className="font-heading text-xl font-bold">{promo.title}</p>
              <p className="mt-1 text-2xl font-extrabold text-[#f6e5c4]">{fmt(promo.salePrice)}</p>
              <p className="mt-1 text-sm text-white/75">{promo.bagCount} bags · {promo.eyebrow}</p>
              <div className="mt-4 grid gap-2">
                <a
                  href={CUSTOMER_SUPPORT_PHONE_TEL}
                  aria-label={`Call ${CUSTOMER_SUPPORT_PHONE_DISPLAY}`}
                  data-official-support-phone="true"
                  data-phone-number={CUSTOMER_SUPPORT_PHONE_DIAL}
                  onClick={() => trackEvent("Garden Promo Call CTA", { promo: promo.slug, placement: "homepage" })}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#f6e5c4] px-3 text-sm font-extrabold text-[#16351f]"
                >
                  <Phone className="h-4 w-4" />
                  Call <span data-official-support-phone-text="true">{CUSTOMER_SUPPORT_PHONE_DISPLAY}</span>
                </a>
                <Link
                  href={`/${promo.slug}`}
                  onClick={() => trackEvent("Garden Promo Opened", { promo: promo.slug, placement: "homepage" })}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/35 px-3 text-sm font-bold"
                >
                  Open {promo.shortTitle}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function GardenPromosHub() {
  return (
    <main className="bg-[#f4f1ea] py-10 sm:py-14">
      <SEO
        title="Fall Garden Packages"
        description="Garden Refresh, Garden Refresh Plus, and Big Garden Setup. Call Organic Soil Wholesale for potting soil packages for raised garden beds."
        canonical="https://organicsoilwholesale.com/promos"
      />
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#9a6f39]">Phoenix yard packages</p>
        <h1 className="mt-3 font-heading text-4xl font-bold text-[#183a23] sm:text-5xl">Garden Refresh, Refresh Plus, and Big Garden Setup.</h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-[#657066]">
          Three soil packages for raised garden beds. Call first. Wholesale, bulk, pickup, and delivery are available.
        </p>
        <a
          href={CUSTOMER_SUPPORT_PHONE_TEL}
          aria-label={`Call ${CUSTOMER_SUPPORT_PHONE_DISPLAY}`}
          data-official-support-phone="true"
          data-phone-number={CUSTOMER_SUPPORT_PHONE_DIAL}
          onClick={() => trackEvent("Garden Promo Call CTA", { promo: "hub", placement: "hub_hero" })}
          className="mt-6 inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-[#16351f] px-6 text-lg font-extrabold text-white"
        >
          <Phone className="h-5 w-5" />
          Call <span data-official-support-phone-text="true">{CUSTOMER_SUPPORT_PHONE_DISPLAY}</span>
        </a>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {GARDEN_PROMOS.map((promo) => <PromoCard promo={promo} key={promo.slug} />)}
        </div>
      </div>
    </main>
  );
}
