export type KakaoEduImportRow = {
  title: string;
  sourceLink?: string | null;
  content: string;
  publishedAt: string;
};

const STUDY_SOURCE_LABEL = "베트남어 독학";
const STUDY_SLUG_PREFIX = "vietnameseselfstudy";

const VN_DIACRITIC =
  /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** v4 시드와 동일 — publishedAt UTC 기준 고유 slug */
export function slugFromStudyPublishedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`유효하지 않은 publishedAt: ${iso}`);
  }
  const ts = `${d.getUTCFullYear()}${pad2(d.getUTCMonth() + 1)}${pad2(d.getUTCDate())}${pad2(d.getUTCHours())}${pad2(d.getUTCMinutes())}${pad2(d.getUTCSeconds())}`;
  return `${STUDY_SLUG_PREFIX}-${ts}`;
}

/** 본문 첫 베트남어 문장(또는 구절) — vnText */
export function extractStudyVnText(content: string): string | null {
  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    if (/^\[[^\]]+\]$/.test(line)) continue;
    if (line.startsWith("👉")) continue;
    if (/^https?:\/\//i.test(line)) continue;
    if (/^[-─—]{2,}$/.test(line)) continue;
    if (/^\(\d+\)/.test(line)) continue;
    if (VN_DIACRITIC.test(line)) {
      return line.slice(0, 500);
    }
  }
  return null;
}

export function normalizeKakaoEduRow(row: KakaoEduImportRow) {
  const title = row.title.trim();
  const body = row.content.trim();
  const publishedAt = new Date(row.publishedAt);
  const externalUrl = row.sourceLink?.trim() || null;

  return {
    slug: slugFromStudyPublishedAt(row.publishedAt),
    kind: "PHRASE" as const,
    domain: "STUDY" as const,
    title,
    vnText: extractStudyVnText(body),
    body,
    externalUrl,
    sourceLabel: STUDY_SOURCE_LABEL,
    isCrawl: true,
    publishedAt,
  };
}
