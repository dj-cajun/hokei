import { NextRequest, NextResponse } from "next/server";
import type { PostTopic } from "@/generated/prisma/client";
import { enforcePreset } from "@/lib/api/enforce-rate-limit";
import { getFallbackThumbnail } from "@/lib/news/default-thumbnails";
import { isHttpOrHttpsUrl } from "@/lib/news/image-url";
import {
  fetchImageBytesWithRetry,
  resolveAccessibleImageUrl,
} from "@/lib/news/image";

const TOPICS = new Set<PostTopic>([
  "KOREA",
  "TRAVEL",
  "VIETNAM_POLICY",
  "TOURIST",
]);

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

  const fallback = getFallbackThumbnail(topic);

  if (!imageUrl || !isHttpOrHttpsUrl(imageUrl)) {
    return NextResponse.redirect(fallback);
  }

  const working = await resolveAccessibleImageUrl(imageUrl, sourceUrl, {
    forceRefetch: forceRetry,
  });

  if (!working) {
    return NextResponse.redirect(fallback);
  }

  const fetched = await fetchImageBytesWithRetry(working, sourceUrl);
  if (!fetched) {
    return NextResponse.redirect(fallback);
  }

  return new NextResponse(fetched.body, {
    headers: {
      "Content-Type": fetched.contentType,
      "Cache-Control": forceRetry
        ? "public, max-age=300, stale-while-revalidate=600"
        : "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
