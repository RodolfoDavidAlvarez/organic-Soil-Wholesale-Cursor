import { Link } from "wouter";
import { Sprout, Mountain, Boxes, BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";

/**
 * Compact brand-pillar strip — the four SSW core values in one glance.
 * Pure trust layer: renders anywhere without props, never blocks a buy flow.
 * Copy follows the brand guideline ("trusted go-to resource for growers");
 * always "soil", never "dirt".
 */
const PILLARS = [
  {
    icon: Sprout,
    label: "Grower Centric",
    line: "Built around your crop, your schedule, your margins.",
  },
  {
    icon: Mountain,
    label: "Soil Health & Conservation",
    line: "No-till friendly, living soil that builds year over year.",
  },
  {
    icon: Boxes,
    label: "Diverse Soil Products",
    line: "Compost, castings, blends, and mulch — one Arizona source.",
  },
  {
    icon: BadgeCheck,
    label: "Authenticity",
    line: "Produced here in Arizona; come see the yard.",
  },
];

export function TrustStrip({ className, page }: { className?: string; page?: string }) {
  return (
    <section
      aria-label="Why growers trust Soil Seed & Water"
      className={cn("rounded-2xl border border-stone-200/80 bg-stone-50/70 px-4 py-5 sm:px-6", className)}
    >
      <div className="grid grid-cols-2 gap-x-4 gap-y-4 lg:grid-cols-4">
        {PILLARS.map(({ icon: Icon, label, line }) => (
          <div key={label} className="flex items-start gap-2.5">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#264027]/10 text-[#264027]">
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold leading-tight text-stone-900">{label}</p>
              <p className="mt-0.5 text-xs leading-snug text-stone-600">{line}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 border-t border-stone-200/80 pt-3 text-center text-xs text-stone-600">
        <span className="font-semibold text-[#264027]">The trusted go-to resource for growers.</span>{" "}
        <Link
          href="/about"
          onClick={() => trackEvent("Trust Strip Story Clicked", { page: page ?? window.location.pathname })}
          className="font-semibold text-stone-700 underline-offset-2 hover:underline"
        >
          Our story →
        </Link>
      </p>
    </section>
  );
}

export default TrustStrip;
