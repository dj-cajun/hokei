import { isValidKakaoLink } from "@/lib/kakao-link";

export type CrawlContactChip = {
  kind: "kakao" | "tel" | "zalo" | "text";
  label: string;
  href?: string;
  value: string;
};

const KAKAO_OPEN_URL_RE =
  /https?:\/\/open\.kakao\.com\/o\/[a-zA-Z0-9]+/i;
const KAKAO_ID_RE = /카톡\s*(?:ID|아이디)?\s*[:：]?\s*([^\s(,]+)/i;
const ZALO_PHONE_RE =
  /(?:Zalo|잘로)\s*[:：]?\s*([+]?\d[\d\s.-]{8,})/gi;
const ZALO_ID_RE =
  /(?:Zalo|잘로)(?!\s*(?:ID|아이디|검색용))\s*[:：]?\s*([a-zA-Z][\w.-]{2,})/gi;
const TEL_RE =
  /(?:전화|Tel|TEL|📞|☎|직통\s*번호)\s*[:：]?\s*([+]?\d[\d\s.-]{8,})/gi;
const VN_PHONE_RE = /(?:^|[^\d])(0\d{9,10})(?:[^\d]|$)/gm;

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

export function extractKakaoOpenUrl(raw: string): string | null {
  const match = raw.match(KAKAO_OPEN_URL_RE);
  if (!match) return null;
  const url = match[0];
  return isValidKakaoLink(url) ? url : null;
}

export function normalizePhoneDigits(raw: string): string {
  const digits = raw.replace(/[^\d+]/g, "");
  if (digits.startsWith("+84")) {
    return `0${digits.slice(3)}`;
  }
  if (digits.startsWith("84") && digits.length >= 11) {
    return `0${digits.slice(2)}`;
  }
  return digits.replace(/^\+/, "");
}

function formatPhoneDisplay(digits: string): string {
  const d = normalizePhoneDigits(digits);
  if (d.length === 10) {
    return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
  }
  if (d.length === 11) {
    return `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}`;
  }
  return d;
}

function collectRegexMatches(text: string, re: RegExp): string[] {
  const flags = re.flags.includes("g") ? re.flags : `${re.flags}g`;
  const global = new RegExp(re.source, flags);
  const matches: string[] = [];
  for (const match of text.matchAll(global)) {
    const value = match[1]?.trim();
    if (value) matches.push(value);
  }
  return matches;
}

export function extractPhones(text: string): string[] {
  const zaloPhones = new Set(extractZaloPhones(text));
  const found = [
    ...collectRegexMatches(text, TEL_RE),
    ...collectRegexMatches(text, VN_PHONE_RE),
  ];
  return unique(
    found
      .map(normalizePhoneDigits)
      .filter(
        (digits) =>
          digits.length >= 9 &&
          digits.length <= 12 &&
          !zaloPhones.has(digits)
      )
  );
}

export function extractZaloPhones(text: string): string[] {
  return unique(
    collectRegexMatches(text, ZALO_PHONE_RE)
      .map(normalizePhoneDigits)
      .filter((digits) => digits.length >= 9 && digits.length <= 12)
  );
}

export function extractZaloIds(text: string): string[] {
  return unique(collectRegexMatches(text, ZALO_ID_RE));
}

export function extractKakaoId(text: string): string | null {
  const match = text.match(KAKAO_ID_RE);
  return match?.[1]?.trim() ?? null;
}

/** 시드·DB 백필용 — 본문·메타에서 대표 연락처 한 줄 추출 */
export function inferContactLine(input: {
  kakaoLink?: string | null;
  content?: string | null;
  sourceName?: string | null;
}): string | null {
  const explicit = input.kakaoLink?.trim();
  if (explicit) return explicit;

  const blob = input.content?.trim() ?? "";
  if (!blob) {
    return input.sourceName?.trim()
      ? `단톡방 닉: ${input.sourceName.trim()}`
      : null;
  }

  const kakaoUrl = extractKakaoOpenUrl(blob);
  if (kakaoUrl) return kakaoUrl;

  const phones = extractPhones(blob);
  const zaloPhones = extractZaloPhones(blob);
  if (zaloPhones.length > 0) {
    return `Zalo: ${formatPhoneDisplay(zaloPhones[0]!)}`;
  }
  if (phones.length > 0) {
    return `전화: ${formatPhoneDisplay(phones[0]!)}`;
  }

  const zaloIds = extractZaloIds(blob);
  if (zaloIds.length > 0) {
    return `Zalo: ${zaloIds[0]}`;
  }

  const kakaoId = extractKakaoId(blob);
  if (kakaoId) return `카톡 ID: ${kakaoId}`;

  return input.sourceName?.trim()
    ? `단톡방 닉: ${input.sourceName.trim()}`
    : null;
}

export function buildCrawlContactChips(input: {
  kakaoLink?: string | null;
  content?: string | null;
  sourceName?: string | null;
}): CrawlContactChip[] {
  if (input.kakaoLink === null) return [];

  const chips: CrawlContactChip[] = [];
  const seen = new Set<string>();
  const blob = [input.kakaoLink, input.content].filter(Boolean).join("\n");

  const push = (chip: CrawlContactChip) => {
    const key = `${chip.kind}:${chip.value}`;
    if (seen.has(key)) return;
    seen.add(key);
    chips.push(chip);
  };

  const kakaoFromLink = input.kakaoLink
    ? extractKakaoOpenUrl(input.kakaoLink)
    : null;
  const kakaoFromContent = extractKakaoOpenUrl(blob);
  const kakaoUrl = kakaoFromLink ?? kakaoFromContent;
  if (kakaoUrl) {
    push({
      kind: "kakao",
      label: "카톡 문의",
      href: kakaoUrl,
      value: kakaoUrl,
    });
  }

  for (const phone of extractPhones(blob)) {
    push({
      kind: "tel",
      label: `전화 ${formatPhoneDisplay(phone)}`,
      href: `tel:${phone}`,
      value: phone,
    });
  }

  for (const zaloPhone of extractZaloPhones(blob)) {
    push({
      kind: "zalo",
      label: `잘로 ${formatPhoneDisplay(zaloPhone)}`,
      href: `https://zalo.me/${zaloPhone}`,
      value: zaloPhone,
    });
  }

  for (const zaloId of extractZaloIds(blob)) {
    const digits = normalizePhoneDigits(zaloId);
    const href =
      digits.length >= 9 && /^\d+$/.test(digits)
        ? `https://zalo.me/${digits}`
        : `https://zalo.me/${encodeURIComponent(zaloId)}`;
    push({
      kind: "zalo",
      label: `잘로 ${zaloId}`,
      href,
      value: zaloId,
    });
  }

  const kakaoId =
    (input.kakaoLink ? extractKakaoId(input.kakaoLink) : null) ??
    extractKakaoId(blob);
  if (kakaoId && !kakaoUrl) {
    push({
      kind: "text",
      label: `카톡 ${kakaoId}`,
      value: kakaoId,
    });
  }

  const linkText = input.kakaoLink?.trim();
  if (chips.length === 0 && linkText) {
    push({ kind: "text", label: linkText, value: linkText });
  }

  if (chips.length === 0 && input.sourceName?.trim()) {
    const name = input.sourceName.trim();
    push({
      kind: "text",
      label: `단톡 ${name}`,
      value: name,
    });
  }

  return chips;
}
