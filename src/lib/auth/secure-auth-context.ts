/** FedCM·Google One Tap — HTTPS 또는 localhost에서만 활성화 */
export function canUseFedCmPrompt(): boolean {
  if (typeof window === "undefined") return false;
  const { protocol, hostname } = window.location;
  if (protocol === "https:") return true;
  return (
    protocol === "http:" &&
    (hostname === "localhost" || hostname === "127.0.0.1")
  );
}
