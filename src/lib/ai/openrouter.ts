const OPENROUTER_API_BASE =
  process.env.OPENROUTER_API_BASE ?? "https://openrouter.ai/api/v1";

export type OpenRouterMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type OpenRouterChatOptions = {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  jsonResponse?: boolean;
};

function getApiKey(): string {
  const key = process.env.OPENROUTER_API_KEY?.trim();
  if (!key) {
    throw new Error(
      "OPENROUTER_API_KEY가 설정되지 않았습니다. .env.local에 OpenRouter API 키를 추가하세요."
    );
  }
  return key;
}

export function isOpenRouterConfigured(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY?.trim());
}

export async function openRouterChat(
  messages: OpenRouterMessage[],
  options: OpenRouterChatOptions = {}
): Promise<string> {
  const model =
    options.model ?? process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini";
  const apiKey = getApiKey();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";

  const body: Record<string, unknown> = {
    model,
    messages,
    temperature: options.temperature ?? 0.2,
    max_tokens: options.maxTokens ?? 16384,
    stream: false,
  };

  if (options.jsonResponse) {
    body.response_format = { type: "json_object" };
  }

  const res = await fetch(`${OPENROUTER_API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": siteUrl,
      "X-OpenRouter-Title": "Hokei",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    const errText = await res.text();
    if (res.status === 401) {
      throw new Error("OpenRouter API 키가 유효하지 않습니다. 키를 확인하세요.");
    }
    if (res.status === 402 || errText.includes("Insufficient credits")) {
      throw new Error(
        "OpenRouter 잔액이 부족합니다. openrouter.ai에서 충전 후 다시 시도하세요."
      );
    }
    if (res.status === 429) {
      throw new Error(
        "OpenRouter 요청 한도를 초과했습니다. 잠시 후 다시 시도하세요."
      );
    }
    throw new Error(
      `OpenRouter API 오류 (${res.status}): ${errText.slice(0, 500)}`
    );
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
    error?: { message?: string };
  };

  if (data.error?.message) {
    throw new Error(`OpenRouter: ${data.error.message}`);
  }

  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("OpenRouter 응답이 비어 있습니다.");
  }

  return content;
}
