import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeRaw from "rehype-raw";
import { CodeBlock } from "@/components/CodeBlock";
import { Children } from "react";

type Props = { markdown: string; allowHtml?: boolean };

export function MD({ markdown, allowHtml = false }: Props) {
  return (
    <div
      className="prose group
    max-sm:[&_pre]:whitespace-pre-wrap max-sm:[&_code]:whitespace-pre-wrap
    max-sm:[&_pre]:wrap-anywhere max-sm:[&_code]:wrap-anywhere
    max-sm:[&_pre]:max-w-full"
    >
      {" "}
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: "append" }],
          ...(allowHtml ? [rehypeRaw] : []),
        ]}
        components={{
          pre: ({ children }) => {
            const child = Children.only(children) as React.ReactElement<{
              className?: string;
              children?: string | string[];
            }>;
            const raw = child.props?.children ?? "";
            const code = Array.isArray(raw) ? raw.join("") : String(raw);
            const lang = child.props?.className?.replace("language-", "") ?? "";
            return <CodeBlock code={code} lang={lang} />;
          },
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
