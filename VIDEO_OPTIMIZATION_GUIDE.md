# 🎥 Video Integration & Optimization Guide

This guide covers both self-hosted videos and YouTube integration with optimal settings for fast loading and beautiful playback.

## 🚀 Video Integration Options

### Option 1: Self-Hosted Videos (Recommended for Control)

**Pros:**

- Complete control over video quality and compression
- No external dependencies
- Better analytics and tracking
- Custom branding and controls

**Cons:**

- Higher hosting costs
- Need to manage video files
- Larger bandwidth usage

### Option 2: YouTube Integration (Recommended for Ease)

**Pros:**

- Free hosting and CDN
- Automatic optimization
- Built-in analytics
- Easy to manage

**Cons:**

- Less control over player
- YouTube branding (unless using API)
- Dependent on YouTube availability

## 📊 Optimal Video Settings

### 🎯 **Resolution & Quality Guidelines**

#### For Web Display:

- **Desktop**: 1920x1080 (1080p) maximum
- **Mobile**: 1280x720 (720p) maximum
- **Thumbnail/Preview**: 640x360 (360p)

#### **File Size Targets:**

- **Hero/Background Video**: 5-15MB (30-60 seconds)
- **Product Demo**: 10-25MB (1-3 minutes)
- **Tutorial/Educational**: 15-50MB (3-10 minutes)

### 🔧 **Compression Settings**

#### **Recommended Codec: H.264**

```bash
# FFmpeg Command for Optimal Web Video
ffmpeg -i input.mp4 \
  -c:v libx264 \
  -preset slow \
  -crf 23 \
  -maxrate 2M \
  -bufsize 4M \
  -c:a aac \
  -b:a 128k \
  -movflags +faststart \
  output.mp4
```

#### **Key Parameters Explained:**

- `crf 23`: Quality setting (18-28 range, 23 is sweet spot)
- `maxrate 2M`: Maximum bitrate (adjust based on resolution)
- `bufsize 4M`: Buffer size (2x maxrate)
- `+faststart`: Enables progressive download
- `preset slow`: Better compression, slower encoding

### 📱 **Multi-Resolution Setup**

Create multiple versions for different devices:

```javascript
// Example video sources for different resolutions
const videoSources = {
  mobile: {
    src: "/videos/hero-mobile.mp4",
    type: "video/mp4",
    resolution: "720p",
    size: "8MB",
  },
  tablet: {
    src: "/videos/hero-tablet.mp4",
    type: "video/mp4",
    resolution: "1080p",
    size: "15MB",
  },
  desktop: {
    src: "/videos/hero-desktop.mp4",
    type: "video/mp4",
    resolution: "1080p",
    size: "25MB",
  },
};
```

## 🎬 Implementation Examples

### 1. Hero Video Background

```tsx
import { VideoPlayer } from "@/components/VideoPlayer";

export function HeroSection() {
  return (
    <section className="relative h-screen overflow-hidden">
      <VideoPlayer
        src="/videos/hero-soil-demo.mp4"
        poster="/images/hero-poster.jpg"
        autoPlay={true}
        muted={true}
        loop={true}
        controls={false}
        className="absolute inset-0 w-full h-full"
      />

      {/* Content Overlay */}
      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-5xl font-bold mb-4">Premium Organic Soil</h1>
          <p className="text-xl mb-8">Transform your garden with our premium blends</p>
          <button className="bg-green-600 text-white px-8 py-3 rounded-lg">Shop Now</button>
        </div>
      </div>
    </section>
  );
}
```

### 2. Product Demo Video

```tsx
import { VideoPlayer } from "@/components/VideoPlayer";

export function ProductDemo() {
  return (
    <div className="max-w-4xl mx-auto">
      <VideoPlayer
        src="/videos/product-demo.mp4"
        poster="/images/product-poster.jpg"
        autoPlay={false}
        muted={false}
        loop={false}
        controls={true}
        className="w-full aspect-video"
      />
    </div>
  );
}
```

### 3. YouTube Integration

```tsx
import { YouTubePlayer } from "@/components/YouTubePlayer";

export function YouTubeDemo() {
  return (
    <div className="max-w-4xl mx-auto">
      <YouTubePlayer
        videoId="dQw4w9WgXcQ" // Replace with your video ID
        title="Organic Soil Tutorial"
        autoPlay={false}
        muted={false}
        loop={false}
        className="w-full aspect-video"
      />
    </div>
  );
}
```

## ⚡ Performance Optimization

### 1. **Lazy Loading**

```tsx
import { useState, useRef, useEffect } from "react";

export function LazyVideo({ src, ...props }) {
  const [isVisible, setIsVisible] = useState(false);
  const videoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={videoRef} className="w-full aspect-video">
      {isVisible ? (
        <VideoPlayer src={src} {...props} />
      ) : (
        <div className="bg-gray-200 animate-pulse rounded-lg h-full flex items-center justify-center">
          <span className="text-gray-500">Loading video...</span>
        </div>
      )}
    </div>
  );
}
```

### 2. **Preload Strategy**

