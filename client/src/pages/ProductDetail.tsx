import { useState, useEffect } from "react";
import { Link, useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, CheckCircle, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { getProductByIndex, getProductsData } from "@/data/productData";
import { Badge } from "@/components/ui/badge";
import SEO from "@/components/layout/SEO";

// Size category images and labels from adminInputs.txt
const SIZE_CATEGORIES = [
  {
    name: "Pallet of 9 lb bags",
    description: "144 units (36 cases of 4 units)",
    image:
      "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/Product%20Texture%2FSize%20Categories%2FSize%20Categories-%20Pallet%20of%20Box.png?alt=media&token=319faa6b-499b-47db-9119-1a982e31ec89",
  },
  {
    name: "Pallet of 1CF bags",
    description: "50 bags (1CF each)",
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
    description: "Cubic yards (Dairy compost only)",
    image:
      "https://firebasestorage.googleapis.com/v0/b/whysoilmatters-1c40b.firebasestorage.app/o/Product%20Texture%2FSize%20Categories%2FCY%20of%20Bulk%20for%20pick%20only.png?alt=media&token=ea70e2e7-638f-47fb-9f7d-cad9ac48fabc",
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
          title={product.productType || product.name}
          description={`Wholesale ${product.name} available in bulk quantities for commercial applications. ${product.description || ''}`}
          keywords={`wholesale ${product.name.toLowerCase()}, bulk ${product.name.toLowerCase()}, commercial ${product.name.toLowerCase()}, ${product.category.toLowerCase()} wholesale, organic soil wholesale, ${product.ingredients ? product.ingredients.toLowerCase() + ',' : ''} bulk soil delivery, commercial soil supplier`}
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
