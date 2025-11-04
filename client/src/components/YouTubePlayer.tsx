import React, { useState, useEffect, useRef } from "react";
import { Play, Loader2 } from "lucide-react";
import { Button } from "./ui/button";

interface YouTubePlayerProps {
  videoId: string;
  title?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  start?: number;
  end?: number;
  className?: string;
}

export function YouTubePlayer({
  videoId,
  title = "YouTube Video",
  autoPlay = false,
  muted = true,
  loop = false,
  start,
  end,
  className = "",
}: YouTubePlayerProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Build YouTube URL with parameters
  const buildYouTubeUrl = () => {
    const params = new URLSearchParams();

    if (autoPlay) params.append("autoplay", "1");
    if (muted) params.append("mute", "1");
    if (loop) params.append("loop", "1");
    if (start) params.append("start", start.toString());
    if (end) params.append("end", end.toString());

    // Enable inline playback and JavaScript API for better control
    params.append("playsinline", "1");
    params.append("enablejsapi", "1");
    params.append("origin", window.location.origin);

    return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
  };

  const handleLoad = () => {
    setIsLoaded(true);
    setHasError(false);

    if (autoPlay) {
      setIsPlaying(true);
    }
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(false);
  };

  const handlePlay = () => {
    setIsPlaying(true);
  };

  return (
    <div className={`relative bg-black rounded-lg overflow-hidden ${className}`}>
      {/* Loading State */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-white mx-auto mb-2" />
            <p className="text-white text-sm">Loading video...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-900">
          <div className="text-center p-4">
            <p className="text-white text-sm mb-2">Failed to load video</p>
            <Button
              onClick={() => {
                setHasError(false);
                setIsLoaded(false);
              }}
              variant="outline"
              size="sm"
              className="text-white border-white hover:bg-white hover:text-black"
            >
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* YouTube Embed */}
      <iframe
        ref={iframeRef}
        src={buildYouTubeUrl()}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="w-full h-full aspect-video"
        onLoad={handleLoad}
        onError={handleError}
        style={{ display: isLoaded ? "block" : "none" }}
      />

      {/* Play Overlay for Auto-play Videos */}
      {autoPlay && !isPlaying && isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <Button onClick={handlePlay} className="bg-red-600 hover:bg-red-700 text-white rounded-full w-16 h-16" size="lg">
            <Play className="h-8 w-8" />
          </Button>
        </div>
      )}
    </div>
  );
}

// Helper function to extract video ID from YouTube URLs
export function extractYouTubeVideoId(url: string): string | null {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}



