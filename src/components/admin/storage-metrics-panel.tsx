"use client";

import { useCallback, useState } from "react";
import { Database, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/providers/toast-provider";

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

type Snapshot = {
  takenAt: string;
  attachmentBytes: number;
  attachmentCount: number;
};

type Props = {
  initialCurrent?: { attachmentBytes: number; attachmentCount: number };
  initialSnapshots?: Snapshot[];
};

export function StorageMetricsPanel({
  initialCurrent,
  initialSnapshots = [],
}: Props) {
  const { showToast } = useToast();
  const [current, setCurrent] = useState(initialCurrent ?? null);
  const [snapshots, setSnapshots] = useState<Snapshot[]>(initialSnapshots);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/metrics/storage");
      const data = (await res.json()) as {
        current?: { attachmentBytes: number; attachmentCount: number };
        snapshots?: Snapshot[];
      };
      if (res.ok) {
        setCurrent(data.current ?? null);
        setSnapshots(data.snapshots ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  async function takeSnapshot() {
    const res = await fetch("/api/admin/metrics/storage", { method: "POST" });
    if (res.ok) {
      showToast("스냅샷이 저장되었습니다.");
      void load();
    }
  }

  const maxBytes = Math.max(
    ...snapshots.map((s) => s.attachmentBytes),
    current?.attachmentBytes ?? 0,
    1
  );

  return (
    <div className="rounded-2xl bg-surface p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">첨부·스토리지</h2>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => void load()} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "새로고침"}
          </Button>
          <Button size="sm" onClick={() => void takeSnapshot()}>
            스냅샷 저장
          </Button>
        </div>
      </div>

      {current && (
        <p className="mt-3 text-sm text-muted-foreground">
          현재 첨부 {current.attachmentCount}개 · {formatBytes(current.attachmentBytes)}
        </p>
      )}

      {snapshots.length > 0 && (
        <div className="mt-4 flex h-24 items-end gap-1">
          {[...snapshots].reverse().slice(-20).map((s, i) => (
            <div
              key={i}
              className="min-w-[6px] flex-1 rounded-t bg-primary/70"
              style={{
                height: `${Math.max(8, (s.attachmentBytes / maxBytes) * 100)}%`,
              }}
              title={`${new Date(s.takenAt).toLocaleDateString("ko-KR")} ${formatBytes(s.attachmentBytes)}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
