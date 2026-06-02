"use client";

import { Camera, Paperclip, X } from "lucide-react";
import Image from "next/image";
import { useRef } from "react";

export type UploadedAttachmentMeta = {
  url: string;
  fileName: string;
  mimeType: string;
  size: number;
  kind: "IMAGE" | "FILE";
};

export type PendingAttachment = {
  id: string;
  previewUrl: string;
  name: string;
  type: "image" | "file";
  file?: File;
  uploaded?: UploadedAttachmentMeta;
};

type WriteAttachmentBarProps = {
  attachments: PendingAttachment[];
  onChange: (next: PendingAttachment[]) => void;
  disabled?: boolean;
};

export function WriteAttachmentBar({
  attachments,
  onChange,
  disabled,
}: WriteAttachmentBarProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function addFiles(files: FileList | null, type: "image" | "file") {
    if (!files?.length || disabled) return;
    const next: PendingAttachment[] = [];
    Array.from(files).forEach((file) => {
      next.push({
        id: `${Date.now()}-${file.name}-${Math.random()}`,
        previewUrl: type === "image" ? URL.createObjectURL(file) : "",
        name: file.name,
        type,
        file,
      });
    });
    onChange([...attachments, ...next]);
  }

  function remove(id: string) {
    const item = attachments.find((a) => a.id === id);
    if (item?.previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(item.previewUrl);
    }
    onChange(attachments.filter((a) => a.id !== id));
  }

  return (
    <div>
      {attachments.length > 0 && (
        <div className="scrollbar-none flex gap-2 overflow-x-auto border-b border-gray-100 bg-white px-4 py-2">
          {attachments.map((item) => (
            <div key={item.id} className="relative shrink-0">
              {item.type === "image" && (item.previewUrl || item.uploaded?.url) ? (
                <Image
                  src={item.previewUrl || item.uploaded!.url}
                  alt=""
                  width={56}
                  height={56}
                  unoptimized
                  className="h-14 w-14 rounded-sm object-cover"
                />
              ) : (
                <div className="flex h-14 w-24 items-center justify-center rounded-sm bg-gray-100 px-1 text-[10px] text-gray-600">
                  {item.name.slice(0, 12)}
                </div>
              )}
              <button
                type="button"
                disabled={disabled}
                onClick={() => remove(item.id)}
                className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-gray-800 text-white focus-ring"
                aria-label="첨부 삭제"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center space-x-4 border-b border-t border-gray-200 bg-gray-50 px-4 py-2">
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          disabled={disabled}
          onChange={(e) => {
            addFiles(e.target.files, "image");
            e.target.value = "";
          }}
        />
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          disabled={disabled}
          onChange={(e) => {
            addFiles(e.target.files, "file");
            e.target.value = "";
          }}
        />
        <button
          type="button"
          disabled={disabled}
          onClick={() => imageInputRef.current?.click()}
          className="text-gray-500 focus-ring disabled:opacity-40"
          aria-label="사진 첨부"
        >
          <Camera className="h-5 w-5" />
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => fileInputRef.current?.click()}
          className="text-gray-500 focus-ring disabled:opacity-40"
          aria-label="파일 첨부"
        >
          <Paperclip className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

export async function uploadPendingAttachments(
  items: PendingAttachment[]
): Promise<UploadedAttachmentMeta[]> {
  const result: UploadedAttachmentMeta[] = [];

  for (const item of items) {
    if (item.uploaded) {
      result.push(item.uploaded);
      continue;
    }
    if (!item.file) continue;

    const form = new FormData();
    form.append("file", item.file);
    const res = await fetch("/api/uploads", { method: "POST", body: form });
    const data = (await res.json()) as UploadedAttachmentMeta & { error?: string };
    if (!res.ok) {
      throw new Error(data.error ?? "파일 업로드에 실패했습니다.");
    }
    result.push({
      url: data.url,
      fileName: data.fileName,
      mimeType: data.mimeType,
      size: data.size,
      kind: data.kind,
    });
  }

  return result;
}
