import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import SEO from "@/components/layout/SEO";
import {
  ArrowRight,
  CheckCircle,
  Leaf,
  Truck,
  Award,
  Calculator,
  MapPin,
  Search,
  ChevronDown,
  ChevronRight,
  Loader2,
  Filter,
  DollarSign,
  Trees,
  Package,
  Box,
  Container,
  Sprout,
  Tractor,
  Flower,
  Apple,
  ArrowUpRight,
  Building2,
  Clock,
  ShieldCheck,
  CreditCard,
  Compass,
  Star,
} from "lucide-react";
import { useEffect, useState } from "react";
import { productsData } from "@/data/productData";
import { useLocation } from "wouter";
import { generateProductSlug } from "@/utils/generateSlug";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SidebarCarousel from "@/components/layout/SidebarCarousel";
import ProductShowcase from "@/components/ProductShowcase";
import { motion } from "framer-motion";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { OptimizedImage } from "@/components/OptimizedImage";

// Temporary local Product type to resolve linter error
type Product = {
  id: number;
  name: string;
  description?: string;
  category: string;
  price?: number;
  stockQuantity?: number;
  imageUrl?: string;
  additionalImages?: string[];
  ingredients?: string;
  targetAudience?: string;
  recommendedUses?: string;
  certifications?: { name: string }[];
  sizeOptions?: { name: string; price: number }[];
};

type FeaturedProduct = Product & { productName?: string };

// Add type definitions
interface Certificate {
  name: string;
  icon: JSX.Element;
}

interface SizeOption {
  name: string;
  price: number;
}

interface ProductShowcaseProps {
  products: Product[];
  onProductSelect?: (product: Product) => void;
}

// Default placeholder image for products that don't have images
const DEFAULT_IMAGE = "potting-soil.jpg";

