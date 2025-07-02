import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Leaf, Droplets, Shield, Heart, TreePine, Recycle, Award, Users, Zap, TrendingUp, CheckCircle, Star } from "lucide-react";

const WhyOrganic = () => {
  return (
    <section id="why-organic" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="bg-primary/10 p-4 rounded-full">
              <Leaf className="h-16 w-16 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl lg:text-5xl font-heading font-bold text-primary mb-6">
            Why Growing Organic is Better
          </h1>
          <p className="text-xl text-neutral-800 max-w-3xl mx-auto mb-8">
            Transform your growing operation with premium organic soil products that deliver superior results naturally.
          </p>
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            <div className="flex justify-center">
              <img
                src="healthy-soil-hands.jpg"
                alt="Rich organic soil in hands showing healthy texture"
                className="rounded-lg shadow-xl w-full h-auto"
              />
            </div>
            <div className="flex justify-center">
              <img
                src="nursery-blend.jpg"
                alt="Healthy plants growing in organic soil"
                className="rounded-lg shadow-xl w-full h-auto"
              />
            </div>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl text-center hover:shadow-lg transition-shadow">
            <div className="bg-green-500 p-3 rounded-full w-fit mx-auto mb-4">
              <Leaf className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-heading font-semibold text-green-700 mb-3">
              Superior Plant Health
            </h3>
            <p className="text-green-700 text-sm">
              Stronger roots, disease resistance, and healthier plants naturally.
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl text-center hover:shadow-lg transition-shadow">
            <div className="bg-blue-500 p-3 rounded-full w-fit mx-auto mb-4">
              <Droplets className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-heading font-semibold text-blue-700 mb-3">
              40% Less Water Needed
            </h3>
            <p className="text-blue-700 text-sm">
              Enhanced water retention prevents drought stress and reduces irrigation costs.
            </p>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-xl text-center hover:shadow-lg transition-shadow">
            <div className="bg-amber-500 p-3 rounded-full w-fit mx-auto mb-4">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-heading font-semibold text-amber-700 mb-3">
              OMRI Certified Safe
            </h3>
            <p className="text-amber-700 text-sm">
              Chemical-free growing protects people, plants, and the environment.
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl text-center hover:shadow-lg transition-shadow">
            <div className="bg-purple-500 p-3 rounded-full w-fit mx-auto mb-4">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-heading font-semibold text-purple-700 mb-3">
              Premium Market Prices
            </h3>
            <p className="text-purple-700 text-sm">
              Organic crops command higher prices with enhanced flavor and nutrition.
            </p>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-xl text-center hover:shadow-lg transition-shadow">
            <div className="bg-emerald-500 p-3 rounded-full w-fit mx-auto mb-4">
              <TreePine className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-heading font-semibold text-emerald-700 mb-3">
              Living Soil Ecosystem
            </h3>
            <p className="text-emerald-700 text-sm">
              Beneficial microorganisms create thriving soil that improves over time.
            </p>
          </div>

          <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-6 rounded-xl text-center hover:shadow-lg transition-shadow">
            <div className="bg-teal-500 p-3 rounded-full w-fit mx-auto mb-4">
              <Recycle className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-heading font-semibold text-teal-700 mb-3">
              Environmental Protection
            </h3>
            <p className="text-teal-700 text-sm">
              Sustainable practices protect groundwater and support biodiversity.
            </p>
          </div>
        </div>

        {/* Science Behind Organic */}
        <div className="bg-gradient-to-r from-primary/5 to-accent/5 p-8 rounded-xl mb-20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="bg-primary p-3 rounded-full">
                  <Zap className="h-8 w-8 text-white" />
                </div>
              </div>
              <h2 className="text-3xl font-heading font-bold text-primary mb-4">
                The Science Behind Organic Success
              </h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <img
                  src="worm-castings.jpg"
                  alt="Rich worm castings showing soil biology"
                  className="rounded-lg shadow-md w-full h-48 object-cover mb-4"
                />
                <h3 className="text-lg font-semibold text-primary mb-2 flex items-center justify-center gap-2">
                  <TreePine className="h-5 w-5" />
                  Living Soil Biology
                </h3>
                <p className="text-neutral-700 text-sm">
                  Billions of beneficial microorganisms create natural nutrient cycling and plant protection.
                </p>
              </div>
              
              <div className="text-center">
                <img
                  src="dairy-compost.jpg"
                  alt="Premium dairy compost texture"
                  className="rounded-lg shadow-md w-full h-48 object-cover mb-4"
                />
                <h3 className="text-lg font-semibold text-primary mb-2 flex items-center justify-center gap-2">
                  <Heart className="h-5 w-5" />
                  Superior Nutrition
                </h3>
                <p className="text-neutral-700 text-sm">
                  Organic crops contain higher antioxidants, vitamins, and minerals than conventional alternatives.
                </p>
              </div>

              <div className="text-center">
                <img
                  src="potting-soil.jpg"
                  alt="Premium organic potting soil blend"
                  className="rounded-lg shadow-md w-full h-48 object-cover mb-4"
                />
                <h3 className="text-lg font-semibold text-primary mb-2 flex items-center justify-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Proven Results
                </h3>
                <p className="text-neutral-700 text-sm">
                  Slow-release nutrients prevent burn while delivering consistent plant nutrition.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Target Audience Benefits */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-4">
              <div className="bg-accent p-3 rounded-full">
                <Users className="h-8 w-8 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-heading font-bold text-primary mb-4">
              Perfect for Every Growing Operation
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-md border hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <Leaf className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-primary">Commercial Nurseries</h3>
              </div>
              <p className="text-neutral-700 text-sm">
                Reduce plant loss by 30% with stronger root development and consistent growing conditions.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md border hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <Star className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-primary">Cannabis Cultivators</h3>
              </div>
              <p className="text-neutral-700 text-sm">
                Enhanced terpene profiles and cannabinoid production with OMRI-certified organic products.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md border hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-amber-100 p-2 rounded-lg">
                  <Award className="h-6 w-6 text-amber-600" />
                </div>
                <h3 className="text-lg font-semibold text-primary">Organic Farmers</h3>
              </div>
              <p className="text-neutral-700 text-sm">
                Meet certification standards while building long-term soil health and yield consistency.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md border hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Heart className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-primary">Home Gardeners</h3>
              </div>
              <p className="text-neutral-700 text-sm">
                Grow healthier vegetables and flowers while protecting your family from harmful chemicals.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md border hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-teal-100 p-2 rounded-lg">
                  <TreePine className="h-6 w-6 text-teal-600" />
                </div>
                <h3 className="text-lg font-semibold text-primary">Landscaping Pros</h3>
              </div>
              <p className="text-neutral-700 text-sm">
                Create stunning, low-maintenance landscapes with drought-resistant plantings.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md border hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-orange-100 p-2 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-primary">Fruit & Vegetable Growers</h3>
              </div>
              <p className="text-neutral-700 text-sm">
                Maximize flavor and nutrition while commanding premium market prices.
              </p>
            </div>
          </div>
        </div>

        {/* Water Conservation Focus */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-8 rounded-xl mb-20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="bg-blue-500 p-3 rounded-full">
                  <Droplets className="h-8 w-8 text-white" />
                </div>
              </div>
              <h2 className="text-3xl font-heading font-bold text-primary mb-4">
                Arizona Water Conservation
              </h2>
              <p className="text-neutral-800 max-w-3xl mx-auto">
                Essential for desert growing - our organic amendments dramatically improve water efficiency.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center bg-white p-6 rounded-lg shadow-sm">
                <div className="bg-blue-100 p-4 rounded-full w-fit mx-auto mb-4">
                  <div className="text-3xl font-bold text-blue-600">40%</div>
                </div>
                <h3 className="font-semibold text-primary mb-2">Less Water Needed</h3>
                <p className="text-sm text-neutral-700">Reduction in irrigation with organic amendments</p>
              </div>
              <div className="text-center bg-white p-6 rounded-lg shadow-sm">
                <div className="bg-cyan-100 p-4 rounded-full w-fit mx-auto mb-4">
                  <div className="text-3xl font-bold text-cyan-600">3x</div>
                </div>
                <h3 className="font-semibold text-primary mb-2">Better Retention</h3>
                <p className="text-sm text-neutral-700">Superior water holding capacity</p>
              </div>
              <div className="text-center bg-white p-6 rounded-lg shadow-sm">
                <div className="bg-teal-100 p-4 rounded-full w-fit mx-auto mb-4">
                  <div className="text-3xl font-bold text-teal-600">50%</div>
                </div>
                <h3 className="font-semibold text-primary mb-2">Drought Tolerance</h3>
                <p className="text-sm text-neutral-700">Extended drought resistance</p>
              </div>
            </div>
          </div>
        </div>

        {/* Our Commitment */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="bg-accent p-3 rounded-full">
              <Award className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-heading font-bold text-primary mb-6">
            Arizona's Premier Organic Soil Producer
          </h2>
          <p className="text-lg text-neutral-800 max-w-3xl mx-auto mb-8">
            One of Arizona's largest worm casting operations, producing the highest quality organic products.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl">
              <div className="flex items-center justify-center gap-3 mb-4">
                <img src="omri-logo.jpg" alt="OMRI Certified" className="h-12 w-auto" />
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-green-700 mb-2">OMRI Certified</h3>
              <p className="text-green-700 text-sm">
                Certified organic materials meeting strict standards for commercial and home use.
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl">
              <div className="flex items-center justify-center gap-3 mb-4">
                <img src="uscc-logo.jpg" alt="US Compost Council" className="h-12 w-auto" />
                <CheckCircle className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-blue-700 mb-2">US Compost Council</h3>
              <p className="text-blue-700 text-sm">
                Rigorous quality standards producing consistent, pathogen-free organic matter.
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action Sections */}
        <div className="space-y-8">
          {/* Primary CTA */}
          <div className="bg-primary text-white p-12 rounded-xl text-center">
            <h2 className="text-3xl font-heading font-bold mb-4">
              Ready to Experience Organic Growing Success?
            </h2>
            <p className="text-xl text-white/90 max-w-3xl mx-auto mb-8">
              Join thousands of growers who've discovered the superior results of organic growing with our 
              premium soil amendments, potting soils, and concentrated fertilizers.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/products">
                <Button size="lg" className="bg-white text-primary hover:bg-neutral-100 font-semibold">
                  Browse Our Products
                </Button>
              </Link>
              <Link href="/order">
                <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-primary font-semibold">
                  Place Your Order
                </Button>
              </Link>
            </div>
          </div>

          {/* Secondary CTA */}
          <div className="bg-neutral-50 p-12 rounded-xl text-center">
            <h2 className="text-3xl font-heading font-bold text-primary mb-4">
              Need Expert Growing Advice?
            </h2>
            <p className="text-lg text-neutral-800 max-w-3xl mx-auto mb-8">
              Our team of organic growing specialists is here to help you select the right products 
              and develop growing strategies tailored to your specific needs and climate conditions.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/contact">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-white font-semibold">
                  Contact Our Experts
                </Button>
              </Link>
              <Link href="/landscapers">
                <Button size="lg" variant="outline" className="text-primary border-2 border-primary hover:bg-primary/5 font-semibold">
                  Learn About Wholesale
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyOrganic;