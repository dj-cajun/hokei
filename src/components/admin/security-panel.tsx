"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, ShieldBan, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/providers/toast-provider";
import { parseApiError } from "@/lib/api-response";

type AuditLog = {
  id: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  ip: string | null;
  createdAt: string;
  actor: { name: string; email: string };
};

type IpBlock = {
  id: string;
  pattern: string;
  reason: string;
  expiresAt: string | null;
  createdAt: string;
};

export function SecurityPanel() {
  const { showToast } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [blocks, setBlocks] = useState<IpBlock[]>([]);
  const [pattern, setPattern] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [logRes, blockRes] = await Promise.all([
        fetch("/api/admin/audit-logs?limit=60"),
        fetch("/api/admin/ip-blocks"),
      ]);
      const logData = (await logRes.json()) as { logs?: AuditLog[] };
      const blockData = (await blockRes.json()) as { entries?: IpBlock[] };
      if (logRes.ok) setLogs(logData.logs ?? []);
      if (blockRes.ok) setBlocks(blockData.entries ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function addBlock() {
    if (!pattern.trim() || !reason.trim()) return;
    const res = await fetch("/api/admin/ip-blocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pattern: pattern.trim(), reason }),
    });
    const data = await res.json();
    if (!res.ok) {
      showToast(parseApiError(data) ?? "등록 실패", "error");
      return;
    }
    showToast("IP 차단이 등록되었습니다.");
    setPattern("");
    setReason("");
    void load();
  }

  async function removeBlock(id: string) {
    const res = await fetch(`/api/admin/ip-blocks/${id}`, { method: "DELETE" });
    if (res.ok) {
      showToast("차단이 해제되었습니다.");
      void load();
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">IP 차단</h2>
          <Button size="sm" variant="outline" onClick={() => void load()} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "새로고침"}
          </Button>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">
          pattern: 전체 IP (203.0.113.50) 또는 접두사 (203.0.113.)
        </p>
        <div className="mb-4 flex flex-wrap gap-2">
          <input
            className="rounded-lg border border-border px-3 py-2 text-sm"
            placeholder="IP 또는 접두사"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
          />
          <input
            className="min-w-[160px] flex-1 rounded-lg border border-border px-3 py-2 text-sm"
            placeholder="사유"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <Button onClick={() => void addBlock()}>
            <ShieldBan className="mr-1 h-4 w-4" />
            차단 등록
          </Button>
        </div>
        <ul className="space-y-2">
          {blocks.map((b) => (
            <li
              key={b.id}
              className="flex items-center justify-between rounded-xl bg-secondary/40 px-3 py-2 text-sm"
            >
              <div>
                <span className="font-mono font-medium">{b.pattern}</span>
                <span className="ml-2 text-muted-foreground">{b.reason}</span>
              </div>
              <button
                type="button"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => void removeBlock(b.id)}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl bg-surface p-5">
        <h2 className="mb-4 font-semibold">감사 로그</h2>
        <div className="max-h-[480px] overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="py-2">시각</th>
                <th className="py-2">관리자</th>
                <th className="py-2">행위</th>
                <th className="py-2">IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-b border-border">
                  <td className="py-2 whitespace-nowrap">
                    {new Date(l.createdAt).toLocaleString("ko-KR")}
                  </td>
                  <td className="py-2">{l.actor.name}</td>
                  <td className="py-2 font-mono">{l.action}</td>
                  <td className="py-2 text-muted-foreground">{l.ip ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
