import { FormEvent, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useRoute } from "wouter";
import { ArrowRight, Check, Loader2, MapPinned, PackageCheck, Phone, Sprout } from "lucide-react";
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
  hook: string;
  valueNote?: string;
  finePrint?: string;
  quoteOnly?: boolean;
  stack: { name: string; detail: string; value: string }[];
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
  tote: {
    image: "/images/optimized/2-2-cy-tote-supersack.jpg",
    alt: "PlantPal 2.2 cubic yard tote supersack",
  },
  truck: {
    image: "/images/optimized/mixed-truckload-example.jpg",
    alt: "Mixed truckload of soil products ready for delivery",
  },
};

const offers: BundleOffer[] = [
  {
    slug: "garden-refresh",
    hook: "Irresistible starter offer",
    eyebrow: "Home · Low ticket",
    title: "Garden Refresh",
    shortTitle: "Garden Refresh",
    description: "Wake up one 4x8 bed for fall. Mulch cover plus your choice of feed. One pickup. No product guessing.",
    heroImage: "/images/optimized/simons-gold-new-graphics-2-uses.webp",
    heroAlt: "Raised bed soil refresh with compost and healthy plants",
    listPrice: 99,
    salePrice: 69,
    savings: 30,
    badge: "30% off · Phoenix pickup",
    idealFor: "Anyone with existing raised beds or garden beds",
    result: "One pickup. Beds fed. Soil covered. No product guessing.",
    valueNote: "Shown with Option A bag totals at normal single-bag pricing.",
    stack: [
      { name: "3 × Nature's Blanket (2 CF)", detail: "6 CF mulch cover", value: "$33" },
      { name: "Option A: 3 × Simon's Gold (1 CF)", detail: "3 CF dairy compost", value: "$39" },
      { name: "or B: 2 Simon's + 1 Mikey's", detail: "compost + castings", value: "$46" },
    ],
    items: [
      { name: "Nature's Blanket Premium mulch", amount: "3 × 2-cu-ft bags", ...productImages.mulch },
      { name: "Simon's Gold dairy compost", amount: "3 × 1-cu-ft bags (or Option B swap)", ...productImages.simons },
      { name: "Mikey's Worm Poop (optional swap)", amount: "1 × 1-cu-ft bag in Option B", ...productImages.mikeys },
    ],
  },
  {
    slug: "garden-setup",
    hook: "Unbelievable high-value offer",
    eyebrow: "Home · Best value",
    title: "Garden Setup",
    shortTitle: "Garden Setup",
    description: "Get the garden set up. Real volume. One price. Fill beds, feed them, and finish with mulch.",
    heroImage: "/images/optimized/plantpal-new-graphics-2-lifestyle.webp",
    heroAlt: "Garden beds filled with PlantPal potting mix",
    listPrice: 757,
    salePrice: 459,
    savings: 298,
    badge: "39% off · Phoenix pickup",
    idealFor: "Serious home gardeners filling beds the right way",
    result: "Fill the beds, feed them, and finish with mulch in one Phoenix pickup.",
    valueNote: "Tote value equals the same volume as about 40 PlantPal bags at normal bag price.",
    finePrint: "Best if you will use the tote within about a week.",
    stack: [
      { name: "1 × PlantPal tote (2.2 CY)", detail: "~59 CF bed fill", value: "$633" },
      { name: "4 × Simon's Gold (1 CF)", detail: "feed the soil", value: "$52" },
      { name: "2 × Mikey's Worm Poop (1 CF)", detail: "plant food boost", value: "$39" },
      { name: "3 × Nature's Blanket (2 CF)", detail: "6 CF mulch finish", value: "$33" },
    ],
    items: [
      { name: "PlantPal tote", amount: "1 × 2.2 CY supersack", ...productImages.tote },
      { name: "Simon's Gold dairy compost", amount: "4 × 1-cu-ft bags", ...productImages.simons },
      { name: "Mikey's Worm Poop worm castings", amount: "2 × 1-cu-ft bags", ...productImages.mikeys },
      { name: "Nature's Blanket Premium mulch", amount: "3 × 2-cu-ft bags", ...productImages.mulch },
    ],
  },
  {
    slug: "fall-soil-drop",
    hook: "Big project lead offer",
    eyebrow: "Pro · High ticket",
    title: "Fall Soil Drop",
    shortTitle: "Fall Soil Drop",
    description: "Truckload soil for crews, schools, and big projects. Not a DIY cart item. Tell us the job. We price the drop.",
    heroImage: "/images/optimized/mixed-truckload-example.jpg",
    heroAlt: "Truckload of soil products ready for a commercial drop",
    listPrice: 1080,
    salePrice: 0,
    savings: 0,
    badge: "Volume pricing · Call for quote",
    idealFor: "Landscapers, HOAs, schools, multi-bed installs",
    result: "Not a DIY cart item. Tell us the job. We price the drop.",
    valueNote: "Example material value before delivery. Final price by yards and address.",
    quoteOnly: true,
    stack: [
      { name: "Simon's Gold truckload", detail: "bulk dairy compost", value: "from $720" },
      { name: "Optional mulch add-on", detail: "tote or truck finish", value: "quoted" },
      { name: "Scheduled delivery", detail: "Phoenix metro + beyond", value: "in quote" },
      { name: "One project manager call", detail: "product + yards + date", value: "fast" },
    ],
    items: [
      { name: "Simon's Gold truckload", amount: "Bulk delivery by yards", ...productImages.truck },
      { name: "Simon's Gold dairy compost", amount: "Bulk compost", ...productImages.simons },
      { name: "Nature's Blanket (optional)", amount: "Tote or truck finish", ...productImages.mulch },
    ],
  },
];

