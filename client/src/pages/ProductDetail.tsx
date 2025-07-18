import { useState, useEffect } from "react";
import { Link, useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, CheckCircle, X, ChevronLeft, ChevronRight, ZoomIn, Package, Truck, Shield, PlayCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { getProductByIndex, getProductsData } from "@/data/productData";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import SEO from "@/components/layout/SEO";

// Size category images and labels from adminInputs.txt
const SIZE_CATEGORIES = [
  {
    name: "Pallet of 9 lb bags",
    description: "144 units (36 cases of 4 units)",
    image: "/Size Categories- Pallet of Box.png",
  },
  {
    name: "Pallet of 1CF bags",
    description: "50 bags (1CF each)",
    image: "/Size Category - pallet of 50 1 CF bags.png",
  },
  {
    name: "Bulk Delivery",
    description: "22-24 tons (soil amendments and concentrates) / 90-110 CYs (potting soil and mulch)",
    image: "/Truckload Bulk delivery.png",
  },
  {
    name: "Bulk Pickup",
    description: "Cubic yards (Dairy compost only)",
    image: "/CY of Bulk for pick only.png",
  },
];

const ProductDetail = () => {
  const [, params] = useRoute("/products/:slug");
  const [, navigate] = useLocation();
  const slug = params && (params as any).slug ? (params as any).slug : undefined;
  const [product, setProduct] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [currentSizeIndex, setCurrentSizeIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Add history handling
  const handleBack = () => {
    window.history.back();
  };

  useEffect(() => {
    const loadProductData = async () => {
      if (!slug) {
        setError(true);
        setIsLoading(false);
        return;
      }
      try {
        // First try to see if the slug is a number (for backward compatibility)
        const productId = parseInt(slug);
        if (!isNaN(productId)) {
          const foundProduct = await getProductByIndex(productId - 1);
          if (foundProduct) {
            setProduct(foundProduct);
            return;
          }
        }
        
        // If not a number or product not found by ID, try to find by name
        const allProducts = getProductsData();
        const foundProduct = allProducts.find(
          (p) => p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === slug.toLowerCase() ||
                p.productType?.toLowerCase().replace(/[^a-z0-9]+/g, '-') === slug.toLowerCase()
        );
        
        if (foundProduct) {
          setProduct(foundProduct);
        } else {
          setError(true);
        }
      } catch (err) {
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };
    loadProductData();
  }, [slug]);

  // Auto-play carousel
  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentSizeIndex((prev) => {
        if (prev >= SIZE_CATEGORIES.length - 2) {
          return 0;
        }
        return prev + 1;
      });
    }, 3000); // Change every 3 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const allImages: string[] = [
    ...(product?.texturePhotoUrl ? [product.texturePhotoUrl.startsWith('/') ? product.texturePhotoUrl : `/${product.texturePhotoUrl}`] : []),
    ...(product?.additionalImages || []).filter(img => img !== product?.texturePhotoUrl).map(img => img.startsWith('/') ? img : `/${img}`),
    ...(product?.imageUrl ? [product.imageUrl.startsWith('/') ? product.imageUrl : `/${product.imageUrl}`] : [])
  ];

  // Add video as the last item if it exists
  const hasVideo = product?.productVideoUrl;
  const allMedia = hasVideo ? [...allImages, 'video'] : allImages;

  // Navigation handlers
  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allMedia.length);
  };
  const handlePreviousImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allMedia.length) % allMedia.length);
  };
  const handleThumbnailClick = (index: number) => {
    setCurrentImageIndex(index);
  };

  // Get YouTube video ID from URL
  const getYouTubeVideoId = (url: string) => {
    const match = url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  };

  // Get YouTube thumbnail URL
  const getYouTubeThumbnail = (videoId: string) => {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  };

  if (error) {
    navigate("/products");
    return null;
  }

  // Prepare SEO data when product is loaded
  const getProductSchema = (product) => {
    if (!product) return null;
    
    return {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": product.productType || product.name,
      "description": product.description,
      "category": product.category,
      "brand": {
        "@type": "Brand",
        "name": "Organic Soil Wholesale"
      },
      "image": allImages[0] || "",
      "offers": {
        "@type": "Offer",
        "availability": "https://schema.org/InStock",
        "price": "0",
        "priceCurrency": "USD",
        "priceValidUntil": new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        "url": `https://organicsoilwholesale.com/products/${slug}`,
        "seller": {
          "@type": "Organization",
          "name": "Organic Soil Wholesale"
        },
        "businessFunction": "http://purl.org/goodrelations/v1#Sell"
      }
    };
  };

  return (
    <section className="py-16 bg-white">
      {product && (
        <SEO 
          title={product.marketingTitle || product.displayTitle || product.productType || product.name}
          description={`Wholesale ${product.displayTitle || product.productType || product.name} for commercial applications. ${product.description || ''}`}
          keywords={product.seoKeywords || `wholesale ${product.name.toLowerCase()}, bulk ${product.name.toLowerCase()}, commercial ${product.name.toLowerCase()}, ${product.category.toLowerCase()} wholesale, organic soil wholesale, ${product.ingredients ? product.ingredients.toLowerCase() + ',' : ''} bulk soil delivery, commercial soil supplier`}
          canonical={`https://organicsoilwholesale.com/products/${slug}`}
          ogImage={allImages[0] || ''}
          structuredData={getProductSchema(product)}
        />
      )}
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <div onClick={handleBack} className="text-primary hover:text-primary-light flex items-center cursor-pointer">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </div>
        </div>
        {isLoading ? (
          <div className="flex flex-col lg:flex-row">
            {/* Product Images Skeleton */}
            <div className="lg:w-1/2 lg:pr-12 mb-10 lg:mb-0">
              <div className="bg-neutral-50 p-4 rounded-xl">
                <Skeleton className="w-full h-[400px] rounded-lg mb-4" />
                <div className="grid grid-cols-4 gap-2">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-20 rounded-md" />
                  ))}
                </div>
              </div>
            </div>
            {/* Product Information Skeleton */}
            <div className="lg:w-1/2">
              <Skeleton className="h-6 w-32 mb-4" />
              <Skeleton className="h-10 w-3/4 mb-2" />
              <Skeleton className="h-6 w-1/2 mb-6" />
              <Skeleton className="h-6 w-40 mb-3" />
              <div className="flex flex-wrap gap-3 mb-8">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-24" />
                ))}
              </div>
            </div>
          </div>
        ) : product ? (
          <div className="flex flex-col lg:flex-row gap-12">
            {/* Product Images - Enhanced Gallery */}
            <div className="lg:w-1/2">
              <div className="sticky top-24">
                {/* Main Image Display */}
                <div className="relative group bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
                  <div 
                    className="relative aspect-square cursor-zoom-in overflow-hidden"
                    onClick={() => setIsGalleryOpen(true)}
                  >
                    {allMedia[currentImageIndex] === 'video' && product.productVideoUrl ? (
                      <div className="w-full h-full relative bg-black">
                        <iframe
                          src={`https://www.youtube.com/embed/${getYouTubeVideoId(product.productVideoUrl)}?rel=0`}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                        {product.productVideoTitle && (
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pointer-events-none">
                            <p className="text-white text-sm font-medium">{product.productVideoTitle}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        <img 
                          src={allImages[currentImageIndex]} 
                          alt={product.name} 
                          className="w-full h-full object-contain p-8 transition-transform duration-500 group-hover:scale-105" 
                        />
                        {/* Zoom Indicator */}
                        <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-2">
                          <ZoomIn className="h-4 w-4" />
                          <span className="text-sm">Click to zoom</span>
                        </div>
                      </>
                    )}
                  </div>
                  
                  {/* Navigation Arrows for Main Image */}
                  {allMedia.length > 1 && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={handlePreviousImage}
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={handleNextImage}
                      >
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                    </>
                  )}
                </div>
                
                {/* Thumbnail Gallery */}
                {allMedia.length > 1 && (
                  <div className="mt-4 grid grid-cols-4 gap-3">
                    {allMedia.map((media, index) => (
                      <button
                        key={index}
                        className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                          currentImageIndex === index 
                            ? "border-primary shadow-md" 
                            : "border-neutral-200 hover:border-neutral-300"
                        }`}
                        onClick={() => handleThumbnailClick(index)}
                      >
                        {media === 'video' && product.productVideoUrl ? (
                          <div className="relative w-full h-full group bg-black rounded overflow-hidden">
                            <img 
                              src={getYouTubeThumbnail(getYouTubeVideoId(product.productVideoUrl) || '')}
                              alt="Product Video"
                              className="w-full h-full object-contain"
                            />
                            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center group-hover:bg-black/50 transition-colors">
                              <PlayCircle className="h-8 w-8 text-white mb-1 drop-shadow-lg" />
                              <span className="text-xs text-white font-medium drop-shadow-md">Watch Video</span>
                            </div>
                          </div>
                        ) : media === 'video' ? (
                          <div className="w-full h-full bg-neutral-900 flex items-center justify-center">
                            <PlayCircle className="h-8 w-8 text-white" />
                          </div>
                        ) : (
                          <>
                            <img 
                              src={allImages[index]} 
                              alt={`${product.name} - View ${index + 1}`} 
                              className="w-full h-full object-cover hover:scale-110 transition-transform duration-200" 
                            />
                            {currentImageIndex === index && (
                              <div className="absolute inset-0 bg-primary/10 pointer-events-none" />
                            )}
                          </>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {/* Product Information - Enhanced Layout */}
            <div className="lg:w-1/2">
              {/* Header Section */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <Badge variant="outline" className="text-primary border-primary px-3 py-1">
                    {product.category}
                  </Badge>
                  {product.certifications && product.certifications.includes("OMRI") && (
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      OMRI Listed
                    </Badge>
                  )}
                </div>
                <h1 className="text-4xl font-bold mb-3 text-neutral-900">{product.displayTitle || product.productType || product.name}</h1>
                {product.name && product.name !== (product.displayTitle || product.productType) && (
                  <p className="text-lg text-neutral-500 mb-2">{product.name}</p>
                )}
                <p className="text-xl text-neutral-600 leading-relaxed">{product.description}</p>
              </div>

              {/* Key Benefits */}
              <div className="bg-primary/5 rounded-xl p-6 mb-8">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <Package className="h-8 w-8 text-primary mx-auto mb-2" />
                    <p className="text-sm font-medium">Bulk Available</p>
                  </div>
                  <div>
                    <Truck className="h-8 w-8 text-primary mx-auto mb-2" />
                    <p className="text-sm font-medium">Fast Delivery</p>
                  </div>
                  <div>
                    <Shield className="h-8 w-8 text-primary mx-auto mb-2" />
                    <p className="text-sm font-medium">Quality Assured</p>
                  </div>
                </div>
              </div>

              {/* Available Sizes - Carousel Display */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-neutral-900">Available Sizes</h3>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => {
                        setIsAutoPlaying(false);
                        setCurrentSizeIndex(Math.max(0, currentSizeIndex - 1));
                      }}
                      disabled={currentSizeIndex === 0}
                    >
                      <ChevronLeft className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => {
                        setIsAutoPlaying(false);
                        setCurrentSizeIndex(Math.min(SIZE_CATEGORIES.length - 2, currentSizeIndex + 1));
                      }}
                      disabled={currentSizeIndex >= SIZE_CATEGORIES.length - 2}
                    >
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div 
                  className="relative overflow-hidden"
                  onMouseEnter={() => setIsAutoPlaying(false)}
                  onMouseLeave={() => setIsAutoPlaying(true)}
                >
                  <div 
                    className="flex transition-transform duration-500 ease-in-out gap-3"
                    style={{ transform: `translateX(-${currentSizeIndex * 50}%)` }}
                  >
                    {SIZE_CATEGORIES.map((cat) => (
                      <Card 
                        key={cat.name} 
                        className="flex-shrink-0 w-[calc(50%-0.5rem)] overflow-hidden hover:shadow-lg transition-shadow duration-300 border-neutral-200 cursor-pointer"
                        onClick={() => {
                          const img = new Image();
                          img.src = cat.image;
                          const newWindow = window.open('', '_blank');
                          if (newWindow) {
                            newWindow.document.write(`
                              <html>
                                <head><title>${cat.name}</title></head>
                                <body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f5f5f5;">
                                  <img src="${cat.image}" style="max-width:100%;height:auto;" alt="${cat.name}"/>
                                </body>
                              </html>
                            `);
                          }
                        }}
                      >
                        <div className="aspect-[4/3] relative bg-neutral-50">
                          <img 
                            src={cat.image} 
                            alt={cat.name} 
                            className="w-full h-full object-contain p-3" 
                          />
                          <div className="absolute top-2 right-2 bg-white/90 p-1 rounded-full opacity-0 hover:opacity-100 transition-opacity">
                            <ZoomIn className="h-3 w-3 text-neutral-600" />
                          </div>
                        </div>
                        <div className="p-2 bg-white">
                          <h4 className="font-semibold text-xs mb-0.5">{cat.name}</h4>
                          <p className="text-[10px] text-neutral-600 leading-relaxed line-clamp-2">{cat.description}</p>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
                {/* Carousel Indicators */}
                <div className="flex justify-center mt-3 gap-1">
                  {Array.from({ length: Math.ceil(SIZE_CATEGORIES.length / 2) }).map((_, index) => (
                    <button
                      key={index}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        Math.floor(currentSizeIndex / 2) === index 
                          ? 'w-4 bg-primary' 
                          : 'w-1.5 bg-neutral-300'
                      }`}
                      onClick={() => setCurrentSizeIndex(index * 2)}
                    />
                  ))}
                </div>
              </div>
              {/* Product Details Tabs - Enhanced */}
              <div className="mt-8">
                <Tabs defaultValue="details" className="w-full">
                  <TabsList className="grid grid-cols-4 w-full p-1 h-auto">
                    <TabsTrigger value="details" className="data-[state=active]:bg-primary data-[state=active]:text-white py-3">
                      Details
                    </TabsTrigger>
                    <TabsTrigger value="usage" className="data-[state=active]:bg-primary data-[state=active]:text-white py-3">
                      Usage
                    </TabsTrigger>
                    <TabsTrigger value="ingredients" className="data-[state=active]:bg-primary data-[state=active]:text-white py-3">
                      Ingredients
                    </TabsTrigger>
                    <TabsTrigger value="certifications" className="data-[state=active]:bg-primary data-[state=active]:text-white py-3">
                      Certifications
                    </TabsTrigger>
                  </TabsList>
                  
                  <div className="mt-6 bg-neutral-50 rounded-xl p-6">
                    <TabsContent value="details" className="mt-0 space-y-6">
                      {product.story && (
                        <div>
                          <h4 className="text-lg font-semibold mb-3 text-neutral-900">Our Story</h4>
                          <p className="text-neutral-700 leading-relaxed whitespace-pre-wrap">{product.story}</p>
                        </div>
                      )}
                      {product.targetAudience && (
                        <div>
                          <h4 className="text-lg font-semibold mb-3 text-neutral-900">Target Audience</h4>
                          <div className="flex flex-wrap gap-2">
                            {product.targetAudience.split(',').map((audience, index) => (
                              <Badge key={index} variant="secondary" className="bg-white">
                                {audience.trim()}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {product.recommendedUses && (
                        <div>
                          <h4 className="text-lg font-semibold mb-3 text-neutral-900">Recommended Uses</h4>
                          <p className="text-neutral-700 leading-relaxed">{product.recommendedUses}</p>
                        </div>
                      )}
                      {product.features && product.features.includes('|') && (
                        <div>
                          <h4 className="text-lg font-semibold mb-3 text-neutral-900">Key Features</h4>
                          <ul className="space-y-2">
                            {product.features.split('|').map((feature, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                                <span className="text-neutral-700">{feature.trim()}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {product.marketingNote && (
                        <div className="mt-4 p-4 bg-primary/10 rounded-lg">
                          <p className="text-sm text-neutral-700 italic">{product.marketingNote}</p>
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="usage" className="mt-0">
                      <h4 className="text-lg font-semibold mb-3 text-neutral-900">Usage Instructions</h4>
                      <div className="bg-white rounded-lg p-5 border border-neutral-200">
                        <p className="text-neutral-700 leading-relaxed whitespace-pre-wrap">{product.usage || "Usage instructions will be provided with your order."}</p>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="ingredients" className="mt-0">
                      <h4 className="text-lg font-semibold mb-3 text-neutral-900">Ingredients</h4>
                      <div className="bg-white rounded-lg p-5 border border-neutral-200">
                        <p className="text-neutral-700 font-medium">{product.ingredients || "Ingredient information available upon request."}</p>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="certifications" className="mt-0">
                      <h4 className="text-lg font-semibold mb-3 text-neutral-900">Certifications</h4>
                      <div className="grid grid-cols-2 gap-4">
                        {product.certifications?.split(',').map((cert, index) => (
                          <div key={index} className="bg-white rounded-lg p-4 border border-neutral-200 text-center">
                            <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                            <p className="font-medium text-neutral-900">{cert.trim()}</p>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>
              </div>
              
              {/* CTA Section */}
              <div className="mt-10 space-y-4">
                <Button 
                  className="w-full bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl transition-all duration-300" 
                  size="lg" 
                  onClick={() => navigate("/order")}
                >
                  <Truck className="mr-2 h-5 w-5" />
                  Order Now - Arizona Delivery Available
                </Button>
                <p className="text-center text-sm text-neutral-600">
                  Need a custom quote? <Link href="/contact" className="text-primary hover:underline font-medium">Contact us</Link>
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </div>
      {/* Enhanced Image Gallery Modal */}
      {isGalleryOpen && (
        <Dialog open={isGalleryOpen} onOpenChange={setIsGalleryOpen}>
          <DialogContent className="max-w-7xl w-full h-[90vh] p-0 bg-black/95 border-none">
            <div className="relative h-full flex flex-col">
              {/* Close Button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-20 bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm"
                onClick={() => setIsGalleryOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
              
              {/* Main Image Display */}
              <div className="flex-1 relative flex items-center justify-center p-4">
                {allMedia[currentImageIndex] === 'video' && product?.productVideoUrl ? (
                  <div className="w-full max-w-4xl aspect-video">
                    <iframe
                      src={`https://www.youtube.com/embed/${getYouTubeVideoId(product.productVideoUrl)}?rel=0&autoplay=1`}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <img 
                    src={allImages[currentImageIndex]} 
                    alt={product?.name} 
                    className="max-w-full max-h-full object-contain" 
                  />
                )}
                
                {/* Navigation Arrows */}
                {allMedia.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-8 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm h-12 w-12"
                      onClick={handlePreviousImage}
                    >
                      <ChevronLeft className="h-8 w-8" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-8 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm h-12 w-12"
                      onClick={handleNextImage}
                    >
                      <ChevronRight className="h-8 w-8" />
                    </Button>
                  </>
                )}
              </div>
              
              {/* Thumbnail Strip */}
              {allMedia.length > 1 && (
                <div className="bg-black/50 backdrop-blur-sm p-4">
                  <div className="flex gap-2 justify-center overflow-x-auto">
                    {allMedia.map((media, index) => (
                      <button
                        key={index}
                        className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                          currentImageIndex === index 
                            ? "border-white" 
                            : "border-transparent opacity-60 hover:opacity-100"
                        }`}
                        onClick={() => handleThumbnailClick(index)}
                      >
                        {media === 'video' && product?.productVideoUrl ? (
                          <div className="relative w-full h-full group">
                            <img 
                              src={getYouTubeThumbnail(getYouTubeVideoId(product.productVideoUrl) || '')}
                              alt="Product Video"
                              className="w-full h-full object-contain bg-black"
                            />
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <PlayCircle className="h-5 w-5 text-white" />
                            </div>
                          </div>
                        ) : media === 'video' ? (
                          <div className="w-full h-full bg-neutral-900 flex items-center justify-center">
                            <PlayCircle className="h-6 w-6 text-white" />
                          </div>
                        ) : (
                          <img 
                            src={allImages[index]} 
                            alt={`View ${index + 1}`} 
                            className="w-full h-full object-cover" 
                          />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Image Counter */}
              <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm">
                {currentImageIndex + 1} / {allMedia.length}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </section>
  );
};

export default ProductDetail;
