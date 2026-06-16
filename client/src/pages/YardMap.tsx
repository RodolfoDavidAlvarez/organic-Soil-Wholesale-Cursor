import { Link } from "wouter";
import SEO from "@/components/layout/SEO";
import { Button } from "@/components/ui/button";
import { CUSTOMER_SUPPORT_PHONE_DISPLAY, CUSTOMER_SUPPORT_PHONE_TEL, PHOENIX_YARD_ADDRESS, PHOENIX_YARD_DIRECTIONS_URL } from "@/config/contact";
import { buildLocalBusinessSchema, buildYardMapSchema } from "@/config/seo";
import { ArrowLeft, CheckCircle2, ExternalLink, MapPin, Navigation, Phone, Truck } from "lucide-react";

const YardMap = () => {
  return (
    <>
      <SEO
        title="Phoenix Yard Pickup Map"
        description="Pickup directions for Organic Soil Wholesale at 1634 N 19th Ave, Phoenix. Enter through the Grand Ave south entrance."
        canonical="https://organicsoilwholesale.com/yard-map"
        structuredData={[buildLocalBusinessSchema(), buildYardMapSchema()]}
      />

      <section className="bg-stone-50 py-5 md:py-8">
        <div className="container mx-auto max-w-6xl px-4">
          <Link href="/products" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-stone-600 hover:text-[#264027]">
            <ArrowLeft className="h-4 w-4" />
            Back to products
          </Link>

          <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm md:p-6">
              <p className="mb-2 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#438764]">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Phoenix yard pickup
              </p>
              <h1 className="font-heading text-3xl font-bold leading-tight text-stone-950 md:text-4xl">
                Enter from Grand Ave.
              </h1>
              <p className="mt-3 text-base leading-relaxed text-stone-600">
                Use the south entrance on Grand Ave, then follow the yard lane toward the loading/check-in area.
              </p>

              <div className="mt-5 space-y-3">
                <DirectionStep n="1" title="Approach from Grand Ave" body="Stay on Grand Ave and look for the south yard entrance near the southwest side of the property." />
                <DirectionStep n="2" title="Turn into the yard entrance" body="Enter through the Grand Ave gate. Avoid using the N 19th Ave side unless staff directs you." />
                <DirectionStep n="3" title="Follow the marked lane" body="Continue inside and wait near the check-in/loading area for a representative." />
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <Button asChild className="h-12 rounded-xl bg-[#438764] text-base font-bold text-white hover:bg-[#356f52]">
                  <a href={PHOENIX_YARD_DIRECTIONS_URL} target="_blank" rel="noreferrer">
                    <Navigation className="mr-2 h-5 w-5" />
                    Open directions
                  </a>
                </Button>
                <Button asChild variant="outline" className="h-12 rounded-xl text-base font-bold">
                  <a href={CUSTOMER_SUPPORT_PHONE_TEL}>
                    <Phone className="mr-2 h-5 w-5" />
                    Call {CUSTOMER_SUPPORT_PHONE_DISPLAY}
                  </a>
                </Button>
              </div>

              <div className="mt-5 rounded-xl bg-stone-50 p-4 text-sm text-stone-700">
                <p className="font-bold text-stone-900">Address</p>
                <p className="mt-1">{PHOENIX_YARD_ADDRESS}</p>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
              <div className="border-b border-stone-100 p-4">
                <p className="text-sm font-bold text-stone-900">Yard entrance flow</p>
                <p className="mt-1 text-xs text-stone-500">Simplified map for pickup traffic. Follow the pink route.</p>
              </div>
              <div className="bg-[#f7f4ee] p-3 md:p-5">
                <svg viewBox="0 0 760 560" role="img" aria-label="Map showing Grand Ave south entrance to Organic Soil Wholesale yard" className="h-auto w-full rounded-xl bg-[#efe9dc] shadow-inner">
                  <defs>
                    <marker id="arrow" markerHeight="10" markerWidth="10" orient="auto" refX="8" refY="3">
                      <path d="M0,0 L0,6 L9,3 z" fill="#e735c8" />
                    </marker>
                  </defs>

                  <rect x="0" y="0" width="760" height="560" fill="#efe9dc" />
                  <rect x="510" y="0" width="210" height="560" fill="#d9d4ca" />
                  <rect x="535" y="0" width="64" height="560" fill="#b9b7b1" />
                  <rect x="562" y="0" width="10" height="560" fill="#f7f4ee" opacity="0.75" />
                  <text x="612" y="270" transform="rotate(90 612 270)" className="fill-stone-700 text-[22px] font-bold">N 19th Ave</text>

                  <path d="M110 560 L430 0" stroke="#b7a992" strokeWidth="96" />
                  <path d="M138 560 L455 0" stroke="#9f9688" strokeWidth="46" />
                  <path d="M161 560 L478 0" stroke="#f2eee8" strokeWidth="4" opacity="0.8" />
                  <text x="213" y="400" transform="rotate(-57 213 400)" className="fill-stone-800 text-[24px] font-bold">Grand Ave</text>

                  <rect x="314" y="150" width="198" height="285" rx="12" fill="#dfd3bf" stroke="#c5bcae" strokeWidth="3" />
                  <text x="338" y="180" className="fill-stone-700 text-[18px] font-bold">Organic Soil Wholesale Yard</text>
                  <rect x="414" y="310" width="72" height="54" rx="6" fill="#c9c0b1" />
                  <rect x="332" y="220" width="72" height="42" rx="6" fill="#c9c0b1" />
                  <rect x="432" y="210" width="54" height="78" rx="6" fill="#c9c0b1" />

                  <circle cx="324" cy="360" r="17" fill="#264027" />
                  <Truck x="311" y="347" width="26" height="26" color="white" strokeWidth="2.4" />
                  <text x="257" y="397" className="fill-stone-900 text-[17px] font-bold">Check-in / loading</text>

                  <path
                    d="M170 480 C210 420 242 365 294 334 C326 315 344 294 349 248"
                    fill="none"
                    stroke="#e735c8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="8"
                    markerEnd="url(#arrow)"
                  />
                  <path d="M236 366 L294 334" stroke="#e735c8" strokeWidth="8" strokeLinecap="round" />
                  <path d="M350 252 L350 200 L405 200" stroke="#e735c8" strokeWidth="8" strokeLinecap="round" markerEnd="url(#arrow)" />

                  <circle cx="185" cy="463" r="18" fill="#e735c8" />
                  <text x="128" y="449" className="fill-stone-950 text-[15px] font-bold">Grand Ave</text>
                  <text x="122" y="468" className="fill-stone-950 text-[15px] font-bold">south entrance</text>

                  <g>
                    <rect x="30" y="28" width="245" height="86" rx="16" fill="white" opacity="0.94" />
                    <MapPin x="50" y="47" width="24" height="24" color="#438764" strokeWidth="2.5" />
                    <text x="84" y="57" className="fill-stone-950 text-[18px] font-bold">Use Grand Ave entrance</text>
                    <text x="84" y="84" className="fill-stone-600 text-[15px]">Follow pink arrows to check-in.</text>
                  </g>
                </svg>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-bold">Pickup note</p>
            <p className="mt-1">
              For fastest loading, use the Grand Ave south entrance and keep the lane clear while waiting for a representative.
              <a className="ml-1 inline-flex items-center gap-1 font-bold underline-offset-2 hover:underline" href={PHOENIX_YARD_DIRECTIONS_URL} target="_blank" rel="noreferrer">
                Open Google Maps <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </p>
          </div>
        </div>
      </section>
    </>
  );
};

function DirectionStep({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="flex gap-3 rounded-xl border border-stone-200 bg-white p-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#264027] text-sm font-bold text-white">{n}</div>
      <div>
        <p className="font-bold text-stone-950">{title}</p>
        <p className="mt-0.5 text-sm leading-relaxed text-stone-600">{body}</p>
      </div>
    </div>
  );
}

export default YardMap;
