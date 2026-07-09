import { z } from "zod";
import { enforcePreset } from "@/lib/api/enforce-rate-limit";
import { apiError, apiSuccess } from "@/lib/api-response";
import { writeAdminAudit } from "@/lib/admin/audit-log";
import { requireAdminApi } from "@/lib/admin/require-admin-api";
import {
  BANNED_WORDS_MAX,
  getBannedWords,
  parseBannedWordsInput,
  setBannedWords,
} from "@/lib/moderation/banned-words";

const putSchema = z.object({
  words: z.array(z.string().max(80)).max(BANNED_WORDS_MAX),
});

export async function GET(request: Request) {
  const limited = await enforcePreset(request, "general");
  if (limited) return limited;
  const { error } = await requireAdminApi();
  if (error) return error;

  const words = await getBannedWords();
  return apiSuccess({ words });
}

export async function PUT(request: Request) {
  const limited = await enforcePreset(request, "general");
  if (limited) return limited;
  const { session, error } = await requireAdminApi();
  if (error) return error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("잘못된 JSON입니다.", 400);
  }

  const parsed = putSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("유효하지 않은 금지어 목록입니다.", 400);
  }

  const words = await setBannedWords(
    parseBannedWordsInput(parsed.data.words.join("\n"))
  );

  await writeAdminAudit({
    actorId: session!.user!.id,
    action: "BANNED_WORDS_UPDATE",
    metadata: { count: words.length },
    request,
  });

  return apiSuccess({ words });
}
