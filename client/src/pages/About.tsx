import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { YouTubePlayer } from "@/components/YouTubePlayer";
import { MapPin, PlayCircle, Sprout, Truck, Users } from "lucide-react";

const fieldPhotos = [
  {
    src: "/images/field-content/field-application.jpg",
    alt: "Growers walking compost piles in Arizona",
    label: "Congress production yard",
  },
  {
    src: "/images/field-content/super-sack-loading-poster.jpg",
    alt: "Super sack loading into a truck",
    label: "Super sack loading",
  },
  {
    src: "/images/field-content/orchard-application-poster.jpg",
    alt: "Compost application in orchard rows",
    label: "Orchard application",
  },
  {
    src: "/images/field-content/congress-yard-tour.jpg",
    alt: "Sunflower growing in Arizona soil",
    label: "Living soil in use",
  },
];

const fieldVideos = [
  {
    src: "/videos/field-content/super-sack-loading.mp4",
    poster: "/images/field-content/super-sack-loading-poster.jpg",
    title: "Loading super sacks",
    copy: "Real material moving through the yard for larger orders.",
  },
  {
    src: "/videos/field-content/orchard-application.mp4",
    poster: "/images/field-content/orchard-application-poster.jpg",
    title: "Applying in orchard rows",
    copy: "Field work with growers who need soil that performs at scale.",
  },
];

const About = () => {
  return (
    <section id="about" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center">
          <div className="lg:w-1/2 lg:pr-12 mb-10 lg:mb-0">
            <h1 className="text-3xl font-heading font-bold text-primary mb-6">About Soil Seed and Water</h1>
            <p className="text-lg text-neutral-800 mb-6">
              Soil Seed and Water comes from growers, gardeners, landscapers, and farmers building practical organic soil products for Arizona.
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
              <Link href="/products">
                <Button className="bg-primary hover:bg-primary-light text-white">Shop Products</Button>
              </Link>
              <Link href="/contact">
                <Button variant="outline" className="bg-white text-primary border border-primary hover:bg-neutral-50">
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>
          <div className="lg:w-1/2 w-full">
            <div className="relative overflow-hidden rounded-2xl border border-neutral-200/60 bg-neutral-100 shadow-2xl">
              <img
                src="/images/field-content/field-application.jpg"
                alt="Soil Seed and Water team reviewing compost piles in Arizona"
                className="h-[420px] w-full object-cover lg:h-[560px]"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent p-5 text-white">
                <span className="inline-flex w-max items-center gap-2 rounded-full bg-primary px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                  Real Arizona operation
                </span>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-white/90 sm:text-base">
                  Compost, worm castings, blends, pallets, and truckloads handled by the same people you talk to when you order.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Photo Strip */}
        <div className="mt-16 grid grid-cols-2 gap-3 md:grid-cols-4">
          {fieldPhotos.map((photo) => (
            <figure key={photo.src} className="group relative overflow-hidden rounded-xl bg-neutral-100">
              <img src={photo.src} alt={photo.alt} className="h-44 w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" loading="lazy" />
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-3 pb-3 pt-8 text-xs font-semibold text-white">
                {photo.label}
              </figcaption>
            </figure>
          ))}
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch">
          <div className="rounded-2xl bg-primary p-6 text-white lg:p-8">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/70">From the yard</p>
            <h2 className="font-heading text-2xl font-bold">Real material. Real growers. Real logistics.</h2>
            <p className="mt-4 text-sm leading-relaxed text-white/85">
              We produce and move soil products for gardens, nurseries, farms, landscapers, and commercial projects across Arizona.
            </p>
            <div className="mt-6 grid gap-3 text-sm">
              <p className="flex items-center gap-2"><Truck className="h-4 w-4" /> Pallets, super sacks, and truckloads</p>
              <p className="flex items-center gap-2"><Sprout className="h-4 w-4" /> Compost, castings, mulch, and blends</p>
              <p className="flex items-center gap-2"><Users className="h-4 w-4" /> Built with growers and field partners</p>
              <p className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Pickup at Phoenix Agave Yard</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {fieldVideos.map((video) => (
              <div key={video.src} className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
                <div className="relative bg-black">
                  <video
                    className="aspect-video w-full object-cover"
                    controls
                    preload="metadata"
                    poster={video.poster}
                    playsInline
                  >
                    <source src={video.src} type="video/mp4" />
                  </video>
                </div>
                <div className="p-4">
                  <p className="flex items-center gap-2 font-heading text-base font-bold text-neutral-900">
                    <PlayCircle className="h-4 w-4 text-primary" />
                    {video.title}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-neutral-700">{video.copy}</p>
                </div>
              </div>
            ))}
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
          <Link href="/distributors">
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
