import { Link } from "wouter";
import { useBrand, useRlsHref, oswUrl } from "@/lib/brand";

export function RlsFooter() {
  const brand = useBrand();
  const href = useRlsHref();

  return (
    <footer className="mt-auto border-t border-white/10 bg-[#1B2E1F] text-[#F4EFE6]">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <p className="font-heading text-xs font-semibold uppercase tracking-[0.18em] text-[#C4A574]">
            A Soil Seed &amp; Water company
          </p>
          <p className="mt-2 font-heading text-xl font-semibold">{brand.name}</p>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-[#F4EFE6]/75">
            Landscape-pro supply that shares Organic Soil Wholesale inventory, yard pickup, and fulfillment.
            Diagnosis drives the product — not the other way around.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold">Visit</p>
          <ul className="mt-3 space-y-2 text-sm text-[#F4EFE6]/75">
            <li>
              <Link href={href("/soil-dashboard")} className="inline-flex min-h-[44px] items-center">
                Soil Dashboard
              </Link>
            </li>
            <li>
              <Link href={href("/products")} className="inline-flex min-h-[44px] items-center">
                Product toolbox
              </Link>
            </li>
            <li>
              <Link href={href("/consult")} className="inline-flex min-h-[44px] items-center">
                Request a consult
              </Link>
            </li>
            <li>
              <a href={oswUrl("/qr")} className="inline-flex min-h-[44px] items-center">
                Phoenix yard pickup
              </a>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold">Yard &amp; support</p>
          <p className="mt-3 text-sm leading-relaxed text-[#F4EFE6]/75">{brand.yardAddress}</p>
          <a href={brand.phoneTel} className="mt-2 inline-flex min-h-[44px] items-center text-sm font-semibold text-[#C4A574]">
            {brand.phoneDisplay}
          </a>
          <p className="mt-2 text-sm text-[#F4EFE6]/75">{brand.email}</p>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-[#F4EFE6]/55">
        © {new Date().getFullYear()} {brand.name}. Parent brands:{" "}
        <a className="underline decoration-[#C4A574]/50 underline-offset-2" href={oswUrl("/")}>
          Organic Soil Wholesale
        </a>{" "}
        and Soil Seed &amp; Water.
      </div>
    </footer>
  );
}
