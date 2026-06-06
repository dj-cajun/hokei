export function getAdSenseClientId(): string | undefined {
  return process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim() || undefined;
}

export function getAdSenseSlot(
  kind: "article" | "home"
): string | undefined {
  const key =
    kind === "article"
      ? "NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE"
      : "NEXT_PUBLIC_ADSENSE_SLOT_HOME";
  return process.env[key]?.trim() || undefined;
}

export function isAdSenseEnabled(): boolean {
  return Boolean(getAdSenseClientId());
}
