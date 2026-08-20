import { Link, useLocation } from "wouter";
import { ArrowRight, Check, MapPin, Phone, ShoppingBag, Truck } from "lucide-react";
import SEO from "@/components/layout/SEO";
import { useQuoteCart } from "@/contexts/QuoteCartContext";
import {
  CUSTOMER_SUPPORT_PHONE_DIAL,
  CUSTOMER_SUPPORT_PHONE_DISPLAY,
  CUSTOMER_SUPPORT_PHONE_TEL,
  PHOENIX_YARD_ADDRESS,
  PHOENIX_YARD_DIRECTIONS_URL,
} from "@/config/contact";
import { trackEvent } from "@/lib/analytics";
import { findGardenPromo, type GardenPromo } from "@shared/gardenPromos.js";

const fmt = (value: number) => `$${value.toFixed(2)}`;
const HOURS = "Tue to Sat, 8am to 1pm and 2pm to 4pm";

function CallButton({
  promo,
  placement,
  className,
}: {
  promo: GardenPromo;
  placement: string;
  className?: string;
}) {
  return (
    <a
      href={CUSTOMER_SUPPORT_PHONE_TEL}
      aria-label={`Call ${CUSTOMER_SUPPORT_PHONE_DISPLAY}`}
      data-official-support-phone="true"
      data-phone-number={CUSTOMER_SUPPORT_PHONE_DIAL}
      onClick={() => trackEvent("Garden Promo Call CTA", { promo: promo.slug, placement })}
      className={className}
    >
      <Phone className="h-5 w-5 shrink-0" />
      Call <span data-official-support-phone-text="true">{CUSTOMER_SUPPORT_PHONE_DISPLAY}</span>
    </a>
  );
}

