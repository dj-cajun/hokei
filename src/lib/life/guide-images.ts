const MAX_LIFE_GUIDE_IMAGES = 10;

export function normalizeLifeGuideImageUrls(input: {
  imageUrl?: string | null;
  imageUrls?: unknown;
}): string[] {
  const fromJson = parseImageUrlsJson(input.imageUrls);
  if (fromJson.length > 0) return fromJson.slice(0, MAX_LIFE_GUIDE_IMAGES);

  const single = input.imageUrl?.trim();
  return single ? [single] : [];
}

function parseImageUrlsJson(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((url) => url.trim())
    .filter((url) => url.length > 0 && /^https?:\/\//i.test(url));
}

export function toLifeGuideImageFields(urls: string[]): {
  imageUrl: string | null;
  imageUrls: string[] | undefined;
} {
  const cleaned = urls
    .map((url) => url.trim())
    .filter((url) => url.length > 0)
    .slice(0, MAX_LIFE_GUIDE_IMAGES);

  if (cleaned.length === 0) {
    return { imageUrl: null, imageUrls: undefined };
  }

  return {
    imageUrl: cleaned[0]!,
    imageUrls: cleaned.length > 1 ? cleaned : undefined,
  };
}
