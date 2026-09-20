import { Link } from "wouter";
import { ArrowRight, Leaf, Phone, Ruler, Trees } from "lucide-react";
import { RlsSeo } from "./rlsSeo";
import { useRlsHref, oswUrl, useBrand } from "@/lib/brand";

const LOOP = ["Test", "Diagnose", "Prescribe", "Apply", "Measure", "Adjust"];

const AUDIENCES = [
  {
    title: "Landscape professionals",
    body: "Bring a soil-diagnostic system to dozens of properties. Testing, bulk products, and recurring protocols — not a one-time bag sale.",
    href: "/professionals",
  },
  {
    title: "Homeowners & property managers",
    body: "Understand why the landscape is struggling before adding more fertilizer, iron, or water. We supply the contractor who does the work.",
    href: "/consult",
  },
];

export default function RlsHome() {
  const href = useRlsHref();
  const brand = useBrand();

  return (
    <>
      <RlsSeo
        title="Soil-first supply for landscape professionals"
        description="Regenerative Landscape Supply is the Soil Seed & Water front door for landscapers and the properties they manage. Diagnose the soil, then prescribe Simon's Gold, Mikey's Worm Poop, Soil Craft, Nature's Blanket Premium, PlantPal, or Turf Daddy only where justified."
        path="/"
        keywords="regenerative landscape supply Arizona, landscape soil Phoenix, compost for landscapers, Soil Dashboard, Nature's Blanket Premium, Simon's Gold, Turf Daddy"
      />

      <section className="relative overflow-hidden bg-[#1B2E1F] text-[#F4EFE6]">
        <img
          src="/images/optimized/dark-mulk-applied-in-outside-of-office-showcase.jpg"
          alt="Nature's Blanket Premium mulch applied on a commercial landscape"
          className="absolute inset-0 h-full w-full object-cover opacity-25"
        />
        <div className="relative mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <p className="inline-flex min-h-[36px] items-center rounded-full bg-[#C4A574]/20 px-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#C4A574]">
            Phoenix yard · Arizona made
          </p>
          <h1 className="mt-5 max-w-4xl font-heading text-3xl font-bold leading-tight sm:text-5xl">
            We begin with the soil, the plant, and the problem — not the bag.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#F4EFE6]/80 sm:text-lg">
            {brand.name} is the landscape-pro door into Soil Seed &amp; Water / Organic Soil Wholesale.
            Same compost, soils, mulch, and yard. A different conversation: diagnosis before prescription.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href={href("/consult")}
              className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-[#C4A574] px-6 text-base font-semibold text-[#1B2E1F]"
            >
              Request a soil consult
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <a
              href={brand.phoneTel}
              className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-[#F4EFE6]/40 px-6 text-base font-semibold text-[#F4EFE6]"
            >
              <Phone className="mr-2 h-4 w-4" />
              {brand.phoneDisplay}
            </a>
          </div>
        </div>
      </section>

      <section className="border-b border-[#1B2E1F]/10 bg-white py-4">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-3 px-4 text-xs font-semibold uppercase tracking-[0.14em] text-[#1B2E1F]/60 sm:gap-6">
          {LOOP.map((step, index) => (
            <span key={step} className="inline-flex items-center gap-3">
              {step}
              {index < LOOP.length - 1 && <span className="hidden text-[#C4A574] sm:inline">→</span>}
            </span>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <div className="grid gap-6 md:grid-cols-3">
          <article className="rounded-2xl bg-white p-6 shadow-sm">
            <Ruler className="h-6 w-6 text-[#8A6B3D]" />
            <h2 className="mt-4 font-heading text-xl font-semibold text-[#1B2E1F]">Soil Dashboard first</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#1B2E1F]/70">
              Measure physical, water, chemistry, biology, plant response, and inputs. Prescribe only what the limiting factor justifies.
            </p>
            <Link href={href("/soil-dashboard")} className="mt-4 inline-flex min-h-[44px] items-center font-semibold text-[#8A6B3D]">
              See the dashboard
            </Link>
          </article>
          <article className="rounded-2xl bg-white p-6 shadow-sm">
            <Leaf className="h-6 w-6 text-[#8A6B3D]" />
            <h2 className="mt-4 font-heading text-xl font-semibold text-[#1B2E1F]">A toolbox, not a doctrine</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#1B2E1F]/70">
              Simon&apos;s Gold, Mikey&apos;s Worm Poop, Soil Craft, Nature&apos;s Blanket Premium, PlantPal, and Turf Daddy — used when the site asks for them.
            </p>
            <Link href={href("/products")} className="mt-4 inline-flex min-h-[44px] items-center font-semibold text-[#8A6B3D]">
              Open the toolbox
            </Link>
          </article>
          <article className="rounded-2xl bg-white p-6 shadow-sm">
            <Trees className="h-6 w-6 text-[#8A6B3D]" />
            <h2 className="mt-4 font-heading text-xl font-semibold text-[#1B2E1F]">Shared SSW fulfillment</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#1B2E1F]/70">
              Quotes, leads, and yard pickup land in the same Organic Soil Wholesale / My Organic Soil stack. No parallel inventory.
            </p>
            <a href={oswUrl("/qr")} className="mt-4 inline-flex min-h-[44px] items-center font-semibold text-[#8A6B3D]">
              Pay &amp; pickup at the yard
            </a>
          </article>
        </div>
      </section>

      <section className="bg-white py-12 sm:py-16">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 md:grid-cols-2">
          {AUDIENCES.map((item) => (
            <Link key={item.title} href={href(item.href)} className="rounded-2xl border border-[#1B2E1F]/10 p-6">
              <h2 className="font-heading text-2xl font-semibold text-[#1B2E1F]">{item.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-[#1B2E1F]/70">{item.body}</p>
              <span className="mt-4 inline-flex min-h-[44px] items-center font-semibold text-[#8A6B3D]">
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
