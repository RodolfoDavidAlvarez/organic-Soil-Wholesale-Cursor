import { useEffect } from "react";
import SEO from "@/components/layout/SEO";
import { PayPickupGrid } from "@/components/PayPickupGrid";
import { Phone, FileText, MapPin, ArrowUpRight } from "lucide-react";

/**
 * Pay & Pick Up landing page.
 *
 * History: this used to be a 1,773-line 7-step wizard. As of release 2.6 the
 * page is a thin wrapper around <PayPickupGrid />, which is the same component
 * used at the top of /products. Single source of truth for the 4 mains.
 *
 * Routes that hit this component: `/pay-and-pickup`, `/pay-and-pickup/:step?`,
 * `/qr`, `/drive-through/:step?` (mobile drive-by QR landing — same flow).
 */

const PHOENIX_DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
  "1634 N 19th Ave, Phoenix AZ 85009"
)}`;

export default function PayAndPickup() {
  // QR scanners land here mid-scroll; reset to top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <SEO
        title="Pay & Pick Up | Soil Seed & Water"
        description="Reserve a pickup slot and pay online. Dairy compost, worm castings, Soil Craft potting blend, Nature's Blanket Premium mulch — ready in the yard at the slot you pick."
        keywords="pay and pickup soil, organic soil phoenix pickup, dairy compost pickup, worm castings pickup, soil craft pickup"
        canonical="https://organicsoilwholesale.com/pay-and-pickup"
      />

      {/* Compact header strip — keeps QR landing visual context but doesn't hog the viewport */}
      <section className="bg-stone-900 text-white">
        <div className="container mx-auto flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#d6c1a0]">
              Soil Seed &amp; Water · Phoenix yard
            </p>
            <p className="text-sm font-semibold">Pay online · pick up at the slot you choose</p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <a
              href={PHOENIX_DIRECTIONS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 font-semibold backdrop-blur hover:bg-white/20"
            >
              <MapPin className="h-3.5 w-3.5" />
              1634 N 19th Ave
              <ArrowUpRight className="h-3 w-3" />
            </a>
            <a
              href="tel:+16027267211"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#d6c1a0] px-3 py-1.5 font-semibold text-stone-900 hover:bg-[#c4a878]"
            >
              <Phone className="h-3.5 w-3.5" />
              (602) 726-7211
            </a>
          </div>
        </div>
      </section>

      {/* The 4 mains — same component used on /products */}
      <section className="bg-gradient-to-b from-stone-50 to-white py-6 md:py-10">
        <div className="container mx-auto px-4">
          <PayPickupGrid />
          <div className="mt-6 flex flex-col items-center gap-2 border-t border-stone-200 pt-6 text-center text-sm text-stone-600 sm:flex-row sm:justify-center sm:gap-4">
            <FileText className="h-4 w-4 text-stone-500" />
            <span>Need bulk, mulch, or a specialty blend?</span>
            <a href="/products#request-quote" className="font-semibold text-[#264027] underline">
              Request a quote →
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
