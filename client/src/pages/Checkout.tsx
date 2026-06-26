import React, { useEffect, useMemo, useState } from "react";
import { useLocation, Link } from "wouter";
import { useQuoteCart } from "@/contexts/QuoteCartContext";
import SEO from "@/components/layout/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OptimizedImage } from "@/components/OptimizedImage";
import { PickupReadyTime, type PickupReadySelection } from "@/components/PickupReadyTime";
import { DeliveryQuoteWidget, type TruckingQuote } from "@/components/DeliveryQuoteWidget";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";
import { PICKUP_LOCATIONS } from "@shared/pickupSchedule.js";
import {
  ArrowLeft, CreditCard, Loader2, ShoppingBag, Tag, CheckCircle2, X, Package,
  Calendar, User as UserIcon, MapPin, Truck, ArrowRight,
} from "lucide-react";

const fmt = (n: number) => `$${n.toFixed(2)}`;

type Fulfillment = "pickup" | "delivery";
type CheckoutStep = "fulfillment" | "timing" | "customer" | "review";
type PickupSiteId = (typeof PICKUP_LOCATIONS)[number]["id"];

const DELIVERY_WINDOWS = [
  "Morning (8 AM - 12 PM)",
  "Afternoon (12 PM - 4 PM)",
  "Anytime during business hours",
  "Call to coordinate",
];

