import { FormEvent, useState, type ReactNode } from "react";
import { BadgePercent, BookOpen, CalendarDays, CheckCircle2, Clock3, Gift, Loader2, MapPin, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CUSTOMER_SUPPORT_PHONE_DIAL, CUSTOMER_SUPPORT_PHONE_DISPLAY, CUSTOMER_SUPPORT_PHONE_TEL } from "@/config/contact";
import { usePhoneNumberLock } from "@/hooks/usePhoneNumberLock";
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

const GOOGLE_CALENDAR_URL = "https://calendar.google.com/calendar/render?action=TEMPLATE&text=The%20Garden%20Reset%20-%20Free%20Garden%20Class&dates=20260822T170000Z%2F20260822T183000Z&details=The%20first%20garden%20class%20of%20the%20season.%20Learn%20how%20to%20reset%20your%20soil%20and%20set%20up%20your%20Arizona%20fall%20garden.%20Register%3A%20https%3A%2F%2Fwww.organicsoilwholesale.com%2Ffall-garden-workshop&location=Organic%20Soil%20Wholesale%2C%201634%20N%2019th%20Ave%2C%20Phoenix%2C%20AZ%2085009";

export default function FallGardenWorkshop({ source }: Props) {
  usePhoneNumberLock({ selector: "[data-phone-number]" });
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
        body: JSON.stringify({ name, email, phone, customerCategory, consent, website, source }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "We could not save your RSVP.");
      trackEvent("Fall Garden Workshop RSVP", { source });
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
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#d7b77d]">The first garden class of the season</p>
          <h1 className="mx-auto mt-4 max-w-3xl font-heading text-4xl font-bold leading-tight sm:text-5xl">The Garden Reset</h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/85 sm:text-lg">Register for a free, practical class on how to reset your soil and set up a healthy Arizona fall garden.</p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-9 px-5 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start lg:py-16">
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Info icon={<CalendarDays />} title="Saturday" detail="August 22, 2026" />
            <Info icon={<Clock3 />} title="Time" detail="10:00–11:30 AM" />
            <Info icon={<MapPin />} title="Location" detail="Organic Soil Wholesale" />
          </div>

          <div className="rounded-2xl border border-[#d8e0d2] bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-start gap-3"><Sprout className="mt-1 h-6 w-6 shrink-0 text-primary" /><div><h2 className="font-heading text-2xl font-bold text-primary">What you’ll learn</h2><p className="mt-2 leading-7 text-neutral-700">Simple, Arizona-specific steps for a productive fall garden.</p></div></div>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                "Why fall is Arizona’s prime gardening season",
                "How to rebuild your soil after the summer heat",
                "How compost, worm castings, and mulch work together",
                "What vegetables and herbs to plant first",
                "Watering strategies for young fall gardens",
                "How to prepare your garden for winter success",
              ].map((item) => <li key={item} className="flex gap-3 text-sm leading-6 text-neutral-700"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />{item}</li>)}
            </ul>
          </div>

          <div className="rounded-2xl border border-[#d8e0d2] bg-[#edf3e9] p-6 shadow-sm">
            <div className="flex items-start gap-3"><BookOpen className="mt-1 h-6 w-6 shrink-0 text-primary" /><div><h2 className="font-heading text-xl font-bold text-primary">Included with your RSVP</h2><p className="mt-2 leading-7 text-neutral-700">Take home a Fall Garden Planning Guide to help you put the workshop into action.</p></div></div>
          </div>

          <div className="rounded-2xl border-2 border-[#d7b77d] bg-[#fffaf0] p-6 shadow-sm sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8a6a42]">Register + attend</p>
            <h2 className="mt-2 font-heading text-2xl font-bold text-primary">Workshop registration benefits</h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <Gift className="mt-1 h-6 w-6 shrink-0 text-primary" />
                <div><h3 className="font-bold text-primary">Claim your included 9 lb bag of worm castings</h3><p className="mt-1 text-sm leading-6 text-neutral-700">Already signed up and have not received your bag? Bring your redemption email and attend the class to claim it. If you have not signed up, <a href="/free-worm-castings?source=garden-reset-workshop" className="font-bold text-primary underline">claim your free 9 lb bag here</a>.</p></div>
              </div>
              <div className="flex items-start gap-3">
                <BadgePercent className="mt-1 h-6 w-6 shrink-0 text-primary" />
                <div><h3 className="font-bold text-primary">50% off PlantPal Potting Soil</h3><p className="mt-1 text-sm leading-6 text-neutral-700">Workshop attendees receive 50% off, with a maximum purchase of one pallet.</p></div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#d8e0d2] bg-white p-6 shadow-sm">
            <div className="flex items-start gap-3"><MapPin className="mt-1 h-6 w-6 shrink-0 text-primary" /><div><h2 className="font-heading text-2xl font-bold text-primary">Find the Phoenix yard</h2><p className="mt-2 leading-7 text-neutral-700"><strong>1634 N 19th Ave, Phoenix, AZ 85009</strong><br />Use the south entrance from Grand Avenue and follow the yard lane to check-in.</p><div className="mt-3 flex flex-wrap gap-x-5 gap-y-2"><a className="font-semibold text-primary underline" href="https://www.google.com/maps/dir/?api=1&destination=33.467333%2C-112.101250">Open directions</a><a href={CUSTOMER_SUPPORT_PHONE_TEL} data-phone-number={CUSTOMER_SUPPORT_PHONE_DIAL} data-callrail-ignore="true" data-dynamic-number-ignore="true" data-call-tracking-ignore="true" className="no-call-tracking font-semibold text-primary underline">Call {CUSTOMER_SUPPORT_PHONE_DISPLAY}</a></div></div></div>
          </div>
        </div>

        <Card className="border-0 shadow-xl"><CardContent className="p-6 sm:p-8">
          {success ? <div className="py-8 text-center"><CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-primary" /><h2 className="font-heading text-2xl font-bold text-primary">Your Garden Reset spot is saved.</h2><p className="mt-3 leading-7 text-neutral-600">We have your RSVP for Saturday, August 22. We’ll contact you if there are any class updates.</p><p className="mt-4 text-sm font-semibold text-neutral-700">Attend to claim your included 9 lb bag of worm castings if you have not received it, plus 50% off PlantPal Potting Soil, limited to one pallet.</p><a href={GOOGLE_CALENDAR_URL} target="_blank" rel="noreferrer" className="mt-5 inline-block rounded-md border-2 border-primary px-4 py-2 text-sm font-bold text-primary">Save to Google Calendar</a></div> :
            <form onSubmit={submit} className="space-y-5">
              <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8a6a42]">Space is limited</p><h2 className="mt-2 font-heading text-2xl font-bold text-primary">Reserve your Garden Reset spot</h2><p className="mt-2 text-sm leading-6 text-neutral-600">Save your place for the first free garden class of the season.</p></div>
              <div><label htmlFor="workshop-name" className="mb-2 block text-sm font-semibold text-neutral-800">Full name</label><Input id="workshop-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required maxLength={120} /></div>
              <div><label htmlFor="workshop-email" className="mb-2 block text-sm font-semibold text-neutral-800">Email address</label><Input id="workshop-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required maxLength={254} /></div>
              <div className="grid gap-5 sm:grid-cols-2"><div><label htmlFor="workshop-phone" className="mb-2 block text-sm font-semibold text-neutral-800">Phone number</label><Input id="workshop-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(623) 263-3386" autoComplete="tel" inputMode="tel" required maxLength={30} /></div><div><label htmlFor="workshop-category" className="mb-2 block text-sm font-semibold text-neutral-800">I’m a…</label><select id="workshop-category" value={customerCategory} onChange={(e) => setCustomerCategory(e.target.value)} required className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="">Select one</option>{customerTypes.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></div></div>
              <div className="hidden" aria-hidden="true"><label htmlFor="workshop-website">Website</label><Input id="workshop-website" value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" /></div>
              <label className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-neutral-700"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} required className="mt-1 h-4 w-4 accent-[#264027]" /><span>I agree to receive emails from Soil Seed &amp; Water. I can unsubscribe at any time.</span></label>
              {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
              <Button type="submit" disabled={submitting} className="w-full py-6 text-base font-bold">{submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving your spot…</> : "Reserve My Garden Class Spot"}</Button>
              <a href={GOOGLE_CALENDAR_URL} target="_blank" rel="noreferrer" className="block text-center text-sm font-bold text-primary underline">Save to Google Calendar</a>
              <p className="text-center text-xs leading-5 text-neutral-500">Free workshop. One RSVP per email. The included 9 lb worm castings benefit is for registered attendees who have not already received it. The 50% PlantPal Potting Soil discount is limited to one pallet.</p>
            </form>}
        </CardContent></Card>
      </section>
    </main>
  );
}

function Info({ icon, title, detail }: { icon: ReactNode; title: string; detail: string }) {
  return <div className="rounded-2xl border border-[#d8e0d2] bg-white p-5 shadow-sm"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#edf3e9] text-primary">{icon}</div><p className="mt-4 text-sm font-bold text-primary">{title}</p><p className="mt-1 text-sm text-neutral-700">{detail}</p></div>;
}
