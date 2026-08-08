import { FormEvent, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useRoute } from "wouter";
import { ArrowRight, Check, Leaf, Loader2, MapPinned, PackageCheck, Phone, Sprout } from "lucide-react";
import { CUSTOMER_SUPPORT_PHONE_DISPLAY, CUSTOMER_SUPPORT_PHONE_TEL } from "@/config/contact";
import { trackEcommerceEvent, trackEvent } from "@/lib/analytics";

type BundleItem = {
  name: string;
  amount: string;
  image: string;
  alt: string;
};

type BundleOffer = {
  slug: string;
  eyebrow: string;
  title: string;
  shortTitle: string;
  description: string;
  heroImage: string;
  heroAlt: string;
  listPrice: number;
  salePrice: number;
  savings: number;
  badge: string;
  idealFor: string;
  result: string;
  items: BundleItem[];
  couponOnly?: boolean;
};

const productImages = {
  plantpal: {
    image: "/images/optimized/plantpal-bag-context.webp",
    alt: "PlantPal all-stage potting mix bag with fresh vegetables",
  },
  simons: {
    image: "/images/optimized/simons-gold-bag-context.webp",
    alt: "Simon's Gold dairy compost bag with fresh vegetables",
  },
  mikeys: {
    image: "/images/optimized/mikeys-worm-poop-bag-context.webp",
    alt: "Mikey's Worm Poop worm castings bag with vegetables and soil",
  },
  mulch: {
    image: "/images/optimized/natures-blanket-bag-context.webp",
    alt: "Nature's Blanket Premium mulch bag with rich brown mulch",
  },
};

const offers: BundleOffer[] = [
  {
    slug: "garden-refresh",
    eyebrow: "The 4×8 raised-bed reset",
    title: "Garden Refresh",
    shortTitle: "Garden Refresh",
    description: "Ten cubic feet across seven bags: compost, worm castings, and mulch—exactly what one 4×8 raised bed needs for fall.",
    heroImage: "/images/offers/garden-refresh.png",
    heroAlt: "Garden Refresh offer: seven bags for one 4 by 8 raised bed, $69 pickup price",
    listPrice: 91,
    salePrice: 69,
    savings: 22,
    badge: "Save $22",
    idealFor: "Refreshing one existing 4×8 raised bed for fall",
    result: "Four cubic feet feed the soil and six cubic feet finish the bed with mulch.",
    items: [
      { name: "Nature's Blanket Premium mulch", amount: "3 × 2-cu-ft bags", ...productImages.mulch },
      { name: "Mikey's Worm Poop worm castings", amount: "3 × 1-cu-ft bags", ...productImages.mikeys },
      { name: "Simon's Gold dairy compost", amount: "1 × 1-cu-ft bag", ...productImages.simons },
    ],
  },
  {
    slug: "big-garden-setup",
    eyebrow: "Fill the beds. Feed the soil. Finish the surface.",
    title: "Big Garden Setup",
    shortTitle: "Big Garden Setup",
    description: "One 2.2-cubic-yard tote of living soil plus ten bags of compost, worm castings, and mulch for two to three 4×8 beds.",
    heroImage: "/images/offers/big-garden-setup.png",
    heroAlt: "Big Garden Setup offer: one PlantPal tote and ten bags for $459",
    listPrice: 642,
    salePrice: 459,
    savings: 183,
    badge: "Save $183",
    idealFor: "Building or deeply resetting two to three 4×8 garden beds",
    result: "72.4 cubic feet of total material in one coordinated Phoenix pickup.",
    items: [
      { name: "PlantPal living soil", amount: "1 × 2.2-cu-yd tote", ...productImages.plantpal },
      { name: "Simon's Gold dairy compost", amount: "4 × 1-cu-ft bags", ...productImages.simons },
      { name: "Mikey's Worm Poop worm castings", amount: "3 × 1-cu-ft bags", ...productImages.mikeys },
      { name: "Nature's Blanket Premium mulch", amount: "3 × 2-cu-ft bags", ...productImages.mulch },
    ],
  },
];

const fmt = (value: number) => `$${value.toFixed(2)}`;

const legacyOfferAliases: Record<string, string> = {
  "raised-bed-refresh": "garden-refresh",
  "garden-bed-builder": "big-garden-setup",
};

export default function BundleOffers() {
  const [, params] = useRoute("/offers/:slug");
  const requestedSlug = (params as { slug?: string } | null)?.slug;
  const slug = requestedSlug ? legacyOfferAliases[requestedSlug] || requestedSlug : undefined;
  const offer = useMemo(() => offers.find((item) => item.slug === slug), [slug]);

  if (!slug) return <OffersIndex />;
  if (!offer) return <OffersIndex />;
  return <OfferPage offer={offer} />;
}

