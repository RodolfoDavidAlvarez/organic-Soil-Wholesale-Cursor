import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { YouTubePlayer } from "@/components/YouTubePlayer";

const About = () => {
  return (
    <section id="about" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center">
          <div className="lg:w-1/2 lg:pr-12 mb-10 lg:mb-0">
            <h1 className="text-3xl font-heading font-bold text-primary mb-6">About Soil Seed and Water</h1>
            <p className="text-lg text-neutral-800 mb-6">
              Soil Seed and Water comes from a group of gardeners, landscapers, and farmers looking for an intuitive line of organic soil products.
            </p>

            <div className="mb-8">
              <h3 className="text-xl font-heading font-semibold text-primary mb-4">Our Locations</h3>

              <div className="space-y-4">
                <div className="bg-neutral-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-neutral-800">Phoenix, Arizona - Distribution Hub</h4>
                  <p className="text-neutral-700">1634 North 19th Avenue</p>
                  <p className="text-neutral-700">
                    Our main hub for pickup and distribution. You can place an order and pick up or schedule delivery.
                  </p>
                  <div className="mt-3">
                    <a
                      href="https://maps.google.com/?q=1634+North+19th+Avenue,+Phoenix,+AZ"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-primary border border-primary rounded-md hover:bg-primary hover:text-white transition-colors"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-2"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      Navigate to Location
                    </a>
                  </div>
                </div>

                <div className="bg-neutral-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-neutral-800">Congress, Arizona - Production Facility</h4>
                  <p className="text-neutral-700">
                    Where we produce all of our products and house one of the largest operations of worm castings in the state of Arizona, as well as
                    composting operations.
                  </p>
                </div>

                <div className="bg-neutral-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-neutral-800">Vicksburg, Arizona</h4>
                  <p className="text-neutral-700">Dairy compost production facility. Available for truckload orders only.</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mt-8">
              <Link href="/contact">
                <Button className="bg-primary hover:bg-primary-light text-white">Contact Us</Button>
              </Link>
              <Link href="/products">
                <Button variant="outline" className="bg-white text-primary border border-primary hover:bg-neutral-50">
                  Explore Products
                </Button>
              </Link>
            </div>
          </div>
          <div className="lg:w-1/2 w-full">
            <div className="relative rounded-2xl border border-neutral-200/60 bg-black shadow-2xl overflow-hidden w-full">
              <YouTubePlayer
                videoId="A5i_Jcz6-XA"
                title="Soil Seed and Water Operations Walkthrough"
                autoPlay
                muted
                loop={false}
                className="w-full aspect-video"
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-5 text-white">
                <div className="flex flex-col gap-2 text-sm sm:text-base">
                  <span className="inline-flex w-max items-center gap-2 rounded-full bg-primary/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/90">
                    Custom Blend In Action
                  </span>
                  <p className="max-w-sm leading-snug text-white/90">
                    Watch our team build a tailored soil mix for a grower who needed better water retention without sacrificing drainage.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Our Mission Section */}
        <div className="mt-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-heading font-bold text-primary mb-4">Our Mission</h2>
            <p className="text-lg text-neutral-800 max-w-3xl mx-auto">
              Our mission is to be a trusted go-to resource for growers seeking long-term success and healthier ecosystems in the soil, with a focus
              on water conservation.
            </p>
          </div>
        </div>

        {/* Video Section */}
        <div className="mt-24">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_1fr] items-center rounded-2xl bg-neutral-50/80 p-8 lg:p-12 shadow-lg">
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-heading font-bold text-primary mb-3">See Our Story</h2>
                <p className="text-lg text-neutral-800">
                  Step inside our yards and meet the team nurturing living soils for growers across Arizona. The short video quietly plays while you
                  read, so you can get a feel for the operation without breaking your flow.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 text-sm text-neutral-700">
                <p className="flex items-start gap-3 bg-white/70 rounded-xl p-4 shadow-sm">
                  <span className="mt-0.5 h-2 w-2 rounded-full bg-primary"></span>
                  Walk the rows of worm castings and compost in Phoenix.
                </p>
                <p className="flex items-start gap-3 bg-white/70 rounded-xl p-4 shadow-sm">
                  <span className="mt-0.5 h-2 w-2 rounded-full bg-primary"></span>
                  Hear how our grower-first approach keeps orders simple.
                </p>
                <p className="flex items-start gap-3 bg-white/70 rounded-xl p-4 shadow-sm sm:col-span-2">
                  <span className="mt-0.5 h-2 w-2 rounded-full bg-primary"></span>
                  See how we coordinate pickup, delivery, and custom blends for partners statewide.
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-2xl border border-neutral-200/60 bg-black shadow-2xl overflow-hidden">
                <YouTubePlayer
                  videoId="QQ-Kh0ff2zI"
                  title="Soil Seed and Water - Our Story"
                  autoPlay
                  muted
                  loop={false}
                  className="w-full aspect-video"
                />
              </div>
              <div className="absolute -bottom-5 left-1/2 hidden w-11/12 -translate-x-1/2 rounded-2xl bg-gradient-to-r from-primary/10 via-transparent to-primary/10 blur-lg lg:block" />
            </div>
          </div>
        </div>

        {/* Join Us CTA */}
        <div className="mt-24 bg-neutral-50 p-12 rounded-xl text-center">
          <h2 className="text-3xl font-heading font-bold text-primary mb-4">Join Our Growing Network of Partners</h2>
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
