import { FormEvent, useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { CheckCircle2, Loader2, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  CUSTOMER_SUPPORT_PHONE_DIAL,
  CUSTOMER_SUPPORT_PHONE_DISPLAY,
  CUSTOMER_SUPPORT_PHONE_TEL,
  PHOENIX_YARD_ADDRESS,
} from "@/config/contact";
import { usePhoneNumberLock } from "@/hooks/usePhoneNumberLock";
import { trackEvent } from "@/lib/analytics";
import {
  GARDEN_CLASS_EVENT_KEY,
  GARDEN_CLASS_SURVEY_SOURCE,
  readGardenClassSurveyPrefill,
} from "@shared/surveySources.js";

const FIELD_CLASS = "h-12 min-h-12 w-full rounded-xl border-[#d7dfd0] bg-white text-base";
const TEXTAREA_CLASS = "min-h-[120px] w-full rounded-xl border-[#d7dfd0] bg-white text-base leading-6";
const YARD_HOURS = "Tue-Sat, 8 AM-4 PM, closed 1-2 PM";

const COME_AGAIN_OPTIONS = [
  ["yes", "Yes"],
  ["maybe", "Maybe"],
  ["no", "No"],
] as const;

function scoreWord(n: number, low: string, high: string) {
  if (n <= 3) return low;
  if (n >= 8) return high;
  return "in the middle";
}

export default function GardenClassSurvey() {
  usePhoneNumberLock({ selector: "[data-phone-number]" });
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [saturday, setSaturday] = useState<number | null>(null);
  const [heat, setHeat] = useState<number | null>(null);
  const [teaching, setTeaching] = useState<number | null>(null);
  const [comeAgain, setComeAgain] = useState("");
  const [notes, setNotes] = useState("");
  const [website, setWebsite] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const prefill = readGardenClassSurveyPrefill(window.location.search);
    if (prefill.firstName) setFirstName((current) => current || prefill.firstName);
    if (prefill.email) setEmail((current) => current || prefill.email);
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (saturday == null || heat == null || teaching == null || !comeAgain) {
      setError("Please slide each score and tell us if you would come again.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/survey/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          email,
          notes,
          saturday,
          heat,
          teaching,
          comeAgain,
          saturdayFeel: saturday,
          website,
          source: GARDEN_CLASS_SURVEY_SOURCE,
          eventKey: GARDEN_CLASS_EVENT_KEY,
          scores: { saturday, heat, teaching, comeAgain },
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "We could not save your notes.");
      trackEvent("Garden Class Survey Submitted", { source: GARDEN_CLASS_SURVEY_SOURCE });
      setSuccess(true);
    } catch (submitError: unknown) {
      setError(submitError instanceof Error ? submitError.message : "Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f0e3] text-[#243126]">
      <Helmet>
        <title>How did Saturday feel? | The Garden Reset</title>
        <meta
          name="description"
          content="Honest notes on The Garden Reset at Organic Soil Wholesale. For people who registered or came on Saturday, August 22."
        />
        <link rel="canonical" href="https://www.organicsoilwholesale.com/survey/garden-class" />
      </Helmet>

      <section className="bg-[#264027] px-5 py-11 text-white">
        <div className="mx-auto max-w-md">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d7b77d]">The Garden Reset</p>
          <h1 className="mt-3 font-heading text-3xl font-bold leading-tight">How did Saturday feel?</h1>
          <p className="mt-4 text-base leading-7 text-white/90">
            We are landscapers running a garden shop. Saturday was our first class. We want the truth. There is no coupon and no pitch.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-md px-5 py-8">
        {success ? (
          <div className="space-y-5">
            <div className="rounded-2xl border border-[#d7dfd0] bg-white p-6 shadow-sm">
              <CheckCircle2 className="mb-4 h-12 w-12 text-[#264027]" />
              <h2 className="font-heading text-2xl font-bold">Thank you. We read these.</h2>
              <p className="mt-3 text-base leading-7 text-neutral-700">
                Come back to the yard anytime. We would like to see you again.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-7">
            <p className="text-base leading-7 text-neutral-700">
              Name and email first so we know who wrote this. Change them if they are not you. Then slide what is true.
            </p>

            <div className="grid gap-4 rounded-2xl border border-[#d7dfd0] bg-white p-5 shadow-sm">
              <div>
                <label htmlFor="class-survey-first-name" className="mb-2 block text-sm font-semibold text-[#264027]">
                  First name
                </label>
                <Input
                  id="class-survey-first-name"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  onFocus={(event) => event.currentTarget.select()}
                  autoComplete="given-name"
                  required
                  maxLength={80}
                  className={FIELD_CLASS}
                />
              </div>
              <div>
                <label htmlFor="class-survey-email" className="mb-2 block text-sm font-semibold text-[#264027]">
                  Email
                </label>
                <Input
                  id="class-survey-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  onFocus={(event) => event.currentTarget.select()}
                  autoComplete="email"
                  inputMode="email"
                  required
                  maxLength={254}
                  className={FIELD_CLASS}
                />
              </div>
            </div>

            <ScoreSlider
              id="class-survey-saturday"
              legend="How did Saturday feel?"
              lowLabel="rough"
              highLabel="great"
              value={saturday}
              onChange={setSaturday}
            />
            <ScoreSlider
              id="class-survey-heat"
              legend="Was it too hot?"
              lowLabel="way too hot"
              highLabel="comfortable"
              value={heat}
              onChange={setHeat}
            />
            <ScoreSlider
              id="class-survey-teaching"
              legend="How was the teaching?"
              lowLabel="lost me"
              highLabel="loved it"
              value={teaching}
              onChange={setTeaching}
            />

            <ChipRow legend="Would you come to another class?" value={comeAgain} onChange={setComeAgain} options={COME_AGAIN_OPTIONS} />

            <div>
              <label htmlFor="class-survey-notes" className="mb-2 block text-sm font-semibold text-[#264027]">
                Anything else you want us to hear?
              </label>
              <Textarea
                id="class-survey-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                maxLength={500}
                className={TEXTAREA_CLASS}
              />
            </div>

            <div className="hidden" aria-hidden="true">
              <label htmlFor="class-survey-website">Website</label>
              <Input
                id="class-survey-website"
                name="website"
                value={website}
                onChange={(event) => setWebsite(event.target.value)}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            {error ? (
              <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            ) : null}

            <Button
              type="submit"
              disabled={submitting}
              className="h-14 min-h-14 w-full rounded-xl bg-[#264027] text-base font-bold text-white hover:bg-[#1d301e]"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send my notes"
              )}
            </Button>
          </form>
        )}
      </section>

      <footer className="border-t border-[#d7dfd0] bg-white px-5 py-8">
        <div className="mx-auto max-w-md">
          <YardInvite />
        </div>
      </footer>
    </main>
  );
}

