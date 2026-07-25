import { useMemo, useState } from "react";
import { Phone, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useQuoteCart, type CartItem } from "@/contexts/QuoteCartContext";
import { cartFlatbedSpots, spotsForFormat } from "@/lib/flatbedSpots";
import { loadDeliveryDraft } from "@/lib/deliveryDraft";
import { trackEvent } from "@/lib/analytics";
import { useToast } from "@/hooks/use-toast";

type OrderCallbackDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Extra lines not yet flushed into cart state (e.g. just-added from PDP). */
  pendingItems?: CartItem[];
  sourceUrl?: string;
};

const money = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

function mergeItems(cart: CartItem[], pending: CartItem[] = []): CartItem[] {
  const out = [...cart];
  for (const item of pending) {
    const idx = out.findIndex(
      (i) => i.productId === item.productId && i.format === item.format,
    );
    if (idx >= 0) {
      out[idx] = {
        ...out[idx],
        quantity: out[idx].quantity + item.quantity,
      };
    } else {
      out.push(item);
    }
  }
  return out;
}

export function OrderCallbackDialog({
  open,
  onOpenChange,
  pendingItems = [],
  sourceUrl,
}: OrderCallbackDialogProps) {
  const { items, clearCart, closeDrawer } = useQuoteCart();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const orderItems = useMemo(
    () => mergeItems(items, pendingItems),
    [items, pendingItems],
  );
  const estimatedTotal = useMemo(
    () => orderItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
    [orderItems],
  );
  const flatbedSpots = useMemo(() => cartFlatbedSpots(orderItems), [orderItems]);
  const deliveryDraft = typeof window !== "undefined" ? loadDeliveryDraft() : null;

  const reset = () => {
    setName("");
    setPhone("");
    setEmail("");
    setNote("");
    setSubmitting(false);
    setDone(false);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      toast({
        title: "Name and phone required",
        description: "We’ll call you back about this order.",
        variant: "destructive",
      });
      return;
    }
    if (orderItems.length === 0) {
      toast({
        title: "Add items first",
        description: "Build your order, then request a callback.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    const lineItems = orderItems.map((item) => ({
      product_id: item.productId,
      product_name: item.productName,
      product_slug: item.productSlug,
      format: item.format,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      line_total: item.unitPrice * item.quantity,
      unit: item.unit,
      flatbed_spots: spotsForFormat(item.format, item.quantity),
      mode: item.mode ?? "pay",
    }));

    const payload = {
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      notes: note.trim() || undefined,
      lead_type: "order_callback",
      source: "osw_order_callback",
      source_url:
        sourceUrl ||
        (typeof window !== "undefined" ? window.location.href : undefined),
      order: {
        line_items: lineItems,
        item_count: orderItems.length,
        estimated_total: estimatedTotal,
        flatbed_spots: flatbedSpots,
        delivery_zip: deliveryDraft?.zip || undefined,
        delivery_fee: deliveryDraft?.quote?.costDollars,
        delivery_city: deliveryDraft?.city || undefined,
        delivery_state: deliveryDraft?.state || undefined,
      },
    };

    trackEvent("Order Callback Requested", {
      item_count: orderItems.length,
      estimated_total: estimatedTotal,
      flatbed_spots: flatbedSpots,
      has_delivery_zip: Boolean(deliveryDraft?.zip),
    });

    try {
      const res = await fetch("/api/leads/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Could not submit callback request");
      }
      setDone(true);
      clearCart();
      closeDrawer();
      toast({
        title: "We’ll call you",
        description: "A rep has your order details and will reach out soon.",
      });
    } catch (err) {
      toast({
        title: "Couldn’t send request",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#264027]">
            <Phone className="h-5 w-5" />
            Not sure? Call me
          </DialogTitle>
          <DialogDescription>
            No payment now. We’ll call you about this order with sizes, quantities,
            and delivery notes already attached.
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="space-y-4 py-2">
            <p className="text-sm font-semibold text-[#264027]">
              Request received — hang tight for a call.
            </p>
            <Button className="w-full" onClick={() => handleOpenChange(false)}>
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm">
              <p className="font-semibold text-stone-900">
                {orderItems.length} line{orderItems.length === 1 ? "" : "s"} ·{" "}
                {money(estimatedTotal)}
                {flatbedSpots > 0 ? ` · ${flatbedSpots} flatbed spots` : ""}
              </p>
              <ul className="mt-1.5 max-h-28 space-y-1 overflow-y-auto text-xs text-stone-600">
                {orderItems.map((item) => (
                  <li key={`${item.productId}-${item.format}`}>
                    {item.quantity}× {item.productName} — {item.format}
                  </li>
                ))}
              </ul>
              {deliveryDraft?.zip && (
                <p className="mt-1.5 text-xs text-stone-500">
                  Delivery ZIP {deliveryDraft.zip}
                  {deliveryDraft.quote?.costDollars != null
                    ? ` · est. delivery ${money(deliveryDraft.quote.costDollars)}`
                    : ""}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="callback-name">Name</Label>
              <Input
                id="callback-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="callback-phone">Phone</Label>
              <Input
                id="callback-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="callback-email">Email (optional)</Label>
              <Input
                id="callback-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="callback-note">Note (optional)</Label>
              <Textarea
                id="callback-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder="Best time to call, site access, etc."
              />
            </div>

            <Button
              type="submit"
              size="lg"
              className="h-12 w-full rounded-xl bg-[#264027] font-bold hover:bg-[#1f3320]"
              disabled={submitting || orderItems.length === 0}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  <Phone className="mr-2 h-4 w-4" />
                  Request callback
                </>
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
