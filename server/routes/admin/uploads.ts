import path from "path";
import { Router } from "express";
import multer from "multer";

import { supabase } from "../../supabaseClient";
import { tempAdminAuthMiddleware, type AdminRequest } from "../../middleware/tempAdminAuth";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
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

router.use(tempAdminAuthMiddleware);

router.post(
  "/product-image",
  upload.single("image"),
  async (req: AdminRequest, res) => {
    try {
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: "No image provided" });
      }

      if (!file.mimetype.startsWith("image/")) {
        return res.status(400).json({ error: "Only image uploads are allowed" });
      }

      const rawFolder =
        typeof req.body.folder === "string" && req.body.folder.trim().length > 0
          ? req.body.folder
          : "products";
      const folder = sanitizeSegment(rawFolder);

      const extension = ensureExtension(file.originalname, file.mimetype);
      const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const filename = `${uniqueId}${extension}`;
      const objectPath = path.posix.join(folder, filename);

      // Try Supabase first, fall back to local storage
      try {
        const { error: uploadError } = await supabase.storage.from(bucketName).upload(objectPath, file.buffer, {
          contentType: file.mimetype,
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
      fs.writeFileSync(localFilePath, file.buffer);

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
  }
);

export default router;
