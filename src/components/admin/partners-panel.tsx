"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { ExternalLink, Loader2, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/providers/toast-provider";
import { parseApiError } from "@/lib/api-response";
import { PARTNER_CATEGORY_LABELS } from "@/lib/partner/labels";
import { slugifyPartnerNameAscii } from "@/lib/partner/slugify-name";
import type {
  PartnerBannerSlot,
  PartnerCategory,
  PartnerPlan,
  PartnerStatus,
} from "@/generated/prisma/client";

type PartnerStoreRow = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  category: PartnerCategory;
  phone: string | null;
  kakaoLink: string | null;
  mapsUrl: string | null;
  address: string | null;
  hoursText: string | null;
  thumbnail: string | null;
  plan: PartnerPlan;
  status: PartnerStatus;
  sortOrder: number;
  expiresAt: string | null;
  _count?: { banners: number };
};

type PartnerBannerRow = {
  id: string;
  storeId: string;
  slot: PartnerBannerSlot;
  imageUrl: string;
  altText: string | null;
  linkSlug: string | null;
  sortOrder: number;
  isActive: boolean;
  store: { id: string; name: string; slug: string };
};

const categories = Object.keys(PARTNER_CATEGORY_LABELS) as PartnerCategory[];
const plans: PartnerPlan[] = ["BASIC", "STANDARD", "PREMIUM"];
const statuses: PartnerStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];
const slots: PartnerBannerSlot[] = [
  "HOME_BOTTOM",
  "HOME_TOP",
  "NEWS_INLINE",
  "PROMO_TOP",
];

const emptyStoreForm = {
  name: "",
  slug: "",
  tagline: "",
  description: "",
  category: "FOOD" as PartnerCategory,
  phone: "",
  kakaoLink: "",
  mapsUrl: "",
  address: "",
  hoursText: "",
  thumbnail: "",
  plan: "BASIC" as PartnerPlan,
  status: "DRAFT" as PartnerStatus,
  sortOrder: 0,
  expiresAt: "",
};

const emptyBannerForm = {
  storeId: "",
  slot: "HOME_BOTTOM" as PartnerBannerSlot,
  imageUrl: "",
  altText: "",
  linkSlug: "",
  sortOrder: 0,
  isActive: true,
};

