/** 같은 사건·동일 본문 뉴스 판별 */

export type NewsDedupeFields = {
  title: string;
  content?: string | null;
  description?: string | null;
};

const TITLE_SUFFIX_NOISE =
  /\s*[-|·]\s*(연합뉴스|뉴시스|이데일리|머니투데이|MK스포츠|스포츠조선|한국경제|매일경제|아시아경제|조선일보|중앙일보|동아일보|한겨레|경향신문|서울신문|뉴스1|YTN|SBS|KBS|MBC|JTBC|네이버\s*뉴스).*$/iu;

/** 제목 접두·접미·출처 태그 제거 */
export function stripNewsTitleForDedup(title: string): string {
  return title
    .replace(/^\[[^\]]+\]\s*/u, "")
    .replace(/^VnExpress\s*·\s*/iu, "")
    .replace(TITLE_SUFFIX_NOISE, "")
    .replace(/[…]{1,3}/g, "")
    .replace(/\.{2,}/g, "")
    .trim();
}

export function normalizeForDedup(text: string): string {
  return stripNewsTitleForDedup(text)
    .replace(/[^\p{L}\p{N}]/gu, "")
    .toLowerCase();
}

function ngrams(s: string, n: number): Set<string> {
  const set = new Set<string>();
  if (s.length < n) {
    if (s) set.add(s);
    return set;
  }
  for (let i = 0; i <= s.length - n; i++) set.add(s.slice(i, i + n));
  return set;
}

function jaccardSets(sa: Set<string>, sb: Set<string>): number {
  let inter = 0;
  for (const x of sa) if (sb.has(x)) inter++;
  const union = sa.size + sb.size - inter;
  return union === 0 ? 0 : inter / union;
}

