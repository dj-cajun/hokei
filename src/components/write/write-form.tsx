"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ChevronDown } from "lucide-react";
import type { WritableCategory } from "@/lib/categories";
import { WriteFormTopBar } from "@/components/write/write-form-top-bar";
import { WriteCascadeCategorySelects } from "@/components/write/write-cascade-category-selects";
import {
  WriteAttachmentBar,
  uploadPendingAttachments,
  type PendingAttachment,
  type UploadedAttachmentMeta,
} from "@/components/write/write-attachment-bar";
import { useToast } from "@/components/providers/toast-provider";
import { parseApiError } from "@/lib/api-response";
import { RichEditor } from "@/components/write/rich-editor";
import { HOCHIMINH_REGIONS } from "@/lib/regions";
import { sanitizePostHtml, stripHtmlTags } from "@/lib/sanitize-html";
import {
  SECTION_TO_MAIN,
  buildCascadeTitle,
  isCascadeWriteSection,
  parseCascadeTitle,
  resolveCategoryIdFromCascade,
  resolveMidFromCategorySlug,
  type CascadeMainCategory,
  type CascadeWriteSection,
} from "@/lib/write-cascade-categories";

export type WriteFormInitial = {
  categoryId: string;
  title: string;
  body: string;
  region?: string | null;
  attachments?: UploadedAttachmentMeta[];
};

type WriteFormProps = {
  categories: WritableCategory[];
  pageTitle?: string;
  defaultCategoryId?: string;
  sectionSlug?: string;
  mode?: "create" | "edit";
  postId?: string;
  initial?: WriteFormInitial;
};

function groupBySection(categories: WritableCategory[]) {
  const map = new Map<
    string,
    { sectionLabel: string; items: WritableCategory[] }
  >();
  for (const c of categories) {
    const existing = map.get(c.sectionSlug);
    if (existing) {
      existing.items.push(c);
    } else {
      map.set(c.sectionSlug, {
        sectionLabel: c.sectionLabel,
        items: [c],
      });
    }
  }
  return Array.from(map.values());
}

function inferCascadeSection(
  sectionSlug: string | undefined,
  categoryId: string,
  categories: WritableCategory[]
): CascadeWriteSection | undefined {
  if (isCascadeWriteSection(sectionSlug)) return sectionSlug;
  const cat = categories.find((c) => c.id === categoryId);
  if (cat && isCascadeWriteSection(cat.sectionSlug)) {
    return cat.sectionSlug;
  }
  return undefined;
}

