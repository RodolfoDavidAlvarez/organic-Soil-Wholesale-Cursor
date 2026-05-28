import { useEffect, useRef, useState } from "react";
import SEO from "@/components/layout/SEO";
import { PayPickupGrid } from "@/components/PayPickupGrid";
import {
  Phone,
  MapPin,
  ArrowUpRight,
  CheckCircle2,
  Loader2,
  Truck,
  X,
  Navigation,
  ShieldCheck,
  ChevronRight,
  ArrowLeft,
  Leaf,
} from "lucide-react";

/**
 * Pay & Pick Up — /qr LANDING PAGE
 *
 * ⚠️ /qr is THE printed-signage URL at the OSW yard main entrance.
 *    The physical QR code at the front gate (1634 N 19th Ave, Phoenix — Agave yard)
 *    points to https://organicsoilwholesale.com/qr. NEVER rename this route.
 *
 * Mobile-first. 90%+ of scans are phone-in-hand at the gate. Optimized for
 * 2-3 taps from scan → action (order online or check in).
 *
 * Routes that hit this component: /qr, /pay-and-pickup, /pay-and-pickup/:step?,
 * /drive-through/:step?. Welcome screen is the default.
 *
 * Three internal views via React state (no full reloads, instant transitions):
 *   - "welcome" → two-card landing: "Order & Pick Up" + "Walking In"
 *   - "order"   → PayPickupGrid (browse + pay online)
 *   - "checkin" → CheckInPanel (already paid → phone in → bay number out)
 *
 * Deep links via hash: /qr#order and /qr#checkin
 */

