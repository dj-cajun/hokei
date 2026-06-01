import { NextResponse } from "next/server";
import { enforcePreset } from "@/lib/api/enforce-rate-limit";
import { getCategoryTree } from "@/lib/categories";

/** n8n·외부 연동용 카테고리 마스터 JSON */
export async function GET(request: Request) {
  const limited = await enforcePreset(request, "general");
  if (limited) return limited;

  const tree = await getCategoryTree();
  return NextResponse.json({ version: 1, sections: tree });
}
