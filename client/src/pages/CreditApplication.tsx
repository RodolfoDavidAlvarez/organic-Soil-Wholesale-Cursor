import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CUSTOMER_SUPPORT_PHONE_DISPLAY, CUSTOMER_SUPPORT_PHONE_TEL } from "@/config/contact";

const schema = z.object({
  business_name: z.string().min(2, "Business name is required"),
  dba: z.string().optional(),
  business_type: z.string().optional(),
  years_in_business: z.string().optional(),
  tax_id: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  business_phone: z.string().optional(),
  website: z.string().optional(),
  contact_name: z.string().min(2, "Contact name is required"),
  contact_title: z.string().optional(),
  email: z.string().email("Enter a valid email"),
  phone: z.string().optional(),
  requested_credit_limit: z.string().optional(),
  estimated_monthly_volume: z.string().optional(),
  requested_terms: z.string().optional(),
  trade_ref1: z.string().optional(),
  trade_ref1_phone: z.string().optional(),
  trade_ref2: z.string().optional(),
  trade_ref2_phone: z.string().optional(),
  bank_name: z.string().optional(),
  bank_contact: z.string().optional(),
  signature_name: z.string().min(2, "Type your full name to sign"),
  signature_date: z.string().min(1, "Date is required"),
  agree: z.literal(true, { errorMap: () => ({ message: "You must authorize the credit review" }) }),
});
type FormValues = z.infer<typeof schema>;

const SECTION = "text-lg font-bold text-[#2C3E50] border-b border-gray-200 pb-2 mb-4 mt-2";
const selectCls =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export default function CreditApplication() {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      business_name: "", dba: "", business_type: "", years_in_business: "", tax_id: "",
      address: "", city: "", state: "", zip: "", business_phone: "", website: "",
      contact_name: "", contact_title: "", email: "", phone: "",
      requested_credit_limit: "", estimated_monthly_volume: "", requested_terms: "",
      trade_ref1: "", trade_ref1_phone: "", trade_ref2: "", trade_ref2_phone: "",
      bank_name: "", bank_contact: "", signature_name: "",
      signature_date: new Date().toISOString().slice(0, 10),
    } as any,
  });

  const onSubmit = async (data: FormValues) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/credit-application/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || "Submission failed");
      }
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      toast({
        title: "Could not submit",
        description: err instanceof Error ? err.message : "Please try again or call us.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-[#2C3E50] mb-2">Application Received</h1>
        <p className="text-gray-600">
          Thank you. Our team will review your wholesale credit application and follow up shortly.
          Questions? Call us at{" "}
          <a className="text-green-700 font-semibold" href={`tel:${CUSTOMER_SUPPORT_PHONE_TEL}`}>
            {CUSTOMER_SUPPORT_PHONE_DISPLAY}
          </a>.
        </p>
      </div>
    );
  }

  const field = (name: keyof FormValues, label: string, opts: { placeholder?: string; type?: string; required?: boolean } = {}) => (
    <FormField
      control={form.control}
      name={name as any}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}{opts.required ? " *" : ""}</FormLabel>
          <FormControl>
            <Input type={opts.type || "text"} placeholder={opts.placeholder} {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <ShieldCheck className="w-10 h-10 text-green-700 mx-auto mb-3" />
        <h1 className="text-3xl font-bold text-[#2C3E50]">Wholesale Credit Application</h1>
        <p className="text-gray-600 mt-2">
          Apply for net payment terms with Organic Soil Wholesale. It takes about 5 minutes.
        </p>
      </div>

      <Card>
        <CardContent className="p-6 sm:p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <h2 className={SECTION}>Business Information</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {field("business_name", "Legal Business Name", { required: true })}
                {field("dba", "DBA (if any)")}
                <FormField control={form.control} name="business_type" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Type</FormLabel>
                    <FormControl>
                      <select className={selectCls} {...field}>
                        <option value="">Select…</option>
                        <option>Sole Proprietor</option><option>LLC</option><option>Corporation</option>
                        <option>Partnership</option><option>Non-Profit</option><option>Government</option>
                      </select>
                    </FormControl>
                  </FormItem>
                )} />
                {field("years_in_business", "Years in Business")}
                {field("tax_id", "Tax ID / EIN")}
                {field("website", "Website")}
                {field("address", "Business Address")}
                {field("city", "City")}
                {field("state", "State")}
                {field("zip", "ZIP")}
                {field("business_phone", "Business Phone", { type: "tel" })}
              </div>

              <h2 className={SECTION}>Primary Contact</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {field("contact_name", "Full Name", { required: true })}
                {field("contact_title", "Title")}
                {field("email", "Email", { type: "email", required: true })}
                {field("phone", "Phone", { type: "tel" })}
              </div>

              <h2 className={SECTION}>Credit Requested</h2>
              <div className="grid sm:grid-cols-3 gap-4">
                {field("requested_credit_limit", "Requested Credit Limit", { placeholder: "$" })}
                {field("estimated_monthly_volume", "Est. Monthly Purchases", { placeholder: "$" })}
                <FormField control={form.control} name="requested_terms" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Requested Terms</FormLabel>
                    <FormControl>
                      <select className={selectCls} {...field}>
                        <option value="">Select…</option>
                        <option>Net 15</option><option>Net 30</option><option>Net 45</option><option>Net 60</option>
                      </select>
                    </FormControl>
                  </FormItem>
                )} />
              </div>

              <h2 className={SECTION}>Trade References</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {field("trade_ref1", "Reference 1 — Company")}
                {field("trade_ref1_phone", "Reference 1 — Phone", { type: "tel" })}
                {field("trade_ref2", "Reference 2 — Company")}
                {field("trade_ref2_phone", "Reference 2 — Phone", { type: "tel" })}
              </div>

              <h2 className={SECTION}>Bank Reference</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {field("bank_name", "Bank Name")}
                {field("bank_contact", "Bank Contact / Phone")}
              </div>

              <h2 className={SECTION}>Authorization</h2>
              <p className="text-sm text-gray-600 mb-2">
                I certify the information above is accurate and authorize Organic Soil Wholesale to verify it and
                obtain credit and trade references for the purpose of evaluating this application.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                {field("signature_name", "Signature (type full name)", { required: true })}
                {field("signature_date", "Date", { type: "date", required: true })}
              </div>
              <FormField control={form.control} name="agree" render={({ field }) => (
                <FormItem>
                  <label className="flex items-start gap-2 text-sm text-gray-700">
                    <input type="checkbox" className="mt-1" checked={field.value || false}
                      onChange={(e) => field.onChange(e.target.checked)} />
                    <span>I authorize the credit review described above.</span>
                  </label>
                  <FormMessage />
                </FormItem>
              )} />

              <Button type="submit" disabled={submitting} className="w-full bg-green-700 hover:bg-green-800 mt-2">
                {submitting ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting…</>) : "Submit Credit Application"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
