import { NextResponse } from "next/server";
import {
  getFallbackThumbnail,
  isFallbackThumbnailUrl,
} from "@/lib/news/default-thumbnails";
import { formatPostSourceLabel } from "@/lib/news/source-display";
import { isCommunityPost } from "@/lib/community";
import { getPostById } from "@/lib/posts";
import { resolveSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  return request.headers.get("x-cron-secret") === secret;
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const id =
    new URL(request.url).searchParams.get("id") ??
    "cmqcnt4430000h4h7o4n0k0hn";

  const steps: Record<string, unknown> = {};

  try {
    const post = await getPostById(id, { includeHiddenComments: false });
    steps.fetch = { found: Boolean(post) };
    if (!post) return NextResponse.json({ ok: false, steps });

    steps.moderation = post.moderationStatus;
    steps.community = isCommunityPost(post.sourceUrl);

    const description = (post.content ?? post.title)
      .replace(/\n/g, " ")
      .slice(0, 160);
    steps.description = description.length;

    const ogImage =
      post.thumbnail?.trim() && !isFallbackThumbnailUrl(post.thumbnail)
        ? post.thumbnail
        : getFallbackThumbnail(post.topic);
    steps.ogImage = ogImage;

    steps.dateLabel = post.publishedAt.toLocaleString("ko-KR", {
      timeZone: "Asia/Ho_Chi_Minh",
    });

    steps.sourceLabel = formatPostSourceLabel(post.sourceName);
    steps.category = post.category.label;
    steps.parent = post.category.parent?.label ?? null;

    const siteUrl = resolveSiteUrl();
    const jsonLd = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title,
      url: `${siteUrl}/posts/${post.id}`,
      datePublished: post.publishedAt.toISOString(),
      image: post.thumbnail ? [post.thumbnail] : [`${siteUrl}/icons/hokei-icon-512.png`],
    });
    steps.jsonLdLen = jsonLd.length;
    steps.comments = post.comments.length;

    return NextResponse.json({ ok: true, steps });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json(
      {
        ok: false,
        steps,
        error: err.message,
        stack: err.stack?.split("\n").slice(0, 10),
      },
      { status: 500 }
    );
  }
}
