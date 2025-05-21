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
      title: "Dairy Compost",
      description:
        "Premium organic dairy compost, perfect for enriching soil and promoting healthy plant growth in Arizona's challenging desert conditions. Rich in essential nutrients and beneficial microorganisms.",
      benefits: ["Improves soil structure", "Enhances water retention", "Provides slow-release nutrients", "Supports beneficial soil life"],
      image:
        "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/SSWwholesale.com%2FProduct%20Texture%2FCompost%20Texture%20Look.jpg?alt=media&token=217ce928-c092-4f45-b424-7acdd9905570",
      bulkOptions: ["Pallet of 144 units", "Bulk delivery available", "20% truckload discount"],
    },
    {
      id: 7,
      title: "Turf Blend",
      description:
        "Specialized blend designed for optimal turf growth and maintenance in Arizona's hot climate. Perfect for golf courses, sports fields, and residential lawns facing drought conditions.",
      benefits: ["Promotes deep root development", "Enhances drought resistance", "Improves turf density", "Reduces maintenance needs"],
      image:
        "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/SSWwholesale.com%2FTurf%20Daddy1CF.jpg?alt=media&token=75a7d494-1160-4be6-a4c2-fe0846ffa2d8",
      bulkOptions: ["50 bags per pallet", "Bulk delivery available", "20% truckload discount"],
    },
    {
      id: 2,
      title: "Worm Castings",
      description:
        "Premium vermicompost, nature's most potent soil amendment. Packed with beneficial microbes and plant-available nutrients ideal for Arizona's mineral-depleted soils.",
      benefits: ["100% organic", "Rich in beneficial microbes", "Improves soil structure", "Enhances plant immunity"],
      image:
        "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/SSWwholesale.com%2FProduct%20Texture%2FWorm%20Castings%20Texture%20Look.jpeg?alt=media&token=dd706f8d-a4c1-4982-89d1-2f1ab3980a08",
      bulkOptions: ["Bulk delivery available", "Custom packaging options", "20% truckload discount"],
    },
    {
      id: 6,
      title: "Zeolite",
      description:
        "Natural mineral amendment that improves soil structure and nutrient retention. Perfect for Arizona landscaping projects requiring water conservation and long-term soil improvement.",
      benefits: ["Enhances nutrient retention", "Improves soil aeration", "Reduces water requirements", "Long-lasting soil amendment"],
      image:
        "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/SSWwholesale.com%2FZeolite10lbs.jpg?alt=media&token=c76272a4-4abb-483b-95f7-24dae8efce72",
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
                <MapPin className="h-5 w-5" />
                <span className="text-lg font-semibold">Arizona's Premier Soil Supplier</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">Transform Your Arizona Landscapes</h1>
              <p className="text-xl text-green-100 mb-10">
                Premium soil products specially formulated for Arizona's unique climate. Boost growth, reduce water usage, and create stunning
                landscapes that thrive in the desert.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="bg-white text-green-800 hover:bg-green-50 text-lg px-8 py-6 shadow-lg"
                  onClick={() => setLocation("/order")}
                >
                  Get Your Custom Quote
                </Button>
                <Badge className="bg-green-700 text-white px-4 py-2 text-base font-medium">Now offering 20% truckload discounts</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Value Proposition Section */}
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Arizona Landscapers Choose Us</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our premium soil products are specially formulated to handle Arizona's unique challenges, helping you deliver exceptional results to
              your clients.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <Card className="border-2 border-green-100 hover:border-green-300 transition-all hover:shadow-lg">
              <CardContent className="p-6">
                <Truck className="h-12 w-12 text-green-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">Statewide Delivery</h3>
                <p className="text-gray-600">
                  Fast and reliable delivery to any location in Arizona, from Phoenix to Tucson and beyond. No project is too remote.
                </p>
              </CardContent>
            </Card>
            <Card className="border-2 border-green-100 hover:border-green-300 transition-all hover:shadow-lg">
              <CardContent className="p-6">
                <Leaf className="h-12 w-12 text-green-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">Desert-Optimized Products</h3>
                <p className="text-gray-600">
                  Our products are specifically formulated for Arizona's arid climate, extreme temperatures, and unique soil challenges.
                </p>
              </CardContent>
            </Card>
            <Card className="border-2 border-green-100 hover:border-green-300 transition-all hover:shadow-lg">
              <CardContent className="p-6">
                <DollarSign className="h-12 w-12 text-green-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">Bulk Pricing</h3>
                <p className="text-gray-600">Special wholesale rates for landscapers with volume discounts and 20% off full truckload orders.</p>
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

          {/* Products Section with improved UI */}
          <div className="mb-16">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-4">Premium Products for Arizona Landscapers</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Specially formulated for Arizona's climate and soil conditions. Available in multiple packaging options with bulk delivery.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {products.map((product, index) => (
                <Card
                  key={index}
                  className="overflow-hidden hover:shadow-xl transition-all duration-300 border-gray-200 hover:border-green-200 cursor-pointer group"
                  onClick={() => setLocation(`/products/${product.id}`)}
                >
                  <div className="relative h-64 w-full overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute bottom-4 left-4 right-4 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                      <h2 className="text-2xl font-bold text-white mb-2">{product.title}</h2>
                      <div className="flex flex-wrap gap-2">
                        {product.bulkOptions.map((option, idx) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="bg-green-100 text-green-800 border border-green-300 transform scale-95 group-hover:scale-100 transition-transform duration-300"
                          >
                            {option}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <p className="text-gray-600 mb-4 line-clamp-3">{product.description}</p>
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                          <Star className="h-5 w-5 text-green-600" />
                          Key Benefits
                        </h3>
                        <ul className="list-disc list-inside space-y-1 text-gray-600">
                          {product.benefits.map((benefit, idx) => (
                            <li key={idx} className="transform translate-x-0 group-hover:translate-x-1 transition-transform duration-300">
                              {benefit}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="pt-4">
                        <div className="bg-green-50 p-4 rounded-lg transform translate-y-0 group-hover:-translate-y-1 transition-transform duration-300">
                          <p className="text-green-800 font-medium text-center">Click to view product details</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Testimonials Section */}
          <div className="bg-green-800 text-white rounded-2xl p-10 mb-16">
            <div className="text-center mb-10">
              <Badge className="bg-green-700 mb-4">Trusted by Landscapers Across Arizona</Badge>
              <h2 className="text-3xl font-bold mb-4">What Professionals Are Saying</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {testimonials.map((testimonial, index) => (
                <div key={index} className="bg-green-700/50 p-6 rounded-xl">
                  <p className="italic mb-4">"{testimonial.content}"</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold">{testimonial.name}</p>
                      <p className="text-green-200 text-sm">{testimonial.company}</p>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 text-green-300 mr-1" />
                      <span className="text-sm text-green-200">{testimonial.location}</span>
                    </div>
                  </div>
                </div>
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
