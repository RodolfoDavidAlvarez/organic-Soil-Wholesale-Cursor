import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Truck, AlertCircle, CheckCircle2 } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

/** Server response from POST /api/quote/trucking */
export interface TruckingQuote {
  truck: "walking_floor" | "flatbed_moffett" | "hot_shot";
  truckLabel: string;
  originYard: "phoenix" | "congress";
  originLabel: string;
  milesRoundTrip: number;
  hoursRoundTrip: number;
  accessModifier: number;
  costCents: number;
  costDollars: number;
  split?: string | null;
  breakdown: {
    milesOneWay: number;
    hoursOneWay: number;
    hourlyRate: number;
    minFee: number;
    capacityLabel: string;
    loadCount?: number;
    destinationCity?: string | null;
    destinationState?: string | null;
  };
}

interface DeliveryQuoteWidgetProps {
  /** Cart items used to pick the right truck. Pass [{sizeOption, quantity}] */
  items: Array<{ sizeOption: string; quantity: number; unit?: string; productName?: string }>;
  /** Initial ZIP — pre-fill from saved customer profile if available */
  initialZip?: string;
  /**
   * Called every time we have a fresh quote OR the user clears it.
   * - `roughAccess`: hard-to-reach / off-pavement site flag (drives the +20% pricing modifier server-side)
   * - `semiAccess`: customer confirms they have enough space for a semi-truck.
   *   Defaults TRUE. If false, ops needs to call before dispatch.
   */
  onQuote: (
    quote: TruckingQuote | null,
    ctx: { zip: string; roughAccess: boolean; semiAccess: boolean },
  ) => void;
  /** Optional className for outer wrapper */
  className?: string;
}

