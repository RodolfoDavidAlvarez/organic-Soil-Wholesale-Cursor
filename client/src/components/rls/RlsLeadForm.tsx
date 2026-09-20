import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { useBrand, rlsCanonical } from "@/lib/brand";
import { attributedPageUrl } from "@/lib/pageAttribution";
import { trackEcommerceEvent, trackEvent } from "@/lib/analytics";

const CLIENT_TYPES = [
  { value: "contractor", label: "Landscape contractor / maintenance" },
  { value: "arborist", label: "Arborist / tree company" },
  { value: "hoa", label: "HOA / property manager" },
  { value: "designer", label: "Designer / landscape architect" },
  { value: "homeowner", label: "Homeowner" },
  { value: "other", label: "Other" },
];

const SITE_TYPES = [
  { value: "turf", label: "Turf" },
  { value: "trees", label: "Mature trees & shrubs" },
  { value: "beds", label: "Shrubs, beds, or planters" },
  { value: "foodscape", label: "Foodscape / productive landscape" },
  { value: "mixed", label: "Mixed property" },
];

type FormState = {
  name: string;
  email: string;
  phone: string;
  company: string;
  clientType: string;
  siteType: string;
  zip: string;
  products: string;
  message: string;
};

const EMPTY: FormState = {
  name: "",
  email: "",
  phone: "",
  company: "",
  clientType: "",
  siteType: "",
  zip: "",
  products: "",
  message: "",
};

type Props = {
  intent?: "consult" | "contact" | "quote";
  presetProduct?: string;
  heading?: string;
};

