import { FormEvent, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Loader2,
  MapPin,
  Sprout,
} from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CUSTOMER_SUPPORT_PHONE_DIAL,
  CUSTOMER_SUPPORT_PHONE_DISPLAY,
  CUSTOMER_SUPPORT_PHONE_TEL,
} from "@/config/contact";
import { trackEvent } from "@/lib/analytics";

type Props = { source: string };

const DIRECTIONS_URL = "https://www.google.com/maps/dir/?api=1&destination=33.467333%2C-112.101250";
const CALENDAR_URL = "https://calendar.google.com/calendar/render?action=TEMPLATE&text=Grow%20your%20best%20fall%20garden%20in%20Arizona&dates=20260822T170000Z%2F20260822T183000Z&details=Free%20community%20garden%20workshop%20at%20Organic%20Soil%20Wholesale.&location=1634%20N%2019th%20Ave%2C%20Phoenix%2C%20AZ%2085009";

const customerTypes = [
  ["home-gardener", "Home gardener"],
  ["farmer", "Farmer / grower"],
  ["landscaper", "Landscaper"],
  ["nursery", "Nursery / greenhouse"],
  ["contractor", "Contractor"],
  ["municipal-commercial", "Municipal / commercial"],
  ["other", "Other"],
] as const;

const learningPoints = [
  "What to plant first for Arizona fall",
  "How to rebuild soil after summer heat",
  "How compost, castings, mulch, and water work together",
];

