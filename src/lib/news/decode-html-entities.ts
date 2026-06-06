const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

function codePointToChar(code: number): string {
  if (!Number.isFinite(code) || code <= 0 || code > 0x10ffff) return "";
  try {
    return String.fromCodePoint(code);
  } catch {
    return "";
  }
}

/** &#x27; · &#39; · &apos; 등 HTML 엔티티를 실제 문자로 변환 */
export function decodeHtmlEntities(text: string): string {
  if (!text || !text.includes("&")) return text;

  let out = text;
  for (let pass = 0; pass < 3; pass++) {
    const next = out
      .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) =>
        codePointToChar(parseInt(hex, 16))
      )
      .replace(/&#(\d+);/g, (_, dec: string) =>
        codePointToChar(parseInt(dec, 10))
      )
      .replace(/&([a-zA-Z][a-zA-Z0-9]*);/g, (match, name: string) => {
        const decoded = NAMED_ENTITIES[name.toLowerCase()];
        return decoded ?? match;
      });
    if (next === out) break;
    out = next;
  }

  return out;
}
