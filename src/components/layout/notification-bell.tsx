"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  href: string | null;
  isRead: boolean;
  createdAt: string;
};

const POLL_MS = 30_000;

async function fetchNotifications(): Promise<{
  items: NotificationItem[];
  unreadCount: number;
} | null> {
  try {
    const res = await fetch("/api/notifications");
    const data = await res.json();
    if (!res.ok || !data.ok) return null;
    return {
      items: data.items ?? [],
      unreadCount: data.unreadCount ?? 0,
    };
  } catch {
    return null;
  }
}

export function NotificationBell() {
  const { status } = useSession();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status !== "authenticated") return;

    let active = true;

    const refresh = () => {
      void fetchNotifications().then((data) => {
        if (!active || !data) return;
        setItems(data.items);
        setUnreadCount(data.unreadCount);
      });
    };

    refresh();
    const timer = window.setInterval(refresh, POLL_MS);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [status]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!panelRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  async function markRead(ids: string[]) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    const data = await fetchNotifications();
    if (data) {
      setItems(data.items);
      setUnreadCount(data.unreadCount);
    }
  }

  if (status !== "authenticated") return null;

  return (
    <div className="relative" ref={panelRef}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="relative h-8 w-8"
        aria-label="알림"
        aria-expanded={open}
        onClick={() => {
          setOpen((prev) => {
            const next = !prev;
            if (next) {
              void fetchNotifications().then((data) => {
                if (!data) return;
                setItems(data.items);
                setUnreadCount(data.unreadCount);
              });
            }
            return next;
          });
        }}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#c8102e] px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-[min(100vw-2rem,320px)] overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
          <div className="flex items-center justify-between border-b border-border-light px-3 py-2">
            <p className="text-sm font-semibold">알림</p>
            {unreadCount > 0 && (
              <button
                type="button"
                className="text-xs text-primary hover:underline"
                onClick={() =>
                  void fetch("/api/notifications", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ all: true }),
                  }).then(() => markRead([]))
                }
              >
                모두 읽음
              </button>
            )}
          </div>
          <ul className="max-h-72 overflow-y-auto">
            {items.length === 0 ? (
              <li className="px-3 py-6 text-center text-xs text-muted-foreground">
                알림이 없습니다
              </li>
            ) : (
              items.map((n) => (
                <li key={n.id}>
                  {n.href ? (
                    <Link
                      href={n.href}
                      onClick={() => {
                        if (!n.isRead) void markRead([n.id]);
                        setOpen(false);
                      }}
                      className={cn(
                        "block px-3 py-2.5 text-left transition-colors hover:bg-card-hover",
                        !n.isRead && "bg-accent/40"
                      )}
                    >
                      <NotificationRow item={n} />
                    </Link>
                  ) : (
                    <div
                      className={cn(
                        "px-3 py-2.5",
                        !n.isRead && "bg-accent/40"
                      )}
                    >
                      <NotificationRow item={n} />
                    </div>
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

function NotificationRow({ item }: { item: NotificationItem }) {
  return (
    <>
      <p className="text-xs font-medium leading-snug">{item.title}</p>
      {item.body && (
        <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">
          {item.body}
        </p>
      )}
      <p className="mt-1 text-[10px] text-muted-foreground">
        {new Date(item.createdAt).toLocaleString("ko-KR", {
          timeZone: "Asia/Ho_Chi_Minh",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>
    </>
  );
}
