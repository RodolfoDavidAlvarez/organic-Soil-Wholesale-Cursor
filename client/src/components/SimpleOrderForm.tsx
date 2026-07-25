import React, { useMemo, useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Trash2, ShoppingBag, Plus } from "lucide-react";
import { useQuoteCart } from "@/contexts/QuoteCartContext";
import { trackEvent, trackEcommerceEvent } from "@/lib/analytics";
import { CUSTOMER_SUPPORT_PHONE_DISPLAY, CUSTOMER_SUPPORT_PHONE_TEL } from "@/config/contact";
import { HOURS_LABEL } from "@shared/pickupSchedule.js";

const fmt = (n: number): string => {
  if (n >= 1000) return n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
  return `$${n.toFixed(2)}`;
};

interface LeadInfo {
  name: string;
  email: string;
  phone: string;
  customer_category: string;
  company: string;
  notes: string;
  preferred_date: string;
}

type ProductOption = {
  id: number;
  label: string;
};

type ProductRow = {
  id: string;
  productId: string;
  note: string;
};

const fetchProductOptions = async (): Promise<ProductOption[]> => {
  const response = await fetch("/api/public/products");
  if (!response.ok) throw new Error("Failed to load products");
  const body = await response.json();
  const records = Array.isArray(body) ? body : Array.isArray(body?.products) ? body.products : [];

  return records
    .filter((product: any) => product && product.isHidden !== true && product.is_hidden !== true)
    .map((product: any) => ({
      id: Number(product.id),
      label: product.displayTitle || product.display_title || product.productType || product.product_type || product.name || "Product",
    }))
    .filter((product: ProductOption) => Number.isFinite(product.id))
    .sort((a: ProductOption, b: ProductOption) => a.label.localeCompare(b.label));
};

