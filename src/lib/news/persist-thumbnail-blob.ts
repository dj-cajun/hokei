import { put } from "@vercel/blob";
import { randomUUID } from "crypto";
import { MAX_IMAGE_BYTES } from "@/lib/constants";
import { assertAllowedUpload } from "@/lib/file-sniff";
import { fetchImageBytesWithRetry } from "@/lib/news/image";
import { imageUrlVariants } from "@/lib/news/image-url";
import { isBlobStorageEnabled } from "@/lib/upload-blob";

export function isNewsThumbnailBlobUrl(url: string | null | undefined): boolean {
  const trimmed = url?.trim() ?? "";
  return trimmed.includes("blob.vercel-storage.com");
}

function extFromMime(mime: string): string {
  switch (mime) {
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "image/gif":
      return ".gif";
    default:
      return ".jpg";
  }
}

/**
 * 외부 썸네일 URL → Vercel Blob 복사 (ingest 시 1회)
 * 실패 시 null — 호출부에서 원본 CDN URL 폴백
 */
export async function persistNewsThumbnailToBlob(
  imageUrl: string,
  articleUrl: string
): Promise<string | null> {
  if (!isBlobStorageEnabled()) return null;

  const trimmed = imageUrl.trim();
  if (isNewsThumbnailBlobUrl(trimmed)) return trimmed;

  for (const variant of imageUrlVariants(trimmed)) {
    const fetched = await fetchImageBytesWithRetry(variant, articleUrl);
    if (!fetched || fetched.body.byteLength < 200) continue;
    if (fetched.body.byteLength > MAX_IMAGE_BYTES) continue;

    const buffer = Buffer.from(fetched.body);
    let mimeType: string;
    try {
      ({ mimeType } = assertAllowedUpload(buffer, fetched.contentType));
    } catch {
      continue;
    }

    const subDir = new Date().toISOString().slice(0, 7);
    const pathname = `news/thumbnails/${subDir}/${randomUUID()}${extFromMime(mimeType)}`;

    try {
      const blob = await put(pathname, buffer, {
        access: "public",
        contentType: mimeType,
        addRandomSuffix: false,
      });
      return blob.url;
    } catch {
      continue;
    }
  }

  return null;
}
