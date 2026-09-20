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
            Tell us what the landscape is trying to do. We will not open with a product pitch. This form writes the same
            tables the Organic Soil Wholesale quote and contact flows already use, tagged as Regenerative Landscape Supply.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-[#1B2E1F]/70">
            <li>contact_messages / contact_submissions / quote_requests</li>
            <li>MOS fan-out to sp_leads when MOS_LEAD_INGEST_SECRET is set</li>
            <li>Yard pickup and paid card checkout stay on organicsoilwholesale.com</li>
          </ul>
        </div>
        <RlsLeadForm intent="consult" presetProduct={presetProduct} heading="Landscape consult" />
      </section>
    </>
  );
}
