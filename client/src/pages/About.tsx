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
              Soil Seed and Water comes from a group of gardeners, landscapers, and farmers looking for an intuitive line of organic soil products.
            </p>
            
            <div className="mb-8">
              <h3 className="text-xl font-heading font-semibold text-primary mb-4">Our Locations</h3>
              
              <div className="space-y-4">
                <div className="bg-neutral-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-neutral-800">Phoenix, Arizona - Distribution Hub</h4>
                  <p className="text-neutral-700">1634 North 19th Avenue</p>
                  <p className="text-neutral-700">Our main hub for pickup and distribution. You can place an order and pick up or schedule delivery.</p>
                </div>
                
                <div className="bg-neutral-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-neutral-800">Congress, Arizona - Production Facility</h4>
                  <p className="text-neutral-700">Where we produce all of our products and house one of the largest operations of worm castings in the state of Arizona, as well as composting operations.</p>
                </div>
                
                <div className="bg-neutral-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-neutral-800">Bixburg, Arizona</h4>
                  <p className="text-neutral-700">Where we developed vermicompost.</p>
                </div>
              </div>
            </div>
            
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
              Our mission is to be a trusted go-to resource for growers seeking long-term success and healthier ecosystems in the soil, with a focus on water conservation.
            </p>
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
          <Link href="/contact">
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
