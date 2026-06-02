function escapeFtsToken(token: string): string {
  return token.replace(/"/g, '""').replace(/[^\w\s가-힣_-]/g, "");
}

export function buildFtsMatchQuery(query: string): string | null {
  const terms = query
    .trim()
    .split(/\s+/)
    .map(escapeFtsToken)
    .filter((t) => t.length >= 2);

  if (terms.length === 0) return null;

  return terms.map((t) => `"${t}"`).join(" AND ");
}

/** buildFtsMatchQuery 결과만 허용 — SQL Injection 방지 */
export function isSafeFtsMatchQuery(match: string): boolean {
  return /^("[^"]+"( AND "[^"]+")*)$/.test(match);
}