const MOS_API_BASE = "https://myorganicsoil.com";
const SSW_PHONE_DIAL = "+16027267211";
const SSW_PHONE_DISPLAY = "(602) 726-7211";
const PHOENIX_DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
  "1634 N 19th Ave, Phoenix AZ 85009"
)}`;

type View = "welcome" | "order" | "checkin";

type CheckInResult =
  | { status: "idle" }
  | { status: "loading" }
  | {
      status: "checked_in";
      bay: number;
      order_number: string;
      customer_first_name: string;
      items: Array<{ product_name?: string; size_option?: string; quantity?: number }>;
      alreadyCheckedIn?: boolean;
    }
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

/** Animated BAY number — counts 1 → N over 400 ms then settles. */
function AnimatedBay({ value }: { value: number }) {
  const [n, setN] = useState(1);
  useEffect(() => {
    if (value <= 1) {
      setN(value);
      return;
    }
    let cur = 0;
    const start = performance.now();
    const dur = 400;
    let raf = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const ease = 1 - Math.pow(1 - t, 3);
      const next = Math.max(1, Math.round(ease * value));
      if (next !== cur) {
        cur = next;
        setN(next);
      }
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span>{n}</span>;
}

// ─── Welcome screen — minimal, mobile-first ──────────────────────────────────
function WelcomeScreen({
  onOrder,
  onCheckIn,
}: {
  onOrder: () => void;
  onCheckIn: () => void;
}) {
  return (
    <section className="flex min-h-[100dvh] flex-col bg-white text-stone-900">
      {/* Top brand strip — tiny, restrained */}
      <header className="px-6 pt-8 pb-2 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-stone-400">
          Soil Seed &amp; Water · Phoenix Yard
        </p>
      </header>

      {/* Wordmark */}
      <div className="px-6 pt-10 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.32em] text-stone-400">Welcome</p>
        <h1 className="mt-3 text-[44px] font-black leading-[0.95] tracking-tight text-stone-900 sm:text-5xl">
          <span className="block">Organic <span className="text-[#264027]">Soil</span></span>
          <span className="mt-1 block italic text-[#b38a58]">Wholesale</span>
        </h1>
        <p className="mt-5 text-base text-stone-500">How can we help you today?</p>
      </div>

      {/* Two actions — minimal, clean lines */}
      <div className="mt-10 flex-1 px-6">
        <div className="mx-auto flex max-w-sm flex-col gap-3">
          <button
            type="button"
            onClick={onOrder}
            className="group flex w-full items-center justify-between rounded-2xl bg-stone-900 px-6 py-5 text-left text-white transition active:scale-[0.985]"
          >
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-400">Pre-order online</p>
              <h2 className="mt-1 text-lg font-bold leading-tight">Order &amp; Pick Up</h2>
            </div>
            <ChevronRight className="h-5 w-5 text-stone-400 transition-transform group-hover:translate-x-0.5" />
          </button>

          <button
            type="button"
            onClick={onCheckIn}
            className="group flex w-full items-center justify-between rounded-2xl border border-stone-200 bg-white px-6 py-5 text-left text-stone-900 transition hover:border-stone-400 active:scale-[0.985]"
          >
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-400">Already paid</p>
              <h2 className="mt-1 text-lg font-bold leading-tight">I&apos;m Here</h2>
            </div>
            <ChevronRight className="h-5 w-5 text-stone-400 transition-transform group-hover:translate-x-0.5" />
          </button>

          {/* Tertiary — link to full OSW site */}
          <a
            href="/"
            className="group mt-1 flex w-full items-center justify-between rounded-2xl px-6 py-4 text-left text-stone-500 transition hover:text-stone-900"
          >
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-400">Explore everything</p>
              <h2 className="mt-1 text-sm font-semibold leading-tight">Visit our website</h2>
            </div>
            <ChevronRight className="h-4 w-4 text-stone-400 transition-transform group-hover:translate-x-0.5" />
          </a>
        </div>
      </div>

      {/* Footer — quiet text links, no chrome */}
      <footer className="px-6 pb-10 pt-10 text-center">
        <div className="mx-auto flex max-w-sm items-center justify-center gap-6 text-xs">
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
        </div>
      </footer>
    </section>
  );
}

// ─── Check-in view — wraps existing CheckInPanel ─────────────────────────────
function CheckInPanel({ onBack }: { onBack: () => void }) {
  const [digits, setDigits] = useState("");
  const [result, setResult] = useState<CheckInResult>({ status: "idle" });
  const inputRef = useRef<HTMLInputElement | null>(null);
  const autoSubmitTimer = useRef<number | null>(null);

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

    const params = new URLSearchParams(window.location.search);
    const prefill = digitsOnly(params.get("phone") || "");
    if (prefill.length === 10) {
      setDigits(prefill);
      setTimeout(() => submitDigits(prefill), 50);
    }

    try {
      fetch(`${MOS_API_BASE}/api/health`, { method: "GET", mode: "no-cors", cache: "no-store" }).catch(() => {});
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        body: JSON.stringify({ phone, qr_source: "yard_entrance_qr" }),
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
    try {
      localStorage.removeItem("ssw_checkin_v1");
    } catch {}
    setResult({ status: "idle" });
    setDigits("");
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function retry() {
    setResult({ status: "idle" });
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  // Success — BAY assigned. Clean, minimal, no green.
  if (result.status === "checked_in") {
    const itemsLabel = (result.items || [])
      .slice(0, 2)
      .map((i) => `${i.quantity || 1}× ${i.product_name || "item"}${i.size_option ? ` (${i.size_option})` : ""}`)
      .join(", ");
    return (
      <div className="fixed inset-0 z-[60] flex flex-col bg-white text-stone-900">
        {/* Top bar — minimal */}
        <header className="flex items-center justify-between px-6 pt-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-stone-400">
            {result.alreadyCheckedIn ? "Already checked in" : "Checked in"}
          </p>
          <button
            onClick={resetForNewCustomer}
            aria-label="Check in someone else"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-500 hover:text-stone-900"
          >
            <X className="h-3.5 w-3.5" /> Not me
          </button>
        </header>

        {/* Hero — the bay number is the entire point */}
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.32em] text-stone-400">Pull into</p>
          <h1 className="mt-2 text-[112px] font-black leading-[0.85] tracking-tight text-stone-900 sm:text-[160px]">
            BAY <span className="tabular-nums"><AnimatedBay value={result.bay} /></span>
          </h1>

          <p className="mt-6 max-w-sm text-base font-medium text-stone-600 sm:text-lg">
            {result.customer_first_name ? `${result.customer_first_name}, stay in your truck. ` : "Stay in your truck. "}
            We&apos;re loading now.
          </p>

          {itemsLabel && (
            <div className="mt-6 w-full max-w-sm rounded-2xl bg-stone-100 px-5 py-4 text-left">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-400">Loading now</p>
              <p className="mt-1 text-sm font-semibold text-stone-900">{itemsLabel}</p>
              {result.order_number && (
                <p className="mt-1 text-xs text-stone-500">Order #{result.order_number}</p>
              )}
            </div>
          )}

          <p className="mt-6 max-w-sm text-xs text-stone-500">
            We&apos;ll text you when your truck is ready.
          </p>
        </div>

        {/* Footer actions — full-width text buttons, minimal */}
        <footer className="px-6 pb-8 pt-4">
          <div className="mx-auto flex max-w-sm gap-2">
            <a
              href={`tel:${SSW_PHONE_DIAL}`}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-stone-200 bg-white px-5 py-4 text-sm font-semibold text-stone-900 transition hover:border-stone-400"
            >
              <Phone className="h-4 w-4" /> Call
            </a>
            <a
              href={PHOENIX_DIRECTIONS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-stone-200 bg-white px-5 py-4 text-sm font-semibold text-stone-900 transition hover:border-stone-400"
            >
              <Navigation className="h-4 w-4" /> Directions
            </a>
          </div>
        </footer>
      </div>
    );
  }

  const formatted = formatPhone(digits);
  const isLoading = result.status === "loading";

  return (
    <section className="flex min-h-[100dvh] flex-col bg-white text-stone-900">
      {/* Top — back nav */}
      <header className="px-6 pt-6">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>
      </header>

      <div className="flex flex-1 flex-col px-6 pt-12 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.32em] text-stone-400">Already paid</p>
        <h1 className="mt-3 text-[44px] font-black leading-[0.95] tracking-tight text-stone-900 sm:text-5xl">
          I&apos;m Here
        </h1>
        <p className="mt-4 text-base text-stone-500">
          Type your phone. We&apos;ll tell you which bay.
        </p>

        <form onSubmit={onSubmit} className="mx-auto mt-8 w-full max-w-sm">
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
            className="block w-full rounded-2xl border border-stone-200 bg-white px-4 py-5 text-center text-2xl font-bold tracking-widest text-stone-900 placeholder:text-stone-300 transition focus:border-stone-900 focus:outline-none"
          />

          <button
            type="submit"
            disabled={isLoading || digits.length !== 10}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-stone-900 px-5 py-5 text-base font-bold text-white transition hover:bg-stone-800 disabled:opacity-40"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Checking…
              </>
            ) : (
              <>I&apos;m here <ChevronRight className="h-4 w-4" /></>
            )}
          </button>
        </form>

        {result.status === "no_order" && (
          <div className="mx-auto mt-6 w-full max-w-sm rounded-2xl border border-stone-200 bg-stone-50 p-4 text-left">
            <p className="text-sm font-semibold text-stone-900">
              No order found for {result.phone}.
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <button
                onClick={resetForNewCustomer}
                className="inline-flex flex-1 items-center justify-center rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-xs font-semibold text-stone-900 hover:border-stone-400"
              >
                Try a different number
              </button>
              <button
                onClick={onBack}
                className="inline-flex flex-1 items-center justify-center rounded-xl bg-stone-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-stone-800"
              >
                Order instead
              </button>
            </div>
          </div>
        )}

        {result.status === "error" && (
          <div className="mx-auto mt-6 w-full max-w-sm rounded-2xl border border-stone-200 bg-stone-50 p-4 text-left">
            <p className="text-sm font-semibold text-stone-900">{result.message}</p>
            <button
              onClick={retry}
              className="mt-3 inline-flex items-center justify-center rounded-xl bg-stone-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-stone-800"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Order view — PayPickupGrid with minimal header ──────────────────────────
function OrderView({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-[100dvh] bg-white">
      <header className="sticky top-0 z-30 border-b border-stone-100 bg-white/90 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900"
            aria-label="Back to welcome"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </button>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-stone-400">
            Order &amp; Pick Up
          </p>
          <a
            href={`tel:${SSW_PHONE_DIAL}`}
            className="inline-flex items-center text-stone-500 hover:text-stone-900"
            aria-label="Call the yard"
          >
            <Phone className="h-4 w-4" />
          </a>
        </div>
      </header>

      <section className="py-6">
        <div className="container mx-auto px-4">
          <PayPickupGrid />
          <div className="mt-8 flex flex-col items-center gap-2 border-t border-stone-100 pt-6 text-center text-xs text-stone-500 sm:flex-row sm:justify-center sm:gap-3">
            <span>Need bulk or something custom?</span>
            <a href="/products#request-quote" className="font-semibold text-stone-900 underline-offset-4 hover:underline">
              Request a quote
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── Main component — view switcher ──────────────────────────────────────────
export default function PayAndPickup() {
  const [view, setView] = useState<View>("welcome");

  // QR scanners land here mid-scroll; always pin to top, always start at welcome
  useEffect(() => {
    window.scrollTo(0, 0);

    // Honor deep link via hash: /qr#order or /qr#checkin
    const hash = window.location.hash.replace("#", "").toLowerCase();
    if (hash === "order") setView("order");
    else if (hash === "checkin" || hash === "walking-in") setView("checkin");
  }, []);

  // Sync view to hash so back-button behavior feels native
  useEffect(() => {
    const target = view === "welcome" ? " " : `#${view}`;
    if (window.location.hash !== target && !(view === "welcome" && !window.location.hash)) {
      try {
        window.history.replaceState(null, "", view === "welcome" ? window.location.pathname : target);
      } catch {}
    }
  }, [view]);

  return (
    <>
      <SEO
        title="Pay & Pick Up | Soil Seed & Water"
        description="Scan, order online, and pick up at the Phoenix yard. Dairy compost, worm castings, Soil Craft potting blend, Nature's Blanket Premium mulch."
        keywords="pay and pickup soil, organic soil phoenix pickup, dairy compost pickup, worm castings pickup, soil craft pickup"
        canonical="https://organicsoilwholesale.com/qr"
      />

      {view === "welcome" && (
        <WelcomeScreen onOrder={() => setView("order")} onCheckIn={() => setView("checkin")} />
      )}
      {view === "order" && <OrderView onBack={() => setView("welcome")} />}
      {view === "checkin" && <CheckInPanel onBack={() => setView("welcome")} />}
    </>
  );
}
