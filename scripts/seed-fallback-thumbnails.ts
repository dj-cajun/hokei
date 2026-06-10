/**
 * public/news/fallback/*.jpg 재생성 (Unsplash 소스 → 로컬 정적 파일)
 * npm run news:seed-fallback-thumbnails
 */
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import type { PostTopic } from "../src/generated/prisma/client";
import { getStaticFallbackFilePath } from "../src/lib/news/default-thumbnails";

const SOURCES: Record<PostTopic, string> = {
  KOREA:
    "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&h=600&fit=crop&q=80",
  TRAVEL:
    "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800&h=600&fit=crop&q=80",
  VIETNAM_POLICY:
    "https://images.unsplash.com/photo-1528127269322-539801943592?w=800&h=600&fit=crop&q=80",
  TOURIST:
    "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&h=600&fit=crop&q=80",
};

async function fetchBytes(url: string): Promise<Buffer> {
  const res = await fetch(url, {
    headers: { Accept: "image/*", "User-Agent": "HokeiFallbackSeed/1.0" },
    redirect: "follow",
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${url}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.byteLength < 200) {
    throw new Error(`이미지가 너무 작음 (${buf.byteLength}B): ${url}`);
  }
  return buf;
}

async function main() {
  mkdirSync(join(process.cwd(), "public/news/fallback"), { recursive: true });

  for (const topic of Object.keys(SOURCES) as PostTopic[]) {
    const url = SOURCES[topic];
    const bytes = await fetchBytes(url);
    const dest = join(process.cwd(), getStaticFallbackFilePath(topic));
    writeFileSync(dest, bytes);
    console.log(`✓ ${topic} → ${dest} (${bytes.byteLength}B)`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
