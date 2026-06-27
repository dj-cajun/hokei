"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ExternalLink, Loader2, Pencil, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/providers/toast-provider";
import { parseApiError } from "@/lib/api-response";
import { PARTNER_CATEGORY_LABELS } from "@/lib/partner/labels";
import { slugifyPartnerName } from "@/lib/partner/slug";
import type {
  PartnerCategory,
  PartnerPlan,
  PartnerStatus,
} from "@/generated/prisma/client";

type Tab = "stores" | "banners";

type StoreRow = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  introText: string | null;
  description: string | null;
  menuText: string | null;
  category: PartnerCategory;
  phone: string | null;
  kakaoLink: string | null;
  mapsUrl: string | null;
  address: string | null;
  locationTips: string | null;
  hoursText: string | null;
  commentPostId: string | null;
  thumbnail: string | null;
  plan: PartnerPlan;
  status: PartnerStatus;
  sortOrder: number;
  expiresAt: string | null;
  owner?: { email: string } | null;
};

type BannerRow = {
  id: string;
  storeId: string;
  slot: string;
  imageUrl: string;
  mobileImageUrl: string | null;
  altText: string | null;
  linkSlug: string | null;
  sortOrder: number;
  isActive: boolean;
  store: { id: string; name: string; slug: string; status: PartnerStatus };
};

type EventStats = { views: number; clicks: number; total: number };

const categories = Object.keys(PARTNER_CATEGORY_LABELS) as PartnerCategory[];
const bannerSlots = [
  "HOME_BOTTOM",
  "HOME_TOP",
  "NEWS_INLINE",
  "PROMO_TOP",
] as const;
const plans: PartnerPlan[] = ["BASIC", "STANDARD", "PREMIUM"];
const statuses: PartnerStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];

const emptyStoreForm = {
  name: "",
  slug: "",
  tagline: "",
  introText: "",
  description: "",
  menuText: "",
  category: "FOOD" as PartnerCategory,
  phone: "",
  kakaoLink: "",
  mapsUrl: "",
  address: "",
  locationTips: "",
  hoursText: "",
  commentPostId: "",
  thumbnail: "",
  plan: "BASIC" as PartnerPlan,
  status: "DRAFT" as PartnerStatus,
  sortOrder: 0,
  expiresAt: "",
  ownerEmail: "",
};

const emptyHomeTopBannerForm = {
  imageUrl: "",
  mobileImageUrl: "",
  altText: "",
  linkSlug: "",
  isActive: true,
};

const emptyBannerForm = {
  storeId: "",
  slot: "HOME_BOTTOM",
  imageUrl: "",
  mobileImageUrl: "",
  altText: "",
  linkSlug: "",
  sortOrder: 0,
  isActive: true,
};

async function uploadImage(file: File): Promise<string | null> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/uploads", { method: "POST", body: form });
  const data = await res.json();
  if (!res.ok || !data.ok) return null;
  return data.url as string;
}

