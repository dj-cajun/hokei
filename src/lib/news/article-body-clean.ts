/** 기사 본문 — 언론사·기자·소제목·관련뉴스·사진밑 캡션 제거 후 순수 본문만 */

import { applyArticleRegexFilters } from "@/lib/news/article-body-regex";

const SECTION_CUTOFF =
  /^(관련\s*기사|관련\s*뉴스|연관\s*기사|많이\s*본\s*뉴스|핫\s*뉴스|추천\s*뉴스|이\s*시각|주요\s*뉴스|실시간\s*뉴스|오늘의\s*헤드|헤드라인\s*뉴스|기자\s*추천|태그\s*[:：]|◆\s*태그|#태그|키워드\s*[:：]|읽어볼만한|함께\s*보면\s*좋은|더\s*볼\s*뉴스|다른\s*기사|이\s*기사도|추천\s*기사|함께\s*읽기|구독\s*신청)/i;

/** 사진 바로 아래·단독 매체명 줄 (네이버.VnExpress 등 붙어 있는 경우 포함) */
const MEDIA_LINE =
  /^(네이버|naver|뉴스\s*1|news1|연합뉴스|뉴시스|이데일리|파이낸셜리뷰|파이낸셜|아시아경제|오센|조선일보|중앙일보|한겨레|경향신문|매일경제|한국경제|서울신문|스포츠조선|스포츠동아|YTN|SBS|KBS|MBC|JTBC|VnExpress|vnexpress|베트남\s*익스프레스|비나익스프레스|vietnam\s*express|인사이드비나|insidevina|Vietnam\.vn)(\s*뉴스)?(\s*[·\/|.]\s*)?(\s*(VnExpress|vnexpress|베트남\s*익스프레스|비나익스프레스))?\.?\s*$/i;

const MEDIA_GLUED_LINE =
  /^네이버\s*\.?\s*(VnExpress|vnexpress|베트남\s*익스프레스|비나익스프레스)\s*\.?\s*$/i;

const MEDIA_INLINE =
  /네이버\s*(?:뉴스\s*)?(?:[·\/|.]\s*)?(?:VnExpress|vnexpress|베트남\s*익스프레스|비나익스프레스)?|(?:VnExpress|vnexpress|베트남\s*익스프레스|비나익스프레스)/gi;

const DROP_LINE_PATTERNS: RegExp[] = [
  /^https?:\/\//i,
  /^www\./i,
  /무단\s*전재|저작권|copyright|all\s*rights\s*reserved/i,
  /^(Photo|IMAGE)\s*[:：]/i,
  /^사진\s*[=:/|]/i,
  /^▲\s*/,
  /^※\s*/,
  /^■\s*/,
  /^◇\s*/,
  /^◆\s*(?!$)/,
  /한\s*줄\s*요약|핵심\s*요약|기사\s*요약|AI\s*요약|요약\s*[:：]/i,
  /^▶\s*|^☞\s*/,
  /더보기\s*→|기사\s*원문|원문\s*보기|전체\s*보기|다른\s*기사\s*보기/i,
  /^#[\w가-힣]{2,}(\s+#[\w가-힣]{2,})+\s*$/,
  /^태그\s*[:：]/i,
  /기자\s*=\s*@/i,
  /^(입력|수정|등록|발행|송고)\s*[:：]/,
  /^네이버\s*$/,
  /^\/\s*$/,
  /^VnExpress\s*$/i,
  /^vnexpress\s*$/i,
];

const PHOTO_CAPTION =
  /^.{0,120}(사진\s*[=:]|촬영\s*[=:]|제공\s*[=:]|ⓒ|©|공동촬영|사진\s*기고|=getty|연합뉴스\s*=).{0,90}$/i;

/** 본문 앞 [오센=홍길동 기자] 형식 */
const BRACKET_BYLINE_LINE = /^\[[^\]=\[\]]{1,48}=[^\]]{1,96}\]\s*$/;

const BRACKET_BYLINE_PREFIX = /^\[[^\]=\[\]]{1,48}=[^\]]{1,96}\]\s*/;

const REPORTER_LINE =
  /^[가-힣A-Za-z.\s]{1,24}\s*(특파원|기자|인턴\s*기자|수습\s*기자|논설위원|편집인|통신원)(\s*[|｜·]\s*)?(\S+@\S+)?\s*$/;

const EMAIL_LINE = /^\S+@\S+\.\S+\s*$/;

const RELATED_ONE_LINER =
  /^.{5,90}(\.\.\.|…)?\s*(\d{1,2}\.\d{1,2}|\d+시간\s*전|어제|오늘)\s*$/;

