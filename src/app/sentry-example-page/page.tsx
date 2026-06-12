"use client";

import * as Sentry from "@sentry/nextjs";

export default function SentryExamplePage() {
  const enabled = Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN);

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-lg font-bold text-gray-900">Sentry 연동 테스트</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {enabled
          ? "버튼을 누르면 테스트 에러가 Sentry로 전송됩니다."
          : ".env에 NEXT_PUBLIC_SENTRY_DSN과 SENTRY_DSN을 설정한 뒤 dev 서버를 재시작하세요."}
      </p>

      <div className="mt-6 flex flex-col gap-3">
        <button
          type="button"
          className="rounded-sm bg-[#0f172a] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          disabled={!enabled}
          onClick={() => {
            throw new Error("Sentry Example Frontend Error");
          }}
        >
          프론트엔드 테스트 에러
        </button>

        <button
          type="button"
          className="rounded-sm border border-border px-4 py-2 text-sm font-medium text-gray-800 disabled:opacity-50"
          disabled={!enabled}
          onClick={() => {
            Sentry.captureMessage("Sentry Example Message", "info");
            alert("captureMessage 전송됨 — Sentry Issues에서 확인하세요.");
          }}
        >
          메시지 전송 (에러 아님)
        </button>

        <button
          type="button"
          className="rounded-sm border border-border px-4 py-2 text-sm font-medium text-gray-800 disabled:opacity-50"
          disabled={!enabled}
          onClick={async () => {
            const res = await fetch("/api/sentry-example-api");
            if (!res.ok) {
              alert(`API 테스트 실패: ${res.status}`);
            }
          }}
        >
          API 테스트 에러
        </button>
      </div>

      <p className="mt-8 text-xs text-muted-foreground">
        프로젝트: javascript-nextjs · org: nam-bac-technology-and-service
        <br />
        <a
          href="https://sentry.io"
          className="text-primary underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Sentry Issues
        </a>
        에서 확인
      </p>
    </div>
  );
}
