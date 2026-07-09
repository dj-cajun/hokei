"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/providers/toast-provider";
import { parseApiError } from "@/lib/api-response";

export function BannedWordsPanel() {
  const { showToast } = useToast();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/moderation/banned-words");
      const data = (await res.json()) as { words?: string[] };
      if (res.ok) {
        setText((data.words ?? []).join("\n"));
      }
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

  async function save() {
    setSaving(true);
    try {
      const words = text
        .split(/\r?\n/)
        .map((w) => w.trim())
        .filter(Boolean);
      const res = await fetch("/api/admin/moderation/banned-words", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ words }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(parseApiError(data) ?? "저장 실패", "error");
        return;
      }
      const saved = (data.words as string[] | undefined) ?? [];
      setText(saved.join("\n"));
      showToast(`금지어 ${saved.length}개 저장됨`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-border-light bg-surface p-4">
      <h2 className="text-sm font-bold">금지어</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        한 줄에 하나씩. 제목·본문·댓글에 포함되면 등록이 차단됩니다.
      </p>
      {loading ? (
        <div className="mt-3 flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <textarea
          className="mt-3 min-h-[120px] w-full rounded-xl border border-border bg-background px-3 py-2 font-mono text-xs"
          placeholder={"광고\n텔레그램\n환전대행"}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      )}
      <div className="mt-2 flex justify-end">
        <Button size="sm" disabled={loading || saving} onClick={() => void save()}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "금지어 저장"}
        </Button>
      </div>
    </section>
  );
}