```tsx
// For hero videos (load immediately)
<video preload="auto" ... />

// For other videos (load on demand)
<video preload="metadata" ... />

// For lazy-loaded videos
<video preload="none" ... />
```

### 3. **CDN Integration**

```tsx
// Use CDN URLs for faster delivery
const CDN_BASE = "https://cdn.yoursite.com";

export function OptimizedVideo({ videoPath, ...props }) {
  const src = `${CDN_BASE}${videoPath}`;

  return <VideoPlayer src={src} {...props} />;
}
```

## 📈 Analytics & Tracking

### Video Engagement Tracking

```tsx
import { useAnalytics } from "@/hooks/useAnalytics";

export function TrackedVideo({ src, videoId, ...props }) {
  const { track } = useAnalytics();

  const handlePlay = () => {
    track("video_play", {
      video_id: videoId,
      video_src: src,
      timestamp: new Date().toISOString(),
    });
  };

  const handlePause = () => {
    track("video_pause", {
      video_id: videoId,
      video_src: src,
      timestamp: new Date().toISOString(),
    });
  };

  return <VideoPlayer src={src} onPlay={handlePlay} onPause={handlePause} {...props} />;
}
```

## 🎯 **Recommended Settings by Use Case**

### **Hero/Background Video**

- Resolution: 1920x1080
- Duration: 15-30 seconds
- File Size: 5-10MB
- Format: MP4 (H.264)
- Auto-play: Yes (muted)
- Loop: Yes

### **Product Demo**

- Resolution: 1280x720
- Duration: 1-3 minutes
- File Size: 10-25MB
- Format: MP4 (H.264)
- Auto-play: No
- Loop: No

### **Tutorial/Educational**

- Resolution: 1280x720
- Duration: 3-10 minutes
- File Size: 25-50MB
- Format: MP4 (H.264)
- Auto-play: No
- Loop: No

### **Social Media Integration**

- Use YouTube for easy sharing
- Create shorter versions for different platforms
- Include captions for accessibility

## 🔧 **Technical Implementation**

### Video Upload Handler

```typescript
// server/routes/videoUpload.ts
import multer from "multer";
import ffmpeg from "fluent-ffmpeg";

const upload = multer({ dest: "uploads/videos/" });

app.post("/api/upload-video", upload.single("video"), async (req, res) => {
  try {
    const inputPath = req.file.path;
    const outputDir = "public/videos/";

    // Create optimized versions
    await Promise.all([createVideoVersion(inputPath, outputDir, "mobile", "720p"), createVideoVersion(inputPath, outputDir, "desktop", "1080p")]);

    res.json({ success: true, videoId: generateVideoId() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Video Processing Service

```typescript
async function createVideoVersion(inputPath: string, outputDir: string, version: string, resolution: string) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .size(resolution)
      .videoCodec("libx264")
      .audioCodec("aac")
      .outputOptions(["-preset slow", "-crf 23", "-movflags +faststart"])
      .output(`${outputDir}${version}.mp4`)
      .on("end", resolve)
      .on("error", reject)
      .run();
  });
}
```

## 🎨 **Styling & UX Tips**

### 1. **Responsive Video Container**

```css
.video-container {
  position: relative;
  width: 100%;
  height: 0;
  padding-bottom: 56.25%; /* 16:9 aspect ratio */
}

.video-container video,
.video-container iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
```

### 2. **Loading States**

```tsx
const [isLoading, setIsLoading] = useState(true);

return (
  <div className="relative">
    {isLoading && (
      <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-lg flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )}
    <VideoPlayer onLoadedData={() => setIsLoading(false)} className={isLoading ? "opacity-0" : "opacity-100"} />
  </div>
);
```

### 3. **Accessibility**

```tsx
<VideoPlayer
  src={src}
  poster={poster}
  aria-label="Product demonstration video"
  // Add captions
  // Add keyboard navigation
  // Add screen reader support
/>
```

## 🚀 **Deployment Considerations**

### 1. **CDN Setup**

- Use Cloudflare, AWS CloudFront, or similar
- Enable video compression
- Set appropriate cache headers

### 2. **Server Configuration**

```nginx
# Nginx configuration for video serving
location ~* \.(mp4|webm|ogg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    add_header Vary Accept-Encoding;
}
```

### 3. **Environment Variables**

```bash
# .env
CDN_BASE_URL=https://cdn.yoursite.com
MAX_VIDEO_SIZE=50MB
ALLOWED_VIDEO_FORMATS=mp4,webm,ogg
```

## 📊 **Monitoring & Analytics**

### Key Metrics to Track:

- Video load time
- Play rate (plays/starts)
- Completion rate
- Drop-off points
- Device/browser performance

### Implementation:

```typescript
// Track video performance
const trackVideoMetrics = {
  loadTime: performance.now() - startTime,
  videoSize: videoFile.size,
  format: videoFile.type,
  resolution: videoElement.videoWidth + "x" + videoElement.videoHeight,
};
```

This comprehensive guide should help you implement fast, beautiful videos that enhance your user experience without slowing down your website!
