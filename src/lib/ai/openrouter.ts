export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

function getOpenRouterConfig() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  return {
    apiKey,
    model:
      process.env.OPENROUTER_MODEL || "anthropic/claude-sonnet-4",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer":
        process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
      "X-Title": process.env.NEXT_PUBLIC_SITE_NAME || "IGZ Vergleich",
    },
  };
}

export async function openRouterChatJson<T>(options: {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  plugins?: Array<Record<string, unknown>>;
}): Promise<T> {
  const config = getOpenRouterConfig();

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: config.headers,
    body: JSON.stringify({
      model: options.model || config.model,
      temperature: options.temperature ?? 0.4,
      ...(typeof options.maxTokens === "number"
        ? { max_tokens: options.maxTokens }
        : {}),
      response_format: { type: "json_object" },
      messages: options.messages,
      ...(options.plugins?.length ? { plugins: options.plugins } : {}),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenRouter error ${res.status}: ${text}`);
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = json.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenRouter returned empty content");
  }

  return JSON.parse(content) as T;
}

export async function openRouterChatText(options: {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
}): Promise<string> {
  const config = getOpenRouterConfig();

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: config.headers,
    body: JSON.stringify({
      model: options.model || config.model,
      temperature: options.temperature ?? 0.5,
      messages: options.messages,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenRouter error ${res.status}: ${text}`);
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = json.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenRouter returned empty content");
  }

  return content;
}

export async function openRouterChatStream(options: {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
}): Promise<Response> {
  const config = getOpenRouterConfig();

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: config.headers,
    body: JSON.stringify({
      model: options.model || config.model,
      temperature: options.temperature ?? 0.5,
      stream: true,
      messages: options.messages,
    }),
  });

  if (!res.ok || !res.body) {
    const text = await res.text();
    throw new Error(`OpenRouter stream error ${res.status}: ${text}`);
  }

  return res;
}
