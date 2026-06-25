import { normalizeForDedup } from "@/lib/news/dedupe";

/** 기존 본문 + 신규 내용을 합칩니다. 추가 정보가 없으면 null */
export function mergeCurateBodies(
  existing: string,
  incoming: string
): string | null {
  const ex = existing.trim();
  const inc = incoming.trim();
  if (!inc) return null;
  if (!ex) return inc;
  if (ex === inc) return null;

  const nex = normalizeForDedup(ex);
  const nin = normalizeForDedup(inc);
  if (nex === nin) return null;

  if (nin.includes(nex) && inc.length > ex.length) {
    return inc;
  }
  if (nex.includes(nin)) {
    return null;
  }

  const newParagraphs = inc
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 6)
    .filter((p) => !nex.includes(normalizeForDedup(p)));

  if (newParagraphs.length === 0) {
    return null;
  }

  const stamp = new Date().toLocaleString("ko-KR", {
    timeZone: "Asia/Ho_Chi_Minh",
  });

  return `${ex}\n\n---\n\n**업데이트** (${stamp})\n\n${newParagraphs.join("\n\n")}`;
}
