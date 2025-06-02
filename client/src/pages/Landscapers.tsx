import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { MapPin, Truck, Leaf, Award, Star, Zap, DollarSign, Package, Users, ThumbsUp, Clock, Shield, X } from "lucide-react";
import { useState } from "react";
import React from "react";
import ProductCarousel from "@/components/ProductCarousel";

// Create a component for the product card
const ProductCard: React.FC<{
  product: Product;
  onTextureClick: (e: React.MouseEvent, texturePath: string) => void;
}> = ({ product, onTextureClick }) => {
  const [, setLocation] = useLocation();

  return (
    <Card
      key={product.id}
      className="overflow-hidden transition-all duration-300 cursor-pointer border-0 hover:border-0 bg-white dark:bg-neutral-900 hover:shadow-[0_15px_35px_-5px_rgba(0,0,0,0.1)] rounded-2xl group"
      onClick={() => setLocation(`/products/${product.id}`)}
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-t-2xl">
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 to-black/0 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors duration-300 z-10 flex items-center justify-center">
          <div className="bg-white text-primary font-semibold px-4 py-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0 duration-300">
            View Product
          </div>
        </div>
        {product.texture && (
          <div className="absolute top-2 right-2 z-20" onClick={(e) => onTextureClick(e, product.texture!)}>
            <div className="bg-white p-1 rounded-full shadow-md cursor-pointer hover:bg-green-50">
              <Badge variant="outline" className="border-green-500 text-green-600 text-xs">
                View Texture
              </Badge>
            </div>
          </div>
        )}
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
            {product.brand}
          </Badge>
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors duration-200">{product.title}</h3>
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

        <Button 
          className="w-full bg-primary hover:bg-primary/90 text-white shadow-sm hover:shadow-md transition-all duration-200"
          onClick={(e) => {
            e.stopPropagation();
            setLocation(`/products/${product.id}`);
          }}
        >
          View Product Details
        </Button>
      </div>
    </Card>
  );
};

interface Product {
  id: number;
  title: string;
  brand: string;
  description: string;
  benefits: string[];
  image: string;
  texture?: string;
  bulkOptions: string[];
}