export default function GardenPromoPage({ slug }: { slug: string }) {
  const [, navigate] = useLocation();
  const { addItem } = useQuoteCart();
  const promo = findGardenPromo(slug);

  if (!promo) {
    navigate("/promos");
    return null;
  }

  const orderPackage = () => {
    trackEvent("Garden Promo Order CTA", { promo: promo.slug, value: promo.salePrice });
    addItem({
      productId: promo.productId,
      productName: promo.title,
      productSlug: promo.slug,
      format: promo.format,
      quantity: 1,
      unitPrice: promo.salePrice,
      listUnitPrice: promo.listPrice,
      savingsPerUnit: promo.savings,
      unit: "per package",
      mode: "pay",
      imageUrl: promo.imageUrl,
    });
    navigate("/checkout");
  };

  return (
    <main className="bg-[#f4f1ea] pb-28 text-[#1d3324] sm:pb-10">
      <SEO
        title={`${promo.title} ${fmt(promo.salePrice)}`}
        description={promo.summary}
        canonical={`https://organicsoilwholesale.com/${promo.slug}`}
      />

      <section className="bg-[#16351f] text-white">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
          <Link href="/promos" className="text-sm font-bold text-[#f1d6a6] underline underline-offset-4">
            All garden packages
          </Link>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-[#f1d6a6]">{promo.eyebrow}</p>
          <h1 className="mt-3 font-heading text-4xl font-bold leading-tight sm:text-5xl">{promo.title}</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/85 sm:text-lg">{promo.summary}</p>
          <div className="mt-6 flex flex-wrap items-end gap-3">
            <span className="font-heading text-5xl font-bold text-[#f6e5c4]">{fmt(promo.salePrice)}</span>
            <span className="pb-1 text-lg text-white/55 line-through">{fmt(promo.listPrice)}</span>
            <span className="mb-1 rounded-full bg-[#2f6d45] px-3 py-1 text-sm font-extrabold">
              You save {fmt(promo.savings)}
            </span>
          </div>
          <p className="mt-3 text-sm font-semibold text-[#f1d6a6]">
            {promo.bagCount} bags / {promo.cuFt} cu ft from live bag sizes. Bag-by-bag catalog total {fmt(promo.listPrice)}.
          </p>
          <CallButton
            promo={promo}
            placement="hero"
            className="mt-6 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#f6e5c4] px-5 text-lg font-extrabold text-[#16351f] sm:w-auto sm:min-w-[280px]"
          />
          <button
            type="button"
            onClick={orderPackage}
            className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/30 px-5 font-bold text-white sm:ml-3 sm:mt-6 sm:w-auto"
          >
            Order this package <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 sm:py-12 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9a6f39]">What is in the package</p>
          <h2 className="mt-2 font-heading text-3xl font-bold">The bags, counted out.</h2>
          <p className="mt-3 max-w-xl leading-7 text-[#5b675d]">{promo.useCase}</p>
          <div className="mt-6 grid gap-4">
            {promo.contents.map((item) => (
              <article key={`${item.productId}-${item.format}`} className="flex gap-4 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-[#dfe5dc]">
                <img src={item.image} alt={item.name} className="h-28 w-28 shrink-0 object-cover sm:h-32 sm:w-32" />
                <div className="py-4 pr-4">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#9a6f39]">{item.role}</p>
                  <h3 className="mt-1 font-heading text-xl font-bold">{item.bags} bags {item.name}</h3>
                  <p className="mt-1 text-sm font-semibold text-[#5c6a5e]">
                    {item.cuFt} cu ft · {item.format} · {fmt(item.unitPrice)} each
                    {item.included ? " · included" : ""}
                  </p>
                </div>
              </article>
            ))}
          </div>
          <p className="mt-4 rounded-xl bg-[#edf3e9] px-4 py-3 text-sm font-semibold text-[#215330]">{promo.includedCallout}</p>
        </div>

        <aside className="h-fit rounded-3xl bg-white p-6 shadow-lg ring-1 ring-[#d7e0d3] sm:p-7 lg:sticky lg:top-28">
          <CallButton
            promo={promo}
            placement="sidebar"
            className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#16351f] px-5 text-lg font-extrabold text-white"
          />
          <button
            type="button"
            onClick={orderPackage}
            className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#16351f] px-5 font-bold text-[#16351f]"
          >
            <ShoppingBag className="h-4 w-4" /> Order {fmt(promo.salePrice)}
          </button>
          <ul className="mt-6 space-y-3 text-sm font-semibold text-[#3d5141]">
            <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#2c7141]" /> Wholesale available</li>
            <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#2c7141]" /> Bulk available</li>
            <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#2c7141]" /> Pickup available</li>
            <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#2c7141]" /> Delivery available</li>
          </ul>
          <div className="mt-6 border-t border-[#d9e1d5] pt-5 text-sm leading-6 text-[#5f6c62]">
            <p className="flex items-start gap-2 font-semibold text-[#183a23]"><MapPin className="mt-0.5 h-4 w-4 shrink-0" /> {PHOENIX_YARD_ADDRESS}</p>
            <p className="mt-2">{HOURS}</p>
            <p className="mt-2 flex items-start gap-2"><Truck className="mt-0.5 h-4 w-4 shrink-0" /> Call if you need this package delivered, or a wholesale or bulk load of the same products.</p>
            <a href={PHOENIX_YARD_DIRECTIONS_URL} className="mt-3 inline-block font-bold text-[#215330] underline underline-offset-4">Open the yard entrance pin</a>
          </div>
        </aside>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#16351f]/15 bg-[#16351f] p-3 sm:hidden">
        <CallButton
          promo={promo}
          placement="sticky_mobile"
          className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#f6e5c4] px-4 text-base font-extrabold text-[#16351f]"
        />
        <button
          type="button"
          onClick={orderPackage}
          className="mt-2 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/35 px-4 text-sm font-bold text-white"
        >
          Order this package · {fmt(promo.salePrice)}
        </button>
      </div>
    </main>
  );
}
