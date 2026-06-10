import { NextRequest, NextResponse } from "next/server";
import type { PostTopic } from "@/generated/prisma/client";
import { enforcePreset } from "@/lib/api/enforce-rate-limit";
import { getFallbackThumbnail } from "@/lib/news/default-thumbnails";
import { isHttpOrHttpsUrl } from "@/lib/news/image-url";
import { fetchImageBytesWithRetry } from "@/lib/news/image";
import { isNewsThumbnailBlobUrl } from "@/lib/news/persist-thumbnail-blob";
import { readStaticFallbackBytes } from "@/lib/news/static-fallback-bytes";

const TOPICS = new Set<PostTopic>([
  "KOREA",
  "TRAVEL",
  "VIETNAM_POLICY",
  "TOURIST",
]);

const IMAGE_CACHE = "public, max-age=3600, stale-while-revalidate=86400";
const STATIC_FALLBACK_CACHE =
  "public, max-age=86400, stale-while-revalidate=604800";

function topicFallbackResponse(
  topic: PostTopic,
  request: NextRequest
): NextResponse {
  const staticBytes = readStaticFallbackBytes(topic);
  if (staticBytes) {
    return new NextResponse(new Uint8Array(staticBytes.body), {
      headers: {
        "Content-Type": staticBytes.contentType,
        "Cache-Control": STATIC_FALLBACK_CACHE,
      },
    });
  }

  const staticPath = getFallbackThumbnail(topic);
  return NextResponse.redirect(new URL(staticPath, request.url));
}

function imageBytesResponse(
  body: ArrayBuffer,
  contentType: string,
  retry: boolean
): NextResponse {
  return new NextResponse(body, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": retry
        ? "public, max-age=300, stale-while-revalidate=600"
        : IMAGE_CACHE,
    },
  });
}

export async function GET(request: NextRequest) {
  const limited = await enforcePreset(request, "general");
  if (limited) return limited;

  const imageUrl = request.nextUrl.searchParams.get("url");
  const sourceUrl = request.nextUrl.searchParams.get("source") ?? undefined;
  const topicParam = request.nextUrl.searchParams.get("topic");
  const forceRetry = request.nextUrl.searchParams.get("retry") === "1";
  const topic = TOPICS.has(topicParam as PostTopic)
    ? (topicParam as PostTopic)
    : "KOREA";

  if (!imageUrl || !isHttpOrHttpsUrl(imageUrl)) {
    return topicFallbackResponse(topic, request);
  }

  if (isNewsThumbnailBlobUrl(imageUrl)) {
    const blobFetched = await fetchImageBytesWithRetry(imageUrl, sourceUrl);
    if (blobFetched) {
      return imageBytesResponse(
        blobFetched.body,
        blobFetched.contentType,
        forceRetry
      );
    }
    return topicFallbackResponse(topic, request);
  }

  for (const attempt of forceRetry ? [0, 1] : [0]) {
    if (attempt === 1 && sourceUrl) {
      const { fetchArticleThumbnail } = await import("@/lib/news/image");
      const fresh = await fetchArticleThumbnail(sourceUrl);
      if (fresh) {
        const refetched = await fetchImageBytesWithRetry(fresh, sourceUrl);
        if (refetched) {
          return imageBytesResponse(
            refetched.body,
            refetched.contentType,
            forceRetry
          );
        }
      }
    }

    const fetched = await fetchImageBytesWithRetry(imageUrl, sourceUrl);
    if (fetched) {
      return imageBytesResponse(fetched.body, fetched.contentType, forceRetry);
    }
  }

  return topicFallbackResponse(topic, request);
}
