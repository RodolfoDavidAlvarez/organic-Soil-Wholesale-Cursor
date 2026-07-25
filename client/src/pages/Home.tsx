import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import SEO from "@/components/layout/SEO";
import {
  ArrowRight,
  MapPin,
  ChevronRight,
  Package,
  Box,
  Container,
  ArrowUpRight,
  Building2,
  Compass,
  Phone,
} from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { CUSTOMER_SUPPORT_PHONE_DISPLAY, CUSTOMER_SUPPORT_PHONE_TEL, PHOENIX_YARD_DIRECTIONS_URL, PHOENIX_YARD_ENTRANCE_COORDINATES } from "@/config/contact";
import { generateProductSlug } from "@/utils/generateSlug";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { OptimizedImage } from "@/components/OptimizedImage";
import TestimonialGallery from "@/components/TestimonialGallery";
import AmazonReviewCarousel from "@/components/AmazonReviewCarousel";

type FeaturedProduct = {
  id: number;
  name: string;
  productName?: string;
  slug?: string;
  description?: string;
  category: string;
  imageUrl?: string;
  texturePhotoUrl?: string;
  productType?: string;
};

const Home = () => {
  const [, navigate] = useLocation();

  const showcaseVideoUrl =
    "https://www.youtube.com/embed/yZvjAPZ0dVQ?autoplay=1&mute=1&loop=1&playlist=yZvjAPZ0dVQ&controls=0&modestbranding=1&rel=0&playsinline=1";
  const showcaseWormVideoUrl =
    "https://www.youtube.com/embed/UBs6anRv2IY?autoplay=1&mute=1&loop=1&playlist=UBs6anRv2IY&controls=0&modestbranding=1&rel=0&playsinline=1";
  const showcaseFarmersVideoUrl =
    "https://www.youtube.com/embed/HbR7BH-6uxI?autoplay=1&mute=1&loop=1&playlist=HbR7BH-6uxI&controls=0&modestbranding=1&rel=0&playsinline=1";

  const [phoenixLat, phoenixLng] = PHOENIX_YARD_ENTRANCE_COORDINATES.split(",");
  const PHOENIX_COORDINATES = { lat: Number(phoenixLat), lng: Number(phoenixLng) };
  const PHOENIX_MAP_EMBED_URL = `https://www.google.com/maps?q=${PHOENIX_COORDINATES.lat},${PHOENIX_COORDINATES.lng}&z=13&output=embed`;
  const PHOENIX_DIRECTIONS_URL = PHOENIX_YARD_DIRECTIONS_URL;

  const sizeCategories = [
    {
      id: "pallet-boxes",
      name: "Pallet of 9 lb bags",
      description: "144 units (36 cases of 4 units)",
      image: "/images/categories/sizes/Size Categories- Pallet of Box.png",
      icon: <Box className="h-6 w-6" />,
    },
    {
      id: "pallet-bags",
      name: "Pallet of 1CF bags",
      description: "50 bags (1CF each)",
      image: "/images/categories/sizes/Size Category - pallet of 50 1 CF bags.png",
      icon: <Package className="h-6 w-6" />,
    },
    {
      id: "bulk",
      name: "Bulk Delivery",
      description: "22-24 tons (soil amendments and concentrates) / 90-110 CYs (potting soil and mulch)",
      image: "/images/categories/sizes/Bulk delivery.png",
      icon: <Container className="h-6 w-6" />,
    },
    {
      id: "cubic-yard",
      name: "Buy in Cubic Yard",
      description: "Bulk pickup only",
      image: "/images/categories/sizes/CY of Bulk for pick only.png",
      icon: <Container className="h-6 w-6" />,
    },
  ];

  const handleProductSelect = (product: FeaturedProduct) => {
    const identifier = product.slug || generateProductSlug(product.productType, product.name) || product.id;
    if (product.category === "Mulch") {
      navigate(`/products/mulch/${identifier}`);
    } else {
      navigate(`/products/${identifier}`);
    }
  };

  const featuredProducts: FeaturedProduct[] = [
    {
      id: 1000,
      name: "Dairy Compost",
      productName: "Simon's Gold",
      slug: "simons-gold",
      imageUrl: "Compost Texture Look.jpg",
      texturePhotoUrl: "Compost Texture Look.jpg",
      description: "All-natural dairy compost",
      category: "Amendment",
    },
    {
      id: 1001,
      name: "Worm Castings",
      productName: "Mikey's Worm Poop",
      slug: "mikeys-worm-poop",
      imageUrl: "Worm castting product texture.png",
      texturePhotoUrl: "Worm castting product texture.png",
      description: "All-natural vermicompost",
      category: "Amendment",
    },
    {
      id: 4000,
      name: "Organic Concentrated Blend",
      productName: "SuperBooster",
      slug: "superbooster",
      imageUrl: "Concentrated Organic Amendment Fertilizer Product look.jpeg",
      texturePhotoUrl: "Concentrated Organic Amendment Fertilizer Product look.jpeg",
      description: "Organic concentrated amendment",
      category: "Concentrated Amendment",
    },
    {
      id: 1002,
      name: "Biochar",
      productName: "Amazonian Dark Earth",
      slug: "amazonian-dark-earth",
      imageUrl: "Biochar Product Texture Look.jpg",
      texturePhotoUrl: "Biochar Product Texture Look.jpg",
      description: "Biochar mineral amendment",
      category: "Amendment",
    },
  ];

  return (
    <div className="min-h-screen bg-background">

      <SEO
        title="Arizona-Made Organic Compost & Soil | Wholesale Bulk Supplier"
        description="Arizona's leading wholesale supplier of locally-produced organic soil amendments, compost, and potting soil in bulk. Serving landscapers, commercial growers, and farms with pallets, supersacks, and truckloads. Made in Arizona."
        keywords="Arizona compost, Arizona made soil, local compost Arizona, bulk organic soil, wholesale compost, dairy compost bulk, worm castings wholesale, commercial soil supplier, soil amendments wholesale, potting soil bulk, landscaper soil supplier, golf course soil, supersack soil, pallet soil, wholesale plant nutrients, HB 2819"
        canonical="https://organicsoilwholesale.com"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          speakable: {
            "@type": "SpeakableSpecification",
            cssSelector: ["h1", ".speakable"],
          },
          name: "Organic Soil Wholesale - Arizona-Made Premium Bulk Soil Products",
          url: "https://organicsoilwholesale.com",
          potentialAction: {
            "@type": "SearchAction",
            target: "https://organicsoilwholesale.com/products?category={search_term_string}",
            "query-input": "required name=search_term_string",
          },
        }}
      >
        <link rel="preload" href="/hero-main-photo-v2-optimized.jpg" as="image" />
      </SEO>

      {/* Turf Daddy Hero — Organic Soil Wholesale brand */}
      <section className="relative isolate overflow-hidden bg-stone-900 text-white">
        <div className="absolute inset-0 -z-10">
          <img
            src="/images/optimized/turf-daddy-blend-lifestyle.jpg"
            alt="Turf Daddy applied to a lawn"
            className="h-full w-full object-cover opacity-40"
            loading="eager"
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-stone-950/90 via-stone-950/70 to-stone-950/40" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-stone-50 to-transparent" />
        </div>
        <div className="container mx-auto px-4 py-20 md:py-28 lg:py-36">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="lg:col-span-5"
            >
              <div className="mb-5">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-stone-300/80">
                  by Soil Seed &amp; Water
                </p>
              </div>
              <h1 className="font-heading text-4xl font-extrabold leading-[1.05] tracking-tight md:text-5xl lg:text-6xl">
                Bulk soil that <span className="text-[#d6c1a0]">grows results</span> you can see.
              </h1>
              <p className="mt-5 max-w-xl text-base text-stone-200 md:text-lg">
                Dairy compost, worm castings, premium potting blends and amendments — produced in Arizona, delivered by the pallet, supersack, or truckload to landscapers, farms, and nurseries.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  size="lg"
                  onClick={() => {
                    trackEvent("Hero CTA Clicked", { cta: "shop_products" });
                    navigate("/products");
                  }}
                  className="h-14 gap-2 bg-[#d6c1a0] px-8 text-lg font-extrabold tracking-tight text-stone-950 shadow-xl ring-1 ring-white/30 hover:bg-[#c4a878]"
                >
                  Get Soil Today <ArrowRight className="h-5 w-5 stroke-[3]" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="h-14 gap-2 border-white/30 bg-white/5 px-8 text-base font-semibold text-white backdrop-blur hover:bg-white/15 hover:text-white"
                >
                  <a
                    href={CUSTOMER_SUPPORT_PHONE_TEL}
                    onClick={() => trackEvent("Hero CTA Clicked", { cta: "call" })}
                  >
                    <Phone className="h-5 w-5" />
                    Call {CUSTOMER_SUPPORT_PHONE_DISPLAY}
                  </a>
                </Button>
              </div>
              <div className="mt-10 grid grid-cols-3 gap-6 border-t border-white/15 pt-6 text-sm text-stone-300">
                <div>
                  <p className="font-bold text-white">Made in AZ</p>
                  <p className="text-xs text-stone-400">Phoenix-based</p>
                </div>
                <div>
                  <p className="font-bold text-white">OMRI eligible</p>
                  <p className="text-xs text-stone-400">Organic-program ready</p>
                </div>
                <div>
                  <p className="font-bold text-white">Same-week</p>
                  <p className="text-xs text-stone-400">delivery across AZ</p>
                </div>
              </div>
              <figure className="mt-8 overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10 lg:hidden">
                <img
                  src="/images/hero/turf-daddy-before-after-hero.jpg"
                  alt="Turf Daddy before-and-after lawn transformation"
                  className="block w-full"
                />
                <figcaption className="bg-black/80 p-4">
                  <p className="text-sm font-semibold leading-tight text-white">
                    Turf Daddy testimonial: before / after results.
                  </p>
                </figcaption>
              </figure>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="hidden lg:col-span-7 lg:block"
            >
              <div className="relative">
                <div className="absolute -inset-10 rounded-3xl bg-gradient-to-br from-[#d6c1a0]/40 to-transparent blur-3xl" />
                <figure className="relative overflow-hidden rounded-3xl shadow-2xl ring-1 ring-white/10">
                  <img
                    src="/images/hero/turf-daddy-before-after-hero.jpg"
                    alt="Turf Daddy before-and-after lawn transformation"
                    className="block w-full"
                  />
                  <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent p-5 md:p-6">
                    <p className="text-base font-semibold leading-tight text-white md:text-lg">
                      Turf Daddy testimonial <span className="text-[#d6c1a0]">before / after results.</span>
                    </p>
                  </figcaption>
                </figure>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Amazon quotes first (stars + words), then field-photo proof */}
      <AmazonReviewCarousel />
      <TestimonialGallery />

      <section className="bg-stone-50 py-10 md:py-14">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#7a5a2e]">
                Arizona-made soil
              </p>
              <h2 className="font-heading text-2xl font-bold leading-tight text-stone-900 md:text-3xl">
                Built in real yards for real projects.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-stone-600 md:text-base">
                From Phoenix pickup to farm and orchard deliveries, our products are made, loaded, and used here in Arizona.
              </p>
              <Button
                onClick={() => navigate("/products")}
                className="mt-5 bg-primary px-6 text-white hover:bg-primary/90"
              >
                Shop pickup products
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <img
                src="/images/field-content/field-application.jpg"
                alt="Growers reviewing compost in Arizona"
                className="h-56 w-full rounded-2xl object-cover shadow-sm"
                loading="lazy"
              />
              <img
                src="/images/field-content/super-sack-loading-poster.jpg"
                alt="Super sack loading for wholesale order"
                className="h-56 w-full rounded-2xl object-cover shadow-sm"
                loading="lazy"
              />
              <img
                src="/images/field-content/orchard-application-poster.jpg"
                alt="Compost applied in orchard rows"
                className="h-56 w-full rounded-2xl object-cover shadow-sm"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Distribution + Featured Products */}
      <section className="relative pt-10 md:pt-16 pb-16 bg-white overflow-hidden">
        <div className="container mx-auto px-4 relative z-10 h-full flex items-center">
          {/* Main Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">
            {/* Left Column - Availability Checker, and Size Categories */}
            <div className="order-2 lg:order-1 lg:col-span-4 flex flex-col gap-6 mt-8 lg:mt-0">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-center lg:text-left"
              >
                <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-3 leading-tight">
                  Pickup, pallet, or truckload.
                </h2>
                <p className="text-base text-muted-foreground/80 max-w-md">
                  Locally produced soil amendments and bulk loads for landscapers, farms, nurseries, and commercial growers.
                </p>
              </motion.div>

              {/* Pickup and Distribution Center */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="bg-white rounded-xl border-2 border-border p-6 shadow-sm"
              >
                <div className="flex items-center gap-3 mb-4">
                  <MapPin className="h-6 w-6 text-primary" />
                  <h2 className="text-lg font-bold text-primary">Pickup & Distribution</h2>
                </div>
                <div className="space-y-5">
                  <p className="text-muted-foreground flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary/70" />
                    <span>1634 N 19th Ave, Phoenix AZ 85009</span>
                  </p>
                  <div className="rounded-2xl overflow-hidden border border-primary/10 shadow-inner h-56">
                    <iframe
                      title="Organic Soil Wholesale Phoenix Distribution Center Map"
                      src={PHOENIX_MAP_EMBED_URL}
                      loading="lazy"
                      allowFullScreen
                      referrerPolicy="no-referrer-when-downgrade"
                      className="h-full w-full border-0"
                    ></iframe>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Compass className="h-4 w-4 text-primary" />
                      <span>33&deg;28&apos;04.6&quot;N | 112&deg;06&apos;03.4&quot;W</span>
                    </div>
                    <Button asChild size="sm" className="gap-2">
                      <a href={PHOENIX_DIRECTIONS_URL} target="_blank" rel="noopener noreferrer">
                        Open directions
                        <ArrowUpRight className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              </motion.div>

              {/* Size Categories Carousel */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="bg-white rounded-xl border-2 border-border p-6 shadow-sm"
              >
                <h2 className="text-lg font-bold mb-4">Size Categories</h2>
                <Carousel
                  opts={{
                    align: "center",
                    loop: true,
                    skipSnaps: false,
                    containScroll: "trimSnaps",
                  }}
                  className="w-full"
                >
                  <CarouselContent>
                    {sizeCategories.map((category, index) => (
                      <CarouselItem key={category.id}>
                        <div className="relative aspect-[4/3] rounded-lg overflow-hidden group cursor-pointer hover:shadow-lg transition-all duration-300">
                          <OptimizedImage
                            src={category.image}
                            alt={category.name}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            priority={index === 0}
                            sizes="(max-width: 768px) 90vw, (max-width: 1024px) 45vw, 28vw"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent p-4 flex flex-col justify-end">
                            <div className="flex items-center gap-2 mb-2">
                              {category.icon}
                              <h3 className="text-white text-lg font-semibold">{category.name}</h3>
                            </div>
                            <p className="text-white/90 text-sm">{category.description}</p>
                          </div>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="left-2" />
                  <CarouselNext className="right-2" />
                </Carousel>
              </motion.div>
            </div>

            {/* Right Column - Featured Products */}
            <div className="order-1 lg:order-2 lg:col-span-8 mt-0 lg:mt-0">
              <h2 className="mb-4 text-3xl font-heading font-bold text-primary lg:hidden text-center">Featured Products</h2>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="bg-white rounded-xl border-2 border-border p-6 shadow-sm"
              >
                <h2 className="hidden text-xl font-bold mb-4 lg:block">Featured Products</h2>
                <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                  {featuredProducts.map((product, index) => (
                    <motion.div
                      key={product.id}
                      className="group cursor-pointer"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => handleProductSelect(product)}
                    >
                      <div className="relative aspect-square overflow-hidden rounded-2xl bg-neutral-50">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 to-black/0 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors duration-300 z-10 flex items-center justify-center">
                          <div className="bg-white text-primary font-semibold px-6 py-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0 duration-300 min-h-[44px] flex items-center">
                            View Details
                          </div>
                        </div>
                        <OptimizedImage
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          priority={index < 2}
                          sizes="(max-width: 768px) 90vw, (max-width: 1024px) 45vw, 25vw"
                        />
                      </div>
                      <div className="mt-4 text-center">
                        <h3 className="text-xl font-heading font-bold text-foreground group-hover:text-primary transition-colors duration-200">
                          {product.name}
                        </h3>
                        {product.productName && <p className="text-sm font-semibold text-muted-foreground mt-1">{product.productName}</p>}
                      </div>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-8 text-center">
                  <Button
                    onClick={() => navigate("/products")}
                    className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg rounded-xl shadow-sm hover:shadow transition-all duration-300 w-full max-w-md"
                  >
                    View All Products
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>


      {/* Showcase Photos Section */}
      <section className="py-16 px-4 md:px-8 bg-white border-t border-border">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-extrabold text-foreground mb-4 tracking-tight">
              Our Work in Action
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground mt-4 max-w-2xl mx-auto">
              Discover our premium organic soil products in action across various applications
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]"
          >
            <Card className="group relative overflow-hidden border-2 border-border bg-white shadow-sm flex flex-col">
              <CardContent className="relative flex-1 p-0 bg-black">
                <div className="relative aspect-video w-full lg:h-full">
                  <iframe
                    src={showcaseVideoUrl}
                    title="Simon's Gold Dairy Compost Video"
                    className="absolute inset-0 h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  ></iframe>
                </div>
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 text-white">
                  <span className="text-xs uppercase tracking-[0.3em] text-white/60">Flagship Compost</span>
                  <h3 className="mt-2 text-2xl font-heading font-semibold sm:text-3xl">Simon&apos;s Gold Dairy Compost</h3>
                  <p className="mt-3 text-sm text-white/80 sm:text-base">
                    See how we transform raw dairy into living soil that feeds commercial landscapes and farms across the Southwest.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="bg-white/80 px-6 py-4 text-sm text-primary/80 backdrop-blur-sm sm:text-base">
                Watch the full process from dairy partnerships to screened finished compost.
              </CardFooter>
            </Card>

            <div className="flex flex-col gap-8">
              <Card className="border-2 border-border bg-white shadow-sm overflow-hidden flex flex-col h-full">
                <CardContent className="p-0 bg-black">
                  <div className="relative aspect-video w-full">
                    <iframe
                      src={showcaseWormVideoUrl}
                      title="Worm Farming Video"
                      className="absolute inset-0 h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    ></iframe>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3 bg-white p-6 text-left">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-lg font-semibold text-primary">Worm Farming Hub</h3>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary uppercase tracking-wide">
                      Vermicompost
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Follow our castings operation—from feedstock blends to gentle harvesting that preserves microbe diversity.
                  </p>
                </CardFooter>
              </Card>

              <Card className="border-2 border-border bg-white shadow-sm overflow-hidden flex flex-col h-full">
                <CardContent className="p-0 bg-black">
                  <div className="relative aspect-video w-full">
                    <iframe
                      src={showcaseFarmersVideoUrl}
                      title="Compost Blend for Farmers Video"
                      className="absolute inset-0 h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    ></iframe>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3 bg-white p-6 text-left">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-lg font-semibold text-primary">Field Application</h3>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary uppercase tracking-wide">Bulk Loads</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    See the on-farm blends we craft for commercial growers and how we stage truckloads for fast delivery.
                  </p>
                </CardFooter>
              </Card>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;
