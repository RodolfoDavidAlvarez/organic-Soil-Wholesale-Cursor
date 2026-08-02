import { FormEvent, useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowRight,
  BadgeCheck,
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
  Sprout,
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
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-5 pb-12 pt-10 sm:px-8 sm:pb-16 sm:pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:py-20">
          <div className="max-w-2xl">
            <div className="-mx-5 -mt-10 mb-6 lg:hidden">
              <HeroProductVisual mobile />
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#f1d6a6] backdrop-blur">
              <Gift className="h-4 w-4" /> August community gift
            </div>
            <h1 className="mt-6 font-heading text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Grow more with a free 9-lb bag of worm castings.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/80 sm:text-lg">
              Phoenix gardeners can claim one bag of Mikey’s Worm Poop, made here in Arizona by Soil Seed &amp; Water.
            </p>

            <div className="mt-7 grid grid-cols-3 gap-2 sm:max-w-xl sm:gap-3">
              <HeroFact icon={<PackageCheck />} title="9-lb bag" detail="One per email" />
              <HeroFact icon={<CalendarDays />} title="Aug 1–31" detail="Pickup dates" />
              <HeroFact icon={<MapPin />} title="Phoenix" detail="Yard pickup" />
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <a
                href="#claim-your-bag"
                onClick={() => trackCampaignAction("CTA Clicked", { cta: "claim_my_free_bag" })}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#f3e8cc] px-6 py-3 text-base font-bold text-[#173820] shadow-lg transition hover:bg-white"
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
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#f1d6a6]/35 bg-[#f1d6a6]/10 px-6 py-3 text-base font-bold text-[#f6e5c4] transition hover:bg-[#f1d6a6]/15 sm:col-span-2"
              >
                <MapPinned className="h-5 w-5" /> Open the Exact Entrance Pin
              </a>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/70">
              <span className="inline-flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-[#c9dfb8]" /> OMRI Listed</span>
              <span className="inline-flex items-center gap-2"><Sparkles className="h-4 w-4 text-[#f1d6a6]" /> No purchase required</span>
            </div>
          </div>

          <div className="relative mx-auto hidden w-full max-w-[620px] lg:block">
            <HeroProductVisual />
          </div>
        </div>
      </section>

      <section id="claim-your-bag" className="relative z-10 mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:px-8 sm:py-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:gap-12">
        <div className="order-2 space-y-6 lg:order-1 lg:sticky lg:top-24">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#9a6f39]">Simple and one-time</p>
          <h2 className="font-heading text-3xl font-bold leading-tight text-[#183a23] sm:text-4xl">Register now. Bring your private QR to the yard.</h2>
          <p className="text-base leading-7 text-[#576259]">We’ll email your unique coupon immediately. Staff will scan it when you arrive, confirm your information, and hand off one 9-lb bag.</p>
          <div className="space-y-3">
            <ProcessStep number="1" title="Complete the form" detail="Use the email you can access on your phone." />
            <ProcessStep number="2" title="Open your private QR" detail="Check your inbox, Spam, or Promotions folder." />
            <ProcessStep number="3" title="Visit the Phoenix yard" detail="Show the QR to a team member before pickup." />
          </div>
          <div className="rounded-2xl border border-[#dce5d8] bg-[#edf3e9] p-5">
            <p className="font-bold text-[#183a23]">Already registered?</p>
            <p className="mt-1 text-sm leading-6 text-[#576259]">Submit the same email again and we’ll resend the same coupon. You will not receive a duplicate award.</p>
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <div className="overflow-hidden rounded-[1.75rem] border border-[#d8e1d4] bg-white shadow-[0_24px_70px_rgba(28,62,36,0.13)]">
            <div className="bg-[#214a2c] px-6 py-5 text-white sm:px-8">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#f1d6a6]">Your private coupon</p>
              <h2 className="mt-2 font-heading text-2xl font-bold sm:text-3xl">Claim your free 9-lb bag</h2>
              <p className="mt-2 text-sm leading-6 text-white/75">Required fields help our yard team verify the correct customer.</p>
            </div>

            <div className="p-6 sm:p-8">
              {success ? (
                <CouponSuccess email={email} status={couponDeliveryStatus} />
              ) : (
                <form onSubmit={submit} onFocus={markFormStarted} className="space-y-5">
                  <div>
                    <label htmlFor="campaign-name" className="mb-2 block text-sm font-bold text-[#243129]">Full name</label>
                    <Input id="campaign-name" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required maxLength={120} className="h-12 rounded-xl" />
                  </div>
                  <div>
                    <label htmlFor="campaign-email" className="mb-2 block text-sm font-bold text-[#243129]">Email address</label>
                    <Input id="campaign-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required maxLength={254} className="h-12 rounded-xl" />
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="campaign-phone" className="mb-2 block text-sm font-bold text-[#243129]">Phone number</label>
                      <Input id="campaign-phone" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="(623) 555-0123" autoComplete="tel" inputMode="tel" required maxLength={30} className="h-12 rounded-xl" />
                    </div>
                    <div>
                      <label htmlFor="campaign-category" className="mb-2 block text-sm font-bold text-[#243129]">I’m a…</label>
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
                    <span>I agree to receive emails from Soil Seed &amp; Water. I can unsubscribe at any time.</span>
                  </label>
                  {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
                  <Button type="submit" disabled={submitting} className="min-h-14 w-full rounded-xl text-base font-bold shadow-lg">
                    {submitting ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Creating your coupon…</> : <>Email My Private QR Coupon <ArrowRight className="ml-2 h-4 w-4" /></>}
                  </Button>
                  <p className="text-center text-xs leading-5 text-[#6c756d]">Valid August 1–31, 2026. One free 9-lb bag per person/email. Phoenix pickup only.</p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#173820] py-12 text-white sm:py-16">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-5 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
          <div className="overflow-hidden rounded-[1.75rem] border border-white/15 bg-white shadow-2xl">
            <img
              src="/images/optimized/mikeys-worm-new-graphics-2-uses.webp"
              alt="Four ways to use Mikey's Worm Poop worm castings: garden beds, pots, trees, and in-ground gardens"
              loading="lazy"
              className="aspect-square w-full object-cover"
            />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f1d6a6]">Simple to use</p>
            <h2 className="mt-3 font-heading text-3xl font-bold leading-tight sm:text-4xl">One bag. Four easy ways to help your garden grow.</h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-white/75">Mix worm castings into garden beds and pots, top-dress around trees, or work them directly into in-ground soil. They add rich organic matter right where roots need it.</p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a href="/products/mikeys-worm-poop" onClick={() => trackCampaignAction("Product Detail Clicked", { cta: "worm_castings_detail" })} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#f3e8cc] px-6 py-3 font-bold text-[#173820] shadow-lg transition hover:bg-white">
                Learn About Worm Castings <ArrowRight className="h-4 w-4" />
              </a>
              <a href="/products" onClick={() => trackCampaignAction("Products Clicked", { cta: "uses_products" })} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/5 px-6 py-3 font-bold text-white transition hover:bg-white/10">
                <ShoppingBag className="h-4 w-4" /> See Our Products
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#dce3d8] bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#9a6f39]">From our Arizona operation</p>
              <h2 className="mt-3 font-heading text-3xl font-bold text-[#183a23] sm:text-4xl">Real products for healthier soil.</h2>
              <p className="mt-3 leading-7 text-[#5b665d]">We make compost, worm castings, potting mix, and mulch for home gardens, farms, nurseries, and landscapes.</p>
            </div>
            <a href="/products" onClick={() => trackCampaignAction("Products Clicked", { cta: "products_section" })} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#214a2c] px-6 py-3 font-bold text-white shadow-md transition hover:bg-[#17381f]">
              <ShoppingBag className="h-4 w-4" /> Shop All Products
            </a>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {products.map((product) => (
              <article key={product.name} className="overflow-hidden rounded-2xl border border-[#e0e5dc] bg-[#fafaf7]">
                <img src={product.image} alt={product.alt} loading="lazy" className="aspect-square w-full object-cover" />
                <div className="p-4 sm:p-5">
                  <h3 className="font-heading text-base font-bold text-[#183a23] sm:text-lg">{product.name}</h3>
                  <p className="mt-1 text-xs text-[#69736b] sm:text-sm">{product.type}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#edf1e8] py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#214a2c] text-white shadow-lg">
              <MapPinned className="h-9 w-9" />
            </div>
            <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-[#9a6f39]">Correct entrance</p>
            <h2 className="mt-3 font-heading text-3xl font-bold text-[#183a23] sm:text-4xl">Enter from the south gate on Grand Avenue.</h2>
            <p className="mt-4 text-base leading-7 text-[#5a655c]">The street address can route you toward the office. Use the exact entrance pin below and look for the gate beside Agave Environmental.</p>
          </div>

          <div className="mt-8 overflow-hidden rounded-[1.75rem] border-2 border-[#bd9460] bg-white shadow-[0_24px_70px_rgba(40,60,38,0.14)]">
            <a href={ENTRANCE_DIRECTIONS_URL} onClick={() => trackCampaignAction("Directions Clicked", { cta: "map_image" })} aria-label="Open exact Organic Soil Wholesale south entrance in Google Maps" className="block bg-[#f7f3ea]">
              <img src="/email-assets/phoenix-yard-entrance-map-v2.svg" alt="Illustrated route from the south gate on Grand Avenue to Organic Soil Wholesale pickup and loading" loading="lazy" className="w-full" />
            </a>
            <div className="grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-7">
              <a href={ENTRANCE_DIRECTIONS_URL} onClick={() => trackCampaignAction("Directions Clicked", { cta: "map_pin_card" })} aria-label="Open the exact Organic Soil Wholesale entrance in Google Maps" className="flex items-start gap-4 rounded-2xl transition hover:bg-[#f7f3ea] focus:outline-none focus:ring-2 focus:ring-[#b5864f]">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#b5864f] text-white shadow-md">
                  <MapPinned className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9a6f39]">Tap this exact pin</p>
                  <p className="mt-1 font-heading text-xl font-bold text-[#183a23]">1634 N 19th Ave, Phoenix, AZ 85009</p>
                  <p className="mt-1 text-sm leading-6 text-[#687169]">South gate on Grand Avenue · Entrance: 33.467333, -112.101250</p>
                </div>
              </a>
              <a href={ENTRANCE_DIRECTIONS_URL} onClick={() => trackCampaignAction("Directions Clicked", { cta: "map_button" })} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#214a2c] px-6 py-3 font-bold text-white shadow-md transition hover:bg-[#17381f]">
                <Navigation className="h-5 w-5" /> Get Directions <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <DirectionStep number="1" text="Enter through the south gate from Grand Avenue." />
            <DirectionStep number="2" text="Drive straight alongside the Soil Seed & Water office." />
            <DirectionStep number="3" text="Turn left across the yard and follow signs to pickup." />
          </div>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 text-center sm:flex-row sm:gap-6">
            <p className="font-semibold text-[#39463c]">Questions before you arrive?</p>
            <a href={CUSTOMER_SUPPORT_PHONE_TEL} onClick={() => trackCampaignAction("Phone Clicked")} data-phone-number={CUSTOMER_SUPPORT_PHONE_DIAL} data-callrail-ignore="true" data-dynamic-number-ignore="true" data-call-tracking-ignore="true" className="no-call-tracking inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#214a2c] bg-white px-5 py-3 font-bold text-[#214a2c]">
              <Phone className="h-4 w-4" /> Call {CUSTOMER_SUPPORT_PHONE_DISPLAY}
            </a>
          </div>
        </div>
      </section>

      <section className="bg-[#173820] px-5 py-12 text-center text-white sm:py-16">
        <Sprout className="mx-auto h-9 w-9 text-[#c9dfb8]" />
        <h2 className="mx-auto mt-4 max-w-2xl font-heading text-3xl font-bold sm:text-4xl">Better gardens start with better soil.</h2>
        <p className="mx-auto mt-4 max-w-xl leading-7 text-white/75">Discover Arizona-made soil products for raised beds, containers, farms, and landscapes.</p>
        <a href="/products" onClick={() => trackCampaignAction("Products Clicked", { cta: "footer_products" })} className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#f3e8cc] px-7 py-3 font-bold text-[#173820] shadow-lg transition hover:bg-white">
          Explore All Products <ArrowRight className="h-4 w-4" />
        </a>
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

function ProcessStep({ number, title, detail }: { number: string; title: string; detail: string }) {
  return (
    <div className="flex gap-4 rounded-2xl border border-[#e0e5dc] bg-white p-4 shadow-sm">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#214a2c] text-sm font-bold text-white">{number}</div>
      <div><p className="font-bold text-[#263329]">{title}</p><p className="mt-1 text-sm leading-6 text-[#687169]">{detail}</p></div>
    </div>
  );
}

function DirectionStep({ number, text }: { number: string; text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-[#d9e1d5] bg-white p-4 shadow-sm">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#214a2c] text-sm font-bold text-white">{number}</div>
      <p className="pt-1 text-sm font-semibold leading-6 text-[#455048]">{text}</p>
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
      <p className="mt-5 text-sm font-bold text-[#39463c]">One free 9-lb bag per person/email · Phoenix pickup only</p>
    </div>
  );
}
