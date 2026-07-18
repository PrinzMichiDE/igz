"use client";

import ReactMarkdown from "react-markdown";

type Props = {
  content: string;
  tone: "user" | "assistant";
};

function linkClass(tone: "user" | "assistant") {
  return tone === "user"
    ? "font-medium underline decoration-white/70 break-all hover:decoration-white"
    : "font-semibold text-blue-700 underline decoration-blue-300 break-all hover:text-blue-800";
}

/**
 * Renders chat text as readable Markdown (headings, bold, lists, links, hr).
 */
export function ChatMessageContent({ content, tone }: Props) {
  const isUser = tone === "user";

  return (
    <div
      className={
        isUser
          ? "chat-md chat-md-user text-[13px] leading-relaxed"
          : "chat-md chat-md-assistant text-[13px] leading-relaxed text-zinc-800"
      }
    >
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h3 className="mb-1.5 mt-2 text-sm font-bold first:mt-0">
              {children}
            </h3>
          ),
          h2: ({ children }) => (
            <h3 className="mb-1.5 mt-2 text-sm font-bold first:mt-0">
              {children}
            </h3>
          ),
          h3: ({ children }) => (
            <h4 className="mb-1 mt-2 text-[13px] font-bold first:mt-0">
              {children}
            </h4>
          ),
          h4: ({ children }) => (
            <h4 className="mb-1 mt-2 text-[13px] font-semibold first:mt-0">
              {children}
            </h4>
          ),
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          strong: ({ children }) => (
            <strong className="font-semibold">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          ul: ({ children }) => (
            <ul className="mb-2 list-disc space-y-1 pl-4 last:mb-0">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-2 list-decimal space-y-1 pl-4 last:mb-0">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="leading-snug">{children}</li>,
          hr: () => (
            <hr
              className={
                isUser
                  ? "my-2 border-white/30"
                  : "my-2 border-zinc-300"
              }
            />
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="nofollow sponsored noopener noreferrer"
              className={linkClass(tone)}
            >
              {children}
            </a>
          ),
          code: ({ children }) => (
            <code
              className={
                isUser
                  ? "rounded bg-white/15 px-1 py-0.5 text-[12px]"
                  : "rounded bg-zinc-200/80 px-1 py-0.5 text-[12px]"
              }
            >
              {children}
            </code>
          ),
          blockquote: ({ children }) => (
            <blockquote
              className={
                isUser
                  ? "my-2 border-l-2 border-white/40 pl-2 opacity-95"
                  : "my-2 border-l-2 border-blue-300 pl-2 text-zinc-700"
              }
            >
              {children}
            </blockquote>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
