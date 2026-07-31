import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { QRCodeSVG } from "qrcode.react";
import { Check, Clock, MapPin, Phone, Loader2, ChevronRight } from "lucide-react";

type VoiceOrder = {
  id: number;
  orderNumber: string;
  customerName: string | null;
  totalDollars: number;
  items: Array<{
    product_name: string;
    format: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  pickupAt: string | null;
  pickupLocation: string | null;
  status: string;
  isCoordinated: boolean;
  createdAt: string;
};

const PICKUP_ADDRESS = {
  street: "18980 Stanton Rd",
  city: "Congress, AZ 85332",
  entry: "Congress Processing Plant, check in at the scale",
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function formatPickup(iso: string | null) {
  if (!iso) return null;
  const date = new Date(iso);
  if (isNaN(date.getTime())) return null;
  return date.toLocaleString("en-US", {
    timeZone: "America/Phoenix",
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function VoiceReceipt() {
  const [, navigate] = useLocation();
  const [order, setOrder] = useState<VoiceOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get("order_id");
    if (!orderId) {
      setError("Missing order ID.");
      setLoading(false);
      return;
    }
    fetch(`/api/voice-agent/order/${orderId}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error || "Could not load receipt.");
        }
        return res.json();
      })
      .then((data: VoiceOrder) => {
        setOrder(data);
        setLoading(false);
      })
      .catch((err: any) => {
        setError(err?.message || "Could not load receipt.");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto flex min-h-[80vh] max-w-md flex-col items-center justify-center px-6 text-center">
        <p className="mb-4 text-stone-700">{error || "Receipt not found."}</p>
        <button
          onClick={() => navigate("/")}
          className="rounded-full bg-emerald-700 px-5 py-2 text-sm font-medium text-white"
        >
          Back home
        </button>
      </div>
    );
  }

  const pickupLabel = formatPickup(order.pickupAt);
  const receiptUrl = `${window.location.origin}/voice-receipt?order_id=${order.id}`;
  const isPaid = order.status === "paid";

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-100 via-stone-50 to-white pb-16">
      <div className="mx-auto max-w-md px-4 pt-8">
        {/* Status header */}
        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-stone-950 to-emerald-900 p-6 text-white shadow-2xl shadow-emerald-900/20">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 ring-1 ring-emerald-400/30">
              {isPaid ? <Check className="h-6 w-6 text-emerald-300" /> : <Loader2 className="h-5 w-5 animate-spin text-emerald-300" />}
            </div>
            <div className="flex-1">
              <div className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-300/80">
                {isPaid ? "Paid" : "Processing"}
              </div>
              <div className="text-xl font-semibold tracking-tight">Order {order.orderNumber}</div>
            </div>
          </div>
          {order.customerName && (
            <div className="mt-4 text-sm text-emerald-100/80">For {order.customerName}</div>
          )}
        </div>

        {/* QR card */}
        <div className="mt-4 rounded-3xl bg-white p-6 shadow-lg ring-1 ring-stone-200">
          <div className="text-center">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
              Show at pickup
            </div>
            <div className="mt-3 inline-block rounded-2xl bg-white p-3 ring-1 ring-stone-200">
              <QRCodeSVG
                value={receiptUrl}
                size={180}
                level="M"
                bgColor="#ffffff"
                fgColor="#0c1a14"
                includeMargin={false}
              />
            </div>
            <div className="mt-3 text-xs text-stone-500">
              Our team will scan this when you arrive.
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="mt-4 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-stone-200">
          <div className="border-b border-stone-100 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
            Items
          </div>
          <ul className="divide-y divide-stone-100">
            {order.items.map((item, idx) => (
              <li key={idx} className="flex items-start justify-between gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-stone-900">{item.product_name}</div>
                  <div className="text-xs text-stone-500">
                    {item.format} · {item.quantity} × {formatCurrency(item.unit_price)}
                  </div>
                </div>
                <div className="shrink-0 text-sm font-semibold tabular-nums text-stone-900">
                  {formatCurrency(item.total_price)}
                </div>
              </li>
            ))}
          </ul>
          <div className="flex items-baseline justify-between border-t border-stone-100 bg-stone-50 px-5 py-4">
            <span className="text-sm font-medium text-stone-700">Total</span>
            <span className="text-2xl font-bold tabular-nums text-stone-900">
              {formatCurrency(order.totalDollars)}
            </span>
          </div>
        </div>

        {/* Pickup details */}
        <div className="mt-4 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-stone-200">
          <div className="border-b border-stone-100 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
            Pickup
          </div>
          <div className="space-y-3 px-5 py-4 text-sm">
            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
              <div>
                <div className="font-medium text-stone-900">
                  {order.isCoordinated ? "Pickup time to be coordinated" : pickupLabel || "Time to be confirmed"}
                </div>
                {order.isCoordinated && (
                  <div className="text-xs text-stone-500">Our team will reach out about a pickup window.</div>
                )}
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
              <div>
                <div className="font-medium text-stone-900">{PICKUP_ADDRESS.street}</div>
                <div className="text-stone-700">{PICKUP_ADDRESS.city}</div>
                <div className="mt-1 text-xs text-stone-500">{PICKUP_ADDRESS.entry}</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
              <a href="tel:6232633386" className="font-medium text-emerald-800 hover:underline">
                (623) 263-3386
              </a>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 space-y-2">
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${PICKUP_ADDRESS.street}, ${PICKUP_ADDRESS.city}`)}`}
            target="_blank"
            rel="noreferrer"
            className="flex w-full items-center justify-between rounded-2xl bg-stone-900 px-5 py-3.5 text-sm font-medium text-white transition-all hover:bg-stone-800"
          >
            <span>Get directions</span>
            <ChevronRight className="h-4 w-4" />
          </a>
          <button
            onClick={() => navigate("/")}
            className="block w-full rounded-2xl bg-white px-5 py-3.5 text-sm font-medium text-stone-700 ring-1 ring-stone-200 transition-all hover:bg-stone-50"
          >
            Back to OSW
          </button>
        </div>
      </div>
    </div>
  );
}
