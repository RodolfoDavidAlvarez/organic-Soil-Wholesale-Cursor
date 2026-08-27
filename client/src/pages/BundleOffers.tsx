import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useLocation, useRoute } from "wouter";
import {
  ArrowRight,
  Check,
  Clock3,
  Leaf,
  MapPinned,
  Phone,
  ShoppingBag,
  Sprout,
  Truck,
} from "lucide-react";
import {
  CUSTOMER_SUPPORT_PHONE_DISPLAY,
  CUSTOMER_SUPPORT_PHONE_TEL,
  PHOENIX_YARD_ADDRESS,
  PHOENIX_YARD_DIRECTIONS_URL,
} from "@/config/contact";
import { useQuoteCart } from "@/contexts/QuoteCartContext";
import { useToast } from "@/components/ui/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { trackEvent } from "@/lib/analytics";
import {
  getPromoBundleBySlug,
  promoBundleCartItem,
  type PromoBundle,
  PROMO_BUNDLES,
} from "@shared/promoBundles.js";
import type { CartItem } from "@/contexts/QuoteCartContext";

const fmt = (value: number) => `$${value.toFixed(0)}`;

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

function OffersIndex() {
  return (
    <main className="bg-[#f7f5ef] py-10 sm:py-16">
      <Helmet>
        <title>Garden Bundles | Organic Soil Wholesale</title>
        <meta
          name="description"
          content="Phoenix pickup garden bundles from Organic Soil Wholesale by Soil Seed & Water. Garden Refresh $69, Garden Refresh Plus $149, and Big Garden Setup $459."
        />
        <link rel="canonical" href="https://organicsoilwholesale.com/offers" />
      </Helmet>
      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#9a6f39]">Phoenix pickup bundles</p>
        <h1 className="mt-3 max-w-3xl font-heading text-4xl font-bold text-[#183a23] sm:text-5xl">
          Build a better garden for less.
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-[#657066]">
          Arizona-made soil, compost, worm castings, and mulch—bundled for a real bed job and priced for yard pickup.
          The more you buy, the more you save. Keep shopping Products and check out together.
        </p>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {PROMO_BUNDLES.map((offer) => (
            <OfferCard offer={offer} key={offer.slug} />
          ))}
        </div>

        <section className="mt-10 overflow-hidden rounded-3xl bg-[#183a23] text-white shadow-xl ring-1 ring-[#183a23]/20">
          <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="p-6 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#e9c66c]">Wholesale · bulk · landscapers</p>
              <h2 className="mt-3 font-heading text-2xl font-bold sm:text-3xl">Need a truckload, not a bundle?</h2>
              <p className="mt-3 max-w-xl text-base leading-7 text-white/80">
                24-ton Simon&apos;s Gold walking-floor loads and bulk delivery stay quote-only. Pickup is available at the Phoenix yard. Delivery is available across Arizona. Call now and we&apos;ll price the load.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <a
                  href={CUSTOMER_SUPPORT_PHONE_TEL}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#e9c66c] px-5 py-3 text-base font-extrabold text-[#183a23]"
                >
                  <Phone className="h-4 w-4" />
                  {CUSTOMER_SUPPORT_PHONE_DISPLAY}
                </a>
                <Link
                  href="/landscapers"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/25 px-5 py-3 text-base font-bold text-white"
                >
                  Landscaper supplies <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <div className="border-t border-white/10 bg-[#0f2918] p-6 sm:p-8 lg:border-l lg:border-t-0">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#e9c66c]">Yard hours</p>
              <p className="mt-3 flex items-start gap-2 text-sm leading-6 text-white/85">
                <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-[#e9c66c]" />
                Tue–Sat · 8am–1pm and 2pm–4pm
              </p>
              <p className="mt-3 flex items-start gap-2 text-sm leading-6 text-white/85">
                <MapPinned className="mt-0.5 h-4 w-4 shrink-0 text-[#e9c66c]" />
                {PHOENIX_YARD_ADDRESS}
              </p>
              <a
                href={PHOENIX_YARD_DIRECTIONS_URL}
                className="mt-5 inline-flex min-h-11 items-center gap-2 font-bold text-[#e9c66c] underline underline-offset-4"
              >
                Open the entrance pin <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function OfferCard({ offer }: { offer: PromoBundle }) {
  return (
    <Link
      href={`/offers/${offer.slug}`}
      className="group overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-[#dfe5dc] transition hover:-translate-y-1 hover:shadow-xl"
    >
      <img src={offer.heroImage} alt={offer.heroAlt} loading="lazy" className="aspect-[3/4] w-full bg-[#f4f2eb] object-contain" />
      <div className="p-5 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9a6f39]">{offer.badge}</p>
        <h2 className="mt-2 font-heading text-2xl font-bold text-[#183a23]">{offer.shortTitle}</h2>
        <p className="mt-2 text-sm leading-6 text-[#657066]">{offer.volumeLabel} · {offer.bagLabel}</p>
        <div className="mt-4 flex items-end gap-3">
          <span className="font-heading text-3xl font-bold text-[#183a23]">{fmt(offer.salePrice)}</span>
          <span className="pb-1 text-sm text-[#758077] line-through">{fmt(offer.listPrice)}</span>
        </div>
        <span className="mt-5 inline-flex min-h-11 items-center gap-2 font-bold text-[#215330]">
          See bundle <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}

function OfferPage({ offer }: { offer: PromoBundle }) {
  const { addItem, openDrawer, items } = useQuoteCart();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [justAdded, setJustAdded] = useState(false);
  const alreadyInCart = items.some((item) => item.productId === offer.productId && item.format === offer.format);

  const addBundle = () => {
    addItem(promoBundleCartItem(offer) as CartItem);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1400);
    trackEvent("Garden Bundle Added", { bundle: offer.slug, value: offer.salePrice });
    toast({
      title: "Added to your order",
      description: `${offer.title} · ${fmt(offer.salePrice)} Phoenix pickup. Keep shopping or check out.`,
      duration: 4500,
      action: (
        <ToastAction
          altText="View order"
          onClick={() => openDrawer()}
          className="border-[#183a23]/25 bg-[#183a23] text-white hover:bg-[#0d2917] hover:text-white"
        >
          View order
        </ToastAction>
      ),
    });
  };

  const otherOffers = PROMO_BUNDLES.filter((item) => item.slug !== offer.slug);

  return (
    <main className="bg-[#f7f5ef] pb-28 text-[#183a23] lg:pb-12">
      <Helmet>
        <title>{offer.title} | Organic Soil Wholesale</title>
        <meta name="description" content={`${offer.title}: ${offer.description} Phoenix pickup for ${fmt(offer.salePrice)}.`} />
        <link rel="canonical" href={`https://organicsoilwholesale.com/offers/${offer.slug}`} />
      </Helmet>

      <section className="overflow-hidden bg-[#153b22] text-white">
        <div className="mx-auto grid max-w-7xl lg:grid-cols-2">
          <div className="order-2 px-4 py-8 sm:px-8 sm:py-14 lg:order-1 lg:py-16 xl:pl-12">
            <Link href="/offers" className="text-sm font-bold text-[#f1d6a6] underline underline-offset-4">
              All garden bundles
            </Link>
            <p className="mt-6 inline-flex rounded-full border border-[#f1d6a6]/35 bg-[#f1d6a6]/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#f6e5c4]">
              {offer.eyebrow}
            </p>
            <h1 className="mt-5 max-w-xl font-heading text-4xl font-bold leading-tight sm:text-5xl">{offer.title}</h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-white/80">{offer.description}</p>
            <div className="mt-8 flex flex-wrap items-end gap-x-4 gap-y-2">
              <span className="font-heading text-5xl font-bold text-[#f6e5c4]">{fmt(offer.salePrice)}</span>
              <span className="pb-2 text-xl text-white/55 line-through">{fmt(offer.listPrice)}</span>
              <span className="mb-2 rounded-full bg-[#e9c66c] px-3 py-1.5 text-sm font-extrabold text-[#183a23]">{offer.badge}</span>
            </div>
            <p className="mt-3 text-sm font-semibold text-[#f1d6a6]">Phoenix yard pickup · pay now, keep shopping</p>
            <div className="mt-8 hidden gap-3 lg:flex">
              <button
                type="button"
                onClick={addBundle}
                className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#e9c66c] px-5 py-3 text-base font-extrabold text-[#183a23] transition hover:bg-[#f1d6a6]"
              >
                <ShoppingBag className="h-5 w-5" />
                {justAdded || alreadyInCart ? "Add another to order" : "Add to order"}
              </button>
              <a
                href={CUSTOMER_SUPPORT_PHONE_TEL}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/25 px-5 py-3 font-bold text-white"
              >
                <Phone className="h-4 w-4" />
                {CUSTOMER_SUPPORT_PHONE_DISPLAY}
              </a>
            </div>
            {offer.wormBagUpsell ? (
              <p className="mt-6 max-w-xl text-sm leading-6 text-[#f6e5c4]/90">{offer.wormBagUpsell}</p>
            ) : null}
          </div>
          <div className="order-1 min-h-[280px] bg-[#f4f2eb] lg:order-2 lg:min-h-full">
            <img src={offer.heroImage} alt={offer.heroAlt} className="h-full min-h-[280px] w-full object-contain" fetchPriority="high" />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-8 sm:py-14 lg:grid-cols-[1.18fr_0.82fr] lg:gap-12">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#9a6f39]">What you take home</p>
          <h2 className="mt-3 font-heading text-3xl font-bold sm:text-4xl">Everything in this pickup bundle.</h2>
          <p className="mt-3 max-w-xl text-base leading-7 text-[#5f6c62]">
            Shown below, exactly what you pick up. Arizona-made products. One simple bundle price.
          </p>
          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            {offer.items.map((item) => (
              <article className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-[#e0e5dc]" key={`${item.name}-${item.amount}`}>
                <img src={item.image} alt={item.alt} loading="lazy" className="aspect-[4/3] w-full object-cover" />
                <div className="p-4">
                  <p className="font-heading text-lg font-bold">{item.name}</p>
                  <p className="mt-1 text-sm font-semibold text-[#5c6a5e]">{item.amount}</p>
                </div>
              </article>
            ))}
          </div>
          <dl className="mt-6 grid grid-cols-3 gap-2 rounded-2xl bg-white p-4 text-center ring-1 ring-[#e0e5dc]">
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9a6f39]">Material</dt>
              <dd className="mt-1 text-sm font-extrabold text-[#183a23]">{offer.volumeLabel}</dd>
            </div>
            <div className="border-x border-[#e0e5dc]">
              <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9a6f39]">Load</dt>
              <dd className="mt-1 text-sm font-extrabold text-[#183a23]">{offer.bagLabel}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9a6f39]">Job</dt>
              <dd className="mt-1 text-sm font-extrabold text-[#183a23]">{offer.bedLabel}</dd>
            </div>
          </dl>
        </div>

        <aside className="h-fit rounded-3xl border border-[#d7e0d3] bg-white p-6 shadow-lg sm:p-8 lg:sticky lg:top-28">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#eaf2e5] text-[#215330]">
              <Sprout className="h-5 w-5" />
            </span>
            <p className="font-heading text-xl font-bold">Built for your garden</p>
          </div>
          <p className="mt-4 leading-7 text-[#5f6c62]">
            <strong className="text-[#183a23]">Best for:</strong> {offer.idealFor}
          </p>
          <p className="mt-3 leading-7 text-[#5f6c62]">
            <strong className="text-[#183a23]">The result:</strong> {offer.result}
          </p>
          <ul className="mt-6 space-y-3 text-sm font-semibold text-[#3d5141]">
            <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#2c7141]" /> Arizona-made products</li>
            <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#2c7141]" /> Phoenix yard pickup</li>
            <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#2c7141]" /> One bundle price · already discounted</li>
            <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#2c7141]" /> Add more from Products, then check out</li>
          </ul>
          <p className="mt-5 text-sm leading-6 text-[#5f6c62]">{offer.pickupNote}</p>
          <button
            type="button"
            onClick={addBundle}
            className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#183a23] px-5 py-3 font-bold text-white transition hover:bg-[#0d2917]"
          >
            <ShoppingBag className="h-4 w-4" />
            {justAdded ? "Added" : alreadyInCart ? "Add another to order" : "Add to order"}
          </button>
          <a
            href={CUSTOMER_SUPPORT_PHONE_TEL}
            className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#cbd6c7] px-5 py-3 font-bold text-[#215330]"
          >
            <Phone className="h-4 w-4" /> Call {CUSTOMER_SUPPORT_PHONE_DISPLAY}
          </a>
          <button
            type="button"
            onClick={() => navigate("/products")}
            className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-[#215330] underline underline-offset-4"
          >
            Keep shopping Products
          </button>
        </aside>
      </section>

      <section className="border-y border-[#d9e1d5] bg-[#eaf0e6] py-10 sm:py-14">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-8 md:grid-cols-3">
          <article className="rounded-2xl bg-white p-5 ring-1 ring-[#d7e0d3]">
            <MapPinned className="h-6 w-6 text-[#215330]" />
            <h3 className="mt-3 font-heading text-lg font-bold">Pickup at the Phoenix yard</h3>
            <p className="mt-2 text-sm leading-6 text-[#5f6c62]">{PHOENIX_YARD_ADDRESS}</p>
            <p className="mt-2 text-sm font-semibold text-[#183a23]">Tue–Sat · 8am–1pm and 2pm–4pm</p>
            <a href={PHOENIX_YARD_DIRECTIONS_URL} className="mt-4 inline-flex min-h-11 items-center font-bold text-[#215330] underline underline-offset-4">
              Open the exact entrance pin
            </a>
          </article>
          <article className="rounded-2xl bg-white p-5 ring-1 ring-[#d7e0d3]">
            <Truck className="h-6 w-6 text-[#215330]" />
            <h3 className="mt-3 font-heading text-lg font-bold">Pickup available. Delivery available.</h3>
            <p className="mt-2 text-sm leading-6 text-[#5f6c62]">
              These bundles are pay-and-pickup. Need bulk, a walking-floor truck, or a delivery quote? Call and we&apos;ll price it. The more you buy, the more you save.
            </p>
            <Link href="/operations-calendar" className="mt-4 inline-flex min-h-11 items-center font-bold text-[#215330] underline underline-offset-4">
              Yard schedule
            </Link>
          </article>
          <article className="rounded-2xl bg-white p-5 ring-1 ring-[#d7e0d3]">
            <Leaf className="h-6 w-6 text-[#215330]" />
            <h3 className="mt-3 font-heading text-lg font-bold">Organic Soil Wholesale</h3>
            <p className="mt-2 text-sm leading-6 text-[#5f6c62]">
              by Soil Seed &amp; Water. Arizona-made compost, mix, castings, and mulch for gardens, landscapers, and farms.
            </p>
            <a href={CUSTOMER_SUPPORT_PHONE_TEL} className="mt-4 inline-flex min-h-11 items-center font-bold text-[#215330] underline underline-offset-4">
              Call now to request your quote
            </a>
          </article>
        </div>
      </section>

      {otherOffers.length > 0 ? (
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-8 sm:py-14">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#9a6f39]">More pickup bundles</p>
          <h2 className="mt-3 font-heading text-3xl font-bold">The more you buy, the more you save.</h2>
          <div className="mt-7 grid gap-6 md:grid-cols-2">
            {otherOffers.map((item) => (
              <OfferCard offer={item} key={item.slug} />
            ))}
          </div>
        </section>
      ) : null}

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#d9e1d5] bg-[#f7f5ef]/95 px-3 pt-3 shadow-[0_-10px_30px_rgba(24,58,35,0.12)] backdrop-blur lg:hidden pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="min-w-0">
            <p className="text-lg font-extrabold leading-none text-[#183a23]">{fmt(offer.salePrice)}</p>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9a6f39]">{offer.badge} · pickup</p>
          </div>
          <button
            type="button"
            onClick={addBundle}
            className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#183a23] px-4 text-base font-extrabold text-white"
          >
            <ShoppingBag className="h-4 w-4" />
            {justAdded ? "Added" : "Add to order"}
          </button>
          <a
            href={CUSTOMER_SUPPORT_PHONE_TEL}
            aria-label={`Call ${CUSTOMER_SUPPORT_PHONE_DISPLAY}`}
            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#cbd6c7] text-[#183a23]"
          >
            <Phone className="h-5 w-5" />
          </a>
        </div>
      </div>
    </main>
  );
}
