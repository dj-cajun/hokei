/** 글 수정 시 스토리지에서 제거할 첨부 URL (유지 항목은 제외) */
export function attachmentUrlsToDelete(
  existing: { url: string }[],
  next: { url: string }[] | undefined
): string[] {
  if (next === undefined) return [];
  const keep = new Set(next.map((a) => a.url));
  return existing.filter((old) => !keep.has(old.url)).map((old) => old.url);
}
