import { describe, expect, it } from "vitest";
import {
  filterCsvByRecency,
  ingestKakaoCsvTexts,
} from "@/lib/kakao/csv-ingest";
import { parseKakaoCsvText } from "@/lib/kakao/parse-csv";

const SAMPLE_CSV = `Date,User,Message
2026-06-01 10:01:00,JOY마켓,"오늘 특가 떡볶이 5만동"
2026-06-01 10:02:00,오픈채팅봇,안내 메시지
2026-06-01 10:03:00,홍길동,김철수님이 들어왔습니다.
`;

describe("parseKakaoCsvText", () => {
  it("parses Date User Message headers", () => {
    const rows = parseKakaoCsvText(SAMPLE_CSV);
    expect(rows).toHaveLength(3);
    expect(rows[0]?.user).toBe("JOY마켓");
    expect(rows[0]?.message).toContain("특가");
  });

  it("parses Korean headers", () => {
    const csv = `날짜,유저,메시지
2026-06-02 12:00:00,막둥이네,메뉴 안내`;
    const rows = parseKakaoCsvText(csv);
    expect(rows[0]?.user).toBe("막둥이네");
  });

  it("handles quoted commas", () => {
    const csv = `Date,User,Message
2026-06-01 10:00:00,StoreA,"안녕, 특가입니다"`;
    const rows = parseKakaoCsvText(csv);
    expect(rows[0]?.message).toBe("안녕, 특가입니다");
  });
});

describe("filterCsvByRecency", () => {
  it("keeps only rows within lookback window", () => {
    const now = new Date("2026-06-28T12:00:00+07:00");
    const rows = parseKakaoCsvText(`Date,User,Message
2026-06-10 10:00:00,Old,오래된 글
2026-06-25 10:00:00,New,최근 글`);
    const { kept, dateSkipped } = filterCsvByRecency(rows, {
      lookbackDays: 7,
      now,
    });
    expect(kept).toHaveLength(1);
    expect(kept[0]?.message).toBe("최근 글");
    expect(dateSkipped).toBe(1);
  });
});

describe("ingestKakaoCsvTexts", () => {
  const now = new Date("2026-06-28T12:00:00+07:00");

  it("filters system messages and dedupes identical macro across files", () => {
    const macro = "동일 매크로 광고 본문입니다 🔥";
    const fileA = `Date,User,Message
2026-06-25 09:00:00,JOY마켓,"${macro}"`;
    const fileB = `Date,User,Message
2026-06-26 11:00:00,JOY마켓,"${macro}"`;

    const result = ingestKakaoCsvTexts(
      [
        { name: "room-a.csv", content: fileA },
        { name: "room-b.csv", content: fileB },
      ],
      { now }
    );

    expect(result.stats.totalRows).toBe(2);
    expect(result.stats.systemSkipped).toBe(0);
    expect(result.stats.macroDeduped).toBe(1);
    expect(result.stats.outputRows).toBe(1);
    expect(result.text).toContain(macro);
    expect(result.text).toContain("=== [");
  });

  it("skips bot and join system lines from sample", () => {
    const csv = `Date,User,Message
2026-06-27 10:01:00,JOY마켓,"오늘 특가 떡볶이 5만동"
2026-06-27 10:02:00,오픈채팅봇,안내 메시지
2026-06-27 10:03:00,홍길동,김철수님이 들어왔습니다.`;

    const result = ingestKakaoCsvTexts(
      [{ name: "room.csv", content: csv }],
      { now }
    );

    expect(result.stats.systemSkipped).toBe(2);
    expect(result.stats.outputRows).toBe(1);
  });

  it("skips rows older than 7 days", () => {
    const csv = `Date,User,Message
2026-06-10 10:00:00,StoreA,오래된 메뉴 안내입니다
2026-06-27 10:01:00,StoreB,최근 특가 메뉴 안내 0901234567`;
    const result = ingestKakaoCsvTexts([{ name: "r.csv", content: csv }], {
      now,
    });
    expect(result.stats.dateSkipped).toBe(1);
    expect(result.stats.outputRows).toBe(1);
    expect(result.text).toContain("최근 특가");
    expect(result.text).not.toContain("오래된");
  });

  it("skips photo-only and short noise", () => {
    const csv = `Date,User,Message
2026-06-27 10:00:00,StoreA,사진 2장
2026-06-27 10:01:00,StoreA,"오늘 특가 메뉴 안내 0901234567"
2026-06-27 10:02:00,UserB,ㅋㅋ`;
    const result = ingestKakaoCsvTexts([{ name: "r.csv", content: csv }], {
      now,
    });
    expect(result.stats.lowValueSkipped).toBe(2);
    expect(result.stats.outputRows).toBe(1);
  });
});