export function PartnersPanel() {
  const { showToast } = useToast();
  const [tab, setTab] = useState<Tab>("stores");
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [banners, setBanners] = useState<BannerRow[]>([]);
  const [eventStats, setEventStats] = useState<Record<string, EventStats>>({});
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingStoreId, setEditingStoreId] = useState<string | null>(null);
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [storeForm, setStoreForm] = useState(emptyStoreForm);
  const [homeTopBannerForm, setHomeTopBannerForm] = useState(emptyHomeTopBannerForm);
  const [editingHomeTopBannerId, setEditingHomeTopBannerId] = useState<string | null>(null);
  const [bannerForm, setBannerForm] = useState(emptyBannerForm);
  const thumbInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const homeTopPcInputRef = useRef<HTMLInputElement>(null);
  const homeTopMobileInputRef = useRef<HTMLInputElement>(null);

  const loadStores = useCallback(async () => {
    const res = await fetch("/api/admin/partners");
    const data = await res.json();
    if (res.ok && data.ok) {
      setStores(data.stores ?? []);
    }
  }, []);

  const loadBanners = useCallback(async () => {
    const res = await fetch("/api/admin/partner-banners");
    const data = await res.json();
    if (res.ok && data.ok) {
      setBanners(data.banners ?? []);
    }
  }, []);

  const loadStats = useCallback(async () => {
    const res = await fetch("/api/admin/partner-events/summary");
    const data = await res.json();
    if (res.ok && data.ok) {
      setEventStats(data.stats ?? {});
    }
  }, []);

  const reload = useCallback(async () => {
    try {
      await Promise.all([loadStores(), loadBanners(), loadStats()]);
    } finally {
      setReady(true);
    }
  }, [loadStores, loadBanners, loadStats]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void reload();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [reload]);

  function resetStoreForm() {
    setEditingStoreId(null);
    setStoreForm(emptyStoreForm);
    setHomeTopBannerForm(emptyHomeTopBannerForm);
    setEditingHomeTopBannerId(null);
  }

  function resetBannerForm() {
    setEditingBannerId(null);
    setBannerForm(emptyBannerForm);
  }

  function startEditStore(row: StoreRow) {
    setEditingStoreId(row.id);
    setStoreForm({
      name: row.name,
      slug: row.slug,
      tagline: row.tagline ?? "",
      introText: row.introText ?? "",
      description: row.description ?? "",
      menuText: row.menuText ?? "",
      category: row.category,
      phone: row.phone ?? "",
      kakaoLink: row.kakaoLink ?? "",
      mapsUrl: row.mapsUrl ?? "",
      address: row.address ?? "",
      locationTips: row.locationTips ?? "",
      hoursText: row.hoursText ?? "",
      commentPostId: row.commentPostId ?? "",
      thumbnail: row.thumbnail ?? "",
      plan: row.plan,
      status: row.status,
      sortOrder: row.sortOrder,
      expiresAt: row.expiresAt ? row.expiresAt.slice(0, 10) : "",
      ownerEmail: row.owner?.email ?? "",
    });
    const homeTop = banners.find(
      (b) => b.storeId === row.id && b.slot === "HOME_TOP"
    );
    if (homeTop) {
      setEditingHomeTopBannerId(homeTop.id);
      setHomeTopBannerForm({
        imageUrl: homeTop.imageUrl,
        mobileImageUrl: homeTop.mobileImageUrl ?? "",
        altText: homeTop.altText ?? "",
        linkSlug: homeTop.linkSlug ?? "",
        isActive: homeTop.isActive,
      });
    } else {
      setEditingHomeTopBannerId(null);
      setHomeTopBannerForm(emptyHomeTopBannerForm);
    }
  }

  function startEditBanner(row: BannerRow) {
    setEditingBannerId(row.id);
    setBannerForm({
      storeId: row.storeId,
      slot: row.slot,
      imageUrl: row.imageUrl,
      mobileImageUrl: row.mobileImageUrl ?? "",
      altText: row.altText ?? "",
      linkSlug: row.linkSlug ?? "",
      sortOrder: row.sortOrder,
      isActive: row.isActive,
    });
  }

  async function onStoreSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...storeForm,
        tagline: storeForm.tagline || undefined,
        introText: storeForm.introText || undefined,
        description: storeForm.description || undefined,
        menuText: storeForm.menuText || undefined,
        phone: storeForm.phone || undefined,
        kakaoLink: storeForm.kakaoLink || undefined,
        mapsUrl: storeForm.mapsUrl || undefined,
        address: storeForm.address || undefined,
        locationTips: storeForm.locationTips || undefined,
        hoursText: storeForm.hoursText || undefined,
        commentPostId: storeForm.commentPostId || null,
        thumbnail: storeForm.thumbnail || undefined,
        expiresAt: storeForm.expiresAt
          ? new Date(storeForm.expiresAt).toISOString()
          : null,
      };

      const res = await fetch(
        editingStoreId
          ? `/api/admin/partners/${editingStoreId}`
          : "/api/admin/partners",
        {
          method: editingStoreId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok || !data.ok) {
        showToast(parseApiError(data) ?? "저장 실패", "error");
        return;
      }

      const savedStoreId = (editingStoreId ?? data.store?.id) as string | undefined;
      if (savedStoreId && homeTopBannerForm.imageUrl.trim()) {
        const bannerPayload = {
          storeId: savedStoreId,
          slot: "HOME_TOP",
          imageUrl: homeTopBannerForm.imageUrl.trim(),
          mobileImageUrl: homeTopBannerForm.mobileImageUrl || undefined,
          altText: homeTopBannerForm.altText || undefined,
          linkSlug: homeTopBannerForm.linkSlug || undefined,
          isActive: homeTopBannerForm.isActive,
        };
        const bannerRes = await fetch(
          editingHomeTopBannerId
            ? `/api/admin/partner-banners/${editingHomeTopBannerId}`
            : "/api/admin/partner-banners",
          {
            method: editingHomeTopBannerId ? "PATCH" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(bannerPayload),
          }
        );
        const bannerData = await bannerRes.json();
        if (!bannerRes.ok || !bannerData.ok) {
          showToast(
            parseApiError(bannerData) ?? "업소는 저장됐으나 홈 배너 저장 실패",
            "error"
          );
        }
      }

      showToast(editingStoreId ? "업소를 수정했습니다." : "업소를 등록했습니다.");
      resetStoreForm();
      await Promise.all([loadStores(), loadBanners()]);
    } catch {
      showToast("저장 실패", "error");
    } finally {
      setSaving(false);
    }
  }

  async function deleteStore(id: string) {
    if (!confirm("이 업소를 삭제할까요?")) return;
    const res = await fetch(`/api/admin/partners/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      showToast(parseApiError(data) ?? "삭제 실패", "error");
      return;
    }
    showToast("삭제했습니다.");
    if (editingStoreId === id) resetStoreForm();
    await loadStores();
  }

  async function onBannerSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...bannerForm,
        altText: bannerForm.altText || undefined,
        linkSlug: bannerForm.linkSlug || undefined,
        mobileImageUrl: bannerForm.mobileImageUrl || undefined,
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
      showToast(editingBannerId ? "배너를 수정했습니다." : "배너를 등록했습니다.");
      resetBannerForm();
      await loadBanners();
    } catch {
      showToast("저장 실패", "error");
    } finally {
      setSaving(false);
    }
  }

  async function deleteBanner(id: string) {
    if (!confirm("이 배너를 삭제할까요?")) return;
    const res = await fetch(`/api/admin/partner-banners/${id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      showToast(parseApiError(data) ?? "삭제 실패", "error");
      return;
    }
    showToast("삭제했습니다.");
    if (editingBannerId === id) resetBannerForm();
    await loadBanners();
  }

  async function handleThumbUpload(file: File) {
    setUploading(true);
    const url = await uploadImage(file);
    setUploading(false);
    if (!url) {
      showToast("업로드 실패", "error");
      return;
    }
    setStoreForm((f) => ({ ...f, thumbnail: url }));
    showToast("썸네일을 업로드했습니다.");
  }

  async function handleBannerUpload(file: File) {
    setUploading(true);
    const url = await uploadImage(file);
    setUploading(false);
    if (!url) {
      showToast("업로드 실패", "error");
      return;
    }
    setBannerForm((f) => ({ ...f, imageUrl: url }));
    showToast("배너 이미지를 업로드했습니다.");
  }

  async function handleHomeTopUpload(
    file: File,
    target: "pc" | "mobile"
  ) {
    setUploading(true);
    const url = await uploadImage(file);
    setUploading(false);
    if (!url) {
      showToast("업로드 실패", "error");
      return;
    }
    setHomeTopBannerForm((f) =>
      target === "pc" ? { ...f, imageUrl: url } : { ...f, mobileImageUrl: url }
    );
    showToast(
      target === "pc" ? "PC 배너를 업로드했습니다." : "모바일 배너를 업로드했습니다."
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          type="button"
          variant={tab === "stores" ? "default" : "outline"}
          size="sm"
          onClick={() => setTab("stores")}
        >
          업소
        </Button>
        <Button
          type="button"
          variant={tab === "banners" ? "default" : "outline"}
          size="sm"
          onClick={() => setTab("banners")}
        >
          배너
        </Button>
      </div>

      {!ready ? (
        <p className="text-sm text-muted-foreground">불러오는 중…</p>
      ) : tab === "stores" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="overflow-x-auto rounded-2xl bg-surface p-3 shadow-sm">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="py-2 pr-2">이름</th>
                  <th className="py-2 pr-2">slug</th>
                  <th className="py-2 pr-2">플랜</th>
                  <th className="py-2 pr-2">상태</th>
                  <th className="py-2 pr-2">30일</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {stores.map((row) => (
                  <tr key={row.id} className="border-b border-border-light">
                    <td className="py-2 pr-2 font-medium">{row.name}</td>
                    <td className="py-2 pr-2">
                      <Link
                        href={`/store/${row.slug}${row.status === "PUBLISHED" ? "" : "?preview=1"}`}
                        className="text-primary hover:underline"
                        target="_blank"
                      >
                        {row.slug}
                      </Link>
                    </td>
                    <td className="py-2 pr-2">{row.plan}</td>
                    <td className="py-2 pr-2">{row.status}</td>
                    <td className="py-2 pr-2 text-[10px] text-muted-foreground">
                      {eventStats[row.id]
                        ? `${eventStats[row.id].views}조회 · ${eventStats[row.id].clicks}클릭`
                        : "—"}
                    </td>
                    <td className="py-2 text-right">
                      <button
                        type="button"
                        onClick={() => startEditStore(row)}
                        className="mr-1 text-muted-foreground hover:text-foreground"
                        aria-label="수정"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteStore(row.id)}
                        className="text-destructive"
                        aria-label="삭제"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {stores.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">
                등록된 업소가 없습니다.
              </p>
            ) : null}
          </div>

          <form
            onSubmit={onStoreSubmit}
            className="space-y-3 rounded-2xl bg-surface p-4 shadow-sm"
          >
            <h2 className="text-sm font-semibold">
              {editingStoreId ? "업소 수정" : "새 업소"}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="name">업소명</Label>
                <Input
                  id="name"
                  value={storeForm.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setStoreForm((f) => ({
                      ...f,
                      name,
                      slug:
                        !editingStoreId && !f.slug
                          ? slugifyPartnerName(name)
                          : f.slug,
                    }));
                  }}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="slug">slug</Label>
                <Input
                  id="slug"
                  value={storeForm.slug}
                  onChange={(e) =>
                    setStoreForm((f) => ({ ...f, slug: e.target.value }))
                  }
                  required
                  pattern="[a-z0-9-]+"
                  className="mt-1"
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <Label htmlFor="category">카테고리</Label>
                <select
                  id="category"
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
              <div>
                <Label htmlFor="plan">플랜</Label>
                <select
                  id="plan"
                  value={storeForm.plan}
                  onChange={(e) =>
                    setStoreForm((f) => ({
                      ...f,
                      plan: e.target.value as PartnerPlan,
                    }))
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
                <Label htmlFor="status">상태</Label>
                <select
                  id="status"
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
            </div>
            <div>
              <Label htmlFor="tagline">한 줄 소개</Label>
              <Input
                id="tagline"
                value={storeForm.tagline}
                onChange={(e) =>
                  setStoreForm((f) => ({ ...f, tagline: e.target.value }))
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="introText">소개 (LP 본문)</Label>
              <textarea
                id="introText"
                value={storeForm.introText}
                onChange={(e) =>
                  setStoreForm((f) => ({ ...f, introText: e.target.value }))
                }
                rows={4}
                placeholder="introText 우선 노출. 비우면 상세 설명 사용"
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <Label htmlFor="description">상세 설명 (레거시)</Label>
              <textarea
                id="description"
                value={storeForm.description}
                onChange={(e) =>
                  setStoreForm((f) => ({ ...f, description: e.target.value }))
                }
                rows={3}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <Label htmlFor="menuText">메뉴·가격</Label>
              <textarea
                id="menuText"
                value={storeForm.menuText}
                onChange={(e) =>
                  setStoreForm((f) => ({ ...f, menuText: e.target.value }))
                }
                rows={4}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <Label htmlFor="locationTips">오시는 길 팁</Label>
              <textarea
                id="locationTips"
                value={storeForm.locationTips}
                onChange={(e) =>
                  setStoreForm((f) => ({ ...f, locationTips: e.target.value }))
                }
                rows={3}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <Label htmlFor="hoursText">영업시간·이벤트</Label>
              <textarea
                id="hoursText"
                value={storeForm.hoursText}
                onChange={(e) =>
                  setStoreForm((f) => ({ ...f, hoursText: e.target.value }))
                }
                rows={4}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <Label htmlFor="commentPostId">댓글 연결 Post ID</Label>
              <Input
                id="commentPostId"
                value={storeForm.commentPostId}
                onChange={(e) =>
                  setStoreForm((f) => ({ ...f, commentPostId: e.target.value }))
                }
                placeholder="LP 하단 댓글용 홍보 글 ID"
                className="mt-1"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="kakaoLink">카카오 링크</Label>
                <Input
                  id="kakaoLink"
                  value={storeForm.kakaoLink}
                  onChange={(e) =>
                    setStoreForm((f) => ({ ...f, kakaoLink: e.target.value }))
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="phone">전화</Label>
                <Input
                  id="phone"
                  value={storeForm.phone}
                  onChange={(e) =>
                    setStoreForm((f) => ({ ...f, phone: e.target.value }))
                  }
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="mapsUrl">Google Maps URL</Label>
              <Input
                id="mapsUrl"
                value={storeForm.mapsUrl}
                onChange={(e) =>
                  setStoreForm((f) => ({ ...f, mapsUrl: e.target.value }))
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="address">주소</Label>
              <Input
                id="address"
                value={storeForm.address}
                onChange={(e) =>
                  setStoreForm((f) => ({ ...f, address: e.target.value }))
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="ownerEmail">사장님 계정 이메일</Label>
              <Input
                id="ownerEmail"
                type="email"
                value={storeForm.ownerEmail}
                onChange={(e) =>
                  setStoreForm((f) => ({ ...f, ownerEmail: e.target.value }))
                }
                placeholder="셀프 수정 권한 부여"
                className="mt-1"
              />
              <p className="mt-1 text-[10px] text-muted-foreground">
                호케이 가입 이메일. 비우면 연결 해제.
              </p>
            </div>
            <div>
              <Label htmlFor="thumbnail">썸네일 URL</Label>
              <div className="mt-1 flex gap-2">
                <Input
                  id="thumbnail"
                  value={storeForm.thumbnail}
                  onChange={(e) =>
                    setStoreForm((f) => ({ ...f, thumbnail: e.target.value }))
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
            {editingStoreId ? (
              <fieldset className="space-y-3 rounded-lg border border-border-light p-3">
                <legend className="px-1 text-sm font-semibold">
                  홈 상단 배너 (HOME_TOP)
                </legend>
                <div>
                  <Label htmlFor="homeTopPc">PC 배너 URL (768px 이상)</Label>
                  <div className="mt-1 flex gap-2">
                    <Input
                      id="homeTopPc"
                      value={homeTopBannerForm.imageUrl}
                      onChange={(e) =>
                        setHomeTopBannerForm((f) => ({
                          ...f,
                          imageUrl: e.target.value,
                        }))
                      }
                      placeholder="https://…"
                    />
                    <input
                      ref={homeTopPcInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void handleHomeTopUpload(file, "pc");
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={uploading}
                      onClick={() => homeTopPcInputRef.current?.click()}
                    >
                      {uploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {homeTopBannerForm.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={homeTopBannerForm.imageUrl}
                      alt="PC 배너 미리보기"
                      className="mt-2 max-h-24 rounded border object-contain"
                    />
                  ) : null}
                </div>
                <div>
                  <Label htmlFor="homeTopMobile">
                    모바일 배너 URL (768px 미만)
                  </Label>
                  <div className="mt-1 flex gap-2">
                    <Input
                      id="homeTopMobile"
                      value={homeTopBannerForm.mobileImageUrl}
                      onChange={(e) =>
                        setHomeTopBannerForm((f) => ({
                          ...f,
                          mobileImageUrl: e.target.value,
                        }))
                      }
                      placeholder="비우면 PC 이미지 사용"
                    />
                    <input
                      ref={homeTopMobileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void handleHomeTopUpload(file, "mobile");
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={uploading}
                      onClick={() => homeTopMobileInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                  {homeTopBannerForm.mobileImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={homeTopBannerForm.mobileImageUrl}
                      alt="모바일 배너 미리보기"
                      className="mt-2 max-h-24 rounded border object-contain"
                    />
                  ) : null}
                </div>
                <div>
                  <Label htmlFor="homeTopAlt">alt 텍스트</Label>
                  <Input
                    id="homeTopAlt"
                    value={homeTopBannerForm.altText}
                    onChange={(e) =>
                      setHomeTopBannerForm((f) => ({
                        ...f,
                        altText: e.target.value,
                      }))
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="homeTopLinkSlug">링크 slug (선택)</Label>
                  <Input
                    id="homeTopLinkSlug"
                    value={homeTopBannerForm.linkSlug}
                    onChange={(e) =>
                      setHomeTopBannerForm((f) => ({
                        ...f,
                        linkSlug: e.target.value,
                      }))
                    }
                    placeholder={`기본: ${storeForm.slug || "업소 slug"}`}
                    className="mt-1"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="homeTopActive"
                    type="checkbox"
                    checked={homeTopBannerForm.isActive}
                    onChange={(e) =>
                      setHomeTopBannerForm((f) => ({
                        ...f,
                        isActive: e.target.checked,
                      }))
                    }
                  />
                  <Label htmlFor="homeTopActive">활성</Label>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  저장 시 홈(/)·LP(/store/…) 캐시가 갱신됩니다.
                </p>
              </fieldset>
            ) : null}
            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingStoreId ? "수정 저장" : "등록"}
              </Button>
              {editingStoreId ? (
                <Button type="button" variant="outline" onClick={resetStoreForm}>
                  취소
                </Button>
              ) : null}
              {storeForm.slug ? (
                <Link
                  href={`/store/${storeForm.slug}${storeForm.status === "PUBLISHED" ? "" : "?preview=1"}`}
                  target="_blank"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  LP 미리보기 <ExternalLink className="h-3 w-3" />
                </Link>
              ) : null}
            </div>
          </form>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="overflow-x-auto rounded-2xl bg-surface p-3 shadow-sm">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="py-2 pr-2">업소</th>
                  <th className="py-2 pr-2">슬롯</th>
                  <th className="py-2 pr-2">활성</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {banners.map((row) => (
                  <tr key={row.id} className="border-b border-border-light">
                    <td className="py-2 pr-2">{row.store.name}</td>
                    <td className="py-2 pr-2">{row.slot}</td>
                    <td className="py-2 pr-2">{row.isActive ? "ON" : "OFF"}</td>
                    <td className="py-2 text-right">
                      <button
                        type="button"
                        onClick={() => startEditBanner(row)}
                        className="mr-1 text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteBanner(row.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <form
            onSubmit={onBannerSubmit}
            className="space-y-3 rounded-2xl bg-surface p-4 shadow-sm"
          >
            <h2 className="text-sm font-semibold">
              {editingBannerId ? "배너 수정" : "새 배너"}
            </h2>
            <div>
              <Label htmlFor="bannerStore">업소</Label>
              <select
                id="bannerStore"
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
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="bannerSlot">슬롯</Label>
              <select
                id="bannerSlot"
                value={bannerForm.slot}
                onChange={(e) =>
                  setBannerForm((f) => ({ ...f, slot: e.target.value }))
                }
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {bannerSlots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="bannerImage">
                {bannerForm.slot === "HOME_TOP"
                  ? "PC 배너 URL (768px 이상)"
                  : "배너 이미지 URL"}
              </Label>
              <div className="mt-1 flex gap-2">
                <Input
                  id="bannerImage"
                  value={bannerForm.imageUrl}
                  onChange={(e) =>
                    setBannerForm((f) => ({ ...f, imageUrl: e.target.value }))
                  }
                  required
                />
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleBannerUpload(file);
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploading}
                  onClick={() => bannerInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {bannerForm.slot === "HOME_TOP" ? (
              <div>
                <Label htmlFor="bannerMobileImage">
                  모바일 배너 URL (768px 미만, 선택)
                </Label>
                <Input
                  id="bannerMobileImage"
                  value={bannerForm.mobileImageUrl}
                  onChange={(e) =>
                    setBannerForm((f) => ({
                      ...f,
                      mobileImageUrl: e.target.value,
                    }))
                  }
                  placeholder="/partners/…-mobile.png"
                  className="mt-1"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  PC용(위)과 별도 이미지. 비우면 PC 이미지를 모바일에도 사용합니다.
                </p>
              </div>
            ) : null}
            <div className="flex items-center gap-2">
              <input
                id="bannerActive"
                type="checkbox"
                checked={bannerForm.isActive}
                onChange={(e) =>
                  setBannerForm((f) => ({ ...f, isActive: e.target.checked }))
                }
              />
              <Label htmlFor="bannerActive">활성</Label>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingBannerId ? "수정 저장" : "등록"}
              </Button>
              {editingBannerId ? (
                <Button type="button" variant="outline" onClick={resetBannerForm}>
                  취소
                </Button>
              ) : null}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
