import sharp from "sharp";

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: "jpeg" | "webp" | "png";
  convertToWebP?: boolean;
}

export interface OptimizedImageResult {
  buffer: Buffer;
  format: string;
  width: number;
  height: number;
  size: number;
  originalSize: number;
  compressionRatio: number;
}

/**
 * Optimizes an image buffer for web use
 *
 * Best practices:
 * - Product images: max 1920px width, quality 85, WebP format
 * - Thumbnails: max 400px width, quality 80, WebP format
 * - Target file size: < 500KB for product images, < 100KB for thumbnails
 */
export async function optimizeImage(inputBuffer: Buffer, options: ImageOptimizationOptions = {}): Promise<OptimizedImageResult> {
  const { maxWidth = 1920, maxHeight = 1920, quality = 85, format, convertToWebP = true } = options;

  const originalSize = inputBuffer.length;
  let sharpInstance = sharp(inputBuffer);

  // Get image metadata
  const metadata = await sharpInstance.metadata();
  const originalWidth = metadata.width || 0;
  const originalHeight = metadata.height || 0;

  // Determine if resizing is needed
  const needsResize = originalWidth > maxWidth || originalHeight > maxHeight;

  if (needsResize) {
    sharpInstance = sharpInstance.resize(maxWidth, maxHeight, {
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  // Determine output format
  let outputFormat: "jpeg" | "webp" | "png" = format || "jpeg";

  if (convertToWebP && metadata.format !== "gif") {
    // Convert to WebP for better compression (except GIFs which should stay animated)
    outputFormat = "webp";
  } else if (metadata.format === "png" && !format) {
    // Keep PNG if original was PNG and no format specified (preserves transparency)
    outputFormat = "png";
  }

  // Apply format-specific optimizations
  let optimizedBuffer: Buffer;

  switch (outputFormat) {
    case "webp":
      optimizedBuffer = await sharpInstance
        .webp({ quality, effort: 6 }) // effort 6 = good balance of speed/compression
        .toBuffer();
      break;
    case "png":
      optimizedBuffer = await sharpInstance
        .png({
          quality,
          compressionLevel: 9, // Maximum compression
          adaptiveFiltering: true,
        })
        .toBuffer();
      break;
    case "jpeg":
    default:
      optimizedBuffer = await sharpInstance
        .jpeg({
          quality,
          mozjpeg: true, // Use mozjpeg for better compression
          progressive: true, // Progressive JPEG for better perceived performance
        })
        .toBuffer();
      break;
  }

  // Get final dimensions
  const finalMetadata = await sharp(optimizedBuffer).metadata();
  const finalWidth = finalMetadata.width || originalWidth;
  const finalHeight = finalMetadata.height || originalHeight;

  const compressionRatio = ((originalSize - optimizedBuffer.length) / originalSize) * 100;

  return {
    buffer: optimizedBuffer,
    format: outputFormat,
    width: finalWidth,
    height: finalHeight,
    size: optimizedBuffer.length,
    originalSize,
    compressionRatio,
  };
}

/**
 * Optimizes image specifically for product gallery/hero images
 * Targets: 1920px max width, WebP format, < 500KB file size
 */
export async function optimizeProductImage(inputBuffer: Buffer): Promise<OptimizedImageResult> {
  return optimizeImage(inputBuffer, {
    maxWidth: 1920,
    maxHeight: 1920,
    quality: 85,
    convertToWebP: true,
  });
}

/**
 * Optimizes image for thumbnails
 * Targets: 400px max width, WebP format, < 100KB file size
 */
export async function optimizeThumbnail(inputBuffer: Buffer): Promise<OptimizedImageResult> {
  return optimizeImage(inputBuffer, {
    maxWidth: 400,
    maxHeight: 400,
    quality: 80,
    convertToWebP: true,
  });
}


