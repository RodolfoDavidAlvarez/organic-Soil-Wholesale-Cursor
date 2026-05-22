import { Link } from 'wouter';
import { ShoppingCart, Phone } from 'lucide-react';

const FloatingCTA = () => {
  return (
    <div className="fixed bottom-6 right-6 z-50 md:hidden flex flex-col gap-3">
      <a
        href="tel:6027267211"
        className="flex items-center justify-center w-12 h-12 rounded-full bg-white text-primary shadow-lg hover:shadow-xl transition-all duration-300 border border-primary/20"
        aria-label="Call us"
      >
        <Phone className="h-5 w-5" />
      </a>

      <Link href="/order">
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