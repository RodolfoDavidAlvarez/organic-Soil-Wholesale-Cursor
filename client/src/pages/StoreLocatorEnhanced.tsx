import { useState, useEffect, useRef } from "react";
import { MapPin, Search, Phone, Clock, Package, Navigation, Globe, Star, Car, Route, X, Locate, Truck, Store, Factory, Trees } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from "react-leaflet";
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

// Custom marker for user location
const userIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
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
    type: "distribution",
    icon: Store
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
    type: "manufacturing",
    icon: Factory
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
    type: "nursery",
    icon: Trees
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
    type: "landscaping",
    icon: Trees
  },
  {
    id: 5,
    name: "David Landscaping",
    address: "11384 S Cardinal Ln, Yuma, AZ 85365",
    lat: 32.7253,
    lng: -114.6241,
    products: ["Mulch", "Turf Daddy"],
    features: ["Landscaping Services", "Turf Specialists", "Local Delivery"],
    type: "landscaping",
    icon: Trees
  }
];

// Calculate distance between two points (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Radius of the Earth in miles
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Component to handle map centering and route display
function MapController({ center, zoom, route, userLocation, nearestStore }: { 
  center: [number, number]; 
  zoom: number;
  route: [number, number][] | null;
  userLocation: { lat: number; lng: number } | null;
  nearestStore: typeof storeLocations[0] | null;
}) {
  const map = useMap();
  
  useEffect(() => {
    if (map) {
      try {
        map.setView(center, zoom);
        
        // If we have both user location and nearest store, fit bounds to show both
        if (userLocation && nearestStore) {
          const bounds = L.latLngBounds([
            [userLocation.lat, userLocation.lng],
            [nearestStore.lat, nearestStore.lng]
          ]);
          map.fitBounds(bounds, { padding: [50, 50] });
        }
      } catch (error) {
        console.error('Error setting map view:', error);
      }
    }
  }, [center, zoom, map, userLocation, nearestStore]);
  
  return null;
}