const fmt = (value: number) => `$${value.toFixed(value % 1 === 0 ? 0 : 2)}`;

export default function BundleOffers() {
  const [, params] = useRoute("/offers/:slug");
  const offer = useMemo(() => offers.find((item) => item.slug === params?.slug), [params?.slug]);

  if (!params?.slug) return <OffersIndex />;
  if (!offer) return <OffersIndex />;
  return <OfferPage offer={offer} />;
}

function OffersIndex() {
  return (
    <main className="bg-[#f7f5ef] py-12 sm:py-16">
      <Helmet>
        <title>Garden Bundles | Organic Soil Wholesale</title>
        <meta
          name="description"
          content="Three Hormozi-style Phoenix pickup offers: Garden Refresh $69, Garden Setup $459, and Fall Soil Drop truckload quotes."
        />
      </Helmet>
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#9a6f39]">Phoenix offer ladder</p>
        <h1 className="mt-3 max-w-3xl font-heading text-4xl font-bold text-[#183a23] sm:text-5xl">
          Three offers. One clear next step.
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-[#657066]">
          Start small, go big, or price a truckload. Every offer shows the stack, the value, and today&apos;s pickup price.
        </p>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {offers.map((offer) => (
            <OfferCard offer={offer} key={offer.slug} />
          ))}
        </div>
      </div>
    </main>
  );
}

function OfferCard({ offer }: { offer: BundleOffer }) {
  return (
    <Link
      href={`/offers/${offer.slug}`}
      className="group overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-[#dfe5dc] transition hover:-translate-y-1 hover:shadow-xl"
    >
      <img src={offer.heroImage} alt={offer.heroAlt} loading="lazy" className="aspect-[16/10] w-full object-cover" />
      <div className="p-6">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9a6f39]">{offer.hook}</p>
        <h2 className="mt-2 font-heading text-2xl font-bold text-[#183a23]">{offer.shortTitle}</h2>
        <p className="mt-2 text-sm leading-6 text-[#657066]">{offer.description}</p>
        <div className="mt-4 flex items-end gap-3">
          {offer.quoteOnly ? (
            <span className="font-heading text-3xl font-bold text-[#183a23]">Quote</span>
          ) : (
            <>
              <span className="font-heading text-3xl font-bold text-[#183a23]">{fmt(offer.salePrice)}</span>
              <span className="pb-1 text-sm text-[#758077] line-through">{fmt(offer.listPrice)}</span>
            </>
          )}
        </div>
        <span className="mt-5 inline-flex items-center gap-2 font-bold text-[#215330]">
          See offer <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}

function OfferPage({ offer }: { offer: BundleOffer }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const priceLabel = offer.quoteOnly ? "custom quote" : fmt(offer.salePrice);

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
          subject: offer.quoteOnly
            ? `Truckload quote request: ${offer.title}`
            : `Bundle reservation request: ${offer.title}`,
          message: offer.quoteOnly
            ? `I need a Fall Soil Drop / truckload quote for my project.`
            : `I would like to reserve the ${offer.title} at the promotional pickup price of ${fmt(offer.salePrice)}.`,
        }),
      });
      if (!res.ok) throw new Error("bundle_request_failed");
      trackEvent("Garden Bundle Requested", { bundle: offer.slug, value: offer.salePrice });
      trackEcommerceEvent("generate_lead", {
        lead_type: "garden_bundle",
        bundle: offer.slug,
        value: offer.salePrice,
        pickup_sales_channel: "osw_yard",
      });
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  };

  return (
    <main className="bg-[#f7f5ef] text-[#183a23]">
      <Helmet>
        <title>{offer.title} | Organic Soil Wholesale</title>
        <meta
          name="description"
          content={`${offer.title}: ${offer.description} Phoenix pickup ${offer.quoteOnly ? "quote" : `for ${fmt(offer.salePrice)}`}.`}
        />
      </Helmet>

      <section className="overflow-hidden bg-[#153b22] text-white">
        <div className="mx-auto grid max-w-7xl gap-0 lg:grid-cols-2">
          <div className="order-2 px-5 py-10 sm:px-8 sm:py-16 lg:order-1 lg:py-20 xl:pl-12">
            <Link href="/offers" className="text-sm font-bold text-[#f1d6a6] underline underline-offset-4">
              All offers
            </Link>
            <p className="mt-7 text-xs font-bold uppercase tracking-[0.18em] text-[#f6e5c4]">{offer.hook}</p>
            <h1 className="mt-4 max-w-xl font-heading text-4xl font-bold leading-tight sm:text-5xl">{offer.title}</h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-white/80">{offer.description}</p>
            <div className="mt-8 flex flex-wrap items-end gap-x-4 gap-y-2">
              {offer.quoteOnly ? (
                <span className="font-heading text-5xl font-bold text-[#f6e5c4]">Quote</span>
              ) : (
                <>
                  <span className="font-heading text-5xl font-bold text-[#f6e5c4]">{fmt(offer.salePrice)}</span>
                  <span className="pb-2 text-xl text-white/55 line-through">{fmt(offer.listPrice)}</span>
                  <span className="mb-2 rounded-full bg-[#e9c66c] px-3 py-1 text-sm font-extrabold text-[#183a23]">
                    Save {fmt(offer.savings)}
                  </span>
                </>
              )}
            </div>
            <p className="mt-3 text-sm font-semibold text-[#f1d6a6]">{offer.badge}</p>
          </div>
          <div className="order-1 min-h-[300px] lg:order-2 lg:min-h-full">
            <img
              src={offer.heroImage}
              alt={offer.heroAlt}
              className="h-full min-h-[300px] w-full object-cover"
              fetchPriority="high"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[1.18fr_0.82fr] lg:gap-14">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#9a6f39]">The stack</p>
          <h2 className="mt-3 font-heading text-3xl font-bold sm:text-4xl">What you get.</h2>
          <div className="mt-7 overflow-hidden rounded-2xl bg-white ring-1 ring-[#e0e5dc]">
            {offer.stack.map((row) => (
              <div
                key={`${row.name}-${row.value}`}
                className="grid gap-1 border-b border-[#e8eee4] px-5 py-4 last:border-b-0 sm:grid-cols-[1.4fr_1fr_auto] sm:items-center"
              >
                <p className="font-heading text-base font-bold">{row.name}</p>
                <p className="text-sm text-[#5c6a5e]">{row.detail}</p>
                <p className="text-sm font-bold text-[#215330] sm:text-right">{row.value}</p>
              </div>
            ))}
          </div>
          {offer.valueNote && <p className="mt-3 text-sm text-[#657066]">{offer.valueNote}</p>}

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {offer.items.map((item) => (
              <article
                className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-[#e0e5dc]"
                key={`${item.name}-${item.amount}`}
              >
                <img src={item.image} alt={item.alt} loading="lazy" className="aspect-[4/3] w-full object-cover" />
                <div className="p-4">
                  <p className="font-heading text-lg font-bold">{item.name}</p>
                  <p className="mt-1 text-sm font-semibold text-[#5c6a5e]">{item.amount}</p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <aside className="h-fit rounded-3xl border border-[#d7e0d3] bg-white p-6 shadow-lg sm:p-8 lg:sticky lg:top-28">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#eaf2e5] text-[#215330]">
              <Sprout className="h-5 w-5" />
            </span>
            <p className="font-heading text-xl font-bold">Built for the job</p>
          </div>
          <p className="mt-4 leading-7 text-[#5f6c62]">
            <strong className="text-[#183a23]">Best for:</strong> {offer.idealFor}
          </p>
          <p className="mt-3 leading-7 text-[#5f6c62]">
            <strong className="text-[#183a23]">The result:</strong> {offer.result}
          </p>
          {offer.finePrint && <p className="mt-3 text-sm leading-6 text-[#758077]">{offer.finePrint}</p>}
          <ul className="mt-6 space-y-3 text-sm font-semibold text-[#3d5141]">
            <li className="flex gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#2c7141]" /> Arizona-made products
            </li>
            <li className="flex gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#2c7141]" />{" "}
              {offer.quoteOnly ? "Delivery quoted by yards + address" : "Phoenix yard pickup"}
            </li>
            <li className="flex gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#2c7141]" /> One clear offer price
            </li>
          </ul>
          <a
            href="#reserve"
            className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#183a23] px-5 py-3 font-bold text-white transition hover:bg-[#0d2917]"
          >
            {offer.quoteOnly ? "Request truckload quote" : "Request this offer"} <ArrowRight className="h-4 w-4" />
          </a>
          <a
            href={CUSTOMER_SUPPORT_PHONE_TEL}
            className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#cbd6c7] px-5 py-3 font-bold text-[#215330]"
          >
            <Phone className="h-4 w-4" /> {CUSTOMER_SUPPORT_PHONE_DISPLAY}
          </a>
        </aside>
      </section>

      <section id="reserve" className="border-y border-[#d9e1d5] bg-[#eaf0e6] py-12 sm:py-16">
        <div className="mx-auto grid max-w-5xl gap-8 px-5 sm:px-8 md:grid-cols-[0.8fr_1.2fr] md:items-center">
          <div>
            <PackageCheck className="h-10 w-10 text-[#215330]" />
            <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-[#9a6f39]">
              {offer.quoteOnly ? "Quote request" : "Pickup request"}
            </p>
            <h2 className="mt-3 font-heading text-3xl font-bold">
              {offer.quoteOnly ? "Request your truckload price." : "Request your offer."}
            </h2>
            <p className="mt-4 leading-7 text-[#59685e]">
              A yard representative will confirm details
              {offer.quoteOnly ? (
                <> and price the drop for your project.</>
              ) : (
                <>
                  . Your requested price is <strong className="text-[#183a23]">{priceLabel}</strong>.
                </>
              )}
            </p>
            <a
              href="https://www.google.com/maps/dir/?api=1&destination=33.467333%2C-112.101250"
              className="mt-5 inline-flex items-center gap-2 font-bold text-[#215330] underline underline-offset-4"
            >
              <MapPinned className="h-5 w-5" /> Open the exact entrance pin
            </a>
          </div>
          {status === "sent" ? (
            <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
              <Check className="mx-auto h-11 w-11 text-[#2c7141]" />
              <h3 className="mt-4 font-heading text-2xl font-bold">Your request is in.</h3>
              <p className="mt-3 leading-7 text-[#5f6c62]">We&apos;ll follow up soon.</p>
            </div>
          ) : (
            <form onSubmit={submit} className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-bold">
                  Full name
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-2 h-12 w-full rounded-xl border border-[#cfd9cc] px-3 font-normal"
                  />
                </label>
                <label className="text-sm font-bold">
                  Phone
                  <input
                    required
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-2 h-12 w-full rounded-xl border border-[#cfd9cc] px-3 font-normal"
                  />
                </label>
              </div>
              <label className="mt-4 block text-sm font-bold">
                Email
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 h-12 w-full rounded-xl border border-[#cfd9cc] px-3 font-normal"
                />
              </label>
              {status === "error" && (
                <p className="mt-3 text-sm font-semibold text-red-700">
                  We could not submit that request. Please call us at {CUSTOMER_SUPPORT_PHONE_DISPLAY}.
                </p>
              )}
              <button
                disabled={status === "sending"}
                className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#183a23] px-5 py-3 font-bold text-white disabled:opacity-60"
              >
                {status === "sending" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Sending request…
                  </>
                ) : (
                  <>
                    {offer.quoteOnly ? "Request quote" : `Request ${offer.shortTitle}`}{" "}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
              <p className="mt-3 text-center text-xs leading-5 text-[#69756c]">
                Availability and final details confirmed by the yard team.
              </p>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
