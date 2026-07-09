import { prisma } from "@/lib/prisma";

export const BANNED_WORDS_SETTING_KEY = "moderation.bannedWords";
export const BANNED_WORDS_MAX = 200;
export const BANNED_WORD_MAX_LENGTH = 80;

export const BANNED_WORD_REJECT_MESSAGE =
  "금지어가 포함되어 등록할 수 없습니다.";

export function parseBannedWordsInput(raw: string): string[] {
  const seen = new Set<string>();
  const words: string[] = [];

  for (const line of raw.split(/\r?\n/)) {
    for (const part of line.split(/[,;|]/)) {
      const word = part.trim();
      if (!word || word.length > BANNED_WORD_MAX_LENGTH) continue;
      const key = word.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      words.push(word);
      if (words.length >= BANNED_WORDS_MAX) return words;
    }
  }

  return words;
}

export function serializeBannedWords(words: string[]): string {
  return JSON.stringify(words);
}

export async function getBannedWords(): Promise<string[]> {
  const row = await prisma.appSetting.findUnique({
    where: { key: BANNED_WORDS_SETTING_KEY },
  });
  if (!row?.value?.trim()) return [];

  try {
    const parsed: unknown = JSON.parse(row.value);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((w): w is string => typeof w === "string")
      .map((w) => w.trim())
      .filter(Boolean)
      .slice(0, BANNED_WORDS_MAX);
  } catch {
    return parseBannedWordsInput(row.value);
  }
}

export async function setBannedWords(words: string[]): Promise<string[]> {
  const normalized = parseBannedWordsInput(words.join("\n"));
  await prisma.appSetting.upsert({
    where: { key: BANNED_WORDS_SETTING_KEY },
    create: {
      key: BANNED_WORDS_SETTING_KEY,
      value: serializeBannedWords(normalized),
    },
    update: { value: serializeBannedWords(normalized) },
  });
  return normalized;
}

export function findBannedWord(
  texts: string[],
  words: string[]
): string | null {
  if (words.length === 0) return null;
  const haystack = texts.join("\n").toLowerCase();
  for (const word of words) {
    const needle = word.trim().toLowerCase();
    if (needle && haystack.includes(needle)) return word;
  }
  return null;
}

export async function rejectIfBannedWords(
  texts: string[]
): Promise<{ ok: true } | { ok: false; message: string }> {
  const words = await getBannedWords();
  const hit = findBannedWord(texts, words);
  if (hit) {
    return {
      ok: false,
      message: `${BANNED_WORD_REJECT_MESSAGE} (${hit})`,
    };
  }
  return { ok: true };
}
