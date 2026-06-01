type LogLevel = "info" | "warn" | "error";

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
    console[level](`[${level.toUpperCase()}] ${message}`, meta ?? "");
  }
}
