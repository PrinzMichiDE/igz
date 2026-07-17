type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export async function openRouterChatJson<T>(options: {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
}): Promise<T> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  const model =
    options.model || process.env.OPENROUTER_MODEL || "anthropic/claude-sonnet-4";

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
      "X-Title": process.env.NEXT_PUBLIC_SITE_NAME || "IGZ Vergleich",
    },
    body: JSON.stringify({
      model,
      temperature: options.temperature ?? 0.4,
      response_format: { type: "json_object" },
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

  return JSON.parse(content) as T;
}