const fmt$ = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export function DeliveryQuoteWidget({ items, initialZip = "", onQuote, className }: DeliveryQuoteWidgetProps) {
  const [zip, setZip] = useState(initialZip);
  const [roughAccess, setRoughAccess] = useState(false);
  // Pre-checked: assume customers have semi-truck access. If they uncheck it,
  // that's the operational red flag we need to know about before dispatching.
  const [semiAccess, setSemiAccess] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quote, setQuote] = useState<TruckingQuote | null>(null);

  const fetchQuote = useCallback(
    async (currentZip: string, currentRough: boolean, currentSemi: boolean) => {
      const cleanZip = (currentZip || "").trim();
      if (!/^\d{5}$/.test(cleanZip)) {
        setError("Enter a 5-digit ZIP");
        setQuote(null);
        onQuote(null, { zip: cleanZip, roughAccess: currentRough, semiAccess: currentSemi });
        trackEvent("Delivery Quote Failed", {
          reason: "invalid_zip",
          item_count: items.length,
          rough_access: currentRough,
          semi_access: currentSemi,
        });
        return;
      }
      if (items.length === 0) {
        setError("Add a product first");
        trackEvent("Delivery Quote Failed", {
          reason: "empty_cart",
          item_count: 0,
          rough_access: currentRough,
          semi_access: currentSemi,
        });
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/quote/trucking", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items, zip: cleanZip, roughAccess: currentRough }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Could not price delivery");
        setQuote(data);
        onQuote(data, { zip: cleanZip, roughAccess: currentRough, semiAccess: currentSemi });
        trackEvent("Delivery Quote Created", {
          truck: data.truck,
          origin_yard: data.originYard,
          miles_round_trip: data.milesRoundTrip,
          cost_dollars: data.costDollars,
          item_count: items.length,
          rough_access: currentRough,
          semi_access: currentSemi,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Could not price delivery";
        setError(msg);
        setQuote(null);
        onQuote(null, { zip: cleanZip, roughAccess: currentRough, semiAccess: currentSemi });
        trackEvent("Delivery Quote Failed", {
          reason: msg.slice(0, 80),
          item_count: items.length,
          rough_access: currentRough,
          semi_access: currentSemi,
        });
      } finally {
        setLoading(false);
      }
    },
    [items, onQuote]
  );

  const handleGetPrice = () => fetchQuote(zip, roughAccess, semiAccess);

  const handleRoughToggle = (checked: boolean) => {
    setRoughAccess(checked);
    // If we already have a quote for this ZIP, re-fetch with the new modifier
    if (quote) fetchQuote(zip, checked, semiAccess);
  };

  const handleSemiToggle = (checked: boolean) => {
    setSemiAccess(checked);
    // Semi access doesn't change pricing — only re-notifies parent so the
    // flag flows into the order notes for the ops team.
    if (quote) onQuote(quote, { zip, roughAccess, semiAccess: checked });
  };

  // Allow Enter in the ZIP field to fetch a quote without bubbling up to the
  // parent <form> (the widget is embedded inside Checkout's main form).
  const handleZipKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleGetPrice();
    }
  };

  return (
    <div className={className}>
      <div className="space-y-3">
        <div>
          <Label htmlFor="delivery-zip" className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Delivery ZIP <span className="text-red-500">*</span>
          </Label>
          <div className="mt-1 flex gap-2">
            <Input
              id="delivery-zip"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={5}
              value={zip}
              onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
              onKeyDown={handleZipKeyDown}
              placeholder="85308"
              className="flex-1 h-11 text-base"
              autoComplete="postal-code"
            />
            <Button
              type="button"
              onClick={handleGetPrice}
              disabled={loading || zip.length !== 5}
              className="h-11 px-4"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Get price"}
            </Button>
          </div>
        </div>

        {/* Pre-checked positive question: we assume semi access by default.
            Customer un-ticking it is the operational flag we need. */}
        <label className="flex items-start gap-2 cursor-pointer text-sm text-stone-700">
          <input
            type="checkbox"
            checked={semiAccess}
            onChange={(e) => handleSemiToggle(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-stone-300"
          />
          <span className="leading-snug">
            I have enough space at my site for a semi-truck to deliver and unload.
            <span className="block text-[11px] text-stone-500 mt-0.5">
              Uncheck if you're not sure — we'll call you to confirm before we dispatch.
            </span>
          </span>
        </label>

        {!semiAccess && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-900">
            Got it. We'll call you before scheduling to confirm access and figure out the best way in.
          </div>
        )}

        {/* Soft, no-price-anchor wording — customers were avoiding the box when
            it was labeled "(+20%)". The pricing modifier still applies server-side
            and shows up in the refreshed quote. */}
        <label className="flex items-start gap-2 cursor-pointer text-sm text-stone-700">
          <input
            type="checkbox"
            checked={roughAccess}
            onChange={(e) => handleRoughToggle(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-stone-300"
          />
          <span className="leading-snug">
            My site is hard to reach or off-pavement.
            <span className="block text-[11px] text-stone-500 mt-0.5">
              Narrow driveway, dirt road, steep grade, or no truck turnaround.
            </span>
          </span>
        </label>
      </div>

      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {quote && !error && (
        <div className="mt-3 rounded-xl bg-stone-50 border border-stone-200 p-3 sm:p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2 min-w-0">
              <Truck className="h-5 w-5 text-[#264027] mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-bold text-stone-900">{quote.truckLabel}</p>
                <p className="mt-0.5 text-xs text-stone-600">
                  From {quote.originLabel} → {quote.breakdown.destinationCity ?? `ZIP ${zip}`}{quote.breakdown.destinationState ? `, ${quote.breakdown.destinationState}` : ""}
                </p>
                <p className="text-xs text-stone-600">
                  ~{quote.milesRoundTrip} mi round-trip · ~{quote.hoursRoundTrip} hr
                </p>
                {quote.breakdown.loadCount && quote.breakdown.loadCount > 1 ? (
                  <p className="text-xs font-semibold text-[#264027]">
                    {quote.breakdown.loadCount} delivery loads included
                  </p>
                ) : null}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Delivery</p>
              <p className="text-xl font-bold text-[#264027]">{fmt$(quote.costDollars)}</p>
            </div>
          </div>
          {quote.split === "mixed" && (
            <p className="mt-2 flex items-start gap-1.5 text-[11px] text-stone-600">
              <CheckCircle2 className="h-3 w-3 mt-0.5 shrink-0 text-emerald-700" />
              Your order mixes bulk and pallets — we'll split it across two trips. We'll confirm before dispatch.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default DeliveryQuoteWidget;
