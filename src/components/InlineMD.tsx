import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function InlineMD({ text }: { text: string }) {
  // Render minimal inline markdown: code, bold/italic, links
  return (
    <span
      className={`
      [&_code]:rounded [&_code]:bg-zinc-100 [&_code]:px-1 [&_code]:py-0.5 dark:[&_code]:bg-zinc-800
      relative group
      max-sm:[&_pre]:whitespace-pre-wrap max-sm:[&_code]:whitespace-pre-wrap
      max-sm:[&_pre]:wrap-anywhere max-sm:[&_code]:wrap-anywhere
      max-sm:[&_pre]:max-w-full
    `}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <>{children}</>,
        }}
      >
        {text}
      </ReactMarkdown>
    </span>
  );
}
