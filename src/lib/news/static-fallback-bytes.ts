import { readFileSync } from "fs";
import { join } from "path";
import type { PostTopic } from "@/generated/prisma/client";
import { getStaticFallbackFilePath } from "@/lib/news/default-thumbnails";

const cache = new Map<PostTopic, { body: Buffer; contentType: string }>();

/** API 프록시 최종 폴백 — public 정적 JPEG 바이트 */
export function readStaticFallbackBytes(
  topic: PostTopic
): { body: Buffer; contentType: string } | null {
  const cached = cache.get(topic);
  if (cached) return cached;

  try {
    const body = readFileSync(join(process.cwd(), getStaticFallbackFilePath(topic)));
    if (body.byteLength < 200) return null;
    const entry = { body, contentType: "image/jpeg" };
    cache.set(topic, entry);
    return entry;
  } catch {
    return null;
  }
}
