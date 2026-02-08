import { Link } from "wouter";
import { MapPin, Phone, Mail, Clock, Leaf } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-white text-foreground relative z-10 mt-auto border-t border-border">
      <div className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Company Info */}
            <div className="md:col-span-4">
              <div className="mb-4">
                <span className="text-xl font-bold">
                  Organic <span className="text-primary">Soil</span> Wholesale
                </span>
              </div>
              <p className="text-muted-foreground mb-4 max-w-md">
                Arizona&apos;s premier producer of organic compost and soil amendments. Locally produced for landscapers, commercial growers, farms, and government projects.
              </p>
              <div className="flex items-start gap-2 text-sm text-muted-foreground bg-primary/5 rounded-lg p-3 mb-4">
                <Leaf className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Supporting sustainable agriculture and Arizona&apos;s circular economy through organic waste diversion.</span>
              </div>
            </div>

            {/* Quick Links */}
            <div className="md:col-span-2">
              <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/products">
                    <div className="text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center gap-1">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Products
                    </div>
                  </Link>
                </li>
                <li>
                  <Link href="/about">
                    <div className="text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center gap-1">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      About Us
                    </div>
                  </Link>
                </li>
                <li>
                  <Link href="/contact">
                    <div className="text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center gap-1">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Contact
                    </div>
                  </Link>
                </li>
                <li>
                  <Link href="/order">
                    <div className="text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center gap-1">
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
              <h3 className="font-semibold text-lg mb-4">Contact Information</h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="bg-primary/10 rounded-full p-1.5 mr-3 mt-0.5">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-muted-foreground">
                    1634 N 19th Ave
                    <br />
                    Phoenix, AZ 85009
                  </span>
                </li>
                <li className="flex items-center">
                  <div className="bg-primary/10 rounded-full p-1.5 mr-3">
                    <Phone className="h-4 w-4 text-primary" />
                  </div>
                  <a href="tel:9285501649" className="text-muted-foreground hover:text-primary transition-colors duration-200 font-medium">
                    (928) 550-1649
                  </a>
                </li>
                <li className="flex items-center">
                  <div className="bg-primary/10 rounded-full p-1.5 mr-3">
                    <Mail className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-muted-foreground">info@soilseedandwater.com</span>
                </li>
                <li className="flex items-start">
                  <div className="bg-primary/10 rounded-full p-1.5 mr-3 mt-0.5">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-muted-foreground">
                    By appointment only
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-primary text-primary-foreground py-6">
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
