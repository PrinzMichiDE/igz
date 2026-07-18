import type { ChatMessage } from "@/lib/ai/openrouter";

export type OpenRouterChatCompletionBody = {
  model: string;
  temperature: number;
  response_format?: { type: "json_object" };
  messages: ChatMessage[];
};

export type OpenRouterChatCompletionResponse = {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
};

export function getOpenRouterModel() {
  return process.env.OPENROUTER_MODEL || "anthropic/claude-sonnet-4";
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
}): OpenRouterChatCompletionBody {
  return {
    model: options.model || getOpenRouterModel(),
    temperature: options.temperature ?? 0.4,
    response_format: { type: "json_object" },
    messages: options.messages,
  };
}

export function parseOpenRouterJsonContent<T>(
  body: OpenRouterChatCompletionResponse | string | unknown,
): T {
  const parsed =
    typeof body === "string"
      ? (JSON.parse(body) as OpenRouterChatCompletionResponse)
      : (body as OpenRouterChatCompletionResponse);

  if (parsed?.error?.message) {
    throw new Error(`OpenRouter error: ${parsed.error.message}`);
  }

  const content = parsed?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenRouter returned empty content");
  }

  return JSON.parse(content) as T;
}

export const OPENROUTER_CHAT_URL =
  "https://openrouter.ai/api/v1/chat/completions";