function OffersIndex() {
  return (
    <main className="bg-[#f7f5ef] py-12 sm:py-16">
      <Helmet><title>Garden Bundles | Organic Soil Wholesale</title></Helmet>
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#9a6f39]">Phoenix pickup bundles</p>
        <h1 className="mt-3 max-w-3xl font-heading text-4xl font-bold text-[#183a23] sm:text-5xl">Build a better garden for less.</h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-[#657066]">Complete bundles with Arizona-made soil, compost, worm castings, and mulch. Every offer is built for a specific garden job and priced for pickup.</p>
        <div className="mt-10 grid max-w-5xl gap-6 md:grid-cols-2">
          {offers.map((offer) => <OfferCard offer={offer} key={offer.slug} />)}
        </div>
      </div>
    </main>
  );
}

function OfferCard({ offer }: { offer: BundleOffer }) {
  return (
    <Link href={`/offers/${offer.slug}`} className="group overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-[#dfe5dc] transition hover:-translate-y-1 hover:shadow-xl">
      <img src={offer.heroImage} alt={offer.heroAlt} loading="lazy" className="aspect-[17/22] w-full bg-[#f4f2eb] object-contain" />
      <div className="p-6">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9a6f39]">{offer.badge}</p>
        <h2 className="mt-2 font-heading text-2xl font-bold text-[#183a23]">{offer.shortTitle}</h2>
        <div className="mt-4 flex items-end gap-3"><span className="font-heading text-3xl font-bold text-[#183a23]">{fmt(offer.salePrice)}</span><span className="pb-1 text-sm text-[#758077] line-through">{fmt(offer.listPrice)}</span></div>
        <span className="mt-5 inline-flex items-center gap-2 font-bold text-[#215330]">See bundle <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
      </div>
    </Link>
  );
}

