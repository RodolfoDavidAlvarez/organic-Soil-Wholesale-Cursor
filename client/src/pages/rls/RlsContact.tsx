import { RlsLeadForm } from "@/components/rls/RlsLeadForm";
import { RlsSeo } from "./rlsSeo";
import { useBrand } from "@/lib/brand";

export default function RlsContact() {
  const brand = useBrand();

  return (
    <>
      <RlsSeo
        title="Contact Regenerative Landscape Supply"
        description="Contact Regenerative Landscape Supply at the Phoenix Organic Soil Wholesale yard. Official line (623) 263-3386."
        path="/contact"
      />
      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:py-16 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <h1 className="font-heading text-3xl font-bold text-[#1B2E1F] sm:text-5xl">Contact</h1>
          <p className="mt-4 text-base leading-relaxed text-[#1B2E1F]/75">
            Same yard, same phone, same people as Organic Soil Wholesale. Ask for the landscape supply desk.
          </p>
          <div className="mt-6 space-y-3 text-sm text-[#1B2E1F]/80">
            <p>
              <span className="font-semibold">Phone: </span>
              <a className="underline decoration-[#C4A574] underline-offset-2" href={brand.phoneTel}>
                {brand.phoneDisplay}
              </a>
            </p>
            <p>
              <span className="font-semibold">Yard: </span>
              {brand.yardAddress}
            </p>
            <p>
              <span className="font-semibold">Email: </span>
              {brand.email}
            </p>
          </div>
        </div>
        <RlsLeadForm intent="contact" heading="Send a message" />
      </section>
    </>
  );
}
