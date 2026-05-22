import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Helmet } from "react-helmet-async";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Eraser, CheckCircle2 } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

type FormState = {
  full_legal_business_name: string;
  company_address: string;
  ein_tax_id: string;
  business_registration_number: string;
  arizona_tpt_license: string;
  preferred_payment_method: string;
  billing_contact_name: string;
  billing_contact_email: string;
  preferred_payment_terms: string;
  sales_tax_exemption_status: string;
  operations_contact_name: string;
  operations_contact_phone: string;
  submitted_by_name: string;
  certification_accepted: boolean;
};

const DEFAULT_STATE: FormState = {
  full_legal_business_name: "",
  company_address: "",
  ein_tax_id: "",
  business_registration_number: "",
  arizona_tpt_license: "",
  preferred_payment_method: "",
  billing_contact_name: "",
  billing_contact_email: "",
  preferred_payment_terms: "",
  sales_tax_exemption_status: "",
  operations_contact_name: "",
  operations_contact_phone: "",
  submitted_by_name: "",
  certification_accepted: false,
};

function getQueryParam(name: string): string {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get(name) || "";
}

export default function AccountForm() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [state, setState] = useState<FormState>(DEFAULT_STATE);
  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const hasSignatureRef = useRef(false);

  useEffect(() => {
    const prefilledOps = getQueryParam("name") || getQueryParam("ops_name");
    const prefilledPhone = getQueryParam("phone") || getQueryParam("ops_phone");
    const prefilledCompany = getQueryParam("company");
    const prefilledEmail = getQueryParam("email");
    const prefilledSubmitted = getQueryParam("submitted_by") || prefilledOps;

    setState((s) => ({
      ...s,
      operations_contact_name: prefilledOps || s.operations_contact_name,
      operations_contact_phone: prefilledPhone || s.operations_contact_phone,
      full_legal_business_name: prefilledCompany || s.full_legal_business_name,
      billing_contact_email: prefilledEmail || s.billing_contact_email,
      submitted_by_name: prefilledSubmitted || s.submitted_by_name,
    }));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    resizeCanvas(canvas);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1a2a1a";

    const onResize = () => {
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      resizeCanvas(canvas);
      try {
        ctx.putImageData(data, 0, 0);
      } catch {}
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.strokeStyle = "#1a2a1a";
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  function resizeCanvas(canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    ctx?.scale(dpr, dpr);
  }

  function getCanvasPoint(
    canvas: HTMLCanvasElement,
    e: React.MouseEvent | React.TouchEvent
  ) {
    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;
    if ("touches" in e && e.touches.length) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ("clientX" in e) {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawingRef.current = true;
    lastPointRef.current = getCanvasPoint(canvas, e);
  }

  function moveDraw(e: React.MouseEvent | React.TouchEvent) {
    if (!drawingRef.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const p = getCanvasPoint(canvas, e);
    const last = lastPointRef.current;
    if (last) {
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      hasSignatureRef.current = true;
    }
    lastPointRef.current = p;
  }

  function endDraw() {
    drawingRef.current = false;
    lastPointRef.current = null;
  }

  function clearSignature() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasSignatureRef.current = false;
  }

  function getSignatureDataUrl(): string | null {
    if (!hasSignatureRef.current) return null;
    return canvasRef.current?.toDataURL("image/png") || null;
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setState((s) => ({ ...s, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    if (!state.full_legal_business_name.trim()) {
      toast({ variant: "destructive", title: "Missing", description: "Full legal business name is required." });
      return;
    }
    if (!state.submitted_by_name.trim()) {
      toast({ variant: "destructive", title: "Missing", description: "Please enter your name as submitter." });
      return;
    }
    if (!state.certification_accepted) {
      toast({ variant: "destructive", title: "Certification needed", description: "Please accept the certification." });
      return;
    }
    const sig = getSignatureDataUrl();
    if (!sig) {
      toast({ variant: "destructive", title: "Signature needed", description: "Please sign in the box below." });
      return;
    }

    setSubmitting(true);
    try {
      const source = getQueryParam("source") || "web";
      const res = await fetch("/api/account-form/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...state,
          signature_data: sig,
          signed_date: new Date().toISOString().slice(0, 10),
          source,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Submission failed");
      }
      setSubmittedId(json.submissionId);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Submission failed", description: err.message || "Try again." });
    } finally {
      setSubmitting(false);
    }
  }

  if (submittedId) {
    return (
      <>
        <Helmet>
          <title>Account Form Submitted | Soil Seed & Water</title>
        </Helmet>
        <Header />
        <main className="min-h-[60vh] py-12 px-4 bg-neutral-50">
          <div className="max-w-xl mx-auto">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                  <CardTitle>Submission received</CardTitle>
                </div>
                <CardDescription>
                  Thanks for completing the account form. We will review and follow up shortly. A copy was sent to your billing contact email if you provided one.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-neutral-600">
                  Reference: <span className="font-mono">{submittedId}</span>
                </p>
                <div className="mt-6 flex gap-3">
                  <Button onClick={() => navigate("/")}>Back to home</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Client Account Form | Soil Seed & Water</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Helmet>
      <Header />
      <main className="py-8 px-4 bg-neutral-50 min-h-[80vh]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-6">
            <div className="text-xs tracking-widest uppercase text-primary font-semibold">
              Soil Seed &amp; Water
            </div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-primary mt-1">
              Client Account Form
            </h1>
            <p className="text-sm text-neutral-600 mt-2">
              Fill this out to set up your wholesale account. It takes 3-4 minutes.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Company Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="full_legal_business_name">Full legal business name *</Label>
                  <Input
                    id="full_legal_business_name"
                    value={state.full_legal_business_name}
                    onChange={(e) => update("full_legal_business_name", e.target.value)}
                    placeholder="Company LLC"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="company_address">Company address</Label>
                  <Textarea
                    id="company_address"
                    value={state.company_address}
                    onChange={(e) => update("company_address", e.target.value)}
                    placeholder="Street, City, State, ZIP"
                    rows={2}
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ein_tax_id">Tax ID number (EIN)</Label>
                    <Input
                      id="ein_tax_id"
                      value={state.ein_tax_id}
                      onChange={(e) => update("ein_tax_id", e.target.value)}
                      placeholder="XX-XXXXXXX"
                      inputMode="numeric"
                    />
                  </div>
                  <div>
                    <Label htmlFor="business_registration_number">Business registration number</Label>
                    <Input
                      id="business_registration_number"
                      value={state.business_registration_number}
                      onChange={(e) => update("business_registration_number", e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="arizona_tpt_license">Arizona TPT license (if applicable)</Label>
                  <Input
                    id="arizona_tpt_license"
                    value={state.arizona_tpt_license}
                    onChange={(e) => update("arizona_tpt_license", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Billing Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="preferred_payment_method">Preferred payment method</Label>
                  <Select
                    value={state.preferred_payment_method}
                    onValueChange={(v) => update("preferred_payment_method", v)}
                  >
                    <SelectTrigger id="preferred_payment_method">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACH">ACH</SelectItem>
                      <SelectItem value="Credit Card">Credit Card</SelectItem>
                      <SelectItem value="Check">Check</SelectItem>
                      <SelectItem value="Wire">Wire</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="billing_contact_name">Billing contact name</Label>
                    <Input
                      id="billing_contact_name"
                      value={state.billing_contact_name}
                      onChange={(e) => update("billing_contact_name", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="billing_contact_email">Billing contact email</Label>
                    <Input
                      id="billing_contact_email"
                      type="email"
                      value={state.billing_contact_email}
                      onChange={(e) => update("billing_contact_email", e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="preferred_payment_terms">Preferred payment terms</Label>
                  <Select
                    value={state.preferred_payment_terms}
                    onValueChange={(v) => update("preferred_payment_terms", v)}
                  >
                    <SelectTrigger id="preferred_payment_terms">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Due on receipt">Due on receipt</SelectItem>
                      <SelectItem value="Net 15">Net 15</SelectItem>
                      <SelectItem value="Net 30">Net 30</SelectItem>
                      <SelectItem value="Net 45">Net 45</SelectItem>
                      <SelectItem value="Net 60">Net 60</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="sales_tax_exemption_status">Sales tax exemption status</Label>
                  <Select
                    value={state.sales_tax_exemption_status}
                    onValueChange={(v) => update("sales_tax_exemption_status", v)}
                  >
                    <SelectTrigger id="sales_tax_exemption_status">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Not exempt">Not exempt</SelectItem>
                      <SelectItem value="Resale exemption">Resale exemption</SelectItem>
                      <SelectItem value="Agricultural exemption">Agricultural exemption</SelectItem>
                      <SelectItem value="Other exemption">Other exemption</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Key Contacts</CardTitle>
                <CardDescription>Operations contact (if different from accounts payable)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="operations_contact_name">Operations contact name</Label>
                    <Input
                      id="operations_contact_name"
                      value={state.operations_contact_name}
                      onChange={(e) => update("operations_contact_name", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="operations_contact_phone">Operations contact phone</Label>
                    <Input
                      id="operations_contact_phone"
                      type="tel"
                      value={state.operations_contact_phone}
                      onChange={(e) => update("operations_contact_phone", e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Signature</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="submitted_by_name">Submitted by *</Label>
                  <Input
                    id="submitted_by_name"
                    value={state.submitted_by_name}
                    onChange={(e) => update("submitted_by_name", e.target.value)}
                    placeholder="Your full name"
                    required
                  />
                </div>
                <div>
                  <Label>Signature *</Label>
                  <div className="border-2 border-dashed border-neutral-300 rounded-md bg-white">
                    <canvas
                      ref={canvasRef}
                      className="w-full h-44 touch-none"
                      onMouseDown={startDraw}
                      onMouseMove={moveDraw}
                      onMouseUp={endDraw}
                      onMouseLeave={endDraw}
                      onTouchStart={startDraw}
                      onTouchMove={moveDraw}
                      onTouchEnd={endDraw}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-neutral-500">
                      Sign with finger (mobile) or mouse
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={clearSignature}
                    >
                      <Eraser className="w-3 h-3 mr-1" />
                      Clear
                    </Button>
                  </div>
                </div>
                <div className="flex items-start gap-3 pt-2">
                  <Checkbox
                    id="certification_accepted"
                    checked={state.certification_accepted}
                    onCheckedChange={(v) => update("certification_accepted", !!v)}
                  />
                  <Label
                    htmlFor="certification_accepted"
                    className="text-sm leading-relaxed cursor-pointer"
                  >
                    I hereby certify that the information provided in this form is accurate
                    and complete to the best of my knowledge. I understand that any false
                    or misleading information may result in delays or termination of the
                    account setup process.
                  </Label>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" size="lg" disabled={submitting} className="min-w-[160px]">
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting
                  </>
                ) : (
                  "Submit account form"
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}