function OfferPage({ offer }: { offer: BundleOffer }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/contact/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          subject: `Bundle reservation request: ${offer.title}`,
          message: `I would like to reserve the ${offer.title} at the promotional pickup price of ${fmt(offer.salePrice)}.`,
        }),
      });
      if (!res.ok) throw new Error("bundle_request_failed");
      trackEvent("Garden Bundle Requested", { bundle: offer.slug, value: offer.salePrice });
      trackEcommerceEvent("generate_lead", { lead_type: "garden_bundle", bundle: offer.slug, value: offer.salePrice, pickup_sales_channel: "osw_yard" });
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  };

  return (
    <main className="bg-[#f7f5ef] text-[#183a23]">
      <Helmet>
        <title>{offer.title} | Organic Soil Wholesale</title>
        <meta name="description" content={`${offer.title}: ${offer.description} Phoenix pickup for ${fmt(offer.salePrice)}.`} />
      </Helmet>
      <section className="overflow-hidden bg-[#153b22] text-white">
        <div className="mx-auto grid max-w-7xl gap-0 lg:grid-cols-2">
          <div className="order-2 px-5 py-10 sm:px-8 sm:py-16 lg:order-1 lg:py-20 xl:pl-12">
            <Link href="/offers" className="text-sm font-bold text-[#f1d6a6] underline underline-offset-4">All garden bundles</Link>
            <p className="mt-7 inline-flex rounded-full border border-[#f1d6a6]/35 bg-[#f1d6a6]/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#f6e5c4]">{offer.eyebrow}</p>
            <h1 className="mt-5 max-w-xl font-heading text-4xl font-bold leading-tight sm:text-5xl">{offer.title}</h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-white/80">{offer.description}</p>
            <div className="mt-8 flex flex-wrap items-end gap-x-4 gap-y-2">
              <span className="font-heading text-5xl font-bold text-[#f6e5c4]">{fmt(offer.salePrice)}</span>
              <span className="pb-2 text-xl text-white/55 line-through">{fmt(offer.listPrice)}</span>
              <span className="mb-2 rounded-full bg-[#e9c66c] px-3 py-1 text-sm font-extrabold text-[#183a23]">Save {fmt(offer.savings)}</span>
            </div>
            <p className="mt-3 text-sm font-semibold text-[#f1d6a6]">{offer.badge} · Phoenix yard pickup</p>
          </div>
          <div className="order-1 min-h-[300px] bg-[#f4f2eb] lg:order-2 lg:min-h-full">
            <img src={offer.heroImage} alt={offer.heroAlt} className="h-full min-h-[300px] w-full object-contain" fetchPriority="high" />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[1.18fr_0.82fr] lg:gap-14">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#9a6f39]">What you get</p>
          <h2 className="mt-3 font-heading text-3xl font-bold sm:text-4xl">Everything in this pickup bundle.</h2>
          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            {offer.items.map((item) => (
              <article className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-[#e0e5dc]" key={`${item.name}-${item.amount}`}>
                <img src={item.image} alt={item.alt} loading="lazy" className="aspect-[4/3] w-full object-cover" />
                <div className="p-4"><p className="font-heading text-lg font-bold">{item.name}</p><p className="mt-1 text-sm font-semibold text-[#5c6a5e]">{item.amount}</p></div>
              </article>
            ))}
          </div>
        </div>
        <aside className="h-fit rounded-3xl border border-[#d7e0d3] bg-white p-6 shadow-lg sm:p-8 lg:sticky lg:top-28">
          <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#eaf2e5] text-[#215330]"><Sprout className="h-5 w-5" /></span><p className="font-heading text-xl font-bold">Built for your garden</p></div>
          <p className="mt-4 leading-7 text-[#5f6c62]"><strong className="text-[#183a23]">Best for:</strong> {offer.idealFor}</p>
          <p className="mt-3 leading-7 text-[#5f6c62]"><strong className="text-[#183a23]">The result:</strong> {offer.result}</p>
          <ul className="mt-6 space-y-3 text-sm font-semibold text-[#3d5141]"><li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#2c7141]" /> Arizona-made products</li><li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#2c7141]" /> Phoenix yard pickup</li><li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#2c7141]" /> One simple bundle price</li>{offer.couponOnly && <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#2c7141]" /> Valid with your private worm-castings coupon</li>}</ul>
          <a href="#reserve" className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#183a23] px-5 py-3 font-bold text-white transition hover:bg-[#0d2917]">Request this bundle <ArrowRight className="h-4 w-4" /></a>
          <a href={CUSTOMER_SUPPORT_PHONE_TEL} className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#cbd6c7] px-5 py-3 font-bold text-[#215330]"><Phone className="h-4 w-4" /> {CUSTOMER_SUPPORT_PHONE_DISPLAY}</a>
        </aside>
      </section>

      <section id="reserve" className="border-y border-[#d9e1d5] bg-[#eaf0e6] py-12 sm:py-16">
        <div className="mx-auto grid max-w-5xl gap-8 px-5 sm:px-8 md:grid-cols-[0.8fr_1.2fr] md:items-center">
          <div><PackageCheck className="h-10 w-10 text-[#215330]" /><p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-[#9a6f39]">Pickup request</p><h2 className="mt-3 font-heading text-3xl font-bold">Request your bundle.</h2><p className="mt-4 leading-7 text-[#59685e]">A yard representative will confirm availability and your Phoenix pickup details. Your requested price is <strong className="text-[#183a23]">{fmt(offer.salePrice)}</strong>.</p><a href="https://www.google.com/maps/dir/?api=1&destination=33.467333%2C-112.101250" className="mt-5 inline-flex items-center gap-2 font-bold text-[#215330] underline underline-offset-4"><MapPinned className="h-5 w-5" /> Open the exact entrance pin</a></div>
          {status === "sent" ? <div className="rounded-3xl bg-white p-8 text-center shadow-sm"><Check className="mx-auto h-11 w-11 text-[#2c7141]" /><h3 className="mt-4 font-heading text-2xl font-bold">Your request is in.</h3><p className="mt-3 leading-7 text-[#5f6c62]">We’ll confirm your bundle pickup soon.</p></div> : <form onSubmit={submit} className="rounded-3xl bg-white p-6 shadow-sm sm:p-8"><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-bold">Full name<input required value={name} onChange={(e) => setName(e.target.value)} className="mt-2 h-12 w-full rounded-xl border border-[#cfd9cc] px-3 font-normal" /></label><label className="text-sm font-bold">Phone<input required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-2 h-12 w-full rounded-xl border border-[#cfd9cc] px-3 font-normal" /></label></div><label className="mt-4 block text-sm font-bold">Email<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 h-12 w-full rounded-xl border border-[#cfd9cc] px-3 font-normal" /></label>{status === "error" && <p className="mt-3 text-sm font-semibold text-red-700">We could not submit that request. Please call us at {CUSTOMER_SUPPORT_PHONE_DISPLAY}.</p>}<button disabled={status === "sending"} className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#183a23] px-5 py-3 font-bold text-white disabled:opacity-60">{status === "sending" ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending request…</> : <>Request {offer.shortTitle} <ArrowRight className="h-4 w-4" /></>}</button><p className="mt-3 text-center text-xs leading-5 text-[#69756c]">Pickup availability will be confirmed by the yard team.</p></form>}
        </div>
      </section>
    </main>
  );
}
