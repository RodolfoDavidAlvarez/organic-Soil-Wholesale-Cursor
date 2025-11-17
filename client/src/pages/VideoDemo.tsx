import React, { useState } from "react";
import { VideoPlayer } from "@/components/VideoPlayer";
import { YouTubePlayer } from "@/components/YouTubePlayer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Youtube, FileVideo, Settings } from "lucide-react";

export default function VideoDemo() {
  const [selectedTab, setSelectedTab] = useState("self-hosted");

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Video Integration Demo</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">See both self-hosted and YouTube video options with optimal performance settings</p>
        </div>

        {/* Video Options Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="max-w-6xl mx-auto">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="self-hosted" className="flex items-center gap-2">
              <FileVideo className="h-4 w-4" />
              Self-Hosted Videos
            </TabsTrigger>
            <TabsTrigger value="youtube" className="flex items-center gap-2">
              <Youtube className="h-4 w-4" />
              YouTube Integration
            </TabsTrigger>
          </TabsList>

          {/* Self-Hosted Video Tab */}
          <TabsContent value="self-hosted" className="space-y-8">
            {/* Hero Video Example */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5 text-green-600" />
                  Hero Background Video
                </CardTitle>
                <p className="text-gray-600">Perfect for landing pages - auto-plays, muted, loops seamlessly</p>
              </CardHeader>
              <CardContent>
                <div className="relative h-64 md:h-96 bg-black rounded-lg overflow-hidden">
                  <VideoPlayer
                    src="/videos/hero-soil-demo.mp4"
                    poster="/images/hero-poster.jpg"
                    autoPlay={true}
                    muted={true}
                    loop={true}
                    controls={false}
                    className="absolute inset-0 w-full h-full"
                  />

                  {/* Content Overlay */}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="text-center text-white">
                      <h2 className="text-3xl font-bold mb-2">Premium Organic Soil</h2>
                      <p className="text-lg mb-4">Transform your garden today</p>
                      <Button className="bg-green-600 hover:bg-green-700">Shop Now</Button>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                  <h4 className="font-semibold mb-2">Optimization Settings:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Resolution: 1920x1080 (1080p)</li>
                    <li>• File Size: 5-10MB (15-30 seconds)</li>
                    <li>• Codec: H.264 with faststart</li>
                    <li>• Auto-play: Yes (muted for browser compliance)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Product Demo Video */}
            <Card>
              <CardHeader>
                <CardTitle>Product Demonstration</CardTitle>
                <p className="text-gray-600">Interactive video with custom controls for product showcases</p>
              </CardHeader>
              <CardContent>
                <VideoPlayer
                  src="/videos/product-demo.mp4"
                  poster="/images/product-poster.jpg"
                  autoPlay={false}
                  muted={false}
                  loop={false}
                  controls={true}
                  className="w-full aspect-video"
                />

                <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                  <h4 className="font-semibold mb-2">Optimization Settings:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Resolution: 1280x720 (720p)</li>
                    <li>• File Size: 10-25MB (1-3 minutes)</li>
                    <li>• Codec: H.264 with progressive download</li>
                    <li>• Preload: Metadata only</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* YouTube Integration Tab */}
          <TabsContent value="youtube" className="space-y-8">
            {/* YouTube Video Example */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Youtube className="h-5 w-5 text-red-600" />
                  YouTube Video Integration
                </CardTitle>
                <p className="text-gray-600">Easy integration with YouTube's powerful CDN and optimization</p>
              </CardHeader>
              <CardContent>
                <YouTubePlayer
                  videoId="dQw4w9WgXcQ" // Replace with your actual video ID
                  title="Organic Soil Tutorial"
                  autoPlay={false}
                  muted={false}
                  loop={false}
                  className="w-full aspect-video"
                />

                <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                  <h4 className="font-semibold mb-2">YouTube Benefits:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Free hosting and CDN</li>
                    <li>• Automatic optimization for all devices</li>
                    <li>• Built-in analytics and tracking</li>
                    <li>• Easy sharing and embedding</li>
                    <li>• No bandwidth costs</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* YouTube with Custom Settings */}
            <Card>
              <CardHeader>
                <CardTitle>YouTube with Custom Controls</CardTitle>
                <p className="text-gray-600">Advanced YouTube integration with custom start/end times</p>
              </CardHeader>
              <CardContent>
                <YouTubePlayer
                  videoId="dQw4w9WgXcQ" // Replace with your actual video ID
                  title="Soil Mixing Tutorial"
                  autoPlay={false}
                  muted={false}
                  loop={false}
                  start={30} // Start at 30 seconds
                  end={120} // End at 2 minutes
                  className="w-full aspect-video"
                />

                <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                  <h4 className="font-semibold mb-2">Custom Features:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Start/End time control</li>
                    <li>• Loop functionality</li>
                    <li>• Auto-play options</li>
                    <li>• Mute control</li>
                    <li>• Fullscreen support</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Implementation Guide */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Implementation Guide
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Self-Hosted Videos</h4>
                <div className="space-y-2 text-sm">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <strong>Pros:</strong>
                    <ul className="mt-1 space-y-1 text-gray-600">
                      <li>• Complete control</li>
                      <li>• Custom branding</li>
                      <li>• Better analytics</li>
                      <li>• No external dependencies</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg">
                    <strong>Cons:</strong>
                    <ul className="mt-1 space-y-1 text-gray-600">
                      <li>• Higher hosting costs</li>
                      <li>• File management</li>
                      <li>• Bandwidth usage</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">YouTube Integration</h4>
                <div className="space-y-2 text-sm">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <strong>Pros:</strong>
                    <ul className="mt-1 space-y-1 text-gray-600">
                      <li>• Free hosting</li>
                      <li>• Automatic optimization</li>
                      <li>• Built-in analytics</li>
                      <li>• Easy management</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg">
                    <strong>Cons:</strong>
                    <ul className="mt-1 space-y-1 text-gray-600">
                      <li>• Less control</li>
                      <li>• YouTube branding</li>
                      <li>• External dependency</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold mb-2">Recommendation:</h4>
              <p className="text-sm text-gray-700">
                For your Organic Soil Wholesale website, I recommend using <strong>YouTube integration</strong> for most videos (tutorials, demos,
                testimonials) and <strong>self-hosted videos</strong> for critical hero/background videos where you need complete control and custom
                branding.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}




