"use client";

import dynamic from "next/dynamic";
import { ExchangeCalculatorPlaceholder } from "@/components/widgets/exchange-calculator-placeholder";

const ExchangeCalculator = dynamic(
  () =>
    import("@/components/widgets/exchange-calculator").then(
      (mod) => mod.ExchangeCalculator
    ),
  {
    ssr: false,
    loading: ExchangeCalculatorPlaceholder,
  }
);

type ExchangeCalculatorShellProps = {
  vndPerKrw: number;
};

/** 서버 HTML에 input을 넣지 않아 하이드레이션·확장 프로그램 간섭 방지 */
export function ExchangeCalculatorShell({
  vndPerKrw,
}: ExchangeCalculatorShellProps) {
  return <ExchangeCalculator vndPerKrw={vndPerKrw} />;
}
