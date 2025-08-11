import { useEffect, useState } from "react";

type TocItem = {
  id: string;
  text: string;
  depth: 2 | 3;
};

export function LessonTOC({ markdown }: { markdown?: string }) {
  const [items, setItems] = useState<TocItem[]>([]);
  const [active, setActive] = useState<string | null>(null);

  // Build TOC from actual DOM so ids match rehype-slug exactly
  useEffect(() => {
    function build() {
      const article = document.querySelector("article");
      if (!article) {
        setItems([]);
        return;
      }
      const headings = Array.from(
        article.querySelectorAll<HTMLElement>("h2, h3")
      );
      const list: TocItem[] = headings
        .map((h) => ({
          id: h.id || slugify(h.textContent || ""),
          text: (h.textContent || "").trim(),
          depth: (h.tagName.toLowerCase() === "h3" ? 3 : 2) as 2 | 3,
        }))
        .filter((i) => i.id && i.text);
      // If any heading is missing id (shouldn't happen with rehype-slug), set it
      for (const h of headings) {
        if (!h.id) h.id = slugify(h.textContent || "");
      }
      setItems(list);
    }

    build();
    const article = document.querySelector("article");
    const mo = article ? new MutationObserver(() => build()) : undefined;
    if (article && mo) mo.observe(article, { childList: true, subtree: true });
    return () => mo?.disconnect();
  }, [markdown]);

  useEffect(() => {
    if (items.length === 0) return;
    const header = document.querySelector<HTMLElement>(".app-topnav");
    const headerHeight = header?.offsetHeight ?? 0;
    const topMargin = -(headerHeight + 16); // adjust highlight threshold for sticky header
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) =>
              (a.target as HTMLElement).offsetTop -
              (b.target as HTMLElement).offsetTop
          );
        if (visible[0]) setActive((visible[0].target as HTMLElement).id);
      },
      { rootMargin: `${topMargin}px 0px -55% 0px`, threshold: [0, 1] }
    );
    const elements: HTMLElement[] = [];
    for (const it of items) {
      const el = document.getElementById(it.id);
      if (el) {
        elements.push(el);
        observer.observe(el);
      }
    }
    return () => {
      for (const el of elements) observer.unobserve(el);
      observer.disconnect();
    };
  }, [items]);

  // Initialize active based on URL hash (e.g., when clicking a TOC link)
  useEffect(() => {
    const hash =
      typeof window !== "undefined"
        ? window.location.hash.replace(/^#/, "")
        : "";
    if (hash && items.some((i) => i.id === hash)) {
      setActive(hash);
    }
    function onHash() {
      const h = window.location.hash.replace(/^#/, "");
      if (h && items.some((i) => i.id === h)) setActive(h);
    }
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [items]);

  if (items.length === 0) return null;

  return (
    <aside className="sticky top-16 hidden max-h-[calc(100svh-7rem)] overflow-y-auto text-sm lg:block">
      <div className="mb-2 font-semibold text-zinc-600">On this page</div>
      <ul className="space-y-1">
        {items.map((it) => (
          <li key={it.id} className={it.depth === 3 ? "pl-4" : undefined}>
            <a
              href={`#${it.id}`}
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById(it.id);
                if (el) {
                  const header =
                    document.querySelector<HTMLElement>(".app-topnav");
                  const headerHeight = header?.offsetHeight ?? 0;
                  const rect = el.getBoundingClientRect();
                  const currentY = window.scrollY;
                  const targetY = currentY + rect.top;
                  const goingUp = targetY < currentY;
                  const visibleHeader = getVisibleHeaderHeight(header);
                  const offset = (goingUp ? headerHeight : visibleHeader) + 12;
                  window.scrollTo({
                    top: targetY - offset,
                    behavior: "smooth",
                  });
                  setActive(it.id);
                  // Update hash without default jump
                  history.replaceState(null, "", `#${it.id}`);
                }
              }}
              className={
                "block rounded-md px-2 py-1 hover:bg-zinc-50 dark:hover:bg-zinc-900 " +
                (active === it.id ? "text-primary" : "")
              }
            >
              {it.text}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}

function getVisibleHeaderHeight(header?: HTMLElement | null): number {
  if (!header) return 0;
  const r = header.getBoundingClientRect();
  const viewportTop = 0;
  const viewportBottom = window.innerHeight;
  const visible = Math.max(
    0,
    Math.min(r.bottom, viewportBottom) - Math.max(r.top, viewportTop)
  );
  return Math.min(visible, r.height);
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
