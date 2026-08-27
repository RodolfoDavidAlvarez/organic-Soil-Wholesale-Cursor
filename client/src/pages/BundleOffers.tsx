import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useRoute } from "wouter";
import { Phone, ShoppingBag } from "lucide-react";
import {
  CUSTOMER_SUPPORT_PHONE_DISPLAY,
  CUSTOMER_SUPPORT_PHONE_TEL,
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
import OfferFlyerImage from "@/components/OfferFlyerImage";

const YARD_FOOTER = `Tue–Sat 8–1 and 2–4 · 1634 N 19th Ave, Phoenix · ${CUSTOMER_SUPPORT_PHONE_DISPLAY}`;

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
    <main className="bg-[#f7f5ef] py-8 sm:py-12">
      <Helmet>
        <title>Fall pickup bundles | Organic Soil Wholesale</title>
        <meta
          name="description"
          content="Refresh $69, Plus $149, Big Garden $459. Phoenix yard pickup."
        />
        <link rel="canonical" href="https://organicsoilwholesale.com/offers" />
      </Helmet>
      <div className="mx-auto max-w-5xl px-4">
        <h1 className="font-heading text-3xl font-bold text-[#183a23] sm:text-4xl">Fall pickup bundles</h1>
        <p className="mt-2 max-w-xl text-base text-[#5f6c62]">
          Three setups. Add one to your order, then keep shopping if you want.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {PROMO_BUNDLES.map((offer) => (
            <OfferCard offer={offer} key={offer.slug} />
          ))}
        </div>
        <aside className="mt-6 rounded-2xl bg-white px-4 py-4 text-sm text-[#5f6c62] ring-1 ring-[#dfe5dc]">
          <p className="font-bold text-[#183a23]">Need a truckload?</p>
          <p className="mt-1">Quote only.</p>
          <a href={CUSTOMER_SUPPORT_PHONE_TEL} className="mt-2 inline-flex min-h-11 items-center font-bold text-[#215330]">
            Call {CUSTOMER_SUPPORT_PHONE_DISPLAY}
          </a>
        </aside>
        <p className="mt-6 text-xs leading-5 text-[#758077]">{YARD_FOOTER}</p>
      </div>
    </main>
  );
}

function OfferCard({ offer }: { offer: PromoBundle }) {
  return (
    <Link
      href={`/offers/${offer.slug}`}
      className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-[#dfe5dc]"
    >
      <OfferFlyerImage
        src={offer.cardImage}
        alt={offer.heroAlt}
        loading="lazy"
        wrapperClassName="aspect-[3/4] w-full"
        className="aspect-[3/4] w-full object-contain"
      />
      <div className="p-4">
        <h2 className="font-heading text-xl font-bold text-[#183a23]">{offer.cardName}</h2>
        <p className="mt-1 text-2xl font-extrabold text-[#183a23]">${offer.salePrice}</p>
        <p className="mt-1 text-sm text-[#657066]">{offer.line}</p>
        <span className="mt-4 inline-flex min-h-11 items-center font-bold text-[#215330]">View</span>
      </div>
    </Link>
  );
}

function OfferPage({ offer }: { offer: PromoBundle }) {
  const { addItem, openDrawer, items } = useQuoteCart();
  const { toast } = useToast();
  const [justAdded, setJustAdded] = useState(false);
  const alreadyInCart = items.some((item) => item.productId === offer.productId && item.format === offer.format);

  const addBundle = () => {
    addItem(promoBundleCartItem(offer) as CartItem);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1400);
    trackEvent("Garden Bundle Added", { bundle: offer.slug, value: offer.salePrice });
    toast({
      title: "Added to your order",
      description: `${offer.title} · $${offer.salePrice}`,
      duration: 4000,
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

  return (
    <main className="bg-[#f7f5ef] pb-10 text-[#183a23]">
      <Helmet>
        <title>{offer.headline} | Organic Soil Wholesale</title>
        <meta name="description" content={`${offer.headline} ${offer.line} Phoenix pickup.`} />
        <link rel="canonical" href={`https://organicsoilwholesale.com/offers/${offer.slug}`} />
      </Helmet>

      <div className="mx-auto max-w-xl">
        <OfferFlyerImage
          src={offer.heroImage}
          alt={offer.heroAlt}
          fetchPriority="high"
          loading="eager"
          decoding="async"
          wrapperClassName="min-h-[280px] w-full bg-[#f4f2eb]"
          className="min-h-[280px] w-full object-contain"
        />

        <div className="px-4 pt-5">
          <Link href="/offers" className="text-sm font-bold text-[#215330] underline underline-offset-4">
            All bundles
          </Link>
          <h1 className="mt-4 font-heading text-3xl font-bold leading-tight sm:text-4xl">{offer.headline}</h1>
          <p className="mt-2 text-base text-[#5f6c62]">{offer.line}</p>

          <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-[#9a6f39]">In it</p>
          <ul className="mt-3 space-y-2">
            {offer.items.map((item) => (
              <li key={item.listLabel} className="flex min-h-11 items-center gap-3">
                <img src={item.image} alt="" className="h-11 w-11 shrink-0 rounded-lg object-cover" />
                <span className="text-sm font-semibold">{item.listLabel}</span>
              </li>
            ))}
          </ul>

          <p className="mt-6 text-base leading-7 text-[#5f6c62]">{offer.useLine}</p>

          <button
            type="button"
            onClick={addBundle}
            className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#183a23] px-5 text-base font-extrabold text-white"
          >
            <ShoppingBag className="h-4 w-4" />
            {justAdded || alreadyInCart ? `Add another · $${offer.salePrice}` : offer.ctaLabel}
          </button>
          <p className="mt-2 text-sm text-[#758077]">{offer.priceTalk}</p>

          <p className="mt-8 text-xs leading-5 text-[#758077]">
            Tue–Sat 8–1 and 2–4 · 1634 N 19th Ave, Phoenix ·{" "}
            <a href={CUSTOMER_SUPPORT_PHONE_TEL} className="font-semibold text-[#215330]">
              {CUSTOMER_SUPPORT_PHONE_DISPLAY}
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
