import { useState, useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapPin, Search, Phone, Clock, Package, Navigation, Camera, Star, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Using Mapbox public token - for production, get your own at https://www.mapbox.com/
mapboxgl.accessToken = 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw';

// Store locations data with images
const storeLocations = [
  {
    id: 1,
    name: "Soil Seed and Water Distribution Center",
    address: "1634 N 19th Ave, Phoenix, AZ 85009",
    phone: "(602) 555-0101", // You can update with real phone
    hours: "Mon-Fri 7AM-5PM, Sat 8AM-2PM",
    lat: 33.4675,
    lng: -112.1000,
    website: "https://www.soilseedandwater.com",
    // image: "/store-soil-seed-water.jpg", // Add your image here when available
    products: ["Dairy Compost", "Mulch", "Worm Castings", "Seasonal Products"],
    features: ["Distribution Center", "Bulk Orders", "Wholesale Pricing"],
    rating: 4.9,
    inStock: {
      "Plant Pal": true,
      "Dairy Compost": true,
      "Mulch": true,
      "Worm Castings": true
    }
  },
  {
    id: 2,
    name: "Soil Seed and Water Manufacturing Plant",
    address: "8980 Stanton Rd, Congress, AZ 85332",
    phone: "(928) 555-0102", // You can update with real phone
    hours: "By appointment only",
    lat: 34.1608,
    lng: -112.8515,
    website: "https://www.soilseedandwater.com",
    // image: "/store-manufacturing.jpg", // Add your image here when available
    products: ["Dairy Compost", "Mulch", "Worm Castings", "Seasonal Products"],
    features: ["Manufacturing Plant", "Bulk Production", "Direct from Source"],
    rating: 4.8,
    inStock: {
      "All Products": true
    }
  },
  {
    id: 3,
    name: "Flower of the Gods Nursery",
    address: "34844 W Cocopah St, Tonopah, AZ 85354",
    phone: "(623) 555-0103", // You can update with real phone
    hours: "Mon-Sat 8AM-5PM, Sun 10AM-3PM",
    lat: 33.4774,
    lng: -112.9404,
    website: "https://www.flowerofthegodsaz.com/",
    // image: "/store-flower-gods.jpg", // Add your image here when available
    products: ["Dairy Compost", "Mulch", "Worm Castings", "Seasonal Products"],
    features: ["Nursery", "Retail", "Expert Advice", "Plant Selection"],
    rating: 4.7,
    inStock: {
      "Dairy Compost": true,
      "Mulch": true,
      "Worm Castings": true,
      "Plant Pal": true
    }
  },
  {
    id: 4,
    name: "Mountain Country Landscaping",
    address: "1623 Shoup St, Prescott, AZ 86305",
    phone: "(928) 555-0104", // You can update with real phone
    hours: "Mon-Fri 7AM-4PM",
    lat: 34.5400,
    lng: -112.4685,
    website: "https://www.mountaincountrylandscaping.com/",
    // image: "/store-mountain-country.jpg", // Add your image here when available
    products: ["Dairy Compost", "Mulch", "Worm Castings", "Seasonal Products"],
    features: ["Landscaping Services", "Professional Grade", "Contractor Pricing"],
    rating: 4.8,
    inStock: {
      "Dairy Compost": true,
      "Mulch": true,
      "Worm Castings": true,
      "Seasonal Products": true
    }
  },
  {
    id: 5,
    name: "David Landscaping",
    address: "11384 S Cardinal Ln, Yuma, AZ 85365",
    phone: "(928) 555-0105", // You can update with real phone
    hours: "Mon-Fri 6AM-4PM",
    lat: 32.7253,
    lng: -114.6241,
    website: "#", // No website listed
    // image: "/store-david-landscaping.jpg", // Add your image here when available
    products: ["Mulch", "Turf Daddy"],
    features: ["Landscaping Services", "Turf Specialists", "Local Delivery"],
    rating: 4.6,
    inStock: {
      "Mulch": true,
      "Turf Daddy": true
    }
  }
];

const StoreLocatorMapbox = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [searchZip, setSearchZip] = useState("");
  const [selectedStore, setSelectedStore] = useState<typeof storeLocations[0] | null>(null);
  const [searchResults, setSearchResults] = useState(storeLocations);
  const [mapStyle, setMapStyle] = useState("mapbox://styles/mapbox/streets-v12");

  useEffect(() => {
    if (!map.current && mapContainer.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: mapStyle,
        center: [-112.5, 33.5], // Arizona center to show all locations
        zoom: 7,
        pitch: 45, // 3D tilt
        bearing: -17.6, // Rotation
        antialias: true
      });

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      
      // Add 3D buildings
      map.current.on('load', () => {
        if (!map.current) return;
        
        const layers = map.current.getStyle().layers;
        const labelLayerId = layers?.find(
          (layer) => layer.type === 'symbol' && layer.layout?.['text-field']
        )?.id;

        map.current.addLayer(
          {
            'id': 'add-3d-buildings',
            'source': 'composite',
            'source-layer': 'building',
            'filter': ['==', 'extrude', 'true'],
            'type': 'fill-extrusion',
            'minzoom': 15,
            'paint': {
              'fill-extrusion-color': '#aaa',
              'fill-extrusion-height': [
                'interpolate',
                ['linear'],
                ['zoom'],
                15,
                0,
                15.05,
                ['get', 'height']
              ],
              'fill-extrusion-base': [
                'interpolate',
                ['linear'],
                ['zoom'],
                15,
                0,
                15.05,
                ['get', 'min_height']
              ],
              'fill-extrusion-opacity': 0.6
            }
          },
          labelLayerId
        );
      });

      // Add markers for stores
      addMarkers();
    }

    return () => {
      map.current?.remove();
    };
  }, []);

  const addMarkers = () => {
    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    searchResults.forEach((store) => {
      // Create custom marker element
      const el = document.createElement('div');
      el.className = 'custom-marker';
      el.style.width = '40px';
      el.style.height = '40px';
      el.innerHTML = `
        <div style="
          width: 40px;
          height: 40px;
          background: ${selectedStore?.id === store.id ? '#10b981' : '#3b82f6'};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          cursor: pointer;
          transition: all 0.3s ease;
        ">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
            <circle cx="12" cy="9" r="2.5" fill="${selectedStore?.id === store.id ? '#10b981' : '#3b82f6'}"/>
          </svg>
        </div>
      `;

      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.1)';
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
      });

      const marker = new mapboxgl.Marker(el)
        .setLngLat([store.lng, store.lat])
        .addTo(map.current!);

      // Add popup
      const popup = new mapboxgl.Popup({ offset: 25 })
        .setHTML(`
          <div style="padding: 10px; min-width: 200px;">
            <h3 style="font-weight: 600; margin-bottom: 5px;">${store.name}</h3>
            <p style="font-size: 14px; color: #666; margin-bottom: 5px;">${store.address}</p>
            <p style="font-size: 14px; color: #666;">${store.phone}</p>
            ${store.rating ? `<div style="display: flex; align-items: center; gap: 5px; margin-top: 8px;">
              <span style="color: #fbbf24;">★</span>
              <span style="font-size: 14px; font-weight: 500;">${store.rating}</span>
            </div>` : ''}
          </div>
        `);

      marker.setPopup(popup);

      el.addEventListener('click', () => {
        handleStoreSelect(store);
      });

      markers.current.push(marker);
    });
  };

  useEffect(() => {
    if (map.current) {
      addMarkers();
    }
  }, [searchResults, selectedStore]);

  const handleZipSearch = async () => {
    // Simple distance calculation based on coordinates
    if (searchZip) {
      // Mock ZIP to coordinate mapping (in production, use geocoding API)
      const zipCoords: { [key: string]: { lat: number; lng: number } } = {
        "85009": { lat: 33.4675, lng: -112.1000 }, // Phoenix
        "85008": { lat: 33.4592, lng: -112.0885 },
        "85332": { lat: 34.1608, lng: -112.8515 }, // Congress
        "85354": { lat: 33.4774, lng: -112.9404 }, // Tonopah
        "86305": { lat: 34.5400, lng: -112.4685 }, // Prescott
        "85365": { lat: 32.7253, lng: -114.6241 }, // Yuma
        "85251": { lat: 33.4942, lng: -111.9261 },
        "85281": { lat: 33.4255, lng: -111.9400 }
      };

      const coords = zipCoords[searchZip];
      if (coords) {
        // Find stores within ~10 miles
        const nearbyStores = storeLocations.filter(store => {
          const distance = Math.sqrt(
            Math.pow(store.lat - coords.lat, 2) + Math.pow(store.lng - coords.lng, 2)
          );
          return distance < 0.15; // Roughly 10 miles
        });
        
        setSearchResults(nearbyStores.length > 0 ? nearbyStores : storeLocations);
        
        // Fly to location
        map.current?.flyTo({
          center: [coords.lng, coords.lat],
          zoom: 12,
          pitch: 45,
          bearing: 0,
          duration: 2000
        });
      } else {
        // Show all stores if ZIP not found
        setSearchResults(storeLocations);
      }
    } else {
      setSearchResults(storeLocations);
      map.current?.flyTo({
        center: [-112.5, 33.5],
        zoom: 7,
        pitch: 45,
        bearing: -17.6,
        duration: 2000
      });
    }
  };

  const handleStoreSelect = (store: typeof storeLocations[0]) => {
    setSelectedStore(store);
    map.current?.flyTo({
      center: [store.lng, store.lat],
      zoom: 16,
      pitch: 60,
      bearing: 40,
      duration: 2000
    });
  };

  const mapStyles = [
    { name: "Streets", style: "mapbox://styles/mapbox/streets-v12" },
    { name: "Satellite", style: "mapbox://styles/mapbox/satellite-streets-v12" },
    { name: "Dark", style: "mapbox://styles/mapbox/dark-v11" },
    { name: "Light", style: "mapbox://styles/mapbox/light-v11" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-24">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
            Find Our Products Near You
          </h1>
          <p className="text-lg text-foreground/60 max-w-2xl mx-auto">
            Discover authorized retailers and distributors carrying premium Organic Soil Wholesale products in your area
          </p>
        </div>

        {/* ZIP Code Search */}
        <div className="max-w-md mx-auto mb-8">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Enter ZIP code (e.g., 85009)"
              value={searchZip}
              onChange={(e) => setSearchZip(e.target.value)}
              className="flex-1"
              onKeyPress={(e) => e.key === 'Enter' && handleZipSearch()}
            />
            <Button onClick={handleZipSearch} className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Search
            </Button>
          </div>
          <p className="text-sm text-foreground/60 mt-2 text-center">
            Try: 85009, 85332, 85354, 86305, or 85365
          </p>
        </div>

        {/* Map Style Selector */}
        <div className="flex justify-center gap-2 mb-6">
          {mapStyles.map((style) => (
            <Button
              key={style.name}
              variant={mapStyle === style.style ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setMapStyle(style.style);
                map.current?.setStyle(style.style);
              }}
            >
              {style.name}
            </Button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Beautiful Interactive Map */}
          <div>
            <Card className="overflow-hidden">
              <div 
                ref={mapContainer} 
                className="h-[600px] w-full rounded-lg"
                style={{ position: 'relative' }}
              />
            </Card>
          </div>

          {/* Store List with Images */}
          <div className="space-y-4 overflow-y-auto max-h-[600px] pr-2">
            {searchResults.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <MapPin className="h-12 w-12 text-foreground/20 mx-auto mb-4" />
                  <p className="text-foreground/60">No stores found in this area</p>
                </CardContent>
              </Card>
            ) : (
              searchResults.map((store) => (
                <Card
                  key={store.id}
                  className={`cursor-pointer transition-all overflow-hidden ${
                    selectedStore?.id === store.id ? "ring-2 ring-primary shadow-xl" : "hover:shadow-lg"
                  }`}
                  onClick={() => handleStoreSelect(store)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{store.name}</CardTitle>
                        <CardDescription className="mt-1">{store.address}</CardDescription>
                      </div>
                      <MapPin className={`h-5 w-5 ${selectedStore?.id === store.id ? 'text-green-500' : 'text-primary'}`} />
                    </div>
                    {store.rating && (
                      <div className="flex items-center gap-1 mt-2">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{store.rating}</span>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-foreground/60" />
                        <span>{store.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-foreground/60" />
                        <span>{store.hours}</span>
                      </div>
                      {store.website && store.website !== "#" && (
                        <div className="flex items-center gap-2 text-sm">
                          <Globe className="h-4 w-4 text-foreground/60" />
                          <a 
                            href={store.website.startsWith('http') ? store.website : `https://${store.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Visit Website
                          </a>
                        </div>
                      )}
                      
                      {/* Store Features */}
                      {store.features && (
                        <div className="flex flex-wrap gap-2 pt-2">
                          {store.features.map((feature) => (
                            <Badge key={feature} variant="secondary" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      {/* Product Availability */}
                      <div className="pt-3 border-t">
                        <p className="text-sm font-medium mb-2">Products in Stock:</p>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(store.inStock).map(([product, available]) => (
                            <span
                              key={product}
                              className={`text-xs px-2 py-1 rounded-full ${
                                available
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                  : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
                              }`}
                            >
                              {product}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Selected Store Details */}
        {selectedStore && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Navigation className="h-5 w-5 text-primary" />
                Get Directions to {selectedStore.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-foreground/60 mb-2">Full Address:</p>
                  <p className="font-medium mb-4">{selectedStore.address}</p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => window.open(`https://maps.google.com/?q=${selectedStore.address}`, '_blank')}
                      className="flex-1 md:flex-initial"
                    >
                      Open in Google Maps
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => window.open(`https://maps.apple.com/?q=${selectedStore.address}`, '_blank')}
                      className="flex-1 md:flex-initial"
                    >
                      Open in Apple Maps
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-foreground/60 mb-2">Contact Information:</p>
                  <p className="font-medium">{selectedStore.phone}</p>
                  <p className="text-sm text-foreground/60 mt-2">{selectedStore.hours}</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => window.location.href = `tel:${selectedStore.phone.replace(/[^0-9]/g, '')}`}
                  >
                    Call Store
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default StoreLocatorMapbox;