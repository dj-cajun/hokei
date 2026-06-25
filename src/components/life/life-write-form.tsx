"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/providers/toast-provider";
import { parseApiError } from "@/lib/api-response";
import { slugifyLifeTitle } from "@/lib/life/slugify-title";
import type { LifeDomain } from "@/generated/prisma/client";

export function LifeWriteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const domainParam = searchParams.get("domain");
  const isStudy = domainParam === "STUDY";

  const { showToast } = useToast();
  const [title, setTitle] = useState("");
  const [vnText, setVnText] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const slug = slugifyLifeTitle(title);
      const res = await fetch("/api/life/guides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          kind: "PHRASE",
          domain: (isStudy ? "STUDY" : "FOOD") as LifeDomain,
          title,
          vnText: vnText || undefined,
          body,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        showToast(parseApiError(data) ?? "등록에 실패했습니다.", "error");
        return;
      }
      showToast("등록했습니다.", "success");
      router.push(`/life/${data.item.slug}`);
    } catch {
      showToast("등록에 실패했습니다.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 px-3 py-4">
      <div>
        <Label htmlFor="life-title">제목</Label>
        <Input
          id="life-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={isStudy ? '[매일 베트남어] "이거 얼마예요?"' : "코리안더 없이 주문하기"}
          required
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="life-vn">베트남어 원문</Label>
        <Input
          id="life-vn"
          value={vnText}
          onChange={(e) => setVnText(e.target.value)}
          placeholder="Bao nhiêu tiền?"
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="life-body">해설 · 팁</Label>
        <textarea
          id="life-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          rows={8}
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="성조, 뉘앙스, 현지에서 쓰는 상황을 적어 주세요."
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          등록
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href={isStudy ? "/life/study" : "/life"}>취소</Link>
        </Button>
      </div>
    </form>
  );
}
