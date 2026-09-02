import { FormEvent, useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowDown, Check, ExternalLink, LockKeyhole } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Link } from "wouter";
import { GIVEAWAY_DRAFT } from "@/config/giveawayDraft";
import { trackEvent } from "@/lib/analytics";
import { GIVEAWAY_ENTRIES_CLOSED_MESSAGE } from "@shared/giveawayEntries.js";

type SocialKey = "ig" | "fb" | "yt" | "tt";
type FollowedState = Record<SocialKey, boolean>;

const emptyFollowed = (): FollowedState => ({
  ig: false,
  fb: false,
  yt: false,
  tt: false,
});

const FIELD_CLASS =
  "mt-1.5 min-h-12 w-full rounded-xl border border-[#c8cfc8] bg-white px-3 text-base text-[#173d25]";

export default function BigGardenGiveaway() {
  const entriesOpen = GIVEAWAY_DRAFT.acceptingEntries === true;
  const followTimers = useRef<Partial<Record<SocialKey, number>>>({});
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [customerType, setCustomerType] = useState("");
  const [gardenStatus, setGardenStatus] = useState("");
  const [growing, setGrowing] = useState<string[]>([]);
  const [growingOther, setGrowingOther] = useState("");
  const [notes, setNotes] = useState("");
  const [emailConsent, setEmailConsent] = useState(false);
  const [rulesConsent, setRulesConsent] = useState(false);
  const [followed, setFollowed] = useState<FollowedState>(emptyFollowed);
  const [website, setWebsite] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    trackEvent("Giveaway Page Viewed", { source: GIVEAWAY_DRAFT.source, preview: !entriesOpen });
    return () => {
      Object.values(followTimers.current).forEach((timer) => {
        if (timer) window.clearTimeout(timer);
      });
    };
  }, [entriesOpen]);

  const goToEntryPreview = () => {
    document.getElementById("entry-preview")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  function toggleGrowing(value: string) {
    setGrowing((current) => (
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    ));
  }

  function markFollowed(key: SocialKey) {
    setFollowed((current) => ({ ...current, [key]: true }));
  }

  function handleFollowClick(key: SocialKey) {
    trackEvent("Giveaway Follow Clicked", { channel: key, source: GIVEAWAY_DRAFT.source });
    if (followTimers.current[key]) window.clearTimeout(followTimers.current[key]);
    followTimers.current[key] = window.setTimeout(() => markFollowed(key), 1500);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!entriesOpen) {
      setError(GIVEAWAY_ENTRIES_CLOSED_MESSAGE);
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/giveaway/enter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          zipCode,
          customerType,
          gardenStatus,
          growing,
          growingOther,
          notes,
          emailConsent,
          rulesConsent,
          followed,
          website,
          source: GIVEAWAY_DRAFT.source,
        }),
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error || GIVEAWAY_ENTRIES_CLOSED_MESSAGE);
      }
    } catch (submitError: any) {
      setError(submitError?.message || "Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

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
              No entries are being collected while prize details, rules, eligibility, timing, and privacy
              terms are pending approval.
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
          <div className="mx-auto max-w-3xl rounded-[1.75rem] bg-[#173d25] p-5 text-white shadow-xl sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#f5bb45]">Registration preview</p>
            <h2 className="mt-2 font-heading text-3xl font-black leading-tight sm:text-4xl">
              {GIVEAWAY_DRAFT.form.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#d8e2da]">{GIVEAWAY_DRAFT.form.intro}</p>

            <form
              onSubmit={submit}
              noValidate
              aria-label="Giveaway registration preview"
              className="mt-6 rounded-2xl bg-[#fffdf8] p-4 text-[#173d25] sm:p-6"
            >
              <div className="grid gap-4">
                <label className="text-sm font-black" htmlFor="giveaway-name">
                  Full name
                  <input
                    id="giveaway-name"
                    name="fullName"
                    autoComplete="name"
                    maxLength={120}
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    className={FIELD_CLASS}
                  />
                </label>
                <label className="text-sm font-black" htmlFor="giveaway-email">
                  Email
                  <input
                    id="giveaway-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    maxLength={254}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className={FIELD_CLASS}
                  />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-black" htmlFor="giveaway-phone">
                    Phone
                    <input
                      id="giveaway-phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      inputMode="tel"
                      maxLength={30}
                      placeholder="(623) 555-0123"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      className={FIELD_CLASS}
                    />
                  </label>
                  <label className="text-sm font-black" htmlFor="giveaway-zip">
                    ZIP code
                    <input
                      id="giveaway-zip"
                      name="zip"
                      autoComplete="postal-code"
                      inputMode="numeric"
                      maxLength={10}
                      placeholder="85009"
                      value={zipCode}
                      onChange={(event) => setZipCode(event.target.value)}
                      className={FIELD_CLASS}
                    />
                  </label>
                </div>

                <fieldset>
                  <legend className="mb-2 text-sm font-black">Who are you?</legend>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {GIVEAWAY_DRAFT.form.customerTypes.map(([value, label]) => (
                      <ChoiceButton
                        key={value}
                        selected={customerType === value}
                        onClick={() => setCustomerType(value)}
                      >
                        {label}
                      </ChoiceButton>
                    ))}
                  </div>
                </fieldset>

                <fieldset>
                  <legend className="mb-2 text-sm font-black">New or existing garden?</legend>
                  <div className="grid grid-cols-2 gap-2">
                    {GIVEAWAY_DRAFT.form.gardenStatuses.map(([value, label]) => (
                      <ChoiceButton
                        key={value}
                        selected={gardenStatus === value}
                        onClick={() => setGardenStatus(value)}
                      >
                        {label}
                      </ChoiceButton>
                    ))}
                  </div>
                </fieldset>

                <fieldset>
                  <legend className="mb-2 text-sm font-black">What are you growing?</legend>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {GIVEAWAY_DRAFT.form.growingOptions.map(([value, label]) => (
                      <ChoiceButton
                        key={value}
                        selected={growing.includes(value)}
                        onClick={() => toggleGrowing(value)}
                      >
                        {label}
                      </ChoiceButton>
                    ))}
                  </div>
                  <label className="mt-3 block text-sm font-black" htmlFor="giveaway-growing-other">
                    Other <span className="font-normal text-[#6d756f]">(optional)</span>
                    <input
                      id="giveaway-growing-other"
                      name="growingOther"
                      maxLength={80}
                      placeholder="Figs, grapes"
                      value={growingOther}
                      onChange={(event) => setGrowingOther(event.target.value)}
                      className={FIELD_CLASS}
                    />
                  </label>
                </fieldset>

                <label className="text-sm font-black" htmlFor="giveaway-notes">
                  Anything else we should know? <span className="font-normal text-[#6d756f]">(optional)</span>
                  <textarea
                    id="giveaway-notes"
                    name="notes"
                    maxLength={500}
                    rows={4}
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    className={`${FIELD_CLASS} min-h-[96px] py-3`}
                  />
                </label>

                <fieldset className="rounded-2xl border border-[#d7cebd] bg-white p-4">
                  <legend className="px-1 text-sm font-black">{GIVEAWAY_DRAFT.form.followCopy}</legend>
                  <p className="mt-1 text-xs font-semibold leading-5 text-[#6d756f]">
                    We cannot follow accounts for you. Tap Follow, then check the box.
                  </p>
                  <ul className="mt-3 space-y-2">
                    {GIVEAWAY_DRAFT.form.socialChannels.map((channel) => (
                      <li
                        key={channel.key}
                        className="flex items-center gap-2 rounded-xl border border-[#d7cebd] bg-[#f4efe2] p-2 sm:gap-3 sm:p-2.5"
                      >
                        <a
                          href={channel.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => handleFollowClick(channel.key)}
                          className="inline-flex min-h-11 min-w-[5.75rem] items-center justify-center gap-1 rounded-full bg-[#173d25] px-3 text-sm font-black text-white"
                        >
                          Follow
                          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                        </a>
                        <span className="min-w-0 flex-1 text-sm font-bold leading-5">{channel.label}</span>
                        <label className="grid h-11 w-11 shrink-0 cursor-pointer place-items-center">
                          <span className="sr-only">I followed {channel.label}</span>
                          <input
                            type="checkbox"
                            checked={followed[channel.key]}
                            onChange={(event) => setFollowed((current) => ({
                              ...current,
                              [channel.key]: event.target.checked,
                            }))}
                            className="h-5 w-5 accent-[#173d25]"
                          />
                        </label>
                      </li>
                    ))}
                  </ul>
                </fieldset>

                <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-[#f4efe2] p-4 text-sm leading-6">
                  <input
                    type="checkbox"
                    checked={emailConsent}
                    onChange={(event) => setEmailConsent(event.target.checked)}
                    className="mt-0.5 h-5 w-5 shrink-0 accent-[#173d25]"
                  />
                  <span>{GIVEAWAY_DRAFT.form.emailConsent}</span>
                </label>
                <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-[#f4efe2] p-4 text-sm leading-6">
                  <input
                    type="checkbox"
                    checked={rulesConsent}
                    onChange={(event) => setRulesConsent(event.target.checked)}
                    className="mt-0.5 h-5 w-5 shrink-0 accent-[#173d25]"
                  />
                  <span>{GIVEAWAY_DRAFT.form.rulesConsent}</span>
                </label>

                <div className="hidden" aria-hidden="true">
                  <label htmlFor="giveaway-website">Website</label>
                  <input
                    id="giveaway-website"
                    name="website"
                    value={website}
                    onChange={(event) => setWebsite(event.target.value)}
                    tabIndex={-1}
                    autoComplete="off"
                  />
                </div>
              </div>

              {error ? (
                <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={!entriesOpen || submitting}
                aria-disabled={!entriesOpen || submitting}
                className="mt-4 flex min-h-14 w-full cursor-not-allowed items-center justify-center gap-2 rounded-full bg-[#d8d2c4] px-5 font-black text-[#6c716d]"
              >
                <LockKeyhole className="h-4 w-4" aria-hidden="true" />
                Entries open after approval
              </button>
              <p className="mt-3 text-center text-xs font-semibold leading-5 text-[#6d756f]">
                Submit is off while this page is in draft preview. Official rules, dates, and prize details are still pending approval.
              </p>
            </form>
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

function ChoiceButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`min-h-12 rounded-xl border px-3 text-sm font-bold ${
        selected
          ? "border-[#173d25] bg-[#173d25] text-white"
          : "border-[#c8cfc8] bg-white text-[#173d25]"
      }`}
    >
      {children}
    </button>
  );
}
