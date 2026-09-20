import { Link } from "wouter";
import { RlsSeo } from "./rlsSeo";
import { useRlsHref } from "@/lib/brand";

const AREAS = [
  {
    title: "Physical",
    measure: "Texture, compaction, bulk density, porosity, aggregate stability, rooting depth",
    tells: "Can roots, oxygen, and water move through the profile?",
  },
  {
    title: "Water function",
    measure: "Infiltration, drainage, water-holding capacity, irrigation pattern, water quality",
    tells: "Does water enter, remain available, and drain appropriately?",
  },
  {
    title: "Chemistry",
    measure: "pH, EC/salinity, organic matter, carbon, C:N, CEC, N-P-K, Ca, Mg, S, micronutrients",
    tells: "Are chemistry, salts, or nutrient balance limiting performance?",
  },
  {
    title: "Biology",
    measure: "Active bacteria/fungi, fungal:bacterial relationship, respiration, root colonization",
    tells: "Is the soil food web functioning and appropriate to the plant community?",
  },
  {
    title: "Plant response",
    measure: "Rooting, turf density, canopy vigor, chlorosis, disease/pest pressure, mortality",
    tells: "Are soil corrections translating into healthier plants?",
  },
  {
    title: "Inputs & outcomes",
    measure: "Water, fertilizer, pesticide use, amendments, labor, replacement, cost",
    tells: "Is the system becoming more efficient and less dependent on repeated correction?",
  },
];

export default function RlsSoilDashboard() {
  const href = useRlsHref();

  return (
    <>
      <RlsSeo
        title="The Soil Dashboard"
        description="SSW's Soil Dashboard separates physical, chemical, biological, and water limitations so landscape treatments target the actual site instead of applying the same amendment everywhere."
        path="/soil-dashboard"
      />
      <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8A6B3D]">Diagnosis before prescription</p>
        <h1 className="mt-3 max-w-3xl font-heading text-3xl font-bold text-[#1B2E1F] sm:text-5xl">
          The Soil Dashboard
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-[#1B2E1F]/75">
          Nutrient chemistry alone cannot explain a compacted profile. Biology alone cannot solve a sodium problem.
          Compost cannot correct every drainage limitation. The useful prescription is the one that targets the limiting factor.
        </p>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {AREAS.map((area) => (
            <article key={area.title} className="rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="font-heading text-xl font-semibold text-[#1B2E1F]">{area.title}</h2>
              <p className="mt-2 text-sm font-medium text-[#1B2E1F]">What we measure</p>
              <p className="text-sm leading-relaxed text-[#1B2E1F]/70">{area.measure}</p>
              <p className="mt-3 text-sm font-medium text-[#1B2E1F]">What it tells us</p>
              <p className="text-sm leading-relaxed text-[#1B2E1F]/70">{area.tells}</p>
            </article>
          ))}
        </div>
        <p className="mt-8 max-w-3xl text-sm leading-relaxed text-[#1B2E1F]/70">
          Some sites need less intervention, not more. If unsure, do less. Products are accelerators inside a functioning
          soil–plant system — not substitutes for roots, water management, plant selection, or good maintenance.
        </p>
        <Link
          href={href("/consult")}
          className="mt-6 inline-flex min-h-[48px] items-center justify-center rounded-full bg-[#1B2E1F] px-6 font-semibold text-[#F4EFE6]"
        >
          Start with a baseline
        </Link>
      </section>
    </>
  );
}
