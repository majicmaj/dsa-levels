import { useEffect, useMemo, useState } from "react";
import { lessonsIndex } from "@/content/loadLessons";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useNavigate } from "react-router-dom";
import { toggleZen } from "@/lib/zen";
import { ChevronDown } from "lucide-react";

export function SearchPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"all" | "title" | "content" | "tag">("all");
  const [sectionsOpen, setSectionsOpen] = useState({
    tags: true,
    titles: true,
    contents: true,
  });
  const navigate = useNavigate();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    }
    function onOpen() {
      setOpen(true);
    }
    function onToggleZen() {
      toggleZen();
      setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("open-search-palette", onOpen as EventListener);
    window.addEventListener("toggle-zen", onToggleZen as EventListener);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(
        "open-search-palette",
        onOpen as EventListener
      );
      window.removeEventListener("toggle-zen", onToggleZen as EventListener);
    };
  }, []);

  const {
    titleMatches,
    contentMatches,
    tagMatches,
    tagMode,
    snippets,
    anchors,
  } = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed)
      return {
        titleMatches: [],
        contentMatches: [],
        tagMatches: [],
        tagMode: false,
        snippets: {} as Record<string, string>,
        anchors: {} as Record<string, string>,
      };
    const tagMode = trimmed.startsWith("#") || mode === "tag";
    const q = (tagMode ? trimmed.slice(1) : trimmed).toLowerCase();

    const titleMatches =
      tagMode || mode === "content"
        ? []
        : lessonsIndex.filter((l) => l.meta.title.toLowerCase().includes(q));

    const tagMatchesAll = lessonsIndex.filter((l) => {
      const tags = (l.meta.tags ?? []).map((t) => t.toLowerCase());
      return tags.some((t) => t.includes(q));
    });
    // Avoid duplicates with title matches
    const tagMatches =
      mode === "title" || mode === "content"
        ? []
        : tagMatchesAll.filter((l) => !titleMatches.includes(l));

    const contentMatches =
      tagMode || mode === "title"
        ? []
        : lessonsIndex.filter(
            (l) =>
              !titleMatches.includes(l) &&
              !tagMatches.includes(l) &&
              l.body.toLowerCase().includes(q)
          );

    // Build simple snippets for content matches
    const snippets: Record<string, string> = {};
    const anchors: Record<string, string> = {};
    if (!tagMode) {
      for (const l of contentMatches) {
        const body = l.body.replace(/\s+/g, " ");
        const lower = body.toLowerCase();
        const idx = lower.indexOf(q);
        const start = Math.max(0, idx - 40);
        const end = Math.min(body.length, idx + q.length + 60);
        let snippet = body.slice(start, end).trim();
        if (start > 0) snippet = "… " + snippet;
        if (end < body.length) snippet = snippet + " …";
        snippets[l.meta.id] = snippet;

        // Try to derive a heading anchor near the match
        const mdLines = l.body.split(/\r?\n/);
        let headingText = "";
        let offsetChar = 0;
        for (let i = 0; i < mdLines.length; i++) {
          const line = mdLines[i];
          const lineLen = line.length + 1; // include newline
          if (offsetChar + lineLen > idx) {
            for (let j = i; j >= 0; j--) {
              const h2 = mdLines[j].match(/^##\s+(.+)/);
              const h3 = mdLines[j].match(/^###\s+(.+)/);
              if (h2 || h3) {
                headingText = (h2?.[1] || h3?.[1] || "").trim();
                break;
              }
            }
            break;
          }
          offsetChar += lineLen;
        }
        if (headingText) anchors[l.meta.id] = slugify(headingText);
      }
    }

    return {
      titleMatches,
      contentMatches,
      tagMatches,
      tagMode,
      snippets,
      anchors,
    };
  }, [query, mode]);

  function onSelect(id: string) {
    setOpen(false);
    setQuery("");
    navigate(`/lesson/${id}`);
  }

  function onSelectContent(id: string) {
    setOpen(false);
    setQuery("");
    const hash = anchors?.[id];
    if (hash) navigate(`/lesson/${id}#${hash}`);
    else navigate(`/lesson/${id}`);
  }

  function slugify(s: string): string {
    return s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <Command>
          <CommandInput
            autoFocus
            placeholder="Search lessons… (⌘/Ctrl + K)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <CommandList>
            {/* Mode toggle */}
            <div className="flex items-center gap-1 border-b px-2 py-1 text-xs">
              {(
                [
                  ["all", "All"],
                  ["title", "Title"],
                  ["content", "Content"],
                  ["tag", "Tags"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setMode(key)}
                  className={
                    "rounded-md px-2 py-1 transition-colors " +
                    (mode === key
                      ? "bg-zinc-100 dark:bg-zinc-900"
                      : "hover:bg-zinc-100 dark:hover:bg-zinc-900")
                  }
                >
                  {label}
                </button>
              ))}
            </div>
            {(() => {
              const q = query.trim().toLowerCase();
              const actions = ["toggle zen mode"];
              const show = q === "" || actions.some((a) => a.includes(q));
              if (!show) return null;
              return (
                <CommandGroup heading="Actions">
                  <CommandItem
                    onClick={() =>
                      window.dispatchEvent(new CustomEvent("toggle-zen"))
                    }
                  >
                    <span className="truncate">Toggle Zen Mode</span>
                  </CommandItem>
                </CommandGroup>
              );
            })()}
            {(mode === "all" || mode === "tag") && (
              <div>
                <div
                  className="flex cursor-pointer items-center justify-between px-2 py-1 text-[0.8rem] font-semibold text-zinc-600"
                  onClick={() =>
                    setSectionsOpen((s) => ({ ...s, tags: !s.tags }))
                  }
                >
                  <span>
                    {tagMode ? "Tag matches (#query)" : "Tag matches"}
                  </span>
                  <ChevronDown
                    className={
                      "h-4 w-4 transition-transform " +
                      (sectionsOpen.tags ? "rotate-0" : "-rotate-90")
                    }
                  />
                </div>
                {sectionsOpen.tags ? (
                  <CommandGroup>
                    {tagMatches.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-zinc-500">
                        No matches
                      </div>
                    ) : (
                      tagMatches.map((l) => (
                        <CommandItem
                          key={l.meta.id}
                          onClick={() => onSelect(l.meta.id)}
                        >
                          <span className="truncate">{l.meta.title}</span>
                          <span className="text-xs text-zinc-500">
                            {l.meta.topic} · L{l.meta.level}
                          </span>
                        </CommandItem>
                      ))
                    )}
                  </CommandGroup>
                ) : null}
              </div>
            )}
            {(mode === "all" || mode === "title") && (
              <div>
                <div
                  className="flex cursor-pointer items-center justify-between px-2 py-1 text-[0.8rem] font-semibold text-zinc-600"
                  onClick={() =>
                    setSectionsOpen((s) => ({ ...s, titles: !s.titles }))
                  }
                >
                  <span>Title matches</span>
                  <ChevronDown
                    className={
                      "h-4 w-4 transition-transform " +
                      (sectionsOpen.titles ? "rotate-0" : "-rotate-90")
                    }
                  />
                </div>
                {sectionsOpen.titles ? (
                  <CommandGroup>
                    {titleMatches.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-zinc-500">
                        No matches
                      </div>
                    ) : (
                      titleMatches.map((l) => (
                        <CommandItem
                          key={l.meta.id}
                          onClick={() => onSelect(l.meta.id)}
                        >
                          <span className="truncate">{l.meta.title}</span>
                          <span className="text-xs text-zinc-500">
                            {l.meta.topic} · L{l.meta.level}
                          </span>
                        </CommandItem>
                      ))
                    )}
                  </CommandGroup>
                ) : null}
              </div>
            )}
            {(mode === "all" || mode === "content") && (
              <div>
                <div
                  className="flex cursor-pointer items-center justify-between px-2 py-1 text-[0.8rem] font-semibold text-zinc-600"
                  onClick={() =>
                    setSectionsOpen((s) => ({ ...s, contents: !s.contents }))
                  }
                >
                  <span>Content matches</span>
                  <ChevronDown
                    className={
                      "h-4 w-4 transition-transform " +
                      (sectionsOpen.contents ? "rotate-0" : "-rotate-90")
                    }
                  />
                </div>
                {sectionsOpen.contents ? (
                  <CommandGroup>
                    {contentMatches.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-zinc-500">
                        No matches
                      </div>
                    ) : (
                      contentMatches.map((l) => (
                        <CommandItem
                          key={l.meta.id}
                          onClick={() => onSelectContent(l.meta.id)}
                        >
                          <div className="w-full">
                            <div className="flex items-center justify-between">
                              <span className="truncate">{l.meta.title}</span>
                              <span className="ml-3 shrink-0 text-xs text-zinc-500">
                                {l.meta.topic} · L{l.meta.level}
                              </span>
                            </div>
                            {snippets[l.meta.id] ? (
                              <div className="mt-1 line-clamp-2 text-xs text-zinc-500">
                                {snippets[l.meta.id]}
                              </div>
                            ) : null}
                          </div>
                        </CommandItem>
                      ))
                    )}
                  </CommandGroup>
                ) : null}
              </div>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
