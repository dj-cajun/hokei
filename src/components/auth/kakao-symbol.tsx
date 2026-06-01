/** 카카오톡 심볼 (공식 가이드 형태 — 단색) */
export function KakaoSymbol({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9 1.5C4.86 1.5 1.5 4.185 1.5 7.455c0 2.04 1.365 3.84 3.42 4.86L3.9 15.75l3.33-2.175c.57.09 1.17.135 1.77.135 4.14 0 7.5-2.685 7.5-6.015C16.5 4.185 13.14 1.5 9 1.5Z"
        fill="currentColor"
      />
    </svg>
  );
}
