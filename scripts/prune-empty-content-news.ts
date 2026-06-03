/**
 * 본문 없음(썸네일·제목만) 자동 뉴스 일괄 삭제
 * npm run news:prune-empty
 */
import "dotenv/config";
import { pruneEmptyContentAutomatedNews } from "../src/lib/news/prune-empty-content-news";

async function main() {
  const result = await pruneEmptyContentAutomatedNews();
  console.log(JSON.stringify(result, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
