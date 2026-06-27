/** dynamic(ssr:false) 로딩 중 레이아웃 유지 — input 없음(하이드레이션 안전) */
export function ExchangeCalculatorPlaceholder() {
  return (
    <div className="mt-3 space-y-2 border-t border-border-light pt-3">
      <p className="text-xs font-semibold text-foreground">환율 계산기</p>
      <div className="space-y-2">
        <div className="h-[52px] animate-pulse rounded-lg bg-secondary" />
        <div className="h-[52px] animate-pulse rounded-lg bg-secondary" />
      </div>
    </div>
  );
}
