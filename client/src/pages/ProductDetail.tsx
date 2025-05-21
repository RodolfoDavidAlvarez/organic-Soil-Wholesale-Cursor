import { useState, useEffect } from "react";
import { Link, useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, CheckCircle, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { getProductByIndex } from "@/data/productData";
import { Badge } from "@/components/ui/badge";

// Size category images and labels from adminInputs.txt
const SIZE_CATEGORIES = [
  {
    name: "Pallet of Boxes",
    description: "144 units / 36 boxes",
    image:
      "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/SSWwholesale.com%2FSize%20Categories%2FSize%20Categories-%20Pallet%20of%20Box.png?alt=media&token=730d72a2-62b1-4a53-bd67-426f7224772e",
  },
  {
    name: "Pallet of Bags",
    description: "50 bags (1cf Bags)",
    image:
      "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/SSWwholesale.com%2FSize%20Categories%2FSize%20Category%20-%20pallet%20of%20bags.png?alt=media&token=4ff026e5-7318-4c35-869a-a1bc0a3ff94d",
  },
  {
    name: "Bulk",
    description: "22-24 tons per truckload",
    image:
      "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/SSWwholesale.com%2FSize%20Categories%2FBulk%20delivery.png?alt=media&token=5c59cabf-aa01-4745-9026-51ee7ab8f195",
  },
];

const ProductDetail = () => {
  const [, params] = useRoute("/products/:index");
  const [, navigate] = useLocation();
  const productIndex = params && (params as any).index ? parseInt((params as any).index) : undefined;
  const [product, setProduct] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  useEffect(() => {
    const loadProductData = async () => {
      if (typeof productIndex !== "number" || isNaN(productIndex)) {
        setError(true);
        setIsLoading(false);
        return;
      }
      try {
        const foundProduct = await getProductByIndex(productIndex);
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
  }, [productIndex]);

  const allImages: string[] = [...(product?.additionalImages || []), ...(product?.imageUrl ? [product.imageUrl] : [])];

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
        ) : product ? (
          <div className="flex flex-col lg:flex-row">
            {/* Product Images */}
            <div className="lg:w-1/2 lg:pr-12 mb-10 lg:mb-0">
              <div className="bg-neutral-50 p-4 rounded-xl">
                <div className="relative w-full h-[400px] rounded-lg overflow-hidden cursor-pointer" onClick={() => setIsGalleryOpen(true)}>
                  <img src={allImages[currentImageIndex]} alt={product.name} className="w-full h-full object-cover" />
                </div>
                <div className="grid grid-cols-4 gap-2 mt-4">
                  {allImages.map((image, index) => (
                    <div
                      key={index}
                      className={`relative h-20 rounded-md overflow-hidden cursor-pointer ${currentImageIndex === index ? "ring-2 ring-primary" : ""}`}
                      onClick={() => handleThumbnailClick(index)}
                    >
                      <img src={image} alt={`${product.name} - Image ${index + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Product Information */}
            <div className="lg:w-1/2">
              <div className="mb-4">
                <Badge variant="outline" className="text-primary border-primary">
                  {product.category}
                </Badge>
              </div>
              <h1 className="text-3xl font-bold mb-2">{product.productType || product.name}</h1>
              <p className="text-lg text-neutral-600 mb-6">{product.description}</p>
              {/* Available Sizes */}
              <div className="mb-8">
                <h3 className="text-sm font-medium mb-3">Available Sizes</h3>
                <div className="grid grid-cols-3 gap-4">
                  {SIZE_CATEGORIES.map((cat) => (
                    <div key={cat.name} className="rounded-lg border overflow-hidden">
                      <img src={cat.image} alt={cat.name} className="w-full h-32 object-cover" />
                      <div className="p-2 text-center">
                        <div className="font-semibold">{cat.name}</div>
                        <div className="text-xs text-neutral-600">{cat.description}</div>
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
                      <p>{product.story}</p>
                      <h4 className="mt-4">Target Audience</h4>
                      <p>{product.targetAudience}</p>
                      <h4 className="mt-4">Recommended Uses</h4>
                      <p>{product.recommendedUses}</p>
                    </div>
                  </TabsContent>
                  <TabsContent value="usage" className="mt-6">
                    <div className="prose max-w-none">
                      <h4>Usage Instructions</h4>
                      <p>{product.usage}</p>
                    </div>
                  </TabsContent>
                  <TabsContent value="ingredients" className="mt-6">
                    <div className="prose max-w-none">
                      <h4>Ingredients</h4>
                      <p>{product.ingredients}</p>
                    </div>
                  </TabsContent>
                  <TabsContent value="certifications" className="mt-6">
                    <div className="prose max-w-none">
                      <h4>Certifications</h4>
                      <p>{product.certifications}</p>
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
        ) : null}
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
                <img src={allImages[currentImageIndex]} alt={product?.name} className="w-full h-full object-contain" />
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

export default ProductDetail;
