/** 같은 사건·동일 본문 뉴스 판별 */

export type NewsDedupeFields = {
  title: string;
  content?: string | null;
  description?: string | null;
};

export function normalizeForDedup(text: string): string {
  return text
    .replace(/^\[[^\]]+\]\s*/u, "")
    .replace(/^VnExpress\s*·\s*/iu, "")
    .replace(/[…]{1,3}/g, "")
    .replace(/\.{2,}/g, "")
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

function contentSnippet(text: string | null | undefined): string {
  if (!text?.trim()) return "";
  return normalizeForDedup(text.slice(0, 500));
}

export function titlesAreSimilar(a: string, b: string): boolean {
  if (oneContainsOther(a, b)) return true;
  if (sharedChunkRatio(a, b, 3) >= 0.35) return true;
  if (sharedChunkRatio(a, b, 2) >= 0.52) return true;
  if (jaccardSimilarity(a, b, 2) >= 0.72) return true;
  return false;
}

export function areDuplicateNews(a: NewsDedupeFields, b: NewsDedupeFields): boolean {
  if (titlesAreSimilar(a.title, b.title)) return true;

  const ca = contentSnippet(a.content);
  const cb = contentSnippet(b.content);
  if (ca.length >= 120 && cb.length >= 120) {
    if (ca === cb) return true;
    if (oneContainsOther(ca, cb, 80)) return true;
    if (jaccardSimilarity(ca, cb) >= 0.88) return true;
  }

  const da = normalizeForDedup(a.description ?? "");
  const db = normalizeForDedup(b.description ?? "");
  if (
    da.length >= 80 &&
    db.length >= 80 &&
    (da === db || jaccardSimilarity(da, db) >= 0.9)
  ) {
    return true;
  }

  return false;
}

export function dedupeRawNewsItems<T extends NewsDedupeFields>(items: T[]): T[] {
  const kept: T[] = [];
  for (const item of items) {
    if (kept.some((k) => areDuplicateNews(k, item))) continue;
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