const Landscapers = () => {
  const [, setLocation] = useLocation();
  const [showGallery, setShowGallery] = useState(false);
  const [texturePreview, setTexturePreview] = useState<string | null>(null);

  const handleTextureClick = (e: React.MouseEvent, texturePath: string) => {
    e.stopPropagation();
    setTexturePreview(texturePath);
  };

  const closeTexturePreview = () => {
    setTexturePreview(null);
  };

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

  const products: Product[] = [
    {
      id: 1,
      title: "Mulch",
      brand: "Nature's Blanket Premium Mulch",
      description:
        "Premium mulch enhanced with dairy compost and worm castings. Available in multiple sizes (.5-1\" and 1-2\") for various applications including commercial parks, residential projects, and garden beds.",
      benefits: ["Enhances moisture retention", "Suppresses weeds", "Improves soil structure", "Decorative finish"],
      image:
        "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/Mulch%20photos%2FDark%20Mulck%20Truckload%20Delivery.jpeg?alt=media&token=f2709c22-8af6-48aa-8deb-00200d4e78d9",
      texture: "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/Product%20Texture%2FProduct%20Texture%2FMulch%20Enhanced%20with%20Dairy%20Compost.png?alt=media&token=6627da3e-8dca-4653-82e2-c20d7618b1fe",
      bulkOptions: ["Pallet of 144 units", "Bulk delivery available", "20% truckload discount"],
    },
    {
      id: 2,
      title: "Turf",
      brand: "OVERSEED TOPDRESS BLEND FOR GRASS",
      description: "Ideal for overseeding, aeration, and turf laying, Turf Daddy Blend improves soil quality and plant health with a mix of dairy compost, Zeolite, and worm castings, ensuring lush, resilient turf.",
      benefits: ["Enhances soil quality", "Improves water retention", "Promotes root development", "Reduces maintenance needs"],
      image: "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/Grass.jpeg?alt=media&token=d484ed3c-2d0b-4c6b-8e31-f5eb5ab22ea7",
      texture: "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/Product%20Texture%2FProduct%20Texture%2FCompost%20Texture%20Look.jpg?alt=media&token=67d70a1e-c47e-4af9-a18d-6d96d73c6341",
      bulkOptions: ["Bulk delivery available", "Custom packaging options", "20% truckload discount"],
    },
    {
      id: 3,
      title: "TREE AND SHRUB PLANTING AMENDMENT",
      brand: "Artemis Root Boost Blend",
      description: "Specifically designed to support root health for trees and shrubs, Artemis Root Boost Blend enriches the soil with dairy compost and essential nutrients, promoting strong, healthy root systems.",
      benefits: ["Enhances root growth", "Improves soil structure", "Provides essential nutrients", "Supports plant health"],
      image: "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/Tree%20and%20Shrub.jpeg?alt=media&token=81fc1b7b-da04-45c8-ba82-0737bf65ef5d",
      texture: "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/Product%20Texture%2FProduct%20Texture%2FCompost%20Texture%20Look.jpg?alt=media&token=67d70a1e-c47e-4af9-a18d-6d96d73c6341",
      bulkOptions: ["Bulk delivery available", "Custom packaging options", "20% truckload discount"],
    },
    {
      id: 4,
      title: "PALM AND DATE TREE PLANT FOOD BLEND",
      brand: "Oasis Blend",
      description: "Formulated for palm and date trees, Oasis Blend enriches soil with dairy compost, worm castings, and essential nutrients for healthy growth and fruit development, creating lush, thriving oases.",
      benefits: ["Tree-specific", "Enhances fruit quality", "Improves soil health", "Supports root development"],
      image: "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/Palm%20Trees.jpg?alt=media&token=3adb0d47-3707-4a34-ab66-8ccccb88b7e7",
      texture: "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/Product%20Texture%2FProduct%20Texture%2FCompost%20Texture%20Look.jpg?alt=media&token=67d70a1e-c47e-4af9-a18d-6d96d73c6341",
      bulkOptions: ["Bulk delivery available", "Custom packaging options", "20% truckload discount"],
    }
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

  const landscapingProducts = [
    {
      id: "turf-daddy",
      name: "Turf Daddy Blend",
      brandName: "OVERSEED TOPDRESS BLEND FOR GRASS",
      mainImage:
        "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/Grass.jpeg?alt=media&token=d484ed3c-2d0b-4c6b-8e31-f5eb5ab22ea7",
      thumbnailImages: [
        "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/Product%20Texture%2FProduct%20Texture%2FCompost%20Texture%20Look.jpg?alt=media&token=67d70a1e-c47e-4af9-a18d-6d96d73c6341",
        "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/9lb%20bag%20product%20photos%2FTurf%20Daddy1CF.jpg?alt=media&token=2ed11d15-24e4-4bf4-83cb-e060afcee16e",
      ],
      description:
        "Ideal for overseeding, aeration, and turf laying, Turf Daddy Blend improves soil quality and plant health with a mix of dairy compost, Zeolite, and worm castings, ensuring lush, resilient turf.",
    },
    {
      id: "artemis",
      name: "Artemis Root Boost Blend",
      brandName: "TREE AND SHRUB PLANTING AMENDMENT",
      mainImage:
        "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/Tree%20and%20Shrub.jpeg?alt=media&token=81fc1b7b-da04-45c8-ba82-0737bf65ef5d",
      thumbnailImages: [
        "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/Product%20Texture%2FProduct%20Texture%2FCompost%20Texture%20Look.jpg?alt=media&token=67d70a1e-c47e-4af9-a18d-6d96d73c6341",
        "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/9lb%20bag%20product%20photos%2FArtemis10lbs%20(1).jpg?alt=media&token=9f7cc7b5-df16-440d-9a4c-1e250470bb12",
      ],
      description:
        "Specifically designed to support root health for trees and shrubs, Artemis Root Boost Blend enriches the soil with dairy compost and essential nutrients, promoting strong, healthy root systems in commercial and organic farming.",
    },
    {
      id: "tee-top",
      name: "Tee Top Divot Repair Blend",
      brandName: "GOLF COURSE TEE TOP DIVOT REPAIR MIX",
      mainImage:
        "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/Tee%20Top%20Divot%20Repair.jpeg?alt=media&token=1ba764aa-272b-4866-936d-425144b66686",
      thumbnailImages: [
        "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/Product%20Texture%2FProduct%20Texture%2FCompost%20Texture%20Look.jpg?alt=media&token=67d70a1e-c47e-4af9-a18d-6d96d73c6341",
        "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/9lb%20bag%20product%20photos%2FTee%20Top1CF.jpg?alt=media&token=fa3031ac-b5ad-49c4-8299-4b1c87556414",
      ],
      description: "Perfect for golf courses, this blend repairs divots and maintains pristine playing surfaces, combining Zeolite and worm castings for optimal soil health and grass recovery.",
    },
    {
      id: "oasis",
      name: "Oasis Blend",
      brandName: "PALM AND DATE TREE PLANT FOOD BLEND",
      mainImage:
        "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/Palm%20Trees.jpg?alt=media&token=3adb0d47-3707-4a34-ab66-8ccccb88b7e7",
      thumbnailImages: [
        "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/Product%20Texture%2FProduct%20Texture%2FCompost%20Texture%20Look.jpg?alt=media&token=67d70a1e-c47e-4af9-a18d-6d96d73c6341",
        "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/9lb%20bag%20product%20photos%2FOasis%209LB%20WB.jpg?alt=media&token=2298645a-42cc-4529-a42a-a7ce2433ff97",
      ],
      description: "Formulated for palm and date trees, Oasis Blend enriches soil with dairy compost, worm castings, and essential nutrients for healthy growth and fruit development, creating lush, thriving oases.",
    },
    {
      id: "nature-blanket",
      name: "Nature's Blanket Premium Mulch",
      brandName: "MEDIUM DARK MULCH FOR PLANTER COVER",
      mainImage:
        "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/Mulch%20photos%2FDark%20Mulck%20Truckload%20Delivery.jpeg?alt=media&token=f2709c22-8af6-48aa-8deb-00200d4e78d9",
      thumbnailImages: [
        "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/Mulch%20photos%2FCommercial%20Applicaiton.png?alt=media&token=1eb4155a-00d0-462e-9280-928ff21db9eb",
        "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/Mulch%20photos%2FResidential%2C%20Around%20Medium%20Dark%20Mulch%20raised%20garden%20beds.jpeg?alt=media&token=a2d49936-7575-421d-8083-f0f029f93ffa",
        "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/Mulch%20photos%2FDark%20Mulk%20Applied%20in%20outside%20of%20office%20showcase.jpeg?alt=media&token=557e9170-9316-438b-abe8-48f8987144c7",
      ],
      description:
        'Premium mulch enhanced with dairy compost and worm castings. Available in multiple sizes (.5-1" and 1-2") for various applications including commercial parks, residential projects, and garden beds. Perfect for landscaping, erosion control, and soil protection.',
    },
  ];

  return (
    <>
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
                  <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight animate-fade-in">
                    Products Designed for Landscapers
                  </h1>
                  <p className="text-lg text-green-100 mb-4 max-w-xl animate-fade-in delay-100">
                    Elevate your landscaping projects with our premium soil solutions. Engineered for Arizona's unique climate.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 items-center mb-2 animate-fade-in delay-300">
                    <Button
                      size="lg"
                      className="bg-green-600 hover:bg-green-700 text-white text-lg px-8 py-4 shadow-lg rounded-full font-semibold transition-all duration-200"
                      onClick={() => setLocation("/order")}
                    >
                      Shop Now
                    </Button>
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

        {/* Products Section - Moved up and cleaned up */}
        <div id="products-section" className="container mx-auto px-4 py-10">
          {/* For Landscaping Section */}
          <div id="landscaping-section" className="mb-16">
            <div className="relative rounded-2xl overflow-hidden mb-10">
              <img
                src="https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/Lanscaping%20section%20introduction%20image.jpeg?alt=media&token=7405742b-2696-4f11-920f-d294a63ae6e2"
                alt="Landscaping"
                className="w-full h-[400px] object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="p-8 text-center">
                  <h3 className="text-4xl font-bold text-white mb-4 shadow-text">Products for Landscaping</h3>
                  <p className="text-xl text-white/90 max-w-xl shadow-text">
                    Premium soil solutions designed for professional landscapers, ensuring beautiful and sustainable outdoor spaces.
                  </p>
                </div>
              </div>
            </div>
            
            <style jsx>{`
              .shadow-text {
                text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
              }
            `}</style>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {landscapingProducts.map((product) => (
                <div key={product.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 group">
                  <div className="relative">
                    <ProductCarousel 
                      mainImage={product.mainImage} 
                      thumbnailImages={product.thumbnailImages} 
                      productName={product.name}
                      brandName={product.brandName}
                      productId={product.id}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div 
                        className="bg-white text-primary font-semibold px-4 py-2 rounded-full shadow-lg transform translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 cursor-pointer"
                        onClick={() => setLocation(`/products/${product.id}`)}
                      >
                        View Product Details
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex flex-col gap-1 mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-gray-50 text-gray-500 text-[10px] font-normal px-2 py-0.5 border-gray-200">
                          {product.name}
                        </Badge>
                      </div>
                      <h4 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors duration-200">{product.brandName}</h4>
                    </div>
                    <p className="text-gray-600 mb-4">{product.description}</p>
                    <Button 
                      className="w-full bg-primary hover:bg-primary/90 text-white shadow-sm hover:shadow-md transition-all duration-200"
                      onClick={() => setLocation(`/products/${product.id}`)}
                    >
                      View Details & Pricing
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Show all products section */}
          <div className="mb-20">
            <div className="relative rounded-2xl overflow-hidden mb-10">
              <img
                src="https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/Grass.jpeg?alt=media&token=d484ed3c-2d0b-4c6b-8e31-f5eb5ab22ea7"
                alt="All Products"
                className="w-full h-[400px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent flex items-center">
                <div className="p-8">
                  <h3 className="text-4xl font-bold text-white mb-4">Our Products</h3>
                  <p className="text-xl text-white/90 max-w-xl">
                    Premium soil solutions for all your landscaping and gardening needs.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} onTextureClick={handleTextureClick} />
              ))}
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
