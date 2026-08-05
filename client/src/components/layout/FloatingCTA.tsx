import { Link } from 'wouter';
import { ShoppingCart, Phone } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';
import { CUSTOMER_SUPPORT_PHONE_TEL } from '@/config/contact';

const FloatingCTA = () => {
  return (
    <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+1.5rem)] right-4 z-50 md:hidden flex flex-col gap-3">
      <a
        href={CUSTOMER_SUPPORT_PHONE_TEL}
        data-official-support-phone="true"
        onClick={() => trackEvent("Floating CTA Clicked", { cta: "call", page: window.location.pathname })}
        className="flex items-center justify-center w-12 h-12 rounded-full bg-white text-primary shadow-lg hover:shadow-xl transition-all duration-300 border border-primary/20"
        aria-label="Call us"
      >
        <Phone className="h-5 w-5" />
      </a>

      <Link href="/order" onClick={() => trackEvent("Floating CTA Clicked", { cta: "order", page: window.location.pathname })}>
        <div
          className="flex items-center justify-center w-14 h-14 rounded-full bg-primary text-white shadow-lg hover:shadow-xl hover:bg-primary/90 transition-all duration-300"
          aria-label="Place an order"
        >
          <ShoppingCart className="h-6 w-6" />
        </div>
      </Link>
    </div>
  );
};

export default FloatingCTA;
