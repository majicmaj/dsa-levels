import { useEffect, useState } from "react";
import { codeToHtml } from "shiki";
import { Copy, Check } from "lucide-react";

type Props = {
  code: string;
  lang?: string;
};

// Note: we used to memoize a shiki highlighter instance; now we use codeToHtml directly

export function CodeBlock({ code, lang }: Props) {
  const [html, setHtml] = useState("");
  const [copied, setCopied] = useState(false);

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

  function copyToClipboard() {
    void navigator.clipboard.writeText(code).then(
      () => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1200);
      },
      () => {
        /* ignore */
      }
    );
  }

  if (!html) {
    return (
      <div className="relative group overflow-x-auto">
        <button
          type="button"
          aria-label="Copy code"
          onClick={copyToClipboard}
          className="absolute right-2 top-2 hidden rounded-md border px-2 py-1 text-xs backdrop-blur group-hover:inline-flex hover:bg-zinc-100 dark:hover:bg-zinc-900"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
        <div
          className="relative group
                  max-sm:[&_pre]:whitespace-pre-wrap max-sm:[&_code]:whitespace-pre-wrap
                  max-sm:[&_pre]:wrap-anywhere max-sm:[&_code]:wrap-anywhere
                  [&_pre]:max-w-full"
        >
          {" "}
          <pre className="shiki">
            <code>{code}</code>
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative group
    max-sm:[&_pre]:whitespace-pre-wrap max-sm:[&_code]:whitespace-pre-wrap
    max-sm:[&_pre]:wrap-anywhere max-sm:[&_code]:wrap-anywhere
    max-sm:[&_pre]:max-w-full"
    >
      <button
        type="button"
        aria-label={copied ? "Copied" : "Copy code"}
        onClick={copyToClipboard}
        className="absolute right-2 top-2 hidden rounded-md border px-2 py-1 text-xs backdrop-blur group-hover:inline-flex hover:bg-zinc-100 dark:hover:bg-zinc-900"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </button>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
