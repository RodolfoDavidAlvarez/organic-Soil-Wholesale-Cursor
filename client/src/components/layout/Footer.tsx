import { Link } from "wouter";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-primary-foreground text-primary">
      <div className="leaf-pattern py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Company Info */}
            <div className="md:col-span-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center">
                  <div className="text-white text-xl font-bold">OSW</div>
                </div>
                <div>
                  <span className="text-xl font-heading font-bold">
                    Organic <span className="text-primary">Soil</span> <span className="text-accent font-display italic">Wholesale</span>
                  </span>
                  <div className="text-sm text-foreground/60 mt-1">
                    by{" "}
                    <a href="https://soilseedandwater.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                      Soil Seed and Water
                    </a>
                  </div>
                </div>
              </div>
              <p className="text-foreground/80 mb-6 max-w-md">
                Providing premium organic soil products for commercial growers, landscapers, and agricultural professionals. Sustainable solutions for
                healthier plants and a healthier planet.
              </p>
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
                  <span className="text-foreground/80">ralvarez@soilseedandwater.com</span>
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
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