const Checkout: React.FC = () => {
  const [, navigate] = useLocation();
  const { items, removeItem, updateQuantity, clearCart } = useQuoteCart();

  const payItems = useMemo(() => items.filter((i) => i.mode === "pay"), [items]);
  const hasTruckloadItem = useMemo(
    () => payItems.some((item) => item.format.toLowerCase().includes("truckload")),
    [payItems]
  );

  // Fulfillment
  const [fulfillment, setFulfillment] = useState<Fulfillment>(() => hasTruckloadItem ? "delivery" : "pickup");
  const [pickupSiteId, setPickupSiteId] = useState<PickupSiteId>("phoenix");
  const selectedPickupSite = useMemo(
    () => PICKUP_LOCATIONS.find((loc) => loc.id === pickupSiteId) ?? PICKUP_LOCATIONS[0],
    [pickupSiteId],
  );

  // Pickup state (ASAP ready time — auto-computed)
  const [pickupReady, setPickupReady] = useState<PickupReadySelection | null>(null);

  // Delivery state
  const [deliveryAddress, setDeliveryAddress] = useState({ street: "", city: "", state: "AZ", zip: "" });
  const [deliveryQuote, setDeliveryQuote] = useState<TruckingQuote | null>(null);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryWindow, setDeliveryWindow] = useState("");
  const [roughAccess, setRoughAccess] = useState(false);
  // Default true: assume the customer has semi-truck access. They opt out
  // explicitly if they don't, which triggers an ops notification.
  const [semiAccess, setSemiAccess] = useState(true);

  // Customer
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [customerCategory, setCustomerCategory] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [activeStep, setActiveStep] = useState<CheckoutStep>("fulfillment");
  const [devModeLabel, setDevModeLabel] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/site-config")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.developerMode && data?.label) setDevModeLabel(data.label);
      })
      .catch(() => {});
  }, []);

  // Discount
  const [discountInput, setDiscountInput] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; percent: number } | null>(null);
  const [discountError, setDiscountError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (hasTruckloadItem && fulfillment !== "delivery") {
      setFulfillment("delivery");
    }
  }, [fulfillment, hasTruckloadItem]);

  // Items shaped for the DeliveryQuoteWidget (truck picker)
  const quoteItems = useMemo(
    () => payItems.map((i) => ({ sizeOption: i.format, quantity: i.quantity, unit: i.unit, productName: i.productName })),
    [payItems]
  );

  const productSubtotal = useMemo(
    () => payItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
    [payItems]
  );
  const deliveryFee = fulfillment === "delivery" && deliveryQuote ? deliveryQuote.costDollars : 0;
  const subtotal = productSubtotal + deliveryFee;
  const discountAmount = appliedDiscount ? subtotal * (appliedDiscount.percent / 100) : 0;
  const total = Math.max(0, subtotal - discountAmount);

  const applyDiscount = () => {
    setDiscountError(null);
    const code = discountInput.trim().toUpperCase();
    if (!code) {
      setDiscountError("Enter a code first");
      return;
    }
    if (code === "TEST") {
      setAppliedDiscount({ code: "TEST", percent: 100 });
      setDiscountInput("");
      return;
    }
    setDiscountError("That code isn't valid");
  };

  const removeDiscount = () => {
    setAppliedDiscount(null);
    setDiscountError(null);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    trackEvent("Checkout Submit Attempted", {
      fulfillment,
      item_count: payItems.length,
      product_subtotal: productSubtotal,
      delivery_fee: deliveryFee,
      total,
      step: activeStep,
    });

    if (payItems.length === 0) {
      setError("Your cart is empty");
      return;
    }
    if (fulfillment === "pickup" && !pickupReady) {
      setError("Confirm pickup ready time");
      setActiveStep("timing");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (fulfillment === "delivery") {
      if (!deliveryAddress.zip || !/^\d{5}$/.test(deliveryAddress.zip)) {
        setError("Enter a 5-digit delivery ZIP and get a price first");
        setActiveStep("timing");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      if (!deliveryQuote) {
        setError("Tap 'Get price' to lock in your delivery cost");
        setActiveStep("timing");
        return;
      }
      if (!deliveryAddress.street.trim() || !deliveryAddress.city.trim()) {
        setError("Street and city are required for delivery");
        setActiveStep("timing");
        return;
      }
    }
    if (!name.trim() || !phone.trim()) {
      setError("Name and phone are required");
      setActiveStep("customer");
      return;
    }
    if (!customerCategory) {
      setError("Choose the customer type that best fits you");
      setActiveStep("customer");
      return;
    }

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
            unit: i.unit,
            imageUrl: i.imageUrl,
          })),
          customerInfo: {
            name, company, customerCategory, email, phone, notes,
            marketingOptIn: true,
          },
          // Pickup-only fields
          pickupMode: fulfillment === "pickup" ? "asap" : null,
          pickupTime: fulfillment === "pickup" ? pickupReady?.readyAt : null,
          // Delivery-only fields
          fulfillmentType: fulfillment,
          deliveryAddress: fulfillment === "delivery"
            ? {
                street: deliveryAddress.street,
                city: deliveryAddress.city,
                state: deliveryAddress.state,
                zip: deliveryAddress.zip,
                roughAccess,
                semiAccess,
                originKey: deliveryQuote?.originYard,
                preferredDate: deliveryDate || null,
                preferredWindow: deliveryWindow || null,
              }
            : null,
          // Echo for audit; server re-quotes truly
          deliveryQuote: fulfillment === "delivery" ? deliveryQuote : null,
          locationId: fulfillment === "pickup" ? selectedPickupSite.locationId : 1,
          pickupLocation: fulfillment === "pickup"
            ? `${selectedPickupSite.name} — ${selectedPickupSite.addressLine}`
            : null,
          isQuickOrder: true,
          discountCode: appliedDiscount?.code || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Checkout failed");
      trackEvent("Checkout Session Created", {
        fulfillment,
        item_count: payItems.length,
        product_subtotal: productSubtotal,
        delivery_fee: deliveryFee,
        total,
        free_order: data.free === true,
      });

      localStorage.setItem(
        "lastOrder",
        JSON.stringify({
          orderId: data.orderId,
          confirmationCode: data.confirmationCode,
          items: payItems.length,
          pickupTime: fulfillment === "pickup" ? pickupReady?.readyAt : null,
          pickupReadyLabel: fulfillment === "pickup" ? pickupReady?.readyLabel : null,
          fulfillment,
          deliveryZip: fulfillment === "delivery" ? deliveryAddress.zip : null,
          deliveryDate: fulfillment === "delivery" ? deliveryDate || null : null,
          deliveryWindow: fulfillment === "delivery" ? deliveryWindow || null : null,
        })
      );

      if (data.free === true) {
        clearCart();
        navigate(`/order-confirmation?order_id=${data.orderId}`);
        return;
      }
      if (data.url) {
        window.location.assign(data.url);
        return;
      }
      throw new Error("No checkout URL returned");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout error");
      trackEvent("Checkout Session Failed", {
        fulfillment,
        item_count: payItems.length,
        reason: err instanceof Error ? err.message.slice(0, 80) : "Checkout error",
      });
      setSubmitting(false);
    }
  };

  // Delivery selected but no quote yet → gate the pay button.
  const deliveryQuoteMissing = fulfillment === "delivery" && !deliveryQuote;
  const payDisabled = submitting || deliveryQuoteMissing;

  if (payItems.length === 0) {
    return (
      <>
        <SEO title="Checkout" canonical="https://organicsoilwholesale.com/checkout" robots="noindex, nofollow" />
        <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardContent className="text-center py-12">
              <Package className="mx-auto mb-4 h-16 w-16 text-stone-300" />
              <h2 className="text-2xl font-bold mb-2">Nothing to check out</h2>
              <p className="text-stone-600 mb-6">
                Add a pay &amp; pickup product to your cart, then come back here.
              </p>
              <Button onClick={() => navigate("/products")} size="lg" className="min-h-[48px]">
                Browse products
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  const ctaLabel = deliveryQuoteMissing
    ? "Get delivery price first"
    : total === 0
      ? "Place free order"
      : `Pay ${fmt(total)}`;

  const timingComplete = fulfillment === "pickup"
    ? Boolean(pickupReady)
    : Boolean(
        deliveryQuote &&
        deliveryAddress.zip &&
        deliveryAddress.street.trim() &&
        deliveryAddress.city.trim()
      );
  const customerComplete = Boolean(name.trim() && phone.trim() && customerCategory);

  const stepMeta: Array<{ key: CheckoutStep; label: string; complete: boolean }> = [
    { key: "fulfillment", label: fulfillment === "pickup" ? selectedPickupSite.shortLabel : "Delivery", complete: true },
    { key: "timing", label: fulfillment === "pickup" ? "Ready" : "Address", complete: timingComplete },
    { key: "customer", label: "Details", complete: customerComplete },
    { key: "review", label: "Pay", complete: false },
  ];

  const stepIndex = stepMeta.findIndex((step) => step.key === activeStep);

  const goToTiming = () => {
    setError(null);
    setActiveStep("timing");
    trackEvent("Checkout Step Viewed", { step: "timing", fulfillment });
  };

  const goToCustomer = () => {
    setError(null);
    if (!timingComplete) {
      setError(
        fulfillment === "pickup"
          ? "Confirm pickup ready time"
          : "Finish delivery price and address first"
      );
      return;
    }
    setActiveStep("customer");
    trackEvent("Checkout Step Viewed", { step: "customer", fulfillment });
  };

  const goToReview = () => {
    setError(null);
    if (!customerComplete) {
      setError("Name, phone, and customer type are required");
      return;
    }
    setActiveStep("review");
    trackEvent("Checkout Step Viewed", { step: "review", fulfillment });
  };

  const sideCtaLabel =
    activeStep === "fulfillment" ? "Continue"
      : activeStep === "timing" ? (fulfillment === "pickup" ? "Confirm ready time" : "Confirm delivery")
        : activeStep === "customer" ? "Review and pay"
          : ctaLabel;
  const sideCtaDisabled =
    activeStep === "timing" ? !timingComplete
      : activeStep === "customer" ? !customerComplete
        : activeStep === "review" ? payDisabled
          : false;
  const sideCtaAction = () => {
    if (activeStep === "fulfillment") goToTiming();
    else if (activeStep === "timing") goToCustomer();
    else if (activeStep === "customer") goToReview();
  };
  const handleStepCtaClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (activeStep !== "review") {
      event.preventDefault();
      sideCtaAction();
    }
  };

  const goBack = () => {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    navigate("/products");
  };

  return (
    <>
      <SEO title="Checkout" canonical="https://organicsoilwholesale.com/checkout" robots="noindex, nofollow" />
      <div className="min-h-screen bg-[#f7f7f4] pb-28 lg:pb-8">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 border-b border-stone-200/80 bg-white/95 backdrop-blur">
        <div className="container mx-auto max-w-6xl px-3 py-3 sm:px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={goBack}
              className="h-10 min-h-[40px] rounded-full px-3 text-stone-700 touch-manipulation"
            >
              <ArrowLeft className="mr-1 h-5 w-5" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-stone-950 sm:text-3xl">Checkout</h1>
              <p className="hidden text-xs text-stone-500 sm:block">Confirm pickup or delivery, then pay securely.</p>
            </div>
            <div className="ml-auto inline-flex items-center gap-1 rounded-full bg-[#264027]/10 px-3 py-1.5 text-sm font-bold text-[#264027]">
              {payItems.length} item{payItems.length !== 1 && "s"}
            </div>
          </div>
        </div>
      </div>

      {devModeLabel && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-center text-sm font-medium text-amber-950">
          {devModeLabel}
        </div>
      )}

      <form onSubmit={onSubmit} className="container mx-auto max-w-6xl px-3 py-4 sm:px-4 sm:py-6 lg:px-6">
        <div className="grid gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8 xl:grid-cols-[minmax(0,1fr)_390px] xl:gap-10">
          <div className="min-w-0 space-y-4 sm:space-y-5 lg:order-1">
            <div className="rounded-2xl border border-stone-200/80 bg-white p-1.5 shadow-sm">
              <div className="grid grid-cols-4 gap-1">
                {stepMeta.map((step, index) => {
                  const isActive = step.key === activeStep;
                  const isComplete = step.complete && !isActive;
                  const canOpen = index <= stepIndex || step.complete || step.key === "fulfillment";

                  return (
                    <button
                      key={step.key}
                      type="button"
                      disabled={!canOpen}
                      aria-current={isActive ? "step" : undefined}
                      onClick={() => {
                        if (canOpen) {
                          setActiveStep(step.key);
                          setError(null);
                          trackEvent("Checkout Step Viewed", { step: step.key, fulfillment, source: "step_nav" });
                        }
                      }}
                      className={cn(
                        "group flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl px-2 text-xs font-extrabold transition-all touch-manipulation",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#264027]/35 focus-visible:ring-offset-1",
                        isActive
                          ? "bg-[#264027] text-white shadow-md shadow-[#264027]/20"
                          : isComplete
                            ? "bg-[#edf5ee] text-[#264027] hover:bg-[#e2efe4]"
                            : "bg-stone-50 text-stone-400 disabled:cursor-not-allowed disabled:opacity-75"
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-black transition",
                          isActive
                            ? "bg-white/18 text-white ring-1 ring-white/20"
                            : isComplete
                              ? "bg-[#264027] text-white"
                              : "bg-white text-stone-400 ring-1 ring-stone-200"
                        )}
                      >
                        {isComplete ? <CheckCircle2 className="h-3.5 w-3.5" /> : index + 1}
                      </span>
                      <span className="truncate">{step.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Fulfillment toggle — first decision the customer makes */}
            {activeStep === "fulfillment" && <Card className="overflow-hidden rounded-2xl border-stone-200 shadow-sm">
              <CardHeader className="px-4 pb-2 pt-4 sm:px-5">
                <CardTitle className="text-xl leading-tight sm:text-2xl">How do you want it?</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0 sm:px-5">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={hasTruckloadItem}
                    onClick={() => {
                      if (!hasTruckloadItem) {
                        setFulfillment("pickup");
                        trackEvent("Checkout Fulfillment Selected", { fulfillment: "pickup", has_truckload_item: hasTruckloadItem });
                      }
                    }}
                    className={cn(
                      "flex min-h-[74px] flex-col items-start justify-center gap-1 rounded-xl border px-3 py-3 text-left transition touch-manipulation",
                      fulfillment === "pickup"
                        ? "border-[#264027] bg-[#264027]/10 text-[#264027] shadow-[inset_0_0_0_1px_#264027]"
                        : hasTruckloadItem
                          ? "cursor-not-allowed border-stone-200 bg-stone-50 text-stone-400 opacity-70"
                          : "border-stone-200 bg-white text-stone-700 hover:border-stone-400"
                    )}
                  >
                    <div className="flex items-center gap-2 text-lg font-bold leading-none">
                      <MapPin className="h-4 w-4" />
                      Pickup
                    </div>
                    <span className="text-[11px] font-medium leading-tight text-stone-500">
                      {hasTruckloadItem ? "Truckload orders require delivery" : "Free · Phoenix or Congress"}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFulfillment("delivery");
                      trackEvent("Checkout Fulfillment Selected", { fulfillment: "delivery", has_truckload_item: hasTruckloadItem });
                    }}
                    className={cn(
                      "flex min-h-[74px] flex-col items-start justify-center gap-1 rounded-xl border px-3 py-3 text-left transition touch-manipulation",
                      fulfillment === "delivery"
                        ? "border-[#264027] bg-[#264027]/10 text-[#264027] shadow-[inset_0_0_0_1px_#264027]"
                        : "border-stone-200 bg-white text-stone-700 hover:border-stone-400"
                    )}
                  >
                    <div className="flex items-center gap-2 text-lg font-bold leading-none">
                      <Truck className="h-4 w-4" />
                      Delivery
                    </div>
                    <span className="text-[11px] font-medium text-stone-500">Quoted by ZIP</span>
                  </button>
                </div>
                {fulfillment === "pickup" && !hasTruckloadItem && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                      Pickup location
                    </p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {PICKUP_LOCATIONS.map((loc) => (
                        <button
                          key={loc.id}
                          type="button"
                          onClick={() => {
                            setPickupSiteId(loc.id);
                            trackEvent("Checkout Pickup Location Selected", {
                              pickup_site: loc.id,
                              location_id: loc.locationId,
                            });
                          }}
                          className={cn(
                            "flex min-h-[68px] flex-col items-start justify-center gap-0.5 rounded-xl border px-3 py-2.5 text-left transition touch-manipulation",
                            pickupSiteId === loc.id
                              ? "border-[#264027] bg-[#264027]/10 text-[#264027] shadow-[inset_0_0_0_1px_#264027]"
                              : "border-stone-200 bg-white text-stone-700 hover:border-stone-400",
                          )}
                        >
                          <span className="text-sm font-bold leading-tight">{loc.shortLabel}</span>
                          <span className="text-[11px] font-medium leading-snug text-stone-500">{loc.addressLine}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>}

            {/* Order summary */}
            {activeStep === "review" && <Card className="overflow-hidden rounded-2xl border-stone-200 shadow-sm">
              <CardHeader className="border-b border-[#264027]/10 bg-[#264027]/5 px-4 py-3 sm:px-5">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShoppingBag className="h-4 w-4 text-[#264027]" />
                  Review your order
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-4 sm:p-5">
                {payItems.map((item) => (
                  <div key={`${item.productId}-${item.format}`} className="rounded-xl bg-white">
                    <div className="grid grid-cols-[64px_1fr_auto] gap-3 sm:grid-cols-[72px_1fr_auto]">
                      {item.imageUrl ? (
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-stone-100 ring-1 ring-stone-200 sm:h-[72px] sm:w-[72px]">
                          <OptimizedImage src={item.imageUrl} alt={item.productName} className="h-full w-full object-contain p-1" />
                          {item.sizeImage && (
                            <div className="absolute -bottom-0.5 -right-0.5 h-7 w-7 overflow-hidden rounded-md bg-white ring-2 ring-white shadow-md">
                              <OptimizedImage src={item.sizeImage} alt={item.format} className="h-full w-full object-cover" />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-400 sm:h-[72px] sm:w-[72px]">
                          <Package className="h-5 w-5" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-base font-bold leading-tight text-stone-950">{item.productName}</p>
                        <p className="mt-0.5 text-sm leading-tight text-stone-500">{item.format}</p>
                        <p className="mt-1 text-xs text-stone-500">{fmt(item.unitPrice)} each</p>
                      </div>
                      <p className="whitespace-nowrap text-right text-base font-bold text-[#264027]">
                        {fmt(item.unitPrice * item.quantity)}
                      </p>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                        <div className="inline-flex items-center gap-0.5 rounded-xl border border-stone-200 bg-white p-1 shadow-sm">
                          <button
                            type="button"
                            onClick={() => {
                              updateQuantity(item.productId, item.format, item.quantity - 1);
                              trackEvent("Checkout Item Quantity Changed", {
                                product_id: item.productId,
                                format: item.format,
                                quantity: item.quantity - 1,
                              });
                            }}
                            disabled={item.quantity <= 1}
                            className="h-9 w-9 rounded-lg text-base font-bold text-stone-700 hover:bg-stone-100 disabled:opacity-40 touch-manipulation"
                            aria-label="Decrease quantity"
                          >−</button>
                          <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => {
                              updateQuantity(item.productId, item.format, item.quantity + 1);
                              trackEvent("Checkout Item Quantity Changed", {
                                product_id: item.productId,
                                format: item.format,
                                quantity: item.quantity + 1,
                              });
                            }}
                            className="h-9 w-9 rounded-lg text-base font-bold text-stone-700 hover:bg-stone-100 touch-manipulation"
                            aria-label="Increase quantity"
                          >+</button>
                          <button
                            type="button"
                            onClick={() => {
                              removeItem(item.productId, item.format);
                              trackEvent("Checkout Item Removed", { product_id: item.productId, format: item.format });
                            }}
                            className="ml-1 h-9 w-9 rounded-lg text-base text-stone-400 hover:bg-red-50 hover:text-red-600 touch-manipulation"
                            aria-label="Remove"
                          >×</button>
                        </div>
                        <Link href="/products" className="text-sm font-bold text-[#264027] underline-offset-2 hover:underline">
                          Add products
                        </Link>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>}

            {/* Pickup OR Delivery card */}
            {activeStep === "timing" && (fulfillment === "pickup" ? (
              <Card className="rounded-2xl border-stone-200 shadow-sm">
                <CardHeader className="px-4 py-3 sm:px-5">
                  <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
                    <Calendar className="h-4 w-4 text-[#b38a58]" />
                    When will your order be ready?
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-0 sm:px-5">
                  <p className="mb-3 flex items-start gap-2 rounded-lg bg-stone-50 px-3 py-2.5 text-sm leading-snug text-stone-600">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#264027]" />
                    <span>
                      Pickup at <span className="font-semibold text-stone-800">{selectedPickupSite.shortLabel}</span>
                      <span className="block text-xs text-stone-500">{selectedPickupSite.addressLine}</span>
                    </span>
                  </p>
                  <PickupReadyTime value={pickupReady} onChange={setPickupReady} />
                </CardContent>
              </Card>
            ) : (
              <Card className="overflow-hidden rounded-2xl border-stone-200 shadow-sm">
                <CardHeader className="px-4 py-3 sm:px-5">
                  <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
                    <Truck className="h-4 w-4 text-[#264027]" />
                    Get your delivery price
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 px-4 pb-4 pt-0 sm:px-5">
                  <DeliveryQuoteWidget
                    items={quoteItems}
                    initialZip={deliveryAddress.zip}
                    onQuote={(q, ctx) => {
                      setDeliveryQuote(q);
                      setRoughAccess(ctx.roughAccess);
                      setSemiAccess(ctx.semiAccess);
                      setDeliveryAddress((prev) => ({ ...prev, zip: ctx.zip }));
                    }}
                  />

                  {deliveryQuote && (
                    <div className="space-y-3 border-t border-stone-200 pt-3">
                      <div>
                        <Label htmlFor="d-street" className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                          Street address <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="d-street"
                          value={deliveryAddress.street}
                          onChange={(e) => setDeliveryAddress((p) => ({ ...p, street: e.target.value }))}
                          placeholder="1234 Project Rd"
                          autoComplete="address-line1"
                          className="mt-1 h-11 text-base"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="d-city" className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                            City <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="d-city"
                            value={deliveryAddress.city}
                            onChange={(e) => setDeliveryAddress((p) => ({ ...p, city: e.target.value }))}
                            placeholder="Phoenix"
                            autoComplete="address-level2"
                            className="mt-1 h-11 text-base"
                          />
                        </div>
                        <div>
                          <Label htmlFor="d-state" className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                            State
                          </Label>
                          <Input
                            id="d-state"
                            value={deliveryAddress.state}
                            onChange={(e) => setDeliveryAddress((p) => ({ ...p, state: e.target.value.toUpperCase().slice(0, 2) }))}
                            maxLength={2}
                            autoComplete="address-level1"
                            className="mt-1 h-11 text-base"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <Label htmlFor="d-date" className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                            Preferred delivery day <span className="text-stone-400 font-normal normal-case">(optional)</span>
                          </Label>
                          <Input
                            id="d-date"
                            type="date"
                            value={deliveryDate}
                            onChange={(e) => setDeliveryDate(e.target.value)}
                            min={new Date().toISOString().slice(0, 10)}
                            className="mt-1 h-11 text-base"
                          />
                        </div>
                        <div>
                          <Label htmlFor="d-window" className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                            Preferred delivery window <span className="text-stone-400 font-normal normal-case">(optional)</span>
                          </Label>
                          <select
                            id="d-window"
                            value={deliveryWindow}
                            onChange={(e) => setDeliveryWindow(e.target.value)}
                            className="mt-1 h-11 w-full rounded-md border border-input bg-background px-3 text-base"
                          >
                            <option value="">Select a window</option>
                            {DELIVERY_WINDOWS.map((windowLabel) => (
                              <option key={windowLabel} value={windowLabel}>
                                {windowLabel}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {/* Customer details */}
            {activeStep === "customer" && <Card className="overflow-hidden rounded-2xl border-stone-200 shadow-sm">
              <CardHeader className="border-b border-[#264027]/10 bg-[#264027]/5 px-4 py-3 sm:px-5">
                <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
                  <UserIcon className="h-4 w-4 text-[#b38a58]" />
                  Your details
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
                <div>
                  <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                    Name <span className="text-red-500">*</span>
                  </Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" autoComplete="name" className="mt-1 h-11 text-base" />
                </div>
                <div>
                  <Label htmlFor="phone" className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                    Phone <span className="text-red-500">*</span>
                  </Label>
                  <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(602) 555-0123" autoComplete="tel" inputMode="tel" className="mt-1 h-11 text-base" />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="category" className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                    Customer type <span className="text-red-500">*</span>
                  </Label>
                  <select id="category" value={customerCategory} onChange={(e) => setCustomerCategory(e.target.value)} className="mt-1 h-11 w-full rounded-md border border-input bg-background px-3 text-base">
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
                  <Label htmlFor="company" className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                    Company or farm <span className="text-stone-400 font-normal normal-case">(optional)</span>
                  </Label>
                  <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Business, farm, or project name" autoComplete="organization" className="mt-1 h-11 text-base" />
                </div>
                <div>
                  <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                    Email <span className="text-stone-400 font-normal normal-case">(optional)</span>
                  </Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" autoComplete="email" inputMode="email" className="mt-1 h-11 text-base" />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="notes" className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                    Notes <span className="text-stone-400 font-normal normal-case">(optional)</span>
                  </Label>
                  <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={fulfillment === "delivery" ? "Site access, gate codes, where to dump..." : "Anything we should know..."} className="mt-1 min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base" />
                </div>
                <p className="sm:col-span-2 rounded-lg bg-stone-50 px-3 py-2 text-[11px] leading-relaxed text-stone-500">
                  By continuing, you agree that Soil Seed &amp; Water can contact you about this order and related updates.
                </p>
              </CardContent>
            </Card>}
          </div>

          {/* SIDE COLUMN on desktop / inline on mobile */}
          <div className="min-w-0 space-y-4 lg:order-2 lg:sticky lg:top-20 lg:self-start">
            {activeStep !== "review" && (
            <Card className="overflow-hidden rounded-2xl border-stone-200 shadow-sm">
              <CardHeader className="border-b border-[#264027]/10 bg-[#264027]/5 px-4 py-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShoppingBag className="h-4 w-4 text-[#264027]" />
                  Order summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 px-4 pb-4 pt-6">
                {payItems.map((item) => (
                  <div key={`summary-${item.productId}-${item.format}`} className="grid grid-cols-[58px_1fr_auto] gap-3">
                    {item.imageUrl ? (
                      <div className="relative h-[58px] w-[58px] overflow-hidden rounded-lg bg-stone-100 ring-1 ring-stone-200">
                        <OptimizedImage src={item.imageUrl} alt={item.productName} className="h-full w-full object-contain p-1" />
                        {item.sizeImage && (
                          <div className="absolute -bottom-0.5 -right-0.5 h-7 w-7 overflow-hidden rounded-md bg-white ring-2 ring-white shadow-md">
                            <OptimizedImage src={item.sizeImage} alt={item.format} className="h-full w-full object-cover" />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex h-[58px] w-[58px] items-center justify-center rounded-lg bg-stone-100 text-stone-400">
                        <Package className="h-5 w-5" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-stone-950">{item.productName}</p>
                      <p className="mt-0.5 line-clamp-2 text-xs leading-tight text-stone-500">{item.format}</p>
                      <p className="mt-1 text-xs font-medium text-stone-500">Qty {item.quantity}</p>
                    </div>
                    <p className="whitespace-nowrap text-sm font-bold text-[#264027]">{fmt(item.unitPrice * item.quantity)}</p>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setActiveStep("review")}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm font-bold text-[#264027] hover:bg-stone-50"
                >
                  Edit item
                </button>
              </CardContent>
            </Card>
            )}

            {activeStep === "review" && (
            <Card className="overflow-hidden rounded-2xl border-stone-200 shadow-sm">
              <CardHeader className="border-b border-[#264027]/10 bg-white px-4 py-3 sm:px-5">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Tag className="h-4 w-4 text-[#b38a58]" />
                  Order total
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-4 sm:p-5">
                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-stone-600">
                    <span>Products</span>
                    <span>{fmt(productSubtotal)}</span>
                  </div>
                  {fulfillment === "delivery" && (
                    <div className={cn(
                      "flex items-center justify-between text-sm",
                      deliveryQuote ? "text-stone-600" : "text-stone-400 italic"
                    )}>
                      <span>Delivery {deliveryQuote && `· ${deliveryQuote.truckLabel.toLowerCase()}`}</span>
                      <span>{deliveryQuote ? fmt(deliveryFee) : "Enter ZIP →"}</span>
                    </div>
                  )}
                  {appliedDiscount && (
                    <div className="flex items-center justify-between text-sm font-medium text-emerald-700">
                      <span>Discount ({appliedDiscount.code})</span>
                      <span>−{fmt(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between border-t border-stone-200 pt-3 text-xl font-bold text-stone-950">
                    <span>Total</span>
                    <span>{fmt(total)}</span>
                  </div>
                </div>

                {appliedDiscount ? (
                  <div className="flex items-center justify-between rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
                      <CheckCircle2 className="h-4 w-4" />
                      Code {appliedDiscount.code} applied · −{appliedDiscount.percent}%
                    </div>
                    <button type="button" onClick={removeDiscount} className="rounded p-1 text-emerald-700 hover:bg-emerald-100" aria-label="Remove discount">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="discount" className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                      Discount code
                    </Label>
                    <div className="mt-1 flex gap-2">
                      <Input id="discount" value={discountInput} onChange={(e) => setDiscountInput(e.target.value)} placeholder="Enter code" className="flex-1 h-11 text-base" autoCapitalize="characters" />
                      <Button type="button" variant="outline" onClick={applyDiscount} className="h-11 px-4">
                        Apply
                      </Button>
                    </div>
                    {discountError && <p className="mt-1 text-xs text-red-600">{discountError}</p>}
                  </div>
                )}
              </CardContent>
            </Card>
            )}

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            {/* Desktop CTA */}
            <Button
              type={activeStep === "review" ? "submit" : "button"}
              onClick={handleStepCtaClick}
              size="lg"
              disabled={sideCtaDisabled}
              className={cn(
                "hidden h-14 w-full rounded-xl bg-[#264027] text-base font-bold shadow-lg shadow-[#264027]/20 hover:bg-[#1f3320] disabled:bg-stone-300 disabled:shadow-none lg:flex"
              )}
            >
              {submitting ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing…</>
              ) : activeStep !== "review" ? (
                <>{sideCtaLabel}<ArrowRight className="ml-2 h-4 w-4" /></>
              ) : deliveryQuoteMissing ? (
                <><Truck className="mr-2 h-5 w-5" /> {sideCtaLabel}</>
              ) : total === 0 ? (
                <><CheckCircle2 className="mr-2 h-5 w-5" /> {sideCtaLabel}</>
              ) : (
                <><CreditCard className="mr-2 h-5 w-5" /> {sideCtaLabel}</>
              )}
            </Button>

            <p className={cn(
              "text-center text-[11px] leading-relaxed text-stone-500",
              activeStep === "review" ? "block" : "hidden lg:block"
            )}>
              {total === 0
                ? "Order will be placed without payment."
                : fulfillment === "delivery"
                  ? "Secure Stripe checkout. We'll call to schedule delivery after payment."
                  : "Secure Stripe checkout. We'll have your order ready at the time shown above."}
            </p>
          </div>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-white/95 p-3 shadow-[0_-10px_30px_rgba(0,0,0,0.08)] backdrop-blur lg:hidden">
          <div className="mx-auto max-w-6xl">
            <Button
              type={activeStep === "review" ? "submit" : "button"}
              onClick={handleStepCtaClick}
              size="lg"
              disabled={sideCtaDisabled}
              className="h-14 w-full rounded-xl bg-[#264027] text-base font-bold shadow-lg shadow-[#264027]/20 hover:bg-[#1f3320] disabled:bg-stone-300 disabled:shadow-none"
            >
              {submitting ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing…</>
              ) : activeStep !== "review" ? (
                <>{sideCtaLabel}<ArrowRight className="ml-2 h-4 w-4" /></>
              ) : deliveryQuoteMissing ? (
                <><Truck className="mr-2 h-5 w-5" /> {sideCtaLabel}</>
              ) : total === 0 ? (
                <><CheckCircle2 className="mr-2 h-5 w-5" /> {sideCtaLabel}</>
              ) : (
                <><CreditCard className="mr-2 h-5 w-5" /> {sideCtaLabel}</>
              )}
            </Button>
          </div>
        </div>
      </form>
      </div>
    </>
  );
};

export default Checkout;
