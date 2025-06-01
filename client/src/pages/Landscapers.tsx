import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { MapPin, Truck, Leaf, Award, Star, Zap, DollarSign, Package, Users, ThumbsUp, Clock, Shield, X } from "lucide-react";
import { useState } from "react";

const Landscapers = () => {
  const [, setLocation] = useLocation();
  const [showGallery, setShowGallery] = useState(false);

  const scrollToProducts = () => {
    const productsSection = document.getElementById("products-section");
    productsSection?.scrollIntoView({ behavior: "smooth" });
  };

  const testimonials = [
    {
      name: "Mike Rodriguez",
      company: "Green Horizons Landscaping",
      content:
        "Organic Soil Wholesale has completely transformed our landscaping projects. The quality of their products is unmatched, and our clients are thrilled with the results.",
      location: "Phoenix, AZ",
    },
    {
      name: "Sarah Williams",
      company: "Desert Bloom Gardens",
      content:
        "Working with their premium soil products has saved us time and money. The bulk delivery option is perfect for our large commercial projects.",
      location: "Scottsdale, AZ",
    },
  ];

  const products = [
    {
      id: 1,
      title: "DAIRY COMPOST",
      description:
        "Premium organic dairy compost, perfect for enriching soil and promoting healthy plant growth. Rich in essential nutrients and beneficial microorganisms.",
      benefits: ["Improves soil structure", "Enhances water retention", "Provides slow-release nutrients", "Supports beneficial soil life"],
      image:
        "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/Product%20Texture%2FProduct%20Texture%2FCompost%20Texture%20Look.jpg?alt=media&token=67d70a1e-c47e-4af9-a18d-6d96d73c6341",
      bulkOptions: ["Pallet of 144 units", "Bulk delivery available", "20% truckload discount"],
    },
    {
      id: 2,
      title: "WORM CASTINGS",
      description: "Premium vermicompost, nature's most potent soil amendment. Packed with beneficial microbes and plant-available nutrients.",
      benefits: ["100% organic", "Rich in beneficial microbes", "Improves soil structure", "Enhances plant immunity"],
      image:
        "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/Product%20Texture%2FProduct%20Texture%2FWorm%20castting%20product%20texture.png?alt=media&token=59d6f3da-f603-4d5e-bac2-42cd2b7ff9f8",
      bulkOptions: ["Bulk delivery available", "Custom packaging options", "20% truckload discount"],
    },
    {
      id: 3,
      title: "GOLF COURSE TEE TOP DIVOT REPAIR MIX",
      description: "Specialized blend for repairing divots on golf courses and sports fields. Perfect for maintaining pristine playing surfaces.",
      benefits: ["Quick turf healing", "Natural composition", "Easy application", "Long-lasting results"],
      image:
        "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/Product%20Texture%2FProduct%20Texture%2FCompost%20Texture%20Look.jpg?alt=media&token=67d70a1e-c47e-4af9-a18d-6d96d73c6341",
      bulkOptions: ["Bulk delivery available", "Custom packaging options", "20% truckload discount"],
    },
    {
      id: 4,
      title: "OVERSEED AND AERATION BLEND",
      description: "Advanced blend for overseeding and aeration, designed to improve soil quality and promote healthy turf growth.",
      benefits: ["Enhances soil quality", "Improves water retention", "Promotes root development", "Reduces maintenance needs"],
      image:
        "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/Product%20Texture%2FProduct%20Texture%2FCompost%20Texture%20Look.jpg?alt=media&token=67d70a1e-c47e-4af9-a18d-6d96d73c6341",
      bulkOptions: ["Bulk delivery available", "Custom packaging options", "20% truckload discount"],
    },
    {
      id: 5,
      title: "TREE AND SHRUB PLANTING AMENDMENT",
      description: "Specialized amendment for trees and shrubs, promoting strong root development and healthy growth.",
      benefits: ["Enhances root growth", "Improves soil structure", "Provides essential nutrients", "Supports plant health"],
      image:
        "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/Product%20Texture%2FProduct%20Texture%2FCompost%20Texture%20Look.jpg?alt=media&token=67d70a1e-c47e-4af9-a18d-6d96d73c6341",
      bulkOptions: ["Bulk delivery available", "Custom packaging options", "20% truckload discount"],
    },
    {
      id: 6,
      title: "NATURAL MINERAL SOIL CONDITIONER",
      description:
        "Natural mineral amendment that improves soil structure and nutrient retention. Perfect for water conservation and long-term soil improvement.",
      benefits: ["Enhances nutrient retention", "Improves soil aeration", "Reduces water requirements", "Long-lasting soil amendment"],
      image:
        "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/Product%20Texture%2FProduct%20Texture%2FBiochar%20Product%20Texture%20Look.jpg?alt=media&token=ee8746dc-875d-4379-b09e-cfebaa99f1d8",
      bulkOptions: ["Bulk delivery available", "Custom packaging options", "20% truckload discount"],
    },
    {
      id: 7,
      title: "SULFUR-POTASSIUM NUTRITION BOOST",
      description: "Premium sulfur-potassium nutrition boost for enhanced plant growth and soil vitality.",
      benefits: ["Balanced nutrition", "Improves soil health", "Enhances plant growth", "Supports microbial activity"],
      image:
        "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/Product%20Texture%2FProduct%20Texture%2FConcentrated%20Organic%20Amendment%20Fertilizer%20Product%20look.jpeg?alt=media&token=7182db19-d3b2-4bfd-9e27-db0891db9f78",
      bulkOptions: ["Bulk delivery available", "Custom packaging options", "20% truckload discount"],
    },
    {
      id: 8,
      title: "DROUGHT RESILIENCE SOIL AMENDMENT",
      description: "Specialized blend for drought resilience, helping plants thrive in challenging conditions.",
      benefits: ["Drought resistance", "Water retention", "Soil improvement", "Plant protection"],
      image:
        "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/Product%20Texture%2FProduct%20Texture%2FCompost%20Texture%20Look.jpg?alt=media&token=67d70a1e-c47e-4af9-a18d-6d96d73c6341",
      bulkOptions: ["Bulk delivery available", "Custom packaging options", "20% truckload discount"],
    },
    {
      id: 9,
      title: "PREMIUM POTTING SOIL",
      description: "Premium potting soil blend for container gardening and raised beds.",
      benefits: ["Perfect for containers", "Rich in nutrients", "Excellent drainage", "Ready to use"],
      image:
        "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/Product%20Texture%2FProduct%20Texture%2FDefault%20Potting%20Soil%20Texture.jpeg?alt=media&token=7c04030a-6c11-4a09-923b-1a58276905f0",
      bulkOptions: ["Bulk delivery available", "Custom packaging options", "20% truckload discount"],
    },
    {
      id: 10,
      title: "CANNABIS POTTING SOIL",
      description: "Specialized potting soil for cannabis cultivation, optimized for maximum growth and yield.",
      benefits: ["Cannabis-optimized", "Rich in nutrients", "Excellent drainage", "Ready to use"],
      image:
        "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/Product%20Texture%2FProduct%20Texture%2FDefault%20Potting%20Soil%20Texture.jpeg?alt=media&token=7c04030a-6c11-4a09-923b-1a58276905f0",
      bulkOptions: ["Bulk delivery available", "Custom packaging options", "20% truckload discount"],
    },
    {
      id: 11,
      title: "SUCCULENT INTERIOR POTTING MIX",
      description: "Specialized mix for succulents and cacti, providing optimal drainage and aeration.",
      benefits: ["Perfect for succulents", "Excellent drainage", "Aeration", "Ready to use"],
      image:
        "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/Product%20Texture%2FProduct%20Texture%2FDefault%20Potting%20Soil%20Texture.jpeg?alt=media&token=7c04030a-6c11-4a09-923b-1a58276905f0",
      bulkOptions: ["Bulk delivery available", "Custom packaging options", "20% truckload discount"],
    },
    {
      id: 12,
      title: "TROPICAL PLANT INTERIOR POTTING MIX",
      description: "Specialized mix for tropical plants, providing optimal moisture retention and aeration.",
      benefits: ["Perfect for tropicals", "Moisture retention", "Aeration", "Ready to use"],
      image:
        "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/Product%20Texture%2FProduct%20Texture%2FDefault%20Potting%20Soil%20Texture.jpeg?alt=media&token=7c04030a-6c11-4a09-923b-1a58276905f0",
      bulkOptions: ["Bulk delivery available", "Custom packaging options", "20% truckload discount"],
    },
    {
      id: 13,
      title: "CONCENTRATED AMENDMENT FOR FRUITS AND VEGETABLES",
      description: "Advanced soil amendment for maximum plant growth and vitality.",
      benefits: ["Maximum growth", "Enhanced vitality", "Rich in nutrients", "Quick results"],
      image:
        "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/Product%20Texture%2FProduct%20Texture%2FConcentrated%20Organic%20Amendment%20Fertilizer%20Product%20look.jpeg?alt=media&token=7182db19-d3b2-4bfd-9e27-db0891db9f78",
      bulkOptions: ["Bulk delivery available", "Custom packaging options", "20% truckload discount"],
    },
  ];

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
                  <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight animate-fade-in">
                    Best-in-Class Soil Products for Professional Landscapers
                  </h1>
                  <p className="text-lg text-green-100 mb-4 max-w-xl animate-fade-in delay-100">
                    Elevate your landscaping projects with our premium, desert-optimized soil solutions. Engineered for Arizona's unique climate.
                  </p>
                  {/* Benefit Highlights */}
                  <div className="flex flex-wrap gap-4 mb-6 animate-fade-in delay-200">
                    <div className="flex items-center gap-2 bg-green-900/40 px-3 py-2 rounded-lg">
                      <Leaf className="h-5 w-5 text-green-300" />
                      <span className="text-green-100 text-sm">Desert-Optimized Formulas</span>
                    </div>
                    <div className="flex items-center gap-2 bg-green-900/40 px-3 py-2 rounded-lg">
                      <Truck className="h-5 w-5 text-green-300" />
                      <span className="text-green-100 text-sm">Fast Bulk Delivery</span>
                    </div>
                    <div className="flex items-center gap-2 bg-green-900/40 px-3 py-2 rounded-lg">
                      <Star className="h-5 w-5 text-green-300" />
                      <span className="text-green-100 text-sm">Consistent, Pro Results</span>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 items-center mb-2 animate-fade-in delay-300">
                    <Button
                      size="lg"
                      className="bg-green-600 hover:bg-green-700 text-white text-lg px-8 py-4 shadow-lg rounded-full font-semibold transition-all duration-200"
                      onClick={() => setLocation("/order")}
                    >
                      Get Your Professional Quote
                    </Button>
                    <Badge className="bg-green-700 text-white px-4 py-2 text-base font-medium rounded-full">
                      Exclusive 20% truckload discount for landscapers
                    </Badge>
                  </div>
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

            {/* Benefits Section - Moved down */}
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

        {/* Products Section with improved UI - Moved up */}
        <div id="products-section" className="container mx-auto px-4 py-16">
          <div className="text-center mb-10">
            <Badge className="bg-green-700 text-white mb-4">Premium Soil Solutions</Badge>
            <h2 className="text-3xl font-bold mb-4">Professional-Grade Products for Superior Results</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our premium soil formulations are the result of years of research and field testing in Arizona's challenging climate. Each product is
              engineered for maximum performance and efficiency.
            </p>
          </div>

          {/* For Landscaping Section */}
          <div className="mb-20">
            <div className="relative rounded-2xl overflow-hidden mb-10">
              <img
                src="https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/Mulch%20photos%2FCommercial%20Applicaiton.png?alt=media&token=1eb4155a-00d0-462e-9280-928ff21db9eb"
                alt="Landscaping"
                className="w-full h-[400px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent flex items-center">
                <div className="p-8">
                  <h3 className="text-4xl font-bold text-white mb-4">For Landscaping</h3>
                  <p className="text-xl text-white/90 max-w-xl">
                    Premium soil solutions designed for professional landscapers, ensuring beautiful and sustainable outdoor spaces.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products
                .filter(
                  (product) =>
                    product.title.includes("MULCH") ||
                    product.title.includes("OVERSEED") ||
                    product.title.includes("TREE AND SHRUB") ||
                    product.title.includes("NATURAL MINERAL") ||
                    product.title.includes("DROUGHT RESILIENCE")
                )
                .map((product) => (
                  <Card
                    key={product.id}
                    className="overflow-hidden transition-all duration-300 cursor-pointer border-0 hover:border-0 bg-white dark:bg-neutral-900 hover:shadow-[0_15px_35px_-5px_rgba(0,0,0,0.1)] rounded-2xl group"
                    onClick={() => setLocation(`/products/${product.id}`)}
                  >
                    <div className="relative aspect-[4/3] overflow-hidden rounded-t-2xl">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 to-black/0 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors duration-300 z-10 flex items-center justify-center">
                        <div className="bg-white text-primary font-semibold px-4 py-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0 duration-300">
                          View Details
                        </div>
                      </div>
                      <img
                        src={product.image}
                        alt={product.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80";
                        }}
                      />
                    </div>

                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="bg-gray-50 text-gray-500 text-[10px] font-normal px-2 py-0.5 border-gray-200">
                          {product.title.includes("DAIRY")
                            ? "Dan's Gold"
                            : product.title.includes("WORM")
                              ? "Mikey's Worm Poop"
                              : product.title.includes("GOLF")
                                ? "Tee Top Divot Repair Blend"
                                : product.title.includes("OVERSEED")
                                  ? "Turf Daddy Blend"
                                  : product.title.includes("TREE")
                                    ? "Artemis Root Boost Blend"
                                    : product.title.includes("NATURAL MINERAL")
                                      ? "Zeolite"
                                      : product.title.includes("SULFUR")
                                        ? "SKMicrosource"
                                        : product.title.includes("DROUGHT")
                                          ? "Desert Defender"
                                          : product.title.includes("POTTING")
                                            ? "Ready Go Garden"
                                            : product.title.includes("CANNABIS")
                                              ? "CannaBag"
                                              : product.title.includes("SUCCULENT")
                                                ? "Succulent Success"
                                                : product.title.includes("TROPICAL")
                                                  ? "Tropic Treasure"
                                                  : product.title.includes("FLOWERING")
                                                    ? "Flower Flourish"
                                                    : product.title.includes("CONCENTRATED")
                                                      ? "SuperBooster"
                                                      : product.title.includes("MEDIUM DARK MULCH")
                                                        ? "Nature Blanket"
                                                        : product.title.includes("ALL-IN-ONE")
                                                          ? "Premium Nature's Blanket"
                                                          : "Dan's Gold"}
                        </Badge>
                      </div>
                      <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors duration-200">
                        {product.title}
                      </h3>
                      <p className="text-foreground/70 line-clamp-2 mb-4 text-sm">{product.description}</p>

                      {/* Benefits */}
                      <div className="flex flex-wrap gap-1 mb-6">
                        {product.benefits.slice(0, 3).map((benefit, idx) => (
                          <Badge key={idx} variant="outline" className="bg-primary/5 text-primary text-[10px] font-normal px-2">
                            {benefit}
                          </Badge>
                        ))}
                      </div>

                      {/* Bulk Options */}
                      <div className="space-y-2 mb-4">
                        {product.bulkOptions.map((option, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                            <Package className="h-4 w-4 text-green-600 flex-shrink-0" />
                            <span>{option}</span>
                          </div>
                        ))}
                      </div>

                      <Button className="w-full bg-primary hover:bg-primary/90 text-white shadow-sm hover:shadow-md transition-all duration-200">
                        View Details & Pricing
                      </Button>
                    </div>
                  </Card>
                ))}
            </div>
          </div>

          {/* For Floriculture Section */}
          <div className="mb-20">
            <div className="relative rounded-2xl overflow-hidden mb-10">
              <img
                src="https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/Mulch%20photos%2FResidential%2C%20Dark%20Mulch%20Planter%20Cover.jpeg?alt=media&token=0051d3f2-0116-4cd9-909c-5b4861171c54"
                alt="Floriculture"
                className="w-full h-[400px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent flex items-center">
                <div className="p-8">
                  <h3 className="text-4xl font-bold text-white mb-4">For Floriculture</h3>
                  <p className="text-xl text-white/90 max-w-xl">
                    Specialized soil solutions for nurseries, flower growers, and ornamental plant enthusiasts.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products
                .filter(
                  (product) =>
                    product.title.includes("POTTING SOIL") ||
                    product.title.includes("SUCCULENT") ||
                    product.title.includes("TROPICAL") ||
                    product.title.includes("FLOWERING")
                )
                .map((product) => (
                  <Card
                    key={product.id}
                    className="overflow-hidden transition-all duration-300 cursor-pointer border-0 hover:border-0 bg-white dark:bg-neutral-900 hover:shadow-[0_15px_35px_-5px_rgba(0,0,0,0.1)] rounded-2xl group"
                    onClick={() => setLocation(`/products/${product.id}`)}
                  >
                    <div className="relative aspect-[4/3] overflow-hidden rounded-t-2xl">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 to-black/0 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors duration-300 z-10 flex items-center justify-center">
                        <div className="bg-white text-primary font-semibold px-4 py-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0 duration-300">
                          View Details
                        </div>
                      </div>
                      <img
                        src={product.image}
                        alt={product.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80";
                        }}
                      />
                    </div>

                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="bg-gray-50 text-gray-500 text-[10px] font-normal px-2 py-0.5 border-gray-200">
                          {product.title.includes("DAIRY")
                            ? "Dan's Gold"
                            : product.title.includes("WORM")
                              ? "Mikey's Worm Poop"
                              : product.title.includes("GOLF")
                                ? "Tee Top Divot Repair Blend"
                                : product.title.includes("OVERSEED")
                                  ? "Turf Daddy Blend"
                                  : product.title.includes("TREE")
                                    ? "Artemis Root Boost Blend"
                                    : product.title.includes("NATURAL MINERAL")
                                      ? "Zeolite"
                                      : product.title.includes("SULFUR")
                                        ? "SKMicrosource"
                                        : product.title.includes("DROUGHT")
                                          ? "Desert Defender"
                                          : product.title.includes("POTTING")
                                            ? "Ready Go Garden"
                                            : product.title.includes("CANNABIS")
                                              ? "CannaBag"
                                              : product.title.includes("SUCCULENT")
                                                ? "Succulent Success"
                                                : product.title.includes("TROPICAL")
                                                  ? "Tropic Treasure"
                                                  : product.title.includes("FLOWERING")
                                                    ? "Flower Flourish"
                                                    : product.title.includes("CONCENTRATED")
                                                      ? "SuperBooster"
                                                      : product.title.includes("MEDIUM DARK MULCH")
                                                        ? "Nature Blanket"
                                                        : product.title.includes("ALL-IN-ONE")
                                                          ? "Premium Nature's Blanket"
                                                          : "Dan's Gold"}
                        </Badge>
                      </div>
                      <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors duration-200">
                        {product.title}
                      </h3>
                      <p className="text-foreground/70 line-clamp-2 mb-4 text-sm">{product.description}</p>

                      {/* Benefits */}
                      <div className="flex flex-wrap gap-1 mb-6">
                        {product.benefits.slice(0, 3).map((benefit, idx) => (
                          <Badge key={idx} variant="outline" className="bg-primary/5 text-primary text-[10px] font-normal px-2">
                            {benefit}
                          </Badge>
                        ))}
                      </div>

                      {/* Bulk Options */}
                      <div className="space-y-2 mb-4">
                        {product.bulkOptions.map((option, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                            <Package className="h-4 w-4 text-green-600 flex-shrink-0" />
                            <span>{option}</span>
                          </div>
                        ))}
                      </div>

                      <Button className="w-full bg-primary hover:bg-primary/90 text-white shadow-sm hover:shadow-md transition-all duration-200">
                        View Details & Pricing
                      </Button>
                    </div>
                  </Card>
                ))}
            </div>
          </div>

          {/* For Agriculture Section */}
          <div className="mb-20">
            <div className="relative rounded-2xl overflow-hidden mb-10">
              <img
                src="https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/Mulch%20photos%2FResidential%2C%20Around%20Medium%20Dark%20Mulch%20raised%20garden%20beds.jpeg?alt=media&token=a2d49936-7575-421d-8083-f0f029f93ffa"
                alt="Agriculture"
                className="w-full h-[400px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent flex items-center">
                <div className="p-8">
                  <h3 className="text-4xl font-bold text-white mb-4">For Agriculture</h3>
                  <p className="text-xl text-white/90 max-w-xl">
                    Advanced soil amendments and fertilizers for commercial farming, vineyards, and specialty crops.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products
                .filter(
                  (product) =>
                    product.title.includes("VINEYARD") ||
                    product.title.includes("AVOCADO") ||
                    product.title.includes("POME") ||
                    product.title.includes("CONCENTRATED") ||
                    product.title.includes("DAIRY COMPOST") ||
                    product.title.includes("WORM CASTINGS")
                )
                .map((product) => (
                  <Card
                    key={product.id}
                    className="overflow-hidden transition-all duration-300 cursor-pointer border-0 hover:border-0 bg-white dark:bg-neutral-900 hover:shadow-[0_15px_35px_-5px_rgba(0,0,0,0.1)] rounded-2xl group"
                    onClick={() => setLocation(`/products/${product.id}`)}
                  >
                    <div className="relative aspect-[4/3] overflow-hidden rounded-t-2xl">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 to-black/0 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors duration-300 z-10 flex items-center justify-center">
                        <div className="bg-white text-primary font-semibold px-4 py-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0 duration-300">
                          View Details
                        </div>
                      </div>
                      <img
                        src={product.image}
                        alt={product.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80";
                        }}
                      />
                    </div>

                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="bg-gray-50 text-gray-500 text-[10px] font-normal px-2 py-0.5 border-gray-200">
                          {product.title.includes("DAIRY")
                            ? "Dan's Gold"
                            : product.title.includes("WORM")
                              ? "Mikey's Worm Poop"
                              : product.title.includes("GOLF")
                                ? "Tee Top Divot Repair Blend"
                                : product.title.includes("OVERSEED")
                                  ? "Turf Daddy Blend"
                                  : product.title.includes("TREE")
                                    ? "Artemis Root Boost Blend"
                                    : product.title.includes("NATURAL MINERAL")
                                      ? "Zeolite"
                                      : product.title.includes("SULFUR")
                                        ? "SKMicrosource"
                                        : product.title.includes("DROUGHT")
                                          ? "Desert Defender"
                                          : product.title.includes("POTTING")
                                            ? "Ready Go Garden"
                                            : product.title.includes("CANNABIS")
                                              ? "CannaBag"
                                              : product.title.includes("SUCCULENT")
                                                ? "Succulent Success"
                                                : product.title.includes("TROPICAL")
                                                  ? "Tropic Treasure"
                                                  : product.title.includes("FLOWERING")
                                                    ? "Flower Flourish"
                                                    : product.title.includes("CONCENTRATED")
                                                      ? "SuperBooster"
                                                      : product.title.includes("MEDIUM DARK MULCH")
                                                        ? "Nature Blanket"
                                                        : product.title.includes("ALL-IN-ONE")
                                                          ? "Premium Nature's Blanket"
                                                          : "Dan's Gold"}
                        </Badge>
                      </div>
                      <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors duration-200">
                        {product.title}
                      </h3>
                      <p className="text-foreground/70 line-clamp-2 mb-4 text-sm">{product.description}</p>

                      {/* Benefits */}
                      <div className="flex flex-wrap gap-1 mb-6">
                        {product.benefits.slice(0, 3).map((benefit, idx) => (
                          <Badge key={idx} variant="outline" className="bg-primary/5 text-primary text-[10px] font-normal px-2">
                            {benefit}
                          </Badge>
                        ))}
                      </div>

                      {/* Bulk Options */}
                      <div className="space-y-2 mb-4">
                        {product.bulkOptions.map((option, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                            <Package className="h-4 w-4 text-green-600 flex-shrink-0" />
                            <span>{option}</span>
                          </div>
                        ))}
                      </div>

                      <Button className="w-full bg-primary hover:bg-primary/90 text-white shadow-sm hover:shadow-md transition-all duration-200">
                        View Details & Pricing
                      </Button>
                    </div>
                  </Card>
                ))}
            </div>
          </div>
        </div>

        {/* Value Proposition Section */}
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Professional Landscapers Trust Our Products</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our premium soil formulations are backed by years of research and proven results in Arizona's challenging climate. Every product is
              engineered for maximum performance and efficiency.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <Card className="border-2 border-green-100 hover:border-green-300 transition-all hover:shadow-lg">
              <CardContent className="p-6">
                <Award className="h-12 w-12 text-green-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">Premium Quality</h3>
                <p className="text-gray-600">
                  Industry-leading soil products with superior nutrient content and optimal composition for Arizona's unique conditions.
                </p>
              </CardContent>
            </Card>
            <Card className="border-2 border-green-100 hover:border-green-300 transition-all hover:shadow-lg">
              <CardContent className="p-6">
                <Leaf className="h-12 w-12 text-green-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">Desert-Optimized</h3>
                <p className="text-gray-600">
                  Scientifically formulated for Arizona's arid climate, extreme temperatures, and challenging soil conditions.
                </p>
              </CardContent>
            </Card>
            <Card className="border-2 border-green-100 hover:border-green-300 transition-all hover:shadow-lg">
              <CardContent className="p-6">
                <Zap className="h-12 w-12 text-green-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">Performance Guaranteed</h3>
                <p className="text-gray-600">Consistent results that exceed client expectations and reduce maintenance costs.</p>
              </CardContent>
            </Card>
          </div>

          {/* Extra Benefits Section */}
          <div className="bg-green-50 rounded-2xl p-8 mb-16">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex items-start gap-3">
                <ThumbsUp className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">Higher Client Satisfaction</h4>
                  <p className="text-sm text-gray-600">Deliver exceptional results that keep your clients coming back</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">Time-Saving Solutions</h4>
                  <p className="text-sm text-gray-600">Pre-blended products that reduce your prep time</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">Consistent Quality</h4>
                  <p className="text-sm text-gray-600">Dependable products for predictable outcomes</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Users className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">Expert Support</h4>
                  <p className="text-sm text-gray-600">Access to specialists who understand Arizona landscaping</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Order Section */}
          <div className="mt-12 bg-green-50 rounded-xl p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-800 mb-2">Need a Quick Quote?</h3>
                <p className="text-gray-600">Get instant pricing for bulk orders and special projects.</p>
              </div>
              <div className="flex gap-4">
                <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => setLocation("/order")}>
                  Get Quote Now
                </Button>
                <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-50" onClick={() => setLocation("/contact")}>
                  Contact Sales
                </Button>
              </div>
            </div>
          </div>

          {/* Testimonials Section */}
          <div className="bg-green-800 text-white rounded-2xl p-10 mb-16">
            <div className="text-center mb-10">
              <Badge className="bg-green-700 mb-4">Trusted by Arizona's Leading Landscapers</Badge>
              <h2 className="text-3xl font-bold mb-4">Professional Results, Professional Testimonials</h2>
              <p className="text-xl text-green-100 max-w-3xl mx-auto">
                Hear from landscaping professionals who trust our premium soil products for their most demanding projects.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="bg-green-700/50 border-green-600">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="h-12 w-12 rounded-full bg-green-600 flex items-center justify-center">
                        <Users className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{testimonial.name}</h3>
                        <p className="text-green-100">{testimonial.company}</p>
                        <div className="flex items-center gap-1 text-yellow-400 mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-current" />
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="text-green-100 mb-4">{testimonial.content}</p>
                    <div className="flex items-center gap-2 text-green-200">
                      <MapPin className="h-4 w-4" />
                      <span>{testimonial.location}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Call to Action */}
          <div className="bg-gradient-to-r from-green-700 to-green-600 rounded-2xl p-10 text-center text-white shadow-xl mb-16">
            <Zap className="h-12 w-12 mx-auto mb-4" />
            <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Arizona Landscapes?</h2>
            <p className="text-xl text-green-100 mb-8 max-w-3xl mx-auto">
              Get premium soil products delivered to your job site and experience the difference quality makes. Special pricing for professional
              landscapers.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button size="lg" className="button-white-visible text-lg px-8 py-6 shadow-lg" onClick={() => setLocation("/order")}>
                Get Your Custom Quote
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-green-600 text-lg px-8 py-6"
                onClick={() => setLocation("/contact")}
              >
                Contact Sales Team
              </Button>
            </div>
            <p className="text-green-200 mt-6">No obligation · Fast response · Volume discounts available</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Landscapers;
