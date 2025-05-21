import { Link } from "wouter";
import { Button } from "@/components/ui/button";
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
  ChevronLeft,
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
} from "lucide-react";
import { useEffect, useState, useCallback, useRef } from "react";
import { productsData } from "@/data/productData";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SidebarCarousel from "@/components/layout/SidebarCarousel";
import ProductShowcase from "@/components/ProductShowcase";
import { motion } from "framer-motion";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";

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
const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80";

const Home = () => {
  // Product categories for showcase
  const productCategories = [
    { id: "worm-castings", name: "Worm Castings", icon: <Leaf className="h-6 w-6" /> },
    { id: "dairy-compost", name: "Dairy Compost", icon: <Truck className="h-6 w-6" /> },
    { id: "fruit-trees", name: "Fruit Trees", icon: <Trees className="h-6 w-6" /> },
    { id: "landscaping", name: "Landscaping", icon: <Filter className="h-6 w-6" /> },
  ];

  // Carousel images
  const carouselImages = [
    {
      url: "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/SSWwholesale.com%2FShowcase%20photos%2FRaw%20Golden%20Looking%20Mulch%20Commercial%20Application%20look.jpeg?alt=media&token=2e512497-e7a0-49b9-a566-85406662e769",
      alt: "Raw Golden Looking Mulch Commercial Application",
      type: "image",
    },
    {
      url: "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/SSWwholesale.com%2FShowcase%20photos%2FFull%20Truckload%20(Mixed%20Pallets%20and%20Totes).jpeg?alt=media&token=c946dc07-80a0-4050-b490-e97f7485d19f",
      alt: "Full Truckload Mixed Pallets and Totes",
      type: "image",
    },
    {
      url: "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/SSWwholesale.com%2FShowcase%20photos%2FDark%20Mulck%20Truckload%20Delivery.jpeg?alt=media&token=a7848c69-e01f-49df-a448-9f49222021f3",
      alt: "Dark Mulch Truckload Delivery",
      type: "image",
    },
    {
      url: "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/SSWwholesale.com%2FShowcase%20photos%2FDARK%20MULCH%20Outside%20of%20office%20application.jpeg?alt=media&token=9e8b9c0e-2db7-4e06-8911-d83c5003b07e",
      alt: "Dark Mulch Office Application",
      type: "image",
    },
    {
      url: "https://www.youtube.com/shorts/HxbpgFEyc6U",
      alt: "Watch our process in action",
      type: "video",
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
  const [customerZip, setCustomerZip] = useState<string>("");
  const [customerAddress, setCustomerAddress] = useState<string>("");
  const [quotePrice, setQuotePrice] = useState<number | null>(null);
  const [truckingCost, setTruckingCost] = useState<number | null>(null);
  const [showQuote, setShowQuote] = useState<boolean>(false);
  const [isDeliverable, setIsDeliverable] = useState<boolean | null>(null);
  const [distanceToClosestLocation, setDistanceToClosestLocation] = useState<number | null>(null);
  const [closestLocation, setClosestLocation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [textureLoaded, setTextureLoaded] = useState<{ [key: number]: boolean }>({});

  // Map of our locations with coordinates for Arizona
  const locations = [
    { name: "Vicksburg", zip: "85348", deliverable: true, coordinates: { lat: 34.2417, lng: -113.768 } },
    { name: "Congress", zip: "85332", deliverable: true, coordinates: { lat: 34.1625, lng: -112.8507 } },
    { name: "Phoenix", zip: "85001", deliverable: true, coordinates: { lat: 33.4484, lng: -112.074 } },
  ];

  // Size categories data
  const sizeCategories = [
    {
      id: "pallet-boxes",
      name: "Pallet of Boxes",
      description: "144 units / 36 boxes (4 units per box)",
      image:
        "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/SSWwholesale.com%2FSize%20Categories%2FSize%20Categories-%20Pallet%20of%20Box.png?alt=media&token=730d72a2-62b1-4c53-bd67-426f7224772e",
      icon: <Box className="h-6 w-6" />,
    },
    {
      id: "pallet-bags",
      name: "Pallet of Bags",
      description: "50 bags (1cf Bags)",
      image:
        "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/SSWwholesale.com%2FSize%20Categories%2FSize%20Category%20-%20pallet%20of%20bags.png?alt=media&token=4ff026e5-7318-4c35-869a-a1bc0a3ff94d",
      icon: <Package className="h-6 w-6" />,
    },
    {
      id: "bulk",
      name: "Bulk Delivery",
      description: "Compost and blends: 22-24 tons per truckload\nPotting soil: 90-110 CYs",
      image:
        "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/SSWwholesale.com%2FSize%20Categories%2FBulk%20delivery.png?alt=media&token=5c59cabf-aa01-4745-9026-51ee7ab8f195",
      icon: <Container className="h-6 w-6" />,
    },
  ];

  // Add state for carousel API
  const [api, setApi] = useState<CarouselApi>();
  const [currentSizeIndex, setCurrentSizeIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  // Add useEffect for auto-rotation and state sync
  useEffect(() => {
    if (!api) return;

    const onSelect = () => {
      setCurrentSizeIndex(api.selectedScrollSnap());
    };

    api.on("select", onSelect);

    if (!isHovering) {
      const interval = setInterval(() => {
        api.scrollNext();
      }, 1500); // Change image every 1.5 seconds

      return () => {
        clearInterval(interval);
        api.off("select", onSelect);
      };
    }

    return () => {
      api.off("select", onSelect);
    };
  }, [api, isHovering]);

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
    // Navigate to product detail page
    navigate(`/products/${product.id}`);
  };

  // Handle ZIP code change
  const handleZipChange = (value: string) => {
    setCustomerZip(value);
    // Simple validation for US zip codes
    if (value.length === 5 && !isNaN(parseInt(value))) {
      // Calculate distance and check if deliverable
      calculateDeliverability(value);
    } else {
      setIsDeliverable(null);
      setDistanceToClosestLocation(null);
      setClosestLocation(null);
    }
  };

  // Handle ZIP code validation
  const handleZipValidation = () => {
    calculateDeliverability(customerZip);
  };

  // Calculate deliverability based on zip code
  const calculateDeliverability = (zip: string) => {
    // For demo purposes we'll use AZ zip codes starting with 85 as deliverable
    const isArizona = zip.startsWith("85");

    // Simulate calculating distance to nearest location
    // In a real app, you would use Google Maps Distance Matrix API
    let distance = 0;
    let nearestLocation = "";

    if (isArizona) {
      // Simulate distances based on zip code
      const zipNum = parseInt(zip.substring(2, 5));

      // Distance to Vicksburg
      const distToVicksburg = Math.abs(zipNum - 348) * 2 + 30;

      // Distance to Congress
      const distToCongress = Math.abs(zipNum - 332) * 2 + 40;

      // Distance to Phoenix
      const distToPhoenix = Math.abs(zipNum - 1) * 2 + 10;

      // Find closest location
      const distances = [
        { loc: "Vicksburg", dist: distToVicksburg },
        { loc: "Congress", dist: distToCongress },
        { loc: "Phoenix", dist: distToPhoenix },
      ];

      distances.sort((a, b) => a.dist - b.dist);
      distance = distances[0].dist;
      nearestLocation = distances[0].loc;

      // Check if within deliverable range (max 500 miles for demo)
      setIsDeliverable(distance <= 500);
    } else {
      // Outside Arizona - use higher distance
      distance = 600; // Beyond deliverable range
      nearestLocation = "Phoenix";
      setIsDeliverable(false);
    }

    setDistanceToClosestLocation(distance);
    setClosestLocation(nearestLocation);
  };

  // Calculate trucking cost based on distance
  const calculateTruckingCost = () => {
    if (distanceToClosestLocation === null) return null;

    // Apply trucking cost formula from the framework
    // Base trucking rate: $500 for the first 50 miles
    // Per-mile rate: $3.00/mile after 50 miles

    let cost = 500; // Base rate

    if (distanceToClosestLocation > 50) {
      cost += (distanceToClosestLocation - 50) * 3;
    }

    return Math.round(cost);
  };

  // Calculate a product quote with trucking
  const calculateQuote = () => {
    if (!selectedProduct || !selectedSize || quantity <= 0) return;

    // Calculate product cost
    let basePrice = selectedProduct.price || 0;

    // Adjust price based on size
    const sizeMultiplier = selectedSize.includes("Tote") ? 10 : selectedSize.includes("Bulk") ? 20 : 1;

    // Calculate trucking cost
    const shipping = calculateTruckingCost() || 0;
    setTruckingCost(shipping);

    // Calculate quote (product price + shipping)
    const productCost = basePrice * sizeMultiplier * quantity;
    const totalCost = productCost + (isDeliverable ? shipping : 0);

    setQuotePrice(totalCost);
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

  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isVideoExpanded, setIsVideoExpanded] = useState(false);
  const videoRef = useRef<HTMLIFrameElement>(null);

  const handleVideoClick = () => {
    setIsVideoExpanded(!isVideoExpanded);
    if (videoRef.current) {
      const videoUrl = videoRef.current.src;
      if (isVideoPlaying) {
        videoRef.current.src = videoUrl.replace("autoplay=1", "autoplay=0");
      } else {
        videoRef.current.src = videoUrl + (videoUrl.includes("?") ? "&" : "?") + "autoplay=1";
      }
      setIsVideoPlaying(!isVideoPlaying);
    }
  };

  const handleVideoHover = (isHovering: boolean) => {
    if (videoRef.current && !isVideoExpanded) {
      const videoUrl = videoRef.current.src;
      if (isHovering) {
        // Pause video on hover
        videoRef.current.src = videoUrl.replace("autoplay=1", "autoplay=0");
        setIsVideoPlaying(false);
      } else {
        // Resume video if it was playing before
        if (isVideoPlaying) {
          videoRef.current.src = videoUrl + (videoUrl.includes("?") ? "&" : "?") + "autoplay=1";
        }
      }
    }
  };

  // Featured products data
  const featuredProducts = [
    {
      id: 1,
      name: "Dairy Compost",
      imageUrl:
        "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/SSWwholesale.com%2FProduct%20Texture%2FCompost%20Texture%20Look.jpg?alt=media&token=217ce928-c092-4f45-b424-7acdd9905570",
      description: "ALL NATURAL DAIRY COMPOST",
      category: "Compost",
    },
    {
      id: 2,
      name: "Worm Castings",
      imageUrl:
        "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/SSWwholesale.com%2FProduct%20Texture%2FWorm%20Castings%20Texture%20Look.jpeg?alt=media&token=dd706f8d-a4c1-4982-89d1-2f1ab3980a08",
      description: "ALL NATURAL VERMICOMPOST",
      category: "Vermicompost",
    },
    {
      id: 3,
      name: "Organic Concentrated Blend",
      imageUrl:
        "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/SSWwholesale.com%2FProduct%20Texture%2FConcentrated%20Organic%20Amendment%20Fertilizer%20Product%20look.jpeg?alt=media&token=11f5d2d1-d9fa-4aac-bba2-3e5360adbfe9",
      description: "ORGANIC CONCENTRATED AMENDMENT",
      category: "Soil Amendment",
    },
    {
      id: 4,
      name: "Biochar",
      imageUrl:
        "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/SSWwholesale.com%2FProduct%20Texture%2FBiochar%20Product%20Texture%20Look.jpg?alt=media&token=7cecfc15-eb1f-4a2a-b229-a2d594fb4b90",
      description: "BIOCHAR MINERAL",
      category: "Soil Amendment",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Title */}
      <section className="relative py-8 bg-white">
        <div className="container mx-auto px-4">
          {/* Main Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column - Title, Availability Checker, and Size Categories */}
            <div className="lg:col-span-4 flex flex-col gap-6">
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

              {/* Availability Checker */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 border border-primary/10"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-6 w-6 text-primary"
                    >
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-bold text-primary">Check Your Availability</h2>
                </div>
                <div className="relative w-full h-40 mb-4 rounded-lg overflow-hidden bg-gradient-to-br from-primary/10 to-primary/20">
                  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1579546929518-9e396f3cc809?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80')] bg-cover opacity-30"></div>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="bg-white/90 backdrop-blur-sm p-4 rounded-full mb-2 inline-block">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-8 w-8 text-primary"
                        >
                          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                      </div>
                      <p className="text-primary font-medium">Enter your ZIP code to check delivery availability</p>
                    </div>
                  </div>
                </div>
                <div className="w-full">
                  <div className="flex gap-2 w-full">
                    <Input
                      placeholder="Enter ZIP code"
                      className="flex-1 h-10 text-sm border-primary/20 focus:border-primary"
                      value={customerZip}
                      onChange={(e) => handleZipChange(e.target.value)}
                      maxLength={5}
                    />
                  </div>
                  {customerZip.length === 5 && (
                    <div className="mt-4 flex flex-col items-center gap-2">
                      {isDeliverable === true && (
                        <>
                          <p className="text-green-600 flex items-center mb-1 bg-green-50 px-4 py-2 rounded-full">
                            <CheckCircle className="h-5 w-5 mr-2" />
                            Delivery available in your area
                          </p>
                          <Link href={`/order?zip=${customerZip}`}>
                            <Button className="w-full bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                              Start Order Now
                            </Button>
                          </Link>
                        </>
                      )}
                      {isDeliverable === false && (
                        <>
                          <p className="text-red-600 flex items-center mb-1 bg-red-50 px-4 py-2 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Delivery not available in your area
                          </p>
                          <Link href="/special-request">
                            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                              Submit a Special Request
                            </Button>
                          </Link>
                        </>
                      )}
                    </div>
                  )}
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
                    {sizeCategories.map((category) => (
                      <CarouselItem key={category.id}>
                        <div className="relative aspect-[4/3] rounded-lg overflow-hidden group cursor-pointer hover:shadow-lg transition-all duration-300">
                          <img
                            src={category.image}
                            alt={category.name}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
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
            <div className="lg:col-span-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300"
              >
                <h2 className="text-xl font-bold mb-4">Featured Products</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {featuredProducts.map((product) => (
                    <motion.div
                      key={product.id}
                      className="group cursor-pointer"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => navigate(`/products/${product.id}`)}
                    >
                      <div className="relative aspect-square overflow-hidden rounded-2xl bg-neutral-50">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 to-black/0 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors duration-300 z-10 flex items-center justify-center">
                          <div className="bg-white text-primary font-semibold px-4 py-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0 duration-300">
                            View Details
                          </div>
                        </div>
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                      <div className="mt-4 text-center">
                        <h3 className="text-xl font-heading font-bold text-foreground group-hover:text-primary transition-colors duration-200">
                          {product.name}
                        </h3>
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
          <div className="relative">
            <Carousel
              setApi={setApi}
              className="w-full"
              opts={{
                align: "start",
                loop: true,
              }}
            >
              <CarouselContent>
                {carouselImages.map((image, index) => (
                  <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="p-1"
                      onMouseEnter={() => setIsHovering(true)}
                      onMouseLeave={() => setIsHovering(false)}
                    >
                      <Card className="overflow-hidden hover:shadow-xl transition-shadow duration-300">
                        <CardContent className="p-0">
                          {image.type === "video" ? (
                            <div
                              className="relative group"
                              onMouseEnter={() => {
                                setIsHovering(true);
                                handleVideoHover(true);
                              }}
                              onMouseLeave={() => {
                                setIsHovering(false);
                                handleVideoHover(false);
                              }}
                            >
                              <div
                                className={`relative w-full bg-black cursor-pointer transition-all duration-300 ${
                                  isVideoExpanded ? "fixed inset-0 z-50 m-auto max-w-[400px] h-[80vh]" : "h-[300px]"
                                }`}
                                onClick={handleVideoClick}
                              >
                                <iframe
                                  ref={videoRef}
                                  src="https://www.youtube.com/embed/HxbpgFEyc6U"
                                  title="YouTube video player"
                                  className="absolute inset-0 w-full h-full"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                ></iframe>
                                {!isVideoExpanded && (
                                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <div className="w-16 h-16 bg-primary/90 rounded-full flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform duration-300">
                                      <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M8 5v14l11-7z" />
                                      </svg>
                                    </div>
                                  </div>
                                )}
                              </div>
                              {isVideoExpanded && (
                                <>
                                  <div className="fixed inset-0 bg-black/80 z-40" onClick={handleVideoClick} />
                                  <button
                                    className="absolute top-4 right-4 z-50 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors duration-200"
                                    onClick={handleVideoClick}
                                  >
                                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </>
                              )}
                            </div>
                          ) : (
                            <img
                              src={image.url}
                              alt={image.alt}
                              className="w-full h-[300px] object-cover hover:scale-105 transition-transform duration-500"
                            />
                          )}
                        </CardContent>
                        <CardFooter className="p-4 bg-white">
                          <div className="flex items-center gap-2">
                            {image.type === "video" && (
                              <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            )}
                            <p className="text-sm font-semibold text-primary tracking-wide">{image.alt}</p>
                          </div>
                        </CardFooter>
                      </Card>
                    </motion.div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-4" />
              <CarouselNext className="right-4" />
            </Carousel>
          </div>
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
                  <Award className="h-8 w-8 text-white" />
                </div>

                <h2 className="text-4xl font-heading font-bold mb-6 text-white">Ready to Elevate Your Growing Operations?</h2>

                <p className="text-xl mb-10 text-white/90 max-w-2xl mx-auto">
                  Join our wholesale program today and experience the benefits of premium organic soil products with competitive pricing and dedicated
                  support for your business.
                </p>

                <div className="flex flex-col sm:flex-row justify-center gap-6">
                  <Link href="/onboarding">
                    <Button
                      size="lg"
                      className="bg-white hover:bg-white/90 text-primary hover:text-primary-dark shadow-lg hover:shadow-xl transition-all duration-300 text-base font-medium px-8 py-6 h-auto"
                    >
                      Apply Now <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="/contact">
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-white text-white hover:bg-white/10 transition-all duration-300 text-base font-medium px-8 py-6 h-auto"
                    >
                      Contact Sales
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="mt-12 pt-8 border-t border-white/20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="flex items-start">
                    <div className="bg-white/20 p-2 rounded-full mr-4">
                      <Truck className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium text-lg mb-1">Nationwide Delivery</h3>
                      <p className="text-white/80 text-sm">Fast shipping to any location across the country</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="bg-white/20 p-2 rounded-full mr-4">
                      <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium text-lg mb-1">Quality Guarantee</h3>
                      <p className="text-white/80 text-sm">All products tested and certified organic</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="bg-white/20 p-2 rounded-full mr-4">
                      <DollarSign className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium text-lg mb-1">Bulk Pricing</h3>
                      <p className="text-white/80 text-sm">Competitive rates for commercial quantities</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
