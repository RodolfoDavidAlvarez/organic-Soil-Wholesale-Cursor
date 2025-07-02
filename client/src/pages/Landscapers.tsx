import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { Award, Leaf, Zap, Shield, X } from "lucide-react";
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
              {/* Left: Landscaper Photo */}
              <div className="w-full lg:w-1/2 flex items-center justify-center">
                <div className="rounded-2xl overflow-hidden shadow-xl aspect-square w-full max-w-md bg-white/10">
                  <img
                    src="https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/landscaper%20photo.png?alt=media&token=9eb039a4-ab25-4276-9763-2b9901c2cdf8"
                    alt="Professional Landscaper"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              {/* Right: Text + CTA + Mulch Cards */}
              <div className="w-full lg:w-1/2 flex flex-col justify-center">
                <div className="mb-8">
                  <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight animate-fade-in">Products Designed for Landscapers</h1>
                  <p className="text-lg text-green-100 mb-4 max-w-xl animate-fade-in delay-100">
                    Elevate your landscaping projects with our premium soil solutions. Engineered for Arizona's unique climate.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 items-center mb-2 animate-fade-in delay-300"></div>
                  {/* Trusted by row */}
                  <div className="flex items-center gap-6 mt-4 mb-2 animate-fade-in delay-400">
                    <span className="text-green-200 text-sm">Trusted by Arizona's Top Landscaping Companies</span>
                    <div className="flex gap-2">
                      <div className="h-6 w-20 bg-green-900/30 rounded" />
                      <div className="h-6 w-20 bg-green-900/30 rounded" />
                      <div className="h-6 w-20 bg-green-900/30 rounded" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2 animate-fade-in delay-500">
                    <Award className="h-5 w-5" />
                    <span className="text-green-100 text-base font-semibold">Arizona's #1 Premium Mulch Supplier</span>
                  </div>
                </div>
                {/* Mulch Application Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in delay-600">
                  {/* Commercial Parks Card */}
                  <div className="relative rounded-xl overflow-hidden shadow-lg group cursor-pointer transition-transform hover:-translate-y-1 bg-white/10">
                    <img
                      src="https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/Mulch%20photos%2FCommercial%20Applicaiton.png?alt=media&token=1eb4155a-00d0-462e-9280-928ff21db9eb"
                      alt="Commercial Park Application"
                      className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent flex items-end p-4">
                      <span className="text-white text-lg font-semibold">Commercial Parks</span>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="bg-green-700/90 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">Learn More</span>
                    </div>
                  </div>
                  {/* Residential Projects Card */}
                  <div className="relative rounded-xl overflow-hidden shadow-lg group cursor-pointer transition-transform hover:-translate-y-1 bg-white/10">
                    <img
                      src="https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/Mulch%20photos%2FResidential%2C%20Dark%20Mulch%20Planter%20Cover.jpeg?alt=media&token=0051d3f2-0116-4cd9-909c-5b4861171c54"
                      alt="Residential Application"
                      className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent flex items-end p-4">
                      <span className="text-white text-lg font-semibold">Residential Projects</span>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="bg-green-700/90 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">Learn More</span>
                    </div>
                  </div>
                  {/* Garden Beds Card */}
                  <div className="relative rounded-xl overflow-hidden shadow-lg group cursor-pointer transition-transform hover:-translate-y-1 bg-white/10">
                    <img
                      src="https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/Mulch%20photos%2FResidential%2C%20Around%20Medium%20Dark%20Mulch%20raised%20garden%20beds.jpeg?alt=media&token=a2d49936-7575-421d-8083-f0f029f93ffa"
                      alt="Garden Beds Application"
                      className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent flex items-end p-4">
                      <span className="text-white text-lg font-semibold">Garden Beds</span>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="bg-green-700/90 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">Learn More</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Product Section - Plant Pal */}
        <section className="py-16 bg-gradient-to-b from-white to-gray-50">
          <div className="container mx-auto px-4">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="flex flex-col lg:flex-row">
                {/* Product Image */}
                <div className="lg:w-1/2">
                  <img
                    src="plant-pal-showcase.png"
                    alt="Plant Pal - Multi-Purpose Organic Soil"
                    className="w-full h-full object-cover min-h-[400px]"
                  />
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
                    <p className="text-gray-600 text-lg leading-relaxed mb-6">
                      The ultimate bulk soil solution for professional landscapers. Our premium organic blend delivers 
                      exceptional results for all your landscaping projects, from commercial installations to residential gardens.
                    </p>
                    
                    {/* Premium Ingredients */}
                    <div className="mb-6">
                      <div className="flex items-center gap-4 mb-3">
                        <h4 className="text-lg font-semibold text-gray-900">Premium Ingredient Blend:</h4>
                        <div className="w-12 h-8 rounded-lg overflow-hidden shadow-sm">
                          <img 
                            src="soil-texture.png"
                            alt="Plant Pal soil texture" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                      <ul className="text-sm text-gray-600 space-y-2">
                        <li><strong>Clean Wood Fiber</strong> – Natural bulking agent that improves aeration and moisture balance for healthy roots</li>
                        <li><strong>8-3-1 Granules</strong> – Organic source of nitrogen and other macronutrients for steady plant growth</li>
                        <li><strong>Worm Castings</strong> – Readily available nutrients plus beneficial microbes to boost vitality</li>
                        <li><strong>Organic Dairy Compost</strong> – Slow-release nutrient and biology enhancer that enriches soil fertility</li>
                        <li><strong>Calcium</strong> – Strengthens cell walls and prevents blossom end rot</li>
                        <li><strong>Zinc Sulfate</strong> – Supports enzyme function and healthy development</li>
                      </ul>
                    </div>
                  </div>
                  
                  {/* Key Features */}
                  <div className="grid grid-cols-2 gap-4 mb-8">
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
