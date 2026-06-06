type LogLevel = "info" | "warn" | "error";

/** RSC·브라우저 콘솔에서도 읽을 수 있도록 Error를 문자열로 변환 */
export function formatUnknownError(error: unknown): string {
  if (error instanceof Error) {
    const parts = [error.name, error.message].filter(Boolean);
    const base = parts.join(": ") || "Error";
    const code =
      "code" in error &&
      typeof (error as { code?: unknown }).code === "string"
        ? (error as { code: string }).code
        : undefined;
    return code ? `${base} (${code})` : base;
  }
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error) ?? String(error);
  } catch {
    return String(error);
  }
}

export function log(
  level: LogLevel,
  message: string,
  meta?: Record<string, unknown>
) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  };

  if (process.env.NODE_ENV === "production") {
    console[level](JSON.stringify(entry));
  } else {
    const detail = meta
      ? Object.entries(meta)
          .map(([key, value]) => `${key}=${formatUnknownError(value)}`)
          .join(" ")
      : "";
    console[level](
      `[${level.toUpperCase()}] ${message}${detail ? ` — ${detail}` : ""}`
    );
  }
}
