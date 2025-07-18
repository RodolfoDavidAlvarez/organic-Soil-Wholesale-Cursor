import { useState, useEffect } from "react";
import { MapPin, Search, Phone, Clock, Package, Navigation, Globe, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import MapErrorBoundary from "@/components/MapErrorBoundary";

// Fix for default markers in React-Leaflet
const iconUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png";
const iconRetinaUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png";
const shadowUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: iconUrl,
  iconRetinaUrl: iconRetinaUrl,
  shadowUrl: shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom marker for selected store
const selectedIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Store locations data
const storeLocations = [
  {
    id: 1,
    name: "Soil Seed and Water Distribution Center",
    address: "1634 N 19th Ave, Phoenix, AZ 85009",
    lat: 33.4675,
    lng: -112.1000,
    website: "https://www.soilseedandwater.com",
    products: ["Dairy Compost", "Mulch", "Worm Castings", "Seasonal Products"],
    features: ["Distribution Center", "Bulk Orders", "Wholesale Pricing"],
  },
  {
    id: 2,
    name: "Soil Seed and Water Manufacturing Plant",
    address: "8980 Stanton Rd, Congress, AZ 85332",
    lat: 34.1608,
    lng: -112.8515,
    website: "https://www.soilseedandwater.com",
    products: ["Dairy Compost", "Mulch", "Worm Castings", "Seasonal Products"],
    features: ["Manufacturing Plant", "Bulk Production", "Direct from Source"],
  },
  {
    id: 3,
    name: "Flower of the Gods Nursery",
    address: "34844 W Cocopah St, Tonopah, AZ 85354",
    lat: 33.4774,
    lng: -112.9404,
    website: "https://www.flowerofthegodsaz.com/",
    products: ["Dairy Compost", "Mulch", "Worm Castings", "Seasonal Products"],
    features: ["Nursery", "Retail", "Expert Advice", "Plant Selection"],
  },
  {
    id: 4,
    name: "Mountain Country Landscaping",
    address: "1623 Shoup St, Prescott, AZ 86305",
    lat: 34.5400,
    lng: -112.4685,
    website: "https://www.mountaincountrylandscaping.com/",
    products: ["Dairy Compost", "Mulch", "Worm Castings", "Seasonal Products"],
    features: ["Landscaping Services", "Professional Grade", "Contractor Pricing"],
  },
  {
    id: 5,
    name: "David Landscaping",
    address: "11384 S Cardinal Ln, Yuma, AZ 85365",
    lat: 32.7253,
    lng: -114.6241,
    products: ["Mulch", "Turf Daddy"],
    features: ["Landscaping Services", "Turf Specialists", "Local Delivery"],
  }
];

// Component to handle map centering
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  
  useEffect(() => {
    if (map) {
      try {
        map.setView(center, zoom);
      } catch (error) {
        console.error('Error setting map view:', error);
      }
    }
  }, [center, zoom, map]);
  
  return null;
}

const StoreLocator = () => {
  const [searchZip, setSearchZip] = useState("");
  const [selectedStore, setSelectedStore] = useState<typeof storeLocations[0] | null>(null);
  const [searchResults, setSearchResults] = useState(storeLocations);
  const [mapCenter, setMapCenter] = useState<[number, number]>([33.5, -112.5]); // Arizona center
  const [mapZoom, setMapZoom] = useState(7);

  const handleZipSearch = async () => {
    if (searchZip) {
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
        setMapCenter([coords.lat, coords.lng]);
        setMapZoom(12);
      } else {
        setSearchResults(storeLocations);
      }
    } else {
      setSearchResults(storeLocations);
      setMapCenter([33.5, -112.5]);
      setMapZoom(7);
    }
  };

  const handleStoreSelect = (store: typeof storeLocations[0]) => {
    setSelectedStore(store);
    setMapCenter([store.lat, store.lng]);
    setMapZoom(14);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-24">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
            Find Our Products Near You
          </h1>
          <p className="text-lg text-foreground/60 max-w-2xl mx-auto">
            Discover authorized retailers and distributors carrying premium Organic Soil Wholesale products across Arizona
          </p>
        </div>

        {/* ZIP Code Search */}
        <div className="max-w-md mx-auto mb-12">
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

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Interactive Map */}
          <MapErrorBoundary>
            <Card className="h-[600px] overflow-hidden">
              <div style={{ height: "100%", width: "100%" }}>
                <MapContainer
                  center={mapCenter}
                  zoom={mapZoom}
                  style={{ height: "100%", width: "100%" }}
                  className="rounded-lg"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <MapController center={mapCenter} zoom={mapZoom} />
                  {searchResults.map((store) => (
                    <Marker
                      key={store.id}
                      position={[store.lat, store.lng]}
                      icon={selectedStore?.id === store.id ? selectedIcon : DefaultIcon}
                      eventHandlers={{
                        click: () => handleStoreSelect(store),
                      }}
                    >
                      <Popup>
                        <div className="p-2">
                          <h3 className="font-semibold">{store.name}</h3>
                          <p className="text-sm">{store.address}</p>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            </Card>
          </MapErrorBoundary>

          {/* Store List */}
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
                  className={`cursor-pointer transition-all ${
                    selectedStore?.id === store.id ? "ring-2 ring-primary shadow-lg" : "hover:shadow-lg"
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
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {store.website && (
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
                      <div className="flex items-center gap-2 text-sm">
                        <Package className="h-4 w-4 text-foreground/60" />
                        <span className="text-sm">{store.products.join(", ")}</span>
                      </div>
                      
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
                  <p className="text-sm text-foreground/60 mb-2">Visit Website:</p>
                  {selectedStore.website ? (
                    <Button
                      variant="outline"
                      onClick={() => window.open(selectedStore.website.startsWith('http') ? selectedStore.website : `https://${selectedStore.website}`, '_blank')}
                    >
                      Visit Store Website
                    </Button>
                  ) : (
                    <p className="text-sm text-foreground/60">No website available</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default StoreLocator;