export function PartnersPanel() {
  const { showToast } = useToast();
  const [tab, setTab] = useState<"stores" | "banners">("stores");
  const [stores, setStores] = useState<PartnerStoreRow[]>([]);
  const [banners, setBanners] = useState<PartnerBannerRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [storeForm, setStoreForm] = useState(emptyStoreForm);
  const [bannerForm, setBannerForm] = useState(emptyBannerForm);
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);

  const loadStores = useCallback(async () => {
    const res = await fetch("/api/admin/partners");
    const data = (await res.json()) as { stores?: PartnerStoreRow[]; ok?: boolean };
    if (res.ok && data.ok) setStores(data.stores ?? []);
  }, []);

  const loadBanners = useCallback(async () => {
    const res = await fetch("/api/admin/partner-banners");
    const data = (await res.json()) as { banners?: PartnerBannerRow[]; ok?: boolean };
    if (res.ok && data.ok) setBanners(data.banners ?? []);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([loadStores(), loadBanners()]);
    } finally {
      setLoading(false);
    }
  }, [loadStores, loadBanners]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  function resetStoreForm() {
    setEditingId(null);
    setStoreForm(emptyStoreForm);
  }

  function resetBannerForm() {
    setEditingBannerId(null);
    setBannerForm(emptyBannerForm);
  }

  function fillStoreForm(store: PartnerStoreRow) {
    setEditingId(store.id);
    setStoreForm({
      name: store.name,
      slug: store.slug,
      tagline: store.tagline ?? "",
      description: store.description ?? "",
      category: store.category,
      phone: store.phone ?? "",
      kakaoLink: store.kakaoLink ?? "",
      mapsUrl: store.mapsUrl ?? "",
      address: store.address ?? "",
      hoursText: store.hoursText ?? "",
      thumbnail: store.thumbnail ?? "",
      plan: store.plan,
      status: store.status,
      sortOrder: store.sortOrder,
      expiresAt: store.expiresAt ? store.expiresAt.slice(0, 10) : "",
    });
  }

  function fillBannerForm(banner: PartnerBannerRow) {
    setEditingBannerId(banner.id);
    setBannerForm({
      storeId: banner.storeId,
      slot: banner.slot,
      imageUrl: banner.imageUrl,
      altText: banner.altText ?? "",
      linkSlug: banner.linkSlug ?? "",
      sortOrder: banner.sortOrder,
      isActive: banner.isActive,
    });
  }

  async function uploadImage(file: File, onUrl: (url: string) => void) {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/uploads", { method: "POST", body: form });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      showToast(parseApiError(data) ?? "업로드 실패", "error");
      return;
    }
    onUrl(data.url as string);
    showToast("이미지를 업로드했습니다.", "success");
  }

  async function onStoreSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...storeForm,
        tagline: storeForm.tagline || undefined,
        description: storeForm.description || undefined,
        phone: storeForm.phone || undefined,
        kakaoLink: storeForm.kakaoLink || undefined,
        mapsUrl: storeForm.mapsUrl || undefined,
        address: storeForm.address || undefined,
        hoursText: storeForm.hoursText || undefined,
        thumbnail: storeForm.thumbnail || undefined,
        expiresAt: storeForm.expiresAt
          ? new Date(`${storeForm.expiresAt}T23:59:59`).toISOString()
          : null,
      };

      const res = await fetch(
        editingId ? `/api/admin/partners/${editingId}` : "/api/admin/partners",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok || !data.ok) {
        showToast(parseApiError(data) ?? "저장 실패", "error");
        return;
      }
      showToast(editingId ? "업소를 수정했습니다." : "업소를 등록했습니다.", "success");
      resetStoreForm();
      void loadStores();
    } catch {
      showToast("저장에 실패했습니다.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function deleteStore(id: string) {
    if (!window.confirm("이 업소와 연결된 배너도 삭제됩니다. 계속할까요?")) return;
    const res = await fetch(`/api/admin/partners/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      showToast(parseApiError(data) ?? "삭제 실패", "error");
      return;
    }
    showToast("업소를 삭제했습니다.", "success");
    if (editingId === id) resetStoreForm();
    void load();
  }

  async function onBannerSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...bannerForm,
        altText: bannerForm.altText || undefined,
        linkSlug: bannerForm.linkSlug || null,
      };
      const res = await fetch(
        editingBannerId
          ? `/api/admin/partner-banners/${editingBannerId}`
          : "/api/admin/partner-banners",
        {
          method: editingBannerId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok || !data.ok) {
        showToast(parseApiError(data) ?? "저장 실패", "error");
        return;
      }
      showToast(editingBannerId ? "배너를 수정했습니다." : "배너를 등록했습니다.", "success");
      resetBannerForm();
      void loadBanners();
    } catch {
      showToast("저장에 실패했습니다.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function deleteBanner(id: string) {
    if (!window.confirm("배너를 삭제할까요?")) return;
    const res = await fetch(`/api/admin/partner-banners/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      showToast(parseApiError(data) ?? "삭제 실패", "error");
      return;
    }
    showToast("배너를 삭제했습니다.", "success");
    if (editingBannerId === id) resetBannerForm();
    void loadBanners();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={tab === "stores" ? "default" : "outline"}
          onClick={() => setTab("stores")}
        >
          업소
        </Button>
        <Button
          type="button"
          size="sm"
          variant={tab === "banners" ? "default" : "outline"}
          onClick={() => setTab("banners")}
        >
          배너
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => void load()}
          disabled={loading}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "새로고침"}
        </Button>
      </div>

      {tab === "stores" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <form
            onSubmit={onStoreSubmit}
            className="space-y-3 rounded-2xl bg-surface p-4 shadow-sm"
          >
            <h2 className="font-semibold">
              {editingId ? "업소 수정" : "새 업소 등록"}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="partner-name">업소명</Label>
                <Input
                  id="partner-name"
                  value={storeForm.name}
                  onChange={(e) => setStoreForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="partner-slug">slug</Label>
                <div className="mt-1 flex gap-1">
                  <Input
                    id="partner-slug"
                    value={storeForm.slug}
                    onChange={(e) => setStoreForm((f) => ({ ...f, slug: e.target.value }))}
                    required
                    pattern="[a-z0-9-]+"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setStoreForm((f) => ({
                        ...f,
                        slug: slugifyPartnerNameAscii(f.name || "store"),
                      }))
                    }
                  >
                    자동
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="partner-category">카테고리</Label>
                <select
                  id="partner-category"
                  value={storeForm.category}
                  onChange={(e) =>
                    setStoreForm((f) => ({
                      ...f,
                      category: e.target.value as PartnerCategory,
                    }))
                  }
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {PARTNER_CATEGORY_LABELS[c]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="partner-tagline">한 줄 소개</Label>
                <Input
                  id="partner-tagline"
                  value={storeForm.tagline}
                  onChange={(e) => setStoreForm((f) => ({ ...f, tagline: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="partner-description">상세 설명</Label>
                <textarea
                  id="partner-description"
                  value={storeForm.description}
                  onChange={(e) =>
                    setStoreForm((f) => ({ ...f, description: e.target.value }))
                  }
                  rows={4}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="partner-kakao">카톡 링크</Label>
                <Input
                  id="partner-kakao"
                  value={storeForm.kakaoLink}
                  onChange={(e) => setStoreForm((f) => ({ ...f, kakaoLink: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="partner-phone">전화</Label>
                <Input
                  id="partner-phone"
                  value={storeForm.phone}
                  onChange={(e) => setStoreForm((f) => ({ ...f, phone: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="partner-maps">지도 URL</Label>
                <Input
                  id="partner-maps"
                  value={storeForm.mapsUrl}
                  onChange={(e) => setStoreForm((f) => ({ ...f, mapsUrl: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="partner-address">주소</Label>
                <Input
                  id="partner-address"
                  value={storeForm.address}
                  onChange={(e) => setStoreForm((f) => ({ ...f, address: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="partner-hours">영업시간</Label>
                <Input
                  id="partner-hours"
                  value={storeForm.hoursText}
                  onChange={(e) => setStoreForm((f) => ({ ...f, hoursText: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="partner-expires">만료일</Label>
                <Input
                  id="partner-expires"
                  type="date"
                  value={storeForm.expiresAt}
                  onChange={(e) => setStoreForm((f) => ({ ...f, expiresAt: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="partner-plan">플랜</Label>
                <select
                  id="partner-plan"
                  value={storeForm.plan}
                  onChange={(e) =>
                    setStoreForm((f) => ({ ...f, plan: e.target.value as PartnerPlan }))
                  }
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {plans.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="partner-status">상태</Label>
                <select
                  id="partner-status"
                  value={storeForm.status}
                  onChange={(e) =>
                    setStoreForm((f) => ({
                      ...f,
                      status: e.target.value as PartnerStatus,
                    }))
                  }
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {statuses.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="partner-sort">정렬</Label>
                <Input
                  id="partner-sort"
                  type="number"
                  value={storeForm.sortOrder}
                  onChange={(e) =>
                    setStoreForm((f) => ({
                      ...f,
                      sortOrder: parseInt(e.target.value, 10) || 0,
                    }))
                  }
                  className="mt-1"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="partner-thumbnail">썸네일 URL</Label>
                <div className="mt-1 flex gap-2">
                  <Input
                    id="partner-thumbnail"
                    value={storeForm.thumbnail}
                    onChange={(e) =>
                      setStoreForm((f) => ({ ...f, thumbnail: e.target.value }))
                    }
                  />
                  <label className="shrink-0">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void uploadImage(file, (url) => setStoreForm((f) => ({ ...f, thumbnail: url })));
                      }}
                    />
                    <span className="inline-flex h-9 cursor-pointer items-center rounded-md border border-input px-3 text-xs">
                      업로드
                    </span>
                  </label>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? "수정" : "등록"}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={resetStoreForm}>
                  취소
                </Button>
              )}
              {storeForm.slug && storeForm.status === "PUBLISHED" && (
                <Link
                  href={`/store/${storeForm.slug}`}
                  target="_blank"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  LP 미리보기 <ExternalLink className="h-3 w-3" />
                </Link>
              )}
            </div>
          </form>

          <div className="overflow-x-auto rounded-2xl bg-surface p-4 shadow-sm">
            <h2 className="mb-3 font-semibold">업소 목록</h2>
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="py-2 pr-2">이름</th>
                  <th className="py-2 pr-2">slug</th>
                  <th className="py-2 pr-2">상태</th>
                  <th className="py-2 pr-2">플랜</th>
                  <th className="py-2">액션</th>
                </tr>
              </thead>
              <tbody>
                {stores.map((s) => (
                  <tr key={s.id} className="border-b border-border last:border-0">
                    <td className="py-2 pr-2">{s.name}</td>
                    <td className="py-2 pr-2 font-mono text-xs">{s.slug}</td>
                    <td className="py-2 pr-2 text-xs">{s.status}</td>
                    <td className="py-2 pr-2 text-xs">{s.plan}</td>
                    <td className="py-2">
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => fillStoreForm(s)}
                        >
                          편집
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => void deleteStore(s.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {stores.length === 0 && !loading && (
              <p className="py-4 text-center text-sm text-muted-foreground">
                등록된 업소가 없습니다.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <form
            onSubmit={onBannerSubmit}
            className="space-y-3 rounded-2xl bg-surface p-4 shadow-sm"
          >
            <h2 className="font-semibold">
              {editingBannerId ? "배너 수정" : "새 배너 등록"}
            </h2>
            <div className="space-y-3">
              <div>
                <Label htmlFor="banner-store">업소</Label>
                <select
                  id="banner-store"
                  value={bannerForm.storeId}
                  onChange={(e) =>
                    setBannerForm((f) => ({ ...f, storeId: e.target.value }))
                  }
                  required
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">선택</option>
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.slug})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="banner-slot">슬롯</Label>
                <select
                  id="banner-slot"
                  value={bannerForm.slot}
                  onChange={(e) =>
                    setBannerForm((f) => ({
                      ...f,
                      slot: e.target.value as PartnerBannerSlot,
                    }))
                  }
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {slots.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="banner-image">이미지 URL</Label>
                <div className="mt-1 flex gap-2">
                  <Input
                    id="banner-image"
                    value={bannerForm.imageUrl}
                    onChange={(e) =>
                      setBannerForm((f) => ({ ...f, imageUrl: e.target.value }))
                    }
                    required
                  />
                  <label className="shrink-0">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void uploadImage(file, (url) => setBannerForm((f) => ({ ...f, imageUrl: url })));
                      }}
                    />
                    <span className="inline-flex h-9 cursor-pointer items-center rounded-md border border-input px-3 text-xs">
                      업로드
                    </span>
                  </label>
                </div>
              </div>
              <div>
                <Label htmlFor="banner-alt">alt 텍스트</Label>
                <Input
                  id="banner-alt"
                  value={bannerForm.altText}
                  onChange={(e) => setBannerForm((f) => ({ ...f, altText: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="banner-link-slug">링크 slug (선택)</Label>
                <Input
                  id="banner-link-slug"
                  value={bannerForm.linkSlug}
                  onChange={(e) => setBannerForm((f) => ({ ...f, linkSlug: e.target.value }))}
                  placeholder="기본: 업소 slug"
                  className="mt-1"
                />
              </div>
              <div className="flex items-center gap-4">
                <div>
                  <Label htmlFor="banner-sort">정렬</Label>
                  <Input
                    id="banner-sort"
                    type="number"
                    value={bannerForm.sortOrder}
                    onChange={(e) =>
                      setBannerForm((f) => ({
                        ...f,
                        sortOrder: parseInt(e.target.value, 10) || 0,
                      }))
                    }
                    className="mt-1 w-24"
                  />
                </div>
                <label className="flex items-center gap-2 pt-5 text-sm">
                  <input
                    type="checkbox"
                    checked={bannerForm.isActive}
                    onChange={(e) =>
                      setBannerForm((f) => ({ ...f, isActive: e.target.checked }))
                    }
                  />
                  활성
                </label>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : editingBannerId ? (
                  "수정"
                ) : (
                  <>
                    <Plus className="mr-1 h-4 w-4" />
                    등록
                  </>
                )}
              </Button>
              {editingBannerId && (
                <Button type="button" variant="outline" onClick={resetBannerForm}>
                  취소
                </Button>
              )}
            </div>
          </form>

          <div className="overflow-x-auto rounded-2xl bg-surface p-4 shadow-sm">
            <h2 className="mb-3 font-semibold">배너 목록</h2>
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="py-2 pr-2">슬롯</th>
                  <th className="py-2 pr-2">업소</th>
                  <th className="py-2 pr-2">활성</th>
                  <th className="py-2">액션</th>
                </tr>
              </thead>
              <tbody>
                {banners.map((b) => (
                  <tr key={b.id} className="border-b border-border last:border-0">
                    <td className="py-2 pr-2 text-xs">{b.slot}</td>
                    <td className="py-2 pr-2">{b.store.name}</td>
                    <td className="py-2 pr-2">{b.isActive ? "ON" : "OFF"}</td>
                    <td className="py-2">
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => fillBannerForm(b)}
                        >
                          편집
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => void deleteBanner(b.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
