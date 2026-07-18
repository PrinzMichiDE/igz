"use client";

import { useMemo, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { ChatMessageContent } from "@/components/chat/chat-message-content";

type ChatMsg = { role: "user" | "assistant"; content: string };

type Props = {
  locale: string;
  labels: {
    title: string;
    subtitle: string;
    placeholder: string;
    send: string;
    open: string;
    thinking: string;
    error: string;
    suggestions: string[];
  };
  productSlugs?: string[];
  categorySlug?: string;
};

async function readOpenRouterSse(
  response: Response,
  onDelta: (text: string) => void,
) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("No stream");

  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split("\n");
    buffer = chunks.pop() || "";

    for (const line of chunks) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      if (data === "[DONE]") continue;
      try {
        const json = JSON.parse(data) as {
          choices?: Array<{ delta?: { content?: string } }>;
        };
        const delta = json.choices?.[0]?.delta?.content || "";
        if (delta) {
          full += delta;
          onDelta(full);
        }
      } catch {
        // ignore partial JSON
      }
    }
  }

  return full;
}

export function AiChatWidget({
  locale,
  labels,
  productSlugs,
  categorySlug,
}: Props) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const endRef = useRef<HTMLDivElement | null>(null);

  const canSend = useMemo(
    () => input.trim().length > 0 && !busy,
    [input, busy],
  );

  async function sendMessage(content: string) {
    const text = content.trim();
    if (!text || busy) return;

    const nextMessages: ChatMsg[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setBusy(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          messages: nextMessages,
          productSlugs,
          categorySlug,
        }),
      });

      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(err?.error || labels.error);
      }

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      await readOpenRouterSse(res, (partial) => {
        setMessages((prev) => {
          const clone = [...prev];
          clone[clone.length - 1] = { role: "assistant", content: partial };
          return clone;
        });
        endRef.current?.scrollIntoView({ behavior: "smooth" });
      });
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: labels.error },
      ]);
    } finally {
      setBusy(false);
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-full bg-blue-700 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-800"
        aria-label={labels.open}
      >
        <MessageCircle className="h-4 w-4" />
        {labels.open}
      </button>

      {open ? (
        <div className="fixed bottom-5 right-5 z-50 flex h-[min(70vh,560px)] w-[min(92vw,380px)] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl">
          <div className="flex items-start justify-between gap-3 border-b border-zinc-100 bg-blue-700 px-4 py-3 text-white">
            <div>
              <p className="text-sm font-semibold">{labels.title}</p>
              <p className="text-xs text-blue-100">{labels.subtitle}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md p-1 hover:bg-blue-600"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
            {messages.length === 0 ? (
              <div className="space-y-2">
                {labels.suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => sendMessage(suggestion)}
                    className="block w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-left text-xs text-zinc-700 hover:border-blue-300"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            ) : null}

            {messages.map((msg, index) => (
              <div
                key={`${msg.role}-${index}`}
                className={
                  msg.role === "user"
                    ? "ml-6 rounded-2xl bg-blue-700 px-3.5 py-2.5 text-sm text-white"
                    : "mr-6 rounded-2xl border border-zinc-200/80 bg-zinc-50 px-3.5 py-2.5 text-sm text-zinc-800 shadow-sm"
                }
              >
                {msg.content ? (
                  <ChatMessageContent content={msg.content} tone={msg.role} />
                ) : busy ? (
                  labels.thinking
                ) : null}
              </div>
            ))}
            <div ref={endRef} />
          </div>

          <form
            className="flex items-center gap-2 border-t border-zinc-100 p-3"
            onSubmit={(e) => {
              e.preventDefault();
              void sendMessage(input);
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={labels.placeholder}
              className="flex-1 rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
              disabled={busy}
            />
            <button
              type="submit"
              disabled={!canSend}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-700 text-white disabled:opacity-40"
              aria-label={labels.send}
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      ) : null}
    </>
  );
}
