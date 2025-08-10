import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function InlineMD({ text }: { text: string }) {
  // Render minimal inline markdown: code, bold/italic, links
  return (
    <span className="[&_code]:rounded [&_code]:bg-zinc-100 [&_code]:px-1 [&_code]:py-0.5 dark:[&_code]:bg-zinc-800">
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
