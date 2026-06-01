const ZAI_API_BASE =
  process.env.ZAI_API_BASE ?? "https://api.z.ai/api/paas/v4";

export type ZaiMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type ZaiChatOptions = {
  model?: string;
  temperature?: number;
  maxTokens?: number;
};

function getApiKey(): string {
  const key = process.env.ZAI_API_KEY;
  if (!key) {
    throw new Error(
      "ZAI_API_KEY가 설정되지 않았습니다. .env에 Z.AI API 키를 추가하세요."
    );
  }
  return key;
}

export function isZaiConfigured(): boolean {
  return Boolean(process.env.ZAI_API_KEY?.trim());
}

export async function zaiChat(
  messages: ZaiMessage[],
  options: ZaiChatOptions = {}
): Promise<string> {
  const model = options.model ?? process.env.ZAI_MODEL ?? "glm-5.1";
  const apiKey = getApiKey();

  const res = await fetch(`${ZAI_API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "Accept-Language": "ko-KR,ko",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options.temperature ?? 0.3,
      max_tokens: options.maxTokens ?? 2048,
      stream: false,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const errText = await res.text();
    if (res.status === 429 || errText.includes("Insufficient balance")) {
      throw new Error(
        "Z.AI 잔액/리소스 패키지가 부족합니다. z.ai 콘솔에서 충전 후 다시 시도하세요."
      );
    }
    if (res.status === 401 || errText.includes("身份验证")) {
      throw new Error("Z.AI API 키가 유효하지 않습니다. 키를 확인하세요.");
    }
    throw new Error(`Z.AI API 오류 (${res.status}): ${errText.slice(0, 500)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
    error?: { message?: string };
  };

  if (data.error?.message) {
    throw new Error(`Z.AI: ${data.error.message}`);
  }

  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("Z.AI 응답이 비어 있습니다.");
  }

  return content;
}
