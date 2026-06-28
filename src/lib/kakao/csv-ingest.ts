import {
  formatKakaoTimeBlocksForPrompt,
  type KakaoTimeBlock,
} from "@/lib/ai/curate-kakao-split";
import {
  isLowValueKakaoCsvMessage,
  normalizeKakaoCsvMessageForDedupe,
} from "@/lib/kakao/csv-filters";
import {
  normalizeRawBodyForHash,
  shouldSkipKakaoSystemMessage,
} from "@/lib/kakao/kakao-csv-system";
import { parseKakaoCsvText, type KakaoCsvRow } from "@/lib/kakao/parse-csv";

export type KakaoCsvFileInput = {
  name: string;
  content: string;
};

/** CSV ingest — 최근 N일만 분석 (기본 7일) */
export const KAKAO_CSV_LOOKBACK_DAYS = 7;

export type KakaoCsvIngestStats = {
  files: number;
  totalRows: number;
  dateSkipped: number;
  systemSkipped: number;
  lowValueSkipped: number;
  macroDeduped: number;
  outputRows: number;
};

export type KakaoCsvIngestResult = {
  text: string;
  stats: KakaoCsvIngestStats;
};

export type KakaoCsvIngestOptions = {
  lookbackDays?: number;
  now?: Date;
};

function formatRowTimeLabel(row: KakaoCsvRow): string {
  const datePart = row.date.trim() || "시간미상";
  const userPart = row.user.trim();
  return userPart ? `${datePart} ${userPart}` : datePart;
}

function rowToTimeBlock(row: KakaoCsvRow): KakaoTimeBlock {
  return {
    timeLabel: formatRowTimeLabel(row),
    text: row.message.trim(),
    senderName: row.user.trim() || undefined,
    messageAt: row.parsedAt?.toISOString(),
  };
}

export function filterCsvByRecency(
  rows: KakaoCsvRow[],
  options?: KakaoCsvIngestOptions
): { kept: KakaoCsvRow[]; dateSkipped: number } {
  const lookbackDays = options?.lookbackDays ?? KAKAO_CSV_LOOKBACK_DAYS;
  const now = options?.now ?? new Date();
  const cutoff = new Date(now.getTime() - lookbackDays * 24 * 60 * 60 * 1000);

  const kept: KakaoCsvRow[] = [];
  let dateSkipped = 0;

  for (const row of rows) {
    if (!row.parsedAt) {
      dateSkipped += 1;
      continue;
    }
    if (row.parsedAt < cutoff) {
      dateSkipped += 1;
      continue;
    }
    kept.push(row);
  }

  return { kept, dateSkipped };
}

export function dedupeCsvRowsByMessageBody(rows: KakaoCsvRow[]): {
  unique: KakaoCsvRow[];
  macroDeduped: number;
} {
  const sorted = [...rows].sort((a, b) => {
    const ta = a.parsedAt?.getTime() ?? 0;
    const tb = b.parsedAt?.getTime() ?? 0;
    return ta - tb;
  });

  const byBody = new Map<string, KakaoCsvRow>();

  for (const row of sorted) {
    const key = normalizeRawBodyForHash(
      normalizeKakaoCsvMessageForDedupe(row.message)
    );
    if (!key) continue;
    byBody.set(key, row);
  }

  const unique = [...byBody.values()];
  return {
    unique,
    macroDeduped: rows.length - unique.length,
  };
}

export function filterCsvSystemRows(rows: KakaoCsvRow[]): {
  kept: KakaoCsvRow[];
  systemSkipped: number;
} {
  const kept: KakaoCsvRow[] = [];
  let systemSkipped = 0;

  for (const row of rows) {
    if (shouldSkipKakaoSystemMessage(row.user, row.message)) {
      systemSkipped += 1;
      continue;
    }
    kept.push(row);
  }

  return { kept, systemSkipped };
}

export function filterCsvLowValueRows(rows: KakaoCsvRow[]): {
  kept: KakaoCsvRow[];
  lowValueSkipped: number;
} {
  const kept: KakaoCsvRow[] = [];
  let lowValueSkipped = 0;

  for (const row of rows) {
    if (isLowValueKakaoCsvMessage(row.message)) {
      lowValueSkipped += 1;
      continue;
    }
    kept.push(row);
  }

  return { kept, lowValueSkipped };
}

/** CSV 1개 이상 → AI 분석용 카톡 원문 텍스트 (최근 lookbackDays일만) */
export function ingestKakaoCsvTexts(
  files: KakaoCsvFileInput[],
  options?: KakaoCsvIngestOptions
): KakaoCsvIngestResult {
  const emptyStats: KakaoCsvIngestStats = {
    files: 0,
    totalRows: 0,
    dateSkipped: 0,
    systemSkipped: 0,
    lowValueSkipped: 0,
    macroDeduped: 0,
    outputRows: 0,
  };

  if (files.length === 0) {
    return { text: "", stats: emptyStats };
  }

  const allRows: KakaoCsvRow[] = [];

  for (const file of files) {
    const rows = parseKakaoCsvText(file.content, file.name);
    allRows.push(...rows);
  }

  const totalRows = allRows.length;
  const { kept: recentRows, dateSkipped } = filterCsvByRecency(allRows, options);
  const { kept: afterSystem, systemSkipped } = filterCsvSystemRows(recentRows);
  const { kept, lowValueSkipped } = filterCsvLowValueRows(afterSystem);
  const { unique, macroDeduped } = dedupeCsvRowsByMessageBody(kept);

  const blocks = unique.map(rowToTimeBlock);
  const text = formatKakaoTimeBlocksForPrompt(blocks);

  return {
    text,
    stats: {
      files: files.length,
      totalRows,
      dateSkipped,
      systemSkipped,
      lowValueSkipped,
      macroDeduped,
      outputRows: unique.length,
    },
  };
}