export function WriteForm({
  categories,
  pageTitle = "글쓰기",
  defaultCategoryId,
  sectionSlug,
  mode = "create",
  postId,
  initial,
}: WriteFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const { data: session } = useSession();
  const isLoggedIn = Boolean(session?.user);
  const isEdit = mode === "edit" && postId;

  const cascadeSection = inferCascadeSection(
    sectionSlug,
    initial?.categoryId ?? defaultCategoryId ?? "",
    categories
  );
  const useCascade = Boolean(cascadeSection);
  const isPromoSection = sectionSlug === "promo" || cascadeSection === "promo";

  const parsedInitialTitle = useMemo(
    () => (initial?.title ? parseCascadeTitle(initial.title) : null),
    [initial]
  );

  const initialCategoryId = initial?.categoryId ?? defaultCategoryId ?? "";

  const fixedMain: CascadeMainCategory | "" = cascadeSection
    ? SECTION_TO_MAIN[cascadeSection]
    : "";

  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const [mainCategory, setMainCategory] = useState<CascadeMainCategory | "">(
    () =>
      fixedMain ||
      (parsedInitialTitle && cascadeSection
        ? SECTION_TO_MAIN[cascadeSection]
        : "")
  );
  const [midCategory, setMidCategory] = useState(() => {
    if (parsedInitialTitle?.midCategory) return parsedInitialTitle.midCategory;
    if (!cascadeSection || parsedInitialTitle) return "";
    const cat = categories.find((c) => c.id === initialCategoryId);
    if (!cat) return "";
    return resolveMidFromCategorySlug(cascadeSection, cat.slug) ?? "";
  });
  const [subCategory, setSubCategory] = useState(
    parsedInitialTitle?.subCategory ?? ""
  );

  const [guestName, setGuestName] = useState("");
  const [guestPassword, setGuestPassword] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [title, setTitle] = useState(
    parsedInitialTitle?.rawTitle ?? initial?.title ?? ""
  );
  const [region, setRegion] = useState(initial?.region ?? "");
  const [storeName, setStoreName] = useState("");
  const [kakaoLink, setKakaoLink] = useState("");
  const [body, setBody] = useState(initial?.body ?? "");
  const [attachments, setAttachments] = useState<PendingAttachment[]>(() =>
    (initial?.attachments ?? []).map((a, i) => ({
      id: `existing-${i}`,
      previewUrl: a.kind === "IMAGE" ? a.url : "",
      name: a.fileName,
      type: a.kind === "IMAGE" ? "image" : "file",
      uploaded: a,
    }))
  );
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const draftKey = `hokei-draft-${postId ?? sectionSlug ?? "new"}`;

  const [pendingDraft, setPendingDraft] = useState<{
    title?: string;
    body?: string;
  } | null>(() => {
    if (isEdit || initial?.body) return null;
    try {
      const raw = localStorage.getItem(draftKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { title?: string; body?: string };
      if (!parsed.body?.trim() && !parsed.title?.trim()) return null;
      return parsed;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (isEdit) return;
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(draftKey, JSON.stringify({ title, body }));
      } catch {
        /* ignore */
      }
    }, 800);
    return () => window.clearTimeout(timer);
  }, [title, body, draftKey, isEdit]);

  const effectiveMain = fixedMain || mainCategory;

  const sectionGroups = useMemo(
    () => groupBySection(categories),
    [categories]
  );
  const showOptgroups = sectionGroups.length > 1;

  function validateCascadeSelection(): boolean {
    if (!effectiveMain || !midCategory || !subCategory) {
      window.alert("상세 말머리를 모두 선택해 주세요.");
      return false;
    }
    return true;
  }

  async function handleSubmit() {
    setError("");

    if (useCascade && !validateCascadeSelection()) {
      return;
    }

    if (!useCascade && !categoryId) {
      setError("분류를 선택해 주세요.");
      return;
    }
    if (!title.trim()) {
      setError("제목을 입력해 주세요.");
      return;
    }
    const plainBody = stripHtmlTags(body);
    if (!plainBody) {
      setError("내용을 입력해 주세요.");
      return;
    }
    const sanitizedBody = sanitizePostHtml(body);
    if (!isLoggedIn && !isEdit && (!guestName.trim() || !guestPassword.trim())) {
      setError("비회원 글쓰기는 이름과 비밀번호가 필요합니다.");
      return;
    }
    if (!isLoggedIn && isEdit && !editPassword.trim()) {
      setError("수정하려면 글 작성 시 입력한 비밀번호가 필요합니다.");
      return;
    }
    if (isPromoSection && !storeName.trim()) {
      setError("업소명을 입력해 주세요.");
      return;
    }

    const finalTitle = useCascade
      ? buildCascadeTitle(midCategory, subCategory, title)
      : title.trim();

    const submitCategoryId =
      useCascade && cascadeSection
        ? resolveCategoryIdFromCascade(
            cascadeSection,
            midCategory,
            categories,
            categoryId || defaultCategoryId || categories[0]!.id
          )
        : categoryId;

    setSubmitting(true);
    try {
      const uploaded = await uploadPendingAttachments(attachments);

      if (isEdit) {
        const res = await fetch(`/api/posts/${postId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            categoryId: submitCategoryId,
            title: finalTitle,
            content: sanitizedBody,
            guestPassword: !isLoggedIn ? editPassword : undefined,
            attachments: uploaded,
            region: region || null,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(parseApiError(data) ?? "수정에 실패했습니다.");
          return;
        }
        showToast("글이 수정되었습니다.");
        router.push(`/posts/${postId}`);
        router.refresh();
        return;
      }

      const res = await fetch("/api/posts/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: submitCategoryId,
          title: finalTitle,
          content: sanitizedBody,
          guestName: isLoggedIn ? undefined : guestName.trim(),
          guestPassword: isLoggedIn ? undefined : guestPassword,
          attachments: uploaded,
          region: region || undefined,
          storeName: isPromoSection ? storeName.trim() : undefined,
          kakaoLink: isPromoSection ? kakaoLink.trim() || undefined : undefined,
        }),
      });
      const data = (await res.json()) as { error?: string; id?: string };
      if (!res.ok) {
        setError(parseApiError(data) ?? "등록에 실패했습니다.");
        return;
      }
      try {
        localStorage.removeItem(draftKey);
      } catch {
        /* ignore */
      }
      if (data.id) {
        showToast("글이 등록되었습니다.");
        router.push(`/posts/${data.id}`);
        router.refresh();
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "처리 중 오류가 발생했습니다."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleMainChange(main: CascadeMainCategory | "") {
    setMainCategory(main);
    setMidCategory("");
    setSubCategory("");
  }

  function handleMidChange(mid: string) {
    setMidCategory(mid);
    setSubCategory("");
    if (!useCascade || !cascadeSection) return;
    const resolved = resolveCategoryIdFromCascade(
      cascadeSection,
      mid,
      categories,
      categoryId || defaultCategoryId || categories[0]?.id || ""
    );
    if (resolved) setCategoryId(resolved);
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-surface">
      {pendingDraft && (
        <div className="flex items-center justify-between gap-2 border-b border-border-light bg-accent/50 px-4 py-2 text-xs">
          <span>임시 저장된 글이 있습니다</span>
          <div className="flex gap-2">
            <button
              type="button"
              className="font-medium text-primary hover:underline"
              onClick={() => {
                if (pendingDraft.title) setTitle(pendingDraft.title);
                if (pendingDraft.body) setBody(pendingDraft.body);
                setPendingDraft(null);
              }}
            >
              불러오기
            </button>
            <button
              type="button"
              className="text-muted-foreground hover:underline"
              onClick={() => {
                try {
                  localStorage.removeItem(draftKey);
                } catch {
                  /* ignore */
                }
                setPendingDraft(null);
              }}
            >
              삭제
            </button>
          </div>
        </div>
      )}

      <WriteFormTopBar
        title={isEdit ? "글 수정" : pageTitle}
        submitLabel={isEdit ? "완료" : "등록"}
        submitting={submitting}
        onSubmit={() => void handleSubmit()}
      />

      <form
        className="flex flex-1 flex-col space-y-0"
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          if (useCascade && !validateCascadeSelection()) return;
          void handleSubmit();
        }}
      >
        {useCascade ? (
          <WriteCascadeCategorySelects
            mainCategory={effectiveMain}
            midCategory={midCategory}
            subCategory={subCategory}
            onMainChange={handleMainChange}
            onMidChange={handleMidChange}
            onSubChange={setSubCategory}
            hideMain={Boolean(fixedMain)}
          />
        ) : (
          <div className="relative border-b border-border-light py-3 px-4">
            <select
              id="write-category"
              name="categoryId"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full appearance-none bg-transparent text-sm text-gray-700 focus-ring"
              required
            >
              <option value="" disabled>
                분류를 선택하세요
              </option>
              {showOptgroups
                ? sectionGroups.map((group) => (
                    <optgroup key={group.sectionLabel} label={group.sectionLabel}>
                      {group.items.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label.replace(`${group.sectionLabel} · `, "")}
                        </option>
                      ))}
                    </optgroup>
                  ))
                : categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {categories.length > 1 && c.sectionLabel
                        ? c.label.replace(`${c.sectionLabel} · `, "")
                        : c.label}
                    </option>
                  ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
          </div>
        )}

        {isPromoSection && (
          <div className="space-y-3 border-b border-border-light py-3 px-4">
            <div>
              <label
                htmlFor="write-store-name"
                className="mb-1 block text-[11px] text-muted-foreground"
              >
                업체명 (필수)
              </label>
              <input
                id="write-store-name"
                name="storeName"
                type="text"
                placeholder="예: 7군 OO반찬"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full text-sm text-gray-800 focus-ring"
                required
              />
            </div>
            <div>
              <label
                htmlFor="write-kakao-link"
                className="mb-1 block text-[11px] text-muted-foreground"
              >
                카카오톡 링크 (선택)
              </label>
              <input
                id="write-kakao-link"
                name="kakaoLink"
                type="url"
                placeholder="https://open.kakao.com/o/..."
                value={kakaoLink}
                onChange={(e) => setKakaoLink(e.target.value)}
                className="w-full text-sm text-gray-800 focus-ring"
              />
            </div>
          </div>
        )}

        {!isLoggedIn && !isEdit && (
          <div className="grid grid-cols-2 gap-4 border-b border-border-light py-3 px-4">
            <input
              id="write-guest-name"
              name="guestName"
              type="text"
              placeholder="이름"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="w-full text-sm text-gray-800 focus-ring"
              autoComplete="name"
            />
            <input
              id="write-guest-password"
              name="guestPassword"
              type="password"
              placeholder="비밀번호"
              value={guestPassword}
              onChange={(e) => setGuestPassword(e.target.value)}
              className="w-full text-sm text-gray-800 focus-ring"
              autoComplete="new-password"
            />
          </div>
        )}

        {!isLoggedIn && isEdit && (
          <div className="border-b border-border-light py-3 px-4">
            <input
              id="write-edit-password"
              name="editPassword"
              type="password"
              placeholder="글 비밀번호"
              value={editPassword}
              onChange={(e) => setEditPassword(e.target.value)}
              className="w-full text-sm text-gray-800 focus-ring"
            />
          </div>
        )}

        <div className="border-b border-border-light py-3 px-4">
          <label className="mb-1 block text-[11px] text-muted-foreground">
            지역 (선택)
          </label>
          <select
            id="write-region"
            name="region"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="w-full appearance-none bg-transparent text-sm text-gray-700 focus-ring"
          >
            <option value="">지역 선택 안 함</option>
            {HOCHIMINH_REGIONS.map((r) => (
              <option key={r.slug} value={r.slug}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <div className="border-b border-border-light py-3 px-4">
          <input
            id="write-title"
            name="title"
            type="text"
            placeholder="제목을 입력해 주세요."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-base font-medium text-gray-900 focus-ring"
            required
          />
        </div>

        <div className="flex flex-1 flex-col border-b border-border-light">
          <RichEditor
            value={body}
            onChange={setBody}
            disabled={submitting}
            placeholder="내용을 입력해 주세요. 유튜브 링크는 그대로 붙여도 됩니다."
          />
        </div>

        <WriteAttachmentBar
          attachments={attachments}
          onChange={setAttachments}
          disabled={submitting}
        />

        {error && (
          <p className="px-4 py-2 text-center text-xs text-red-600">{error}</p>
        )}
      </form>
    </div>
  );
}
