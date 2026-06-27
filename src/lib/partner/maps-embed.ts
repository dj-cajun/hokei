function isGoogleMapsHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return (
    h === "google.com" ||
    h.endsWith(".google.com") ||
    h.endsWith(".google.co.kr") ||
    h === "maps.app.goo.gl" ||
    h.endsWith(".goo.gl")
  );
}

/** Google Maps iframe embed URL (주소 기준) */
export function mapsEmbedSrc(
  address: string | null | undefined,
  mapsUrl: string | null | undefined
): string | null {
  const addr = address?.trim();
  if (addr) {
    return `https://maps.google.com/maps?q=${encodeURIComponent(addr)}&z=16&output=embed`;
  }

  const url = mapsUrl?.trim();
  if (!url) return null;

  try {
    const parsed = new URL(url);
    if (!isGoogleMapsHost(parsed.hostname)) return null;
    if (!parsed.searchParams.has("q")) return null;
    const q = parsed.searchParams.get("q")?.trim();
    if (!q) return null;
    return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&z=16&output=embed`;
  } catch {
    return null;
  }
}
