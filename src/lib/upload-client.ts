/** 클라이언트 이미지 업로드 — /api/uploads */
export async function uploadClientImage(file: File): Promise<string | null> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/uploads", { method: "POST", body: form });
  const data = await res.json();
  if (!res.ok || !data.ok) return null;
  return data.url as string;
}