const StoreLocatorEnhanced = () => {
  const [searchZip, setSearchZip] = useState("");
  const [selectedStore, setSelectedStore] = useState<typeof storeLocations[0] | null>(null);
  const [nearestStore, setNearestStore] = useState<typeof storeLocations[0] | null>(null);
  const [searchResults, setSearchResults] = useState(storeLocations);
  const [mapCenter, setMapCenter] = useState<[number, number]>([33.5, -112.5]); // Arizona center
  const [mapZoom, setMapZoom] = useState(7);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [route, setRoute] = useState<[number, number][] | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [geolocating, setGeolocating] = useState(false);

  // Fetch route using OpenRouteService (free API)
  const fetchRoute = async (startLat: number, startLng: number, endLat: number, endLng: number) => {
    try {
      // Using OSRM (Open Source Routing Machine) demo server - for production, you should host your own
      const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const coordinates = route.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
        setRoute(coordinates);
        
        // Calculate distance and duration
        const distanceMiles = (route.distance * 0.000621371).toFixed(1); // meters to miles
        const durationMinutes = Math.round(route.duration / 60); // seconds to minutes
        const hours = Math.floor(durationMinutes / 60);
        const minutes = durationMinutes % 60;
        const durationText = hours > 0 ? `${hours}h ${minutes}min` : `${minutes} min`;
        
        setRouteInfo({
          distance: `${distanceMiles} miles`,
          duration: durationText
        });
      }
    } catch (error) {
      console.error('Error fetching route:', error);
      // Fallback to straight-line distance calculation
      const distance = calculateDistance(startLat, startLng, endLat, endLng);
      const estimatedTime = Math.round(distance * 1.5); // Rough estimate: 1.5 minutes per mile
      const hours = Math.floor(estimatedTime / 60);
      const minutes = estimatedTime % 60;
      const durationText = hours > 0 ? `${hours}h ${minutes}min` : `${minutes} min`;
      
      setRouteInfo({
        distance: `${distance.toFixed(1)} miles (straight-line)`,
        duration: `~${durationText} (estimated)`
      });
    }
  };

  // Get user's current location
  const getCurrentLocation = () => {
    setGeolocating(true);
    setError(null);
    
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setGeolocating(false);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        setUserLocation(coords);
        setSearchZip("Current Location");
        
        // Find the nearest store
        let minDistance = Infinity;
        let nearest = storeLocations[0];
        
        storeLocations.forEach(store => {
          const distance = calculateDistance(coords.lat, coords.lng, store.lat, store.lng);
          if (distance < minDistance) {
            minDistance = distance;
            nearest = store;
          }
        });
        
        setNearestStore(nearest);
        setSelectedStore(nearest);
        setSearchResults([nearest]);
        
        // Fetch route to nearest store
        await fetchRoute(coords.lat, coords.lng, nearest.lat, nearest.lng);
        
        setMapCenter([coords.lat, coords.lng]);
        setMapZoom(10);
        setGeolocating(false);
      },
      (error) => {
        setGeolocating(false);
        switch(error.code) {
          case error.PERMISSION_DENIED:
            setError("Location permission denied. Please enable location services and try again.");
            break;
          case error.POSITION_UNAVAILABLE:
            setError("Location information is unavailable.");
            break;
          case error.TIMEOUT:
            setError("Location request timed out.");
            break;
          default:
            setError("An unknown error occurred while getting your location.");
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleZipSearch = async () => {
    setLoading(true);
    setError(null);
    setRoute(null);
    setRouteInfo(null);
    
    if (searchZip && searchZip !== "Current Location") {
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
        setUserLocation(coords);
        
        // Find the nearest store
        let minDistance = Infinity;
        let nearest = storeLocations[0];
        
        storeLocations.forEach(store => {
          const distance = calculateDistance(coords.lat, coords.lng, store.lat, store.lng);
          if (distance < minDistance) {
            minDistance = distance;
            nearest = store;
          }
        });
        
        setNearestStore(nearest);
        setSelectedStore(nearest);
        setSearchResults([nearest]); // Show only the nearest store
        
        // Fetch route to nearest store
        await fetchRoute(coords.lat, coords.lng, nearest.lat, nearest.lng);
        
        setMapCenter([coords.lat, coords.lng]);
        setMapZoom(10);
      } else {
        setError("ZIP code not found. Please try: 85009, 85332, 85354, 86305, or 85365");
        setSearchResults(storeLocations);
      }
    } else {
      setSearchResults(storeLocations);
      setUserLocation(null);
      setNearestStore(null);
      setMapCenter([33.5, -112.5]);
      setMapZoom(7);
    }
    
    setLoading(false);
  };

  const handleStoreSelect = async (store: typeof storeLocations[0]) => {
    setSelectedStore(store);
    
    // If we have a user location, calculate route to this store
    if (userLocation) {
      setLoading(true);
      await fetchRoute(userLocation.lat, userLocation.lng, store.lat, store.lng);
      setLoading(false);
    } else {
      setMapCenter([store.lat, store.lng]);
      setMapZoom(14);
    }
  };

  const clearSearch = () => {
    setSearchZip("");
    setUserLocation(null);
    setNearestStore(null);
    setSelectedStore(null);
    setRoute(null);
    setRouteInfo(null);
    setSearchResults(storeLocations);
    setMapCenter([33.5, -112.5]);
    setMapZoom(7);
  };

  const getStoreTypeColor = (type: string) => {
    switch(type) {
      case 'distribution': return 'bg-blue-500';
      case 'manufacturing': return 'bg-purple-500';
      case 'nursery': return 'bg-green-500';
      case 'landscaping': return 'bg-amber-500';
      default: return 'bg-gray-500';
    }
  };

  const getStoreTypeBadgeColor = (type: string) => {
    switch(type) {
      case 'distribution': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'manufacturing': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'nursery': return 'bg-green-100 text-green-700 border-green-200';
      case 'landscaping': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-24">
        {/* Header Section with Enhanced Design */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-green-100 dark:bg-green-900/30 rounded-full">
            <MapPin className="h-5 w-5 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-green-800 dark:text-green-300">Store Locator</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-foreground mb-4 bg-gradient-to-r from-green-600 to-green-800 dark:from-green-400 dark:to-green-600 bg-clip-text text-transparent">
            Find Our Products Near You
          </h1>
          <p className="text-lg text-foreground/60 max-w-2xl mx-auto">
            Use your current location or enter a ZIP code to find the nearest store with driving directions
          </p>
        </div>

        {/* Enhanced Search Section */}
        <div className="max-w-2xl mx-auto mb-8">
          <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex gap-3 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Enter ZIP code (e.g., 85009)"
                    value={searchZip === "Current Location" ? "📍 Current Location" : searchZip}
                    onChange={(e) => setSearchZip(e.target.value)}
                    className="pl-10 h-12 text-lg"
                    onKeyPress={(e) => e.key === 'Enter' && handleZipSearch()}
                    disabled={geolocating}
                  />
                </div>
                <Button 
                  onClick={handleZipSearch} 
                  className="h-12 px-6 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg"
                  disabled={loading || geolocating}
                >
                  {loading ? "Searching..." : "Search"}
                </Button>
                {userLocation && (
                  <Button 
                    onClick={clearSearch}
                    variant="outline"
                    size="icon"
                    className="h-12 w-12"
                    title="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
                <span className="text-xs text-muted-foreground px-2 font-medium">OR</span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
              </div>
              
              <Button
                onClick={getCurrentLocation}
                variant="outline"
                className="w-full mt-4 h-12 text-base font-medium border-2 hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-900/20"
                disabled={geolocating}
              >
                <Locate className={`h-5 w-5 mr-2 ${geolocating ? 'animate-pulse' : ''}`} />
                {geolocating ? "Getting your location..." : "Use My Current Location"}
              </Button>
            </CardContent>
          </Card>
          
          <p className="text-sm text-foreground/60 mt-4 text-center">
            Available ZIP codes: 85009, 85332, 85354, 86305, or 85365
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="max-w-md mx-auto mb-6 border-red-200 bg-red-50 dark:bg-red-900/20">
            <AlertDescription className="text-red-800 dark:text-red-200">{error}</AlertDescription>
          </Alert>
        )}

        {/* Route Info Card with Enhanced Design */}
        {routeInfo && nearestStore && (
          <Card className="max-w-4xl mx-auto mb-8 shadow-xl border-0 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl flex items-center gap-3">
                <div className={`p-2 rounded-full ${getStoreTypeColor(nearestStore.type)} bg-opacity-20`}>
                  <Route className={`h-6 w-6 ${getStoreTypeColor(nearestStore.type).replace('bg-', 'text-')}`} />
                </div>
                <span>Nearest Store: {nearestStore.name}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
                  <Car className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                  <p className="text-sm text-foreground/60">Distance</p>
                  <p className="font-bold text-xl">{routeInfo.distance}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p className="text-sm text-foreground/60">Driving Time</p>
                  <p className="font-bold text-xl">{routeInfo.duration}</p>
                </div>
                <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
                  <MapPin className="h-8 w-8 mx-auto mb-2 text-red-500" />
                  <p className="text-sm text-foreground/60">Address</p>
                  <p className="font-semibold">{nearestStore.address}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Enhanced Map Card */}
          <div className="lg:col-span-2">
            <MapErrorBoundary>
              <Card className="h-[700px] overflow-hidden shadow-2xl border-0">
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
                    <MapController 
                      center={mapCenter} 
                      zoom={mapZoom} 
                      route={route}
                      userLocation={userLocation}
                      nearestStore={nearestStore}
                    />
                    
                    {/* User Location Marker */}
                    {userLocation && (
                      <Marker
                        position={[userLocation.lat, userLocation.lng]}
                        icon={userIcon}
                      >
                        <Popup>
                          <div className="p-2">
                            <h3 className="font-semibold flex items-center gap-2">
                              <Locate className="h-4 w-4" />
                              Your Location
                            </h3>
                            <p className="text-sm">{searchZip === "Current Location" ? "Current Location" : `ZIP: ${searchZip}`}</p>
                          </div>
                        </Popup>
                      </Marker>
                    )}
                    
                    {/* Route Polyline */}
                    {route && (
                      <Polyline 
                        positions={route} 
                        color="#10b981" 
                        weight={5}
                        opacity={0.8}
                      />
                    )}
                    
                    {/* Store Markers */}
                    {searchResults.map((store) => (
                      <Marker
                        key={store.id}
                        position={[store.lat, store.lng]}
                        icon={selectedStore?.id === store.id || nearestStore?.id === store.id ? selectedIcon : DefaultIcon}
                        eventHandlers={{
                          click: () => handleStoreSelect(store),
                        }}
                      >
                        <Popup>
                          <div className="p-2">
                            <h3 className="font-semibold">{store.name}</h3>
                            <p className="text-sm">{store.address}</p>
                            {nearestStore?.id === store.id && (
                              <Badge className="mt-2 bg-green-600 text-white">Nearest Store</Badge>
                            )}
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>
              </Card>
            </MapErrorBoundary>
          </div>

          {/* Enhanced Store List */}
          <div className="space-y-4 overflow-y-auto max-h-[700px] pr-2">
            {searchResults.length === 0 ? (
              <Card className="shadow-lg">
                <CardContent className="text-center py-12">
                  <MapPin className="h-12 w-12 text-foreground/20 mx-auto mb-4" />
                  <p className="text-foreground/60">No stores found in this area</p>
                </CardContent>
              </Card>
            ) : (
              searchResults.map((store) => {
                const Icon = store.icon;
                return (
                  <Card
                    key={store.id}
                    className={`cursor-pointer transition-all duration-300 shadow-lg hover:shadow-2xl border-0 ${
                      selectedStore?.id === store.id ? "ring-2 ring-green-500 scale-[1.02]" : 
                      nearestStore?.id === store.id ? "ring-2 ring-blue-500" : "hover:scale-[1.01]"
                    }`}
                    onClick={() => handleStoreSelect(store)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`p-2 rounded-lg ${getStoreTypeColor(store.type)} bg-opacity-10`}>
                              <Icon className={`h-5 w-5 ${getStoreTypeColor(store.type).replace('bg-', 'text-')}`} />
                            </div>
                            <Badge className={`${getStoreTypeBadgeColor(store.type)} border`}>
                              {store.type.charAt(0).toUpperCase() + store.type.slice(1)}
                            </Badge>
                          </div>
                          <CardTitle className="text-lg">
                            {store.name}
                            {nearestStore?.id === store.id && (
                              <Badge className="ml-2 bg-gradient-to-r from-green-600 to-green-700 text-white">
                                Nearest
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription className="mt-1">{store.address}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {/* Show distance if user location is set */}
                        {userLocation && (
                          <div className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
                            <Car className="h-4 w-4" />
                            <span>
                              {calculateDistance(userLocation.lat, userLocation.lng, store.lat, store.lng).toFixed(1)} miles away
                            </span>
                          </div>
                        )}
                        
                        {store.website && (
                          <div className="flex items-center gap-2 text-sm">
                            <Globe className="h-4 w-4 text-foreground/60" />
                            <a 
                              href={store.website.startsWith('http') ? store.website : `https://${store.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Visit Website
                            </a>
                          </div>
                        )}
                        <div className="flex items-start gap-2 text-sm">
                          <Package className="h-4 w-4 text-foreground/60 mt-0.5" />
                          <span className="text-sm">{store.products.join(", ")}</span>
                        </div>
                        
                        {/* Store Features with Enhanced Design */}
                        {store.features && (
                          <div className="flex flex-wrap gap-2 pt-3 border-t">
                            {store.features.map((feature) => (
                              <Badge key={feature} variant="secondary" className="text-xs bg-gray-100 dark:bg-gray-700">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>

        {/* Enhanced Selected Store Details */}
        {selectedStore && (
          <Card className="mt-8 shadow-2xl border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
            <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Navigation className="h-6 w-6" />
                Get Directions to {selectedStore.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-foreground/60 mb-2 font-medium">Full Address:</p>
                    <p className="font-semibold text-lg mb-4">{selectedStore.address}</p>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => window.open(`https://maps.google.com/?q=${selectedStore.address}`, '_blank')}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg"
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      Google Maps
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => window.open(`https://maps.apple.com/?q=${selectedStore.address}`, '_blank')}
                      className="flex-1 border-2"
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      Apple Maps
                    </Button>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-foreground/60 mb-2 font-medium">Store Information:</p>
                    <div className="space-y-2">
                      <Badge className={`${getStoreTypeBadgeColor(selectedStore.type)} border text-sm px-3 py-1`}>
                        {selectedStore.type.charAt(0).toUpperCase() + selectedStore.type.slice(1)} Location
                      </Badge>
                    </div>
                  </div>
                  {selectedStore.website && (
                    <Button
                      variant="outline"
                      onClick={() => window.open(selectedStore.website.startsWith('http') ? selectedStore.website : `https://${selectedStore.website}`, '_blank')}
                      className="w-full border-2"
                    >
                      <Globe className="h-4 w-4 mr-2" />
                      Visit Store Website
                    </Button>
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

export default StoreLocatorEnhanced;