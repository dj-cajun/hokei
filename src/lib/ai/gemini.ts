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
  /** 503/429 시 대체 모델 시도 */
  fallbackModels?: string[];
};

const DEFAULT_GEMINI_FALLBACK_MODELS = [
  "gemini-2.0-flash",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
];

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function parseGeminiHttpError(status: number, errText: string): Error {
  if (status === 429) {
    return new Error(
      "Gemini API 할당량 초과입니다. 잠시 후 다시 시도하거나 AI Studio 요금제를 확인하세요."
    );
  }
  if (status === 503) {
    return new Error(
      "Gemini API가 일시적으로 과부하 상태입니다. 잠시 후 다시 시도해 주세요."
    );
  }
  return new Error(`Gemini API 오류 (${status}): ${errText.slice(0, 500)}`);
}

async function geminiChatOnce(
  model: string,
  apiKey: string,
  body: Record<string, unknown>
): Promise<string> {
  const url = `${GEMINI_API_BASE}/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const maxAttempts = 5;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (!res.ok) {
      const errText = await res.text();
      if (res.status === 401 || res.status === 403) {
        throw new Error("Gemini API 키가 유효하지 않습니다. 키를 확인하세요.");
      }
      const err = parseGeminiHttpError(res.status, errText);
      if ((res.status === 429 || res.status === 503) && attempt < maxAttempts) {
        await sleep(attempt * 2500);
        continue;
      }
      throw err;
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

  throw new Error("Gemini API 요청 실패");
}

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
  const primary =
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

  const fallbacks = options.fallbackModels ?? DEFAULT_GEMINI_FALLBACK_MODELS;
  const models = [primary, ...fallbacks].filter(
    (m, i, arr) => arr.indexOf(m) === i
  );

  let lastError: Error | null = null;
  for (const model of models) {
    try {
      return await geminiChatOnce(model, apiKey, body);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error("Gemini API 요청 실패");
      const retryable =
        lastError.message.includes("과부하") ||
        lastError.message.includes("할당량");
      if (!retryable || model === models[models.length - 1]) {
        throw lastError;
      }
    }
  }

  throw lastError ?? new Error("Gemini API 요청 실패");
}
