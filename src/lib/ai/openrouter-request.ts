import type { ChatMessage } from "@/lib/ai/openrouter";

export type OpenRouterChatCompletionBody = {
  model: string;
  temperature: number;
  max_tokens?: number;
  response_format?: { type: "json_object" };
  messages: ChatMessage[];
  plugins?: Array<Record<string, unknown>>;
};

export type OpenRouterChatCompletionResponse = {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
};

function isFreeModel(model: string) {
  const value = model.toLowerCase();
  return (
    value.includes("openrouter/free") ||
    value.endsWith(":free") ||
    value.includes("/free")
  );
}

export function getOpenRouterModel() {
  return process.env.OPENROUTER_MODEL || "anthropic/claude-sonnet-4";
}

/**
 * Long structured reviews need a model that reliably obeys JSON mode.
 * Free router models often return chain-of-thought instead of JSON.
 */
export function getOpenRouterReviewModel() {
  const explicit = process.env.OPENROUTER_REVIEW_MODEL?.trim();
  if (explicit) return explicit;

  const primary = getOpenRouterModel();
  if (isFreeModel(primary)) {
    return (
      process.env.OPENROUTER_FALLBACK_MODEL?.trim() ||
      "anthropic/claude-sonnet-4"
    );
  }
  return primary;
}

export function getOpenRouterFallbackModel() {
  return (
    process.env.OPENROUTER_FALLBACK_MODEL?.trim() ||
    process.env.OPENROUTER_REVIEW_MODEL?.trim() ||
    "anthropic/claude-sonnet-4"
  );
}

export function getOpenRouterAuthHeaders() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "HTTP-Referer":
      process.env.NEXT_PUBLIC_SITE_URL || "https://igz.vercel.app",
    "X-Title": process.env.NEXT_PUBLIC_SITE_NAME || "IGZ Vergleich",
  };
}

export function buildOpenRouterJsonBody(options: {
  messages: ChatMessage[];
  temperature?: number;
  model?: string;
  maxTokens?: number;
  plugins?: Array<Record<string, unknown>>;
}): OpenRouterChatCompletionBody {
  return {
    model: options.model || getOpenRouterModel(),
    temperature: options.temperature ?? 0.4,
    ...(typeof options.maxTokens === "number"
      ? { max_tokens: options.maxTokens }
      : {}),
    response_format: { type: "json_object" },
    messages: options.messages,
    ...(options.plugins?.length ? { plugins: options.plugins } : {}),
  };
}

/** Pull a JSON object out of prose, fences, or raw model text. */
export function extractJsonObject(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("OpenRouter returned empty content");
  }

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence?.[1]?.trim()) {
    return fence[1].trim();
  }

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return trimmed.slice(start, end + 1);
  }

  throw new Error(
    `OpenRouter content is not JSON (starts with: ${trimmed.slice(0, 80)})`,
  );
}

export function parseOpenRouterJsonContent<T>(
  body: OpenRouterChatCompletionResponse | string | unknown,
): T {
  let parsed: OpenRouterChatCompletionResponse;
  if (typeof body === "string") {
    const raw = body.trim();
    if (!raw) {
      throw new Error("OpenRouter returned empty body");
    }
    try {
      parsed = JSON.parse(raw) as OpenRouterChatCompletionResponse;
    } catch {
      // Some providers occasionally return the JSON payload directly.
      return JSON.parse(extractJsonObject(raw)) as T;
    }
  } else {
    parsed = body as OpenRouterChatCompletionResponse;
  }

  if (parsed?.error?.message) {
    throw new Error(`OpenRouter error: ${parsed.error.message}`);
  }

  const content = parsed?.choices?.[0]?.message?.content;
  if (!content?.trim()) {
    throw new Error("OpenRouter returned empty content");
  }

  return JSON.parse(extractJsonObject(content)) as T;
}

export const OPENROUTER_CHAT_URL =
  "https://openrouter.ai/api/v1/chat/completions";
