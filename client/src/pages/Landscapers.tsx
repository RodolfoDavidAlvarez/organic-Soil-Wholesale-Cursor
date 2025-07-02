import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { Award, Leaf, Zap, Shield, X, ChevronDown, ChevronUp, Trees, Sprout, Apple, Store, Home } from "lucide-react";
import { useState, useEffect } from "react";
import React from "react";
import { productsData } from "@/data/productData";
import ProductShowcase from "@/components/ProductShowcase";
import SEO from "@/components/layout/SEO";

const Landscapers = () => {
  const [, setLocation] = useLocation();
  const [texturePreview, setTexturePreview] = useState<string | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ingredientsExpanded, setIngredientsExpanded] = useState(false);

  const closeTexturePreview = () => {
    setTexturePreview(null);
  };

  // Load products with IDs
  useEffect(() => {
    // Filter products for landscapers
    const landscapingProducts = productsData.filter((product) => {
      const name = product.name.toLowerCase();
      return name.includes("mulch") || name.includes("turf daddy") || name.includes("artemis") || name.includes("oasis") || name.includes("tee top");
    });

    // Sort products in the specified order
    const sortedProducts = landscapingProducts.sort((a, b) => {
      const order = ["mulch", "turf daddy", "artemis", "oasis", "tee top"];
      const aIndex = order.findIndex((term) => a.name.toLowerCase().includes(term));
      const bIndex = order.findIndex((term) => b.name.toLowerCase().includes(term));
      return aIndex - bIndex;
    });

    setProducts(sortedProducts);
    setIsLoading(false);
  }, []);

  const mulchApplications = [
    {
      id: 1,
      title: "Commercial Park Applications",
      description: "Professional mulch application for parks and public spaces, providing both aesthetic appeal and soil protection.",
      images: [
        "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/Mulch%20photos%2FCommercial%20Applicaiton.png?alt=media&token=1eb4155a-00d0-462e-9280-928ff21db9eb",
        "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/Mulch%20photos%2FPark%202%20application.jpeg?alt=media&token=3d6bb609-f245-49c1-ac4d-7e711e60783e",
        "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/Mulch%20photos%2FParks.%20appliationjpeg.jpeg?alt=media&token=049de967-4c24-412a-8fc4-86ddf7defef7",
      ],
      benefits: ["Professional finish", "Long-lasting results", "Erosion control", "Water conservation"],
    },
    {
      id: 2,
      title: "Residential Landscaping",
      description: "Premium mulch solutions for residential properties, enhancing curb appeal and garden health.",
      images: [
        "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/Mulch%20photos%2FResidential%2C%20Dark%20Mulch%20Planter%20Cover.jpeg?alt=media&token=0051d3f2-0116-4cd9-909c-5b4861171c54",
        "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/Mulch%20photos%2FResidential%2C%20Around%20Medium%20Dark%20Mulch%20raised%20garden%20beds.jpeg?alt=media&token=a2d49936-7575-421d-8083-f0f029f93ffa",
        "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/Mulch%20photos%2FResidential%2C%20Open%20area%20with%20Raw%20Mulch.jpeg?alt=media&token=9938ef5d-604b-43c7-96f3-c65ff9c71f6d",
      ],
      benefits: ["Enhanced aesthetics", "Soil protection", "Weed suppression", "Moisture retention"],
    },
    {
      id: 3,
      title: "Bulk Delivery Solutions",
      description: "Efficient bulk mulch delivery for large-scale landscaping projects.",
      images: [
        "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/Mulch%20photos%2FDark%20Mulck%20Truckload%20Delivery.jpeg?alt=media&token=f2709c22-8af6-48aa-8deb-00200d4e78d9",
        "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/Mulch%20photos%2FDark%20Mulk%20Applied%20in%20outside%20of%20office%20showcase.jpeg?alt=media&token=557e9170-9316-438b-abe8-48f8987144c7",
        "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/Mulch%20photos%2FRaw%20Golden%20Looking%20Mulch%20Commercial%20Application%20look.jpeg?alt=media&token=11ad38f6-0678-40c6-a3bc-7656785e8456",
      ],
      benefits: ["Cost-effective", "Project efficiency", "Consistent quality", "Timely delivery"],
    },
  ];

  return (
    <>
      <SEO 
        title="Professional Landscaper Soil Solutions"
        description="Specialized bulk soil products for professional landscapers. Premium mulch, soil amendments, and turf solutions available in commercial quantities for landscape contractors in Arizona."
        keywords="landscaper soil supplier, bulk mulch for landscapers, turf blend wholesale, commercial landscape soil, professional landscaping supplies, golf course soil, soil amendments contractors, drought resilient landscaping, bulk soil delivery landscapers, wholesale mulch"
        canonical="https://organicsoilwholesale.com/landscapers"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "Service",
          "name": "Commercial Landscaping Soil Solutions",
          "provider": {
            "@type": "Organization",
            "name": "Organic Soil Wholesale"
          },
          "serviceType": "Landscape Supply",
          "areaServed": {
            "@type": "State",
            "name": "Arizona"
          },
          "description": "Premium soil products in commercial quantities specially formulated for professional landscapers",
          "offers": {
            "@type": "Offer",
            "availability": "https://schema.org/InStock",
            "itemOffered": [
              {
                "@type": "Product",
                "name": "Premium Mulch - Bulk Delivery",
                "description": "High-quality mulch for commercial landscaping projects"
              },
              {
                "@type": "Product",
                "name": "Turf Daddy Blend",
                "description": "Professional grade turf soil for landscape contractors"
              }
            ]
          }
        }}
      />
      {texturePreview && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={closeTexturePreview}>
          <div className="relative bg-white rounded-xl overflow-hidden max-w-3xl max-h-[80vh]">
            <img src={texturePreview} alt="Product Texture" className="max-w-full max-h-[80vh] object-contain" />
            <button className="absolute top-2 right-2 bg-white/80 hover:bg-white p-1 rounded-full" onClick={closeTexturePreview}>
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
        {/* Hero Section */}
        <div className="bg-green-800 text-white py-16 relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 right-0 h-20 bg-white/10"></div>
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-black/10"></div>
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="flex flex-col lg:flex-row gap-10 items-center lg:items-stretch">
              {/* Left: Cover Image */}
              <div className="w-full lg:w-1/2 flex items-center justify-center">
                <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-lg relative mb-20 sm:mb-16 group">
                  <div className="rounded-2xl overflow-hidden bg-gray-50">
                    <img
                      src="cover-page-image.png"
                      alt="Organic Soil Wholesale Cover"
                      className="w-full h-full object-contain p-4 transform -translate-y-10"
                    />
                  </div>
                  {/* Overlapping Badge */}
                  <div className="absolute -top-3 -right-3 bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-full shadow-lg transform rotate-12">
                    <span className="text-sm font-bold">BULK SUPPLIER</span>
                  </div>
                  {/* Desktop Banner */}
                  <div className="hidden sm:block absolute -bottom-16 left-3 bg-white/95 backdrop-blur-sm px-3 py-2 rounded-lg shadow-xl drop-shadow-lg border border-gray-100 max-w-sm">
                    <div className="text-base font-bold text-green-700 mb-2">Everything Your Garden Needs</div>
                    
                    {/* Main Categories */}
                    <div className="space-y-1 mb-2">
                      <div className="text-xs text-gray-700 font-medium">• Raised Garden Bed Soil</div>
                      <div className="text-xs text-gray-700 font-medium">• Mulch</div>
                      <div className="text-xs text-gray-700 font-medium">• Worm Castings & Dairy Compost</div>
                    </div>
                    
                    {/* Specialty Plants Section */}
                    <div className="border-t border-gray-200 pt-2">
                      <div className="text-xs font-semibold text-green-600 mb-1">Specialty Plants:</div>
                      <div className="text-xs text-gray-600">Palm Trees • Apple, Pears & Peaches • Avocados • Citrus & More</div>
                    </div>
                  </div>
                  
                  {/* Mobile Compact Version */}
                  <div className="block sm:hidden absolute -bottom-12 left-3 bg-white/95 backdrop-blur-sm px-2 py-2 rounded-lg shadow-xl drop-shadow-lg border border-gray-100 max-w-[260px]">
                    <div className="text-sm font-bold text-green-700 mb-1">Everything Your Garden Needs</div>
                    <div className="text-xs text-gray-600">Soil • Mulch • Compost • Specialty Plants</div>
                  </div>
                </div>
              </div>
              {/* Right: Text + CTA + Product Cards */}
              <div className="w-full lg:w-1/2 flex flex-col justify-center">
                <div className="mb-8">
                  <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight animate-fade-in">Arizona's #1 Organic Soil Platform for Wholesale</h1>
                  <p className="text-lg text-green-100 mb-6 max-w-xl animate-fade-in delay-100">
                    Bulk Orders. Call & Pickup. OMRI-Listed.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 items-center mb-2 animate-fade-in delay-300">
                    <span className="text-2xl text-white font-bold bg-green-700/30 px-4 py-2 rounded-lg">Shop Wholesale Today</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2 animate-fade-in delay-500">
                    <Award className="h-5 w-5" />
                    <span className="text-green-100 text-base font-semibold">Best Prices in Town for Wholesale</span>
                  </div>
                </div>
                {/* Product Photos */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6 animate-fade-in delay-600">
                  {/* Dark Beautiful Mulch Card */}
                  <div className="relative rounded-xl overflow-hidden shadow-lg group cursor-pointer transition-transform hover:-translate-y-1 bg-white/10">
                    <img
                      src="https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/Mulch%20photos%2FResidential%2C%20Around%20Medium%20Dark%20Mulch%20raised%20garden%20beds.jpeg?alt=media&token=a2d49936-7575-421d-8083-f0f029f93ffa"
                      alt="Dark Beautiful Mulch Application"
                      className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent flex items-end p-4">
                      <span className="text-white text-lg font-semibold">Dark Beautiful Mulch</span>
                    </div>
                  </div>
                  {/* Worm Castings Card */}
                  <div className="relative rounded-xl overflow-hidden shadow-lg group cursor-pointer transition-transform hover:-translate-y-1 bg-white/10">
                    <img
                      src="worm-castings.jpg"
                      alt="Premium Worm Castings"
                      className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent flex items-end p-4">
                      <span className="text-white text-lg font-semibold">Worm Castings</span>
                    </div>
                  </div>
                  {/* Dairy Compost Card */}
                  <div className="relative rounded-xl overflow-hidden shadow-lg group cursor-pointer transition-transform hover:-translate-y-1 bg-white/10">
                    <img
                      src="dairy-compost.jpg"
                      alt="Organic Dairy Compost"
                      className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent flex items-end p-4">
                      <span className="text-white text-lg font-semibold">Dairy Compost</span>
                    </div>
                  </div>
                </div>
                
                {/* Target Demographics */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 animate-fade-in delay-700">
                  <div className="bg-green-700/20 backdrop-blur-sm rounded-lg px-4 py-3 text-center flex flex-col items-center gap-2">
                    <Trees className="h-6 w-6 text-green-200" />
                    <span className="text-white font-medium text-sm">Landscapers</span>
                  </div>
                  <div className="bg-green-700/20 backdrop-blur-sm rounded-lg px-4 py-3 text-center flex flex-col items-center gap-2">
                    <Sprout className="h-6 w-6 text-green-200" />
                    <span className="text-white font-medium text-sm">Organic Growers</span>
                  </div>
                  <div className="bg-green-700/20 backdrop-blur-sm rounded-lg px-4 py-3 text-center flex flex-col items-center gap-2">
                    <Apple className="h-6 w-6 text-green-200" />
                    <span className="text-white font-medium text-sm">Fruit Growers</span>
                  </div>
                  <div className="bg-green-700/20 backdrop-blur-sm rounded-lg px-4 py-3 text-center flex flex-col items-center gap-2">
                    <Home className="h-6 w-6 text-green-200" />
                    <span className="text-white font-medium text-sm">Residential Grower</span>
                  </div>
                  <div className="bg-green-700/20 backdrop-blur-sm rounded-lg px-4 py-3 text-center flex flex-col items-center gap-2">
                    <Store className="h-6 w-6 text-green-200" />
                    <span className="text-white font-medium text-sm">Garden Centers</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Certifications Section */}
        <section className="py-8 bg-white border-b border-gray-100">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center gap-6">
              <h3 className="text-lg font-semibold text-gray-700">Certified By</h3>
              <div className="flex items-center gap-4 animate-pulse">
                  <img 
                    src="omri-logo.png" 
                    alt="OMRI Certified" 
                    className="h-12 w-auto hover:scale-110 transition-transform duration-300"
                  />
                  <img 
                    src="uscc-logo.png" 
                    alt="USCC Certified" 
                    className="h-12 w-auto hover:scale-110 transition-transform duration-300"
                  />
                  <img 
                    src="made-in-usa.png" 
                    alt="Made in USA" 
                    className="h-12 w-auto hover:scale-110 transition-transform duration-300"
                  />
              </div>
            </div>
          </div>
        </section>

        {/* Featured Product Section - Plant Pal */}
        <section className="py-16 bg-gradient-to-b from-white to-gray-50">
          <div className="container mx-auto px-4">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="flex flex-col lg:flex-row">
                {/* Product Image */}
                <div className="lg:w-1/2 relative">
                  <img
                    src="plant-pal-showcase.png"
                    alt="Plant Pal - Multi-Purpose Organic Soil"
                    className="w-full h-full object-contain min-h-[400px] bg-gray-50"
                  />
                  {/* Overlapping Healthy Soil Image */}
                  <div className="absolute top-3 right-3 w-32 h-32 sm:top-4 sm:right-4 sm:w-40 sm:h-40 md:top-6 md:right-6 md:w-52 md:h-52 lg:top-8 lg:right-8 lg:w-72 lg:h-72 xl:w-80 xl:h-80 rounded-full overflow-hidden shadow-xl border-4 border-white bg-white">
                    <img
                      src="healthy-soil-hands.jpg"
                      alt="Premium quality soil in hands"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                {/* Product Information */}
                <div className="lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center">
                  <div className="mb-6">
                    <Badge className="bg-green-100 text-green-800 text-sm font-medium mb-4">
                      #1 FEATURED PRODUCT
                    </Badge>
                    <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                      Plant Pal
                    </h2>
                    <p className="text-xl text-green-600 font-semibold mb-4">
                      One of the Best Organic Planting Soils to Grow Food and Ornamentals
                    </p>
                    
                    {/* Flash Sale Pricing Highlight */}
                    <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-4 mb-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold mb-2">
                            30% OFF FLASH SALE
                          </div>
                          <div className="text-sm text-blue-600 font-medium">
                            Call and Pick Up
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-3">
                            <div>
                              <div className="text-gray-400 line-through text-lg">$10.99</div>
                              <div className="text-xs text-gray-500">Local Wholesale</div>
                            </div>
                            <div>
                              <div className="text-3xl font-bold text-red-600">$7.69</div>
                              <div className="text-xs text-green-600 font-semibold">Save $3.30</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Key Features */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="flex items-center gap-3">
                        <div className="bg-green-100 p-2 rounded-lg">
                          <Leaf className="h-5 w-5 text-green-600" />
                        </div>
                        <span className="text-gray-700 font-medium">100% Organic</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="bg-green-100 p-2 rounded-lg">
                          <Award className="h-5 w-5 text-green-600" />
                        </div>
                        <span className="text-gray-700 font-medium">Premium Quality</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="bg-green-100 p-2 rounded-lg">
                          <Zap className="h-5 w-5 text-green-600" />
                        </div>
                        <span className="text-gray-700 font-medium">Fast Results</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="bg-green-100 p-2 rounded-lg">
                          <Shield className="h-5 w-5 text-green-600" />
                        </div>
                        <span className="text-gray-700 font-medium">Arizona Tested</span>
                      </div>
                    </div>
                    
                    {/* Premium Ingredients */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-lg font-semibold text-gray-900">Premium Ingredient Blend:</h4>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIngredientsExpanded(!ingredientsExpanded)}
                          className="border-green-600 text-green-600 hover:bg-green-50"
                        >
                          {ingredientsExpanded ? (
                            <>
                              Hide Details <ChevronUp className="ml-1 h-4 w-4" />
                            </>
                          ) : (
                            <>
                              View Ingredients <ChevronDown className="ml-1 h-4 w-4" />
                            </>
                          )}
                        </Button>
                      </div>
                      
                      {/* Collapsed Preview */}
                      {!ingredientsExpanded && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">6 Premium Ingredients:</span> Clean Wood Fiber, 8-3-1 Granules, Worm Castings, Organic Dairy Compost + more...
                        </div>
                      )}
                      
                      {/* Expanded Full List */}
                      {ingredientsExpanded && (
                        <ul className="text-sm text-gray-600 space-y-2">
                          <li><strong>Clean Wood Fiber</strong> – Natural bulking agent that improves aeration and moisture balance for healthy roots</li>
                          <li><strong>8-3-1 Granules</strong> – Organic source of nitrogen and other macronutrients for steady plant growth</li>
                          <li><strong>Worm Castings</strong> – Readily available nutrients plus beneficial microbes to boost vitality</li>
                          <li><strong>Organic Dairy Compost</strong> – Slow-release nutrient and biology enhancer that enriches soil fertility</li>
                          <li><strong>Calcium</strong> – Strengthens cell walls and prevents blossom end rot</li>
                          <li><strong>Zinc Sulfate</strong> – Supports enzyme function and healthy development</li>
                        </ul>
                      )}
                    </div>

                    {/* Use Cases */}
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Versatile Applications:</h4>
                      
                      {/* Application Images */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="rounded-xl overflow-hidden shadow-md">
                          <img
                            src="raised-garden-bed-soil.jpg"
                            alt="Plant Pal in raised garden beds"
                            className="w-full h-36 object-cover"
                          />
                          <div className="p-3 bg-white">
                            <span className="text-sm font-medium text-gray-700">Raised Bed Applications</span>
                          </div>
                        </div>
                        <div className="rounded-xl overflow-hidden shadow-md relative">
                          <img
                            src="potting-soil.jpg"
                            alt="Plant Pal for container potting"
                            className="w-full h-36 object-cover"
                          />
                          <div className="p-3 bg-white">
                            <span className="text-sm font-medium text-gray-700">Container Potting</span>
                          </div>
                          {/* Overlapping Healthy Soil Image */}
                          <div className="absolute -top-3 -right-3 w-20 h-20 rounded-full overflow-hidden shadow-lg border-4 border-white bg-white">
                            <img
                              src="healthy-soil-hands.jpg"
                              alt="Premium quality soil in hands"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                        <div className="rounded-xl overflow-hidden shadow-md">
                          <img
                            src="nursery-blend.jpg"
                            alt="Plant Pal as nursery blend"
                            className="w-full h-36 object-cover"
                          />
                          <div className="p-3 bg-white">
                            <span className="text-sm font-medium text-gray-700">Nursery Mix</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-3">
                        <span className="bg-green-100 text-green-800 px-3 py-2 rounded-lg text-sm font-medium">In-Ground Mixing</span>
                        <span className="bg-green-100 text-green-800 px-3 py-2 rounded-lg text-sm font-medium">Raised Beds Filling</span>
                        <span className="bg-green-100 text-green-800 px-3 py-2 rounded-lg text-sm font-medium">Container Potting</span>
                        <span className="bg-green-100 text-green-800 px-3 py-2 rounded-lg text-sm font-medium">Top Dressing</span>
                        <span className="bg-green-100 text-green-800 px-3 py-2 rounded-lg text-sm font-medium">Seed Starting</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Size Categories */}
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Available Sizes:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gray-50 rounded-xl p-4 text-center">
                        <img
                          src="2cf-bag-pallet.png"
                          alt="2 ft³ bags on pallet"
                          className="w-full h-32 object-cover rounded-lg mb-3"
                        />
                        <div className="text-sm font-medium text-gray-700 mb-1">2 ft³ Bags</div>
                        <div className="text-xs text-gray-500">Single unit or full pallet</div>
                        <div className="text-sm font-bold text-red-600">$7.69</div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4 text-center">
                        <img
                          src="tote-supersack.png"
                          alt="2.2 cubic yard tote"
                          className="w-full h-32 object-cover rounded-lg mb-3"
                        />
                        <div className="text-sm font-medium text-gray-700 mb-1">2.2 yd³ Tote</div>
                        <div className="text-sm font-bold text-green-600">$247.28</div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4 text-center">
                        <img
                          src="truckload-bulk-delivery.png"
                          alt="Truckload bulk delivery"
                          className="w-full h-32 object-cover rounded-lg mb-3"
                        />
                        <div className="text-sm font-medium text-gray-700 mb-1">92-110 yd³ Truckload</div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-blue-600 border-blue-600 hover:bg-blue-50"
                        >
                          Call Now
                        </Button>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Products Section - Moved right after featured product */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <ProductShowcase products={products} loading={isLoading} initialCategory="all" />
          </div>
        </section>

        {/* Mulch Applications Section */}
        <div id="mulch-applications" className="py-20 bg-gradient-to-b from-gray-50 to-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">Mulch Applications</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              {mulchApplications.map((application) => (
                <div key={application.id} className="space-y-4">
                  <div className="relative aspect-[4/3] rounded-lg overflow-hidden shadow-xl group">
                    <img
                      src={application.images[0]}
                      alt={application.title}
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-4">
                      <span className="text-white text-xl font-semibold">{application.title}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {application.images.slice(1, 3).map((image, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden shadow-lg group">
                        <img
                          src={image}
                          alt={`${application.title} detail ${index + 1}`}
                          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Benefits Section */}
            <div className="mb-16 grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <Leaf className="h-5 w-5 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-800">Soil Health</h3>
                </div>
                <p className="text-sm text-gray-600">Improves soil structure and promotes beneficial microbial activity</p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <Zap className="h-5 w-5 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-800">Temperature Control</h3>
                </div>
                <p className="text-sm text-gray-600">Reduces soil temperature in hot climates, protecting plant roots</p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <Shield className="h-5 w-5 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-800">Weed Control</h3>
                </div>
                <p className="text-sm text-gray-600">Natural weed suppression and moisture retention</p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <Award className="h-5 w-5 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-800">Premium Quality</h3>
                </div>
                <p className="text-sm text-gray-600">Consistently high-quality mulch for professional results</p>
              </div>
            </div>

            <div className="mt-16 text-center">
              <Button size="lg" className="bg-green-700 hover:bg-green-800 text-white" onClick={() => setLocation("/order")}>
                Get Your Custom Quote
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Landscapers;
