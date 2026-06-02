/** pattern: 전체 IP 또는 접두사 (예: 203.0.113.) */
export function ipMatchesPattern(ip: string, pattern: string): boolean {
  const p = pattern.trim();
  if (!p || !ip) return false;
  if (p === ip) return true;
  if (p.endsWith(".")) return ip.startsWith(p);
  if (p.endsWith(".*")) return ip.startsWith(p.slice(0, -2));
  return ip.startsWith(`${p}.`) || ip === p;
}
