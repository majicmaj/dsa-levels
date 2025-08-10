import { useEffect, useState } from "react";
import { codeToHtml } from "shiki";

type Props = {
  code: string;
  lang?: string;
};

// Shiki instance is heavy, so we memoize it
let highlighter: Awaited<ReturnType<typeof getHighlighter>> | undefined;

export function CodeBlock({ code, lang }: Props) {
  const [html, setHtml] = useState("");

  useEffect(() => {
    async function highlight() {
      const shiki = await codeToHtml(code, {
        lang: lang || "txt",
        theme: "github-dark-dimmed",
      });
      setHtml(shiki);
    }
    highlight();
  }, [code, lang]);

  if (!html) {
    // Keep space while loading to avoid layout shift
    return (
      <pre className="shiki">
        <code>{code}</code>
      </pre>
    );
  }

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
