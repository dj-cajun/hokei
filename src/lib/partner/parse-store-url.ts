/** `/store/slug`, `store/slug`, 전체 URL → slug */
export function parsePartnerStoreSlugFromInput(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      const match = url.pathname.match(/\/store\/([a-z0-9-]+)/i);
      if (match?.[1]) return match[1].toLowerCase();
    } catch {
      return null;
    }
    return null;
  }

  const pathMatch = trimmed.match(/(?:^|\/)store\/([a-z0-9-]+)/i);
  if (pathMatch?.[1]) return pathMatch[1].toLowerCase();

  if (/^[a-z0-9-]+$/.test(trimmed)) return trimmed;

  return null;
}
