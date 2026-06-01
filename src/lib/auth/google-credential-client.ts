import { onGoogleLoginSuccess } from "@/lib/auth/google-one-tap";

export async function postGoogleCredential(credential: string): Promise<void> {
  const res = await fetch("/api/auth/google/credential", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credential }),
    credentials: "include",
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "구글 로그인 처리에 실패했습니다.");
  }

  onGoogleLoginSuccess();
}
