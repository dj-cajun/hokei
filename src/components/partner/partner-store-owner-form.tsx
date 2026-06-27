"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ExternalLink, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/providers/toast-provider";
import { parseApiError } from "@/lib/api-response";
import type { PartnerStatus } from "@/generated/prisma/client";

type StoreData = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  introText: string | null;
  description: string | null;
  menuText: string | null;
  phone: string | null;
  kakaoLink: string | null;
  mapsUrl: string | null;
  address: string | null;
  locationTips: string | null;
  hoursText: string | null;
  thumbnail: string | null;
  status: PartnerStatus;
};

const emptyForm = {
  tagline: "",
  introText: "",
  description: "",
  menuText: "",
  phone: "",
  kakaoLink: "",
  mapsUrl: "",
  address: "",
  locationTips: "",
  hoursText: "",
  thumbnail: "",
};

async function uploadImage(file: File): Promise<string | null> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/uploads", { method: "POST", body: form });
  const data = await res.json();
  if (!res.ok || !data.ok) return null;
  return data.url as string;
}

export function PartnerStoreOwnerForm() {
  const { showToast } = useToast();
  const [store, setStore] = useState<StoreData | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/partner/my-store");
    const data = await res.json();
    if (!res.ok || !data.ok) {
      setStore(null);
      return;
    }
    const s = data.store as StoreData;
    setStore(s);
    setForm({
      tagline: s.tagline ?? "",
      introText: s.introText ?? "",
      description: s.description ?? "",
      menuText: s.menuText ?? "",
      phone: s.phone ?? "",
      kakaoLink: s.kakaoLink ?? "",
      mapsUrl: s.mapsUrl ?? "",
      address: s.address ?? "",
      locationTips: s.locationTips ?? "",
      hoursText: s.hoursText ?? "",
      thumbnail: s.thumbnail ?? "",
    });
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load().finally(() => setReady(true));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/partner/my-store", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          tagline: form.tagline || undefined,
          introText: form.introText || undefined,
          description: form.description || undefined,
          menuText: form.menuText || undefined,
          phone: form.phone || undefined,
          kakaoLink: form.kakaoLink || undefined,
          mapsUrl: form.mapsUrl || undefined,
          address: form.address || undefined,
          locationTips: form.locationTips || undefined,
          hoursText: form.hoursText || undefined,
          thumbnail: form.thumbnail || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        showToast(parseApiError(data) ?? "저장 실패", "error");
        return;
      }
      showToast("저장했습니다.");
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function handleThumbUpload(file: File) {
    setUploading(true);
    try {
      const url = await uploadImage(file);
      if (!url) {
        showToast("업로드 실패", "error");
        return;
      }
      setForm((f) => ({ ...f, thumbnail: url }));
      showToast("썸네일을 업로드했습니다.");
    } finally {
      setUploading(false);
    }
  }

  if (!ready) {
    return <p className="text-sm text-muted-foreground">불러오는 중…</p>;
  }

  if (!store) {
    return (
      <p className="text-sm text-muted-foreground">
        연결된 제휴 업소가 없습니다. 문의는{" "}
        <a href="mailto:ads@hokei.vn" className="text-primary hover:underline">
          ads@hokei.vn
        </a>
        으로 연락해 주세요.
      </p>
    );
  }

  const previewHref =
    store.status === "PUBLISHED"
      ? `/store/${store.slug}`
      : `/store/${store.slug}?preview=1`;

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <div className="rounded-lg border border-border-light bg-secondary/40 px-3 py-2 text-sm">
        <p className="font-semibold">{store.name}</p>
        <p className="text-xs text-muted-foreground">
          /store/{store.slug} · {store.status}
        </p>
        <Link
          href={previewHref}
          target="_blank"
          className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          LP 보기 <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      <div>
        <Label htmlFor="tagline">한 줄 소개</Label>
        <Input
          id="tagline"
          value={form.tagline}
          onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="introText">소개</Label>
        <textarea
          id="introText"
          value={form.introText}
          onChange={(e) =>
            setForm((f) => ({ ...f, introText: e.target.value }))
          }
          rows={4}
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>
      <div>
        <Label htmlFor="description">상세 설명</Label>
        <textarea
          id="description"
          value={form.description}
          onChange={(e) =>
            setForm((f) => ({ ...f, description: e.target.value }))
          }
          rows={3}
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>
      <div>
        <Label htmlFor="menuText">메뉴·가격</Label>
        <textarea
          id="menuText"
          value={form.menuText}
          onChange={(e) =>
            setForm((f) => ({ ...f, menuText: e.target.value }))
          }
          rows={4}
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="kakaoLink">카카오 링크</Label>
          <Input
            id="kakaoLink"
            value={form.kakaoLink}
            onChange={(e) =>
              setForm((f) => ({ ...f, kakaoLink: e.target.value }))
            }
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="phone">전화</Label>
          <Input
            id="phone"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            className="mt-1"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="mapsUrl">Google Maps URL</Label>
        <Input
          id="mapsUrl"
          value={form.mapsUrl}
          onChange={(e) => setForm((f) => ({ ...f, mapsUrl: e.target.value }))}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="address">주소</Label>
        <Input
          id="address"
          value={form.address}
          onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="locationTips">오시는 길 팁</Label>
        <textarea
          id="locationTips"
          value={form.locationTips}
          onChange={(e) =>
            setForm((f) => ({ ...f, locationTips: e.target.value }))
          }
          rows={3}
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>
      <div>
        <Label htmlFor="hoursText">영업시간·이벤트</Label>
        <textarea
          id="hoursText"
          value={form.hoursText}
          onChange={(e) =>
            setForm((f) => ({ ...f, hoursText: e.target.value }))
          }
          rows={4}
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>
      <div>
        <Label htmlFor="thumbnail">썸네일 URL</Label>
        <div className="mt-1 flex gap-2">
          <Input
            id="thumbnail"
            value={form.thumbnail}
            onChange={(e) =>
              setForm((f) => ({ ...f, thumbnail: e.target.value }))
            }
          />
          <input
            ref={thumbInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleThumbUpload(file);
            }}
          />
          <Button
            type="button"
            variant="outline"
            disabled={uploading}
            onClick={() => thumbInputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      <Button type="submit" disabled={saving}>
        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        저장
      </Button>
    </form>
  );
}
