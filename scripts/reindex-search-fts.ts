import "dotenv/config";
import { reindexAllPostsFts } from "@/lib/search/post-fts";

async function main() {
  const result = await reindexAllPostsFts();
  console.log(`[search:reindex] FTS indexed ${result.indexed} posts`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
