import { FormEvent, useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Gift,
  Loader2,
  MapPin,
  MapPinned,
  Navigation,
  PackageCheck,
  Phone,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CUSTOMER_SUPPORT_PHONE_DIAL,
  CUSTOMER_SUPPORT_PHONE_DISPLAY,
  CUSTOMER_SUPPORT_PHONE_TEL,
} from "@/config/contact";
import { usePhoneNumberLock } from "@/hooks/usePhoneNumberLock";
import { trackEvent } from "@/lib/analytics";

type Props = { source: string };

const ENTRANCE_DIRECTIONS_URL =
  "https://www.google.com/maps/dir/?api=1&destination=33.467333%2C-112.101250";
const ENTRANCE_MAP_EMBED_URL =
  "https://www.google.com/maps?q=33.467333,-112.101250&z=17&output=embed";
const PHOENIX_YARD_HOURS = "Tuesday–Saturday, 8:00 AM–4:00 PM";
const PHOENIX_YARD_BREAK = "Closed for break from 1:00–2:00 PM";

const customerTypes = [
  ["home-gardener", "Home gardener"],
  ["farmer", "Farmer / grower"],
  ["landscaper", "Landscaper"],
  ["nursery", "Nursery / greenhouse"],
  ["contractor", "Contractor"],
  ["municipal-commercial", "Municipal / commercial"],
  ["other", "Other"],
] as const;

const products = [
  {
    name: "Mikey’s Worm Poop",
    type: "Worm castings",
    image: "/images/optimized/worm-castting-product-texture.jpg",
    alt: "Rich, finished Mikey's Worm Poop worm castings held in two hands",
  },
  {
    name: "Simon’s Gold",
    type: "Dairy compost",
    image: "/images/optimized/simons-gold-bag-context.webp",
    alt: "Simon's Gold dairy compost bag with fresh garden vegetables",
  },
  {
    name: "Soil Craft",
    type: "All-stage potting mix",
    image: "/images/optimized/soil-craft-lifestyle.jpg",
    alt: "A flowering plant being potted with Soil Craft potting mix",
  },
  {
    name: "Nature’s Blanket",
    type: "Premium mulch",
    image: "/images/optimized/natures-blanket-bag-context.webp",
    alt: "Nature's Blanket premium mulch bag surrounded by clean mulch",
  },
] as const;

function normalizeTrackingSource(value: string) {
  const raw = String(value || "").trim().toLowerCase().replace(/\s+/g, "-").replace(/_+/g, "-");
  const map: Record<string, string> = {
    socia: "social",
    socials: "social",
    instagram: "social",
    reels: "social",
    shorts: "social",
    facebook: "social",
    "facebook-ads": "fb-ads",
    facebookads: "fb-ads",
    fa: "fb-ads",
    "instagram-ads": "ig-ads",
    instagramads: "ig-ads",
    igads: "ig-ads",
    print: "community-print",
    flyer: "community-print",
    newsletter: "july-community-gift",
  };
  return map[raw] || raw || "community-print";
}

function campaignTrackingProperties(source: string) {
  if (typeof window === "undefined") return { source: normalizeTrackingSource(source) };
  const params = new URLSearchParams(window.location.search);
  return {
    source: normalizeTrackingSource(source),
    utm_source: params.get("utm_source"),
    utm_medium: params.get("utm_medium"),
    utm_campaign: params.get("utm_campaign"),
    landing_path: window.location.pathname,
  };
}

