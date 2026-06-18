"use client";

import { useMemo, useState } from "react";
import { KRW_DISPLAY_UNIT } from "@/lib/exchange";

type ExchangeCalculatorProps = {
  vndPerKrw: number;
};

function formatKrw(n: number) {
  return Math.round(n).toLocaleString("ko-KR");
}

function formatVnd(n: number) {
  return Math.round(n).toLocaleString("en-US");
}

export function ExchangeCalculator({ vndPerKrw }: ExchangeCalculatorProps) {
  const [krwInput, setKrwInput] = useState(String(KRW_DISPLAY_UNIT));
  const [vndInput, setVndInput] = useState("");
  const [lastEdited, setLastEdited] = useState<"krw" | "vnd">("krw");

  const { krw, vnd } = useMemo(() => {
    if (!vndPerKrw) return { krw: krwInput, vnd: vndInput };

    if (lastEdited === "krw") {
      const n = parseFloat(krwInput.replace(/,/g, ""));
      if (Number.isNaN(n)) return { krw: krwInput, vnd: "" };
      return { krw: krwInput, vnd: formatVnd(n * vndPerKrw) };
    }

    const n = parseFloat(vndInput.replace(/,/g, ""));
    if (Number.isNaN(n)) return { krw: "", vnd: vndInput };
    return { krw: formatKrw(n / vndPerKrw), vnd: vndInput };
  }, [krwInput, vndInput, lastEdited, vndPerKrw]);

  return (
    <div className="mt-3 space-y-2 border-t border-border-light pt-3">
      <p className="text-xs font-semibold text-foreground">환율 계산기</p>
      <label htmlFor="exchange-krw" className="block text-[11px] text-muted-foreground">
        KRW (원)
        <input
          id="exchange-krw"
          name="exchangeKrw"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={krw}
          onChange={(e) => {
            setLastEdited("krw");
            setKrwInput(e.target.value.replace(/[^\d.]/g, ""));
          }}
          className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
          placeholder="1000"
        />
      </label>
      <label htmlFor="exchange-vnd" className="block text-[11px] text-muted-foreground">
        VND (동)
        <input
          id="exchange-vnd"
          name="exchangeVnd"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={vnd}
          onChange={(e) => {
            setLastEdited("vnd");
            setVndInput(e.target.value.replace(/[^\d.]/g, ""));
          }}
          className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
          placeholder="20000"
        />
      </label>
    </div>
  );
}
