/**
 * 기사 본문 앞·뒤 잡문 제거 (정규식)
 * 【보스턴=홍길동 기자】, [서울=연합뉴스], (호치민=뉴스1) 등
 */

const BYLINE_PREFIX =
  /^[\[【(\uFF08][^\]=\[【(\uFF08\]]{0,48}[=＝][^\]】)\uFF09\]]{0,96}[\]】)\uFF09\]]\s*/u;

const BYLINE_REPORTER_LINE =
  /^[\s]*[\[【(\uFF08][^\]】)\uFF09\]]{1,56}(?:기자|특파원|통신원|뉴스|연합|통신)[^\]】)\uFF09\]]{0,24}[\]】)\uFF09\]]\s*$/u;

const TRAILING_LINE_CHECKS: RegExp[] = [
  /^\S+@\S+\.\S+/,
  /무단\s*전재|재배포\s*(?:및\s*)?금지|저작권\s*법/i,
  /Copyright|All\s*rights\s*reserved/i,
  /기사\s*원문\s*[:：]?\s*https?:\/\//i,
  /^▶\s*/,
  /^\[[^\]]{1,24}\]\s*[가-힣A-Za-z.\s]{1,24}\s*기자(?:\s+\S+@\S+)?\s*$/,
];

function isTrailingNoiseLine(line: string): boolean {
  const s = line.trim();
  if (!s) return true;
  return TRAILING_LINE_CHECKS.some((p) => p.test(s));
}

export function stripLeadingBylines(text: string): string {
  let s = text.trim();
  for (let i = 0; i < 8; i++) {
    const next = s.replace(BYLINE_PREFIX, "").trim();
    if (next === s) break;
    s = next;
  }
  const lines = s.split("\n");
  while (lines.length > 0 && BYLINE_REPORTER_LINE.test(lines[0] ?? "")) {
    lines.shift();
  }
  return lines.join("\n").trim();
}

export function stripTrailingBoilerplate(text: string): string {
  const lines = text.trim().split("\n");
  while (lines.length > 0) {
    const last = lines[lines.length - 1]?.trim() ?? "";
    if (isTrailingNoiseLine(last)) {
      lines.pop();
      continue;
    }
    break;
  }
  return lines.join("\n").trim();
}

/** 본문 끝·줄바꿈 없이 붙는 관련기사 제목·구독 영상 (서울경제 등) */
export function stripAppendedRelatedHeadlines(text: string): string {
  let s = text.trim();
  if (!s) return s;

  const subIdx = s.search(/\+구독/);
  if (subIdx > 80) s = s.slice(0, subIdx).trim();

  s = s.replace(/\n\s*영상[“"][^"\n]+[”"][^\n]*/g, "\n");
  s = s.replace(
    /(?<=[.!?…])\s*(?:[“"][^”"]{8,120}[”"]…[^.?!]{3,80}\?\s*)+$/u,
    ""
  );
  s = s.replace(/\s*ⓒ\s*[^\n]+(?:무단|AI\s*학습)[^\n]*$/i, "");

  return s.trim();
}

/** 저장·표시 직전 1차 정규식 정제 */
export function applyArticleRegexFilters(raw: string): string {
  if (!raw?.trim()) return "";
  return stripAppendedRelatedHeadlines(
    stripTrailingBoilerplate(stripLeadingBylines(raw))
  );
}
