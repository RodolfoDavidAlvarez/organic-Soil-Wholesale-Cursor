import { useEffect, useRef, useState } from "react";
import SEO from "@/components/layout/SEO";
import { PayPickupGrid } from "@/components/PayPickupGrid";
import { Phone, FileText, MapPin, ArrowUpRight, CheckCircle2, Loader2, Truck, X, Navigation } from "lucide-react";

const MOS_API_BASE = "https://myorganicsoil.com";
const SSW_PHONE_DIAL = "+16027267211";
const SSW_DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent("1634 N 19th Ave, Phoenix AZ 85009")}`;

type CheckInResult =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "checked_in"; bay: number; order_number: string; customer_first_name: string; items: Array<{ product_name?: string; size_option?: string; quantity?: number }>; alreadyCheckedIn?: boolean }
  | { status: "no_order"; phone: string }
  | { status: "error"; message: string };

function digitsOnly(s: string): string {
  return s.replace(/\D/g, "").slice(0, 10);
}
function formatPhone(digits: string): string {
  const d = digitsOnly(digits);
  if (d.length === 0) return "";
  if (d.length < 4) return `(${d}`;
  if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6, 10)}`;
}

function scrollToMenu() {
  const grid = document.getElementById("checkin-menu-anchor");
  if (grid) grid.scrollIntoView({ behavior: "smooth", block: "start" });
}

