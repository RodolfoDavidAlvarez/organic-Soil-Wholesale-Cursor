import { FormEvent, useState } from "react";
import { CheckCircle2, Loader2, MapPin, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trackEvent } from "@/lib/analytics";

type Props = { source: string };

const customerTypes = [
  ["home-gardener", "Home gardener"],
  ["farmer", "Farmer / grower"],
  ["landscaper", "Landscaper"],
  ["nursery", "Nursery / greenhouse"],
  ["contractor", "Contractor"],
  ["municipal-commercial", "Municipal / commercial"],
  ["other", "Other"],
] as const;

export default function WormCastingsCampaign({ source }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [customerCategory, setCustomerCategory] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, email, phone, customerCategory, consent, website, source,
          campaign: "free-worm-castings-2026-08",
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "We could not create your private coupon.");
      if (body.couponDeliveryStatus === "failed") {
        throw new Error("Your sign-up is saved, but we could not email the coupon yet. Please try again shortly.");
      }
      trackEvent("Worm Castings Campaign Registered", { source });
      setSuccess(true);
    } catch (submitError: any) {
      setError(submitError?.message || "Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f5ee] text-[#263527]">
      <section className="border-b border-[#d7dfd0] bg-[#264027] px-5 py-11 text-white sm:py-16">
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#d7b77d]">August community gift</p>
          <h1 className="mx-auto mt-4 max-w-3xl font-heading text-4xl font-bold leading-tight sm:text-5xl">Free 9-lb bag of worm castings for Phoenix gardeners</h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/85 sm:text-lg">Soil Seed &amp; Water is opening our Phoenix yard to the community. Sign up below and we’ll email your private, one-time QR coupon.</p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-9 px-5 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start lg:py-16">
        <div className="space-y-7">
          <img src="/email-assets/mikeys-worm-poop-context.png" alt="Mikey's Worm Poop 9 lb bag surrounded by fresh vegetables, soil, and earthworms" className="w-full rounded-2xl bg-[#e8eddf] object-contain p-4 shadow-sm" />
          <div className="rounded-2xl border border-[#d8e0d2] bg-white p-6 shadow-sm">
            <div className="flex items-start gap-3"><Sprout className="mt-1 h-6 w-6 shrink-0 text-primary" /><div><h2 className="font-heading text-2xl font-bold text-primary">Made here in Arizona</h2><p className="mt-2 leading-7 text-neutral-700">For years, we have made compost, mulch, potting soil, and worm castings for farmers and landscapers. We are gardeners and growers too, and we want Phoenix to have access to healthier soil.</p></div></div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[["Simon’s Gold", "Dairy compost"], ["Mikey’s Worm Poop", "Worm castings"], ["Soil Craft", "Potting soil"], ["Nature’s Blanket", "Premium mulch"]].map(([title, detail]) => <div key={title} className="rounded-xl bg-[#f3f6ef] px-4 py-3"><p className="font-semibold text-primary">{title}</p><p className="text-sm text-neutral-600">{detail}</p></div>)}
            </div>
          </div>
          <div className="rounded-2xl border border-[#d8e0d2] bg-white p-6 shadow-sm">
            <div className="flex items-start gap-3"><MapPin className="mt-1 h-6 w-6 shrink-0 text-primary" /><div><h2 className="font-heading text-2xl font-bold text-primary">Phoenix yard pickup</h2><p className="mt-2 leading-7 text-neutral-700"><strong>1634 N 19th Ave, Phoenix, AZ 85009</strong><br />Use the south entrance from Grand Avenue and follow the yard lane to check-in and loading.</p><a className="mt-3 inline-block font-semibold text-primary underline" href="https://www.google.com/maps/dir/?api=1&destination=33.467333%2C-112.101250">Open the exact entrance pin</a></div></div>
          </div>
        </div>

        <Card className="border-0 shadow-xl"><CardContent className="p-6 sm:p-8">
          {success ? <div className="py-8 text-center"><CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-primary" /><h2 className="font-heading text-2xl font-bold text-primary">Check your inbox.</h2><p className="mt-3 leading-7 text-neutral-600">Your private QR coupon is on its way. Bring it to the Phoenix yard from August 1 through August 31.</p><p className="mt-4 text-sm font-semibold text-neutral-700">One free 9-lb bag per person/email. Phoenix pickup only.</p></div> :
            <form onSubmit={submit} className="space-y-5">
              <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8a6a42]">Your private coupon</p><h2 className="mt-2 font-heading text-2xl font-bold text-primary">Sign up for your free bag</h2><p className="mt-2 text-sm leading-6 text-neutral-600">We’ll send a unique QR coupon after you register. No purchase required.</p></div>
              <div><label htmlFor="campaign-name" className="mb-2 block text-sm font-semibold text-neutral-800">Full name</label><Input id="campaign-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required maxLength={120} /></div>
              <div><label htmlFor="campaign-email" className="mb-2 block text-sm font-semibold text-neutral-800">Email address</label><Input id="campaign-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required maxLength={254} /></div>
              <div className="grid gap-5 sm:grid-cols-2"><div><label htmlFor="campaign-phone" className="mb-2 block text-sm font-semibold text-neutral-800">Phone number</label><Input id="campaign-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(602) 555-0123" autoComplete="tel" inputMode="tel" required maxLength={30} /></div><div><label htmlFor="campaign-category" className="mb-2 block text-sm font-semibold text-neutral-800">I’m a…</label><select id="campaign-category" value={customerCategory} onChange={(e) => setCustomerCategory(e.target.value)} required className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="">Select one</option>{customerTypes.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></div></div>
              <div className="hidden" aria-hidden="true"><label htmlFor="campaign-website">Website</label><Input id="campaign-website" value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" /></div>
              <label className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-neutral-700"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} required className="mt-1 h-4 w-4 accent-[#264027]" /><span>I agree to receive emails from Soil Seed &amp; Water. I can unsubscribe at any time.</span></label>
              {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
              <Button type="submit" disabled={submitting} className="w-full py-6 text-base font-bold">{submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating your coupon…</> : "Email My Private QR Coupon"}</Button>
              <p className="text-center text-xs leading-5 text-neutral-500">Valid August 1–31, 2026. One free 9-lb bag per person/email. Phoenix pickup only.</p>
            </form>}
        </CardContent></Card>
      </section>
    </main>
  );
}
