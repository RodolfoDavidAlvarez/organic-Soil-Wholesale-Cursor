import { ArrowDown, Check, LockKeyhole } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Link } from "wouter";
import { GIVEAWAY_DRAFT } from "@/config/giveawayDraft";

export default function BigGardenGiveaway() {
  const goToEntryPreview = () => {
    document.getElementById("entry-preview")?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  return (
    <div className="min-h-screen bg-[#f4efe2] text-[#142219]">
      <Helmet>
        <title>{GIVEAWAY_DRAFT.campaignName} Draft | Organic Soil Wholesale</title>
        <meta name="description" content={GIVEAWAY_DRAFT.subheadline} />
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <div className="bg-[#8b2d22] px-4 py-2 text-center text-[11px] font-black uppercase tracking-[0.12em] text-white">
        {GIVEAWAY_DRAFT.statusLabel}
      </div>

      <header className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/">
          <a aria-label="Organic Soil Wholesale home" className="inline-flex min-h-11 items-center">
            <img
              src="/images/soil-seed-and-water-logo.png"
              alt="Soil Seed and Water"
              className="h-10 w-auto object-contain sm:h-12"
            />
          </a>
        </Link>
        <span className="rounded-full border border-[#b8b09f] px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#526056]">
          Draft preview
        </span>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-10 pt-5 sm:px-6 sm:pb-16 sm:pt-10">
        <section className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#a34f2b]">
              {GIVEAWAY_DRAFT.eyebrow}
            </p>
            <h1 className="mt-4 max-w-xl font-heading text-5xl font-black leading-[0.92] tracking-tight text-[#173d25] sm:text-7xl">
              {GIVEAWAY_DRAFT.headline}
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-7 text-[#56635a] sm:text-xl">
              {GIVEAWAY_DRAFT.subheadline}
            </p>

            <ul className="mt-6 space-y-3">
              {GIVEAWAY_DRAFT.prizeHighlights.map((item) => (
                <li key={item} className="flex items-start gap-3 font-bold text-[#2e4938]">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#dbe8d7] text-[#24703e]">
                    <Check className="h-4 w-4" aria-hidden="true" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={goToEntryPreview}
              className="mt-7 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-[#f5b934] px-6 text-base font-black text-[#102f1d] shadow-[0_5px_0_#a66b0a] transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#173d25] sm:w-auto"
            >
              {GIVEAWAY_DRAFT.cta}
              <ArrowDown className="h-4 w-4" aria-hidden="true" />
            </button>
            <p className="mt-4 max-w-lg text-xs font-semibold leading-5 text-[#6d756f]">
              No entries are being collected while prize details, rules, eligibility, timing, and privacy terms are pending approval.
            </p>
          </div>

          <figure className="overflow-hidden rounded-[1.75rem] border border-[#d2c8b5] bg-white shadow-[0_20px_55px_rgba(28,57,38,0.16)]">
            <img
              src={GIVEAWAY_DRAFT.heroImage}
              alt={GIVEAWAY_DRAFT.heroImageAlt}
              className="aspect-[3/2] w-full object-cover"
              {...{ fetchpriority: "high" }}
            />
            <figcaption className="border-t border-[#e2dacb] px-4 py-3 text-xs font-semibold leading-5 text-[#657067]">
              Concept visual based on actual Soil Seed &amp; Water products. Final prize contents remain subject to approval.
            </figcaption>
          </figure>
        </section>

        <section aria-labelledby="package-visuals-title" className="pt-10 sm:pt-14">
          <div className="mb-5 max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#a34f2b]">Package concept</p>
            <h2 id="package-visuals-title" className="mt-2 font-heading text-3xl font-black leading-tight text-[#173d25] sm:text-4xl">
              See the complete setup.
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {GIVEAWAY_DRAFT.supportVisuals.map((visual) => (
              <figure
                key={visual.image}
                className="overflow-hidden rounded-[1.5rem] border border-[#d2c8b5] bg-[#fffdf8] shadow-[0_14px_35px_rgba(28,57,38,0.1)]"
              >
                <img
                  src={visual.image}
                  alt={visual.alt}
                  loading="lazy"
                  className="h-64 w-full bg-[#e9e2d1] object-contain"
                />
                <figcaption className="border-t border-[#e2dacb] px-5 py-4">
                  <h3 className="font-heading text-xl font-black text-[#173d25]">{visual.title}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-[#657067]">{visual.caption}</p>
                  {visual.items.length > 0 && (
                    <ul className="mt-3 flex flex-wrap gap-2" aria-label={`${visual.title} Included component types`}>
                      {visual.items.map((item) => (
                        <li
                          key={item}
                          className="rounded-full border border-[#d7cebd] bg-[#f4efe2] px-3 py-1.5 text-xs font-bold text-[#3d5546]"
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section id="entry-preview" className="scroll-mt-6 pt-10 sm:pt-14">
          <div className="mx-auto max-w-4xl rounded-[1.75rem] bg-[#173d25] p-5 text-white shadow-xl sm:p-8">
            <div className="grid gap-6 md:grid-cols-2 md:items-center">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#f5bb45]">Registration preview</p>
                <h2 className="mt-2 font-heading text-3xl font-black leading-tight sm:text-4xl">
                  {GIVEAWAY_DRAFT.form.title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-[#d8e2da]">{GIVEAWAY_DRAFT.form.intro}</p>
              </div>

              <form aria-label="Giveaway registration preview" className="rounded-2xl bg-[#fffdf8] p-4 text-[#173d25] sm:p-5">
                <fieldset disabled className="grid gap-3 sm:grid-cols-3">
                  {GIVEAWAY_DRAFT.form.fields.map((field) => (
                    <label key={field.name} className="text-xs font-black">
                      {field.label}
                      <input
                        type={field.type}
                        name={field.name}
                        placeholder={field.placeholder}
                        className="mt-1.5 min-h-12 w-full rounded-xl border border-[#c8cfc8] bg-white px-3 text-sm disabled:cursor-not-allowed disabled:bg-[#f1eee7]"
                      />
                    </label>
                  ))}
                </fieldset>
                <button
                  type="button"
                  disabled
                  className="mt-4 flex min-h-12 w-full cursor-not-allowed items-center justify-center gap-2 rounded-full bg-[#d8d2c4] px-5 font-black text-[#6c716d]"
                >
                  <LockKeyhole className="h-4 w-4" aria-hidden="true" />
                  Entries open after approval
                </button>
              </form>
            </div>
          </div>
        </section>

        <details className="mx-auto mt-7 max-w-4xl rounded-2xl border border-[#d3cab9] bg-[#fffdf8] px-5 py-4 text-sm text-[#536057]">
          <summary className="cursor-pointer font-black text-[#173d25]">Launch approvals still required</summary>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {GIVEAWAY_DRAFT.launchRequirements.map((item) => (
              <li key={item} className="flex gap-2">
                <span aria-hidden="true">•</span>
                {item}
              </li>
            ))}
          </ul>
        </details>
      </main>
    </div>
  );
}
