const GEMINI_API_BASE =
  process.env.GEMINI_API_BASE ??
  "https://generativelanguage.googleapis.com/v1beta";

export type GeminiMessage = {
  role: "user" | "model";
  content: string;
};

export type GeminiChatOptions = {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  system?: string;
  jsonResponse?: boolean;
};

function getApiKey(): string {
  const key =
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_API_KEY?.trim();
  if (!key) {
    throw new Error(
      "GEMINI_API_KEY가 설정되지 않았습니다. Google AI Studio에서 발급한 키를 .env에 추가하세요."
    );
  }
  return key;
}

export function isGeminiConfigured(): boolean {
  return Boolean(
    process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_API_KEY?.trim()
  );
}

export async function geminiChat(
  messages: GeminiMessage[],
  options: GeminiChatOptions = {}
): Promise<string> {
  const model =
    options.model ?? process.env.GEMINI_MODEL ?? "gemini-2.5-flash-lite";
  const apiKey = getApiKey();

  const contents = messages.map((m) => ({
    role: m.role,
    parts: [{ text: m.content }],
  }));

  const body: Record<string, unknown> = {
    contents,
    generationConfig: {
      temperature: options.temperature ?? 0.3,
      maxOutputTokens: options.maxTokens ?? 2048,
    },
  };

  if (options.system) {
    body.systemInstruction = { parts: [{ text: options.system }] };
  }

  if (options.jsonResponse) {
    (body.generationConfig as Record<string, unknown>).responseMimeType =
      "application/json";
  }

  const url = `${GEMINI_API_BASE}/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    const errText = await res.text();
    if (res.status === 429) {
      throw new Error(
        "Gemini API 할당량 초과입니다. 잠시 후 다시 시도하거나 AI Studio 요금제를 확인하세요."
      );
    }
    if (res.status === 401 || res.status === 403) {
      throw new Error("Gemini API 키가 유효하지 않습니다. 키를 확인하세요.");
    }
    throw new Error(
      `Gemini API 오류 (${res.status}): ${errText.slice(0, 500)}`
    );
  }

  const data = (await res.json()) as {
    candidates?: {
      content?: { parts?: { text?: string }[] };
    }[];
    error?: { message?: string };
  };

  if (data.error?.message) {
    throw new Error(`Gemini: ${data.error.message}`);
  }

  const parts = data.candidates?.[0]?.content?.parts ?? [];
  const content = parts
    .map((p) => p.text ?? "")
    .join("")
    .trim();

  if (!content) {
    throw new Error("Gemini 응답이 비어 있습니다.");
  }

  return content;
}