/** Animated BAY number — counts 1 → N over 400 ms then settles. */
function AnimatedBay({ value }: { value: number }) {
  const [n, setN] = useState(1);
  useEffect(() => {
    if (value <= 1) { setN(value); return; }
    let cur = 0;
    const start = performance.now();
    const dur = 400;
    let raf = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const ease = 1 - Math.pow(1 - t, 3);
      const next = Math.max(1, Math.round(ease * value));
      if (next !== cur) { cur = next; setN(next); }
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span>{n}</span>;
}

/** Yard check-in card. Phone in, bay number out. Optimized for one-handed
 *  truck-cab use: autofocus + numeric pad + auto-submit at 10 digits. */
function CheckInPanel() {
  const [digits, setDigits] = useState("");
  const [result, setResult] = useState<CheckInResult>({ status: "idle" });
  const inputRef = useRef<HTMLInputElement | null>(null);
  const autoSubmitTimer = useRef<number | null>(null);

  // Hydrate cached check-in (within 60 min) so re-scan is instant
  useEffect(() => {
    try {
      const cached = localStorage.getItem("ssw_checkin_v1");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.at && Date.now() - parsed.at < 60 * 60_000 && parsed.bay) {
          setResult({
            status: "checked_in",
            bay: parsed.bay,
            order_number: parsed.order_number || "",
            customer_first_name: parsed.customer_first_name || "",
            items: parsed.items || [],
            alreadyCheckedIn: true,
          });
          return;
        }
      }
    } catch {}

    // URL pre-fill: /qr?phone=9285501649 → auto-fill and submit immediately
    const params = new URLSearchParams(window.location.search);
    const prefill = digitsOnly(params.get("phone") || "");
    if (prefill.length === 10) {
      setDigits(prefill);
      // Defer submit to next tick so React state has settled
      setTimeout(() => submitDigits(prefill), 50);
    }

    // Warm DNS/TLS to MOS API so first submit feels instant
    try {
      fetch(`${MOS_API_BASE}/api/health`, { method: "GET", mode: "no-cors", cache: "no-store" }).catch(() => {});
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-submit when user hits 10 digits (280 ms grace to not feel hijacked)
  useEffect(() => {
    if (autoSubmitTimer.current) {
      window.clearTimeout(autoSubmitTimer.current);
      autoSubmitTimer.current = null;
    }
    if (digits.length === 10 && result.status === "idle") {
      autoSubmitTimer.current = window.setTimeout(() => submitDigits(digits), 280);
    }
    return () => {
      if (autoSubmitTimer.current) window.clearTimeout(autoSubmitTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [digits]);

  async function submitDigits(d: string) {
    const phone = "+1" + d;
    setResult({ status: "loading" });
    try {
      const r = await fetch(`${MOS_API_BASE}/api/pickup-orders/check-in-by-phone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, qr_source: "yard_banner_main" }),
      });
      const data = await r.json();
      if (data.status === "checked_in") {
        try {
          localStorage.setItem("ssw_checkin_v1", JSON.stringify({ at: Date.now(), ...data }));
        } catch {}
        setResult({ status: "checked_in", ...data });
      } else if (data.status === "no_order") {
        setResult({ status: "no_order", phone: formatPhone(d) });
      } else {
        setResult({ status: "error", message: data.error || "Couldn't reach the yard. Try again?" });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setResult({ status: "error", message });
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (digits.length !== 10) {
      inputRef.current?.focus();
      return;
    }
    submitDigits(digits);
  }

  function resetForNewCustomer() {
    try { localStorage.removeItem("ssw_checkin_v1"); } catch {}
    setResult({ status: "idle" });
    setDigits("");
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function retry() {
    setResult({ status: "idle" });
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  // ─── Full-viewport success overlay ─────────────────────────────────────
  if (result.status === "checked_in") {
    const itemsLabel = (result.items || []).slice(0, 2).map((i) => `${i.quantity || 1}× ${i.product_name || "item"}${i.size_option ? ` (${i.size_option})` : ""}`).join(", ");
    return (
      <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-gradient-to-br from-green-900 via-green-800 to-green-950 px-6 text-center text-white">
        {/* Close X — top right */}
        <button
          onClick={resetForNewCustomer}
          aria-label="Check in someone else"
          className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-2 text-[11px] font-semibold backdrop-blur hover:bg-white/20"
        >
          <X className="h-3.5 w-3.5" /> Not me
        </button>

        <CheckCircle2 className="h-20 w-20 text-green-300 drop-shadow-[0_0_30px_rgba(134,239,172,0.5)]" strokeWidth={1.5} />

        <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.4em] text-green-200">
          {result.alreadyCheckedIn ? "You're already checked in" : "✓ Checked in"}
        </p>

        <h1 className="mt-3 text-7xl font-black leading-none tracking-tight sm:text-9xl">
          BAY <span className="text-green-300 tabular-nums"><AnimatedBay value={result.bay} /></span>
        </h1>

        <p className="mt-6 max-w-md text-lg font-semibold leading-snug sm:text-2xl">
          {result.customer_first_name ? `Welcome back, ${result.customer_first_name}. ` : ""}
          Pull into Bay {result.bay} and stay in your truck.
        </p>

        {itemsLabel && (
          <p className="mt-3 max-w-md text-sm text-green-200 sm:text-base">
            Loading now: {itemsLabel}
          </p>
        )}
        {result.order_number && (
          <p className="mt-1 text-xs text-green-300/70">Order #{result.order_number}</p>
        )}

        <p className="mt-6 max-w-md text-xs text-green-200/80 sm:text-sm">
          We'll text you when your truck is ready. Reply HELP if you need anything.
        </p>

        {/* Action buttons */}
        <div className="mt-8 flex w-full max-w-sm flex-col gap-3 sm:max-w-md sm:flex-row">
          <a
            href={`tel:${SSW_PHONE_DIAL}`}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-white px-5 py-4 text-base font-bold text-green-900 transition hover:bg-green-50"
          >
            <Phone className="h-5 w-5" /> Call us
          </a>
          <a
            href={SSW_DIRECTIONS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-white/30 bg-transparent px-5 py-4 text-base font-bold text-white transition hover:bg-white/10"
          >
            <Navigation className="h-5 w-5" /> Directions
          </a>
        </div>
      </div>
    );
  }

  // ─── Hero check-in form ────────────────────────────────────────────────
  const formatted = formatPhone(digits);
  const isLoading = result.status === "loading";
  const inputBorderClass =
    digits.length === 10 ? "ring-4 ring-green-400" : "ring-0";

  return (
    <section className="relative bg-gradient-to-br from-green-900 via-green-800 to-green-950 py-8 text-white sm:py-12">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-xl text-center">
          {/* Eyebrow */}
          <div className="flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-[0.3em] text-green-200">
            <Truck className="h-3.5 w-3.5" /> Already paid? Check in
          </div>

          {/* Big readable headline */}
          <h2 className="mt-3 text-3xl font-black uppercase leading-none tracking-tight sm:text-5xl">
            I'M HERE
          </h2>
          <p className="mt-2 text-sm text-green-100/80 sm:text-base">
            Type your phone. We'll tell you which bay to pull into.
          </p>

          <form onSubmit={onSubmit} className="mt-5">
            <input
              ref={inputRef}
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              autoFocus
              pattern="[0-9]*"
              placeholder="(___) ___-____"
              value={formatted}
              onChange={(e) => setDigits(digitsOnly(e.target.value))}
              disabled={isLoading}
              aria-label="Phone number"
              className={`block w-full rounded-2xl border-0 bg-white/95 px-4 py-5 text-center text-3xl font-bold tracking-widest text-stone-900 placeholder:text-stone-300 focus:outline-none ${inputBorderClass} transition`}
            />

            <button
              type="submit"
              disabled={isLoading || digits.length !== 10}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-green-400 px-5 py-5 text-xl font-black uppercase tracking-wide text-green-950 transition hover:bg-green-300 disabled:opacity-50"
            >
              {isLoading ? (
                <><Loader2 className="h-5 w-5 animate-spin" /> Checking your order…</>
              ) : (
                "I'm here →"
              )}
            </button>
          </form>

          {/* No-order state */}
          {result.status === "no_order" && (
            <div className="mt-5 rounded-2xl border-2 border-amber-300/40 bg-amber-50/95 p-4 text-stone-900">
              <p className="text-sm font-semibold sm:text-base">
                We couldn't find an order under {result.phone}.
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-center">
                <button
                  onClick={resetForNewCustomer}
                  className="inline-flex items-center justify-center rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-900 hover:bg-stone-100"
                >
                  Try a different number
                </button>
                <button
                  onClick={scrollToMenu}
                  className="inline-flex items-center justify-center rounded-lg bg-green-700 px-4 py-2 text-sm font-bold text-white hover:bg-green-600"
                >
                  Browse the menu ↓
                </button>
              </div>
            </div>
          )}

          {/* Error state */}
          {result.status === "error" && (
            <div className="mt-5 rounded-2xl border-2 border-amber-300/40 bg-amber-50/95 p-4 text-stone-900">
              <p className="text-sm font-semibold">{result.message}</p>
              <button
                onClick={retry}
                className="mt-3 inline-flex items-center justify-center rounded-lg bg-green-700 px-5 py-2 text-sm font-bold text-white hover:bg-green-600"
              >
                Try again
              </button>
            </div>
          )}

          {/* Hint to scroll for walk-ins */}
          {result.status === "idle" && (
            <p className="mt-5 text-xs text-green-200/70">
              First time? Scroll down for the menu ↓
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

/**
 * Pay & Pick Up landing page.
 *
 * History: this used to be a 1,773-line 7-step wizard. As of release 2.6 the
 * page is a thin wrapper around <PayPickupGrid />, which is the same component
 * used at the top of /products. Single source of truth for the 4 mains.
 *
 * Routes that hit this component: `/pay-and-pickup`, `/pay-and-pickup/:step?`,
 * `/qr`, `/drive-through/:step?` (mobile drive-by QR landing — same flow).
 */

const PHOENIX_DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
  "1634 N 19th Ave, Phoenix AZ 85009"
)}`;

export default function PayAndPickup() {
  // QR scanners land here mid-scroll; reset to top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <SEO
        title="Pay & Pick Up | Soil Seed & Water"
        description="Reserve a pickup slot and pay online. Dairy compost, worm castings, Soil Craft potting blend, Nature's Blanket Premium mulch — ready in the yard at the slot you pick."
        keywords="pay and pickup soil, organic soil phoenix pickup, dairy compost pickup, worm castings pickup, soil craft pickup"
        canonical="https://organicsoilwholesale.com/pay-and-pickup"
      />

      {/* Yard check-in: phone in → bay number out. Skipped after first scan via localStorage. */}
      <CheckInPanel />

      {/* Compact header strip — keeps QR landing visual context but doesn't hog the viewport */}
      <section className="bg-stone-900 text-white">
        <div className="container mx-auto flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#d6c1a0]">
              Soil Seed &amp; Water · Phoenix yard
            </p>
            <p className="text-sm font-semibold">Pay online · pick up at the slot you choose</p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <a
              href={PHOENIX_DIRECTIONS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 font-semibold backdrop-blur hover:bg-white/20"
            >
              <MapPin className="h-3.5 w-3.5" />
              1634 N 19th Ave
              <ArrowUpRight className="h-3 w-3" />
            </a>
            <a
              href="tel:+16027267211"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#d6c1a0] px-3 py-1.5 font-semibold text-stone-900 hover:bg-[#c4a878]"
            >
              <Phone className="h-3.5 w-3.5" />
              (602) 726-7211
            </a>
          </div>
        </div>
      </section>

      {/* The 4 mains — same component used on /products */}
      <section id="checkin-menu-anchor" className="bg-gradient-to-b from-stone-50 to-white py-6 md:py-10">
        <div className="container mx-auto px-4">
          <PayPickupGrid />
          <div className="mt-6 flex flex-col items-center gap-2 border-t border-stone-200 pt-6 text-center text-sm text-stone-600 sm:flex-row sm:justify-center sm:gap-4">
            <FileText className="h-4 w-4 text-stone-500" />
            <span>Need bulk, mulch, or a specialty blend?</span>
            <a href="/products#request-quote" className="font-semibold text-[#264027] underline">
              Request a quote →
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
