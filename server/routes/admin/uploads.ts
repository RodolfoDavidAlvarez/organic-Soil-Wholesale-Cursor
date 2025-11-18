import path from "path";
import { Router } from "express";
import multer from "multer";

import { supabase } from "../../supabaseClient";
import { adminAuthMiddleware, type AdminRequest } from "../../middleware/adminAuth";
import { optimizeProductImage, type OptimizedImageResult } from "../../utils/imageOptimizer";

const router = Router();

// Increased limit to 20MB to allow high-quality originals
// Images will be automatically optimized to < 500KB on upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB (will be optimized down)
  },
});

const bucketName = process.env.SUPABASE_PRODUCT_IMAGES_BUCKET || "product-images";

// Local file system fallback
import fs from "fs";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ensureUploadDir = () => {
  const uploadDir = path.join(__dirname, "../../../client/public/uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  return uploadDir;
};

const sanitizeSegment = (segment: string) =>
  segment
    .split("/")
    .map((piece) =>
      piece
        .trim()
        .replace(/[^a-zA-Z0-9_\-]/g, "-")
        .replace(/-+/g, "-")
    )
    .filter(Boolean)
    .join("/");

const ensureExtension = (filename: string, mimetype: string) => {
  const extFromName = path.extname(filename);
  if (extFromName) {
    return extFromName;
  }

  switch (mimetype) {
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "image/gif":
      return ".gif";
    case "image/jpeg":
    case "image/jpg":
    default:
      return ".jpg";
  }
};

router.use(adminAuthMiddleware);

router.post("/product-image", (req: AdminRequest, res) => {
  upload.single("image")(req as any, res as any, async (err: unknown) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res
          .status(413)
          .json({ error: "That file is too large. Please upload an image under 20 MB. It will be automatically optimized for fast loading." });
      }
      return res.status(400).json({ error: err.message });
    }

    if (err instanceof Error) {
      return res.status(400).json({ error: err.message });
    }

    try {
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: "No image provided" });
      }

      if (!file.mimetype.startsWith("image/")) {
        return res.status(400).json({ error: "Only image uploads are allowed" });
      }

      const rawFolder = typeof req.body.folder === "string" && req.body.folder.trim().length > 0 ? req.body.folder : "products";
      const folder = sanitizeSegment(rawFolder);

      // Optimize image before upload
      let optimizedImage: OptimizedImageResult;
      let uploadBuffer: Buffer;
      let uploadMimeType: string;
      let uploadExtension: string;

      try {
        console.log(`Optimizing image: ${file.originalname} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
        optimizedImage = await optimizeProductImage(file.buffer);

        uploadBuffer = optimizedImage.buffer;
        uploadMimeType = `image/${optimizedImage.format}`;
        uploadExtension = `.${optimizedImage.format}`;

        const compressionInfo = `Optimized: ${(optimizedImage.originalSize / 1024 / 1024).toFixed(2)} MB → ${(optimizedImage.size / 1024 / 1024).toFixed(2)} MB (${optimizedImage.compressionRatio.toFixed(1)}% reduction)`;
        console.log(compressionInfo);
      } catch (optimizationError) {
        console.error("Image optimization failed, using original:", optimizationError);
        // Fallback to original if optimization fails
        uploadBuffer = file.buffer;
        uploadMimeType = file.mimetype;
        uploadExtension = ensureExtension(file.originalname, file.mimetype);
      }

      const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const filename = `${uniqueId}${uploadExtension}`;
      const objectPath = path.posix.join(folder, filename);

      // Try Supabase first, fall back to local storage
      try {
        const { error: uploadError } = await supabase.storage.from(bucketName).upload(objectPath, uploadBuffer, {
          contentType: uploadMimeType,
          cacheControl: "3600",
          upsert: false,
        });

        if (!uploadError) {
          const {
            data: { publicUrl },
          } = supabase.storage.from(bucketName).getPublicUrl(objectPath);

          return res.status(201).json({
            url: publicUrl,
            path: objectPath,
            bucket: bucketName,
          });
        }

        console.warn("Supabase upload failed, falling back to local storage:", uploadError.message);
      } catch (supabaseError) {
        console.warn("Supabase unavailable, using local storage:", supabaseError.message);
      }

      // Fallback to local file system
      const uploadDir = ensureUploadDir();
      const folderPath = path.join(uploadDir, folder);

      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      const localFilePath = path.join(folderPath, filename);
      fs.writeFileSync(localFilePath, uploadBuffer);

      // Return local URL
      const localUrl = `/uploads/${folder}/${filename}`;

      return res.status(201).json({
        url: localUrl,
        path: `uploads/${folder}/${filename}`,
        bucket: "local",
      });
    } catch (error) {
      console.error("Upload route error:", error);
      return res.status(500).json({ error: "Unexpected error while uploading image" });
    }
  });
});

export default router;
