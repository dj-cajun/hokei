/** 로컬 개발 호스트 — SDK·throughTalk·GIS 제한 완화 판단용 */
export function isLocalDevHost(hostname?: string): boolean {
  const h =
    hostname ??
    (typeof window !== "undefined" ? window.location.hostname : "");
  return h === "localhost" || h === "127.0.0.1" || h === "[::1]";
}
