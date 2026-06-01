const STORAGE_KEY = "hokei-guest-comment";

export type GuestCommentCredentials = {
  name: string;
  password: string;
};

export function getGuestCommentCredentials(): GuestCommentCredentials | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GuestCommentCredentials;
    if (parsed.name && parsed.password) return parsed;
  } catch {
    /* ignore */
  }
  return null;
}

export function saveGuestCommentCredentials(creds: GuestCommentCredentials) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(creds));
}
