import { useRef, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, ArrowRight, CheckCircle2, ClipboardCheck, FileText, Laptop, Leaf, MapPin, Sprout, Upload, Users } from "lucide-react";
import SEO from "@/components/layout/SEO";
import { supabase } from "@/lib/supabase";
import { trackEvent } from "@/lib/analytics";

const POSITION_SLUG = "sales-representative";
const APPLICATION_SOURCE = "www.organicsoilwholesale.com/careers/sales";
const APPLICATION_URL = `https://${APPLICATION_SOURCE}`;
const RESUME_BUCKET = "job-applications";
const MAX_FILE_BYTES = 8 * 1024 * 1024;
const MAX_SUPPORTING_FILES = 5;
const ACCEPTED_RESUME_EXTENSIONS = new Set(["pdf", "doc", "docx"]);
const ACCEPTED_SUPPORTING_EXTENSIONS = new Set(["pdf", "doc", "docx", "jpg", "jpeg", "png"]);
const FILE_CONTENT_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
};

const APPLICATION_STEPS = [
  { number: 1, title: "Basics", shortTitle: "Basics", icon: ClipboardCheck },
  { number: 2, title: "Gardening experience", shortTitle: "Gardening", icon: Sprout },
  { number: 3, title: "Computer & sales skills", shortTitle: "Skills", icon: Laptop },
] as const;

const gardeningFocusOptions = [
  "Home gardening",
  "Professional growing or farming",
  "Landscaping or plant care",
  "Nursery, greenhouse, or garden center",
  "Composting or worm farming",
  "Organic growing",
  "Soil biology or soil health",
  "Indoor growing or hydroponics",
  "Used Soil Seed & Water products",
];

const computerSkillOptions = [
  "Email and digital calendars",
  "Data entry and online forms",
  "Spreadsheets",
  "CRM or lead-tracking software",
  "Point-of-sale or order-entry systems",
  "E-commerce or shipping portals",
  "Video meetings",
  "Social media and direct messages",
  "AI productivity tools",
];

type SubmitStatus = "idle" | "uploading" | "saving" | "sent" | "error";

type UploadedDocument = {
  name: string;
  size: number;
  contentType: string;
  path: string;
};

class ApplicationApiError extends Error {
  code: string;

  constructor(message: string, code = "application_failed") {
    super(message);
    this.code = code;
  }
}

type ApplicationForm = {
  firstName: string;
  lastName: string;
  preferredName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  linkedInUrl: string;
  employmentInterest: string;
  phoenixAvailability: string;
  reliableTransportation: string;
  workAuthorization: string;
  earliestStartDate: string;
  compensationExpectation: string;
  salesExperienceYears: string;
  salesBackground: string;
  gardeningExperienceYears: string;
  gardeningFocus: string[];
  plantsGrown: string;
  organicPractices: string;
  productExperience: string;
  whySsw: string;
  soilKnowledge: string;
  computerProficiency: string;
  computerSkills: string[];
  softwareTools: string;
  computerTaskExample: string;
  salesExample: string;
  referralSource: string;
  certification: boolean;
};

const initialForm: ApplicationForm = {
  firstName: "",
  lastName: "",
  preferredName: "",
  email: "",
  phone: "",
  city: "",
  state: "AZ",
  linkedInUrl: "",
  employmentInterest: "",
  phoenixAvailability: "",
  reliableTransportation: "",
  workAuthorization: "",
  earliestStartDate: "",
  compensationExpectation: "",
  salesExperienceYears: "",
  salesBackground: "",
  gardeningExperienceYears: "",
  gardeningFocus: [],
  plantsGrown: "",
  organicPractices: "",
  productExperience: "",
  whySsw: "",
  soilKnowledge: "",
  computerProficiency: "",
  computerSkills: [],
  softwareTools: "",
  computerTaskExample: "",
  salesExample: "",
  referralSource: "",
  certification: false,
};

const inputClass =
  "min-h-12 w-full rounded-xl border border-[#d9e1db] bg-white px-4 py-3 text-base text-[#183a23] outline-none transition placeholder:text-slate-400 focus:border-[#397854] focus:ring-2 focus:ring-[#397854]/20 md:text-sm";
const labelClass = "mb-2 block text-sm font-semibold text-[#183a23]";
const cardClass = "rounded-3xl border border-[#dfe7e1] bg-white p-5 shadow-sm sm:p-8";
const fileContentType = (file: File) => {
  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  return FILE_CONTENT_TYPES[extension] || file.type;
};

