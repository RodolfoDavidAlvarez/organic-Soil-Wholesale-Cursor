import { useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { OptimizedImage } from "@/components/OptimizedImage";

interface ProductCarouselProps {
  mainImage: string;
  thumbnailImages: string[];
  productName: string;
  productId?: string;
  brandName?: string;
}

const ProductCarousel = ({ mainImage, thumbnailImages, productName, productId, brandName }: ProductCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const allImages = [mainImage, ...thumbnailImages];
  const [, setLocation] = useLocation();

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % allImages.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + allImages.length) % allImages.length);
  };

  const goToProduct = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (productId) {
      setLocation(`/products/${productId}`);
    }
  };

  return (
    <div className="relative w-full">
      {/* Main Image */}
      <div className="relative aspect-[4/3] rounded-lg overflow-hidden mb-4 group">
        <OptimizedImage src={allImages[currentIndex]} alt={`${productName} - Image ${currentIndex + 1}`} className="w-full h-full object-cover" />
        {/* Navigation Buttons */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full"
          onClick={prevSlide}
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full"
          onClick={nextSlide}
        >
          <ChevronRight className="h-6 w-6" />
        </Button>

        {/* View Product Link */}
        {productId && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button 
              variant="secondary" 
              className="bg-white/80 hover:bg-white text-green-700 font-medium shadow-lg flex items-center gap-1"
              onClick={goToProduct}
            >
              <ExternalLink className="h-4 w-4" />
              View Product
            </Button>
          </div>
        )}
      </div>

      {/* Thumbnails */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {allImages.map((image, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`relative flex-shrink-0 w-20 h-20 rounded-md overflow-hidden ${index === currentIndex ? "ring-2 ring-green-500" : ""}`}
          >
            <OptimizedImage src={image} alt={`${productName} thumbnail ${index + 1}`} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProductCarousel;