function YardInvite() {
  return (
    <div className="space-y-3 text-sm leading-6 text-neutral-700">
      <p className="flex items-start gap-2">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#b38a58]" />
        <span>
          Organic Soil Wholesale
          <br />
          {PHOENIX_YARD_ADDRESS}
          <br />
          {YARD_HOURS}
        </span>
      </p>
      <p>
        <a
          href={CUSTOMER_SUPPORT_PHONE_TEL}
          data-phone-number={CUSTOMER_SUPPORT_PHONE_DIAL}
          data-official-support-phone="true"
          data-callrail-ignore="true"
          data-dynamic-number-ignore="true"
          data-call-tracking-ignore="true"
          aria-label={`Call ${CUSTOMER_SUPPORT_PHONE_DISPLAY}`}
          className="no-call-tracking inline-flex min-h-11 min-w-11 items-center gap-2 font-bold text-[#264027]"
        >
          <Phone className="h-4 w-4" />
          <span data-official-support-phone-text="true">{CUSTOMER_SUPPORT_PHONE_DISPLAY}</span>
        </a>
      </p>
    </div>
  );
}

function ScoreSlider({
  id,
  legend,
  lowLabel,
  highLabel,
  value,
  onChange,
}: {
  id: string;
  legend: string;
  lowLabel: string;
  highLabel: string;
  value: number | null;
  onChange: (next: number) => void;
}) {
  const visual = value ?? 5;
  const selected = value != null;
  const pct = ((visual - 1) / 9) * 100;
  const label = selected ? scoreWord(value, lowLabel, highLabel) : "Slide to choose";

  return (
    <fieldset className="rounded-2xl border border-[#d7dfd0] bg-white p-5 shadow-sm">
      <legend className="float-left mb-4 w-full px-0 text-base font-semibold text-[#264027]">{legend}</legend>
      <div className="clear-both text-center">
        <p
          className={`font-heading text-5xl font-bold tabular-nums leading-none ${
            selected ? "text-[#264027]" : "text-[#264027]/20"
          }`}
        >
          {selected ? value : visual}
        </p>
        <p className={`mt-2 min-h-5 text-sm font-semibold ${selected ? "text-[#b38a58]" : "text-neutral-400"}`}>
          {label}
        </p>
      </div>
      <div className="relative mt-6 h-11">
        <div className="pointer-events-none absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[#d7dfd0]" />
        <div
          className="pointer-events-none absolute left-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[#264027]"
          style={{ width: selected ? `${pct}%` : 0 }}
        />
        <input
          id={id}
          type="range"
          min={1}
          max={10}
          step={1}
          value={visual}
          aria-valuemin={1}
          aria-valuemax={10}
          aria-valuenow={selected ? value : undefined}
          aria-valuetext={selected ? `${value} of 10, ${label}` : "Not set yet"}
          aria-label={legend}
          onChange={(event) => onChange(Number(event.target.value))}
          onPointerUp={() => {
            if (value == null) onChange(visual);
          }}
          className={`garden-score-slider absolute inset-0 w-full ${selected ? "is-set" : ""}`}
        />
      </div>
      <div className="mt-3 flex justify-between gap-3 text-xs font-semibold leading-4 text-neutral-600">
        <span>1 {lowLabel}</span>
        <span className="text-right">10 {highLabel}</span>
      </div>
      <div className="mt-1 flex justify-between">
        {Array.from({ length: 10 }, (_, index) => {
          const n = index + 1;
          const active = selected && value === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              aria-label={`${n}, ${legend}`}
              className={`min-h-11 min-w-[1.35rem] text-[11px] font-semibold tabular-nums ${
                active ? "text-[#264027]" : "text-neutral-400"
              }`}
            >
              {n}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function ChipRow({
  legend,
  value,
  onChange,
  options,
}: {
  legend: string;
  value: string;
  onChange: (next: string) => void;
  options: ReadonlyArray<readonly [string, string]>;
}) {
  return (
    <fieldset>
      <legend className="mb-2 block text-sm font-semibold text-[#264027]">{legend}</legend>
      <div className="grid grid-cols-3 gap-1.5">
        {options.map(([option, label]) => {
          const selected = value === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              aria-pressed={selected}
              className={`flex h-9 min-h-9 items-center justify-center rounded-lg border px-1.5 text-sm font-bold leading-none whitespace-nowrap ${
                selected
                  ? "border-[#264027] bg-[#264027] text-white"
                  : "border-[#d7dfd0] bg-white text-[#264027]"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
