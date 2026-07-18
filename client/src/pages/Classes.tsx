import { useState } from "react";
import SEO from "@/components/layout/SEO";
import { Sprout, MapPin, Phone, Mail, Loader2, CheckCircle2 } from "lucide-react";
import { PHOENIX_YARD_DIRECTIONS_URL } from "@/config/contact";

/**
 * /classes — Garden Classes landing page.
 *
 * Lives at https://organicsoilwholesale.com/classes (printed QR code points here).
 * Minimal, mobile-first, brand-consistent with /qr. Captures interested leads
 * so we can notify them when classes are scheduled.
 */

const SSW_PHONE_DIAL = "+16026370032";
const SSW_PHONE_DISPLAY = "(602) 637-0032";
const PHOENIX_DIRECTIONS_URL = PHOENIX_YARD_DIRECTIONS_URL;

type FormState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; name: string }
  | { status: "error"; message: string };

export default function Classes() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [interest, setInterest] = useState("");
  const [state, setState] = useState<FormState>({ status: "idle" });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setState({ status: "error", message: "Name and email are required." });
      return;
    }
    setState({ status: "loading" });
    try {
      const res = await fetch("/api/leads/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          notes:
            `Garden classes interest signup` +
            (interest.trim() ? ` — wants to learn: ${interest.trim()}` : ""),
          source: "osw_classes_signup",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setState({ status: "error", message: data?.error || "Something went wrong. Try again?" });
        return;
      }
      setState({ status: "success", name: name.trim().split(/\s+/)[0] });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Network error";
      setState({ status: "error", message });
    }
  }

  if (state.status === "success") {
    return (
      <>
        <SEO
          title="Garden Classes | Organic Soil Wholesale"
          description="Sign up for hands-on garden classes at Soil Seed & Water in Phoenix."
          canonical="https://organicsoilwholesale.com/classes"
        />
        <section className="flex min-h-[100dvh] flex-col items-center justify-center bg-white px-6 text-center text-stone-900">
          <CheckCircle2 className="h-16 w-16 text-stone-900" strokeWidth={1.5} />
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.32em] text-stone-400">
            You&apos;re on the list
          </p>
          <h1 className="mt-3 text-4xl font-black leading-tight tracking-tight">
            Thanks, {state.name}.
          </h1>
          <p className="mt-4 max-w-sm text-base text-stone-600">
            We&apos;ll email you the moment our next garden class is scheduled.
          </p>
          <a
            href="/"
            className="mt-8 inline-flex items-center gap-1.5 rounded-2xl border border-stone-200 bg-white px-6 py-3 text-sm font-semibold text-stone-900 hover:border-stone-400"
          >
            Visit our website
          </a>
        </section>
      </>
    );
  }

  const isLoading = state.status === "loading";

  return (
    <>
      <SEO
        title="Garden Classes | Organic Soil Wholesale"
        description="Sign up for hands-on garden classes at Soil Seed & Water in Phoenix, AZ."
        keywords="garden classes phoenix, soil class, composting workshop, organic gardening class"
        canonical="https://organicsoilwholesale.com/classes"
      />

      <section className="flex min-h-[100dvh] flex-col bg-white text-stone-900">
        {/* Top brand strip */}
        <header className="px-6 pt-8 pb-2 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-stone-400">
            Soil Seed &amp; Water · Phoenix Yard
          </p>
        </header>

        {/* Hero */}
        <div className="px-6 pt-10 text-center">
          <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full border border-stone-200">
            <Sprout className="h-6 w-6 text-stone-900" strokeWidth={1.6} />
          </div>
          <p className="mt-5 text-xs font-medium uppercase tracking-[0.32em] text-stone-400">
            Coming soon
          </p>
          <h1 className="mt-3 text-[44px] font-black leading-[0.95] tracking-tight text-stone-900 sm:text-5xl">
            <span className="block">Garden</span>
            <span className="mt-1 block italic text-[#b38a58]">Classes</span>
          </h1>
          <p className="mx-auto mt-5 max-w-md text-base text-stone-600 sm:text-lg">
            Hands-on workshops in soil, compost, and growing food at the yard.
            Sign up and we&apos;ll tell you when the next one opens.
          </p>
        </div>

        {/* Signup form */}
        <div className="mt-10 flex-1 px-6">
          <form onSubmit={onSubmit} className="mx-auto flex w-full max-w-sm flex-col gap-3">
            <input
              type="text"
              autoComplete="name"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              required
              aria-label="Name"
              className="block w-full rounded-2xl border border-stone-200 bg-white px-5 py-4 text-base text-stone-900 placeholder:text-stone-400 transition focus:border-stone-900 focus:outline-none"
            />
            <input
              type="email"
              autoComplete="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
              aria-label="Email"
              className="block w-full rounded-2xl border border-stone-200 bg-white px-5 py-4 text-base text-stone-900 placeholder:text-stone-400 transition focus:border-stone-900 focus:outline-none"
            />
            <input
              type="tel"
              autoComplete="tel"
              placeholder="Phone (optional)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={isLoading}
              aria-label="Phone"
              className="block w-full rounded-2xl border border-stone-200 bg-white px-5 py-4 text-base text-stone-900 placeholder:text-stone-400 transition focus:border-stone-900 focus:outline-none"
            />
            <input
              type="text"
              placeholder="What do you want to learn? (optional)"
              value={interest}
              onChange={(e) => setInterest(e.target.value)}
              disabled={isLoading}
              aria-label="What do you want to learn?"
              className="block w-full rounded-2xl border border-stone-200 bg-white px-5 py-4 text-base text-stone-900 placeholder:text-stone-400 transition focus:border-stone-900 focus:outline-none"
            />

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-stone-900 px-5 py-5 text-base font-bold text-white transition hover:bg-stone-800 disabled:opacity-40"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Adding you…
                </>
              ) : (
                "Notify me when classes open"
              )}
            </button>

            {state.status === "error" && (
              <p className="mt-2 text-center text-sm text-red-700">{state.message}</p>
            )}
          </form>
        </div>

        {/* Footer */}
        <footer className="px-6 pb-10 pt-12 text-center">
          <div className="mx-auto flex max-w-sm flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs">
            <a
              href={PHOENIX_DIRECTIONS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-stone-500 underline-offset-4 hover:text-stone-900 hover:underline"
            >
              <MapPin className="h-3.5 w-3.5" />
              1634 N 19th Ave
            </a>
            <a
              href={`tel:${SSW_PHONE_DIAL}`}
              className="inline-flex items-center gap-1.5 text-stone-500 underline-offset-4 hover:text-stone-900 hover:underline"
            >
              <Phone className="h-3.5 w-3.5" />
              {SSW_PHONE_DISPLAY}
            </a>
            <a
              href="mailto:info@soilseedandwater.com"
              className="inline-flex items-center gap-1.5 text-stone-500 underline-offset-4 hover:text-stone-900 hover:underline"
            >
              <Mail className="h-3.5 w-3.5" />
              info@soilseedandwater.com
            </a>
          </div>
        </footer>
      </section>
    </>
  );
}
