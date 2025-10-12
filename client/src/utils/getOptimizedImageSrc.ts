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
  const fallback = getOriginalImageSrc(source);

  if (optimized) {
    return queryPart ? `${optimized}?${queryPart}` : optimized;
  }

  return fallback;
};
