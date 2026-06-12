"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";

type MessageItem = {
  id: string;
  body: string;
  isMine: boolean;
  createdAt: string;
};

type ConversationThreadProps = {
  conversationId: string;
  peerName: string;
};

function mergeMessages(prev: MessageItem[], incoming: MessageItem[]): MessageItem[] {
  const map = new Map(prev.map((m) => [m.id, m]));
  for (const m of incoming) {
    map.set(m.id, m);
  }
  return [...map.values()].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

export function ConversationThread({
  conversationId,
  peerName,
}: ConversationThreadProps) {
  const { showToast } = useToast();
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastEventAtRef = useRef<string>(new Date(0).toISOString());

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`);
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error ?? "메시지를 불러오지 못했습니다.", "error");
        return;
      }
      const list = (data.messages ?? []) as MessageItem[];
      setMessages((prev) => mergeMessages(prev, list));
      const last = list[list.length - 1];
      if (last) {
        lastEventAtRef.current = last.createdAt;
      }
    } catch {
      showToast("메시지를 불러오지 못했습니다.", "error");
    } finally {
      setLoading(false);
    }
  }, [conversationId, showToast]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    let source: EventSource | null = null;
    let reconnectTimer: number | null = null;
    let stopped = false;

    const connect = () => {
      if (stopped) return;
      const since = encodeURIComponent(lastEventAtRef.current);
      source = new EventSource(
        `/api/conversations/${conversationId}/stream?since=${since}`
      );

      source.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as {
            type: string;
            message?: MessageItem;
          };
          if (data.type === "message" && data.message) {
            const incoming = data.message;
            lastEventAtRef.current = incoming.createdAt;
            setMessages((prev) => mergeMessages(prev, [incoming]));
          }
          if (data.type === "reconnect") {
            source?.close();
            connect();
          }
        } catch {
          /* ignore malformed event */
        }
      };

      source.onerror = () => {
        source?.close();
        if (!stopped) {
          reconnectTimer = window.setTimeout(connect, 2_000);
        }
      };
    };

    connect();

    return () => {
      stopped = true;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      source?.close();
    };
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error ?? "전송에 실패했습니다.", "error");
        return;
      }
      setDraft("");
      if (data.message) {
        lastEventAtRef.current = data.message.createdAt;
        setMessages((prev) => mergeMessages(prev, [data.message]));
      }
    } catch {
      showToast("전송에 실패했습니다.", "error");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] flex-1 flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto px-2 py-4">
        {messages.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">
            {peerName}님과의 대화를 시작해 보세요.
          </p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.isMine ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                m.isMine
                  ? "bg-primary text-white"
                  : "bg-muted text-gray-800"
              }`}
            >
              {m.body}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={send}
        className="sticky bottom-12 flex gap-2 border-t border-border bg-surface p-3 lg:bottom-0"
      >
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="메시지 입력"
          maxLength={2000}
          className="min-w-0 flex-1 rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white disabled:opacity-50"
          aria-label="보내기"
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </form>
    </div>
  );
}
