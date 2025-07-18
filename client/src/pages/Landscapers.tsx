import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { Award, Leaf, Zap, Shield, X, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Trees, Sprout, Apple, Store, Home, Phone } from "lucide-react";
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
  const [selectedImage, setSelectedImage] = useState(0);

  const closeTexturePreview = () => {
    setTexturePreview(null);
  };

  // Navigation functions for image gallery
  const nextImage = () => {
    setSelectedImage((prev) => (prev + 1) % plantPalImages.length);
  };

  const prevImage = () => {
    setSelectedImage((prev) => (prev - 1 + plantPalImages.length) % plantPalImages.length);
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (texturePreview) {
        switch (e.key) {
          case 'ArrowLeft':
            prevImage();
            break;
          case 'ArrowRight':
            nextImage();
            break;
          case 'Escape':
            closeTexturePreview();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [texturePreview]);

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

  // Plant Pal product images
  const plantPalImages = [
    {
      src: "plantpal-with-veggies.png",
      alt: "Plant Pal - Multi-Purpose Organic Soil with Fresh Vegetables",
      title: "Premium Organic Soil"
    },
    {
      src: "raised-garden-bed-soil.jpg",
      alt: "Plant Pal in raised garden beds",
      title: "Raised Garden Beds"
    },
    {
      src: "potting-soil.jpg",
      alt: "Plant Pal for container potting",
      title: "Container Gardens"
    },
    {
      src: "nursery-blend.jpg",
      alt: "Plant Pal as nursery blend",
      title: "Professional Nursery"
    }
  ];

  const mulchApplications = [
    {
      id: 1,
      title: "Commercial Park Applications",
      description: "Professional mulch application for parks and public spaces, providing both aesthetic appeal and soil protection.",
      images: [
        "Raw Golden Looking Mulch Commercial Application look.jpeg",
        "Dark Mulk Applied in outside of office showcase.jpeg",
        "Dark Mulck Truckload Delivery.jpeg",
      ],
      benefits: ["Professional finish", "Long-lasting results", "Erosion control", "Water conservation"],
    },
    {
      id: 2,
      title: "Residential Landscaping",
      description: "Premium mulch solutions for residential properties, enhancing curb appeal and garden health.",
      images: [
        "Dark Mulk Applied in outside of office showcase.jpeg",
        "Dark Mulk Applied in outside of office showcase.jpeg",
        "Raw Golden Looking Mulch Commercial Application look.jpeg",
      ],
      benefits: ["Enhanced aesthetics", "Soil protection", "Weed suppression", "Moisture retention"],
    },
    {
      id: 3,
      title: "Bulk Delivery Solutions",
      description: "Efficient bulk mulch delivery for large-scale landscaping projects.",
      images: [
        "Dark Mulck Truckload Delivery.jpeg",
        "Dark Mulk Applied in outside of office showcase.jpeg",
        "Raw Golden Looking Mulch Commercial Application look.jpeg",
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
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-2 sm:p-4" onClick={closeTexturePreview}>
          <div className="relative bg-white rounded-xl overflow-hidden max-w-4xl max-h-[90vh] w-full">
            {/* Navigation arrows in expanded view */}
            <button
              onClick={(e) => { e.stopPropagation(); prevImage(); }}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white p-2 sm:p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-105"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700" />
            </button>
            
            <img 
              src={plantPalImages[selectedImage].src} 
              alt={plantPalImages[selectedImage].alt} 
              className="max-w-full max-h-[90vh] object-contain w-full" 
            />
            
            <button
              onClick={(e) => { e.stopPropagation(); nextImage(); }}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white p-2 sm:p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-105"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700" />
            </button>

            {/* Close button */}
            <button 
              className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-white/80 hover:bg-white p-2 rounded-full transition-all duration-200" 
              onClick={closeTexturePreview}
            >
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>

            {/* Image title and counter */}
            <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-lg">
              <div className="text-sm sm:text-base font-medium text-center">{plantPalImages[selectedImage].title}</div>
              <div className="text-xs sm:text-sm text-center opacity-80">{selectedImage + 1} / {plantPalImages.length}</div>
            </div>
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
              {/* Left: Cover Image with Overlapping Pickup */}
              <div className="w-full lg:w-1/2 flex flex-col items-center justify-center">
                <div className="bg-white rounded-3xl shadow-2xl p-1 w-full max-w-lg relative mb-4 group">
                  <div className="rounded-2xl overflow-hidden bg-gray-50">
                    <img
                      src="hero-main-photo-v2-optimized.jpg"
                      alt="Organic Soil Wholesale - Premium Bulk Soil Products"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* Overlapping Badge */}
                  <div className="absolute -top-3 -right-3 bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-full shadow-lg transform rotate-12">
                    <span className="text-sm font-bold">BULK SUPPLIER</span>
                  </div>
                  {/* Large Overlapping Pickup Photo */}
                  <div className="absolute -bottom-8 -left-8 sm:-bottom-12 sm:-left-12 w-40 h-40 sm:w-52 sm:h-52 md:w-60 md:h-60 rounded-2xl overflow-hidden shadow-2xl border-4 border-white bg-white transform -rotate-6 hover:rotate-0 transition-transform duration-300 z-10">
                    <img
                      src="organic-wholesale-pickup.png"
                      alt="Call and Pick Up service"
                      className="w-full h-full object-cover"
                    />
                    {/* Simple overlay text */}
                    <div className="absolute bottom-2 left-2 right-2">
                      <div className="bg-blue-600/90 text-white text-center py-1.5 rounded-lg">
                        <span className="text-sm sm:text-base font-bold">CALL & PICKUP</span>
                      </div>
                    </div>
                  </div>
                </div>
                
              </div>
              {/* Right: Text + CTA + Product Cards */}
              <div className="w-full lg:w-1/2 flex flex-col justify-center">
                
                <div className="mb-8">
                  <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-4 leading-tight animate-fade-in">Arizona's #1 Organic Soil Platform for Wholesale</h1>
                  <div className="flex items-center gap-2 mb-6 animate-fade-in delay-100">
                    <Award className="h-4 w-4 sm:h-5 sm:w-5 text-green-200" />
                    <p className="text-sm sm:text-lg text-green-100 max-w-xl font-semibold">
                      Best Prices in Town for Wholesale
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 items-center mb-6 animate-fade-in delay-300">
                    <span className="text-lg sm:text-2xl text-white font-bold bg-green-700/30 px-4 py-3 rounded-lg shadow-sm">Bulk Orders. Call & Pickup. OMRI-Listed.</span>
                  </div>
                </div>
                
                {/* Everything Your Garden Needs - Under Best Prices, Above Images */}
                <div className="mb-3 animate-fade-in delay-500">
                  <div className="text-lg sm:text-xl font-bold text-white mb-3">Everything Your Garden Needs</div>
                </div>
                
                {/* Product Photos */}
                <div className="grid grid-cols-3 gap-2 sm:gap-6 mb-6 animate-fade-in delay-700">
                  {/* Soil Card */}
                  <div className="relative rounded-xl overflow-hidden shadow-lg group cursor-pointer transition-transform hover:-translate-y-1 bg-white/10">
                    <img
                      src="dairy-compost.jpg"
                      alt="Organic Soil"
                      className="w-full h-24 sm:h-40 object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent flex items-end p-1 sm:p-4">
                      <span className="text-white text-xs sm:text-lg font-semibold">Soil</span>
                    </div>
                  </div>
                  {/* Amendments Card */}
                  <div className="relative rounded-xl overflow-hidden shadow-lg group cursor-pointer transition-transform hover:-translate-y-1 bg-white/10">
                    <img
                      src="worm-castings.jpg"
                      alt="Premium Amendments"
                      className="w-full h-24 sm:h-40 object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent flex items-end p-1 sm:p-4">
                      <span className="text-white text-xs sm:text-lg font-semibold">Amendments</span>
                    </div>
                  </div>
                  {/* Dark Beautiful Mulch Card */}
                  <div className="relative rounded-xl overflow-hidden shadow-lg group cursor-pointer transition-transform hover:-translate-y-1 bg-white/10">
                    <img
                      src="Dark Mulk Applied in outside of office showcase.jpeg"
                      alt="Dark Beautiful Mulch Application"
                      className="w-full h-24 sm:h-40 object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent flex items-end p-1 sm:p-4">
                      <span className="text-white text-xs sm:text-lg font-semibold">Dark Beautiful Mulch</span>
                    </div>
                  </div>
                </div>
                
                {/* Specialty Soil Products Section - Moved below product images */}
                <div className="bg-white/95 backdrop-blur-sm px-4 py-3 rounded-lg shadow-xl drop-shadow-lg border border-gray-100 mt-4">
                  <div className="text-xs font-semibold text-green-600 mb-1">Specialty Soil Products:</div>
                  <div className="text-xs text-gray-600">Palm Trees • Apple, Pears & Peaches • Avocados • Citrus & More</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Certifications Section */}
        <section className="py-4 sm:py-6 bg-white border-b border-gray-100">
          <div className="container mx-auto px-4">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6">
              <h3 className="text-sm sm:text-lg font-semibold text-gray-700 mb-2 sm:mb-0">Certified By</h3>
              <div className="flex items-center gap-2 sm:gap-4 animate-pulse">
                  <img 
                    src="omri-logo.png" 
                    alt="OMRI Certified" 
                    className="h-8 sm:h-12 w-auto hover:scale-110 transition-transform duration-300"
                  />
                  <img 
                    src="uscc-logo.png" 
                    alt="USCC Certified" 
                    className="h-8 sm:h-12 w-auto hover:scale-110 transition-transform duration-300"
                  />
                  <img 
                    src="made-in-usa.png" 
                    alt="Made in USA" 
                    className="h-8 sm:h-12 w-auto hover:scale-110 transition-transform duration-300"
                  />
              </div>
            </div>
          </div>
        </section>


        {/* Featured Product Section - Plant Pal */}
        <section className="py-8 sm:py-16 bg-gradient-to-b from-white to-gray-50">
          <div className="container mx-auto px-4">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              
              {/* Top Section: Image + Info */}
              <div className="flex flex-col lg:flex-row">
                {/* Left Column: Product Image Gallery + Available Sizes */}
                <div className="lg:w-1/2 bg-gray-50 p-2 sm:p-4 order-2 lg:order-1">
                  {/* Main Product Image with Navigation */}
                  <div className="relative flex items-center justify-center mb-4 group">
                    {/* Previous Arrow */}
                    <button
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:scale-105"
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="h-5 w-5 text-gray-700" />
                    </button>

                    {/* Main Image */}
                    <img
                      src={plantPalImages[selectedImage].src}
                      alt={plantPalImages[selectedImage].alt}
                      className="w-full max-w-[300px] sm:max-w-[450px] h-[250px] sm:h-[400px] object-contain cursor-pointer"
                      onClick={() => setTexturePreview(plantPalImages[selectedImage].src)}
                    />

                    {/* Next Arrow */}
                    <button
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:scale-105"
                      aria-label="Next image"
                    >
                      <ChevronRight className="h-5 w-5 text-gray-700" />
                    </button>

                    {/* Overlapping Healthy Soil Image - only show on first image */}
                    {selectedImage === 0 && (
                      <div className="absolute top-1 right-1 w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36 lg:w-40 lg:h-40 rounded-full overflow-hidden shadow-xl border-2 sm:border-4 border-white bg-white">
                        <img
                          src="healthy-soil-hands.jpg"
                          alt="Premium quality soil in hands"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Image Title and Counter */}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-lg text-center">
                      <div className="text-sm font-medium">{plantPalImages[selectedImage].title}</div>
                      <div className="text-xs opacity-80">{selectedImage + 1} / {plantPalImages.length}</div>
                    </div>
                  </div>
                  
                  {/* Thumbnail Gallery - Mobile Optimized */}
                  <div className="flex gap-1 sm:gap-2 justify-center mb-4 overflow-x-auto px-2 scrollbar-hide">
                    {plantPalImages.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImage(index)}
                        className={`flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                          selectedImage === index 
                            ? 'border-green-600 ring-2 ring-green-200 scale-105' 
                            : 'border-gray-300 hover:border-gray-400 hover:scale-102'
                        }`}
                        aria-label={`View ${image.alt}`}
                      >
                        <img
                          src={image.src}
                          alt={image.alt}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                  
                  {/* Available Sizes - Moved under image */}
                  <div className="mt-2 sm:mt-4 px-2 sm:px-4">
                    <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">Available Sizes:</h4>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-white rounded-lg p-2 text-center shadow-sm">
                        <img
                          src="2cf-bag-pallet.png"
                          alt="2 ft³ bags on pallet"
                          className="w-full h-20 object-cover rounded mb-2"
                        />
                        <div className="text-xs font-medium text-gray-700">2 ft³ Bags</div>
                        <div className="text-xs text-gray-500">Single/pallet</div>
                        <div className="text-xs font-bold text-red-600">$7.69/bag</div>
                        <div className="text-xs text-orange-600">(30% off)</div>
                        <div className="text-xs text-gray-600 mt-1">Pallet (40): $220</div>
                        <div className="text-xs text-green-600 font-semibold">(50% off)</div>
                      </div>
                      <div className="bg-white rounded-lg p-2 text-center shadow-sm">
                        <img
                          src="tote-supersack.png"
                          alt="2.2 cubic yard tote"
                          className="w-full h-20 object-cover rounded mb-2"
                        />
                        <div className="text-xs font-medium text-gray-700">2.2 yd³ Tote</div>
                        <div className="text-xs text-gray-500">Single unit or truckload</div>
                        <div className="text-xs font-bold text-green-600 mt-1">$247.28/tote</div>
                        <div className="text-xs text-gray-600 mt-1">Truckload (22 totes): $4,897.99</div>
                        <div className="text-xs text-green-600 font-semibold">(10% off - Save $544.17!)</div>
                      </div>
                      <div className="bg-white rounded-lg p-2 text-center shadow-sm">
                        <img
                          src="truckload-bulk-delivery.png"
                          alt="Truckload bulk delivery"
                          className="w-full h-20 object-cover rounded mb-2"
                        />
                        <div className="text-xs font-medium text-gray-700">Entire Truckload of Bulk</div>
                        <div className="text-xs text-gray-500">92-110 yd³</div>
                        <div className="text-xs text-green-600 font-semibold mt-2">Our Best Price for Bulk</div>
                        <div className="text-xs text-gray-600">Call to Get Quote</div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-blue-600 border-blue-600 hover:bg-blue-50 mt-1 text-xs px-2 py-1"
                        >
                          Call Now
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Product Information - Condensed */}
                <div className="lg:w-1/2 p-4 sm:p-6 lg:p-8 flex flex-col justify-center order-1 lg:order-2">
                  <div className="inline-flex items-center bg-green-600 text-white text-xs sm:text-sm font-bold px-3 py-1 sm:px-4 sm:py-2 rounded-full mb-2 sm:mb-3 self-start">
                    #1 FEATURED PRODUCT
                  </div>
                  <h2 className="text-xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
                    Organic Soil - Plantpal
                  </h2>
                  
                  {/* Best For Section */}
                  <div className="mb-6">
                    <h4 className="text-sm sm:text-base font-semibold text-gray-700 mb-2 sm:mb-3">Best For:</h4>
                    <div className="flex flex-wrap gap-2">
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-lg text-xs font-medium">Raised Garden Beds</span>
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-lg text-xs font-medium">In-Ground Mixing</span>
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-lg text-xs font-medium">Container Potting</span>
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-lg text-xs font-medium">Top Dressing</span>
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-lg text-xs font-medium">Seed Starting</span>
                    </div>
                  </div>
                  
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
                            <div className="text-xs text-blue-600 font-semibold">In purchase of 5+ bags</div>
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
                      <div className="bg-green-100 p-1 sm:p-2 rounded-lg">
                        <Leaf className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                      </div>
                      <span className="text-gray-700 font-medium">100% Organic</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="bg-green-100 p-1 sm:p-2 rounded-lg">
                        <Award className="h-5 w-5 text-green-600" />
                      </div>
                      <span className="text-gray-700 font-medium">Premium Quality</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="bg-green-100 p-1 sm:p-2 rounded-lg">
                        <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                      </div>
                      <span className="text-gray-700 font-medium">Fast Results</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="bg-green-100 p-1 sm:p-2 rounded-lg">
                        <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                      </div>
                      <span className="text-gray-700 font-medium">Arizona Tested</span>
                    </div>
                  </div>
                  
                  {/* Premium Ingredients */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-semibold text-gray-900">Learn Why We Chose Our Ingredients</h4>
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
                        <span className="font-medium">6 Premium Ingredients:</span> 8-3-1 Granules, Worm Castings, Organic Dairy Compost, Calcium + more...
                      </div>
                    )}
                    
                    {/* Expanded Full List */}
                    {ingredientsExpanded && (
                      <ul className="text-sm text-gray-600 space-y-2">
                        <li><strong>8-3-1 Granules</strong> – Organic source of nitrogen and other macronutrients for steady plant growth</li>
                        <li><strong>Worm Castings</strong> – Readily available nutrients plus beneficial microbes to boost vitality</li>
                        <li><strong>Organic Dairy Compost</strong> – Slow-release nutrient and biology enhancer that enriches soil fertility</li>
                        <li><strong>Calcium</strong> – Strengthens cell walls and prevents blossom end rot</li>
                        <li><strong>Zinc Sulfate</strong> – Supports enzyme function and healthy development</li>
                        <li><strong>Clean Wood Fiber</strong> – Natural bulking agent that improves aeration and moisture balance for healthy roots</li>
                      </ul>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Mulch Applications Section */}
        <div id="mulch-applications" className="py-10 sm:py-20 bg-gradient-to-b from-gray-50 to-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8 sm:mb-16">
              <h2 className="text-2xl sm:text-4xl font-bold mb-3 sm:mb-4">Mulch Applications</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8 mb-8 sm:mb-16">
              {mulchApplications.map((application) => (
                <div key={application.id} className="space-y-4">
                  <div className="relative aspect-[4/3] rounded-lg overflow-hidden shadow-xl group">
                    <img
                      src={application.images[0]}
                      alt={application.title}
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-2 sm:p-4">
                      <span className="text-white text-sm sm:text-xl font-semibold">{application.title}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:gap-4">
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
            <div className="mb-8 sm:mb-16 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
              <div className="bg-white p-3 sm:p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <div className="bg-green-100 p-1 sm:p-2 rounded-lg">
                    <Leaf className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-xs sm:text-base text-gray-800">Soil Health</h3>
                </div>
                <p className="text-xs sm:text-sm text-gray-600">Improves soil structure and promotes beneficial microbial activity</p>
              </div>

              <div className="bg-white p-3 sm:p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <div className="bg-green-100 p-1 sm:p-2 rounded-lg">
                    <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-xs sm:text-base text-gray-800">Temperature Control</h3>
                </div>
                <p className="text-xs sm:text-sm text-gray-600">Reduces soil temperature in hot climates, protecting plant roots</p>
              </div>

              <div className="bg-white p-3 sm:p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <div className="bg-green-100 p-1 sm:p-2 rounded-lg">
                    <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-xs sm:text-base text-gray-800">Weed Control</h3>
                </div>
                <p className="text-xs sm:text-sm text-gray-600">Natural weed suppression and moisture retention</p>
              </div>

              <div className="bg-white p-3 sm:p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <div className="bg-green-100 p-1 sm:p-2 rounded-lg">
                    <Award className="h-5 w-5 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-xs sm:text-base text-gray-800">Premium Quality</h3>
                </div>
                <p className="text-xs sm:text-sm text-gray-600">Consistently high-quality mulch for professional results</p>
              </div>
            </div>

            <div className="mt-16 text-center">
              <Button size="lg" className="bg-green-700 hover:bg-green-800 text-white" onClick={() => setLocation("/order")}>
                Get Your Custom Quote
              </Button>
            </div>
          </div>
        </div>

        {/* Products Section - Moved after Mulch Applications */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <ProductShowcase products={products} loading={isLoading} initialCategory="all" />
          </div>
        </section>
      </div>
    </>
  );
};

export default Landscapers;
