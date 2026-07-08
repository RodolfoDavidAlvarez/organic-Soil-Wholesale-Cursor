import { useEffect, useRef, useState } from "react";
import SEO from "@/components/layout/SEO";
import { PayPickupGrid } from "@/components/PayPickupGrid";
import {
  Phone,
  MapPin,
  Loader2,
  X,
  Navigation,
  ChevronRight,
  ArrowLeft,
  Octagon,
} from "lucide-react";
import {
  CHECKIN_PHONE_DISPLAY,
  CHECKIN_PHONE_DIAL,
  CUSTOMER_SUPPORT_PHONE_DISPLAY,
  CUSTOMER_SUPPORT_PHONE_DIAL,
} from "@/config/contact";
import { trackEvent } from "@/lib/analytics";

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
 * Routes that hit this component: /qr, /check-in, /pay-and-pickup,
 * /pay-and-pickup/:step?, /drive-through/:step?.
 *
 * Three internal views via React state (no full reloads, instant transitions):
 *   - "welcome" → two-card landing: "Order & Pick Up" + "Walking In"
 *   - "arrival" → dedicated yard check-in welcome for /check-in
 *   - "arrivalOptions" → choose order check-in, rep help, or products
 *   - "repNotify" → name + phone rep notification
 *   - "order"   → PayPickupGrid (browse + pay online)
 *   - "checkin" → CheckInPanel (already paid → phone in → bay number out)
 *
 * Deep links via hash: /qr#order and /qr#checkin
 */

