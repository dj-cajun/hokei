import "dotenv/config";
import { isGeminiConfigured } from "../src/lib/ai/gemini";
import { translateWithGemini } from "../src/lib/news/gemini-translate";

async function main() {
  if (!isGeminiConfigured()) {
    console.error("GEMINI_API_KEY가 .env에 없습니다.");
    process.exit(1);
  }

  const sample = await translateWithGemini(
    "Vietnam approves amnesty for 9,950 prisoners",
    "The government announced a large-scale amnesty ahead of a national holiday.",
    "VIETNAM_POLICY"
  );

  console.log("OK — 번역 샘플:");
  console.log("제목:", sample.title);
  console.log("본문:", sample.description.slice(0, 200));
}

main().catch((e) => {
  console.error("실패:", e instanceof Error ? e.message : e);
  process.exit(1);
});
