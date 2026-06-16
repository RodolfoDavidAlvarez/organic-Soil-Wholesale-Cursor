import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Award, Leaf, MapPin, Phone, Truck, ChevronRight } from "lucide-react";
import SEO from "@/components/layout/SEO";
import { OptimizedImage } from "@/components/OptimizedImage";
import { getOptimizedImageSrc } from "@/utils/getOptimizedImageSrc";
import { getMulchProducts } from "@/data/productData";

const Landscapers = () => {
  const [, setLocation] = useLocation();

  // Featured products: Mulch, Worm Castings, Turf Daddy (data from JSON + stories)
  const mulchProduct = getMulchProducts()[0]; // Nature's Blanket Premium Mulch
  const mulchId = mulchProduct?.id ?? 3000; // MulchDetail route uses numeric id

  const heroImages = [
    getOptimizedImageSrc("Dark Mulk Applied in outside of office showcase.jpeg"),
    getOptimizedImageSrc("Raw Golden Looking Mulch Commercial Application look.jpeg"),
    getOptimizedImageSrc("worm-castings.jpg"),
    getOptimizedImageSrc("Turf Daddy1CF.jpg"),
  ].filter(Boolean);

  return (
    <>
      <SEO
        title="Landscaper Supplies Phoenix AZ | Premium Mulch, Worm Castings & Turf Daddy"
        description="Arizona's premier wholesale supplier for landscapers in Phoenix and statewide. Premium mulch, worm castings, and Turf Daddy blend. OMRI-listed, bulk delivery and pickup. Call (602) 637-0032."
        keywords="Phoenix landscaper soil, Arizona mulch wholesale, worm castings Phoenix, Turf Daddy Arizona, bulk mulch Phoenix, landscaper supplies Arizona, commercial mulch Phoenix, organic soil Phoenix"
        canonical="https://organicsoilwholesale.com/landscapers"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "Service",
          "name": "Landscaping Soil & Mulch Supply - Phoenix Arizona",
          "provider": { "@type": "Organization", "name": "Organic Soil Wholesale" },
          "serviceType": "Landscape Supply",
          "areaServed": [
            { "@type": "City", "name": "Phoenix", "containedInPlace": { "@type": "State", "name": "Arizona" } },
            { "@type": "State", "name": "Arizona" }
          ],
          "description": "Premium mulch, worm castings, and Turf Daddy for professional landscapers in Phoenix and Arizona. Bulk delivery and pickup.",
        }}
      />

      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
        {/* Hero — Phoenix / Arizona landscapers */}
        <section className="bg-[#264027] text-white py-12 sm:py-16 md:py-20 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 right-0 h-32 bg-white/10" />
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-black/10" />
          </div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-white/15 text-green-100 px-3 py-1.5 rounded-full text-sm font-medium mb-6">
                <MapPin className="h-4 w-4" />
                Phoenix & Arizona
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 leading-tight">
                Premium Mulch, Worm Castings & Turf Daddy for Phoenix Landscapers
              </h1>
              <p className="text-lg sm:text-xl text-green-100 max-w-2xl mx-auto mb-8">
                Arizona-made, OMRI-listed products for commercial and residential landscaping. Bulk delivery and call-and-pickup at 1634 N 19th Ave, Phoenix.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="min-h-[48px] border-0 !bg-white !text-[#264027] hover:!bg-green-50 font-semibold shadow-lg focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#264027]"
                  onClick={() => setLocation("/order")}
                >
                  Get a Quote
                </Button>
                <a href="tel:6026370032" className="contents">
                  <Button
                    size="lg"
                    className="min-h-[48px] border-2 border-white !bg-transparent !text-white hover:!bg-white hover:!text-[#264027] font-semibold shadow-lg focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#264027]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    (602) 637-0032
                  </Button>
                </a>
              </div>
            </div>
            {/* Hero image strip */}
            <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 max-w-4xl mx-auto">
              {heroImages.slice(0, 4).map((src, i) => (
                <div key={i} className="rounded-xl overflow-hidden shadow-xl aspect-[4/3]">
                  <OptimizedImage src={src} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Certifications */}
        <section className="py-4 sm:py-6 bg-white border-b border-gray-100">
          <div className="container mx-auto px-4">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
              <span className="text-sm font-semibold text-gray-600">Certified</span>
              <div className="flex items-center gap-6">
                <OptimizedImage src="omri-logo.png" alt="OMRI Listed" className="h-8 sm:h-10 w-auto" />
                <OptimizedImage src="uscc-logo.png" alt="USCC" className="h-8 sm:h-10 w-auto" />
                <OptimizedImage src="made-in-usa.png" alt="Made in USA" className="h-8 sm:h-10 w-auto" />
              </div>
            </div>
          </div>
        </section>

        {/* 1. Mulch — Nature's Blanket */}
        <section id="mulch" className="py-12 sm:py-16 md:py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              <div className="order-2 lg:order-1">
                <div className="rounded-2xl overflow-hidden shadow-xl">
                  <OptimizedImage
                    src={getOptimizedImageSrc("Dark Mulk Applied in outside of office showcase.jpeg")}
                    alt="Nature's Blanket premium mulch applied – Phoenix landscaping"
                    className="w-full aspect-[4/3] object-cover"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="rounded-lg overflow-hidden shadow-md">
                    <OptimizedImage
                      src={getOptimizedImageSrc("Raw Golden Looking Mulch Commercial Application look.jpeg")}
                      alt="Golden mulch commercial application"
                      className="w-full aspect-[4/3] object-cover"
                    />
                  </div>
                  <div className="rounded-lg overflow-hidden shadow-md">
                    <OptimizedImage
                      src={getOptimizedImageSrc("Dark Mulck Truckload Delivery.jpeg")}
                      alt="Bulk mulch truckload delivery Arizona"
                      className="w-full aspect-[4/3] object-cover"
                    />
                  </div>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <span className="text-sm font-semibold text-[#264027] uppercase tracking-wide">Featured for Landscapers</span>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mt-2 mb-4">
                  Our Beautiful Mulch — Nature's Blanket
                </h2>
                <p className="text-gray-600 mb-4">
                  Premium mulch enhanced with dairy compost and worm castings for superior moisture retention, weed suppression, and soil enhancement. Made in Arizona for commercial parks, residential projects, and garden beds.
                </p>
                <p className="text-gray-600 mb-6">
                  Soil Seed and Water's Nature's Blanket combines premium wood fibers with nutrient-rich dairy compost and worm castings. Use it as mulch (2–3" depth), for erosion control, or mix into soil as an amendment. Available in .5–1" and 1–2" sizes and in bulk for Phoenix-area jobs.
                </p>
                <ul className="space-y-2 mb-6 text-gray-700">
                  <li className="flex items-center gap-2"><Leaf className="h-4 w-4 text-green-600 flex-shrink-0" /> Moisture retention & weed suppression</li>
                  <li className="flex items-center gap-2"><Leaf className="h-4 w-4 text-green-600 flex-shrink-0" /> Improves soil structure</li>
                  <li className="flex items-center gap-2"><Leaf className="h-4 w-4 text-green-600 flex-shrink-0" /> Pallet of 1CF bags & bulk delivery</li>
                </ul>
                <Button
                  className="bg-[#264027] hover:bg-[#1e3320] text-white"
                  onClick={() => setLocation(`/products/mulch/${mulchId}`)}
                >
                  View Mulch Details <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Worm Castings — Mikey's Worm Poop */}
        <section id="worm-castings" className="py-12 sm:py-16 md:py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              <div>
                <span className="text-sm font-semibold text-[#264027] uppercase tracking-wide">Soil Health</span>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mt-2 mb-4">
                  Worm Castings — Mikey's Worm Poop
                </h2>
                <p className="text-gray-600 mb-4">
                  All-natural vermicompost developed after years of research at our Arizona facility. Our own dairy compost is the feedstock for our worms, so you get a consistent, premium amendment that boosts soil health and plant vitality.
                </p>
                <p className="text-gray-600 mb-6">
                  Ideal for landscapers: mix into planting holes and beds, top-dress existing plantings (½"–2"), or blend with soil before seeding. OMRI and US Compost Council certified. Available in 9 lb bags, 1CF bags, 2.2 CY totes, and bulk delivery across Phoenix and Arizona.
                </p>
                <ul className="space-y-2 mb-6 text-gray-700">
                  <li className="flex items-center gap-2"><Leaf className="h-4 w-4 text-green-600 flex-shrink-0" /> Boosts soil health & moisture retention</li>
                  <li className="flex items-center gap-2"><Leaf className="h-4 w-4 text-green-600 flex-shrink-0" /> Beneficial microbes & nutrients</li>
                  <li className="flex items-center gap-2"><Leaf className="h-4 w-4 text-green-600 flex-shrink-0" /> Bags, totes & bulk for commercial use</li>
                </ul>
                <Button
                  className="bg-[#264027] hover:bg-[#1e3320] text-white"
                  onClick={() => setLocation("/products/mikeys-worm-poop")}
                >
                  View Worm Castings <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
              <div className="rounded-2xl overflow-hidden shadow-xl">
                <OptimizedImage
                  src={getOptimizedImageSrc("Worm castting product texture.png")}
                  alt="Mikey's Worm Poop texture – premium worm castings"
                  className="w-full aspect-[4/3] object-cover"
                />
                <div className="mt-2 rounded-lg overflow-hidden shadow-md">
                  <OptimizedImage
                    src={getOptimizedImageSrc("Mikeys Worm Poop9lbs.jpg")}
                    alt="Mikey's Worm Poop 9 lb bag"
                    className="w-full aspect-[4/3] object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Turf Daddy */}
        <section id="turf-daddy" className="py-12 sm:py-16 md:py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              <div className="order-2 lg:order-1">
                <div className="rounded-2xl overflow-hidden shadow-xl">
                  <OptimizedImage
                    src={getOptimizedImageSrc("Turf Daddy1CF.jpg")}
                    alt="Turf Daddy Blend – overseed and turf topdress Arizona"
                    className="w-full aspect-[4/3] object-cover"
                  />
                </div>
                <div className="mt-2 rounded-lg overflow-hidden shadow-md">
                  <OptimizedImage
                    src={getOptimizedImageSrc("Compost Texture Look.jpg")}
                    alt="Turf Daddy texture"
                    className="w-full aspect-[4/3] object-cover"
                  />
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <span className="text-sm font-semibold text-[#264027] uppercase tracking-wide">Overseed & Turf</span>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mt-2 mb-4">
                  Turf Daddy Blend
                </h2>
                <p className="text-gray-600 mb-4">
                  Built for sustainable lawns in Arizona's climate. Turf Daddy has gotten strong feedback from golf courses, landscapers, and sod farms across the state. Our co-founder ran one of the largest landscape companies in the Southwest for over 30 years and designed this blend to amend and grow the soil for better turf.
                </p>
                <p className="text-gray-600 mb-6">
                  Essential for overseeding, aeration, or before laying new turf. The blend of organic worm and dairy compost plus zeolite improves soil quality, water and nutrient holding, and plant health—so you get greener, denser turf even in tough conditions. Available in 9 lb bags, 1CF bags, 2.2 CY totes, and bulk delivery in Phoenix and Arizona.
                </p>
                <ul className="space-y-2 mb-6 text-gray-700">
                  <li className="flex items-center gap-2"><Leaf className="h-4 w-4 text-green-600 flex-shrink-0" /> Overseeding, aeration & new turf</li>
                  <li className="flex items-center gap-2"><Leaf className="h-4 w-4 text-green-600 flex-shrink-0" /> Strong roots & water retention</li>
                  <li className="flex items-center gap-2"><Leaf className="h-4 w-4 text-green-600 flex-shrink-0" /> Golf courses, sod farms, residential & commercial</li>
                </ul>
                <Button
                  className="bg-[#264027] hover:bg-[#1e3320] text-white"
                  onClick={() => setLocation("/products/turf-daddy-blend")}
                >
                  View Turf Daddy <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Why Arizona / Local */}
        <section className="py-12 sm:py-16 bg-gray-50 border-t border-gray-100">
          <div className="container mx-auto px-4 text-center max-w-3xl">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Made in Arizona for Phoenix Landscapers</h2>
            <p className="text-gray-600 mb-6">
              All three products are produced in Arizona and suited to our climate. We offer bulk delivery and call-and-pickup at our Phoenix location so you can keep jobs on schedule without the guesswork.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="flex items-center gap-2 text-gray-700">
                <Truck className="h-5 w-5 text-[#264027]" />
                <span>Bulk delivery & pickup</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <MapPin className="h-5 w-5 text-[#264027]" />
                <span>1634 N 19th Ave, Phoenix, AZ 85009</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Award className="h-5 w-5 text-[#264027]" />
                <span>OMRI & USCC certified</span>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-12 sm:py-16 bg-[#264027] text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Ready to Order?</h2>
            <p className="text-green-100 mb-8 max-w-xl mx-auto">
              Get a custom quote for mulch, worm castings, or Turf Daddy. Bulk orders and pickup welcome.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="min-h-[48px] border-0 !bg-white !text-[#264027] hover:!bg-green-50 font-semibold shadow-lg focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#264027]"
                onClick={() => setLocation("/order")}
              >
                Get Your Custom Quote
              </Button>
              <a href="tel:6026370032" className="contents">
                <Button
                  size="lg"
                  className="min-h-[48px] border-2 border-white !bg-transparent !text-white hover:!bg-white hover:!text-[#264027] font-semibold shadow-lg focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#264027]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Call (602) 637-0032
                </Button>
              </a>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Landscapers;
