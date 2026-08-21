import { Analytics } from "@vercel/analytics/react";
import WormCastingsCampaign from "@/pages/WormCastingsCampaign";

export default function CampaignEntry() {
  const source = new URLSearchParams(window.location.search).get("source") || "community-print";

  return (
    <>
      <CampaignNavigation />
      <WormCastingsCampaign source={source} />
      <Analytics />
    </>
  );
}

function CampaignNavigation() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#dce3d8] bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-8">
        <a href="/" aria-label="Go to the Organic Soil Wholesale homepage" className="min-w-0 py-3 leading-tight text-[#202b22]">
          <span className="block truncate font-heading text-base font-bold sm:text-xl">
            Organic <span className="text-[#264027]">Soil</span> <span className="font-display italic text-[#8f7000]">Wholesale</span>
          </span>
          <span className="block text-[9px] font-semibold uppercase tracking-[0.14em] text-[#68716a] sm:text-[10px]">
            by Soil Seed &amp; Water
          </span>
        </a>

        <nav aria-label="Organic Soil Wholesale navigation" className="hidden items-center gap-5 sm:flex">
          <a href="/" className="min-h-11 content-center font-semibold text-[#263527] hover:text-[#264027]">Home</a>
          <a href="/products" className="min-h-11 content-center font-semibold text-[#263527] hover:text-[#264027]">Products</a>
          <a href="/fall-garden-workshop?source=worm-castings-nav" className="min-h-11 content-center rounded-xl bg-[#264027] px-4 text-sm font-bold text-white hover:bg-[#17381f]">Garden Class</a>
        </nav>

        <a href="/products" className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-[#264027] px-4 text-sm font-bold text-white sm:hidden">
          Shop Products
        </a>
      </div>
    </header>
  );
}
