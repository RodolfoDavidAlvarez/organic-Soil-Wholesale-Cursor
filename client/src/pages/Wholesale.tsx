import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const Wholesale = () => {
  return (
    <section id="wholesale" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-heading font-bold text-primary mb-4">
            Wholesale Program
          </h1>
          <p className="text-lg text-neutral-800 max-w-3xl mx-auto">
            Partner with Soil Seed and Water for premium organic soil products at wholesale prices.
          </p>
        </div>

        {/* Program Overview */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="bg-neutral-50 p-8 rounded-lg">
            <h2 className="text-2xl font-heading font-bold text-primary mb-6">
              What is Our Wholesale Program?
            </h2>
            <p className="text-lg text-neutral-800 mb-6">
              Our wholesale program is designed for gardeners, landscapers, and farmers who need reliable access to high-quality organic soil products. We offer competitive pricing, flexible payment terms, and dedicated support for your growing business.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <div className="bg-white p-6 rounded-lg">
                <h3 className="font-heading font-semibold text-lg mb-3 text-primary">Minimum Orders</h3>
                <p className="text-neutral-700">
                  Wholesale orders start at a pallet of bags (50 units depending on size or quantity). This makes it easy to calculate your orders and qualify for wholesale pricing.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg">
                <h3 className="font-heading font-semibold text-lg mb-3 text-primary">Delivery Coverage</h3>
                <p className="text-neutral-700">
                  We deliver within a 300-mile radius from Phoenix or Congress, Arizona, calculated based on our trucking service capabilities.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg">
                <h3 className="font-heading font-semibold text-lg mb-3 text-primary">Payment Terms</h3>
                <p className="text-neutral-700">
                  We accept credit cards, ACH, business checks, and cash. Established partners qualify for net 30 and net 60 payment terms depending on quantity and order volume.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg">
                <h3 className="font-heading font-semibold text-lg mb-3 text-primary">Custom Services</h3>
                <p className="text-neutral-700">
                  We offer custom blending services that require planning and may take additional time depending on complexity. Contact us to discuss your specific needs.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="text-2xl font-heading font-bold text-primary mb-8 text-center">
            Wholesale Benefits
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  <path d="m2 17 10 5 10-5"/>
                  <path d="m2 12 10 5 10-5"/>
                </svg>
              </div>
              <h3 className="font-heading font-semibold text-lg mb-3">Competitive Pricing</h3>
              <p className="text-neutral-700">
                Access wholesale prices that scale with your order volume, helping you maximize your profit margins.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 12l2 2 4-4"/>
                  <path d="M21 12c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1z"/>
                  <path d="M3 12c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1z"/>
                </svg>
              </div>
              <h3 className="font-heading font-semibold text-lg mb-3">Certified Organic</h3>
              <p className="text-neutral-700">
                All products are certified organic with OMRI, U.S. Compost Council, and tested with certified labs.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="m22 21-3-3m0 0-3-3m3 3 3 3m-3-3-3 3"/>
                </svg>
              </div>
              <h3 className="font-heading font-semibold text-lg mb-3">Dedicated Support</h3>
              <p className="text-neutral-700">
                Receive personalized support from our team to help you choose the right products for your needs.
              </p>
            </div>
          </div>
        </div>

        {/* How to Get Started */}
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="text-2xl font-heading font-bold text-primary mb-8 text-center">
            How to Get Started
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                1
              </div>
              <h3 className="font-heading font-semibold text-lg mb-3">Contact Us</h3>
              <p className="text-neutral-700">
                Reach out to our wholesale team to discuss your needs and get started with the application process.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                2
              </div>
              <h3 className="font-heading font-semibold text-lg mb-3">Application Review</h3>
              <p className="text-neutral-700">
                Our team will review your application and approve your wholesale account within 1-2 business days.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                3
              </div>
              <h3 className="font-heading font-semibold text-lg mb-3">Start Ordering</h3>
              <p className="text-neutral-700">
                Once approved, you'll receive access to wholesale pricing and can begin placing orders.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-neutral-50 p-12 rounded-xl text-center">
          <h2 className="text-3xl font-heading font-bold text-primary mb-4">
            Ready to Partner with Us?
          </h2>
          <p className="text-lg text-neutral-800 max-w-3xl mx-auto mb-8">
            Join our growing network of wholesale partners and discover the difference that premium organic soil products can make for your operation.
          </p>
          <Link href="/contact">
            <Button size="lg" className="bg-primary hover:bg-primary-light text-white">
              Contact Our Wholesale Team
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Wholesale;