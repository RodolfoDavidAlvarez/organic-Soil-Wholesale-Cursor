import { Link } from "wouter";
import { RlsSeo } from "./rlsSeo";
import { useRlsHref } from "@/lib/brand";

const PROGRAMS = [
  {
    title: "Turf that earns its water",
    body: "Establish compaction, infiltration, salinity, organic matter, nutrient balance, and biology. Keep functional turf; convert leftover strips. Turf Daddy, compost, or vermicompost only where the diagnosis supports them.",
  },
  {
    title: "Trees and shrubs already on the site",
    body: "A Live Oak, Pine, Eucalyptus, Olive, Chinese Elm, Mesquite, or Palo Verde is assessed for planting depth, root flare, compaction, salts, and irrigation — not judged by origin first. There is no universal tree-compost recipe.",
  },
  {
    title: "Beds, planters, and foodscapes",
    body: "Repeated replacements are often soil or irrigation, not a bad plant. Foodscapes are appropriate when harvest is real. Safety testing comes before edible production.",
  },
];

export default function RlsPrograms() {
  const href = useRlsHref();

  return (
    <>
      <RlsSeo
        title="Landscape soil programs"
        description="Named programs on one diagnostic platform: turf, mature trees, and new landscape or foodscape establishment."
        path="/programs"
      />
      <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8A6B3D]">Same platform, named offers</p>
        <h1 className="mt-3 font-heading text-3xl font-bold text-[#1B2E1F] sm:text-5xl">Programs</h1>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-[#1B2E1F]/75">
          A practical structure a salesperson or contractor can explain: Soil Dashboard assessment, written diagnosis,
          treatment choices, application guidance, monitoring, and retesting.
        </p>
        <div className="mt-10 grid gap-5">
          {PROGRAMS.map((program) => (
            <article key={program.title} className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="font-heading text-2xl font-semibold text-[#1B2E1F]">{program.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-[#1B2E1F]/70">{program.body}</p>
            </article>
          ))}
        </div>
        <Link
          href={href("/consult")}
          className="mt-8 inline-flex min-h-[48px] items-center justify-center rounded-full bg-[#1B2E1F] px-6 font-semibold text-[#F4EFE6]"
        >
          Talk through a program
        </Link>
      </section>
    </>
  );
}
