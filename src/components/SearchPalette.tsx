import { useCallback, useEffect, useMemo, useState } from "react";
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
import { toggleZen, isZen } from "@/lib/zen";
import { ChevronDown } from "lucide-react";
import { Button } from "./ui/button";

export function SearchPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"all" | "title" | "content" | "tag">("all");
  const [sectionsOpen, setSectionsOpen] = useState({
    tags: true,
    titles: true,
    contents: true,
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [zenState, setZenState] = useState<boolean>(() => isZen());
  const [isDark, setIsDark] = useState<boolean>(() =>
    typeof document !== "undefined"
      ? document.documentElement.classList.contains("dark")
      : false
  );
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
      setZenState(isZen());
    }
    function onToggleTheme() {
      const root = document.documentElement;
      const next = !root.classList.contains("dark");
      root.classList.toggle("dark", next);
      try {
        localStorage.setItem("theme", next ? "dark" : "light");
      } catch {
        /* ignore */
      }
      setIsDark(next);
    }
    function onZenChanged() {
      setZenState(isZen());
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("open-search-palette", onOpen as EventListener);
    window.addEventListener("toggle-zen", onToggleZen as EventListener);
    window.addEventListener("toggle-theme", onToggleTheme as EventListener);
    window.addEventListener("zen-changed", onZenChanged as EventListener);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(
        "open-search-palette",
        onOpen as EventListener
      );
      window.removeEventListener("toggle-zen", onToggleZen as EventListener);
      window.removeEventListener(
        "toggle-theme",
        onToggleTheme as EventListener
      );
      window.removeEventListener("zen-changed", onZenChanged as EventListener);
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
    const qRaw = tagMode ? trimmed.slice(1) : trimmed;
    const q = qRaw.toLowerCase();

    // Helper: unique by lesson id
    const uniq = (xs: typeof lessonsIndex) => {
      const seen = new Set<string>();
      const out: typeof lessonsIndex = [];
      for (const l of xs) {
        if (!seen.has(l.meta.id)) {
          seen.add(l.meta.id);
          out.push(l);
        }
      }
      return out;
    };

    // Detect topic token in the query (arrays|strings|objects|numbers|set|map)
    const allTopics = Array.from(
      new Set(lessonsIndex.map((l) => l.meta.topic))
    );
    const topicToken = allTopics.find((t) =>
      new RegExp(`(^|\\b)${t}(\\b|$)`, "i").test(q)
    );

    // Detect lesson code pattern like "2.1"
    const codeMatch = q.match(/\b(\d+)\.(\d+)\b/);
    const codeString = codeMatch
      ? `${parseInt(codeMatch[1], 10)}.${parseInt(codeMatch[2], 10)}`
      : null;

    const lessonCodeOf = (l: (typeof lessonsIndex)[number]) => {
      const val = l.meta.lesson;
      return val == null ? null : String(val);
    };

    let titleMatches =
      tagMode || mode === "content"
        ? []
        : lessonsIndex.filter((l) => l.meta.title.toLowerCase().includes(q));

    // Topic-name driven matches
    let topicMatches: typeof lessonsIndex = [];
    if (
      !tagMode &&
      (mode === "all" || mode === "title") &&
      topicToken &&
      !codeString
    ) {
      topicMatches = lessonsIndex.filter(
        (l) => l.meta.topic.toLowerCase() === topicToken.toLowerCase()
      );
    }

    // Lesson code matches (e.g., "2.1" or combined "Arrays 2.1")
    let codeMatches: typeof lessonsIndex = [];
    if (!tagMode && (mode === "all" || mode === "title") && codeString) {
      codeMatches = lessonsIndex.filter((l) => {
        const lessonStr = lessonCodeOf(l);
        if (!lessonStr) return false;
        if (topicToken)
          return (
            l.meta.topic.toLowerCase() === topicToken.toLowerCase() &&
            lessonStr === codeString
          );
        return lessonStr === codeString;
      });
    }

    // Merge: prioritize code matches first; then title, then broad topic matches
    titleMatches = uniq([
      ...(codeMatches ?? []),
      ...titleMatches,
      ...topicMatches,
    ]);

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

  const onSelect = useCallback(
    (id: string) => {
      setOpen(false);
      setQuery("");
      navigate(`/lesson/${id}`);
    },
    [navigate]
  );

  const onSelectContent = useCallback(
    (id: string) => {
      setOpen(false);
      setQuery("");
      const hash = anchors?.[id];
      if (hash) navigate(`/lesson/${id}#${hash}`);
      else navigate(`/lesson/${id}`);
    },
    [navigate, anchors]
  );

  function slugify(s: string): string {
    return s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  // Build a flat list of visible results in display order for keyboard nav
  type ResultItem = { kind: "tag" | "title" | "content"; id: string };
  const visibleResults: ResultItem[] = useMemo(() => {
    const list: ResultItem[] = [];
    if ((mode === "all" || mode === "tag") && sectionsOpen.tags) {
      for (const l of tagMatches) list.push({ kind: "tag", id: l.meta.id });
    }
    if ((mode === "all" || mode === "title") && sectionsOpen.titles) {
      for (const l of titleMatches) list.push({ kind: "title", id: l.meta.id });
    }
    if ((mode === "all" || mode === "content") && sectionsOpen.contents) {
      for (const l of contentMatches)
        list.push({ kind: "content", id: l.meta.id });
    }
    return list;
  }, [mode, sectionsOpen, tagMatches, titleMatches, contentMatches]);

  // Keyboard navigation bindings when palette is open
  useEffect(() => {
    if (!open) return;
    function onNavKey(e: KeyboardEvent) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (visibleResults.length === 0) return;
        setSelectedIndex((i) => Math.min(visibleResults.length - 1, i + 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (visibleResults.length === 0) return;
        setSelectedIndex((i) => Math.max(0, i - 1));
      } else if (e.key === "Enter") {
        if (visibleResults.length === 0) return;
        e.preventDefault();
        const sel = visibleResults[selectedIndex];
        if (!sel) return;
        if (sel.kind === "content") onSelectContent(sel.id);
        else onSelect(sel.id);
      } else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        const order: Array<typeof mode> = ["all", "title", "content", "tag"];
        const idx = order.indexOf(mode);
        const nextIdx =
          e.key === "ArrowRight"
            ? (idx + 1) % order.length
            : (idx + order.length - 1) % order.length;
        setMode(order[nextIdx]);
      }
    }
    window.addEventListener("keydown", onNavKey);
    return () => window.removeEventListener("keydown", onNavKey);
  }, [open, visibleResults, selectedIndex, mode, onSelect, onSelectContent]);

  // Reset selection to first item whenever results change
  useEffect(() => {
    if (visibleResults.length > 0) setSelectedIndex(0);
    else setSelectedIndex(0);
  }, [visibleResults.length]);

  // Map for quick lookup of item index by kind+id
  const resultIndexByKey = useMemo(() => {
    const m = new Map<string, number>();
    visibleResults.forEach((r, i) => m.set(`${r.kind}:${r.id}`, i));
    return m;
  }, [visibleResults]);

  // Ensure selected item stays in view
  useEffect(() => {
    const el = document.querySelector<HTMLElement>(
      `[data-result-index="${selectedIndex}"]`
    );
    if (el) el.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  // Ensure selected item stays in view
  useEffect(() => {
    const el = document.querySelector<HTMLElement>(
      `[data-result-index="${selectedIndex}"]`
    );
    if (el) el.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

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
                <Button
                  key={key}
                  onClick={() => setMode(key)}
                  variant={mode === key ? "default" : "ghost"}
                >
                  {label}
                </Button>
              ))}
            </div>
            {(() => {
              const q = query.trim().toLowerCase();
              const actions = [
                "toggle zen mode",
                "zen",
                "toggle theme",
                "theme",
                "dark",
                "light",
              ];
              const show = q === "" || actions.some((a) => a.includes(q));
              if (!show) return null;
              return (
                <CommandGroup heading="Actions">
                  <CommandItem
                    onClick={() =>
                      window.dispatchEvent(new CustomEvent("toggle-zen"))
                    }
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className="truncate">Zen Mode</span>
                      <span
                        className={
                          "inline-flex h-5 w-9 items-center rounded-full border px-0.5 " +
                          (zenState
                            ? "bg-emerald-500/20 border-emerald-500"
                            : "bg-zinc-100 dark:bg-zinc-900")
                        }
                      >
                        <span
                          className={
                            "h-4 w-4 rounded-full bg-current transition-transform " +
                            (zenState
                              ? "translate-x-4 text-emerald-600"
                              : "translate-x-0 text-zinc-400")
                          }
                        />
                      </span>
                    </div>
                  </CommandItem>
                  <CommandItem
                    onClick={() =>
                      window.dispatchEvent(new CustomEvent("toggle-theme"))
                    }
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className="truncate">Theme</span>
                      <span
                        className={
                          "inline-flex h-5 w-9 items-center rounded-full border px-0.5 " +
                          (isDark
                            ? "bg-blue-500/20 border-blue-500"
                            : "bg-zinc-100 dark:bg-zinc-900")
                        }
                      >
                        <span
                          className={
                            "h-4 w-4 rounded-full bg-current transition-transform " +
                            (isDark
                              ? "translate-x-4 text-blue-600"
                              : "translate-x-0 text-zinc-400")
                          }
                        />
                      </span>
                    </div>
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
                      tagMatches.map((l) => {
                        const idx =
                          resultIndexByKey.get(`tag:${l.meta.id}`) ?? -1;
                        const selected = idx === selectedIndex;
                        return (
                          <CommandItem
                            key={l.meta.id}
                            data-result-index={idx}
                            aria-selected={selected}
                            className={
                              selected ? "bg-zinc-100 dark:bg-zinc-900" : ""
                            }
                            onClick={() => onSelect(l.meta.id)}
                          >
                            <div className="flex w-full items-center gap-2">
                              <span
                                className={
                                  "h-2 w-2 rounded-full " +
                                  (selected
                                    ? "bg-primary"
                                    : "bg-zinc-300 dark:bg-zinc-700")
                                }
                                aria-hidden="true"
                              />
                              <div className="flex w-full items-center justify-between">
                                <span className="truncate">{l.meta.title}</span>
                                <span className="text-xs text-zinc-500">
                                  {l.meta.topic} · L{l.meta.level}
                                </span>
                              </div>
                            </div>
                          </CommandItem>
                        );
                      })
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
                      titleMatches.map((l) => {
                        const idx =
                          resultIndexByKey.get(`title:${l.meta.id}`) ?? -1;
                        const selected = idx === selectedIndex;
                        return (
                          <CommandItem
                            key={l.meta.id}
                            data-result-index={idx}
                            aria-selected={selected}
                            className={
                              selected ? "bg-zinc-100 dark:bg-zinc-900" : ""
                            }
                            onClick={() => onSelect(l.meta.id)}
                          >
                            <div className="flex w-full items-center gap-2">
                              <span
                                className={
                                  "h-2 w-2 rounded-full " +
                                  (selected
                                    ? "bg-primary"
                                    : "bg-zinc-300 dark:bg-zinc-700")
                                }
                                aria-hidden="true"
                              />
                              <div className="flex w-full items-center justify-between">
                                <span className="truncate">{l.meta.title}</span>
                                <span className="text-xs text-zinc-500">
                                  {l.meta.topic} · L{l.meta.level}
                                </span>
                              </div>
                            </div>
                          </CommandItem>
                        );
                      })
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
                      contentMatches.map((l) => {
                        const idx =
                          resultIndexByKey.get(`content:${l.meta.id}`) ?? -1;
                        const selected = idx === selectedIndex;
                        return (
                          <CommandItem
                            key={l.meta.id}
                            data-result-index={idx}
                            aria-selected={selected}
                            className={
                              selected ? "bg-zinc-100 dark:bg-zinc-900" : ""
                            }
                            onClick={() => onSelectContent(l.meta.id)}
                          >
                            <div className="flex w-full items-start gap-2">
                              <span
                                className={
                                  "mt-1 h-2 w-2 rounded-full " +
                                  (selected
                                    ? "bg-primary"
                                    : "bg-zinc-300 dark:bg-zinc-700")
                                }
                                aria-hidden="true"
                              />
                              <div className="w-full">
                                <div className="flex items-center justify-between">
                                  <span className="truncate">
                                    {l.meta.title}
                                  </span>
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
                            </div>
                          </CommandItem>
                        );
                      })
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