export function RlsLeadForm({ intent = "consult", presetProduct = "", heading }: Props) {
  const brand = useBrand();
  const [form, setForm] = useState<FormState>({ ...EMPTY, products: presetProduct });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const endpoint = intent === "contact" ? "/api/contact/submit" : intent === "quote" ? "/api/quote/submit" : "/api/leads/submit";

  const notes = useMemo(() => {
    const lines = [
      `Brand: ${brand.name}`,
      form.clientType ? `Client type: ${form.clientType}` : "",
      form.siteType ? `Site type: ${form.siteType}` : "",
      form.zip ? `ZIP: ${form.zip}` : "",
      form.products ? `Products of interest: ${form.products}` : "",
      form.message ? `Notes: ${form.message}` : "",
    ].filter(Boolean);
    return lines.join("\n");
  }, [brand.name, form]);

  const onChange = (key: keyof FormState) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const sourcePath = typeof window !== "undefined" ? window.location.pathname : "/consult";
      const payload =
        intent === "contact"
          ? {
              name: form.name,
              email: form.email,
              phone: form.phone,
              company: form.company,
              subject: `RLS contact — ${form.siteType || form.clientType || "landscape"}`,
              message: notes,
              brand: "rls",
              source_path: sourcePath,
              source_url: attributedPageUrl(rlsCanonical(sourcePath)),
            }
          : intent === "quote"
            ? {
                name: form.name,
                email: form.email,
                phone: form.phone,
                company: form.company,
                products: form.products ? form.products.split(",").map((item) => item.trim()).filter(Boolean) : ["Landscape consult"],
                quantities: ["quote"],
                deliveryLocation: form.zip || undefined,
                notes,
                brand: "rls",
                source_path: sourcePath,
                source_url: attributedPageUrl(rlsCanonical(sourcePath)),
              }
            : {
                name: form.name,
                email: form.email,
                phone: form.phone,
                notes,
                brand: "rls",
                lead_type: "landscape_consult",
                source: "rls_consult_request",
                source_path: sourcePath,
                source_url: attributedPageUrl(rlsCanonical(sourcePath)),
              };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error || "Unable to submit right now.");
      }

      trackEvent("RLS Lead Submitted", { intent, brand: "rls", client_type: form.clientType });
      trackEcommerceEvent("generate_lead", {
        lead_type: intent === "contact" ? "contact_form" : intent === "quote" ? "quote_request" : "consult_request",
        source: "rls_storefront",
        pickup_sales_channel: "rls_landscape",
      });
      setDone(true);
      setForm({ ...EMPTY, products: presetProduct });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit right now.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-2xl border border-[#1B2E1F]/10 bg-white p-6">
        <p className="font-heading text-xl font-semibold text-[#1B2E1F]">Request received.</p>
        <p className="mt-2 text-sm leading-relaxed text-[#1B2E1F]/75">
          A Soil Seed &amp; Water rep will follow up. Same inventory and yard as Organic Soil Wholesale — we will not ask you to re-explain the job.
        </p>
        <button
          type="button"
          className="mt-4 inline-flex min-h-[44px] items-center font-semibold text-[#8A6B3D]"
          onClick={() => setDone(false)}
        >
          Send another request
        </button>
      </div>
    );
  }

  const fieldClass =
    "min-h-[44px] w-full rounded-xl border border-[#1B2E1F]/15 bg-[#F4EFE6] px-3 text-base text-[#1B2E1F] outline-none focus:border-[#1B2E1F]";

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-[#1B2E1F]/10 bg-white p-5 sm:p-6">
      {heading && <h2 className="font-heading text-2xl font-semibold text-[#1B2E1F]">{heading}</h2>}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-medium text-[#1B2E1F]">
          Name
          <input required value={form.name} onChange={onChange("name")} className={`mt-1 ${fieldClass}`} autoComplete="name" />
        </label>
        <label className="block text-sm font-medium text-[#1B2E1F]">
          Email
          <input required type="email" value={form.email} onChange={onChange("email")} className={`mt-1 ${fieldClass}`} autoComplete="email" />
        </label>
        <label className="block text-sm font-medium text-[#1B2E1F]">
          Phone
          <input required value={form.phone} onChange={onChange("phone")} className={`mt-1 ${fieldClass}`} autoComplete="tel" />
        </label>
        <label className="block text-sm font-medium text-[#1B2E1F]">
          Company
          <input value={form.company} onChange={onChange("company")} className={`mt-1 ${fieldClass}`} autoComplete="organization" />
        </label>
        <label className="block text-sm font-medium text-[#1B2E1F]">
          Who you are
          <select value={form.clientType} onChange={onChange("clientType")} className={`mt-1 ${fieldClass}`}>
            <option value="">Select</option>
            {CLIENT_TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-[#1B2E1F]">
          Site focus
          <select value={form.siteType} onChange={onChange("siteType")} className={`mt-1 ${fieldClass}`}>
            <option value="">Select</option>
            {SITE_TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-[#1B2E1F]">
          Job ZIP
          <input value={form.zip} onChange={onChange("zip")} className={`mt-1 ${fieldClass}`} inputMode="numeric" />
        </label>
        <label className="block text-sm font-medium text-[#1B2E1F]">
          Products of interest
          <input
            value={form.products}
            onChange={onChange("products")}
            className={`mt-1 ${fieldClass}`}
            placeholder="Simon's Gold, Turf Daddy, Nature's Blanket Premium"
          />
        </label>
        <label className="block text-sm font-medium text-[#1B2E1F] sm:col-span-2">
          What is the landscape trying to do?
          <textarea
            required
            minLength={10}
            value={form.message}
            onChange={onChange("message")}
            className="mt-1 min-h-[120px] w-full rounded-xl border border-[#1B2E1F]/15 bg-[#F4EFE6] px-3 py-3 text-base text-[#1B2E1F] outline-none focus:border-[#1B2E1F]"
          />
        </label>
      </div>
      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="mt-4 inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-[#1B2E1F] px-5 text-base font-semibold text-[#F4EFE6] disabled:opacity-60 sm:w-auto"
      >
        {submitting ? "Sending…" : "Request a soil consult"}
      </button>
      <p className="mt-3 text-xs leading-relaxed text-[#1B2E1F]/60">
        Routed to the shared Soil Seed &amp; Water lead desk used by Organic Soil Wholesale.
      </p>
    </form>
  );
}
