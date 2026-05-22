import { useMemo, useState } from "react";
import { Link } from "wouter";
import { useQuoteCart, type CartItem } from "@/contexts/QuoteCartContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OptimizedImage } from "@/components/OptimizedImage";
import { PickupSlotPicker, type PickupSelection } from "@/components/PickupSlotPicker";
import {
  ShoppingCart, Trash2, Minus, Plus, ArrowRight, Package,
  CreditCard, FileText, Loader2, CheckCircle2, ShoppingBag,
} from "lucide-react";

const fmt = (n: number): string => {
  if (n >= 1000) return n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
  return `$${n.toFixed(2)}`;
};

function LineItem({ item, removeItem, updateQuantity, closeDrawer }: {
  item: CartItem;
  removeItem: (id: number, fmt: string) => void;
  updateQuantity: (id: number, fmt: string, q: number) => void;
  closeDrawer: () => void;
}) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-3 shadow-sm">
      <div className="flex items-start gap-3">
        {item.imageUrl ? (
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-stone-100">
            <OptimizedImage src={item.imageUrl} alt={item.productName} className="h-full w-full object-cover" />
          </div>
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-400">
            <Package className="h-6 w-6" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <Link
              href={`/products/${item.productSlug}`}
              onClick={closeDrawer}
              className="text-sm font-semibold leading-tight text-stone-900 hover:text-[#264027]"
            >
              {item.productName}
            </Link>
            <button
              type="button"
              onClick={() => removeItem(item.productId, item.format)}
              className="rounded p-1 text-stone-400 hover:bg-red-50 hover:text-red-600"
              aria-label="Remove"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="mt-0.5 text-xs text-stone-500">{item.format}</p>
          <div className="mt-2 flex items-center justify-between">
            <div className="inline-flex items-center gap-0.5 rounded-lg border border-stone-200 bg-white p-0.5">
              <button
                type="button"
                onClick={() => updateQuantity(item.productId, item.format, item.quantity - 1)}
                disabled={item.quantity <= 1}
                className="h-7 w-7 rounded-md text-stone-700 hover:bg-stone-100 disabled:opacity-40"
              >
                <Minus className="mx-auto h-3 w-3" />
              </button>
              <span className="w-6 text-center text-xs font-bold">{item.quantity}</span>
              <button
                type="button"
                onClick={() => updateQuantity(item.productId, item.format, item.quantity + 1)}
                className="h-7 w-7 rounded-md text-stone-700 hover:bg-stone-100"
              >
                <Plus className="mx-auto h-3 w-3" />
              </button>
            </div>
            <p className="text-sm font-bold text-[#264027]">{fmt(item.unitPrice * item.quantity)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export const QuoteCartDrawer = () => {
  const { items, removeItem, updateQuantity, clearCart, totalItems, isDrawerOpen, closeDrawer } = useQuoteCart();

  // Split cart into pay-now items vs quote-request items
  const payItems = useMemo(() => items.filter((i) => i.mode === "pay"), [items]);
  const quoteItems = useMemo(() => items.filter((i) => i.mode !== "pay"), [items]);
  const payTotal = useMemo(() => payItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0), [payItems]);
  const quoteTotal = useMemo(() => quoteItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0), [quoteItems]);

  // Pay-flow customer + slot state
  const [slot, setSlot] = useState<PickupSelection | null>(null);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [customerCategory, setCustomerCategory] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReserveAndPay = async () => {
    setError(null);
    if (payItems.length === 0) return;
    if (!slot) { setError("Pick a pickup slot first."); return; }
    if (!name.trim() || !phone.trim()) { setError("Name and phone are required."); return; }
    if (!customerCategory) { setError("Choose the customer type that best fits you."); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/checkout/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: payItems.map((i) => ({
            productId: i.productId,
            name: i.productName,
            sizeOption: i.format,
            quantity: i.quantity,
            price: i.unitPrice,
            imageUrl: i.imageUrl,
          })),
          customerInfo: { name, company, customerCategory, email, phone, notes, marketingOptIn: true },
          pickupTime: slot.pickupAt,
          locationId: 1,
          isQuickOrder: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Checkout failed");
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (e: any) {
      setError(e?.message || "Could not start checkout");
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={isDrawerOpen} onOpenChange={(open) => !open && closeDrawer()}>
      <SheetContent side="right" className="w-[360px] sm:w-[460px] lg:w-[520px] flex flex-col bg-stone-50 overflow-y-auto">
        <SheetHeader className="pb-3 border-b border-stone-200">
          <SheetTitle className="flex items-center gap-2.5 text-stone-900">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#264027] text-white">
              <ShoppingCart className="h-4 w-4" />
            </span>
            <div className="flex flex-col items-start">
              <span className="text-base font-bold leading-none">Your Cart</span>
              <span className="mt-1 text-xs font-medium text-stone-500">
                {totalItems} {totalItems === 1 ? "item" : "items"}
              </span>
            </div>
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <Package className="mb-4 h-16 w-16 text-stone-300" />
            <p className="font-semibold text-stone-900">Your cart is empty</p>
            <p className="mt-1 text-sm text-stone-500">Browse products and add items to build your order.</p>
            <Button asChild className="mt-6" onClick={closeDrawer}>
              <Link href="/products">Browse Products</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto py-4">
              {/* Pay & pickup section */}
              {payItems.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#264027]">
                    <ShoppingBag className="h-3.5 w-3.5" />
                    Pay &amp; pick up
                    <span className="text-stone-400">·</span>
                    <span className="text-stone-500">{payItems.length} item{payItems.length !== 1 && "s"}</span>
                  </div>
                  {payItems.map((item) => (
                    <LineItem
                      key={`${item.productId}-${item.format}`}
                      item={item}
                      removeItem={removeItem}
                      updateQuantity={updateQuantity}
                      closeDrawer={closeDrawer}
                    />
                  ))}

                  {/* Slot + customer (only when there are pay items) */}
                  <div className="rounded-xl border border-stone-200 bg-white p-3.5 space-y-3">
                    <PickupSlotPicker value={slot} onChange={setSlot} />
                    <div className="space-y-2 pt-2 border-t border-stone-100">
                      <div>
                        <Label htmlFor="cart-name" className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">Name</Label>
                        <Input id="cart-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="mt-1 h-9" />
                      </div>
                      <div>
                        <Label htmlFor="cart-category" className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">Customer type</Label>
                        <select
                          id="cart-category"
                          value={customerCategory}
                          onChange={(e) => setCustomerCategory(e.target.value)}
                          className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          <option value="">Select one</option>
                          <option value="home-gardener">Home gardener</option>
                          <option value="farmer">Farmer / grower</option>
                          <option value="landscaper">Landscaper</option>
                          <option value="nursery">Nursery / greenhouse</option>
                          <option value="contractor">Contractor</option>
                          <option value="municipal-commercial">Municipal / commercial</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="cart-company" className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">Company or farm (optional)</Label>
                        <Input id="cart-company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Business, farm, or project name" className="mt-1 h-9" />
                      </div>
                      <div>
                        <Label htmlFor="cart-phone" className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">Phone</Label>
                        <Input id="cart-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 555-5555" className="mt-1 h-9" />
                      </div>
                      <div>
                        <Label htmlFor="cart-email" className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">Email (optional)</Label>
                        <Input id="cart-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" className="mt-1 h-9" />
                      </div>
                      <div>
                        <Label htmlFor="cart-notes" className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">Notes (optional)</Label>
                        <textarea
                          id="cart-notes"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Anything we should know about your pickup or project?"
                          className="mt-1 min-h-[68px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        />
                      </div>
                      <p className="rounded-lg bg-stone-50 p-2 text-[11px] leading-relaxed text-stone-600">
                        By submitting this information, you allow Soil Seed &amp; Water to contact you about your order and add you to our marketing contact list.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Quote-request section */}
              {quoteItems.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#7a5a2e]">
                    <FileText className="h-3.5 w-3.5" />
                    Request a quote
                    <span className="text-stone-400">·</span>
                    <span className="text-stone-500">{quoteItems.length} item{quoteItems.length !== 1 && "s"}</span>
                  </div>
                  {quoteItems.map((item) => (
                    <LineItem
                      key={`${item.productId}-${item.format}`}
                      item={item}
                      removeItem={removeItem}
                      updateQuantity={updateQuantity}
                      closeDrawer={closeDrawer}
                    />
                  ))}
                </div>
              )}

              {error && (
                <div className="rounded-xl bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">
                  {error}
                </div>
              )}
            </div>

            {/* Footer / actions */}
            <div className="space-y-3 border-t border-stone-200 pt-3">
              {payItems.length > 0 && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-stone-600">Pay today</span>
                    <span className="text-xl font-bold text-[#264027]">{fmt(payTotal)}</span>
                  </div>
                  <Button
                    size="lg"
                    onClick={handleReserveAndPay}
                    disabled={submitting}
                    className="h-14 w-full rounded-xl bg-[#264027] text-base font-bold shadow-lg shadow-[#264027]/20 hover:bg-[#1f3320]"
                  >
                    {submitting ? (
                      <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Starting checkout…</>
                    ) : (
                      <><CreditCard className="mr-2 h-5 w-5" /> Reserve pickup &amp; pay {fmt(payTotal)}</>
                    )}
                  </Button>
                  <p className="flex items-start gap-2 text-[11px] leading-relaxed text-stone-500">
                    <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600" />
                    Secure Stripe checkout. Order ready in the yard at your selected slot.
                  </p>
                </>
              )}

              {quoteItems.length > 0 && (
                <>
                  {payItems.length > 0 && <div className="my-3 border-t border-stone-200" />}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-stone-600">Quote estimate</span>
                    <span className="text-lg font-bold text-stone-700">{fmt(quoteTotal)}</span>
                  </div>
                  <Button asChild size="lg" className="h-12 w-full rounded-xl bg-stone-700 hover:bg-stone-800" onClick={closeDrawer}>
                    <Link href="/order">Submit quote request <ArrowRight className="ml-2 h-4 w-4" /></Link>
                  </Button>
                </>
              )}

              <div className="pt-1">
                <Button variant="ghost" size="sm" className="w-full text-stone-500 hover:text-red-600" onClick={clearCart}>
                  Clear all
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};
