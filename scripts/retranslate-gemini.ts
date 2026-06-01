import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { isMostlyKorean } from "../src/lib/news/language";
import { translateWithGemini } from "../src/lib/news/gemini-translate";
import { isGeminiConfigured } from "../src/lib/ai/gemini";
import type { PostTopic } from "../src/generated/prisma/client";

async function main() {
  if (!isGeminiConfigured()) {
    console.error("GEMINI_API_KEY가 .env에 없습니다.");
    process.exit(1);
  }

  const posts = await prisma.post.findMany({
    where: { status: "PUBLISHED", isAutomated: true },
    orderBy: { ingestedAt: "desc" },
  });

  let updated = 0;
  for (const post of posts) {
    if (isMostlyKorean(post.title)) continue;

    const rawTitle =
      post.originalTitle ??
      post.title.replace(/^\[[^\]]+\]\s*(?:VnExpress\s*·\s*)?/i, "");
    const translated = await translateWithGemini(
      rawTitle,
      post.content ?? post.summary,
      post.topic as PostTopic
    );

    const finalTitle = translated.title;
    await prisma.post.update({
      where: { id: post.id },
      data: {
        originalTitle: post.originalTitle ?? rawTitle,
        title: finalTitle,
        content: translated.description,
        summary: "",
      },
    });
    updated++;
    console.log("업데이트:", translated.title.slice(0, 60));
  }

  console.log(JSON.stringify({ updated, total: posts.length }, null, 2));
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
