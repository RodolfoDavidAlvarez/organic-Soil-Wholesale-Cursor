import { Minus, Plus, X, User, Phone, Mail, Clock, AlertCircle } from "lucide-react";
import type { VoiceCartSummary } from "@/hooks/useElevenLabsAgent";

type Props = {
  cart: VoiceCartSummary | null;
  onAdjustQuantity?: (productId: number, format: string, nextQuantity: number) => void;
  onRemoveItem?: (productId: number, format: string) => void;
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
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function VoiceAgentCartPreview({ cart, onAdjustQuantity, onRemoveItem }: Props) {
  if (!cart) return null;
  const hasItems = cart.items.length > 0;
  const hasCustomer = !!(cart.customer.name || cart.customer.phone || cart.customer.email);
  const isCoordinated = cart.pickupKind === "coordinated";
  const pickupLabel = isCoordinated ? "Pickup time to be coordinated" : formatPickup(cart.pickupAt);

  if (!hasItems && !hasCustomer) return null;

  return (
    <div className="flex h-full min-w-0 flex-col overflow-hidden bg-gradient-to-b from-stone-50 to-stone-100/50">
      <div className="flex shrink-0 items-baseline justify-between px-4 pt-3 pb-1">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
          Your order
        </span>
        {hasItems && (
          <span className="text-xs font-medium text-stone-500">
            {cart.totalItems} {cart.totalItems === 1 ? "bag" : "bags"}
          </span>
        )}
      </div>

      {hasItems && (
        <ul className="min-w-0 flex-1 divide-y divide-stone-200/70 overflow-y-auto px-2">
          {cart.items.map((item) => (
            <li
              key={`${item.productId}-${item.format}`}
              className="flex min-w-0 items-center gap-2 px-2 py-2.5 text-sm transition-colors animate-in fade-in slide-in-from-bottom-1 duration-200 hover:bg-white/60"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-semibold text-stone-900">{item.productName}</div>
                <div className="truncate text-[11px] text-stone-500">
                  {item.format} · {formatCurrency(item.unitPrice)}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-0.5 rounded-full border border-stone-200 bg-white px-1 py-0.5 shadow-sm">
                <button
                  type="button"
                  onClick={() => onAdjustQuantity?.(item.productId, item.format, Math.max(0, item.quantity - 1))}
                  className="flex h-6 w-6 items-center justify-center rounded-full text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="min-w-[1.25rem] text-center text-sm font-bold tabular-nums text-stone-900">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => onAdjustQuantity?.(item.productId, item.format, item.quantity + 1)}
                  className="flex h-6 w-6 items-center justify-center rounded-full text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900"
                  aria-label="Increase quantity"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="w-14 shrink-0 text-right text-[13px] font-semibold tabular-nums text-stone-900">
                {formatCurrency(item.unitPrice * item.quantity)}
              </div>
              <button
                type="button"
                onClick={() => onRemoveItem?.(item.productId, item.format)}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-red-50 hover:text-red-600"
                aria-label="Remove item"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {(hasCustomer || pickupLabel || cart.isLargeOrder) && (
        <div className="mx-3 mb-2 mt-1 flex shrink-0 flex-wrap gap-1.5 overflow-hidden rounded-xl bg-white/70 p-2.5 ring-1 ring-stone-200/60 backdrop-blur-sm">
          {cart.customer.name && (
            <Chip icon={<User className="h-3 w-3" />} label={cart.customer.name} />
          )}
          {cart.customer.phone && (
            <Chip icon={<Phone className="h-3 w-3" />} label={cart.customer.phone} />
          )}
          {cart.customer.email && (
            <Chip icon={<Mail className="h-3 w-3" />} label={cart.customer.email} />
          )}
          {pickupLabel && (
            <Chip icon={<Clock className="h-3 w-3" />} label={pickupLabel} accent />
          )}
          {cart.isLargeOrder && !isCoordinated && (
            <div className="mt-1 flex w-full items-start gap-2 rounded-lg bg-amber-50 px-2 py-1.5 text-[11px] text-amber-900 ring-1 ring-amber-200">
              <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
              <span>Large order — pickup may need coordination.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Chip({ icon, label, accent }: { icon: React.ReactNode; label: string; accent?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium animate-in fade-in slide-in-from-left-1 duration-200 ${
        accent
          ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200"
          : "bg-stone-100 text-stone-700 ring-1 ring-stone-200"
      }`}
    >
      {icon}
      {label}
    </span>
  );
}
