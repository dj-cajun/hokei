import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { assertAllowedUpload } from "@/lib/file-sniff";
import { MAX_FILE_BYTES, MAX_IMAGE_BYTES } from "@/lib/constants";

const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/heic",
  "image/heif",
]);

function safeBaseName(name: string): string {
  const base = path.basename(name).replace(/[^\w.\-가-힣]/g, "_");
  return base.slice(0, 80) || "file";
}

export function getUploadKind(mimeType: string): "IMAGE" | "FILE" {
  return IMAGE_TYPES.has(mimeType) ? "IMAGE" : "FILE";
}

export async function saveUpload(file: File): Promise<{
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
  const finalName = `${randomUUID()}-${safeBaseName(path.parse(file.name).name)}${ext}`;

  const subDir = new Date().toISOString().slice(0, 7);
  const dir = path.join(process.cwd(), "public", "uploads", subDir);
  await mkdir(dir, { recursive: true });

  const diskPath = path.join(dir, finalName);
  await writeFile(diskPath, buffer);

  const url = `/uploads/${subDir}/${finalName}`;

  return {
    url,
    fileName: file.name,
    mimeType,
    size: file.size,
    kind,
    diskPath,
  };
}

export async function deleteUploadFile(publicUrl: string): Promise<void> {
  if (!publicUrl.startsWith("/uploads/")) return;
  const diskPath = path.join(process.cwd(), "public", publicUrl);
  try {
    await unlink(diskPath);
  } catch {
    /* ignore missing file */
  }
}