/** 도입부 소제목·리드 한 줄 (괄호/기호로만 시작하는 짧은 줄) */
function isIntroSubheading(line: string): boolean {
  if (line.length > 100) return false;
  if (/[.!?…]["')\]]?\s*$/.test(line) && line.length > 45) return false;
  if (/^[【\[\(<◆■◇▶「『「]/.test(line)) return true;
  if (/^\[.+\]\s*$/.test(line) && line.length < 80) return true;
  return false;
}

function stripBracketByline(text: string): string {
  let s = text.trim();
  while (BRACKET_BYLINE_PREFIX.test(s)) {
    s = s.replace(BRACKET_BYLINE_PREFIX, "").trim();
  }
  return s;
}

function isBracketByline(line: string): boolean {
  return BRACKET_BYLINE_LINE.test(line.trim());
}

function stripMediaGarbage(text: string): string {
  return text
    .replace(/\s*\(스크래핑\)\s*/gi, " ")
    .replace(MEDIA_INLINE, " ")
    .replace(/네이버\s*\.?\s*(?:VnExpress|vnexpress)\s*/gi, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function isMediaOnlyFragment(line: string): boolean {
  const s = stripMediaGarbage(line);
  if (!s) return true;
  if (s.length > 48) return false;
  return (
    MEDIA_LINE.test(s) ||
    MEDIA_GLUED_LINE.test(s) ||
    /^(네이버|VnExpress|vnexpress)$/i.test(s)
  );
}

function isNoiseLine(line: string): boolean {
  const s = line.trim();
  if (s.length < 2) return true;
  if (isMediaOnlyFragment(s)) return true;
  if (isBracketByline(s)) return true;
  if (SECTION_CUTOFF.test(s)) return true;
  if (MEDIA_LINE.test(s)) return true;
  if (MEDIA_GLUED_LINE.test(s)) return true;
  if (DROP_LINE_PATTERNS.some((p) => p.test(s))) return true;
  if (PHOTO_CAPTION.test(s)) return true;
  if (REPORTER_LINE.test(s)) return true;
  if (EMAIL_LINE.test(s)) return true;
  if (RELATED_ONE_LINER.test(s)) return true;
  if (/^https?:\/\/\S+$/i.test(s)) return true;
  if (/^#[\w가-힣]+\s*$/.test(s)) return true;
  // 기자명만 + 날짜
  if (/^\d{4}[.\-/]\d{1,2}[.\-/]\d{1,2}/.test(s) && s.length < 40) return true;
  return false;
}

function looksLikeBodySentence(line: string): boolean {
  if (line.length < 35) return false;
  return /[.!?…]|[다요죠]\s*$/.test(line) || line.length >= 80;
}

/** 앞·뒤 잡문 단락 제거 */
function trimEdgeLines(lines: string[]): string[] {
  let start = 0;
  let end = lines.length;

  while (start < end && start < 12) {
    const line = lines[start]!;
    if (isNoiseLine(line) || isIntroSubheading(line)) {
      start++;
      continue;
    }
    if (!looksLikeBodySentence(line) && line.length < 100) {
      start++;
      continue;
    }
    break;
  }

  while (end > start && end > lines.length - 15) {
    const line = lines[end - 1]!;
    if (
      isNoiseLine(line) ||
      REPORTER_LINE.test(line) ||
      EMAIL_LINE.test(line) ||
      SECTION_CUTOFF.test(line) ||
      /다른\s*기사|이\s*기사|추천|구독|newsletter/i.test(line)
    ) {
      end--;
      continue;
    }
    if (!looksLikeBodySentence(line) && line.length < 80) {
      end--;
      continue;
    }
    break;
  }

  return lines.slice(start, end);
}

function normalizeLine(line: string): string {
  return stripBracketByline(
    stripMediaGarbage(line.replace(/\s+/g, " "))
  );
}

export function cleanArticleBody(raw: string): string {
  if (!raw?.trim()) return "";

  let cutAtSection = applyArticleRegexFilters(raw);
  const sectionMatch = raw.search(
    /\n\s*(관련\s*기사|관련\s*뉴스|많이\s*본\s*뉴스|다른\s*기사\s*보기|이\s*기사도|◆\s*태그|태그\s*[:：])/i
  );
  if (sectionMatch > 150) {
    cutAtSection = raw.slice(0, sectionMatch);
  }

  const allLines: string[] = [];
  for (const block of cutAtSection.split(/\n{2,}/)) {
    for (const line of block.split(/\n/)) {
      const n = normalizeLine(line);
      if (n) allLines.push(n);
    }
  }

  const trimmedLines = trimEdgeLines(allLines);

  const paragraphs: string[] = [];
  let buffer: string[] = [];

  const flush = () => {
    if (buffer.length === 0) return;
    const merged = buffer.join(" ").trim();
    buffer = [];
    if (merged.length < 20) return;
    if (isNoiseLine(merged)) return;
    if (PHOTO_CAPTION.test(merged) && merged.length < 150) return;
    paragraphs.push(merged);
  };

  for (const line of trimmedLines) {
    if (SECTION_CUTOFF.test(line)) break;
    if (isNoiseLine(line)) {
      flush();
      continue;
    }
    if (PHOTO_CAPTION.test(line)) {
      flush();
      continue;
    }
    buffer.push(line);
    if (looksLikeBodySentence(line)) flush();
  }
  flush();

  return paragraphs
    .map((p) => stripBracketByline(stripMediaGarbage(p)))
    .filter(
      (p) =>
        p.length >= 20 && !isMediaOnlyFragment(p) && !isBracketByline(p)
    )
    .join("\n\n")
    .trim();
}
