import { useState, useEffect } from "react";
import { Link, useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, CheckCircle, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { getMulchProducts } from "@/data/productData";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

// Size category images and labels
const SIZE_CATEGORIES = [
  {
    name: "2CF Bag",
    description: "25 units of 2 cubic feet bags",
    image:
      "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/Product%20Texture%2FSize%20Categories%2FSize%20Category%20-%20pallet%20of%2050%201%20CF%20bags.png?alt=media&token=69966db5-9e26-4dce-b6ab-0a13b7b97440",
  },
  {
    name: "Bulk Delivery",
    description: "22-24 tons (soil amendments and concentrates) / 90-110 CYs (potting soil and mulch)",
    image:
      "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/Product%20Texture%2FSize%20Categories%2FBulk%20delivery.png?alt=media&token=2dfcfe98-d631-4d67-9749-528dc267099a",
  },
  {
    name: "Bulk Pickup",
    description: "Bulk In Cubic Yard for pickup only",
    image:
      "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/Product%20Texture%2FSize%20Categories%2FCY%20of%20Bulk%20for%20pick%20only.png?alt=media&token=ea70e2e7-638f-47fb-9f7d-cad9ac48fabc",
  },
  {
    name: "2.2 CY Tote",
    description: "Pallet of Single 2.2 CY Tote (supersack)",
    image:
      "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/Product%20Texture%2FSize%20Categories%2F2.2%20CY%20Tote%20(supersack).png?alt=media&token=dea1277a-9bdf-4216-a5bb-5f7fa8f4c35a",
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

  const allImages: string[] = selectedVariant
    ? [
        ...(selectedVariant.additionalImages || []),
        ...(selectedVariant["Product Texture Photo URL"] ? [selectedVariant["Product Texture Photo URL"]] : []),
      ]
    : [];

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
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <Link href="/products">
            <div className="text-primary hover:text-primary-light flex items-center cursor-pointer">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Products
            </div>
          </Link>
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
        ) : (
          <div className="flex flex-col lg:flex-row">
            {/* Product Images */}
            <div className="lg:w-1/2 lg:pr-12 mb-10 lg:mb-0">
              <div className="bg-neutral-50 p-4 rounded-xl">
                <div className="relative w-full h-[400px] rounded-lg overflow-hidden cursor-pointer" onClick={() => setIsGalleryOpen(true)}>
                  <img src={allImages[currentImageIndex]} alt={selectedVariant?.name} className="w-full h-full object-cover" />
                </div>
                <div className="grid grid-cols-4 gap-2 mt-4">
                  {allImages.map((image, index) => (
                    <div
                      key={index}
                      className={`relative h-20 rounded-md overflow-hidden cursor-pointer ${currentImageIndex === index ? "ring-2 ring-primary" : ""}`}
                      onClick={() => handleThumbnailClick(index)}
                    >
                      <img src={image} alt={`${selectedVariant?.name} - Image ${index + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Product Information */}
            <div className="lg:w-1/2">
              <div className="mb-4">
                <Badge variant="outline" className="text-primary border-primary">
                  Mulch
                </Badge>
              </div>
              <h1 className="text-3xl font-bold mb-2">Nature's Blanket Premium Mulch</h1>
              <p className="text-lg text-neutral-600 mb-6">Premium mulch enhanced with dairy compost for optimal soil health and plant growth.</p>

              {/* Mulch Variants */}
              <div className="mb-8">
                <h3 className="text-sm font-medium mb-3">Available Variants</h3>
                <div className="grid grid-cols-1 gap-4">
                  {mulchProducts.map((variant) => (
                    <Card
                      key={variant.id}
                      className={`p-4 cursor-pointer transition-all duration-200 ${
                        selectedVariant?.id === variant.id ? "ring-2 ring-primary" : "hover:ring-2 hover:ring-primary/50"
                      }`}
                      onClick={() => setSelectedVariant(variant)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">{variant.name}</h4>
                          <p className="text-sm text-neutral-600">{variant.productType}</p>
                        </div>
                        <div className="flex items-center">
                          {selectedVariant?.id === variant.id && <CheckCircle className="h-5 w-5 text-primary mr-2" />}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Available Sizes */}
              <div className="mb-8">
                <h3 className="text-sm font-medium mb-3">Available Sizes</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {SIZE_CATEGORIES.map((cat) => (
                    <div key={cat.name} className="rounded-lg border overflow-hidden hover:shadow-md transition-shadow duration-200">
                      <div className="aspect-[4/3] relative">
                        <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-end p-2">
                          <span className="text-white text-xs font-medium">{cat.description}</span>
                        </div>
                      </div>
                      <div className="p-2 text-center bg-white">
                        <div className="font-semibold text-sm">{cat.name}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Product Details Tabs */}
              <div className="mt-12">
                <Tabs defaultValue="details" className="w-full">
                  <TabsList className="w-full">
                    <TabsTrigger value="details" className="flex-1">
                      Details
                    </TabsTrigger>
                    <TabsTrigger value="usage" className="flex-1">
                      Usage
                    </TabsTrigger>
                    <TabsTrigger value="ingredients" className="flex-1">
                      Ingredients
                    </TabsTrigger>
                    <TabsTrigger value="certifications" className="flex-1">
                      Certifications
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="details" className="mt-6">
                    <div className="prose max-w-none">
                      <h4>Our Story</h4>
                      <p>{selectedVariant?.story}</p>
                      <h4 className="mt-4">Target Audience</h4>
                      <p>{selectedVariant?.targetAudience}</p>
                      <h4 className="mt-4">Recommended Uses</h4>
                      <p>{selectedVariant?.recommendedUses}</p>
                    </div>
                  </TabsContent>
                  <TabsContent value="usage" className="mt-6">
                    <div className="prose max-w-none">
                      <h4>Usage Instructions</h4>
                      <p>{selectedVariant?.usage}</p>
                    </div>
                  </TabsContent>
                  <TabsContent value="ingredients" className="mt-6">
                    <div className="prose max-w-none">
                      <h4>Ingredients</h4>
                      <p>{selectedVariant?.ingredients}</p>
                    </div>
                  </TabsContent>
                  <TabsContent value="certifications" className="mt-6">
                    <div className="prose max-w-none">
                      <h4>Certifications</h4>
                      <p>{selectedVariant?.certifications}</p>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Order Button */}
              <Button className="w-full bg-primary hover:bg-primary/90 text-white mt-8" size="lg" onClick={() => navigate("/order")}>
                Order Now - Arizona Delivery Available
              </Button>
            </div>
          </div>
        )}
      </div>
      {/* Image Gallery Modal */}
      {isGalleryOpen && (
        <Dialog open={isGalleryOpen} onOpenChange={setIsGalleryOpen}>
          <DialogContent className="max-w-4xl p-0 bg-transparent border-none">
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-10 bg-white/80 hover:bg-white"
                onClick={() => setIsGalleryOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
              <div className="relative aspect-[4/3] w-full">
                <img src={allImages[currentImageIndex]} alt={selectedVariant?.name} className="w-full h-full object-contain" />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
                onClick={handlePreviousImage}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
                onClick={handleNextImage}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </section>
  );
};

export default MulchDetail;
