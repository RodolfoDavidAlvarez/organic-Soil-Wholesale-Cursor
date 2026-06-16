import optimizedImages from "@/data/optimizedImages.json";

const normalizedMap = new Map<string, string>();

const normalizeKey = (key: string) => {
  const trimmed = key.trim().replace(/^\/+/, "");
  let decoded = trimmed;
  try {
    decoded = decodeURIComponent(trimmed);
  } catch {
    // ignore decode errors and keep original
  }
  const singleSpaced = decoded.replace(/\s+/g, " ");
  return singleSpaced.toLowerCase();
};

Object.entries(optimizedImages).forEach(([originalKey, optimizedValue]) => {
  const normalized = normalizeKey(originalKey);
  if (!normalizedMap.has(normalized)) {
    normalizedMap.set(normalized, optimizedValue);
  }
});

const isExternalSource = (value: string) => /^(?:https?:)?\/\//i.test(value) || value.startsWith("data:");

export const getOriginalImageSrc = (source?: string | null) => {
  if (!source) return "";

  if (isExternalSource(source)) return source;

  const [pathPart, queryPart] = source.split("?", 2);
  const cleaned = pathPart.trim().replace(/^\/+/, "");
  const rebuilt = `/${cleaned}`;

  return queryPart ? `${rebuilt}?${queryPart}` : rebuilt;
};

export const getOptimizedImageSrc = (source?: string | null) => {
  if (!source) return "";

  if (isExternalSource(source)) return source;

  // Handle new upload paths - return as-is
  if (source.startsWith('/uploads/')) {
    return source;
  }

  // Handle paths that already start with /images/optimized/
  if (source.startsWith('/images/optimized/')) {
    return source;
  }

  const [pathPart, queryPart] = source.split("?", 2);
  const normalizedPath = normalizeKey(pathPart);
  const optimized = normalizedMap.get(normalizedPath);
  
  // If we have an optimized version, use it
  if (optimized) {
    return queryPart ? `${optimized}?${queryPart}` : optimized;
  }
  
  // For bare filenames, try to find them in the optimized images map
  const filename = pathPart.trim().replace(/^\/+/, "");
  const filenameNormalized = normalizeKey(filename);
  const optimizedByFilename = normalizedMap.get(filenameNormalized);
  
  if (optimizedByFilename) {
    return queryPart ? `${optimizedByFilename}?${queryPart}` : optimizedByFilename;
  }

  // Keep explicit public asset paths intact. Size/category images are not always
  // represented in optimizedImages.json, and inventing an optimized path creates
  // invalid URLs such as /images/optimized/images/sizes/....
  if (filename.includes("/")) {
    return getOriginalImageSrc(source);
  }
  
  // Fallback: try to construct optimized path
  const baseName = filename.toLowerCase()
    .replace(/\.(jpg|jpeg|png)$/i, "")
    .replace(/\s+/g, "-")
    .replace(/[()]/g, "");
  const optimizedPath = `/images/optimized/${baseName}.jpg`;
  
  return optimizedPath;
};