export const SimpleOrderForm: React.FC = () => {
  const { toast } = useToast();
  const { items, removeItem, clearCart, totalPrice } = useQuoteCart();
  const searchParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const preselectedProductId = searchParams.get("productId") || "";
  const preselectedProductName = searchParams.get("product") || "";

  const [leadInfo, setLeadInfo] = useState<LeadInfo>({
    name: "",
    email: "",
    phone: "",
    customer_category: "",
    company: "",
    notes: "",
    preferred_date: "",
  });

  const [productRows, setProductRows] = useState<ProductRow[]>([
    { id: crypto.randomUUID(), productId: preselectedProductId, note: "" },
  ]);

  const { data: productOptions = [] } = useQuery({
    queryKey: ["quoteProductOptions"],
    queryFn: fetchProductOptions,
    staleTime: 60 * 1000,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);

  const productLabelById = useMemo(() => {
    const labels = new Map(productOptions.map((product) => [String(product.id), product.label]));
    if (preselectedProductId && preselectedProductName && !labels.has(preselectedProductId)) {
      labels.set(preselectedProductId, preselectedProductName);
    }
    return labels;
  }, [preselectedProductId, preselectedProductName, productOptions]);

  const selectedProducts = productRows
    .map((row) => ({
      ...row,
      label: productLabelById.get(row.productId) || "",
    }))
    .filter((row) => row.productId && row.label);

  const validateForm = (): string[] => {
    const errors: string[] = [];
    if (!leadInfo.name.trim()) errors.push("Name is required");
    if (!leadInfo.email.trim()) errors.push("Email is required");
    if (!leadInfo.phone.trim()) errors.push("Phone number is required");
    if (!leadInfo.customer_category) errors.push("Customer type is required");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (leadInfo.email && !emailRegex.test(leadInfo.email)) {
      errors.push("Please enter a valid email address");
    }
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validateForm();
    if (errors.length > 0) {
      errors.forEach((error) => {
        toast({ title: "Validation Error", description: error, variant: "destructive" });
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Build notes with selected quote products and cart items
      let fullNotes = leadInfo.notes;
      const customerSummary = [
        `Customer type: ${leadInfo.customer_category}`,
        leadInfo.company.trim() ? `Company / farm: ${leadInfo.company.trim()}` : "",
        "Marketing contact permission: Yes",
      ].filter(Boolean).join("\n");
      fullNotes = `--- CUSTOMER INFO ---\n${customerSummary}\n--- END CUSTOMER INFO ---\n\n${fullNotes}`.trim();
      if (selectedProducts.length > 0) {
        const productSummary = selectedProducts
          .map((row, index) => `${index + 1}. ${row.label}${row.note.trim() ? ` — ${row.note.trim()}` : ""}`)
          .join("\n");
        fullNotes = `--- PRODUCTS REQUESTED ---\n${productSummary}\n--- END PRODUCTS ---\n\n${fullNotes}`.trim();
      }

      if (items.length > 0) {
        const cartSummary = items
          .map((item) => `${item.quantity}x ${item.format} — ${item.productName} (${fmt(item.unitPrice * item.quantity)})`)
          .join("\n");
        fullNotes = `--- QUOTE CART ---\n${cartSummary}\nEstimated Total: ${fmt(totalPrice)}\n--- END CART ---\n\n${fullNotes}`.trim();
      }

      const response = await fetch("/api/leads/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...leadInfo, marketing_opt_in: true, notes: fullNotes, preferred_date: leadInfo.preferred_date || null }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to submit form");

      clearCart();
      setShowThankYou(true);
      trackEvent("Quote Request Submitted", { source: "order_page", product_count: productRows.length });
      trackEcommerceEvent("generate_lead", {
        lead_type: "quote_form",
        source: "order_page",
        pickup_sales_channel: "osw_yard",
      });
      toast({ title: "Quote Request Submitted", description: "We'll contact you shortly with pricing." });
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setLeadInfo({ name: "", email: "", phone: "", customer_category: "", company: "", notes: "", preferred_date: "" });
    setProductRows([{ id: crypto.randomUUID(), productId: "", note: "" }]);
    setShowThankYou(false);
  };

  if (showThankYou) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center space-y-6">
        <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
        <h2 className="text-2xl font-bold text-gray-900">Quote Request Received!</h2>
        <p className="text-gray-600">
          We've received your quote request and will contact you shortly with pricing and availability.
        </p>
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Reference: #{Date.now().toString().slice(-6)}</p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button asChild className="bg-green-600 hover:bg-green-700">
              <Link href="/products">Browse pickup products</Link>
            </Button>
            <Button asChild variant="outline">
              <a href={CUSTOMER_SUPPORT_PHONE_TEL}>Need it today? Call {CUSTOMER_SUPPORT_PHONE_DISPLAY}</a>
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            Same-day pickup at our Congress, AZ plant, {HOURS_LABEL}.
          </p>
          <Button onClick={resetForm} variant="ghost" className="text-gray-500">
            Submit Another Request
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-4 sm:p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Request a Quote</h1>
        <p className="text-sm text-muted-foreground">
          {items.length > 0
            ? "Review your selections and submit your contact info."
            : "Tell us what you need and we'll get back to you with pricing."}
        </p>
      </div>

      <Card className="p-4 sm:p-5 border-2 border-primary/15">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-primary" />
            Products to Quote
          </h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-[40px] touch-manipulation"
            onClick={() => setProductRows((rows) => [...rows, { id: crypto.randomUUID(), productId: "", note: "" }])}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add
          </Button>
        </div>

        <div className="space-y-3">
          {productRows.map((row, index) => (
            <div key={row.id} className="rounded-xl border bg-white p-3">
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <Label htmlFor={`product-${row.id}`} className="sr-only">Product {index + 1}</Label>
                  <select
                    id={`product-${row.id}`}
                    value={row.productId}
                    onChange={(event) => {
                      const productId = event.target.value;
                      setProductRows((rows) => rows.map((item) => item.id === row.id ? { ...item, productId } : item));
                    }}
                    className="min-h-[44px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <option value="">Select a product</option>
                    {preselectedProductId && preselectedProductName && !productOptions.some((product) => String(product.id) === preselectedProductId) && (
                      <option value={preselectedProductId}>{preselectedProductName}</option>
                    )}
                    {productOptions.map((product) => (
                      <option key={product.id} value={product.id}>{product.label}</option>
                    ))}
                  </select>
                </div>
                {productRows.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setProductRows((rows) => rows.filter((item) => item.id !== row.id))}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Remove product"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Input
                value={row.note}
                onChange={(event) => {
                  const note = event.target.value;
                  setProductRows((rows) => rows.map((item) => item.id === row.id ? { ...item, note } : item));
                }}
                placeholder="Quantity, size, pickup/delivery notes"
                className="mt-2 min-h-[44px]"
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Cart Items */}
      {items.length > 0 && (
        <Card className="p-4 sm:p-5 border-2 border-primary/15">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-primary" />
              Your Products ({items.length})
            </h2>
          </div>
          <div className="space-y-2.5">
            {items.map((item) => (
              <div key={`${item.productId}-${item.format}`} className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{item.productName}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.quantity}x {item.format} @ {fmt(item.unitPrice)}/{item.unit.replace("per ", "")}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-sm font-bold text-primary">{fmt(item.unitPrice * item.quantity)}</span>
                  <button
                    type="button"
                    onClick={() => removeItem(item.productId, item.format)}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition touch-manipulation"
                    aria-label={`Remove ${item.productName}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t">
            <span className="text-sm font-medium text-muted-foreground">Estimated Total</span>
            <span className="text-lg font-bold text-primary">{fmt(totalPrice)}</span>
          </div>
          <Button variant="outline" asChild size="sm" className="w-full mt-3 touch-manipulation">
            <Link href="/products">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add More Products
            </Link>
          </Button>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-4 sm:p-5">
          <h2 className="text-base font-semibold mb-4">Contact Information</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={leadInfo.name}
                onChange={(e) => setLeadInfo({ ...leadInfo, name: e.target.value })}
                placeholder="Your name"
                required
                className="min-h-[44px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={leadInfo.email}
                onChange={(e) => setLeadInfo({ ...leadInfo, email: e.target.value })}
                placeholder="your@email.com"
                required
                className="min-h-[44px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                type="tel"
                value={leadInfo.phone}
                onChange={(e) => setLeadInfo({ ...leadInfo, phone: e.target.value })}
                placeholder="(555) 123-4567"
                required
                className="min-h-[44px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer_category">Customer Type *</Label>
              <select
                id="customer_category"
                value={leadInfo.customer_category}
                onChange={(e) => setLeadInfo({ ...leadInfo, customer_category: e.target.value })}
                required
                className="min-h-[44px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="">Select one</option>
                <option value="home-gardener">Home gardener</option>
                <option value="farmer-grower">Farmer / grower</option>
                <option value="landscaper">Landscaper</option>
                <option value="nursery-greenhouse">Nursery / greenhouse</option>
                <option value="contractor">Contractor</option>
                <option value="municipal-commercial">Municipal / commercial</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company, Farm, or Project (optional)</Label>
              <Input
                id="company"
                value={leadInfo.company}
                onChange={(e) => setLeadInfo({ ...leadInfo, company: e.target.value })}
                placeholder="Business, farm, or project name"
                className="min-h-[44px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={leadInfo.notes}
                onChange={(e) => setLeadInfo({ ...leadInfo, notes: e.target.value })}
                placeholder={items.length > 0 ? "Delivery location, timeline, or special requirements?" : "What products are you interested in? Any special requirements?"}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preferred_date">Preferred Pickup/Delivery Date (optional)</Label>
              <Input
                id="preferred_date"
                type="date"
                value={leadInfo.preferred_date}
                onChange={(e) => setLeadInfo({ ...leadInfo, preferred_date: e.target.value })}
                min={new Date(Date.now() + 86400000).toISOString().split("T")[0]}
                className="min-h-[44px]"
              />
            </div>
            <p className="rounded-lg bg-muted/50 p-3 text-xs leading-relaxed text-muted-foreground">
              By submitting this form, you allow Soil Seed &amp; Water to contact you about this request and add you to our marketing contact list.
            </p>
          </div>
        </Card>

        <Button
          type="submit"
          disabled={isSubmitting}
          size="lg"
          className="w-full min-h-[48px] bg-primary hover:bg-primary/90 text-lg font-semibold rounded-xl shadow-md touch-manipulation"
        >
          {isSubmitting ? "Submitting..." : items.length > 0 ? "Submit Quote Request" : "Submit"}
        </Button>
      </form>
    </div>
  );
};
