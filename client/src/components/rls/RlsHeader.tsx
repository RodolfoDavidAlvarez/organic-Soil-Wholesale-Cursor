import { useState } from "react";
import { Link } from "wouter";
import { Menu, Phone, X } from "lucide-react";
import { useBrand, useRlsHref } from "@/lib/brand";

const NAV = [
  { label: "Dashboard", path: "/soil-dashboard" },
  { label: "Toolbox", path: "/products" },
  { label: "Programs", path: "/programs" },
  { label: "Professionals", path: "/professionals" },
  { label: "Consult", path: "/consult" },
];

export function RlsHeader() {
  const brand = useBrand();
  const href = useRlsHref();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[#1B2E1F]/10 bg-[#F4EFE6]/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href={href("/")} className="min-h-[44px] min-w-0 py-1">
          <span className="block font-heading text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8A6B3D]">
            Soil Seed &amp; Water
          </span>
          <span className="block truncate font-heading text-base font-bold leading-tight text-[#1B2E1F] sm:text-lg">
            {brand.name}
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {NAV.map((item) => (
            <Link
              key={item.path}
              href={href(item.path)}
              className="inline-flex min-h-[44px] items-center px-3 text-sm font-medium text-[#1B2E1F]/80 hover:text-[#1B2E1F]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={brand.phoneTel}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-[#1B2E1F] px-4 text-sm font-semibold text-[#F4EFE6]"
          >
            <Phone className="h-4 w-4" />
            <span className="hidden sm:inline">{brand.phoneDisplay}</span>
            <span className="sm:hidden">Call</span>
          </a>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#1B2E1F]/15 text-[#1B2E1F] lg:hidden"
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-[#1B2E1F]/10 bg-[#F4EFE6] px-4 py-3 lg:hidden" aria-label="Mobile">
          <div className="flex flex-col">
            {NAV.map((item) => (
              <Link
                key={item.path}
                href={href(item.path)}
                className="flex min-h-[44px] items-center text-base font-medium text-[#1B2E1F]"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href={href("/contact")}
              className="flex min-h-[44px] items-center text-base font-medium text-[#1B2E1F]"
              onClick={() => setOpen(false)}
            >
              Contact
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
