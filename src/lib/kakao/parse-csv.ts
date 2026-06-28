/** 카톡 단톡방 CSV보내기 행 (Date / User / Message) */
export type KakaoCsvRow = {
  date: string;
  user: string;
  message: string;
  parsedAt: Date | null;
  sourceFile?: string;
};

const COLUMN_ALIASES: Record<string, "date" | "user" | "message"> = {
  date: "date",
  datetime: "date",
  time: "date",
  timestamp: "date",
  날짜: "date",
  일시: "date",
  시간: "date",
  user: "user",
  users: "user",
  sender: "user",
  name: "user",
  유저: "user",
  사용자: "user",
  발신자: "user",
  닉네임: "user",
  message: "message",
  messages: "message",
  content: "message",
  text: "message",
  body: "message",
  메시지: "message",
  내용: "message",
  글: "message",
};

function normalizeHeader(cell: string): string {
  return cell
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
}

function mapHeaderToField(header: string): "date" | "user" | "message" | null {
  const key = normalizeHeader(header);
  return COLUMN_ALIASES[key] ?? null;
}

/** 간단 CSV 파서 — 따옴표·쉼표·CRLF 지원 */
export function parseCsvRecords(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  const pushCell = () => {
    row.push(cell);
    cell = "";
  };

  const pushRow = () => {
    if (row.length > 0 || cell.length > 0) {
      pushCell();
      rows.push(row);
      row = [];
    }
  };

  const src = text.replace(/^\uFEFF/, "");

  for (let i = 0; i < src.length; i++) {
    const ch = src[i]!;
    const next = src[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      continue;
    }

    if (ch === ",") {
      pushCell();
      continue;
    }

    if (ch === "\n") {
      pushRow();
      continue;
    }

    if (ch === "\r") {
      if (next === "\n") i++;
      pushRow();
      continue;
    }

    cell += ch;
  }

  if (cell.length > 0 || row.length > 0) pushRow();
  return rows.filter((r) => r.some((c) => c.trim().length > 0));
}

export function parseKakaoCsvDate(raw: string): Date | null {
  const s = raw.trim();
  if (!s) return null;

  const iso = Date.parse(s);
  if (!Number.isNaN(iso)) return new Date(iso);

  const m = s.match(
    /^(\d{4})[.\-/년](\d{1,2})[.\-/월](\d{1,2})(?:일)?(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/
  );
  if (m) {
    const [, y, mo, d, h = "12", mi = "0", sec = "0"] = m;
    const dt = new Date(
      `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}T${h.padStart(2, "0")}:${mi.padStart(2, "0")}:${sec.padStart(2, "0")}+07:00`
    );
    return Number.isNaN(dt.getTime()) ? null : dt;
  }

  return null;
}

export function parseKakaoCsvText(
  text: string,
  sourceFile?: string
): KakaoCsvRow[] {
  const records = parseCsvRecords(text);
  if (records.length < 2) return [];

  const header = records[0]!;
  const fieldIndex: Partial<Record<"date" | "user" | "message", number>> = {};

  header.forEach((cell, idx) => {
    const field = mapHeaderToField(cell);
    if (field && fieldIndex[field] === undefined) {
      fieldIndex[field] = idx;
    }
  });

  if (
    fieldIndex.date === undefined ||
    fieldIndex.user === undefined ||
    fieldIndex.message === undefined
  ) {
    throw new Error(
      "CSV 헤더에 Date·User·Message(또는 날짜·유저·메시지) 열이 필요합니다."
    );
  }

  const rows: KakaoCsvRow[] = [];

  for (let i = 1; i < records.length; i++) {
    const rec = records[i]!;
    const date = (rec[fieldIndex.date!] ?? "").trim();
    const user = (rec[fieldIndex.user!] ?? "").trim();
    const message = (rec[fieldIndex.message!] ?? "").trim();
    if (!message) continue;

    rows.push({
      date,
      user,
      message,
      parsedAt: parseKakaoCsvDate(date),
      sourceFile,
    });
  }

  return rows;
}
