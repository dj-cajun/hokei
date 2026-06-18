"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/providers/toast-provider";
import { parseApiError } from "@/lib/api-response";

type ReportContentButtonProps = {
  targetType: "POST" | "COMMENT";
  targetId: string;
  className?: string;
};

const REASONS = [
  { value: "SPAM", label: "스팸" },
  { value: "AD", label: "광고" },
  { value: "ABUSE", label: "욕설·혐오" },
  { value: "OTHER", label: "기타" },
] as const;

export function ReportContentButton({
  targetType,
  targetId,
  className,
}: ReportContentButtonProps) {
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<(typeof REASONS)[number]["value"]>("SPAM");
  const [detail, setDetail] = useState("");
  const [pending, setPending] = useState(false);

  async function submit() {
    setPending(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType,
          targetId,
          reason,
          detail: detail.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(parseApiError(data) ?? "신고 실패", "error");
        return;
      }
      showToast("신고가 접수되었습니다.");
      setOpen(false);
      setDetail("");
    } finally {
      setPending(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        className={className ?? "text-xs text-muted-foreground hover:text-foreground"}
        onClick={() => setOpen(true)}
      >
        <Flag className="mr-0.5 inline h-3 w-3" />
        신고
      </button>
    );
  }

  return (
    <div className="mt-2 rounded-lg border border-border bg-secondary/30 p-2 text-xs">
      <p className="mb-1 font-medium text-foreground">신고 사유</p>
      <select
        id={`report-reason-${targetId}`}
        name="reportReason"
        className="mb-2 w-full rounded border border-border bg-surface px-2 py-1"
        value={reason}
        onChange={(e) =>
          setReason(e.target.value as (typeof REASONS)[number]["value"])
        }
      >
        {REASONS.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>
      <textarea
        id={`report-detail-${targetId}`}
        name="reportDetail"
        className="mb-2 w-full rounded border border-border bg-surface px-2 py-1"
        rows={2}
        placeholder="추가 설명 (선택)"
        value={detail}
        onChange={(e) => setDetail(e.target.value)}
      />
      <div className="flex gap-2">
        <Button size="sm" disabled={pending} onClick={() => void submit()}>
          제출
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
          취소
        </Button>
      </div>
    </div>
  );
}