const Home = () => {
  // Product categories for showcase
  const productCategories = [
    { id: "worm-castings", name: "Worm Castings", icon: <Leaf className="h-6 w-6" /> },
    { id: "dairy-compost", name: "Dairy Compost", icon: <Truck className="h-6 w-6" /> },
    { id: "fruit-trees", name: "Fruit Trees", icon: <Trees className="h-6 w-6" /> },
    { id: "landscaping", name: "Landscaping", icon: <Filter className="h-6 w-6" /> },
  ];

  const showcaseVideoUrl =
    "https://www.youtube.com/embed/yZvjAPZ0dVQ?autoplay=1&mute=1&loop=1&playlist=yZvjAPZ0dVQ&controls=0&modestbranding=1&rel=0&playsinline=1";
  const showcaseWormVideoUrl =
    "https://www.youtube.com/embed/UBs6anRv2IY?autoplay=1&mute=1&loop=1&playlist=UBs6anRv2IY&controls=0&modestbranding=1&rel=0&playsinline=1";
  const showcaseFarmersVideoUrl =
    "https://www.youtube.com/embed/HbR7BH-6uxI?autoplay=1&mute=1&loop=1&playlist=HbR7BH-6uxI&controls=0&modestbranding=1&rel=0&playsinline=1";

  // Amazon reviews for Mikey's Worm Poop
  const reviews = [
    {
      id: 1,
      name: "Andre",
      title: "Best worm casting we've ever seen",
      date: "August 20, 2025",
      size: "9 lbs",
      body: "Fresh ready to use.",
      rating: 5,
    },
    {
      id: 2,
      name: "Andre",
      title: "Do they use little toilets to collect the poop?",
      date: "September 28, 2024",
      size: "9 lbs",
      body: "The bag was a nice gauge plastic. A nice consistency with no long turds. It had a fresh worm poo smell. It looks like ground coco but doesn't taste like it. Very earthy with a hint of beetle larvae.",
      rating: 5,
    },
    {
      id: 3,
      name: "Andre",
      title: "Great plant growth guao",
      date: "September 6, 2024",
      size: "9 lbs",
      body: "Planting my roses",
      rating: 5,
    },
    {
      id: 4,
      name: "Andre",
      title: "So far so good!",
      date: "August 22, 2024",
      size: "9 lbs",
      body: "Anytime I can get my hands on good organic fertilizer I'll take it This Mikey's Worm Poop Worm Castings Organic Fertilizer seems to be doing a smash up job so far. It's made well and a quality product. I feel it's important to use organic materials as much as possible when it comes to my own personal garden. Growing as organic as possible is key. The fertilizer is easy to work with. You mix a little in your soil and your good to go. The fertilizer has the appearance of pebbles and dirt/soil so it's really easy to manage. I have sprinkled some on top of the soil for my potted citrus tress so the fertilizer is versatile with where you want to utilize it. So far it's definitely worth the purchase. Here's hoping I grow a really great crop.",
      rating: 5,
    },
    {
      id: 5,
      name: "Bopper",
      title: "Great value, well packaged for shipping, and good quality castings",
      date: "July 15, 2024",
      size: "9 lbs",
      body: "Recommend! Mikey's Worm Poop from Soil Seed & Water is a great value - nine pounds of worm castings will go a good ways with my fall container gardening. The texture is good, no issues with gnats or flies, and no odor. I am always reluctant to try soil and soil amendments online because shipping and packaging can be an issue - I've received open bags, contaminated materials, etc. Mikey's Worm Poop is well packaged for shipping - the bag is strong and there's a double seal at the top where the bag can be resealed. Risk of contamination during shipping seems low as a result. Castings are well processed and the OMRI certification is also a huge plus. Also, the manufacturer has a website where I can read more about their backstory / process - which I like to see with gardening amendments I order online to make sure I'm not getting something I can't trust. Soil Seed & Water is a legitimate company with a great backstory!",
      rating: 5,
    },
  ];

  // State for products showcase
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [, navigate] = useLocation();

  // Helper function to get the display name for products
  const getProductDisplayName = (product: Product): string => {
    switch (product.name) {
      case "Mikey's Worm Poop":
        return "Worm Castings";
      case "SuperBooster":
        return "Organic Concentrated Amendment for Roses";
      case "Dan's Gold":
        return "All Natural Dairy Compost";
      case "Ready Go Garden":
        return "Organic Potting Soil";
      case "CannaBag":
        return "Cannabis Potting Soil";
      case "Amazonian Dark Earth":
        return "Biochar Mineral";
      case "Raw Dairy Manure":
        return "All-Natural Dairy Manure";
      case "Screened Raw Dairy Manure":
        return "Screened All-Natural Dairy Manure";
      case "Cyanobacteria":
        return "Microbial Soil Amendment";
      case "Tee Top Divot Repair Blend":
        return "Golf Course Tee Top Divot Repair Mix";
      case "Turf Daddy Blend":
        return "Overseed and Aeration Blend";
      case "Artemis Root Boost Blend":
        return "Tree and Shrub Planting Amendment";
      case "Bacchus Blend":
        return "Vineyard Blend";
      case "Mikey's Worm Tea (Liquid)":
        return "Liquid Vermicompost Tea";
      default:
        return product.description || product.name;
    }
  };

  // State for quote calculator
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [quotePrice, setQuotePrice] = useState<number | null>(null);
  const [truckingCost, setTruckingCost] = useState<number | null>(null);
  const [showQuote, setShowQuote] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [textureLoaded, setTextureLoaded] = useState<{ [key: number]: boolean }>({});

  // Map of our locations with coordinates for Arizona
  const locations = [
    { name: "Vicksburg", zip: "85348", deliverable: true, coordinates: { lat: 34.2417, lng: -113.768 } },
    { name: "Congress", zip: "85332", deliverable: true, coordinates: { lat: 34.1625, lng: -112.8507 } },
    { name: "Phoenix, AZ", zip: "85001", deliverable: true, coordinates: { lat: 33.4484, lng: -112.074 } },
  ];

  const PHOENIX_COORDINATES = { lat: 33.467944, lng: -112.100944 };
  const PHOENIX_MAP_EMBED_URL = `https://www.google.com/maps?q=${PHOENIX_COORDINATES.lat},${PHOENIX_COORDINATES.lng}&z=13&output=embed`;
  const PHOENIX_DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent("1634 N 19th Ave, Phoenix AZ 85009")}`;

  // Size categories data
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

  // Target audience data
  const targetAudiences = [
    {
      name: "Landscapers",
      description: "Professional landscaping services",
      icon: <Sprout className="h-6 w-6" />,
    },
    {
      name: "Farmers",
      description: "Agricultural operations",
      icon: <Tractor className="h-6 w-6" />,
    },
    {
      name: "Nurseries",
      description: "Plant nurseries and garden centers",
      icon: <Flower className="h-6 w-6" />,
    },
    {
      name: "Fruit Growers",
      description: "Orchards and fruit production",
      icon: <Apple className="h-6 w-6" />,
    },
  ];

  // Load products
  useEffect(() => {
    // Add IDs and required fields to the products
    const productsWithIds = productsData.map((product, index) => ({
      ...product,
      id: index + 1,
      name: product.name || "Unnamed Product",
      category: product.category || "Uncategorized",
      story: product.story || null,
      usage: product.usage || null,
      productType: product.productType || null,
      safetyPrecautions: product.safetyPrecautions || null,
      warranty: product.warranty || null,
      additionalImages: product.additionalImages || null,
      certifications: product.certifications || [],
      sizeOptions: product.sizeOptions || [],
    })) as Product[];

    setProducts(productsWithIds);
    setFilteredProducts(productsWithIds);
    setIsLoading(false);
  }, []);

  // Filter products when category changes
  useEffect(() => {
    if (selectedCategoryId === "all") {
      setFilteredProducts(products);
      return;
    }

    let filtered;

    switch (selectedCategoryId) {
      case "worm-castings":
        filtered = products.filter(
          (p) =>
            p.category.toLowerCase().includes("vermicompost") ||
            p.ingredients?.toLowerCase().includes("worm") ||
            p.name.toLowerCase().includes("worm")
        );
        break;
      case "dairy-compost":
        filtered = products.filter(
          (p) =>
            p.category.toLowerCase().includes("compost") || p.ingredients?.toLowerCase().includes("dairy") || p.name.toLowerCase().includes("dairy")
        );
        break;
      case "fruit-trees":
        filtered = products.filter((p) => p.targetAudience?.toLowerCase().includes("fruit") || p.recommendedUses?.toLowerCase().includes("fruit"));
        break;
      case "landscaping":
        filtered = products.filter(
          (p) =>
            p.category.toLowerCase().includes("turf") ||
            p.targetAudience?.toLowerCase().includes("landscap") ||
            p.name.toLowerCase().includes("lawn") ||
            p.name.toLowerCase().includes("turf")
        );
        break;
      default:
        filtered = products;
    }

    setFilteredProducts(filtered);
  }, [selectedCategoryId, products]);

  // Handle selection of a product
  const handleProductSelect = (product: Product) => {
    // Prefer slug for SEO-friendly URLs, fall back to generated slug or ID
    const identifier = product.slug || generateProductSlug(product.productType, product.name) || product.id;

    // Navigate to product detail page
    if (product.category === "Mulch") {
      navigate(`/products/mulch/${identifier}`);
    } else {
      navigate(`/products/${identifier}`);
    }
  };

  // Calculate trucking cost based on distance
  const calculateTruckingCost = () => {
    if (!selectedProduct || !selectedSize) return;

    // For demo purposes, we'll use a simple calculation
    const baseCost = 100;
    const costPerMile = 2;
    const distance = 50; // Demo distance

    const totalCost = baseCost + distance * costPerMile;
    setTruckingCost(totalCost);
  };

  // Calculate quote
  const calculateQuote = () => {
    if (!selectedProduct || !selectedSize) return;

    const sizeOption = selectedProduct.sizeOptions?.find((size) => size.name === selectedSize);

    if (!sizeOption) return;

    const productCost = sizeOption.price * quantity;
    const deliveryCost = truckingCost || 0;

    setQuotePrice(productCost + deliveryCost);
    setShowQuote(true);
  };

  // Render size options
  const renderSizeOptions = (size: { name: string; price: number }, i: number) => {
    return (
      <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
        <span className="text-foreground/80">{size.name}</span>
        <span className="font-semibold">${size.price.toFixed(2)}</span>
      </div>
    );
  };

  // Featured products data
  const featuredProducts: FeaturedProduct[] = [
    {
      id: 1, // Dan's Gold Dairy Compost
      name: "Dairy Compost",
      productName: "Dan's Gold",
      imageUrl: "Compost Texture Look.jpg",
      texturePhotoUrl: "Compost Texture Look.jpg",
      description: "ALL NATURAL DAIRY COMPOST",
      category: "Amendment",
    },
    {
      id: 2, // Mikey's Worm Poop
      name: "Worm Castings",
      productName: "Mikey's Worm Poop",
      imageUrl: "Worm castting product texture.png",
      texturePhotoUrl: "Worm castting product texture.png",
      description: "ALL NATURAL VERMICOMPOST",
      category: "Amendment",
    },
    {
      id: 23, // SuperBooster (corrected ID)
      name: "Organic Concentrated Blend",
      productName: "SuperBooster",
      imageUrl: "Concentrated Organic Amendment Fertilizer Product look.jpeg",
      texturePhotoUrl: "Concentrated Organic Amendment Fertilizer Product look.jpeg",
      description: "ORGANIC CONCENTRATED AMENDMENT",
      category: "Concentrated Amendment",
    },
    {
      id: 3, // Amazonian Dark Earth
      name: "Biochar",
      productName: "Amazonian Dark Earth",
      imageUrl: "Biochar Product Texture Look.jpg",
      texturePhotoUrl: "Biochar Product Texture Look.jpg",
      description: "BIOCHAR MINERAL",
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

      {/* Hero Section with Title */}
      <section className="relative pt-10 md:pt-16 pb-16 bg-white overflow-hidden min-h-[60vh]">
        <div className="container mx-auto px-4 relative z-10 h-full flex items-center">
          {/* Main Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">
            {/* Left Column - Title, Availability Checker, and Size Categories */}
            <div className="order-2 lg:order-1 lg:col-span-4 flex flex-col gap-6 mt-8 lg:mt-0">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center lg:text-left"
              >
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3 leading-tight">
                  Premium{" "}
                  <span className="text-primary">Organic Compost</span>
                </h1>
                <p className="text-xl md:text-2xl text-muted-foreground mb-4">
                  Wholesale Bulk Delivery
                </p>
                <p className="text-base text-muted-foreground/80 max-w-md">
                  Locally produced soil amendments for landscapers, farms, nurseries, and commercial growers.
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

      {/* Amazon Reviews - Mikey's Worm Poop */}
      <section className="py-20 md:py-28 px-4 md:px-8 bg-background relative overflow-hidden">
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
            {/* Left Side: Header & Product Info */}
            <div className="lg:col-span-4 space-y-8 lg:sticky lg:top-28">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-left space-y-6"
              >
                {/* Rating Badge */}
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-100 to-amber-50 border border-amber-200/50 rounded-full px-4 py-2.5 shadow-sm">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="w-4 h-4 fill-amber-500 text-amber-500" />
                    ))}
                  </div>
                  <span className="ml-1 font-bold text-amber-900 text-sm">5.0</span>
                  <span className="text-amber-700 text-xs font-medium">Customer Rating</span>
                </div>
                
                {/* Title */}
                <div className="space-y-3">
                  <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading font-extrabold text-primary tracking-tight leading-[1.1]">
                    Mikey&apos;s Worm Poop
                  </h2>
                  <p className="text-xl md:text-2xl text-muted-foreground font-medium">
                    Real Customer Reviews
                  </p>
                </div>
                
                <p className="text-muted-foreground text-base leading-relaxed">
                  See what gardeners and growers are saying about our premium organic worm castings on Amazon.
                </p>
              </motion.div>

              {/* Product Visuals */}
              <div className="grid grid-cols-2 gap-4">
                <div className="group relative rounded-xl overflow-hidden border border-border bg-white aspect-square">
                  <OptimizedImage
                    src="/images/optimized/mikeys-worm-poop9lbs.jpg"
                    alt="Mikey's Worm Poop 9lb bag"
                    className="w-full h-full object-contain p-3"
                    sizes="(max-width: 768px) 50vw, 200px"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-white/90 text-foreground text-xs font-semibold py-2 px-3 text-center border-t border-border">
                    The Product
                  </div>
                </div>
                <div className="group relative rounded-xl overflow-hidden border border-border bg-white aspect-square">
                  <OptimizedImage
                    src="/images/optimized/worm-castting-product-texture.jpg"
                    alt="Worm castings texture"
                    className="w-full h-full object-cover"
                    sizes="(max-width: 768px) 50vw, 200px"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-white/90 text-foreground text-xs font-semibold py-2 px-3 text-center border-t border-border">
                    Rich Texture
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="pt-2"
              >
                <Button
                  className="w-full gap-2 h-14 text-lg font-semibold shadow-sm hover:shadow transition-all duration-300 bg-primary hover:bg-primary/90"
                  size="lg"
                  onClick={() => handleProductSelect(products.find(p => p.name === "Mikey's Worm Poop") || products[0])}
                >
                  Shop Worm Castings <ArrowRight className="w-5 h-5" />
                </Button>
              </motion.div>
            </div>

            {/* Right Side: Reviews Carousel */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="lg:col-span-8 bg-white rounded-xl p-8 md:p-10 border-2 border-border shadow-sm"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">Recent Reviews</h3>
                  <p className="text-sm text-muted-foreground">From verified Amazon customers</p>
                </div>
              </div>

              <Carousel 
                opts={{ 
                  align: "start", 
                  loop: true,
                }} 
                className="w-full"
              >
                <div className="flex items-center justify-end mb-4 gap-2">
                  <CarouselPrevious className="static translate-y-0 hover:bg-primary hover:text-white border-gray-300 shadow-md hover:shadow-lg transition-all" />
                  <CarouselNext className="static translate-y-0 hover:bg-primary hover:text-white border-gray-300 shadow-md hover:shadow-lg transition-all" />
                </div>
                <CarouselContent className="-ml-4">
                  {reviews.map((review, index) => (
                    <CarouselItem key={review.id} className="pl-4 md:basis-1/2">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                      >
                        <Card className="h-full border-2 border-border bg-white hover:border-primary/20 hover:shadow-sm transition-all duration-300 flex flex-col group">
                          <CardHeader className="pb-4">
                            <div className="flex justify-between items-start gap-3 mb-3">
                              <div className="flex gap-0.5">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400 drop-shadow-sm" />
                                ))}
                              </div>
                              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full font-bold shadow-sm">
                                <CheckCircle className="w-3.5 h-3.5" /> Verified
                              </div>
                            </div>
                            <CardTitle className="text-xl font-bold text-gray-900 leading-tight mt-2 line-clamp-2 group-hover:text-primary transition-colors duration-300">
                              &quot;{review.title}&quot;
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pb-5 flex-grow">
                            <p className="text-muted-foreground text-sm leading-relaxed line-clamp-5">
                              {review.body}
                            </p>
                          </CardContent>
                          <CardFooter className="pt-4 border-t border-border mt-auto">
                            <div className="flex justify-between items-center w-full">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                  {review.name.charAt(0)}
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-bold text-sm text-gray-900">{review.name}</span>
                                  <span className="text-xs text-muted-foreground font-medium">{review.size} Purchase</span>
                                </div>
                              </div>
                              <span className="text-xs text-muted-foreground font-medium">{review.date}</span>
                            </div>
                          </CardFooter>
                        </Card>
                      </motion.div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            </motion.div>
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
                    title="Dan's Gold Dairy Compost Video"
                    className="absolute inset-0 h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  ></iframe>
                </div>
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 text-white">
                  <span className="text-xs uppercase tracking-[0.3em] text-white/60">Flagship Compost</span>
                  <h3 className="mt-2 text-2xl font-heading font-semibold sm:text-3xl">Dan&apos;s Gold Dairy Compost</h3>
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
