import React from "react";
import { GrokChat } from "../components/GrokChat";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Leaf, Users, Package, MessageCircle } from "lucide-react";

export default function GrokAssistant() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Grok AI Assistant</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get instant help with soil recommendations, gardening advice, wholesale inquiries, and more!
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
                <Leaf className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-lg">Soil & Plant Advice</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center">Get expert recommendations for soil types, plant care, and organic growing solutions.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-lg">Wholesale Support</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center">Information about bulk pricing, delivery options, and wholesale account setup.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-2">
                <Package className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle className="text-lg">Product Guidance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center">Learn about our organic soil products and find the perfect match for your needs.</p>
            </CardContent>
          </Card>
        </div>

        {/* Chat Interface */}
        <GrokChat
          placeholder="Ask me about soil recommendations, gardening tips, wholesale pricing, or anything else related to organic soil and gardening..."
          context="Comprehensive assistance for Organic Soil Wholesale customers including product recommendations, gardening advice, and wholesale information"
        />

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4 text-center">Quick Questions</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              "What soil do I need for tomatoes?",
              "Do you offer wholesale pricing?",
              "How much soil for a 4x8 raised bed?",
              "What's the difference between compost and potting soil?",
            ].map((question, index) => (
              <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4 text-center">
                  <MessageCircle className="h-5 w-5 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-700">{question}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
