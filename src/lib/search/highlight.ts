function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function splitHighlight(text: string, query: string): { text: string; mark: boolean }[] {
  const q = query.trim();
  if (!q) return [{ text, mark: false }];

  const re = new RegExp(`(${escapeRegExp(q)})`, "gi");
  return text.split(re).filter(Boolean).map((part) => ({
    text: part,
    mark: part.toLowerCase() === q.toLowerCase(),
  }));
}
