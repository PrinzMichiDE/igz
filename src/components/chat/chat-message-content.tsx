type Props = {
  content: string;
  tone: "user" | "assistant";
};

function linkClass(tone: "user" | "assistant") {
  return tone === "user"
    ? "underline decoration-white/70 break-all"
    : "font-medium text-blue-700 underline break-all";
}

/**
 * Renders assistant/user chat text with clickable markdown links and bare URLs.
 */
export function ChatMessageContent({ content, tone }: Props) {
  const nodes: React.ReactNode[] = [];
  const pattern =
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s<]+)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(content)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(content.slice(lastIndex, match.index));
    }

    if (match[1] && match[2]) {
      nodes.push(
        <a
          key={`${match.index}-md`}
          href={match[2]}
          target="_blank"
          rel="nofollow sponsored noopener noreferrer"
          className={linkClass(tone)}
        >
          {match[1]}
        </a>,
      );
    } else if (match[3]) {
      nodes.push(
        <a
          key={`${match.index}-url`}
          href={match[3]}
          target="_blank"
          rel="nofollow sponsored noopener noreferrer"
          className={linkClass(tone)}
        >
          {match[3]}
        </a>,
      );
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    nodes.push(content.slice(lastIndex));
  }

  return <div className="whitespace-pre-wrap">{nodes}</div>;
}