export default function WormCastingsCampaign({ source }: Props) {
  usePhoneNumberLock({ selector: "[data-phone-number]" });
  const trackingSource = normalizeTrackingSource(source);
  const formStartedRef = useRef(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [customerCategory, setCustomerCategory] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [couponDeliveryStatus, setCouponDeliveryStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    trackEvent("Worm Castings Campaign Viewed", campaignTrackingProperties(source));
  }, [source]);

  function trackCampaignAction(action: string, extra?: Record<string, string | boolean | number | null>) {
    trackEvent(`Worm Castings Campaign ${action}`, {
      ...campaignTrackingProperties(source),
      ...(extra || {}),
    });
  }

  function markFormStarted() {
    if (formStartedRef.current) return;
    formStartedRef.current = true;
    trackCampaignAction("Form Started");
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    trackCampaignAction("Form Submitted");
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          customerCategory,
          consent,
          website,
          source: trackingSource,
          campaign: "free-worm-castings-2026-08",
        }),
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error || "We could not create your private coupon.");
      }
      if (body.couponDeliveryStatus === "failed") {
        throw new Error(
          "Your sign-up is saved, but we could not email the coupon yet. Please try again shortly.",
        );
      }
      trackCampaignAction("Registered", { coupon_delivery_status: body.couponDeliveryStatus || "sent" });
      setCouponDeliveryStatus(body.couponDeliveryStatus || "sent");
      setSuccess(true);
    } catch (submitError: any) {
      trackCampaignAction("Form Error");
      setError(submitError?.message || "Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[#f7f6f0] text-[#1d2c20]">
      <section className="relative isolate overflow-hidden bg-[#15351f] text-white">
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_75%_20%,rgba(107,151,93,0.34),transparent_42%)]" />
        <div className="absolute -left-24 top-20 -z-10 h-72 w-72 rounded-full bg-[#c59a5d]/10 blur-3xl" />
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-5 pb-10 pt-8 sm:px-8 sm:pb-14 sm:pt-12 lg:grid-cols-[1.02fr_0.98fr] lg:gap-14 lg:py-16">
          <div className="max-w-2xl">
            <div className="-mx-5 -mt-8 mb-6 lg:hidden">
              <HeroProductVisual mobile />
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#f1d6a6] backdrop-blur">
              <Gift className="h-4 w-4" /> August community gift
            </div>
            <h1 className="mt-6 font-heading text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Free 9-lb bag of worm castings for Phoenix gardeners.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/80 sm:text-lg">
              Soil Seed &amp; Water is opening the Phoenix yard to the community. Register once, get your private QR coupon by email, then pick up one bag of Mikey’s Worm Poop in August.
            </p>

            <div className="mt-7 grid grid-cols-3 gap-2 sm:max-w-xl sm:gap-3">
              <HeroFact icon={<PackageCheck />} title="9-lb bag" detail="One per email" />
              <HeroFact icon={<CalendarDays />} title="Aug 1–31" detail="Pickup dates" />
              <HeroFact icon={<MapPin />} title="Phoenix" detail="Yard pickup" />
            </div>

            <div className="mt-4 rounded-2xl border border-[#f1d6a6]/25 bg-white/10 p-4 text-sm leading-6 text-white/80">
              <strong className="text-white">Pickup hours:</strong> {PHOENIX_YARD_HOURS}
              <br />
              {PHOENIX_YARD_BREAK}
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <a
                href="#claim-your-bag"
                onClick={() => trackCampaignAction("CTA Clicked", { cta: "claim_my_free_bag" })}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#f3e8cc] px-6 py-3 text-base font-bold text-[#173820] shadow-lg transition hover:bg-white sm:col-span-2"
              >
                Claim My Free Bag <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="/products"
                onClick={() => trackCampaignAction("Products Clicked", { cta: "hero_products" })}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/5 px-6 py-3 text-base font-bold text-white transition hover:bg-white/10"
              >
                <ShoppingBag className="h-4 w-4" /> See Our Products
              </a>
              <a
                href={ENTRANCE_DIRECTIONS_URL}
                onClick={() => trackCampaignAction("Directions Clicked", { cta: "hero_directions" })}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#f1d6a6]/35 bg-[#f1d6a6]/10 px-6 py-3 text-base font-bold text-[#f6e5c4] transition hover:bg-[#f1d6a6]/15 sm:col-span-3"
              >
                <MapPinned className="h-5 w-5" /> Open the Exact Entrance Pin
              </a>
            </div>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/70">
              <span className="inline-flex items-center gap-2"><Sparkles className="h-4 w-4 text-[#f1d6a6]" /> No purchase required</span>
              <span>One per person/email</span>
              <span>Phoenix pickup only</span>
            </div>
          </div>

          <div className="relative mx-auto hidden w-full max-w-[620px] lg:block">
            <HeroProductVisual />
          </div>
        </div>
      </section>

      <section id="claim-your-bag" className="relative z-10 mx-auto grid max-w-7xl gap-6 px-5 py-8 sm:px-8 sm:py-12 lg:grid-cols-[1fr_0.92fr] lg:items-start lg:gap-8">
        <div>
          <div className="overflow-hidden rounded-[1.75rem] border border-[#d8e1d4] bg-white shadow-[0_20px_60px_rgba(28,62,36,0.12)]">
            <div className="border-b border-[#e5eadf] bg-white px-6 py-5 sm:px-8">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9a6f39]">Private QR coupon</p>
              <h2 className="mt-2 font-heading text-2xl font-bold text-[#183a23] sm:text-3xl">Claim your free bag</h2>
              <p className="mt-2 text-sm leading-6 text-[#647064]">We’ll email the QR coupon and directions immediately.</p>
            </div>

            <div className="p-5 sm:p-7">
              {success ? (
                <CouponSuccess email={email} status={couponDeliveryStatus} />
              ) : (
                <form onSubmit={submit} onFocus={markFormStarted} className="space-y-4">
                  <div>
                    <label htmlFor="campaign-name" className="mb-1.5 block text-sm font-bold text-[#243129]">Full name</label>
                    <Input id="campaign-name" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required maxLength={120} className="h-12 rounded-xl" />
                  </div>
                  <div>
                    <label htmlFor="campaign-email" className="mb-1.5 block text-sm font-bold text-[#243129]">Email address</label>
                    <Input id="campaign-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required maxLength={254} className="h-12 rounded-xl" />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="campaign-phone" className="mb-1.5 block text-sm font-bold text-[#243129]">Phone number</label>
                      <Input id="campaign-phone" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="(623) 555-0123" autoComplete="tel" inputMode="tel" required maxLength={30} className="h-12 rounded-xl" />
                    </div>
                    <div>
                      <label htmlFor="campaign-category" className="mb-1.5 block text-sm font-bold text-[#243129]">I’m a…</label>
                      <select id="campaign-category" value={customerCategory} onChange={(event) => setCustomerCategory(event.target.value)} required className="h-12 w-full rounded-xl border border-input bg-background px-3 text-sm">
                        <option value="">Select one</option>
                        {customerTypes.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="hidden" aria-hidden="true">
                    <label htmlFor="campaign-website">Website</label>
                    <Input id="campaign-website" value={website} onChange={(event) => setWebsite(event.target.value)} tabIndex={-1} autoComplete="off" />
                  </div>
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-[#f6f7f3] p-4 text-sm leading-6 text-[#4f5b52]">
                    <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} required className="mt-1 h-5 w-5 shrink-0 accent-[#214a2c]" />
                    <span>Email me my QR coupon and community growing updates. I can unsubscribe any time.</span>
                  </label>
                  {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
                  <Button type="submit" disabled={submitting} className="min-h-14 w-full rounded-xl text-base font-bold shadow-lg">
                    {submitting ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Creating your coupon…</> : <>Email My Private QR Coupon <ArrowRight className="ml-2 h-4 w-4" /></>}
                  </Button>
                  <p className="text-center text-xs leading-5 text-[#6c756d]">Valid August 1–31, 2026. One free 9-lb bag per person/email. Phoenix pickup only.</p>
                  <p className="text-center text-xs font-semibold leading-5 text-[#39463c]">{PHOENIX_YARD_HOURS}. {PHOENIX_YARD_BREAK}.</p>
                </form>
              )}
            </div>
          </div>
        </div>

        <aside className="space-y-5">
          <div className="overflow-hidden rounded-[1.75rem] border border-[#d8e1d4] bg-white shadow-[0_20px_60px_rgba(28,62,36,0.10)]">
            <div className="h-[270px] bg-[#e8ece4] sm:h-[320px]">
              <iframe
                title="Exact Organic Soil Wholesale Phoenix entrance pin"
                src={ENTRANCE_MAP_EMBED_URL}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-full w-full border-0"
              />
            </div>
            <div className="p-5 sm:p-6">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9a6f39]">Exact entrance pin</p>
              <h3 className="mt-2 font-heading text-2xl font-bold text-[#183a23]">Phoenix yard pickup</h3>
              <p className="mt-2 text-sm leading-6 text-[#5b665d]">
                1634 N 19th Ave, Phoenix, AZ 85009<br />
                Use the south gate from Grand Avenue.
              </p>
              <p className="mt-3 rounded-xl bg-[#f3f6ef] p-3 text-sm font-semibold leading-6 text-[#344239]">
                {PHOENIX_YARD_HOURS}<br />
                {PHOENIX_YARD_BREAK}
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <a href={ENTRANCE_DIRECTIONS_URL} onClick={() => trackCampaignAction("Directions Clicked", { cta: "google_map_card" })} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#214a2c] px-5 py-3 font-bold text-white shadow-md transition hover:bg-[#17381f]">
                  <Navigation className="h-5 w-5" /> Get Directions
                </a>
                <a href="/yard-map" onClick={() => trackCampaignAction("Directions Clicked", { cta: "yard_map_card" })} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#214a2c] bg-white px-5 py-3 font-bold text-[#214a2c] transition hover:bg-[#f7f3ea]">
                  <MapPinned className="h-5 w-5" /> Open Yard Map
                </a>
              </div>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#d8e1d4] bg-white p-5 shadow-sm sm:p-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9a6f39]">Arizona-made soil products</p>
            <p className="mt-2 text-sm leading-6 text-[#5b665d]">Explore Simon’s Gold, Mikey’s Worm Poop, Soil Craft, and Nature’s Blanket.</p>
            <div className="mt-4 grid grid-cols-4 gap-2">
              {products.map((product) => (
                <a key={product.name} href="/products" onClick={() => trackCampaignAction("Products Clicked", { cta: `product_thumb_${product.name}` })} className="group overflow-hidden rounded-xl border border-[#e0e5dc] bg-[#fafaf7]">
                  <img src={product.image} alt={product.alt} loading="lazy" className="aspect-square w-full object-cover transition group-hover:scale-105" />
                </a>
              ))}
            </div>
            <a href="/products" onClick={() => trackCampaignAction("Products Clicked", { cta: "product_card" })} className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#f3e8cc] px-5 py-3 font-bold text-[#173820] shadow-sm transition hover:bg-[#fff4d8]">
              <ShoppingBag className="h-4 w-4" /> See All Products
            </a>
          </div>

          <div className="rounded-[1.5rem] border border-[#d8e1d4] bg-white p-5 text-center shadow-sm">
            <p className="font-semibold text-[#39463c]">Questions before you arrive?</p>
            <a href={CUSTOMER_SUPPORT_PHONE_TEL} onClick={() => trackCampaignAction("Phone Clicked")} data-phone-number={CUSTOMER_SUPPORT_PHONE_DIAL} data-callrail-ignore="true" data-dynamic-number-ignore="true" data-call-tracking-ignore="true" className="no-call-tracking mt-3 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#214a2c] bg-white px-5 py-3 font-bold text-[#214a2c]">
              <Phone className="h-4 w-4" /> Call {CUSTOMER_SUPPORT_PHONE_DISPLAY}
            </a>
          </div>
        </aside>
      </section>

      <section className="border-t border-[#dce3d8] bg-white py-10 sm:py-12">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#9a6f39]">What you are claiming</p>
              <h2 className="mt-3 font-heading text-3xl font-bold text-[#183a23]">Mikey’s Worm Poop</h2>
              <p className="mt-3 max-w-xl leading-7 text-[#5b665d]">A rich worm casting made in Arizona for garden beds, pots, trees, and in-ground growing.</p>
              <a href="/products/mikeys-worm-poop" onClick={() => trackCampaignAction("Product Detail Clicked", { cta: "worm_castings_detail" })} className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#214a2c] px-6 py-3 font-bold text-white shadow-md transition hover:bg-[#17381f]">
                Learn About Worm Castings <ArrowRight className="h-4 w-4" />
              </a>
            </div>
            <div className="overflow-hidden rounded-[1.5rem] border border-[#e0e5dc] bg-[#fafaf7]">
              <img
                src="/images/optimized/mikeys-worm-new-graphics-2-uses.webp"
                alt="Four ways to use Mikey's Worm Poop worm castings: garden beds, pots, trees, and in-ground gardens"
                loading="lazy"
                className="aspect-[16/10] w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function HeroProductVisual({ mobile = false }: { mobile?: boolean }) {
  return (
    <div className={mobile ? "relative overflow-hidden rounded-b-[1.75rem] border-b border-white/15 bg-white shadow-2xl" : "relative"}>
      {!mobile && <div className="absolute inset-x-10 bottom-0 h-16 rounded-full bg-black/30 blur-2xl" />}
      <div className={mobile ? "relative" : "relative overflow-hidden rounded-[2rem] border border-white/15 bg-white shadow-2xl"}>
        <img
          src="/images/optimized/mikeys-worm-poop-bag-context.webp"
          alt="Mikey's Worm Poop 9-lb bag with vegetables, soil, and earthworms"
          className={mobile ? "aspect-[16/11] w-full bg-white object-contain p-2" : "aspect-[1.05/1] w-full object-cover"}
        />
        <div className="absolute bottom-3 left-3 rounded-xl bg-[#15351f] px-4 py-2.5 shadow-lg sm:bottom-4 sm:left-4 sm:py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#f1d6a6] sm:text-xs">Made in Arizona</p>
          <p className="mt-0.5 font-heading text-base font-bold sm:mt-1 sm:text-lg">Mikey’s Worm Poop</p>
        </div>
      </div>
    </div>
  );
}

function HeroFact({ icon, title, detail }: { icon: ReactNode; title: string; detail: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.07] px-2 py-3 text-center backdrop-blur sm:px-4 sm:text-left">
      <div className="mx-auto mb-2 flex h-7 w-7 items-center justify-center text-[#f1d6a6] sm:mx-0 [&_svg]:h-5 [&_svg]:w-5">{icon}</div>
      <p className="text-sm font-bold sm:text-base">{title}</p>
      <p className="mt-0.5 text-[10px] text-white/60 sm:text-xs">{detail}</p>
    </div>
  );
}

