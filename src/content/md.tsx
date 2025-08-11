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
    max-md:[&_pre]:whitespace-pre-wrap max-md:[&_code]:whitespace-pre-wrap
    max-md:[&_pre]:wrap-anywhere max-md:[&_code]:wrap-anywhere
    max-md:[&_pre]:max-w-full"
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
