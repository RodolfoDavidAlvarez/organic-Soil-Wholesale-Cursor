import { FormEvent, useState, type ReactNode } from "react";
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

const FIELD_CLASS =
  "h-12 min-h-12 w-full rounded-xl border-[#d7dfd0] bg-white text-base";
const TEXTAREA_CLASS =
  "min-h-[96px] w-full rounded-xl border-[#d7dfd0] bg-white text-base leading-6";

type Choice = "yes" | "no" | "not-sure" | "";

type SurveyCoupon = {
  code: string;
  label: string;
  offer: string;
  restrictions: string;
  firstName: string;
  email: string;
  issuedAt: string;
  expiresAt: string;
  qrUrl: string;
  reused?: boolean;
};

function phoenixDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    timeZone: "America/Phoenix",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function surveySource() {
  if (typeof window === "undefined") return "osw-survey";
  const tag = new URLSearchParams(window.location.search).get("source");
  return tag ? `osw-survey:${tag.slice(0, 80)}` : "osw-survey";
}

export default function ClientSurvey() {
  usePhoneNumberLock({ selector: "[data-phone-number]" });
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [visitFeedback, setVisitFeedback] = useState("");
  const [whatFeltEasy, setWhatFeltEasy] = useState("");
  const [whatFeltConfusing, setWhatFeltConfusing] = useState("");
  const [whatToAddNext, setWhatToAddNext] = useState("");
  const [wouldComeBack, setWouldComeBack] = useState<Choice>("");
  const [wouldSendFriend, setWouldSendFriend] = useState<Choice>("");
  const [website, setWebsite] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [coupon, setCoupon] = useState<SurveyCoupon | null>(null);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/survey/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          email,
          phone,
          visitFeedback,
          whatFeltEasy,
          whatFeltConfusing,
          whatToAddNext,
          wouldComeBack,
          wouldSendFriend,
          website,
          source: surveySource(),
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "We could not save your answers.");
      trackEvent("Client Survey Submitted", { source: surveySource() });
      setCoupon(body.coupon || null);
      setSuccess(true);
    } catch (submitError: any) {
      setError(submitError?.message || "Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f8f9fa] text-[#264027]">
      <Helmet>
        <title>How did we do? | Organic Soil Wholesale</title>
        <meta
          name="description"
          content="Tell Organic Soil Wholesale how your Phoenix yard visit or order felt. Short, honest feedback. Under a minute."
        />
        <link rel="canonical" href="https://www.organicsoilwholesale.com/survey" />
      </Helmet>

      <section className="bg-[#264027] px-5 py-10 text-white">
        <div className="mx-auto max-w-md">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#b38a58]">A minute of truth</p>
          <h1 className="mt-3 font-heading text-3xl font-bold leading-tight">How did the yard feel?</h1>
          <p className="mt-4 text-base leading-7 text-white/90">
            We owe you an apology. We opened the Phoenix yard and did not stop to ask how it felt. This takes under a minute. We want the truth.
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
                Your note lands with the yard team, not a marketing list. If we need a follow-up, we will use the email you left.
              </p>
              {coupon ? (
                <p className="mt-3 text-base font-semibold leading-7 text-[#264027]">
                  Show this at the yard.
                </p>
              ) : null}
            </div>

            {coupon ? <SurveyCouponCard coupon={coupon} /> : null}

            <p className="text-sm leading-6 text-neutral-600">
              If you have not claimed a free 9 lb bag of worm castings yet, that offer is still live through August 31.
            </p>
            <a
              href="https://www.organicsoilwholesale.com/free-worm-castings"
              className="inline-flex min-h-11 items-center text-base font-bold text-[#264027] underline"
            >
              Free worm castings
            </a>
            <p className="text-sm leading-6 text-neutral-700">
              Rodo Alvarez
              <br />
              Soil Seed and Water
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-5">
            <p className="text-base leading-7 text-neutral-700">
              Honest notes help us run Organic Soil Wholesale the way a landscaper would want it run. Keep, cut, or add. Say it straight.
            </p>
            <p className="text-sm leading-6 text-neutral-600">
              Finish this and we'll give you 30% off one item at the yard.
            </p>

            <Field label="First name" htmlFor="survey-first-name" required>
              <Input
                id="survey-first-name"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                autoComplete="given-name"
                required
                maxLength={80}
                className={FIELD_CLASS}
              />
            </Field>

            <Field label="Email" htmlFor="survey-email" required>
              <Input
                id="survey-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                inputMode="email"
                required
                maxLength={254}
                className={FIELD_CLASS}
              />
            </Field>

            <Field label="Phone" htmlFor="survey-phone" hint="Optional">
              <Input
                id="survey-phone"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                autoComplete="tel"
                inputMode="tel"
                maxLength={30}
                placeholder={CUSTOMER_SUPPORT_PHONE_DISPLAY}
                className={FIELD_CLASS}
              />
            </Field>

            <Field label="How was your visit or order?" htmlFor="survey-q1" required>
              <Textarea
                id="survey-q1"
                value={visitFeedback}
                onChange={(event) => setVisitFeedback(event.target.value)}
                required
                maxLength={500}
                className={TEXTAREA_CLASS}
              />
            </Field>

            <Field label="What felt easy?" htmlFor="survey-q2">
              <Textarea
                id="survey-q2"
                value={whatFeltEasy}
                onChange={(event) => setWhatFeltEasy(event.target.value)}
                maxLength={500}
                className={TEXTAREA_CLASS}
              />
            </Field>

            <Field label="What felt confusing or slow?" htmlFor="survey-q3">
              <Textarea
                id="survey-q3"
                value={whatFeltConfusing}
                onChange={(event) => setWhatFeltConfusing(event.target.value)}
                maxLength={500}
                className={TEXTAREA_CLASS}
              />
            </Field>

            <Field
              label="What should we add next?"
              htmlFor="survey-q4"
              hint="Products, hours, classes, delivery"
            >
              <Textarea
                id="survey-q4"
                value={whatToAddNext}
                onChange={(event) => setWhatToAddNext(event.target.value)}
                maxLength={500}
                className={TEXTAREA_CLASS}
              />
            </Field>

            <ChoiceRow
              legend="Would you come back?"
              value={wouldComeBack}
              onChange={setWouldComeBack}
            />
            <ChoiceRow
              legend="Would you send a friend?"
              value={wouldSendFriend}
              onChange={setWouldSendFriend}
            />

            <div className="hidden" aria-hidden="true">
              <label htmlFor="survey-website">Website</label>
              <Input
                id="survey-website"
                name="website"
                value={website}
                onChange={(event) => setWebsite(event.target.value)}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            {error && (
              <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={submitting}
              className="h-14 w-full rounded-xl bg-[#264027] text-base font-bold text-white hover:bg-[#1d301e]"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send my answers"
              )}
            </Button>
            <p className="text-center text-xs leading-5 text-neutral-500">
              Submitting this form does not sign you up for emails.
            </p>
          </form>
        )}
      </section>

      <footer className="border-t border-[#d7dfd0] bg-white px-5 py-8">
        <div className="mx-auto max-w-md space-y-3 text-sm leading-6 text-neutral-700">
          <p className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#b38a58]" />
            <span>
              Organic Soil Wholesale
              <br />
              {PHOENIX_YARD_ADDRESS}
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
      </footer>
    </main>
  );
}

