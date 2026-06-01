"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="ko">
      <body className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="max-w-sm space-y-4 text-center">
          <p className="text-6xl font-black text-gray-200">!</p>
          <h1 className="text-lg font-bold text-gray-900">문제가 발생했습니다</h1>
          <p className="text-sm text-gray-500">
            잠시 후 다시 시도해 주세요.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-lg bg-[#0f172a] px-4 py-2 text-sm font-semibold text-white"
          >
            다시 시도
          </button>
        </div>
      </body>
    </html>
  );
}
