import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { enforcePreset } from "@/lib/api/enforce-rate-limit";
import { saveUpload } from "@/lib/upload";
import { isAllowedUploadOrigin } from "@/lib/upload-origin";
import { log } from "@/lib/logger";

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      if (!isAllowedUploadOrigin(request)) {
        return NextResponse.json(
          { ok: false, error: "허용되지 않은 업로드 요청입니다." },
          { status: 403 }
        );
      }
      const limited = await enforcePreset(request, "uploadGuest");
      if (limited) return limited;
    } else {
      const limited = await enforcePreset(request, "upload");
      if (limited) return limited;
    }

    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { ok: false, error: "업로드할 파일을 선택해 주세요." },
        { status: 400 }
      );
    }

    const saved = await saveUpload(file);

    return NextResponse.json({
      ok: true,
      url: saved.url,
      fileName: saved.fileName,
      mimeType: saved.mimeType,
      size: saved.size,
      kind: saved.kind,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "파일 업로드에 실패했습니다.";
    log("error", "upload failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
