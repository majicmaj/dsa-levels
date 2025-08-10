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
    <div className="prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: "append" }],
          ...(allowHtml ? [rehypeRaw] : []),
        ]}
        components={{
          pre: (props) => {
            const child = Children.only(props.children) as React.ReactElement;
            const code = child.props.children as string;
            const lang =
              (child.props.className as string | undefined)?.replace(
                "language-",
                ""
              ) || "";
            return <CodeBlock code={code} lang={lang} />;
          },
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