const MOS_API_BASE = "https://myorganicsoil.com";
const SSW_PHONE_DIAL = CUSTOMER_SUPPORT_PHONE_DIAL;
const SSW_PHONE_DISPLAY = CUSTOMER_SUPPORT_PHONE_DISPLAY;
const PHOENIX_DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
  "1634 N 19th Ave, Phoenix AZ 85009"
)}`;

type View = "welcome" | "arrival" | "arrivalOptions" | "repNotify" | "order" | "checkin";

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

type RepNotifyResult =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "sent" }
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
        <div className="mx-auto flex max-w-sm flex-col items-center gap-3 text-xs">
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

function ArrivalScreen({ onHere, onProducts }: { onHere: () => void; onProducts: () => void }) {
  return (
    <section className="flex min-h-[100dvh] flex-col bg-white text-stone-900">
      <header className="px-6 pt-8 pb-2 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-stone-400">
          Soil Seed &amp; Water · Phoenix Yard
        </p>
      </header>

      <div className="flex flex-1 flex-col px-6 pt-14 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.32em] text-stone-400">Welcome to</p>
        <h1 className="mt-3 text-[42px] font-black leading-[0.95] tracking-tight text-stone-900 sm:text-5xl">
          <span className="block">Organic <span className="text-[#264027]">Soil</span></span>
          <span className="mt-1 block italic text-[#b38a58]">Wholesale</span>
        </h1>

        <div className="mx-auto mt-12 w-full max-w-sm">
          <h2 className="text-[44px] font-black leading-none tracking-tight text-stone-900">I&apos;m here.</h2>
          <p className="mt-4 text-base font-medium leading-relaxed text-stone-500">
            Click below to notify a representative or check in for an existing order.
          </p>

          <button
            type="button"
            onClick={onHere}
            className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-stone-900 px-6 py-5 text-lg font-bold text-white transition active:scale-[0.985]"
          >
            I&apos;m here <ChevronRight className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={onProducts}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-6 py-5 text-base font-bold text-stone-900 transition hover:border-stone-400 active:scale-[0.985]"
          >
            See in-stock products
          </button>
        </div>
      </div>

      <footer className="px-6 pb-10 pt-10 text-center">
        <div className="mx-auto flex max-w-sm flex-col items-center gap-3 text-xs">
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
            href={`tel:${CHECKIN_PHONE_DIAL}`}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-5 py-4 text-sm font-bold text-stone-900 shadow-sm transition hover:border-stone-400 active:scale-[0.985]"
          >
            <Phone className="h-4 w-4" />
            Need help? Call {CHECKIN_PHONE_DISPLAY}
          </a>
        </div>
      </footer>
    </section>
  );
}

function ArrivalOptionsScreen({
  onBack,
  onOrderCheckIn,
  onNotifyRep,
  onProducts,
}: {
  onBack: () => void;
  onOrderCheckIn: () => void;
  onNotifyRep: () => void;
  onProducts: () => void;
}) {
  return (
    <section className="flex min-h-[100dvh] flex-col bg-white text-stone-900">
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
        <p className="text-xs font-medium uppercase tracking-[0.32em] text-stone-400">Please confirm</p>
        <h1 className="mt-3 text-[42px] font-black leading-[0.95] tracking-tight text-stone-900 sm:text-5xl">
          I&apos;m here.
        </h1>
        <p className="mx-auto mt-4 max-w-sm text-base leading-relaxed text-stone-500">
          Choose the option that fits your visit.
        </p>

        <div className="mx-auto mt-8 flex w-full max-w-sm flex-col gap-3">
          <button
            type="button"
            onClick={onOrderCheckIn}
            className="group flex w-full items-center justify-between rounded-2xl bg-stone-900 px-6 py-5 text-left text-white transition active:scale-[0.985]"
          >
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-400">Already paid</p>
              <h2 className="mt-1 text-lg font-bold leading-tight">I already placed an order</h2>
            </div>
            <ChevronRight className="h-5 w-5 text-stone-400 transition-transform group-hover:translate-x-0.5" />
          </button>

          <button
            type="button"
            onClick={onNotifyRep}
            className="group flex w-full items-center justify-between rounded-2xl border border-stone-200 bg-white px-6 py-5 text-left text-stone-900 transition hover:border-stone-400 active:scale-[0.985]"
          >
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-400">Need help</p>
              <h2 className="mt-1 text-lg font-bold leading-tight">Notify a representative</h2>
            </div>
            <ChevronRight className="h-5 w-5 text-stone-400 transition-transform group-hover:translate-x-0.5" />
          </button>

          <button
            type="button"
            onClick={onProducts}
            className="group mt-1 flex w-full items-center justify-between rounded-2xl px-6 py-4 text-left text-stone-500 transition hover:text-stone-900"
          >
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-400">Product menu</p>
              <h2 className="mt-1 text-sm font-semibold leading-tight">See in-stock products</h2>
            </div>
            <ChevronRight className="h-4 w-4 text-stone-400 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        <a
          href={`tel:${CHECKIN_PHONE_DIAL}`}
          className="mx-auto mt-8 inline-flex w-full max-w-sm items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-5 py-4 text-sm font-bold text-stone-900 shadow-sm transition hover:border-stone-400 active:scale-[0.985]"
        >
          <Phone className="h-4 w-4" />
          Need help? Call {CHECKIN_PHONE_DISPLAY}
        </a>
      </div>
    </section>
  );
}

function RepNotifyPanel({ onBack, onProducts }: { onBack: () => void; onProducts: () => void }) {
  const [name, setName] = useState("");
  const [digits, setDigits] = useState("");
  const [result, setResult] = useState<RepNotifyResult>({ status: "idle" });
  const formatted = formatPhone(digits);
  const isLoading = result.status === "loading";
  const canSubmit = name.trim().length >= 2 && digits.length === 10 && !isLoading;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setResult({ status: "loading" });
    try {
      const res = await fetch("/api/pay-and-pickup/notify-arrival", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerInfo: {
            name: name.trim(),
            phone: "+1" + digits,
          },
          vehicleInfo: "Walk-in / yard QR check-in",
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Could not notify a representative.");
      }
      setResult({ status: "sent" });
      trackEvent("Yard Representative Notified", { source: "check_in_page" });
    } catch (err: unknown) {
      setResult({
        status: "error",
        message: err instanceof Error ? err.message : "Could not notify a representative.",
      });
      trackEvent("Yard Representative Notify Failed", {
        source: "check_in_page",
        reason: err instanceof Error ? err.message.slice(0, 80) : "unknown",
      });
    }
  }

  if (result.status === "sent") {
    return (
      <section className="flex min-h-[100dvh] flex-col bg-white px-6 text-center text-stone-900">
        <div className="flex flex-1 flex-col items-center justify-center">
          <p className="text-xs font-medium uppercase tracking-[0.32em] text-stone-400">Representative notified</p>
          <h1 className="mt-4 max-w-sm text-[40px] font-black leading-tight tracking-tight text-stone-900">
            We know you&apos;re here.
          </h1>
          <p className="mt-4 max-w-sm text-base leading-relaxed text-stone-500">
            Stay nearby. A representative will come help you shortly.
          </p>
        </div>

        <footer className="pb-8">
          <div className="mx-auto flex max-w-sm gap-2">
            <a
              href={`tel:${CHECKIN_PHONE_DIAL}`}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-stone-200 bg-white px-5 py-4 text-sm font-semibold text-stone-900 transition hover:border-stone-400"
            >
              <Phone className="h-4 w-4" /> Call
            </a>
            <button
              type="button"
              onClick={onProducts}
              className="flex flex-1 items-center justify-center rounded-2xl border border-stone-200 bg-white px-5 py-4 text-sm font-semibold text-stone-900 transition hover:border-stone-400"
            >
              Products
            </button>
          </div>
        </footer>
      </section>
    );
  }

  return (
    <section className="flex min-h-[100dvh] flex-col bg-white text-stone-900">
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
        <p className="text-xs font-medium uppercase tracking-[0.32em] text-stone-400">Need help</p>
        <h1 className="mt-3 text-[40px] font-black leading-[0.95] tracking-tight text-stone-900 sm:text-5xl">
          Notify a rep.
        </h1>
        <p className="mx-auto mt-4 max-w-sm text-base leading-relaxed text-stone-500">
          Enter your name and phone so we know who to help.
        </p>

        <form onSubmit={onSubmit} noValidate className="mx-auto mt-8 w-full max-w-sm text-left">
          <label className="text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500">
            Name
          </label>
          <input
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isLoading}
            placeholder="Your name"
            className="mt-2 block w-full rounded-2xl border border-stone-200 bg-white px-4 py-4 text-lg font-semibold text-stone-900 placeholder:text-stone-300 transition focus:border-stone-900 focus:outline-none"
          />

          <label className="mt-5 block text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500">
            Phone
          </label>
          <input
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="(___) ___-____"
            value={formatted}
            onChange={(e) => setDigits(digitsOnly(e.target.value))}
            disabled={isLoading}
            className="mt-2 block w-full rounded-2xl border border-stone-200 bg-white px-4 py-4 text-center text-2xl font-bold tracking-widest text-stone-900 placeholder:text-stone-300 transition focus:border-stone-900 focus:outline-none"
          />

          <button
            type="submit"
            disabled={!canSubmit}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-stone-900 px-5 py-5 text-base font-bold text-white transition hover:bg-stone-800 disabled:opacity-40"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Notifying…
              </>
            ) : (
              <>Notify representative <ChevronRight className="h-4 w-4" /></>
            )}
          </button>
        </form>

        {result.status === "error" && (
          <p className="mx-auto mt-4 max-w-sm rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-left text-sm font-semibold text-red-700">
            {result.message}
          </p>
        )}

        <a
          href={`tel:${CHECKIN_PHONE_DIAL}`}
          className="mx-auto mt-8 inline-flex w-full max-w-sm items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-5 py-4 text-sm font-bold text-stone-900 shadow-sm transition hover:border-stone-400 active:scale-[0.985]"
        >
          <Phone className="h-4 w-4" />
          Need help? Call {CHECKIN_PHONE_DISPLAY}
        </a>
      </div>
    </section>
  );
}

// ─── Check-in view — wraps existing CheckInPanel ─────────────────────────────
function CheckInPanel({ onBack }: { onBack: () => void }) {
  const [name, setName] = useState("");
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
    if (name.trim().length >= 2 && digits.length === 10 && result.status === "idle") {
      autoSubmitTimer.current = window.setTimeout(() => submitDigits(digits), 280);
    }
    return () => {
      if (autoSubmitTimer.current) window.clearTimeout(autoSubmitTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [digits, name]);

  async function submitDigits(d: string) {
    const phone = "+1" + d;
    setResult({ status: "loading" });
    try {
      const r = await fetch(`${MOS_API_BASE}/api/pickup-orders/check-in-by-phone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, customer_name: name.trim(), qr_source: "yard_entrance_qr" }),
      });
      const data = await r.json();
      if (data.status === "checked_in") {
        try {
          localStorage.setItem("ssw_checkin_v1", JSON.stringify({ at: Date.now(), ...data }));
        } catch {}
        setResult({ status: "checked_in", ...data });
        trackEvent("Yard Order Check In Completed", {
          source: "yard_entrance_qr",
          already_checked_in: Boolean(data.alreadyCheckedIn),
          item_count: Array.isArray(data.items) ? data.items.length : 0,
        });
      } else if (data.status === "no_order") {
        setResult({ status: "no_order", phone: formatPhone(d) });
        trackEvent("Yard Order Check In No Order", { source: "yard_entrance_qr" });
      } else {
        setResult({ status: "error", message: data.error || "Couldn't reach the yard. Try again?" });
        trackEvent("Yard Order Check In Failed", {
          source: "yard_entrance_qr",
          reason: String(data.error || "unknown").slice(0, 80),
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setResult({ status: "error", message });
      trackEvent("Yard Order Check In Failed", {
        source: "yard_entrance_qr",
        reason: message.slice(0, 80),
      });
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2 || digits.length !== 10) {
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
    setName("");
    setDigits("");
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function retry() {
    setResult({ status: "idle" });
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  // Success — STOP SIGN. A rep dispatches live (bay assignment hidden — kept in DB for analytics).
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

        {/* Hero — STOP SIGN dispatch. Rep is on the way. */}
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.32em] text-stone-400">
            {result.customer_first_name ? `${result.customer_first_name}, you're checked in` : "You're checked in"}
          </p>

          {/* Stop sign visual — big red octagon with STOP inside */}
          <div className="relative mt-6 flex items-center justify-center">
            <div className="ssw-stop-pulse relative flex h-56 w-56 items-center justify-center sm:h-72 sm:w-72">
              <Octagon
                className="absolute inset-0 h-full w-full text-[#c62b1f]"
                strokeWidth={0}
                fill="currentColor"
                style={{ transform: "rotate(22.5deg)" }}
              />
              <span className="relative z-[1] text-[64px] font-black leading-none tracking-[0.08em] text-white sm:text-[88px]">
                STOP
              </span>
            </div>
          </div>

          <h1 className="mt-7 max-w-sm text-[28px] font-black leading-tight tracking-tight text-stone-900 sm:text-[34px]">
            Pull up to the stop sign.
          </h1>
          <p className="mt-3 max-w-sm text-base font-medium text-stone-600 sm:text-lg">
            A rep is on the way to direct you to your spot.
          </p>

          {itemsLabel && (
            <div className="mt-6 w-full max-w-sm rounded-2xl bg-stone-100 px-5 py-4 text-left">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-400">Loading</p>
              <p className="mt-1 text-sm font-semibold text-stone-900">{itemsLabel}</p>
              {result.order_number && (
                <p className="mt-1 text-xs text-stone-500">Order #{result.order_number}</p>
              )}
            </div>
          )}

          <p className="mt-6 max-w-sm text-xs text-stone-500">
            Stay in your truck. We&apos;ll come to you.
          </p>
        </div>

        {/* Footer actions — full-width text buttons, minimal */}
        <footer className="px-6 pb-8 pt-4">
          <div className="mx-auto flex max-w-sm gap-2">
            <a
              href={`tel:${CHECKIN_PHONE_DIAL}`}
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

        {/* Stop-sign gentle scale pulse (transform-only, no shadow) */}
        <style>{`
          @keyframes sswStopPulse {
            0%, 100% { transform: scale(1); }
            50%      { transform: scale(1.04); }
          }
          .ssw-stop-pulse { animation: sswStopPulse 1.6s ease-in-out infinite; will-change: transform; }
        `}</style>
      </div>
    );
  }

  const formatted = formatPhone(digits);
  const isLoading = result.status === "loading";
  const canSubmit = name.trim().length >= 2 && digits.length === 10 && !isLoading;

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
          Enter your name and phone. We&apos;ll notify a rep.
        </p>

        <form onSubmit={onSubmit} noValidate className="mx-auto mt-8 w-full max-w-sm text-left">
          <label className="text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500">
            Name
          </label>
          <input
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isLoading}
            placeholder="Your name"
            className="mt-2 block w-full rounded-2xl border border-stone-200 bg-white px-4 py-4 text-lg font-semibold text-stone-900 placeholder:text-stone-300 transition focus:border-stone-900 focus:outline-none"
          />

          <label className="mt-5 block text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500">
            Phone
          </label>
          <input
            ref={inputRef}
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            autoFocus
            placeholder="(___) ___-____"
            value={formatted}
            onChange={(e) => setDigits(digitsOnly(e.target.value))}
            disabled={isLoading}
            aria-label="Phone number"
            className="mt-2 block w-full rounded-2xl border border-stone-200 bg-white px-4 py-5 text-center text-2xl font-bold tracking-widest text-stone-900 placeholder:text-stone-300 transition focus:border-stone-900 focus:outline-none"
          />

          <button
            type="submit"
            disabled={!canSubmit}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-stone-900 px-5 py-5 text-base font-bold text-white transition hover:bg-stone-800 disabled:opacity-40"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Checking…
              </>
            ) : (
              <>Check in <ChevronRight className="h-4 w-4" /></>
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
  const pathname = window.location.pathname;
  const isDirectCheckIn = pathname === "/check-in";
  const isDirectOrder = pathname === "/qr";

  // QR scanners land here mid-scroll; always pin to top.
  useEffect(() => {
    window.scrollTo(0, 0);

    if (isDirectCheckIn) {
      setView("arrival");
      trackEvent("Yard QR Viewed", { route: "/check-in", initial_view: "arrival" });
      return;
    }

    if (isDirectOrder) {
      setView("order");
      trackEvent("Yard QR Viewed", { route: "/qr", initial_view: "order" });
      return;
    }

    // Honor deep link via hash: /qr#order or /qr#checkin
    const hash = window.location.hash.replace("#", "").toLowerCase();
    if (hash === "order") setView("order");
    else if (hash === "checkin" || hash === "walking-in") setView("checkin");
  }, [isDirectCheckIn, isDirectOrder]);

  useEffect(() => {
    trackEvent("Yard QR View Changed", {
      route: pathname,
      view,
    });
  }, [pathname, view]);

  // Sync view to hash so back-button behavior feels native
  useEffect(() => {
    if (isDirectCheckIn || isDirectOrder) return;

    const target = view === "welcome" ? " " : `#${view}`;
    if (window.location.hash !== target && !(view === "welcome" && !window.location.hash)) {
      try {
        window.history.replaceState(null, "", view === "welcome" ? window.location.pathname : target);
      } catch {}
    }
  }, [isDirectCheckIn, isDirectOrder, view]);

  return (
    <>
      <SEO
        title={isDirectCheckIn ? "I'm Here | Soil Seed & Water" : "Pay & Pick Up | Soil Seed & Water"}
        description={
          isDirectCheckIn
            ? "At the Phoenix yard? Notify a Soil Seed & Water representative, check in for an existing order, or order and pick up."
            : "Scan, order online, and pick up at the Phoenix yard. Dairy compost, worm castings, PlantPal nursery mix, Nature's Blanket Premium mulch."
        }
        keywords="pay and pickup soil, organic soil phoenix pickup, dairy compost pickup, worm castings pickup, plantpal pickup"
        canonical={isDirectCheckIn ? "https://organicsoilwholesale.com/check-in" : "https://organicsoilwholesale.com/qr"}
        robots="noindex, nofollow"
      />

      {view === "welcome" && (
        <WelcomeScreen
          onOrder={() => {
            trackEvent("Yard QR Action Clicked", { action: "order_pickup", view });
            setView("order");
          }}
          onCheckIn={() => {
            trackEvent("Yard QR Action Clicked", { action: "already_paid_check_in", view });
            setView("checkin");
          }}
        />
      )}
      {view === "arrival" && (
        <ArrivalScreen
          onHere={() => {
            trackEvent("Yard QR Action Clicked", { action: "im_here", view });
            setView("arrivalOptions");
          }}
          onProducts={() => {
            trackEvent("Yard QR Action Clicked", { action: "see_products", view });
            setView("order");
          }}
        />
      )}
      {view === "arrivalOptions" && (
        <ArrivalOptionsScreen
          onBack={() => setView("arrival")}
          onOrderCheckIn={() => {
            trackEvent("Yard QR Action Clicked", { action: "existing_order_check_in", view });
            setView("checkin");
          }}
          onNotifyRep={() => {
            trackEvent("Yard QR Action Clicked", { action: "notify_representative", view });
            setView("repNotify");
          }}
          onProducts={() => {
            trackEvent("Yard QR Action Clicked", { action: "see_products", view });
            setView("order");
          }}
        />
      )}
      {view === "repNotify" && (
        <RepNotifyPanel onBack={() => setView("arrivalOptions")} onProducts={() => setView("order")} />
      )}
      {view === "order" && <OrderView onBack={() => setView(isDirectCheckIn ? "arrivalOptions" : "welcome")} />}
      {view === "checkin" && <CheckInPanel onBack={() => setView(isDirectCheckIn ? "arrivalOptions" : "welcome")} />}
    </>
  );
}
