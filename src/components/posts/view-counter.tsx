"use client";

import { useEffect, useRef } from "react";

export function ViewCounter({ postId }: { postId: string }) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    void fetch(`/api/posts/${postId}/views`, { method: "POST" }).catch(() => {
      /* ignore */
    });
  }, [postId]);

  return null;
}
