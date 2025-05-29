import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageCarouselProps {
  images: {
    url: string;
    alt: string;
  }[];
  autoPlay?: boolean;
  interval?: number;
  aspectRatio?: "square" | "video" | "auto";
}

const ImageCarousel = ({ images, autoPlay = true, interval = 5000, aspectRatio = "video" }: ImageCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState<{ [key: number]: boolean }>({});

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };

  useEffect(() => {
    if (!autoPlay) return;

    const timer = setInterval(nextSlide, interval);
    return () => clearInterval(timer);
  }, [autoPlay, interval]);

  const aspectRatioClasses = {
    square: "aspect-square",
    video: "aspect-video",
    auto: "aspect-auto",
  };

  return (
    <div className={`relative w-full overflow-hidden rounded-xl ${aspectRatioClasses[aspectRatio]}`}>
      {/* Images */}
      <div className="relative w-full h-full">
        {images.map((image, index) => (
          <div key={index} className={`absolute inset-0 transition-opacity duration-500 ${index === currentIndex ? "opacity-100" : "opacity-0"}`}>
            {!isLoaded[index] && <div className="absolute inset-0 bg-neutral-200 animate-pulse" />}
            <img
              src={image.url}
              alt={image.alt}
              className="w-full h-full object-cover"
              loading="lazy"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 60vw"
              onLoad={() => setIsLoaded((prev) => ({ ...prev, [index]: true }))}
            />
          </div>
        ))}
      </div>

      {/* Navigation Buttons */}
      {images.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-primary rounded-full shadow-lg transition-all duration-300 hover:scale-110"
            onClick={prevSlide}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-primary rounded-full shadow-lg transition-all duration-300 hover:scale-110"
            onClick={nextSlide}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </>
      )}

      {/* Dots Indicator */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
          {images.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentIndex ? "bg-primary w-4" : "bg-white/50 hover:bg-white/80"
              }`}
              onClick={() => setCurrentIndex(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageCarousel;
