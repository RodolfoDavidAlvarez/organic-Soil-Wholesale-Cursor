import { Link } from "wouter";
import { RlsSeo } from "./rlsSeo";
import { useRlsHref } from "@/lib/brand";

const ROLES = [
  {
    title: "Landscape contractor / maintenance company",
    offer: "Training + Soil Dashboard support",
    path: "Testing, bulk products, recurring protocols, project specifications",
  },
  {
    title: "Arborist / tree company",
    offer: "Root-zone diagnostics and materials",
    path: "Testing, prescription products, soil-remediation materials",
  },
  {
    title: "HOA / property manager",
    offer: "Property or zone assessment through a contractor partner",
    path: "Testing + products + conversion or maintenance support",
  },
  {
    title: "Designer / landscape architect",
    offer: "Preconstruction soil baseline and specifications",
    path: "Testing, soil blends, amendment specs, establishment protocols",
  },
  {
    title: "Homeowner with a landscaper",
    offer: "Home soil / landscape assessment",
    path: "Testing, product prescription, contractor fulfillment",
  },
];

export default function RlsProfessionals() {
  const href = useRlsHref();

  return (
    <>
      <RlsSeo
        title="For landscape professionals"
        description="Regenerative Landscape Supply is partly B2C and strongly B2B2C. Homeowners create demand; contractors recommend, purchase, and apply the solution."
        path="/professionals"
      />
      <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8A6B3D]">B2B2C landscape lane</p>
        <h1 className="mt-3 font-heading text-3xl font-bold text-[#1B2E1F] sm:text-5xl">
          Supply the crews who influence thousands of properties
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-[#1B2E1F]/75">
          Most homeowners will not run a Soil Dashboard or spread bulk amendments. Their landscaper, tree company, HOA
          contractor, or maintenance provider is the person who recommends, purchases, and applies the solution.
        </p>
        <div className="mt-10 grid gap-4">
          {ROLES.map((role) => (
            <article key={role.title} className="rounded-2xl bg-white p-5 shadow-sm sm:grid sm:grid-cols-3 sm:gap-4">
              <h2 className="font-heading text-lg font-semibold text-[#1B2E1F]">{role.title}</h2>
              <p className="mt-2 text-sm text-[#1B2E1F]/70 sm:mt-0">
                <span className="font-semibold text-[#1B2E1F]">Entry: </span>
                {role.offer}
              </p>
              <p className="mt-2 text-sm text-[#1B2E1F]/70 sm:mt-0">
                <span className="font-semibold text-[#1B2E1F]">Revenue: </span>
                {role.path}
              </p>
            </article>
          ))}
        </div>
        <Link
          href={href("/consult")}
          className="mt-8 inline-flex min-h-[48px] items-center justify-center rounded-full bg-[#1B2E1F] px-6 font-semibold text-[#F4EFE6]"
        >
          Become a supply partner
        </Link>
      </section>
    </>
  );
}
