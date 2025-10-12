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

  const [pathPart, queryPart] = source.split("?", 2);
  const normalizedPath = normalizeKey(pathPart);
  const optimized = normalizedMap.get(normalizedPath);
  
  // If we have an optimized version, use it
  if (optimized) {
    return queryPart ? `${optimized}?${queryPart}` : optimized;
  }
  
  // For images that should be in the optimized directory but aren't in the map,
  // try to find them by normalizing the name
  const cleanedName = pathPart.trim().replace(/^\/+/, "");
  const baseName = cleanedName.toLowerCase()
    .replace(/\.(jpg|jpeg|png)$/i, "")
    .replace(/\s+/g, "-")
    .replace(/[()]/g, "");
  const optimizedPath = `/images/optimized/${baseName}.jpg`;
  
  // Return the optimized path as a fallback, which will trigger the error handler
  // in OptimizedImage if it doesn't exist
  return optimizedPath;
};
