import { cleanArticleBody } from "@/lib/news/article-body-clean";
import {
  fetchArticleBody,
  isBodyLikelyMatchingTitle,
} from "@/lib/news/article-body";
import { resolveAutomatedNewsThumbnail } from "@/lib/news/resolve-post-thumbnail";
import { isMostlyKorean } from "@/lib/news/language";
import { processNewsArticle } from "@/lib/news/translate";
import { NEWS_MIN_BODY_LENGTH } from "@/lib/news/news-body-quality";
import type { RawNewsItem } from "@/lib/news/rss";

/** 검색 요약이 아닌 원문 페이지 본문·제목으로 게시글 필드 결정 */
export async function buildPostFromArticlePage(
  raw: Pick<
    RawNewsItem,
    "title" | "link" | "topic" | "sourceName" | "thumbnail"
  >
): Promise<{ title: string; content: string | null; thumbnail: string }> {
  const article = await fetchArticleBody(raw.link);

  let title = raw.title.trim();
  let content = "";

  if (article?.content) {
    content = cleanArticleBody(article.content);
  }

  if (content.length >= NEWS_MIN_BODY_LENGTH && article) {
    const scrapedTitle = article.title?.trim();
    if (
      scrapedTitle &&
      scrapedTitle.length > 4 &&
      isBodyLikelyMatchingTitle(scrapedTitle, content)
    ) {
      title = scrapedTitle;
    }
  }

  if (content && !isMostlyKorean(content)) {
    const processed = await processNewsArticle(title, content, raw.topic, {
      link: raw.link,
      sourceName: raw.sourceName,
    });
    title = processed.title;
    content = processed.description;
  } else if (!content && !isMostlyKorean(title)) {
    const processed = await processNewsArticle(title, title, raw.topic, {
      link: raw.link,
      sourceName: raw.sourceName,
    });
    title = processed.title;
  }

  const thumbnail = await resolveAutomatedNewsThumbnail({
    topic: raw.topic,
    link: raw.link,
    rssDescription: raw.description,
    rssThumbnail: raw.thumbnail,
    scrapedImg: article?.img,
  });

  const body =
    content.length >= NEWS_MIN_BODY_LENGTH ? content.slice(0, 15_000) : null;

  return { title: title.trim(), content: body, thumbnail };
}