const CareersSales = () => {
  const formRef = useRef<HTMLFormElement>(null);
  const applicationIdRef = useRef(crypto.randomUUID());
  const uploadedDocumentsRef = useRef(new Map<string, UploadedDocument>());
  const [form, setForm] = useState<ApplicationForm>(initialForm);
  const [resume, setResume] = useState<File | null>(null);
  const [supportingDocuments, setSupportingDocuments] = useState<File[]>([]);
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [currentStep, setCurrentStep] = useState(1);

  const postJson = async <T,>(url: string, body: unknown): Promise<T> => {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new ApplicationApiError(
        typeof result?.error === "string" ? result.error : "We could not submit your application. Please try again.",
        typeof result?.code === "string" ? result.code : "application_failed",
      );
    }
    return result as T;
  };

  const resetUploadSession = (requestCleanup = false) => {
    const applicationId = applicationIdRef.current;
    if (requestCleanup && uploadedDocumentsRef.current.size) {
      void fetch("/api/job-applications/cleanup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId }),
      }).catch(() => undefined);
    }
    applicationIdRef.current = crypto.randomUUID();
    uploadedDocumentsRef.current.clear();
  };

  const update = (field: keyof ApplicationForm, value: string | boolean | string[]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const toggleListItem = (field: "gardeningFocus" | "computerSkills", option: string) => {
    const selected = form[field];
    update(
      field,
      selected.includes(option)
        ? selected.filter((item) => item !== option)
        : [...selected, option],
    );
  };

  const scrollToApplication = () => {
    window.requestAnimationFrame(() => {
      document.getElementById("apply")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const validateCurrentStep = () => {
    setErrorMessage("");

    const stepContainer = formRef.current?.querySelector<HTMLElement>(`[data-application-step="${currentStep}"]`);
    const fields = Array.from(
      stepContainer?.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
        "input:not([type='hidden']), select, textarea",
      ) ?? [],
    );
    const invalidField = fields.find((field) => !field.checkValidity());

    if (invalidField) {
      invalidField.reportValidity();
      invalidField.focus();
      return false;
    }

    if (currentStep === 1 && !resume) {
      setErrorMessage("Please attach your resume before continuing.");
      document.getElementById("resume")?.focus();
      return false;
    }
    if (currentStep === 2 && form.gardeningFocus.length === 0) {
      setErrorMessage("Please select at least one gardening focus area before continuing.");
      return false;
    }
    if (currentStep === 3 && form.computerSkills.length === 0) {
      setErrorMessage("Please select at least one computer skill.");
      return false;
    }

    return true;
  };

  const goToNextStep = () => {
    if (!validateCurrentStep()) return;

    // Some mobile/native controls (especially date inputs) can update their
    // displayed value before React receives the final change event. Capture
    // every basic field directly before this step unmounts.
    if (currentStep === 1 && formRef.current) {
      const value = (id: string) => formRef.current?.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(`#${id}`)?.value ?? "";
      setForm((current) => ({
        ...current,
        firstName: value("firstName"),
        lastName: value("lastName"),
        preferredName: value("preferredName"),
        email: value("email"),
        phone: value("phone"),
        city: value("city"),
        state: value("state"),
        linkedInUrl: value("linkedInUrl"),
        employmentInterest: value("employmentInterest"),
        phoenixAvailability: value("phoenixAvailability"),
        reliableTransportation: value("reliableTransportation"),
        workAuthorization: value("workAuthorization"),
        earliestStartDate: value("earliestStartDate"),
        compensationExpectation: value("compensationExpectation"),
        salesExperienceYears: value("salesExperienceYears"),
        salesBackground: value("salesBackground"),
        whySsw: value("whySsw"),
        referralSource: value("referralSource"),
      }));
    }

    trackEvent("Recruitment Application Step Completed", {
      position: POSITION_SLUG,
      step: currentStep,
    });
    setCurrentStep((step) => Math.min(step + 1, APPLICATION_STEPS.length));
    scrollToApplication();
  };

  const goToPreviousStep = () => {
    setErrorMessage("");
    setCurrentStep((step) => Math.max(step - 1, 1));
    scrollToApplication();
  };

  const handleResume = (file: File | null) => {
    setErrorMessage("");
    resetUploadSession(true);
    if (!file) {
      setResume(null);
      return;
    }

    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!extension || !ACCEPTED_RESUME_EXTENSIONS.has(extension)) {
      setResume(null);
      setErrorMessage("Please upload a PDF, DOC, or DOCX resume.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setResume(null);
      setErrorMessage("The resume must be 8 MB or smaller.");
      return;
    }
    setResume(file);
  };

  const handleSupportingDocuments = (files: FileList | null) => {
    setErrorMessage("");
    resetUploadSession(true);
    if (!files) {
      setSupportingDocuments([]);
      return;
    }

    const selected = Array.from(files);
    if (selected.length > MAX_SUPPORTING_FILES) {
      setSupportingDocuments([]);
      setErrorMessage(`Please choose no more than ${MAX_SUPPORTING_FILES} supporting documents.`);
      return;
    }

    const invalidFile = selected.find((file) => {
      const extension = file.name.split(".").pop()?.toLowerCase();
      return !extension || !ACCEPTED_SUPPORTING_EXTENSIONS.has(extension) || file.size > MAX_FILE_BYTES;
    });

    if (invalidFile) {
      setSupportingDocuments([]);
      setErrorMessage("Supporting documents must be PDF, DOC, DOCX, JPG, or PNG files no larger than 8 MB each.");
      return;
    }

    setSupportingDocuments(selected);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    if (currentStep < APPLICATION_STEPS.length) {
      goToNextStep();
      return;
    }
    if (!validateCurrentStep()) return;

    if (website) return;
    if (!resume) {
      setErrorMessage("Please attach your resume.");
      return;
    }
    if (form.gardeningFocus.length === 0) {
      setErrorMessage("Please select at least one gardening focus area.");
      return;
    }
    if (form.computerSkills.length === 0) {
      setErrorMessage("Please select at least one computer skill.");
      return;
    }

    try {
      setStatus("uploading");
      const applicationId = applicationIdRef.current;
      const uploadDocument = async (file: File, kind: "resume" | "supporting", index?: number) => {
        const signature = [kind, index || 0, file.name, file.size, file.lastModified].join(":");
        const existing = uploadedDocumentsRef.current.get(signature);
        if (existing) return existing;

        const contentType = fileContentType(file);
        const signed = await postJson<{ path: string; token: string }>("/api/job-applications/upload-url", {
          applicationId,
          kind,
          index,
          name: file.name,
          size: file.size,
          contentType,
        });
        const { error } = await supabase.storage.from(RESUME_BUCKET).uploadToSignedUrl(
          signed.path,
          signed.token,
          file,
          { cacheControl: "3600", contentType, upsert: false },
        );
        if (error) throw new ApplicationApiError(error.message, "document_upload_failed");
        const uploaded = { name: file.name, size: file.size, contentType, path: signed.path };
        uploadedDocumentsRef.current.set(signature, uploaded);
        return uploaded;
      };

      const uploadJobs = [
        uploadDocument(resume, "resume"),
        ...supportingDocuments.map((file, index) => uploadDocument(file, "supporting", index + 1)),
      ];
      const uploadResults = await Promise.allSettled(uploadJobs);
      const failedUpload = uploadResults.find((result) => result.status === "rejected");
      if (failedUpload?.status === "rejected") throw failedUpload.reason;
      const uploaded = uploadResults.map((result) => (result as PromiseFulfilledResult<UploadedDocument>).value);
      const uploadedResume = uploaded[0];
      const uploadedSupportingDocuments = uploaded.slice(1);

      setStatus("saving");
      await postJson("/api/job-applications", {
        applicationId,
        form,
        resume: uploadedResume,
        supportingDocuments: uploadedSupportingDocuments,
        website,
      });

      trackEvent("Recruitment Application Submitted", {
        position: POSITION_SLUG,
        source: APPLICATION_SOURCE,
      });
      setStatus("sent");
      setForm(initialForm);
      setResume(null);
      setSupportingDocuments([]);
      setCurrentStep(1);
      resetUploadSession(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      const apiError = error instanceof ApplicationApiError ? error : new ApplicationApiError("We could not submit your application. Please try again.");
      if (apiError.code !== "notification_failed") resetUploadSession(true);
      setStatus("error");
      setErrorMessage(`${apiError.message} You can also email your resume to info@soilseedandwater.com.`);
    }
  };

  if (status === "sent") {
    return (
      <div className="min-h-[70vh] bg-[#f5f2ea] px-4 py-20">
        <SEO title="Application Received" robots="noindex,follow" />
        <div className="mx-auto max-w-2xl rounded-3xl border border-[#dfe7e1] bg-white p-8 text-center shadow-sm sm:p-12">
          <CheckCircle2 className="mx-auto h-16 w-16 text-[#397854]" />
          <h1 className="mt-6 font-heading text-3xl font-bold text-[#183a23]">Application received</h1>
          <p className="mx-auto mt-4 max-w-lg text-slate-600">
            Thank you for your interest in Soil Seed &amp; Water. Our team will review your experience and contact you if there is a fit for the next step.
          </p>
          <Link href="/">
            <span className="mt-8 inline-flex min-h-12 items-center rounded-xl bg-[#183a23] px-6 text-sm font-bold text-white transition hover:bg-[#215330]">
              Return to Organic Soil Wholesale
            </span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f2ea]">
      <SEO
        title="Sales Representative Career"
        description="Apply for the Sales Representative position with Soil Seed & Water in Phoenix, Arizona. Gardening, organic growing, soil biology, and product experience are preferred."
        canonical={APPLICATION_URL}
        ogImage="https://www.organicsoilwholesale.com/images/recruitment/sales-representative-hiring-square-2026.png"
      />

      <section className="bg-[#183a23] py-14 text-white lg:py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
          <div>
            <Link href="/careers" className="inline-flex min-h-11 items-center text-sm font-semibold text-white/80 underline-offset-4 transition hover:text-white hover:underline">
              ← View all openings
            </Link>
            <p className="mt-3 text-xs font-bold uppercase tracking-[0.2em] text-[#d9b879]">Join our team · Phoenix, Arizona</p>
            <h1 className="mt-4 font-heading text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Sales Representative
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/80">
              Help gardeners and growers choose products that build healthier soil. We are looking for a strong communicator who knows sales and genuinely enjoys growing things.
            </p>
            <a
              href="#apply"
              className="mt-8 inline-flex min-h-12 items-center rounded-xl bg-[#d4aa63] px-7 text-sm font-bold text-[#183a23] transition hover:bg-[#e2c184]"
            >
              Apply now
            </a>
          </div>
          <img
            src="/images/recruitment/sales-representative-hiring-square-2026.webp"
            alt="Soil Seed & Water is hiring a sales representative in Phoenix, Arizona"
            width="1254"
            height="1254"
            className="mx-auto w-full max-w-xl rounded-3xl border border-white/15 object-cover shadow-2xl"
          />
        </div>
      </section>

      <section className="bg-[#faf9f5] py-14 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-3">
            <article className={cardClass}>
              <Sprout className="h-7 w-7 text-[#397854]" />
              <h2 className="mt-4 font-heading text-xl font-bold text-[#183a23]">Who we hope to meet</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                A home gardener, grower, landscaper, nursery professional, soil biology learner, or current product user who can connect real growing experience to customer needs.
              </p>
            </article>
            <article className={cardClass}>
              <Users className="h-7 w-7 text-[#397854]" />
              <h2 className="mt-4 font-heading text-xl font-bold text-[#183a23]">What you will do</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Guide customers, follow up with leads, explain products clearly, build long-term relationships, and help the team turn interest into the right solution.
              </p>
            </article>
            <article className={cardClass}>
              <MapPin className="h-7 w-7 text-[#397854]" />
              <h2 className="mt-4 font-heading text-xl font-bold text-[#183a23]">Position details</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                This is a Phoenix-area role. Schedule, employment structure, and compensation will be discussed with qualified applicants during the hiring process.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section id="apply" className="scroll-mt-28 bg-[#f5f2ea] py-16 lg:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8a6a34]">Application</p>
            <h2 className="mt-3 font-heading text-3xl font-bold text-[#183a23] sm:text-4xl">Complete your application</h2>
            <p className="mt-3 text-slate-600">One section at a time · approximately 15–20 minutes. Required fields are marked with an asterisk.</p>

            <div className="mt-7" aria-label={`Application progress: step ${currentStep} of ${APPLICATION_STEPS.length}`}>
              <div className="mb-3 flex items-center justify-between text-sm font-semibold text-[#183a23]">
                <span>Step {currentStep} of {APPLICATION_STEPS.length}</span>
                <span>{Math.round((currentStep / APPLICATION_STEPS.length) * 100)}% complete</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#dfe7e1]">
                <div
                  className="h-full rounded-full bg-[#397854] transition-all duration-300"
                  style={{ width: `${(currentStep / APPLICATION_STEPS.length) * 100}%` }}
                />
              </div>
            </div>

            <ol className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
              {APPLICATION_STEPS.map((step) => {
                const StepIcon = step.icon;
                const isActive = currentStep === step.number;
                const isComplete = currentStep > step.number;

                return (
                  <li key={step.number}>
                    <button
                      type="button"
                      onClick={() => {
                        if (step.number < currentStep) {
                          setErrorMessage("");
                          setCurrentStep(step.number);
                          scrollToApplication();
                        }
                      }}
                      disabled={step.number >= currentStep}
                      aria-current={isActive ? "step" : undefined}
                      className={[
                        "flex min-h-16 w-full items-center justify-center gap-2 rounded-2xl border px-2 py-3 text-sm font-bold shadow-sm transition sm:justify-start sm:px-4",
                        isActive
                          ? "border-[#397854] bg-[#183a23] text-white"
                          : isComplete
                            ? "border-[#b9cebe] bg-[#eef5f0] text-[#183a23] hover:border-[#397854]"
                            : "border-[#dfe7e1] bg-white text-slate-400",
                      ].join(" ")}
                    >
                      {isComplete ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <StepIcon className="h-5 w-5 shrink-0" />}
                      <span className="hidden sm:inline">{step.number}. {step.title}</span>
                      <span className="sm:hidden">{step.shortTitle}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
            <p className="mt-4 text-sm text-slate-500">Your answers stay in place when you move between sections.</p>
          </div>

          <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
            <input
              aria-hidden="true"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
              name="website"
              className="absolute left-[-9999px] h-px w-px opacity-0"
            />

            {currentStep === 1 ? (
            <fieldset id="basics" data-application-step="1" className={[cardClass, "scroll-mt-28"].join(" ")}>
              <legend className="px-2 font-heading text-xl font-bold text-[#183a23]">Part 1 · Basics and employment readiness</legend>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">Contact details, availability, sales background, and application documents.</p>
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <div>
                  <label className={labelClass} htmlFor="firstName">First name *</label>
                  <input id="firstName" required maxLength={80} autoComplete="given-name" className={inputClass} value={form.firstName} onChange={(event) => update("firstName", event.target.value)} />
                </div>
                <div>
                  <label className={labelClass} htmlFor="lastName">Last name *</label>
                  <input id="lastName" required maxLength={80} autoComplete="family-name" className={inputClass} value={form.lastName} onChange={(event) => update("lastName", event.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass} htmlFor="preferredName">Preferred name <span className="font-normal text-slate-500">(optional)</span></label>
                  <input id="preferredName" maxLength={80} autoComplete="nickname" className={inputClass} value={form.preferredName} onChange={(event) => update("preferredName", event.target.value)} />
                </div>
                <div>
                  <label className={labelClass} htmlFor="email">Email *</label>
                  <input id="email" type="email" required maxLength={254} autoComplete="email" className={inputClass} value={form.email} onInput={(event) => update("email", event.currentTarget.value)} onChange={(event) => update("email", event.target.value)} />
                </div>
                <div>
                  <label className={labelClass} htmlFor="phone">Phone *</label>
                  <input id="phone" type="tel" required maxLength={40} autoComplete="tel" className={inputClass} value={form.phone} onInput={(event) => update("phone", event.currentTarget.value)} onChange={(event) => update("phone", event.target.value)} />
                </div>
                <div>
                  <label className={labelClass} htmlFor="city">City *</label>
                  <input id="city" required maxLength={100} autoComplete="address-level2" className={inputClass} value={form.city} onChange={(event) => update("city", event.target.value)} />
                </div>
                <div>
                  <label className={labelClass} htmlFor="state">State *</label>
                  <input id="state" required maxLength={2} autoComplete="address-level1" className={inputClass} value={form.state} onChange={(event) => update("state", event.target.value)} />
                </div>
                <div>
                  <label className={labelClass} htmlFor="employmentInterest">Preferred schedule *</label>
                  <select id="employmentInterest" required className={inputClass} value={form.employmentInterest} onChange={(event) => update("employmentInterest", event.target.value)}>
                    <option value="">Select one</option><option>Full-time</option><option>Part-time</option><option>Open to either</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass} htmlFor="phoenixAvailability">Available for Phoenix-area work? *</label>
                  <select id="phoenixAvailability" required className={inputClass} value={form.phoenixAvailability} onChange={(event) => update("phoenixAvailability", event.target.value)}>
                    <option value="">Select one</option><option>Yes</option><option>No</option><option>Relocating to Phoenix</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass} htmlFor="reliableTransportation">Can you reliably travel to work and customer locations in the Phoenix area? *</label>
                  <select id="reliableTransportation" required className={inputClass} value={form.reliableTransportation} onChange={(event) => update("reliableTransportation", event.target.value)}>
                    <option value="">Select one</option><option>Yes</option><option>No</option><option>Would like to discuss</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass} htmlFor="workAuthorization">Authorized to work in the United States? *</label>
                  <select id="workAuthorization" required className={inputClass} value={form.workAuthorization} onChange={(event) => update("workAuthorization", event.target.value)}>
                    <option value="">Select one</option><option>Yes</option><option>No</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass} htmlFor="earliestStartDate">Earliest start date *</label>
                  <input id="earliestStartDate" type="date" required className={inputClass} value={form.earliestStartDate} onInput={(event) => update("earliestStartDate", event.currentTarget.value)} onChange={(event) => update("earliestStartDate", event.target.value)} />
                </div>
                <div>
                  <label className={labelClass} htmlFor="salesExperienceYears">Sales or customer-service experience *</label>
                  <select id="salesExperienceYears" required className={inputClass} value={form.salesExperienceYears} onChange={(event) => update("salesExperienceYears", event.target.value)}>
                    <option value="">Select one</option><option>Less than 1 year</option><option>1–2 years</option><option>3–5 years</option><option>6–10 years</option><option>More than 10 years</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass} htmlFor="compensationExpectation">Compensation expectation <span className="font-normal text-slate-500">(optional)</span></label>
                  <input id="compensationExpectation" maxLength={160} placeholder="Share a range or structure you are seeking" className={inputClass} value={form.compensationExpectation} onChange={(event) => update("compensationExpectation", event.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass} htmlFor="salesBackground">Briefly describe your sales or customer-service background. *</label>
                  <textarea id="salesBackground" required minLength={40} maxLength={1500} rows={5} className={inputClass} value={form.salesBackground} onChange={(event) => update("salesBackground", event.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass} htmlFor="whySsw">Why do you want to work with Soil Seed & Water? *</label>
                  <textarea id="whySsw" required minLength={40} maxLength={1500} rows={5} className={inputClass} value={form.whySsw} onChange={(event) => update("whySsw", event.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass} htmlFor="linkedInUrl">LinkedIn profile or professional portfolio <span className="font-normal text-slate-500">(optional)</span></label>
                  <input id="linkedInUrl" type="url" maxLength={500} placeholder="https://..." className={inputClass} value={form.linkedInUrl} onChange={(event) => update("linkedInUrl", event.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass} htmlFor="resume">Resume *</label>
                  <label htmlFor="resume" className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#cdd9d0] bg-[#f4f8f5] px-5 py-6 text-center transition hover:border-[#397854]">
                    {resume ? <FileText className="h-8 w-8 text-[#397854]" /> : <Upload className="h-8 w-8 text-[#397854]" />}
                    <span className="mt-3 text-sm font-semibold text-[#183a23]">{resume ? resume.name : "Choose your resume"}</span>
                    <span className="mt-1 text-xs text-slate-500">PDF, DOC, or DOCX · maximum 8 MB</span>
                  </label>
                  <input id="resume" type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="sr-only" onChange={(event) => handleResume(event.target.files?.[0] || null)} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass} htmlFor="supportingDocuments">Supporting documents <span className="font-normal text-slate-500">(optional)</span></label>
                  <label htmlFor="supportingDocuments" className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#cdd9d0] bg-[#f4f8f5] px-5 py-6 text-center transition hover:border-[#397854]">
                    <Upload className="h-8 w-8 text-[#397854]" />
                    <span className="mt-3 text-sm font-semibold text-[#183a23]">{supportingDocuments.length ? supportingDocuments.length + " file" + (supportingDocuments.length === 1 ? "" : "s") + " selected" : "Add a cover letter, references, certificates, or work samples"}</span>
                    <span className="mt-1 text-xs text-slate-500">Up to 5 PDF, DOC, DOCX, JPG, or PNG files · 8 MB each</span>
                  </label>
                  <input id="supportingDocuments" type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png" className="sr-only" onChange={(event) => handleSupportingDocuments(event.target.files)} />
                  {supportingDocuments.length ? (
                    <ul className="mt-3 space-y-1 text-sm text-slate-600">
                      {supportingDocuments.map((file) => <li key={file.name + "-" + file.size}>• {file.name}</li>)}
                    </ul>
                  ) : null}
                  <p className="mt-3 text-xs leading-relaxed text-slate-500">Please do not upload identification, Social Security information, banking details, or medical records.</p>
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass} htmlFor="referralSource">How did you hear about this position? <span className="font-normal text-slate-500">(optional)</span></label>
                  <input id="referralSource" maxLength={250} className={inputClass} value={form.referralSource} onChange={(event) => update("referralSource", event.target.value)} />
                </div>
              </div>
            </fieldset>
            ) : null}

            {currentStep === 2 ? (
            <fieldset id="gardening-focus" data-application-step="2" className={[cardClass, "scroll-mt-28"].join(" ")}>
              <legend className="px-2 font-heading text-xl font-bold text-[#183a23]">Part 2 · Gardening focus</legend>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">Professional credentials are welcome but not required. Personal gardening experience counts.</p>
              <div className="mt-6 space-y-6">
                <div>
                  <label className={labelClass} htmlFor="gardeningExperienceYears">How long have you gardened, grown plants, farmed, or worked with landscapes? *</label>
                  <select id="gardeningExperienceYears" required className={inputClass} value={form.gardeningExperienceYears} onChange={(event) => update("gardeningExperienceYears", event.target.value)}>
                    <option value="">Select one</option><option>New, but actively learning</option><option>Less than 1 year</option><option>1–2 years</option><option>3–5 years</option><option>6–10 years</option><option>More than 10 years</option>
                  </select>
                </div>
                <div>
                  <span className={labelClass}>Which gardening areas describe you? *</span>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {gardeningFocusOptions.map((option) => (
                      <label key={option} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-[#d9e1db] px-4 py-3 text-sm text-slate-700 transition hover:border-[#397854]">
                        <input type="checkbox" className="h-5 w-5 accent-[#397854]" checked={form.gardeningFocus.includes(option)} onChange={() => toggleListItem("gardeningFocus", option)} />
                        {option}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={labelClass} htmlFor="plantsGrown">What plants, crops, or growing environments do you know best? *</label>
                  <textarea id="plantsGrown" required minLength={20} maxLength={1200} rows={4} className={inputClass} placeholder="For example: vegetables, fruit trees, turf, ornamentals, houseplants, greenhouse crops..." value={form.plantsGrown} onChange={(event) => update("plantsGrown", event.target.value)} />
                </div>
                <div>
                  <label className={labelClass} htmlFor="organicPractices">Which organic or soil-health practices have you personally used? *</label>
                  <textarea id="organicPractices" required minLength={20} maxLength={1500} rows={5} className={inputClass} placeholder="For example: compost, mulch, soil testing, biological inoculants, cover crops, reduced chemicals..." value={form.organicPractices} onChange={(event) => update("organicPractices", event.target.value)} />
                </div>
                <div>
                  <label className={labelClass} htmlFor="productExperience">Tell us about your gardening, growing, or Soil Seed & Water product experience. *</label>
                  <textarea id="productExperience" required minLength={40} maxLength={1500} rows={5} className={inputClass} value={form.productExperience} onChange={(event) => update("productExperience", event.target.value)} />
                </div>
                <div>
                  <label className={labelClass} htmlFor="soilKnowledge">A customer asks, “Why should I care about soil biology?” How would you answer? *</label>
                  <textarea id="soilKnowledge" required minLength={40} maxLength={1500} rows={5} className={inputClass} value={form.soilKnowledge} onChange={(event) => update("soilKnowledge", event.target.value)} />
                </div>
              </div>
            </fieldset>
            ) : null}

            {currentStep === 3 ? (
            <fieldset id="computer-skills" data-application-step="3" className={[cardClass, "scroll-mt-28"].join(" ")}>
              <legend className="px-2 font-heading text-xl font-bold text-[#183a23]">Part 3 · Computer literacy and sales skills</legend>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">We use everyday digital tools to serve customers, document conversations, and follow up reliably.</p>
              <div className="mt-6 space-y-6">
                <div>
                  <label className={labelClass} htmlFor="computerProficiency">How comfortable are you learning and using computer-based work tools? *</label>
                  <select id="computerProficiency" required className={inputClass} value={form.computerProficiency} onChange={(event) => update("computerProficiency", event.target.value)}>
                    <option value="">Select one</option><option>Beginner — I need regular guidance</option><option>Basic — I can complete common tasks</option><option>Comfortable — I learn most tools quickly</option><option>Advanced — I often help others with technology</option>
                  </select>
                </div>
                <div>
                  <span className={labelClass}>Which tools or tasks have you used? *</span>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {computerSkillOptions.map((option) => (
                      <label key={option} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-[#d9e1db] px-4 py-3 text-sm text-slate-700 transition hover:border-[#397854]">
                        <input type="checkbox" className="h-5 w-5 accent-[#397854]" checked={form.computerSkills.includes(option)} onChange={() => toggleListItem("computerSkills", option)} />
                        {option}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={labelClass} htmlFor="softwareTools">List software, apps, CRM systems, or sales tools you have used. *</label>
                  <textarea id="softwareTools" required minLength={10} maxLength={1200} rows={4} className={inputClass} placeholder="If you have limited experience, tell us what you currently use and how you learn new tools." value={form.softwareTools} onChange={(event) => update("softwareTools", event.target.value)} />
                </div>
                <div>
                  <label className={labelClass} htmlFor="computerTaskExample">A customer emails a product question and asks for a follow-up next week. Explain how you would respond, record the details, and make sure you follow up. *</label>
                  <textarea id="computerTaskExample" required minLength={40} maxLength={1500} rows={5} className={inputClass} value={form.computerTaskExample} onChange={(event) => update("computerTaskExample", event.target.value)} />
                </div>
                <div>
                  <label className={labelClass} htmlFor="salesExample">Tell us about a time you earned a customer&apos;s trust or solved their problem. *</label>
                  <textarea id="salesExample" required minLength={40} maxLength={1500} rows={5} className={inputClass} value={form.salesExample} onChange={(event) => update("salesExample", event.target.value)} />
                </div>
                <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-[#f4f8f5] p-4 text-sm leading-relaxed text-slate-700">
                  <input type="checkbox" required className="mt-0.5 h-5 w-5 shrink-0 accent-[#397854]" checked={form.certification} onChange={(event) => update("certification", event.target.checked)} />
                  <span>
                    I certify that the information I provided is accurate, and I agree that Soil Seed &amp; Water may contact me about this application. I have reviewed the{" "}
                    <Link href="/privacy"><span className="font-semibold underline">Privacy Policy</span></Link>. *
                  </span>
                </label>
              </div>
            </fieldset>
            ) : null}

            {errorMessage ? (
              <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div>
            ) : null}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={goToPreviousStep}
                  className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-xl border border-[#b9c9bd] bg-white px-8 text-base font-bold text-[#183a23] transition hover:border-[#397854] hover:bg-[#f4f8f5] sm:w-auto"
                >
                  <ArrowLeft className="h-5 w-5" aria-hidden="true" />
                  Back
                </button>
              ) : <span aria-hidden="true" />}

              {currentStep < APPLICATION_STEPS.length ? (
                <button
                  type="button"
                  onClick={goToNextStep}
                  className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#183a23] px-8 text-base font-bold text-white transition hover:bg-[#215330] sm:w-auto"
                >
                  Continue to {APPLICATION_STEPS[currentStep].shortTitle}
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </button>
              ) : (
                <button type="submit" disabled={status === "uploading" || status === "saving"} className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#183a23] px-8 text-base font-bold text-white transition hover:bg-[#215330] disabled:cursor-wait disabled:opacity-60 sm:w-auto">
                  <Leaf className="h-5 w-5" aria-hidden="true" />
                  {status === "uploading" ? "Uploading documents…" : status === "saving" ? "Submitting application…" : "Submit application"}
                </button>
              )}
            </div>
            {status === "error" ? (
              <p className="text-sm text-slate-600">You can also email <a className="font-semibold underline" href="mailto:info@soilseedandwater.com?subject=Sales%20Representative%20Application">info@soilseedandwater.com</a>.</p>
            ) : null}
          </form>
        </div>
      </section>
    </div>
  );
};

export default CareersSales;
