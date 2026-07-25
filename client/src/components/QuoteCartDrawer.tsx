import { useMemo } from "react";
import { Link, useLocation } from "wouter";
import { useQuoteCart, type CartItem } from "@/contexts/QuoteCartContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { OptimizedImage } from "@/components/OptimizedImage";
import { FlatbedLoadMeter } from "@/components/FlatbedLoadMeter";
import { cartFlatbedSpots, fullLoadDiscountAmount } from "@/lib/flatbedSpots";
import { trackEvent } from "@/lib/analytics";
import {
  ShoppingCart, Trash2, Minus, Plus, ArrowRight, Package,
  CreditCard, FileText, ShoppingBag,
} from "lucide-react";

const fmt = (n: number): string => {
  if (n >= 1000) return n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
  return `$${n.toFixed(2)}`;
};

const CART_IMAGE_FALLBACKS: Record<number, string> = {
  1000: "/images/optimized/simons-gold-bag-context.jpg",
  1001: "/images/optimized/mikeys-worm-poop-bag-context.jpg",
  111: "/images/optimized/plantpal-with-veggies.jpg",
  3000: "/images/optimized/natures-blanket-bag-studio.jpg",
};

function LineItem({ item, removeItem, updateQuantity, closeDrawer }: {
  item: CartItem;
  removeItem: (id: number, fmt: string) => void;
  updateQuantity: (id: number, fmt: string, q: number) => void;
  closeDrawer: () => void;
}) {
  const imageUrl = item.imageUrl || CART_IMAGE_FALLBACKS[item.productId];

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-3 shadow-sm">
      <div className="flex items-start gap-3">
        {imageUrl ? (
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-stone-100 ring-1 ring-stone-200">
            <OptimizedImage src={imageUrl} alt={item.productName} className="h-full w-full object-contain bg-white p-1" width={120} q={60} />
            {item.sizeImage && (
              /* Size category photo overlay — bottom-right badge so the customer
                 sees both the product AND what size/format they picked. */
              <div className="absolute -bottom-0.5 -right-0.5 h-7 w-7 overflow-hidden rounded-md bg-white ring-2 ring-white shadow-md">
                <OptimizedImage src={item.sizeImage} alt={item.format} className="h-full w-full object-cover" />
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-400">
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
  const [, navigate] = useLocation();

  const payItems = useMemo(() => items.filter((i) => i.mode === "pay"), [items]);
  const quoteItems = useMemo(() => items.filter((i) => i.mode !== "pay"), [items]);
  const payGross = useMemo(() => payItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0), [payItems]);
  const flatbedSpots = useMemo(() => cartFlatbedSpots(items), [items]);
  const flatbedDiscount = useMemo(() => fullLoadDiscountAmount(payItems), [payItems]);
  const payTotal = payGross - flatbedDiscount;
  const quoteTotal = useMemo(() => quoteItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0), [quoteItems]);

  const goToCheckout = () => {
    trackEvent("Cart Checkout Clicked", {
      pay_items: payItems.length,
      quote_items: quoteItems.length,
      pay_total: payTotal,
    });
    closeDrawer();
    navigate("/checkout");
  };

  const goToQuote = () => {
    trackEvent("Cart Quote Clicked", {
      pay_items: payItems.length,
      quote_items: quoteItems.length,
      quote_total: quoteTotal,
    });
    closeDrawer();
    navigate("/order");
  };

  return (
    <Sheet open={isDrawerOpen} onOpenChange={(open) => !open && closeDrawer()}>
      <SheetContent side="right" className="w-[min(100vw,390px)] sm:w-[460px] flex flex-col bg-stone-50 overflow-y-auto pb-[calc(env(safe-area-inset-bottom)+16px)]">
        <SheetHeader className="pb-3 border-b border-stone-200">
          <SheetTitle className="flex items-center gap-2.5 text-stone-900">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#264027] text-white">
              <ShoppingCart className="h-4 w-4" />
            </span>
            <div className="flex flex-col items-start">
              <span className="text-base font-bold leading-none">Cart</span>
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
              {flatbedSpots > 0 && <FlatbedLoadMeter spots={flatbedSpots} compact />}

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
                </div>
              )}

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
            </div>

            {/* Footer: totals + CTAs only — no inline forms */}
            <div className="space-y-3 border-t border-stone-200 pt-3">
              {payItems.length > 0 && (
                <>
                  {flatbedDiscount > 0 && (
                    <div className="flex items-center justify-between text-sm text-emerald-800">
                      <span className="font-medium">Full flatbed (10% off)</span>
                      <span className="font-semibold">−{fmt(flatbedDiscount)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-stone-600">Pay today</span>
                    <span className="text-xl font-bold text-[#264027]">{fmt(payTotal)}</span>
                  </div>
                  <Button
                    size="lg"
                    onClick={goToCheckout}
                    className="h-14 w-full rounded-xl bg-[#264027] text-base font-bold shadow-lg shadow-[#264027]/20 hover:bg-[#1f3320]"
                  >
                    <CreditCard className="mr-2 h-5 w-5" />
                    Continue to Checkout
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <p className="text-center text-[11px] leading-relaxed text-stone-500">
                    Continue to choose pickup or delivery, then pay.
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
                  <Button
                    size="lg"
                    onClick={goToQuote}
                    className="h-12 w-full rounded-xl bg-stone-700 hover:bg-stone-800"
                  >
                    Submit quote request <ArrowRight className="ml-2 h-4 w-4" />
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
