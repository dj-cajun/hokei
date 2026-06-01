const SIGNATURES: { mime: string; bytes: number[] }[] = [
  { mime: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  { mime: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47] },
  { mime: "image/gif", bytes: [0x47, 0x49, 0x46] },
  { mime: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46] },
];

export function sniffMimeType(buffer: Buffer): string | null {
  for (const sig of SIGNATURES) {
    if (sig.bytes.every((b, i) => buffer[i] === b)) return sig.mime;
  }
  return null;
}

export function assertAllowedUpload(
  buffer: Buffer,
  declaredMime: string
): { mimeType: string; kind: "IMAGE" | "FILE" } {
  const sniffed = sniffMimeType(buffer);
  if (sniffed) {
    return { mimeType: sniffed, kind: "IMAGE" };
  }

  const safeDoc =
    declaredMime === "application/pdf" ||
    declaredMime === "text/plain" ||
    declaredMime.startsWith("application/vnd.");

  if (safeDoc) {
    return { mimeType: declaredMime, kind: "FILE" };
  }

  throw new Error("허용되지 않는 파일 형식입니다.");
}
