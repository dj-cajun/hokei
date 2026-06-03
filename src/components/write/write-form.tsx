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
import {
  SECTION_TO_MAIN,
  buildCascadeTitle,
  isCascadeWriteSection,
  parseCascadeTitle,
  resolveCategoryIdFromCascade,
  type CascadeMainCategory,
  type CascadeWriteSection,
} from "@/lib/write-cascade-categories";

export type WriteFormInitial = {
  categoryId: string;
  title: string;
  body: string;
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

  const parsedInitialTitle = useMemo(
    () => (initial?.title ? parseCascadeTitle(initial.title) : null),
    [initial]
  );

  const fixedMain: CascadeMainCategory | "" = cascadeSection
    ? SECTION_TO_MAIN[cascadeSection]
    : "";

  const [categoryId, setCategoryId] = useState(
    initial?.categoryId ?? defaultCategoryId ?? ""
  );
  const [mainCategory, setMainCategory] = useState<CascadeMainCategory | "">(
    () =>
      fixedMain ||
      (parsedInitialTitle && cascadeSection
        ? SECTION_TO_MAIN[cascadeSection]
        : "")
  );
  const [midCategory, setMidCategory] = useState(
    parsedInitialTitle?.midCategory ?? ""
  );
  const [subCategory, setSubCategory] = useState(
    parsedInitialTitle?.subCategory ?? ""
  );
  const [guestName, setGuestName] = useState("");
  const [guestPassword, setGuestPassword] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [title, setTitle] = useState(
    parsedInitialTitle?.rawTitle ?? initial?.title ?? ""
  );
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
    if (!body.trim()) {
      setError("내용을 입력해 주세요.");
      return;
    }
    if (!isLoggedIn && !isEdit && (!guestName.trim() || !guestPassword.trim())) {
      setError("비회원 글쓰기는 이름과 비밀번호가 필요합니다.");
      return;
    }
    if (!isLoggedIn && isEdit && !editPassword.trim()) {
      setError("수정하려면 글 작성 시 입력한 비밀번호가 필요합니다.");
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
            content: body.trim(),
            guestPassword: !isLoggedIn ? editPassword : undefined,
            attachments: uploaded,
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
          content: body.trim(),
          guestName: isLoggedIn ? undefined : guestName.trim(),
          guestPassword: isLoggedIn ? undefined : guestPassword,
          attachments: uploaded,
        }),
      });
      const data = (await res.json()) as { error?: string; id?: string };
      if (!res.ok) {
        setError(parseApiError(data) ?? "등록에 실패했습니다.");
        return;
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
    <div className="flex min-h-[100dvh] flex-col bg-white">
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
          <div className="relative border-b border-gray-100 py-3 px-4">
            <select
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
              className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              aria-hidden
            />
          </div>
        )}

        {!isLoggedIn && !isEdit && (
          <div className="grid grid-cols-2 gap-4 border-b border-gray-100 py-3 px-4">
            <input
              type="text"
              placeholder="이름"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="w-full text-sm text-gray-800 focus-ring"
              autoComplete="name"
            />
            <input
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
          <div className="border-b border-gray-100 py-3 px-4">
            <input
              type="password"
              placeholder="글 비밀번호"
              value={editPassword}
              onChange={(e) => setEditPassword(e.target.value)}
              className="w-full text-sm text-gray-800 focus-ring"
            />
          </div>
        )}

        <div className="border-b border-gray-100 py-3 px-4">
          <input
            type="text"
            placeholder="제목을 입력해 주세요."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-base font-medium text-gray-900 focus-ring"
            required
          />
        </div>

        <div className="flex flex-1 flex-col border-b border-gray-100">
          <textarea
            placeholder="내용을 입력해 주세요. 유튜브 주소(youtube.com/watch, youtu.be 등)만 붙여도 글에서 영상으로 표시됩니다."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="min-h-[300px] w-full resize-none py-4 px-4 text-sm text-gray-800 focus-ring"
            required
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