function CouponSuccess({ email, status }: { email: string; status: string }) {
  const isResent = status === "resent";
  const isRecent = status === "recently_sent";
  const isProcessing = status === "already_processing" || status === "sending";
  const isRedeemed = status === "redeemed";
  const heading = isResent
    ? "We resent your coupon."
    : isRecent
      ? "Your coupon was already emailed."
      : isProcessing
        ? "Your coupon email is being prepared."
        : isRedeemed
          ? "This coupon was already redeemed."
          : "Your coupon is on its way.";

  return (
    <div className="py-5 text-center sm:py-8">
      <CheckCircle2 className="mx-auto h-16 w-16 text-[#2f6d45]" />
      <h2 className="mt-5 font-heading text-2xl font-bold text-[#183a23] sm:text-3xl">{heading}</h2>
      <p className="mx-auto mt-4 max-w-md leading-7 text-[#5f6961]">
        {isResent ? <>We emailed the same private QR coupon to <strong>{email}</strong>. No duplicate coupon was created.</>
          : isRecent ? <>We recently emailed your private QR coupon to <strong>{email}</strong>. Please check your inbox, Spam, and Promotions folders.</>
            : isProcessing ? <>We are preparing the private QR coupon for <strong>{email}</strong>. Please allow a few minutes, then check your inbox, Spam, and Promotions folders.</>
              : isRedeemed ? "Our records show that the private coupon for this email has already been used."
                : <>We emailed your private QR coupon to <strong>{email}</strong>. Please check your inbox, Spam, and Promotions folders.</>}
      </p>
      {!isRedeemed && <div className="mx-auto mt-6 max-w-md rounded-2xl bg-[#edf3e9] p-5 text-left"><p className="font-bold text-[#183a23]">What to do next</p><p className="mt-1 text-sm leading-6 text-[#5f6961]">Open the email on your phone, then show the private QR to our yard team between August 1 and August 31.</p></div>}
      {!isRedeemed && <div className="mx-auto mt-3 max-w-md rounded-2xl border border-[#d9e1d5] bg-white p-5 text-left"><p className="font-bold text-[#183a23]">Pickup hours</p><p className="mt-1 text-sm leading-6 text-[#5f6961]">{PHOENIX_YARD_HOURS}. {PHOENIX_YARD_BREAK}. Your email also includes the exact entrance pin and yard map.</p></div>}
      <p className="mt-5 text-sm font-bold text-[#39463c]">One free 9-lb bag per person/email · Phoenix pickup only</p>
    </div>
  );
}
