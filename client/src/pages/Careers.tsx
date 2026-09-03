import { ArrowRight, Briefcase, Clock3, MapPin, Sprout } from "lucide-react";
import { Link } from "wouter";
import SEO from "@/components/layout/SEO";
import { trackEvent } from "@/lib/analytics";

const openings = [
  {
    title: "Sales Representative",
    location: "Phoenix, Arizona",
    schedule: "Full-time or part-time",
    description:
      "Help gardeners and growers choose products that build healthier soil. Sales, customer service, gardening, and growing experience are valued.",
    href: "/careers/sales",
    image: "/images/recruitment/sales-representative-hiring-square-2026.webp",
  },
];

const Careers = () => {
  return (
    <div className="min-h-screen bg-[#f5f2ea]">
      <SEO
        title="Careers at Soil Seed & Water"
        description="Explore current career opportunities with Soil Seed & Water in Phoenix, Arizona. View open positions and apply online."
        canonical="https://www.organicsoilwholesale.com/careers"
        ogImage="https://www.organicsoilwholesale.com/images/recruitment/sales-representative-hiring-square-2026.png"
      />

      <section className="bg-[#183a23] py-16 text-white lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d9b879]">Careers at Soil Seed &amp; Water</p>
          <h1 className="mt-4 max-w-4xl font-heading text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Grow something meaningful with us.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/80">
            Join a Phoenix team helping gardeners, growers, and landscape professionals build healthier soil and stronger communities.
          </p>
          <a
            href="#open-positions"
            className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#d4aa63] px-7 text-sm font-bold text-[#183a23] transition hover:bg-[#e2c184]"
          >
            View open positions
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </section>

      <section id="open-positions" className="scroll-mt-28 bg-[#faf9f5] py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8a6a34]">Current opportunities</p>
            <h2 className="mt-3 font-heading text-3xl font-bold text-[#183a23] sm:text-4xl">Open positions</h2>
            <p className="mt-3 leading-relaxed text-slate-600">
              Select a position to review the details and start your application. New opportunities will be added here as they open.
            </p>
          </div>

          <div className="mt-10 grid gap-6">
            {openings.map((opening) => (
              <article
                key={opening.href}
                className="overflow-hidden rounded-3xl border border-[#dfe7e1] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="grid gap-0 md:grid-cols-[220px_1fr]">
                  <div className="bg-[#eef3ed] p-5 md:p-6">
                    <img
                      src={opening.image}
                      alt="Soil Seed & Water sales representative opening"
                      width="1254"
                      height="1254"
                      loading="lazy"
                      className="mx-auto aspect-square w-full max-w-[180px] rounded-2xl object-cover shadow-sm"
                    />
                  </div>

                  <div className="flex flex-col justify-center p-6 sm:p-8">
                    <div className="flex items-center gap-2 text-sm font-semibold text-[#397854]">
                      <Briefcase className="h-5 w-5" aria-hidden="true" />
                      Open position
                    </div>
                    <h3 className="mt-3 font-heading text-2xl font-bold text-[#183a23] sm:text-3xl">{opening.title}</h3>
                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
                      <span className="inline-flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-[#397854]" aria-hidden="true" />
                        {opening.location}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <Clock3 className="h-4 w-4 text-[#397854]" aria-hidden="true" />
                        {opening.schedule}
                      </span>
                    </div>
                    <p className="mt-5 max-w-3xl leading-relaxed text-slate-600">{opening.description}</p>
                    <Link
                      href={opening.href}
                      className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#183a23] px-6 text-sm font-bold text-white transition hover:bg-[#215330] sm:w-auto"
                      onClick={() =>
                        trackEvent("Career Position Selected", {
                          position: opening.title,
                          source: "careers_hub",
                        })
                      }
                    >
                      View position and apply
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f5f2ea] py-14 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-[#dfe7e1] bg-white p-6 shadow-sm sm:p-10">
            <Sprout className="h-8 w-8 text-[#397854]" aria-hidden="true" />
            <h2 className="mt-4 font-heading text-2xl font-bold text-[#183a23]">Don&apos;t see the right position yet?</h2>
            <p className="mt-3 max-w-2xl leading-relaxed text-slate-600">
              Check this page again. We will publish each new opening here with its own position details and application.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Careers;
