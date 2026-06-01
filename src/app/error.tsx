"use client";

import { useEffect } from "react";
import Link from "next/link";
import { log } from "@/lib/logger";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    log("error", "[app/error]", {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60dvh] max-w-[480px] flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-lg font-bold text-gray-900">문제가 발생했습니다</h1>
      <p className="text-sm text-gray-500">
        일시적인 오류일 수 있습니다. 잠시 후 다시 시도해 주세요.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-sm bg-[#0f172a] px-4 py-2 text-sm font-semibold text-white"
        >
          다시 시도
        </button>
        <Link
          href="/"
          className="rounded-sm border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700"
        >
          홈으로
        </Link>
      </div>
    </div>
  );
}