export default function FallGardenWorkshop({ source }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [customerCategory, setCustomerCategory] = useState("");
  const [eventUpdatesConsent, setEventUpdatesConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [website, setWebsite] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/workshops/fall-garden/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: name,
          email,
          phone,
          customerType: customerCategory,
          eventUpdatesConsent,
          marketingConsent,
          website,
          source,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "We could not save your RSVP.");
      trackEvent("Fall Garden Workshop RSVP", {
        source,
        marketing_opt_in: marketingConsent,
        already_registered: Boolean(body.alreadyRegistered),
      });
      setAlreadyRegistered(Boolean(body.alreadyRegistered));
      setSuccess(true);
    } catch (submitError: any) {
      setError(submitError?.message || "Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#f5f2e8] text-[#223226]">
      <Helmet>
        <title>Free Fall Garden Workshop in Phoenix | Organic Soil Wholesale</title>
        <meta
          name="description"
          content="Join a free Arizona fall-garden workshop in Phoenix on Saturday, August 22, 2026, from 10:00–11:30 AM."
        />
        <link rel="canonical" href="https://www.organicsoilwholesale.com/fall-garden-workshop" />
      </Helmet>

      <header className="border-b border-[#264027]/10 px-5 py-4 sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <a href="/" aria-label="Soil Seed and Water home" className="inline-flex items-center">
            <img
              src="/images/soil-seed-and-water-logo.png"
              alt="Soil Seed & Water"
              width="172"
              height="46"
              className="h-9 w-auto object-contain"
            />
          </a>
          <span className="rounded-full border border-[#264027]/15 bg-white/65 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#264027]">
            Free Phoenix workshop
          </span>
        </div>
      </header>

      <section className="relative px-5 pb-12 pt-9 sm:px-8 sm:pb-16 sm:pt-14">
        <div aria-hidden="true" className="absolute -right-28 top-8 h-64 w-64 rounded-full bg-[#d7b77d]/20 blur-3xl" />
        <div aria-hidden="true" className="absolute -left-24 bottom-0 h-60 w-60 rounded-full bg-[#9fb89a]/20 blur-3xl" />

        <div className="relative mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-start lg:gap-16">
          <div className="pt-1 lg:sticky lg:top-10 lg:pt-7">
            <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-[#9a7448]">Fall starts here</p>
            <h1 className="mt-4 max-w-2xl font-heading text-[2.8rem] font-bold leading-[0.98] tracking-[-0.035em] text-[#264027] sm:text-6xl">
              Grow your best fall garden.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-[#526055]">
              A free, practical class for Arizona growers. Learn what to plant, how to reset heat-stressed soil, and how to water with confidence.
            </p>

            <div className="mt-7 overflow-hidden rounded-2xl border border-[#264027]/10 bg-[#264027] text-white shadow-[0_20px_60px_rgba(38,64,39,0.18)]">
              <div className="grid grid-cols-[5.4rem_1fr] sm:grid-cols-[6.6rem_1fr]">
                <div className="flex flex-col items-center justify-center bg-[#d7b77d] px-3 py-5 text-[#263527]">
                  <span className="text-xs font-extrabold uppercase tracking-[0.15em]">August</span>
                  <span className="mt-1 font-heading text-4xl font-black leading-none">22</span>
                  <span className="mt-1 text-xs font-bold">Saturday</span>
                </div>
                <div className="px-5 py-5 sm:px-6">
                  <p className="flex items-center gap-2 text-base font-bold"><Clock3 className="h-4 w-4 text-[#d7b77d]" />10:00–11:30 AM</p>
                  <p className="mt-2 flex items-start gap-2 text-sm leading-6 text-white/75"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#d7b77d]" />1634 N 19th Ave, Phoenix</p>
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {learningPoints.map((point) => (
                <div key={point} className="flex gap-3 border-t border-[#264027]/15 pt-4 text-sm font-semibold leading-5 text-[#3e5042]">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#7f9b78]" />
                  <span>{point}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm font-bold text-[#264027]">
              <a href={DIRECTIONS_URL} className="inline-flex min-h-11 items-center gap-2 underline decoration-[#d7b77d] decoration-2 underline-offset-4">
                Open directions <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href={CUSTOMER_SUPPORT_PHONE_TEL}
                data-official-support-phone
                data-phone-number={CUSTOMER_SUPPORT_PHONE_DIAL}
                data-callrail-ignore="true"
                className="inline-flex min-h-11 items-center underline decoration-[#d7b77d] decoration-2 underline-offset-4"
              >
                Call <span data-official-support-phone-text className="ml-1">{CUSTOMER_SUPPORT_PHONE_DISPLAY}</span>
              </a>
            </div>
          </div>

          <div id="rsvp" className="scroll-mt-5 rounded-[1.75rem] border border-[#264027]/10 bg-white p-5 shadow-[0_24px_80px_rgba(38,64,39,0.12)] sm:p-8">
            {success ? (
              <div className="flex min-h-[34rem] flex-col items-center justify-center py-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#e8f1e5] text-[#264027]">
                  <CheckCircle2 className="h-9 w-9" />
                </div>
                <p className="mt-6 text-xs font-extrabold uppercase tracking-[0.18em] text-[#9a7448]">You’re on the list</p>
                <h2 className="mt-2 font-heading text-3xl font-bold text-[#264027]">
                  {alreadyRegistered ? "Your RSVP is saved." : "Your spot is saved."}
                </h2>
                <p className="mt-4 max-w-sm leading-7 text-[#637067]">
                  We’ll see you Saturday, August 22. Please arrive a few minutes early and use the south entrance from Grand Avenue.
                </p>
                <div className="mt-7 grid w-full max-w-sm gap-3 sm:grid-cols-2">
                  <a href={CALENDAR_URL} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#264027] px-4 py-3 text-sm font-bold text-white">
                    <CalendarDays className="h-4 w-4" /> Add to calendar
                  </a>
                  <a href={DIRECTIONS_URL} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#264027]/20 px-4 py-3 text-sm font-bold text-[#264027]">
                    <MapPin className="h-4 w-4" /> Directions
                  </a>
                </div>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-5">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#9a7448]">Free RSVP</p>
                  <h2 className="mt-2 font-heading text-3xl font-bold text-[#264027]">Save your seat</h2>
                  <p className="mt-2 text-sm leading-6 text-[#637067]">One quick form. We’ll only use these details for your RSVP and the choices you make below.</p>
                </div>

                <Field label="Full name" htmlFor="workshop-name">
                  <Input id="workshop-name" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required maxLength={120} className="h-12 rounded-xl" />
                </Field>
                <Field label="Email address" htmlFor="workshop-email">
                  <Input id="workshop-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required maxLength={254} className="h-12 rounded-xl" />
                </Field>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Phone number" htmlFor="workshop-phone">
                    <Input id="workshop-phone" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="(623) 263-3386" autoComplete="tel" inputMode="tel" required maxLength={30} className="h-12 rounded-xl" />
                  </Field>
                  <Field label="I’m a…" htmlFor="workshop-category">
                    <select id="workshop-category" value={customerCategory} onChange={(event) => setCustomerCategory(event.target.value)} required className="h-12 w-full rounded-xl border border-input bg-background px-3 text-sm">
                      <option value="">Select one</option>
                      {customerTypes.map(([value, text]) => <option value={value} key={value}>{text}</option>)}
                    </select>
                  </Field>
                </div>

                <div className="hidden" aria-hidden="true">
                  <label htmlFor="workshop-website">Website</label>
                  <Input id="workshop-website" value={website} onChange={(event) => setWebsite(event.target.value)} tabIndex={-1} autoComplete="off" />
                </div>

                <div className="space-y-3 rounded-2xl bg-[#f5f6f1] p-4">
                  <Consent checked={eventUpdatesConsent} onChange={setEventUpdatesConsent} required>
                    Email me important updates about this workshop.
                  </Consent>
                  <Consent checked={marketingConsent} onChange={setMarketingConsent}>
                    Also send me future garden tips and SSW news. Optional; unsubscribe anytime.
                  </Consent>
                </div>

                {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

                <Button type="submit" disabled={submitting} className="min-h-14 w-full rounded-xl bg-[#264027] text-base font-bold hover:bg-[#345737]">
                  {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving your spot…</> : <>Reserve My Free Spot <ArrowRight className="ml-2 h-4 w-4" /></>}
                </Button>

                <div className="flex items-start gap-3 rounded-xl border border-[#d7b77d]/35 bg-[#fffaf0] p-3 text-xs leading-5 text-[#665a45]">
                  <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-[#9a7448]" />
                  Your free Fall Garden Planning Guide is included.
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      <footer className="border-t border-[#264027]/10 px-5 py-6 text-center text-xs leading-5 text-[#6a756c] sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-5 gap-y-2">
          <span className="inline-flex items-center gap-1.5 font-semibold text-[#264027]"><Sprout className="h-4 w-4" /> Organic Soil Wholesale</span>
          <span>1634 N 19th Ave, Phoenix, AZ 85009</span>
          <a href="/privacy" className="underline underline-offset-2">Privacy</a>
        </div>
      </footer>
    </main>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return <div><label htmlFor={htmlFor} className="mb-2 block text-sm font-bold text-[#334238]">{label}</label>{children}</div>;
}

function Consent({ checked, onChange, required = false, children }: { checked: boolean; onChange: (value: boolean) => void; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm leading-5 text-[#536058]">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} required={required} className="mt-0.5 h-5 w-5 shrink-0 accent-[#264027]" />
      <span>{children}</span>
    </label>
  );
}
