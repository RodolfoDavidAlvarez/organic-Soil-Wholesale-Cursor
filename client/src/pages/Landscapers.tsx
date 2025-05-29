import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { MapPin, Truck, Leaf, Award, Star, Zap, DollarSign, Package, Users, ThumbsUp, Clock, Shield } from "lucide-react";

const Landscapers = () => {
  const [, setLocation] = useLocation();

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
      title: "Dan's Gold",
      description:
        "Premium organic dairy compost, perfect for enriching soil and promoting healthy plant growth. Rich in essential nutrients and beneficial microorganisms.",
      benefits: ["Improves soil structure", "Enhances water retention", "Provides slow-release nutrients", "Supports beneficial soil life"],
      image:
        "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/SSWwholesale.com%2FProduct%20Texture%2FCompost%20Texture%20Look.jpg?alt=media&token=217ce928-c092-4f45-b424-7acdd9905570",
      bulkOptions: ["Pallet of 144 units", "Bulk delivery available", "20% truckload discount"],
    },
    {
      id: 2,
      title: "Mikey's Worm Poop",
      description: "Premium vermicompost, nature's most potent soil amendment. Packed with beneficial microbes and plant-available nutrients.",
      benefits: ["100% organic", "Rich in beneficial microbes", "Improves soil structure", "Enhances plant immunity"],
      image:
        "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/SSWwholesale.com%2FProduct%20Texture%2FWorm%20castting%20product%20texture.png?alt=media&token=87c65006-3a11-44ec-adeb-6f4896d544e3",
      bulkOptions: ["Bulk delivery available", "Custom packaging options", "20% truckload discount"],
    },
    {
      id: 3,
      title: "Tee Top Divot Repair Blend",
      description: "Specialized blend for repairing divots on golf courses and sports fields. Perfect for maintaining pristine playing surfaces.",
      benefits: ["Quick turf healing", "Natural composition", "Easy application", "Long-lasting results"],
      image:
        "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/SSWwholesale.com%2FProduct%20Texture%2FCompost%20Texture%20Look.jpg?alt=media&token=217ce928-c092-4f45-b424-7acdd9905570",
      bulkOptions: ["Bulk delivery available", "Custom packaging options", "20% truckload discount"],
    },
    {
      id: 4,
      title: "Turf Daddy Blend",
      description: "Advanced blend for overseeding and aeration, designed to improve soil quality and promote healthy turf growth.",
      benefits: ["Enhances soil quality", "Improves water retention", "Promotes root development", "Reduces maintenance needs"],
      image:
        "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/SSWwholesale.com%2FProduct%20Texture%2FCompost%20Texture%20Look.jpg?alt=media&token=217ce928-c092-4f45-b424-7acdd9905570",
      bulkOptions: ["Bulk delivery available", "Custom packaging options", "20% truckload discount"],
    },
    {
      id: 5,
      title: "Artemis Root Boost Blend",
      description: "Specialized amendment for trees and shrubs, promoting strong root development and healthy growth.",
      benefits: ["Enhances root growth", "Improves soil structure", "Provides essential nutrients", "Supports plant health"],
      image:
        "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/SSWwholesale.com%2FProduct%20Texture%2FCompost%20Texture%20Look.jpg?alt=media&token=217ce928-c092-4f45-b424-7acdd9905570",
      bulkOptions: ["Bulk delivery available", "Custom packaging options", "20% truckload discount"],
    },
    {
      id: 6,
      title: "Zeolite",
      description:
        "Natural mineral amendment that improves soil structure and nutrient retention. Perfect for water conservation and long-term soil improvement.",
      benefits: ["Enhances nutrient retention", "Improves soil aeration", "Reduces water requirements", "Long-lasting soil amendment"],
      image:
        "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/SSWwholesale.com%2FZeolite10lbs.jpg?alt=media&token=c76272a4-4abb-483b-95f7-24dae8efce72",
      bulkOptions: ["Bulk delivery available", "Custom packaging options", "20% truckload discount"],
    },
    {
      id: 7,
      title: "SKMicrosource",
      description: "Premium sulfur-potassium nutrition boost for enhanced plant growth and soil vitality.",
      benefits: ["Balanced nutrition", "Improves soil health", "Enhances plant growth", "Supports microbial activity"],
      image:
        "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/SSWwholesale.com%2FProduct%20Texture%2FCompost%20Texture%20Look.jpg?alt=media&token=217ce928-c092-4f45-b424-7acdd9905570",
      bulkOptions: ["Bulk delivery available", "Custom packaging options", "20% truckload discount"],
    },
    {
      id: 8,
      title: "Desert Defender",
      description: "Specialized blend for drought resilience, helping plants thrive in challenging conditions.",
      benefits: ["Drought resistance", "Water retention", "Soil improvement", "Plant protection"],
      image:
        "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/SSWwholesale.com%2FProduct%20Texture%2FCompost%20Texture%20Look.jpg?alt=media&token=217ce928-c092-4f45-b424-7acdd9905570",
      bulkOptions: ["Bulk delivery available", "Custom packaging options", "20% truckload discount"],
    },
    {
      id: 9,
      title: "PlugBoost",
      description: "Premium seed starter mix for optimal germination and early plant development.",
      benefits: ["Enhanced germination", "Strong root development", "Nutrient-rich", "Easy to use"],
      image:
        "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/SSWwholesale.com%2FProduct%20Texture%2FCompost%20Texture%20Look.jpg?alt=media&token=217ce928-c092-4f45-b424-7acdd9905570",
      bulkOptions: ["Bulk delivery available", "Custom packaging options", "20% truckload discount"],
    },
    {
      id: 10,
      title: "PropaGrow",
      description: "Specialized propagation mix for optimal root development and plant growth.",
      benefits: ["Rapid root development", "Enhanced growth", "Nutrient-rich", "Versatile application"],
      image:
        "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/SSWwholesale.com%2FProduct%20Texture%2FCompost%20Texture%20Look.jpg?alt=media&token=217ce928-c092-4f45-b424-7acdd9905570",
      bulkOptions: ["Bulk delivery available", "Custom packaging options", "20% truckload discount"],
    },
    {
      id: 11,
      title: "PlantPal",
      description: "Comprehensive nursery mix for all stages of plant growth, from seedlings to mature plants.",
      benefits: ["Complete nutrition", "Versatile use", "Consistent quality", "Easy application"],
      image:
        "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/SSWwholesale.com%2FProduct%20Texture%2FCompost%20Texture%20Look.jpg?alt=media&token=217ce928-c092-4f45-b424-7acdd9905570",
      bulkOptions: ["Bulk delivery available", "Custom packaging options", "20% truckload discount"],
    },
    {
      id: 12,
      title: "Clay Cure",
      description: "Specialized blend for improving clay soil structure and drainage.",
      benefits: ["Improves drainage", "Enhances soil structure", "Reduces compaction", "Promotes root growth"],
      image:
        "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/SSWwholesale.com%2FProduct%20Texture%2FCompost%20Texture%20Look.jpg?alt=media&token=217ce928-c092-4f45-b424-7acdd9905570",
      bulkOptions: ["Bulk delivery available", "Custom packaging options", "20% truckload discount"],
    },
    {
      id: 13,
      title: "Silky Silt Saver",
      description: "Advanced blend for improving silt soil performance and moisture retention.",
      benefits: ["Enhanced moisture retention", "Improved soil structure", "Better nutrient availability", "Drought resilience"],
      image:
        "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/SSWwholesale.com%2FProduct%20Texture%2FCompost%20Texture%20Look.jpg?alt=media&token=217ce928-c092-4f45-b424-7acdd9905570",
      bulkOptions: ["Bulk delivery available", "Custom packaging options", "20% truckload discount"],
    },
  ];

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
        {/* Hero Section */}
        <div className="bg-green-800 text-white py-24 relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 right-0 h-20 bg-white/10"></div>
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-black/10"></div>
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center justify-center gap-2 mb-6 bg-green-700 px-4 py-2 rounded-full">
                <Award className="h-5 w-5" />
                <span className="text-lg font-semibold">Arizona's #1 Premium Soil Supplier</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">Best-in-Class Soil Products for Professional Landscapers</h1>
              <p className="text-xl text-green-100 mb-10">
                Elevate your landscaping projects with our premium, desert-optimized soil solutions. Engineered for Arizona's unique climate, our
                products deliver superior results, water efficiency, and unmatched plant performance.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="bg-white text-green-800 hover:bg-green-50 text-lg px-8 py-6 shadow-lg"
                  onClick={() => setLocation("/order")}
                >
                  Get Your Professional Quote
                </Button>
                <Badge className="bg-green-700 text-white px-4 py-2 text-base font-medium">Exclusive 20% truckload discount for landscapers</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Products Section with improved UI - Moved up */}
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-10">
            <Badge className="bg-green-700 text-white mb-4">Premium Soil Solutions</Badge>
            <h2 className="text-3xl font-bold mb-4">Professional-Grade Products for Superior Results</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our premium soil formulations are the result of years of research and field testing in Arizona's challenging climate. Each product is
              engineered for maximum performance and efficiency.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
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

                  <Button className="w-full bg-primary hover:bg-primary/90 text-white shadow-sm hover:shadow-md transition-all duration-200">
                    View Details & Pricing
                  </Button>
                </div>
              </Card>
            ))}
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
              <Button
                size="lg"
                className="bg-white text-green-800 hover:bg-green-50 text-lg px-8 py-6 shadow-lg"
                onClick={() => setLocation("/order")}
              >
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
