import { Link } from "wouter";
import { MapPin, Phone, Mail, Clock, Leaf } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-primary-foreground text-primary relative z-10 mt-auto">
      {/* Arizona Made Strip */}
      <div className="bg-gradient-to-r from-arizona-copper via-arizona-sunset to-arizona-terracotta py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-center gap-3 text-white text-center">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              <span className="font-bold uppercase tracking-wide">Proudly Made in Arizona</span>
            </div>
            <span className="hidden md:inline text-white/50">|</span>
            <span className="text-white/90 text-sm">Supporting local jobs, sustainable agriculture & Arizona communities</span>
          </div>
        </div>
      </div>

      <div className="leaf-pattern py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Company Info */}
            <div className="md:col-span-4">
              <div className="flex items-center gap-3 mb-4">
                <img
                  src="/images/soil-seed-and-water-logo.png"
                  alt="Soil Seed and Water logo"
                  className="h-12 w-auto"
                  loading="lazy"
                  width="48"
                  height="48"
                />
                <div>
                  <span className="text-xl font-heading font-bold">
                    Organic <span className="text-primary">Soil</span> <span className="text-arizona-copper font-display italic">Wholesale</span>
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold text-arizona-copper bg-arizona-copper/10 px-2 py-0.5 rounded">
                      <MapPin className="h-2.5 w-2.5" />
                      Arizona Made
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-foreground/80 mb-4 max-w-md">
                Arizona&apos;s premier producer of organic compost and soil amendments. Locally produced for landscapers, commercial growers, farms, and government projects.
              </p>
              <div className="flex items-start gap-2 text-sm text-foreground/70 bg-arizona-sand/30 rounded-lg p-3 mb-4">
                <Leaf className="h-4 w-4 text-arizona-sage mt-0.5 flex-shrink-0" />
                <span>Supporting sustainable agriculture and Arizona&apos;s circular economy through organic waste diversion.</span>
              </div>
            </div>

            {/* Quick Links */}
            <div className="md:col-span-2">
              <h3 className="font-heading font-semibold text-lg mb-4">Quick Links</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/products">
                    <div className="text-foreground/80 hover:text-primary transition-colors duration-200 flex items-center gap-1">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Products
                    </div>
                  </Link>
                </li>
                <li>
                  <Link href="/about">
                    <div className="text-foreground/80 hover:text-primary transition-colors duration-200 flex items-center gap-1">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      About Us
                    </div>
                  </Link>
                </li>
                <li>
                  <Link href="/contact">
                    <div className="text-foreground/80 hover:text-primary transition-colors duration-200 flex items-center gap-1">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Contact
                    </div>
                  </Link>
                </li>
                <li>
                  <Link href="/order">
                    <div className="text-foreground/80 hover:text-primary transition-colors duration-200 flex items-center gap-1">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Place Order
                    </div>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div className="md:col-span-3">
              <h3 className="font-heading font-semibold text-lg mb-4">Contact Information</h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="bg-white/10 rounded-full p-1.5 mr-3 mt-0.5">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <span className="text-foreground/80">
                    1634 N 19th Ave
                    <br />
                    Phoenix, AZ 85009
                  </span>
                </li>
                <li className="flex items-center">
                  <div className="bg-white/10 rounded-full p-1.5 mr-3">
                    <Phone className="h-4 w-4" />
                  </div>
                  <a href="tel:9285501649" className="text-foreground/80 hover:text-primary transition-colors duration-200 font-medium">
                    (928) 550-1649
                  </a>
                </li>
                <li className="flex items-center">
                  <div className="bg-white/10 rounded-full p-1.5 mr-3">
                    <Mail className="h-4 w-4" />
                  </div>
                  <span className="text-foreground/80">info@soilseedandwater.com</span>
                </li>
                <li className="flex items-start">
                  <div className="bg-white/10 rounded-full p-1.5 mr-3 mt-0.5">
                    <Clock className="h-4 w-4" />
                  </div>
                  <span className="text-foreground/80">
                    By appointment only
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-primary dark:bg-primary/80 text-primary-foreground py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-primary-foreground/80 text-sm mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} Soil Seed and Water LLC. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <Link href="/privacy" className="text-primary-foreground/80 hover:text-primary-foreground text-sm transition-colors duration-200">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-primary-foreground/80 hover:text-primary-foreground text-sm transition-colors duration-200">
                Terms of Service
              </Link>
              <a
                href="https://soilseedandwater.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-foreground/80 hover:text-primary-foreground text-sm transition-colors duration-200"
              >
                Retail Store
              </a>
              <Link href="/store-locator" className="text-primary-foreground/80 hover:text-primary-foreground text-sm transition-colors duration-200">
                Store Locator
              </Link>
              <Link href="/admin" className="text-primary-foreground/80 hover:text-primary-foreground text-sm transition-colors duration-200">
                Admin
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
