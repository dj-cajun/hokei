export const AI_CURATE_SOURCE_PREFIX = "hokei:ai-curate:";

export function buildAiCurateSourceUrl(): string {
  return `${AI_CURATE_SOURCE_PREFIX}${crypto.randomUUID()}`;
}

export function isAiCuratePost(sourceUrl: string): boolean {
  return sourceUrl.startsWith(AI_CURATE_SOURCE_PREFIX);
}
