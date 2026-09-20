import { RlsLeadForm } from "@/components/rls/RlsLeadForm";
import { RlsSeo } from "./rlsSeo";

function presetFromSearch() {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("product") || "";
}

export default function RlsConsult() {
  const presetProduct = presetFromSearch();

  return (
    <>
      <RlsSeo
        title="Request a landscape soil consult"
        description="Request a Soil Dashboard consult. Leads enter the shared SSW desk used by Organic Soil Wholesale and My Organic Soil."
        path="/consult"
      />
      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:py-16 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8A6B3D]">Shared SSW lead desk</p>
          <h1 className="mt-3 font-heading text-3xl font-bold text-[#1B2E1F] sm:text-5xl">Request a consult</h1>
          <p className="mt-4 text-base leading-relaxed text-[#1B2E1F]/75">
            Tell us what the landscape is trying to do. We will not open with a product pitch. The request goes to the
            same Soil Seed &amp; Water desk that handles Organic Soil Wholesale quotes.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-[#1B2E1F]/70">
            <li>A rep follows up by phone or email</li>
            <li>Diagnosis first — products only if the site needs them</li>
            <li>Paid yard pickup stays at the Phoenix Organic Soil Wholesale gate</li>
          </ul>
        </div>
        <RlsLeadForm intent="consult" presetProduct={presetProduct} heading="Landscape consult" />
      </section>
    </>
  );
}
