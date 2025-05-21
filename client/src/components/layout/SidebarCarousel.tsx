import { useState, useEffect } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageCarouselProps {
  images: {
    url: string;
    alt: string;
  }[];
  autoPlay?: boolean;
  interval?: number;
}

const SidebarCarousel = ({ images, autoPlay = true, interval = 5000 }: ImageCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const nextSlide = () => {
    setIsTransitioning(true);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const prevSlide = () => {
    setIsTransitioning(true);
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  useEffect(() => {
    if (!autoPlay) return;

    const timer = setInterval(nextSlide, interval);
    return () => clearInterval(timer);
  }, [autoPlay, interval]);

  // Function to extract and format title from URL
  const getTitleFromUrl = (url: string) => {
    try {
      // Extract the filename from the URL
      const filename = url.split("/").pop()?.split("?")[0] || "";
      // Remove file extension and decode URL
      const decodedName = decodeURIComponent(filename.split(".")[0]);
      // Replace hyphens and underscores with spaces
      const formattedName = decodedName.replace(/[-_]/g, " ");
      // Capitalize first letter of each word
      return formattedName
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    } catch (error) {
      return "Image";
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white shadow-lg rounded-xl overflow-hidden">
      {/* Images */}
      <div className="relative w-full aspect-[4/3]">
        {images.map((image, index) => (
          <div
            key={index}
            className={`absolute w-full h-full transition-opacity duration-500 ${index === currentIndex ? "opacity-100" : "opacity-0"}`}
          >
            <img src={image.url} alt={image.alt} className="w-full h-full object-cover" />
          </div>
        ))}
      </div>

      {/* Image Title with Enhanced Styling */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 transition-all duration-500 ${
          isTransitioning ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
        }`}
      >
        <div className="max-w-[90%] mx-auto">
          <h3 className="text-white text-xl font-bold mb-1 tracking-tight">{getTitleFromUrl(images[currentIndex].url)}</h3>
          <div className="h-1 w-16 bg-primary/80 rounded-full"></div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-1/2 -translate-x-1/2 top-4 bg-white/90 hover:bg-white text-primary rounded-full shadow-lg transition-all duration-300 hover:scale-110"
        onClick={prevSlide}
      >
        <ChevronUp className="h-6 w-6" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-1/2 -translate-x-1/2 bottom-4 bg-white/90 hover:bg-white text-primary rounded-full shadow-lg transition-all duration-300 hover:scale-110"
        onClick={nextSlide}
      >
        <ChevronDown className="h-6 w-6" />
      </Button>

      {/* Dots Indicator */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col space-y-2">
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
    </div>
  );
};

export default SidebarCarousel;
