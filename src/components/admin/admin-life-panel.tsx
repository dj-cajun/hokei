"use client";

import { FormEvent, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/providers/toast-provider";
import { parseApiError } from "@/lib/api-response";
import { LIFE_DOMAIN_LABELS } from "@/lib/life/labels";
import type { LifeDomain, LifeGuideKind } from "@/generated/prisma/client";

const domains = Object.keys(LIFE_DOMAIN_LABELS) as LifeDomain[];

export function AdminLifePanel() {
  const { showToast } = useToast();
  const [slug, setSlug] = useState("");
  const [kind, setKind] = useState<LifeGuideKind>("PHRASE");
  const [domain, setDomain] = useState<LifeDomain>("FOOD");
  const [title, setTitle] = useState("");
  const [vnText, setVnText] = useState("");
  const [body, setBody] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [sourceLabel, setSourceLabel] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/life", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          kind,
          domain,
          title,
          vnText: vnText || undefined,
          body,
          fileUrl: fileUrl || undefined,
          sourceLabel: sourceLabel || undefined,
          externalUrl: externalUrl || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        showToast(parseApiError(data) ?? "저장에 실패했습니다.", "error");
        return;
      }
      showToast("생활 가이드를 등록했습니다.", "success");
      if (data.item?.slug) {
        window.location.href = `/life/${data.item.slug}`;
      }
    } catch {
      showToast("저장에 실패했습니다.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-2xl bg-surface p-4 shadow-sm"
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <Label htmlFor="kind">종류</Label>
          <select
            id="kind"
            value={kind}
            onChange={(e) => setKind(e.target.value as LifeGuideKind)}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="PHRASE">생활 외국어</option>
            <option value="DOC">오피셜 자료</option>
          </select>
        </div>
        <div>
          <Label htmlFor="domain">분야</Label>
          <select
            id="domain"
            value={domain}
            onChange={(e) => setDomain(e.target.value as LifeDomain)}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {domains.map((d) => (
              <option key={d} value={d}>
                {LIFE_DOMAIN_LABELS[d]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="slug">slug (URL)</Label>
          <Input
            id="slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="no-coriander"
            required
            pattern="[a-z0-9-]+"
            className="mt-1"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="title">제목</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="mt-1"
        />
      </div>
      {kind === "PHRASE" && (
        <div>
          <Label htmlFor="vnText">베트남어</Label>
          <Input
            id="vnText"
            value={vnText}
            onChange={(e) => setVnText(e.target.value)}
            className="mt-1"
          />
        </div>
      )}
      <div>
        <Label htmlFor="body">본문</Label>
        <textarea
          id="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          rows={6}
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>
      {kind === "DOC" && (
        <>
          <div>
            <Label htmlFor="fileUrl">Google Drive 링크</Label>
            <Input
              id="fileUrl"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              type="url"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="sourceLabel">출처 표기</Label>
            <Input
              id="sourceLabel"
              value={sourceLabel}
              onChange={(e) => setSourceLabel(e.target.value)}
              className="mt-1"
            />
          </div>
        </>
      )}
      <div>
        <Label htmlFor="externalUrl">원문 URL (선택)</Label>
        <Input
          id="externalUrl"
          value={externalUrl}
          onChange={(e) => setExternalUrl(e.target.value)}
          type="url"
          className="mt-1"
        />
      </div>
      <Button type="submit" disabled={saving}>
        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        생활 가이드 등록
      </Button>
    </form>
  );
}
