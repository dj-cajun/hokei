import { del, put } from "@vercel/blob";
import { randomUUID } from "crypto";
import path from "path";
import { assertAllowedUpload } from "@/lib/file-sniff";
import { MAX_FILE_BYTES, MAX_IMAGE_BYTES } from "@/lib/constants";

function safeBaseName(name: string): string {
  const base = path.basename(name).replace(/[^\w.\-가-힣]/g, "_");
  return base.slice(0, 80) || "file";
}

export function isBlobStorageEnabled(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

export async function saveUploadToBlob(file: File): Promise<{
  url: string;
  fileName: string;
  mimeType: string;
  size: number;
  kind: "IMAGE" | "FILE";
  diskPath: string;
}> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const { mimeType, kind } = assertAllowedUpload(
    buffer,
    file.type || "application/octet-stream"
  );
  const max = kind === "IMAGE" ? MAX_IMAGE_BYTES : MAX_FILE_BYTES;

  if (file.size > max) {
    throw new Error(
      kind === "IMAGE"
        ? "이미지는 8MB 이하만 업로드할 수 있습니다."
        : "파일은 15MB 이하만 업로드할 수 있습니다."
    );
  }

  const ext = path.extname(file.name) || (kind === "IMAGE" ? ".jpg" : "");
  const subDir = new Date().toISOString().slice(0, 7);
  const pathname = `uploads/${subDir}/${randomUUID()}-${safeBaseName(path.parse(file.name).name)}${ext}`;

  const blob = await put(pathname, buffer, {
    access: "public",
    contentType: mimeType,
    addRandomSuffix: false,
  });

  return {
    url: blob.url,
    fileName: file.name,
    mimeType,
    size: file.size,
    kind,
    diskPath: "",
  };
}

export async function deleteBlobUpload(publicUrl: string): Promise<void> {
  if (!publicUrl.includes("blob.vercel-storage.com")) return;
  try {
    await del(publicUrl);
  } catch {
    /* ignore */
  }
}
