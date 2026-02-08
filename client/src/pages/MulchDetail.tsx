import { useState, useEffect, useMemo } from "react";
import { Link, useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, CheckCircle, X, ChevronLeft, ChevronRight, ZoomIn, Package, Truck, Shield, PlayCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { getMulchProducts } from "@/data/productData";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { OptimizedImage } from "@/components/OptimizedImage";
import { getOptimizedImageSrc } from "@/utils/getOptimizedImageSrc";

// Size category images and labels
const SIZE_CATEGORIES = [
  {
    name: "2CF Bag",
    description: "25 units of 2 cubic feet bags",
    image: "/Size Category - pallet of 50 1 CF bags.png",
  },
  {
    name: "Bulk Delivery",
    description: "22-24 tons (soil amendments and concentrates) / 90-110 CYs (potting soil and mulch)",
    image: "/Truckload Bulk delivery.png",
  },
  {
    name: "Bulk Pickup",
    description: "Bulk In Cubic Yard for pickup only",
    image: "/CY of Bulk for pick only.png",
  },
  {
    name: "2.2 CY Tote",
    description: "Pallet of Single 2.2 CY Tote (supersack)",
    image: "/2.2 CY Tote (supersack).png",
  },
];

const MulchDetail = () => {
  const [, params] = useRoute("/products/:id");
  const [, navigate] = useLocation();
  const productId = params && (params as any).id ? parseInt((params as any).id) : undefined;
  const [mulchProducts, setMulchProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [currentSizeIndex, setCurrentSizeIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const sizeCategories = useMemo(
    () =>
      SIZE_CATEGORIES.map((category) => ({
        ...category,
        image: getOptimizedImageSrc(category.image),
      })),
    []
  );

  useEffect(() => {
    const loadMulchData = async () => {
      try {
        const products = await getMulchProducts();
        setMulchProducts(products);
        if (products.length > 0) {
          setSelectedVariant(products[0]);
        }
      } catch (err) {
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };
    loadMulchData();
  }, []);

  // Auto-play carousel
  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentSizeIndex((prev) => {
        if (prev >= sizeCategories.length - 2) {
          return 0;
        }
        return prev + 1;
      });
    }, 3000); // Change every 3 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying, sizeCategories.length]);

  const allImages: string[] = Array.from(
    new Set(
      (
        selectedVariant
          ? [
              ...(selectedVariant.additionalImages || []),
              ...(selectedVariant["Product Texture Photo URL"] ? [selectedVariant["Product Texture Photo URL"]] : []),
            ]
          : []
      )
        .map((img: string) => getOptimizedImageSrc(img))
        .filter((img): img is string => Boolean(img))
    )
  );

  // Navigation handlers
  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };
  const handlePreviousImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };
  const handleThumbnailClick = (index: number) => {
    setCurrentImageIndex(index);
  };

  if (error) {
    navigate("/products");
    return null;
  }

  return (
    <section className="py-6 sm:py-12 lg:py-16 bg-white">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="mb-4 sm:mb-8">
          <Link href="/products">
            <div className="min-h-[44px] inline-flex items-center text-primary hover:text-primary-light cursor-pointer touch-manipulation">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Products
            </div>
          </Link>
        </div>
        {isLoading ? (
          <div className="flex flex-col gap-6 lg:flex-row lg:gap-12">
            {/* Product Images Skeleton */}
            <div className="w-full lg:w-1/2">
              <div className="bg-neutral-50 p-3 sm:p-4 rounded-xl">
                <Skeleton className="w-full aspect-square sm:h-[400px] rounded-lg mb-3 sm:mb-4" />
                <div className="grid grid-cols-4 gap-2">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-16 sm:h-20 rounded-md" />
                  ))}
                </div>
              </div>
            </div>
            {/* Product Information Skeleton */}
            <div className="w-full lg:w-1/2">
              <Skeleton className="h-6 w-24 sm:w-32 mb-3 sm:mb-4" />
              <Skeleton className="h-8 sm:h-10 w-3/4 mb-2" />
              <Skeleton className="h-5 sm:h-6 w-1/2 mb-4 sm:mb-6" />
              <Skeleton className="h-5 sm:h-6 w-32 sm:w-40 mb-3" />
              <div className="flex flex-wrap gap-2 sm:gap-3 mb-6 sm:mb-8">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-9 sm:h-10 w-20 sm:w-24" />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6 lg:flex-row lg:gap-12">
            {/* Product Images - Mobile-optimized Gallery */}
            <div className="w-full lg:w-1/2">
              <div className="lg:sticky lg:top-24">
                {/* Main Image Display */}
                <div className="relative group bg-white rounded-xl sm:rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
                  <div
                    className="relative aspect-square cursor-zoom-in overflow-hidden touch-manipulation"
                    onClick={() => setIsGalleryOpen(true)}
                  >
                    <OptimizedImage
                      src={allImages[currentImageIndex]}
                      alt={selectedVariant?.name || "Mulch photo"}
                      className="w-full h-full object-contain p-4 sm:p-8 transition-transform duration-500 sm:group-hover:scale-105"
                      priority
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                    {/* Zoom Indicator */}
                    <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 bg-black/70 text-white px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                      <ZoomIn className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span>Tap to zoom</span>
                    </div>
                  </div>

                  {/* Navigation Arrows for Main Image - always visible on mobile */}
                  {allImages.length > 1 && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-md h-10 w-10 sm:h-9 sm:w-9 touch-manipulation"
                        onClick={handlePreviousImage}
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-md h-10 w-10 sm:h-9 sm:w-9 touch-manipulation"
                        onClick={handleNextImage}
                      >
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                    </>
                  )}
                </div>

                {/* Thumbnail Gallery */}
                {allImages.length > 1 && (
                  <div className="mt-3 sm:mt-4 grid grid-cols-4 gap-2 sm:gap-3">
                    {allImages.map((image, index) => (
                      <button
                        key={index}
                        className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all duration-200 touch-manipulation ${
                          currentImageIndex === index
                            ? "border-primary shadow-md"
                            : "border-neutral-200 hover:border-neutral-300"
                        }`}
                        onClick={() => handleThumbnailClick(index)}
                      >
                        <OptimizedImage
                          src={image}
                          alt={`${selectedVariant?.name || "Mulch"} - View ${index + 1}`}
                          className="w-full h-full object-cover sm:hover:scale-110 transition-transform duration-200"
                        />
                        {currentImageIndex === index && (
                          <div className="absolute inset-0 bg-primary/10 pointer-events-none" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {/* Product Information - Mobile-optimized Layout */}
            <div className="w-full lg:w-1/2">
              {/* Header Section */}
              <div className="mb-4 sm:mb-6">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <Badge className="bg-primary text-white border-0 px-3 py-1.5 text-xs font-semibold">
                    Mulch
                  </Badge>
                  {selectedVariant?.certifications && selectedVariant.certifications.includes("OMRI") && (
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      OMRI Listed
                    </Badge>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-3 text-neutral-900">Nature's Blanket Premium Mulch</h1>
                <p className="text-base sm:text-lg lg:text-xl text-neutral-600 leading-relaxed">Premium mulch enhanced with dairy compost for optimal soil health and plant growth.</p>
              </div>

              {/* Key Benefits */}
              <div className="bg-primary/5 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
                <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                  <div>
                    <Package className="h-6 w-6 sm:h-8 sm:w-8 text-primary mx-auto mb-1.5 sm:mb-2" />
                    <p className="text-xs sm:text-sm font-medium">Bulk Available</p>
                  </div>
                  <div>
                    <Truck className="h-6 w-6 sm:h-8 sm:w-8 text-primary mx-auto mb-1.5 sm:mb-2" />
                    <p className="text-xs sm:text-sm font-medium">Fast Delivery</p>
                  </div>
                  <div>
                    <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-primary mx-auto mb-1.5 sm:mb-2" />
                    <p className="text-xs sm:text-sm font-medium">Quality Assured</p>
                  </div>
                </div>
              </div>

              {/* Mulch Variants */}
              <div className="mb-6 sm:mb-8">
                <h3 className="text-sm font-medium mb-2 sm:mb-3">Available Variants</h3>
                <div className="grid grid-cols-1 gap-3 sm:gap-4">
                  {mulchProducts.map((variant) => (
                    <Card
                      key={variant.id}
                      className={`p-3 sm:p-4 cursor-pointer transition-all duration-200 touch-manipulation ${
                        selectedVariant?.id === variant.id ? "ring-2 ring-primary" : "sm:hover:ring-2 sm:hover:ring-primary/50"
                      }`}
                      onClick={() => setSelectedVariant(variant)}
                    >
                      <div className="flex items-center justify-between min-h-[44px]">
                        <div>
                          <h4 className="font-semibold text-sm sm:text-base">{variant.name}</h4>
                          <p className="text-xs sm:text-sm text-neutral-600">{variant.productType}</p>
                        </div>
                        <div className="flex items-center">
                          {selectedVariant?.id === variant.id && <CheckCircle className="h-5 w-5 text-primary" />}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Available Sizes - Carousel Display */}
              <div className="mb-6 sm:mb-8">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <h3 className="text-base sm:text-lg font-semibold text-neutral-900">Available Sizes</h3>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 sm:h-7 sm:w-7 touch-manipulation"
                      onClick={() => {
                        setIsAutoPlaying(false);
                        setCurrentSizeIndex(Math.max(0, currentSizeIndex - 1));
                      }}
                      disabled={currentSizeIndex === 0}
                    >
                      <ChevronLeft className="h-4 w-4 sm:h-3 sm:w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 sm:h-7 sm:w-7 touch-manipulation"
                      onClick={() => {
                        setIsAutoPlaying(false);
                        setCurrentSizeIndex(Math.min(sizeCategories.length - 2, currentSizeIndex + 1));
                      }}
                      disabled={currentSizeIndex >= sizeCategories.length - 2}
                    >
                      <ChevronRight className="h-4 w-4 sm:h-3 sm:w-3" />
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
                    {sizeCategories.map((cat) => (
                      <Card 
                        key={cat.name} 
                        className="flex-shrink-0 w-[calc(50%-0.5rem)] overflow-hidden hover:shadow-lg transition-shadow duration-300 border-neutral-200 cursor-pointer"
                        onClick={() => {
                          const optimizedUrl = getOptimizedImageSrc(cat.image);
                          const img = new Image();
                          img.src = optimizedUrl;
                          const newWindow = window.open('', '_blank');
                          if (newWindow) {
                            newWindow.document.write(`
                              <html>
                                <head><title>${cat.name}</title></head>
                                <body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f5f5f5;">
                                  <img src="${optimizedUrl}" style="max-width:100%;height:auto;" alt="${cat.name}"/>
                                </body>
                              </html>
                            `);
                          }
                        }}
                      >
                        <div className="aspect-[4/3] relative bg-neutral-50">
                          <OptimizedImage
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
                  {Array.from({ length: Math.ceil(sizeCategories.length / 2) }).map((_, index) => (
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

              {/* Product Details Tabs - Mobile-optimized */}
              <div className="mt-6 sm:mt-8">
                <Tabs defaultValue="details" className="w-full">
                  <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full p-1 h-auto gap-1">
                    <TabsTrigger value="details" className="data-[state=active]:bg-primary data-[state=active]:text-white py-2.5 sm:py-3 text-xs sm:text-sm">
                      Details
                    </TabsTrigger>
                    <TabsTrigger value="usage" className="data-[state=active]:bg-primary data-[state=active]:text-white py-2.5 sm:py-3 text-xs sm:text-sm">
                      Usage
                    </TabsTrigger>
                    <TabsTrigger value="ingredients" className="data-[state=active]:bg-primary data-[state=active]:text-white py-2.5 sm:py-3 text-xs sm:text-sm">
                      Ingredients
                    </TabsTrigger>
                    <TabsTrigger value="certifications" className="data-[state=active]:bg-primary data-[state=active]:text-white py-2.5 sm:py-3 text-xs sm:text-sm">
                      Certs
                    </TabsTrigger>
                  </TabsList>
                  
                  <div className="mt-4 sm:mt-6 bg-neutral-50 rounded-xl p-4 sm:p-6">
                    <TabsContent value="details" className="mt-0 space-y-4 sm:space-y-6">
                      {selectedVariant?.story && (
                        <div>
                          <h4 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 text-neutral-900">Our Story</h4>
                          <p className="text-sm sm:text-base text-neutral-700 leading-relaxed whitespace-pre-wrap">{selectedVariant.story}</p>
                        </div>
                      )}
                      {selectedVariant?.targetAudience && (
                        <div>
                          <h4 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 text-neutral-900">Target Audience</h4>
                          <div className="flex flex-wrap gap-1.5 sm:gap-2">
                            {selectedVariant.targetAudience.split(',').map((audience: string, index: number) => (
                              <Badge key={index} variant="secondary" className="bg-white text-xs sm:text-sm">
                                {audience.trim()}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {selectedVariant?.recommendedUses && (
                        <div>
                          <h4 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 text-neutral-900">Recommended Uses</h4>
                          <p className="text-sm sm:text-base text-neutral-700 leading-relaxed">{selectedVariant.recommendedUses}</p>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="usage" className="mt-0">
                      <h4 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 text-neutral-900">Usage Instructions</h4>
                      <div className="bg-white rounded-lg p-3 sm:p-5 border border-neutral-200">
                        <p className="text-sm sm:text-base text-neutral-700 leading-relaxed whitespace-pre-wrap">{selectedVariant?.usage || "Usage instructions will be provided with your order."}</p>
                      </div>
                    </TabsContent>

                    <TabsContent value="ingredients" className="mt-0">
                      <h4 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 text-neutral-900">Ingredients</h4>
                      <div className="bg-white rounded-lg p-3 sm:p-5 border border-neutral-200">
                        <p className="text-sm sm:text-base text-neutral-700 font-medium">{selectedVariant?.ingredients || "Ingredient information available upon request."}</p>
                      </div>
                    </TabsContent>

                    <TabsContent value="certifications" className="mt-0">
                      <h4 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 text-neutral-900">Certifications</h4>
                      <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        {selectedVariant?.certifications?.split(',').map((cert: string, index: number) => (
                          <div key={index} className="bg-white rounded-lg p-3 sm:p-4 border border-neutral-200 text-center">
                            <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 mx-auto mb-1.5 sm:mb-2" />
                            <p className="text-xs sm:text-sm font-medium text-neutral-900">{cert.trim()}</p>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>
              </div>

              {/* CTA Section - Mobile-optimized */}
              <div className="mt-6 sm:mt-10 space-y-3 sm:space-y-4">
                <Button
                  className="w-full min-h-[48px] h-12 bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl transition-all duration-300 text-base touch-manipulation"
                  size="lg"
                  onClick={() => navigate("/order")}
                >
                  <Truck className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  Order Now - Arizona Delivery Available
                </Button>
                <p className="text-center text-xs sm:text-sm text-neutral-600">
                  Need a custom quote? <Link href="/contact" className="text-primary hover:underline font-medium">Contact us</Link>
                </p>
              </div>
            </div>
          </div>
        )}
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
                <OptimizedImage
                  src={allImages[currentImageIndex]}
                  alt={selectedVariant?.name || "Mulch photo"}
                  className="max-w-full max-h-full object-contain"
                />
                
                {/* Navigation Arrows */}
                {allImages.length > 1 && (
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
              {allImages.length > 1 && (
                <div className="bg-black/50 backdrop-blur-sm p-4">
                  <div className="flex gap-2 justify-center overflow-x-auto">
                    {allImages.map((image, index) => (
                      <button
                        key={index}
                        className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                          currentImageIndex === index 
                            ? "border-white" 
                            : "border-transparent opacity-60 hover:opacity-100"
                        }`}
                        onClick={() => handleThumbnailClick(index)}
                      >
                        <OptimizedImage src={image} alt={`View ${index + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Image Counter */}
              <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm">
                {currentImageIndex + 1} / {allImages.length}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </section>
  );
};

export default MulchDetail;
