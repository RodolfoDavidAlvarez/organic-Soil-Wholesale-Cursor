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
  ShoppingBag,
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
      image: "/Size Categories- Pallet of Box.png",
      icon: <Box className="h-6 w-6" />,
    },
    {
      id: "pallet-bags",
      name: "Pallet of 1CF bags",
      description: "50 bags (1CF each)",
      image: "/Size Category - pallet of 50 1 CF bags.png",
      icon: <Package className="h-6 w-6" />,
    },
    {
      id: "bulk",
      name: "Bulk Delivery",
      description: "22-24 tons (soil amendments and concentrates) / 90-110 CYs (potting soil and mulch)",
      image: "/Truckload Bulk delivery.png",
      icon: <Container className="h-6 w-6" />,
    },
    {
      id: "cubic-yard",
      name: "Buy in Cubic Yard",
      description: "Bulk pickup only",
      image: "/CY of Bulk for pick only.png",
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
    // Generate slug from product type or name for better URLs
    const slug = generateProductSlug(product.productType, product.name);

    // Navigate to product detail page
    if (product.category === "Mulch") {
      navigate(`/products/mulch/${slug || product.id}`);
    } else {
      navigate(`/products/${slug || product.id}`);
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
        title="Premium Bulk Organic Soil Products"
        description="Arizona's leading wholesale supplier of organic soil amendments, compost, and potting soil in bulk. Serving landscapers, commercial growers, and farms with pallets, supersacks, and truckloads."
        keywords="bulk organic soil, wholesale compost, dairy compost bulk, worm castings wholesale, commercial soil supplier, soil amendments wholesale, potting soil bulk, landscaper soil supplier, golf course soil, supersack soil, pallet soil, wholesale plant nutrients"
        canonical="https://organicsoilwholesale.com"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          speakable: {
            "@type": "SpeakableSpecification",
            cssSelector: ["h1", ".speakable"],
          },
          name: "Organic Soil Wholesale - Premium Bulk Soil Products",
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
                <h1 className="text-3xl md:text-5xl font-bold text-primary mb-4">Buy Organic Soil Products</h1>
                <p className="text-2xl md:text-3xl text-muted-foreground flex items-center gap-4">
                  in wholesale <Truck className="h-10 w-10 md:h-14 md:w-14 text-primary/90" />
                </p>
              </motion.div>

              {/* Pickup and Distribution Center */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300"
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
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300"
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
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300"
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
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="inline-block">
                    <Button
                      onClick={() => navigate("/products")}
                      className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 w-full max-w-md"
                    >
                      View All Products
                      <ChevronRight className="ml-2 h-5 w-5" />
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Amazon Reviews - Mikey's Worm Poop */}
      <section className="py-12 md:py-16 px-4 md:px-8 bg-muted/20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center text-center mb-8 md:mb-12"
          >
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-extrabold text-primary tracking-tight">Mikey&apos;s Worm Poop Reviews</h2>
            <p className="text-muted-foreground mt-2 md:mt-3 text-sm md:text-base">Real Amazon customers on our worm castings</p>
          </motion.div>

          <div className="max-w-5xl mx-auto flex flex-col gap-8 lg:flex-row lg:items-start">
            {/* Product Images */}
            <div className="flex justify-center gap-4 lg:flex-col lg:items-start lg:justify-start">
              <div className="relative">
                <OptimizedImage
                  src="/images/optimized/mikeys-worm-poop9lbs.jpg"
                  alt="Mikey's Worm Poop 9lb bag"
                  className="w-24 h-24 md:w-28 md:h-28 object-cover rounded-xl shadow-sm"
                  sizes="(max-width: 768px) 96px, 112px"
                />
                <p className="text-xs text-center mt-2 text-muted-foreground">Product</p>
              </div>
              <div className="relative">
                <OptimizedImage
                  src="/images/optimized/worm-castting-product-texture.jpg"
                  alt="Worm castings texture"
                  className="w-24 h-24 md:w-28 md:h-28 object-cover rounded-xl shadow-sm"
                  sizes="(max-width: 768px) 96px, 112px"
                />
                <p className="text-xs text-center mt-2 text-muted-foreground">Texture</p>
              </div>
            </div>

            {/* Reviews Carousel */}
            <div className="relative w-full">
              <Carousel opts={{ align: "start", loop: true }} className="w-full">
                <CarouselContent className="-ml-3 md:-ml-4">
                  {reviews.map((review) => (
                    <CarouselItem key={review.id} className="pl-3 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
                      <div className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                        <div className="flex items-center gap-1 mb-3">
                          {Array.from({ length: review.rating }).map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2 leading-snug">{review.title}</h3>
                        <p className="text-gray-600 text-sm leading-relaxed mb-4">
                          {review.body.length > 150 ? `${review.body.substring(0, 150)}...` : review.body}
                        </p>
                        <div className="mt-auto flex items-center justify-between text-xs text-gray-500">
                          <span>{review.name}</span>
                          <span>Verified Purchase</span>
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-2 top-1/2 -translate-y-1/2 bg-white/90 shadow-md" />
                <CarouselNext className="right-2 top-1/2 -translate-y-1/2 bg-white/90 shadow-md" />
              </Carousel>
            </div>
          </div>
        </div>
      </section>

      {/* Pay & Pickup Promotion */}
      <section className="py-16 px-4 md:px-8 bg-muted/40">
        <div className="max-w-6xl mx-auto rounded-3xl border border-border shadow-lg bg-white">
          <div className="grid gap-10 lg:grid-cols-[1fr,0.9fr] items-stretch">
            <div className="p-8 md:p-12 lg:p-16 flex flex-col justify-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="space-y-5"
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <Truck className="h-4 w-4" />
                  Pay & Pickup
                </div>
                <h2 className="text-[clamp(2rem,3.6vw,2.75rem)] font-bold text-foreground">Pay & Pickup in Phoenix</h2>
                <p className="text-base md:text-lg text-muted-foreground">
                  Order online, choose a pickup window, and collect from our Phoenix yard. The crew stages pallets, totes, or bulk before you pull in.
                </p>
                <ul className="space-y-3 text-sm md:text-base text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <Clock className="mt-0.5 h-4 w-4 text-primary" />
                    <span>Pickup windows run 8:00&nbsp;AM–4:30&nbsp;PM, Monday through Friday.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 text-primary" />
                    <span>Location: 1634&nbsp;N&nbsp;19th Ave, Phoenix AZ 85009.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-4 w-4 text-primary" />
                    <span>Stripe checkout with QR confirmation keeps loading quick.</span>
                  </li>
                </ul>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Link href="/pay-and-pickup">
                    <Button size="lg" className="w-full sm:w-auto">
                      View pickup details
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                    <a href={PHOENIX_DIRECTIONS_URL} target="_blank" rel="noopener noreferrer">
                      Open directions
                    </a>
                  </Button>
                </div>
              </motion.div>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="relative flex items-center justify-center px-6 pb-10 pt-6 lg:pb-0"
            >
              <div className="w-full max-w-md">
                <Card className="border border-muted-foreground/10 bg-white shadow-lg">
                  <CardHeader className="space-y-2 pb-3">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="text-sm font-semibold uppercase tracking-wide">Next window</span>
                      <Clock className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-[clamp(1.35rem,2.4vw,1.8rem)] text-foreground">Today · 2:30 – 4:30 PM</CardTitle>
                    <CardDescription className="text-sm md:text-base">1634 N 19th Ave, Phoenix AZ</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm text-muted-foreground">
                    <div className="flex items-start gap-3 rounded-xl border border-muted-foreground/15 px-4 py-3">
                      <CreditCard className="mt-0.5 h-5 w-5 text-primary" />
                      <div>
                        <p className="font-semibold text-foreground">Pay online</p>
                        <p>Invoices clear through Stripe and trigger your pickup QR code.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-xl border border-muted-foreground/15 px-4 py-3">
                      <Truck className="mt-0.5 h-5 w-5 text-primary" />
                      <div>
                        <p className="font-semibold text-foreground">Arrive during your slot</p>
                        <p>Pull into the loading lane and show the QR code on your phone.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Showcase Photos Section */}
      <section className="py-16 px-4 md:px-8 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="relative inline-block">
              <h2 className="text-4xl md:text-6xl font-extrabold bg-gradient-to-r from-primary via-primary-dark to-primary bg-clip-text text-transparent mb-4 tracking-tight">
                Our Work in Action
              </h2>
              <div className="absolute -bottom-2 left-0 right-0 h-2 bg-gradient-to-r from-primary via-primary-dark to-primary rounded-full transform scale-x-75"></div>
            </div>
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
            <Card className="group relative overflow-hidden border border-muted-foreground/10 bg-white shadow-2xl flex flex-col">
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
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-black/0 transition-opacity duration-300 group-hover:from-black/95"></div>
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
              <Card className="border border-muted-foreground/10 bg-white shadow-lg overflow-hidden flex flex-col h-full">
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

              <Card className="border border-muted-foreground/10 bg-white shadow-lg overflow-hidden flex flex-col h-full">
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


      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary-dark z-0"></div>
        <div className="absolute inset-0 leaf-pattern opacity-10 z-0"></div>
        <div className="absolute -left-16 -top-16 w-64 h-64 bg-white/10 rounded-full blur-3xl z-0"></div>
        <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-white/10 rounded-full blur-3xl z-0"></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm p-10 md:p-16 rounded-3xl shadow-xl border border-white/20">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-6">
                  <ShoppingBag className="h-8 w-8 text-white" />
                </div>

                <h2 className="text-4xl font-heading font-bold mb-6 text-white">Looking for Small Quantities?</h2>

                <p className="text-xl mb-10 text-white/90 max-w-2xl mx-auto">
                  For orders of 1-2 units, please visit our retail store at Soil Seed and Water. We offer the same premium quality products in smaller
                  quantities for home gardeners and small projects.
                </p>

                <a
                  href="https://soilseedandwater.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-primary bg-white rounded-full shadow-lg hover:bg-white/90 transition-all duration-300"
                >
                  Visit Retail Store
                  <ArrowUpRight className="ml-2 h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
