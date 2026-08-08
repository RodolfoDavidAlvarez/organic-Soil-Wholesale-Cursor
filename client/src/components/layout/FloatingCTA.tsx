import { Link } from 'wouter';
import { FileText, Phone } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';
import { CUSTOMER_SUPPORT_PHONE_DISPLAY, CUSTOMER_SUPPORT_PHONE_TEL } from '@/config/contact';

const FloatingCTA = () => {
  const quoteHref = `/order${window.location.search}`;

  return (
    <div className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-50 grid grid-cols-2 gap-2 rounded-2xl border border-stone-200/90 bg-white/95 p-2 shadow-[0_12px_32px_rgba(28,35,28,0.2)] backdrop-blur md:hidden">
      <a
        href={CUSTOMER_SUPPORT_PHONE_TEL}
        data-official-support-phone="true"
        data-mobile-phone-cta="true"
        data-phone-number={CUSTOMER_SUPPORT_PHONE_TEL.slice(4)}
        onClick={() => trackEvent("Floating CTA Clicked", { cta: "call", page: window.location.pathname })}
        className="flex min-h-[54px] items-center justify-center gap-2 rounded-xl border border-[#264027]/20 bg-white px-2 text-[#264027] shadow-sm transition hover:bg-[#eef4eb]"
        aria-label={`Call ${CUSTOMER_SUPPORT_PHONE_DISPLAY}`}
      >
        <Phone className="h-4 w-4 shrink-0" />
        <span className="min-w-0 text-left leading-tight">
          <span className="block text-sm font-extrabold">Call</span>
          <span data-official-support-phone-text="true" className="block whitespace-nowrap text-[11px] font-semibold">
            {CUSTOMER_SUPPORT_PHONE_DISPLAY}
          </span>
        </span>
      </a>

      <Link
        href={quoteHref}
        onClick={() => trackEvent("Floating CTA Clicked", { cta: "request_quote", page: window.location.pathname })}
        className="flex min-h-[54px] items-center justify-center gap-2 rounded-xl bg-primary px-2 text-sm font-extrabold text-white shadow-md transition hover:bg-primary/90"
        aria-label="Request a Quote"
      >
        <FileText className="h-4 w-4 shrink-0" />
        <span>Request a Quote</span>
      </Link>
    </div>
  );
};

export default FloatingCTA;
