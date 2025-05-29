import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const About = () => {
  return (
    <section id="about" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center">
          <div className="lg:w-1/2 lg:pr-12 mb-10 lg:mb-0">
            <h1 className="text-3xl font-heading font-bold text-primary mb-6">
              About Soil Seed and Water
            </h1>
            <p className="text-lg text-neutral-800 mb-6">
              At Soil Seed and Water, we're committed to creating premium organic soil products that nourish plants while respecting our planet. Our expert team combines scientific knowledge with years of practical experience to develop solutions that help growers achieve exceptional results.
            </p>
            <p className="text-lg text-neutral-800 mb-6">
              Founded on the principles of sustainability and innovation, we source only the highest quality ingredients for our products. From dairy compost to specialized blends for specific crops, everything we create is designed to enhance soil health and promote vigorous plant growth.
            </p>
            
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mt-8">
              <Link href="/contact">
                <Button className="bg-primary hover:bg-primary-light text-white">
                  Contact Us
                </Button>
              </Link>
              <Link href="/products">
                <Button variant="outline" className="bg-white text-primary border border-primary hover:bg-neutral-50">
                  Explore Products
                </Button>
              </Link>
            </div>
          </div>
          <div className="lg:w-1/2">
            <img
              src="https://images.unsplash.com/photo-1605000797499-95a51c5269ae?ixlib=rb-4.0.3&auto=format&fit=crop&w=1400&q=80"
              alt="Soil Seed and Water operations"
              className="rounded-lg shadow-xl w-full h-auto"
            />
          </div>
        </div>

        {/* Our Mission Section */}
        <div className="mt-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-heading font-bold text-primary mb-4">
              Our Mission
            </h2>
            <p className="text-lg text-neutral-800 max-w-3xl mx-auto">
              We strive to revolutionize the way people think about soil by providing sustainable, organic products that enhance plant health and agricultural productivity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="bg-neutral-50 p-6 rounded-lg text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <h3 className="text-xl font-heading font-semibold mb-3">Sustainability</h3>
              <p className="text-neutral-700">
                We're committed to sustainable practices throughout our entire production process, from sourcing to packaging.
              </p>
            </div>

            <div className="bg-neutral-50 p-6 rounded-lg text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z"/>
                </svg>
              </div>
              <h3 className="text-xl font-heading font-semibold mb-3">Quality</h3>
              <p className="text-neutral-700">
                We meticulously test and refine our products to ensure they meet the highest standards for effectiveness and purity.
              </p>
            </div>

            <div className="bg-neutral-50 p-6 rounded-lg text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 16.98h-5.99c-1.66 0-3.3-.34-4.83-1.01C4.24 14.99 2 16.3 2 18v2h20v-2c0-1.7-2.24-3.01-5.18-3.02z"/>
                  <path d="M12 14c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z"/>
                </svg>
              </div>
              <h3 className="text-xl font-heading font-semibold mb-3">Customer Support</h3>
              <p className="text-neutral-700">
                Our team of experts is always ready to provide guidance and support to help you achieve the best results with our products.
              </p>
            </div>
          </div>
        </div>

        {/* Our Team Section */}
        <div className="mt-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-heading font-bold text-primary mb-4">
              Our Team
            </h2>
            <p className="text-lg text-neutral-800 max-w-3xl mx-auto">
              Meet the dedicated professionals behind Soil Seed and Water who work tirelessly to deliver exceptional products.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-32 h-32 rounded-full overflow-hidden mx-auto mb-4">
                <img 
                  src="https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&h=256&q=80" 
                  alt="John Anderson"
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="font-heading font-semibold text-xl">John Anderson</h3>
              <p className="text-neutral-600">Co-Founder & CEO</p>
              <p className="mt-3 text-neutral-700">
                With over 20 years in sustainable agriculture, John leads our vision for organic soil innovations.
              </p>
            </div>

            <div className="text-center">
              <div className="w-32 h-32 rounded-full overflow-hidden mx-auto mb-4">
                <img 
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&h=256&q=80" 
                  alt="Sarah Miller"
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="font-heading font-semibold text-xl">Sarah Miller</h3>
              <p className="text-neutral-600">Lead Soil Scientist</p>
              <p className="mt-3 text-neutral-700">
                Sarah's expertise in soil biology and chemistry drives our product development and quality control.
              </p>
            </div>

            <div className="text-center">
              <div className="w-32 h-32 rounded-full overflow-hidden mx-auto mb-4">
                <img 
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&h=256&q=80" 
                  alt="Michael Chen"
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="font-heading font-semibold text-xl">Michael Chen</h3>
              <p className="text-neutral-600">Director of Operations</p>
              <p className="mt-3 text-neutral-700">
                Michael ensures our production processes maintain the highest standards of quality and sustainability.
              </p>
            </div>
          </div>
        </div>

        {/* Join Us CTA */}
        <div className="mt-24 bg-neutral-50 p-12 rounded-xl text-center">
          <h2 className="text-3xl font-heading font-bold text-primary mb-4">
            Join Our Growing Network of Partners
          </h2>
          <p className="text-lg text-neutral-800 max-w-3xl mx-auto mb-8">
            Become a wholesale partner today and discover the difference that premium organic soil products can make for your growing operation.
          </p>
          <Link href="/onboarding">
            <Button size="lg" className="bg-primary hover:bg-primary-light text-white">
              Become a Wholesale Partner
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default About;
