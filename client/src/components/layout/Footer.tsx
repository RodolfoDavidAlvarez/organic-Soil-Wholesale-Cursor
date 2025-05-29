import { Link } from "wouter";
import { Facebook, Instagram, Linkedin, Youtube, MapPin, Phone, Mail, Clock } from "lucide-react";

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
                <span className="text-xl font-heading font-bold">
                  Organic <span className="text-primary">Soil</span> <span className="text-accent font-display italic">Wholesale</span>
                </span>
              </div>
              <p className="text-foreground/80 mb-6 max-w-md">
                Providing premium organic soil products for commercial growers, landscapers, and agricultural professionals. Sustainable solutions for healthier plants and a healthier planet.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="bg-white/10 hover:bg-white/20 text-primary rounded-full p-2.5 transition-colors duration-200">
                  <Facebook className="h-5 w-5" />
                </a>
                <a href="#" className="bg-white/10 hover:bg-white/20 text-primary rounded-full p-2.5 transition-colors duration-200">
                  <Instagram className="h-5 w-5" />
                </a>
                <a href="#" className="bg-white/10 hover:bg-white/20 text-primary rounded-full p-2.5 transition-colors duration-200">
                  <Youtube className="h-5 w-5" />
                </a>
                <a href="#" className="bg-white/10 hover:bg-white/20 text-primary rounded-full p-2.5 transition-colors duration-200">
                  <Linkedin className="h-5 w-5" />
                </a>
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
                  <Link href="/faq">
                    <div className="text-foreground/80 hover:text-primary transition-colors duration-200 flex items-center gap-1">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      FAQ
                    </div>
                  </Link>
                </li>
                <li>
                  <a href="#blog" className="text-foreground/80 hover:text-primary transition-colors duration-200 flex items-center gap-1">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Blog
                  </a>
                </li>
              </ul>
            </div>

            {/* Product Categories */}
            <div className="md:col-span-3">
              <h3 className="font-heading font-semibold text-lg mb-4">Product Categories</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/products?category=compost">
                    <div className="text-foreground/80 hover:text-primary transition-colors duration-200 flex items-center gap-1">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Compost
                    </div>
                  </Link>
                </li>
                <li>
                  <Link href="/products?category=amendment">
                    <div className="text-foreground/80 hover:text-primary transition-colors duration-200 flex items-center gap-1">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Soil Amendments
                    </div>
                  </Link>
                </li>
                <li>
                  <Link href="/products?category=potting">
                    <div className="text-foreground/80 hover:text-primary transition-colors duration-200 flex items-center gap-1">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Potting Soils
                    </div>
                  </Link>
                </li>
                <li>
                  <Link href="/products?category=specialty">
                    <div className="text-foreground/80 hover:text-primary transition-colors duration-200 flex items-center gap-1">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Specialty Blends
                    </div>
                  </Link>
                </li>
                <li>
                  <Link href="/products">
                    <div className="text-foreground/80 hover:text-primary transition-colors duration-200 flex items-center gap-1">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      All Products
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
                    123 Organic Way<br />Fertile Valley, CA 95000
                  </span>
                </li>
                <li className="flex items-center">
                  <div className="bg-white/10 rounded-full p-1.5 mr-3">
                    <Phone className="h-4 w-4" />
                  </div>
                  <span className="text-foreground/80">(555) 123-4567</span>
                </li>
                <li className="flex items-center">
                  <div className="bg-white/10 rounded-full p-1.5 mr-3">
                    <Mail className="h-4 w-4" />
                  </div>
                  <span className="text-foreground/80">wholesale@soilseedwater.com</span>
                </li>
                <li className="flex items-start">
                  <div className="bg-white/10 rounded-full p-1.5 mr-3 mt-0.5">
                    <Clock className="h-4 w-4" />
                  </div>
                  <span className="text-foreground/80">
                    Monday - Friday: 8am - 5pm<br />
                    Saturday: 9am - 2pm<br />
                    Sunday: Closed
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
              <a href="#" className="text-primary-foreground/80 hover:text-primary-foreground text-sm transition-colors duration-200">
                Privacy Policy
              </a>
              <a href="#" className="text-primary-foreground/80 hover:text-primary-foreground text-sm transition-colors duration-200">
                Terms of Service
              </a>
              <a href="#" className="text-primary-foreground/80 hover:text-primary-foreground text-sm transition-colors duration-200">
                Shipping Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