export function jaccardSimilarity(a: string, b: string, gramSize = 2): number {
  const na = normalizeForDedup(a);
  const nb = normalizeForDedup(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  return jaccardSets(ngrams(na, gramSize), ngrams(nb, gramSize));
}

/** 한국어 제목 — 짧은 n-gram 겹침 비율 */
function sharedChunkRatio(a: string, b: string, chunkLen = 4): number {
  const na = normalizeForDedup(a);
  const nb = normalizeForDedup(b);
  if (!na || !nb || na.length < 12 || nb.length < 12) return 0;
  const shorter = na.length <= nb.length ? na : nb;
  const longer = na.length > nb.length ? na : nb;
  if (shorter.length < chunkLen) return 0;
  let hits = 0;
  const total = shorter.length - chunkLen + 1;
  for (let i = 0; i < total; i++) {
    if (longer.includes(shorter.slice(i, i + chunkLen))) hits++;
  }
  return hits / total;
}

function oneContainsOther(a: string, b: string, minLen = 18): boolean {
  const na = normalizeForDedup(a);
  const nb = normalizeForDedup(b);
  if (!na || !nb) return false;
  const shorter = na.length <= nb.length ? na : nb;
  const longer = na.length > nb.length ? na : nb;
  return shorter.length >= minLen && longer.includes(shorter);
}

function contentSnippet(text: string | null | undefined, maxLen = 1000): string {
  if (!text?.trim()) return "";
  return normalizeForDedup(text.slice(0, maxLen));
}

function descriptionSnippet(text: string | null | undefined): string {
  if (!text?.trim()) return "";
  return normalizeForDedup(text.slice(0, 400));
}

export function titlesAreSimilar(a: string, b: string): boolean {
  const na = normalizeForDedup(a);
  const nb = normalizeForDedup(b);
  if (na.length >= 12 && na === nb) return true;

  if (oneContainsOther(a, b)) return true;
  if (sharedChunkRatio(a, b, 3) >= 0.32) return true;
  if (sharedChunkRatio(a, b, 2) >= 0.48) return true;
  if (jaccardSimilarity(a, b, 2) >= 0.65) return true;
  return false;
}

/** 제목·요약·본문 교차 비교 (언론사별 다른 헤드라인) */
function crossFieldsAreDuplicate(a: NewsDedupeFields, b: NewsDedupeFields): boolean {
  const pairs: [string, string][] = [
    [a.title, b.description ?? ""],
    [b.title, a.description ?? ""],
    [a.title, b.content?.slice(0, 200) ?? ""],
    [b.title, a.content?.slice(0, 200) ?? ""],
    [a.description ?? "", b.content?.slice(0, 300) ?? ""],
    [b.description ?? "", a.content?.slice(0, 300) ?? ""],
  ];

  for (const [left, right] of pairs) {
    if (!left.trim() || !right.trim()) continue;
    if (titlesAreSimilar(left, right)) return true;
    const nl = normalizeForDedup(left);
    const nr = normalizeForDedup(right);
    if (nl.length >= 40 && nr.length >= 40 && oneContainsOther(nl, nr, 30)) {
      return true;
    }
  }
  return false;
}

export function areDuplicateNews(a: NewsDedupeFields, b: NewsDedupeFields): boolean {
  if (titlesAreSimilar(a.title, b.title)) return true;
  if (crossFieldsAreDuplicate(a, b)) return true;

  const ca = contentSnippet(a.content);
  const cb = contentSnippet(b.content);
  if (ca.length >= 100 && cb.length >= 100) {
    if (ca === cb) return true;
    if (oneContainsOther(ca, cb, 70)) return true;
    if (jaccardSimilarity(ca, cb) >= 0.84) return true;
  }

  const da = descriptionSnippet(a.description);
  const db = descriptionSnippet(b.description);
  if (da.length >= 40 && db.length >= 40) {
    if (da === db) return true;
    if (oneContainsOther(da, db, 40)) return true;
    if (jaccardSimilarity(da, db) >= 0.88) return true;
  }

  return false;
}

function newsItemRichness(item: NewsDedupeFields): number {
  return (
    (item.content?.length ?? 0) +
    (item.description?.length ?? 0) +
    item.title.length
  );
}

export function preferRicherNewsItem<T extends NewsDedupeFields>(
  a: T,
  b: T
): T {
  const scoreA = newsItemRichness(a);
  const scoreB = newsItemRichness(b);
  if (scoreA !== scoreB) return scoreA > scoreB ? a : b;
  const pubA = "publishedAt" in a ? (a as T & { publishedAt?: Date }).publishedAt : undefined;
  const pubB = "publishedAt" in b ? (b as T & { publishedAt?: Date }).publishedAt : undefined;
  if (pubA && pubB && pubA.getTime() !== pubB.getTime()) {
    return pubA > pubB ? a : b;
  }
  return a;
}

export function dedupeRawNewsItems<T extends NewsDedupeFields>(items: T[]): T[] {
  const kept: T[] = [];
  for (const item of items) {
    const dupIdx = kept.findIndex((k) => areDuplicateNews(k, item));
    if (dupIdx >= 0) {
      kept[dupIdx] = preferRicherNewsItem(item, kept[dupIdx]!);
      continue;
    }
    kept.push(item);
  }
  return kept;
}

/** 중복 그룹에서 유지할 항목 — 본문 길이·조회·최신순 */
export function pickKeeperPost<
  T extends NewsDedupeFields & {
    id: string;
    views?: number;
    publishedAt: Date;
  },
>(cluster: T[]): T {
  return [...cluster].sort((a, b) => {
    const lenA = a.content?.length ?? 0;
    const lenB = b.content?.length ?? 0;
    if (lenB !== lenA) return lenB - lenA;
    const viewsA = a.views ?? 0;
    const viewsB = b.views ?? 0;
    if (viewsB !== viewsA) return viewsB - viewsA;
    return b.publishedAt.getTime() - a.publishedAt.getTime();
  })[0]!;
}

export function findDuplicateClusters<
  T extends NewsDedupeFields & { id: string },
>(posts: T[]): T[][] {
  const used = new Set<string>();
  const clusters: T[][] = [];

  for (const post of posts) {
    if (used.has(post.id)) continue;
    const cluster: T[] = [post];
    used.add(post.id);

    for (const other of posts) {
      if (used.has(other.id)) continue;
      if (cluster.some((p) => areDuplicateNews(p, other))) {
        cluster.push(other);
        used.add(other.id);
      }
    }

    if (cluster.length > 1) clusters.push(cluster);
  }

  return clusters;
}
