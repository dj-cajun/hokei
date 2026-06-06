"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

type ConversationItem = {
  id: string;
  peer: { id: string; name: string };
  lastMessage: {
    body: string;
    isMine: boolean;
    createdAt: string;
  } | null;
  unreadCount: number;
};

export function MessagesInbox() {
  const [items, setItems] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/conversations");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "목록을 불러오지 못했습니다.");
        return;
      }
      setItems(data.conversations ?? []);
    } catch {
      setError("목록을 불러오지 못했습니다.");
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

  if (loading) {
    return (
      <div className="flex justify-center py-12 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    return <p className="py-8 text-center text-sm text-destructive">{error}</p>;
  }

  if (items.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        아직 쪽지가 없습니다. 게시글에서 &quot;쪽지&quot; 버튼으로 대화를 시작해
        보세요.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
      {items.map((item) => (
        <li key={item.id}>
          <Link
            href={`/messages/${item.id}`}
            className="flex items-start justify-between gap-3 px-4 py-3 hover:bg-gray-50"
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium text-foreground">{item.peer.name}</p>
              {item.lastMessage && (
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {item.lastMessage.isMine ? "나: " : ""}
                  {item.lastMessage.body}
                </p>
              )}
            </div>
            {item.unreadCount > 0 && (
              <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white">
                {item.unreadCount}
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