function SurveyCouponCard({ coupon }: { coupon: SurveyCoupon }) {
  const issued = phoenixDate(coupon.issuedAt);
  const expires = phoenixDate(coupon.expiresAt);
  return (
    <article className="overflow-hidden rounded-2xl border-2 border-[#b38a58] bg-white text-[#264027] shadow-sm print:border print:shadow-none">
      <div className="bg-[#264027] px-5 py-5 text-center text-white">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#b38a58]">
          Soil Seed &amp; Water
        </p>
        <p className="mt-1 text-sm font-semibold text-white/85">Organic Soil Wholesale</p>
        <p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-[#b38a58]">
          {coupon.label}
        </p>
        <h3 className="mt-2 font-heading text-3xl font-bold leading-tight">30% off</h3>
        <p className="mt-2 text-base font-semibold leading-6">{coupon.offer}</p>
      </div>

      <div className="px-5 py-5 text-center">
        <img
          src={coupon.qrUrl}
          alt={`Yard coupon ${coupon.code}`}
          className="mx-auto w-full max-w-[220px] rounded-xl border border-[#d7dfd0] bg-white p-3"
        />
        <p className="mt-3 break-all font-mono text-lg font-bold tracking-wide">{coupon.code}</p>
        <dl className="mt-4 space-y-2 rounded-xl bg-[#f6f8f3] px-4 py-4 text-left text-sm leading-6">
          <div>
            <dt className="text-xs font-bold uppercase tracking-[0.14em] text-[#b38a58]">Name</dt>
            <dd className="font-semibold">{coupon.firstName}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-[0.14em] text-[#b38a58]">Email</dt>
            <dd className="break-all font-semibold">{coupon.email}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-[0.14em] text-[#b38a58]">Date</dt>
            <dd className="font-semibold">{issued}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-[0.14em] text-[#b38a58]">Valid through</dt>
            <dd className="font-semibold">{expires}</dd>
          </div>
        </dl>
        <p className="mt-4 text-sm font-semibold leading-6">
          Phoenix yard pickup · {PHOENIX_YARD_ADDRESS}
        </p>
        <p className="mt-2 text-sm leading-6 text-neutral-600">{coupon.restrictions}</p>
        {coupon.reused ? (
          <p className="mt-3 text-xs leading-5 text-neutral-500">
            This is the same yard coupon from your first survey.
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => window.print()}
          className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-[#264027] bg-white px-4 text-sm font-bold text-[#264027] print:hidden"
        >
          Print or screenshot this card
        </button>
      </div>
    </article>
  );
}

function Field({
  label,
  htmlFor,
  required,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-2 block text-sm font-semibold text-[#264027]">
        {label}
        {required ? <span className="text-[#b38a58]"> *</span> : null}
        {hint ? <span className="ml-2 font-normal text-neutral-500">{hint}</span> : null}
      </label>
      {children}
    </div>
  );
}

function ChoiceRow({
  legend,
  value,
  onChange,
}: {
  legend: string;
  value: Choice;
  onChange: (next: Choice) => void;
}) {
  const options: Array<[Choice, string]> = [
    ["yes", "Yes"],
    ["no", "No"],
    ["not-sure", "Not sure"],
  ];
  return (
    <fieldset>
      <legend className="mb-2 block text-sm font-semibold text-[#264027]">{legend}</legend>
      <div className="grid grid-cols-3 gap-2">
        {options.map(([option, label]) => {
          const selected = value === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              aria-pressed={selected}
              className={`min-h-12 rounded-xl border px-2 text-sm font-bold ${
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
