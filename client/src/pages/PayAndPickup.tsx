import { useEffect, useState } from "react";
import SEO from "@/components/layout/SEO";
import { PayPickupGrid } from "@/components/PayPickupGrid";
import { Phone, FileText, MapPin, ArrowUpRight, CheckCircle2, Loader2, Truck } from "lucide-react";

const MOS_API_BASE = "https://myorganicsoil.com";

type CheckInResult =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "checked_in"; bay: number; order_number: string; customer_first_name: string; items: Array<{ product_name?: string; size_option?: string; quantity?: number }>; alreadyCheckedIn?: boolean }
  | { status: "no_order"; phone: string }
  | { status: "error"; message: string };

/** Yard check-in card. Phone in, bay number out. */
function CheckInPanel() {
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState<CheckInResult>({ status: "idle" });

  // Skip the form for 60 min after a successful check-in on this device
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
        }
      }
    } catch {}
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim()) return;
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
        setResult({ status: "no_order", phone });
      } else {
        setResult({ status: "error", message: data.error || "Could not check in. Try again." });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setResult({ status: "error", message });
    }
  }

  function reset() {
    try { localStorage.removeItem("ssw_checkin_v1"); } catch {}
    setResult({ status: "idle" });
    setPhone("");
  }

  if (result.status === "checked_in") {
    const itemsLabel = (result.items || []).slice(0, 3).map((i) => `${i.quantity || 1}× ${i.product_name || "item"}`).join(", ");
    return (
      <section className="bg-gradient-to-br from-green-900 via-green-800 to-green-900 py-10 text-white">
        <div className="container mx-auto px-4 text-center">
          <CheckCircle2 className="mx-auto h-16 w-16 text-green-300" strokeWidth={1.5} />
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.3em] text-green-200">
            {result.alreadyCheckedIn ? "You're already checked in" : "✓ Checked in"}
          </p>
          <h1 className="mt-3 text-5xl font-black tracking-tight sm:text-7xl">
            BAY <span className="text-green-300">{result.bay}</span>
          </h1>
          <p className="mt-3 text-lg font-semibold">
            {result.customer_first_name ? `Welcome back, ${result.customer_first_name}.` : "Welcome back."}
            {" "}Pull into Bay {result.bay} and stay in your truck.
          </p>
          {itemsLabel && (
            <p className="mt-2 text-sm text-green-200">
              Loading now: {itemsLabel}
            </p>
          )}
          {result.order_number && (
            <p className="mt-1 text-xs text-green-300/80">Order #{result.order_number}</p>
          )}
          <p className="mt-4 text-xs text-green-200/80">
            We'll text you when your truck is ready. Reply HELP if you need anything.
          </p>
          <button
            onClick={reset}
            className="mt-6 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold backdrop-blur hover:bg-white/20"
          >
            Not me? Check in someone else
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-gradient-to-br from-green-900 via-green-800 to-green-900 py-6 text-white">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-green-200">
            <Truck className="h-4 w-4" />
            Already paid? Check in here
          </div>
          <form onSubmit={submit} className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="Your phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={result.status === "loading"}
              className="flex-1 rounded-lg border-0 bg-white/95 px-4 py-3 text-base font-semibold text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-green-300"
            />
            <button
              type="submit"
              disabled={result.status === "loading" || !phone.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-500 px-5 py-3 text-base font-bold text-stone-900 transition hover:bg-green-400 disabled:opacity-50"
            >
              {result.status === "loading" ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Checking…</>
              ) : (
                "I'm here"
              )}
            </button>
          </form>
          {result.status === "no_order" && (
            <p className="mt-3 text-center text-sm text-amber-200">
              No active pickup found for that number. Browse the menu below to place a new order.
            </p>
          )}
          {result.status === "error" && (
            <p className="mt-3 text-center text-sm text-amber-200">{result.message}</p>
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
      <section className="bg-gradient-to-b from-stone-50 to-white py-6 md:py-10">
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
