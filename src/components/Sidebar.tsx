import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { lessonsIndex, type Lesson } from "@/content/loadLessons";
import { cn, compareLessons } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Sidebar() {
  const location = useLocation();
  const current = getCurrentLesson(location.pathname);
  const [mode, setMode] = useState<"topic" | "level">(() =>
    location.pathname.startsWith("/levels") ? "level" : "topic"
  );
  const [expandedTopTopics, setExpandedTopTopics] = useState<Set<string>>(
    () => new Set(current ? [current.meta.topic] : [])
  );
  const [expandedTopLevels, setExpandedTopLevels] = useState<Set<number>>(
    () => new Set(current ? [current.meta.level] : [])
  );
  const [expandedSubs, setExpandedSubs] = useState<Set<string>>(
    () => new Set()
  );

  const { topicsAlpha, levelsAsc, byLevel, byTopic } = useMemo(() => {
    const topicCounts = new Map<string, number>();
    const levelCounts = new Map<number, number>();
    const byTopic = new Map<string, Lesson[]>();
    const byLevel = new Map<number, Lesson[]>();
    for (const l of lessonsIndex) {
      topicCounts.set(l.meta.topic, (topicCounts.get(l.meta.topic) ?? 0) + 1);
      levelCounts.set(l.meta.level, (levelCounts.get(l.meta.level) ?? 0) + 1);
      if (!byTopic.has(l.meta.topic)) byTopic.set(l.meta.topic, []);
      byTopic.get(l.meta.topic)!.push(l);
      if (!byLevel.has(l.meta.level)) byLevel.set(l.meta.level, []);
      byLevel.get(l.meta.level)!.push(l);
    }
    const topicsAlpha = Array.from(topicCounts.entries()).sort((a, b) =>
      a[0].localeCompare(b[0])
    );
    const levelsAsc = Array.from(levelCounts.entries()).sort(
      (a, b) => a[0] - b[0]
    );
    for (const [, arr] of byTopic) arr.sort(compareLessons);
    for (const [, arr] of byLevel)
      arr.sort(
        (a, b) =>
          a.meta.topic.localeCompare(b.meta.topic) || compareLessons(a, b)
      );
    return { topicsAlpha, levelsAsc, byLevel, byTopic };
  }, []);

  function computeBulkState() {
    if (mode === "topic") {
      const topicKeys = topicsAlpha.map(([t]) => t);
      const allExpanded = topicKeys.every((t) => expandedTopTopics.has(t));
      const expandAll = () => setExpandedTopTopics(new Set<string>(topicKeys));
      const collapseAll = () => setExpandedTopTopics(new Set<string>());
      return { allExpanded, expandAll, collapseAll };
    } else {
      const levelKeys = levelsAsc.map(([lvl]) => lvl);
      const allExpanded = levelKeys.every((l) => expandedTopLevels.has(l));
      const expandAll = () => setExpandedTopLevels(new Set<number>(levelKeys));
      const collapseAll = () => setExpandedTopLevels(new Set<number>());
      return { allExpanded, expandAll, collapseAll };
    }
  }

  return (
    <aside className="app-sidebar hidden lg:block">
      <div className="sticky top-16 max-h-[calc(100svh-7rem)] overflow-y-auto pr-1">
        {/* Toggle */}
        <div className="mb-3 flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => {
              const { allExpanded, expandAll, collapseAll } =
                computeBulkState();
              if (allExpanded) collapseAll();
              else expandAll();
            }}
          >
            <ChevronDown
              className={
                "h-4 w-4 transition-transform " +
                (computeBulkState().allExpanded ? "rotate-0" : "-rotate-90")
              }
            />
          </Button>
          <div className="w-full grid grid-cols-2 rounded-lg border p-1 text-sm">
            <Button
              variant={mode === "topic" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("topic")}
              className="rounded-md"
            >
              By Topic
            </Button>
            <Button
              variant={mode === "level" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("level")}
              className="ml-1 rounded-md"
            >
              By Level
            </Button>
          </div>
        </div>

        {mode === "topic" ? (
          <div className="mt-2 space-y-3">
            {topicsAlpha.map(([t, count]) => {
              const href = `/topic/${t}`;
              const isActiveTopic =
                current?.meta.topic === t || location.pathname.startsWith(href);
              const isExpanded = expandedTopTopics.has(t);
              const topicLessons = (byTopic.get(t) ?? []).slice();
              // Group by level
              const byLvl = new Map<number, Lesson[]>();
              for (const l of topicLessons) {
                (
                  byLvl.get(l.meta.level) ??
                  byLvl.set(l.meta.level, []).get(l.meta.level)!
                ).push(l);
              }
              const levels = Array.from(byLvl.keys()).sort((a, b) => a - b);
              const activeLessonInTopic = topicLessons.find(
                (l) => l.meta.id === current?.meta.id
              );

              return (
                <section key={t}>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Toggle ${t}`}
                      onClick={() =>
                        setExpandedTopTopics((prev) => {
                          const copy = new Set(prev);
                          if (copy.has(t)) copy.delete(t);
                          else copy.add(t);
                          return copy;
                        })
                      }
                    >
                      <ChevronDown
                        className={
                          "h-4 w-4 transition-transform " +
                          (isExpanded ? "rotate-0" : "-rotate-90")
                        }
                      />
                    </Button>
                    <Link
                      to={href}
                      className={
                        "flex flex-1 items-center justify-between rounded-lg border px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900 " +
                        (isActiveTopic ? "border-primary/50" : "")
                      }
                    >
                      <span>{capitalize(t)}</span>
                      <span className="text-xs text-zinc-500">{count}</span>
                    </Link>
                  </div>

                  {isExpanded ? (
                    <div className="mt-2 space-y-2 border-l pl-3">
                      {levels.map((lvl) => {
                        const subKey = `${t}:${lvl}`;
                        const subOpen = expandedSubs.has(subKey);
                        const ls = byLvl.get(lvl) ?? [];
                        const activeInSub = ls.some(
                          (l) => l.meta.id === current?.meta.id
                        );
                        const href = `/levels/${lvl}`;
                        const isActiveLevel =
                          location.pathname.startsWith(href) ||
                          current?.meta.level === lvl;
                        return (
                          <div key={subKey}>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() =>
                                  setExpandedSubs((prev) => {
                                    const copy = new Set(prev);
                                    if (copy.has(subKey)) copy.delete(subKey);
                                    else copy.add(subKey);
                                    return copy;
                                  })
                                }
                                aria-label={`Toggle Level ${lvl}`}
                              >
                                <ChevronDown
                                  className={
                                    "h-4 w-4 transition-transform " +
                                    (subOpen ? "rotate-0" : "-rotate-90")
                                  }
                                />
                              </Button>
                              <Link
                                to={`/levels/${lvl}`}
                                className={cn(
                                  "text-xs font-semibold flex-1 border px-3 py-2 rounded-md",
                                  isActiveLevel ? "border-primary/50" : ""
                                )}
                              >
                                Level {lvl}
                              </Link>
                            </div>
                            {(subOpen || activeInSub) && (
                              <ul className="mt-1 space-y-1 border-l pl-7">
                                {ls.map((l) => {
                                  const isActive =
                                    current?.meta.id === l.meta.id;
                                  return (
                                    <li key={l.meta.id}>
                                      <Link
                                        to={`/lesson/${l.meta.id}`}
                                        className={
                                          "block rounded-md px-2 py-1 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-900 " +
                                          (isActive
                                            ? "bg-zinc-50 dark:bg-zinc-900 text-primary"
                                            : "")
                                        }
                                        title={`${capitalize(
                                          l.meta.topic
                                        )} · L${l.meta.level}`}
                                      >
                                        {l.meta.title}
                                      </Link>
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    activeLessonInTopic && (
                      <ul className="mt-2 space-y-1 border-l pl-3">
                        <li>
                          <Link
                            to={`/lesson/${activeLessonInTopic.meta.id}`}
                            className="block rounded-md px-2 py-1 text-xs bg-zinc-50 dark:bg-zinc-900 text-primary"
                          >
                            {activeLessonInTopic.meta.title}
                          </Link>
                        </li>
                      </ul>
                    )
                  )}
                </section>
              );
            })}
          </div>
        ) : (
          <div className="mt-2 space-y-3">
            {levelsAsc.map(([lvl]) => {
              const subKey = `L${lvl}`;
              const topOpen = expandedTopLevels.has(lvl);
              const ls = (byLevel.get(lvl) ?? []).slice();
              // Group by topic inside this level
              const byTop = new Map<string, Lesson[]>();
              for (const l of ls) {
                (
                  byTop.get(l.meta.topic) ??
                  byTop.set(l.meta.topic, []).get(l.meta.topic)!
                ).push(l);
              }
              const topics = Array.from(byTop.keys()).sort((a, b) =>
                a.localeCompare(b)
              );
              const activeLessonInLevel = ls.find(
                (l) => l.meta.id === current?.meta.id
              );
              const href = `/levels/${lvl}`;
              const isActiveLevel =
                location.pathname.startsWith(href) ||
                current?.meta.level === lvl;
              return (
                <section key={subKey}>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      onClick={() =>
                        setExpandedTopLevels((prev) => {
                          const copy = new Set(prev);
                          if (copy.has(lvl)) copy.delete(lvl);
                          else copy.add(lvl);
                          return copy;
                        })
                      }
                      aria-label={`Toggle Level ${lvl}`}
                    >
                      <ChevronDown
                        className={
                          "h-4 w-4 transition-transform " +
                          (topOpen ? "rotate-0" : "-rotate-90")
                        }
                      />
                    </Button>
                    <Link
                      to={`/levels/${lvl}`}
                      className={cn(
                        "flex-1 text-start rounded-lg border px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900",
                        isActiveLevel ? "border-primary/50" : ""
                      )}
                    >
                      Level {lvl}
                    </Link>
                  </div>

                  {topOpen ? (
                    <div className="mt-2 space-y-2 border-l pl-3">
                      {topics.map((t) => {
                        const subk = `${lvl}:${t}`;
                        const subOpen = expandedSubs.has(subk);
                        const tls = byTop.get(t) ?? [];
                        const activeInSub = tls.some(
                          (l) => l.meta.id === current?.meta.id
                        );
                        return (
                          <div key={subk}>
                            <div className="flex items-center gap-2">
                              <button
                                className="inline-flex h-6 w-6 items-center justify-center rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900"
                                onClick={() =>
                                  setExpandedSubs((prev) => {
                                    const copy = new Set(prev);
                                    if (copy.has(subk)) copy.delete(subk);
                                    else copy.add(subk);
                                    return copy;
                                  })
                                }
                                aria-label={`Toggle ${t}`}
                              >
                                <ChevronDown
                                  className={
                                    "h-4 w-4 transition-transform " +
                                    (subOpen ? "rotate-0" : "-rotate-90")
                                  }
                                />
                              </button>
                              <div className="text-xs font-semibold">
                                {capitalize(t)}
                              </div>
                            </div>
                            {(subOpen || activeInSub) && (
                              <ul className="mt-1 space-y-1">
                                {tls.map((l) => {
                                  const isActive =
                                    current?.meta.id === l.meta.id;
                                  return (
                                    <li key={l.meta.id}>
                                      <Link
                                        to={`/lesson/${l.meta.id}`}
                                        className={
                                          "block rounded-md px-2 py-1 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-900 " +
                                          (isActive
                                            ? "bg-zinc-50 dark:bg-zinc-900 text-primary"
                                            : "")
                                        }
                                        title={`${capitalize(
                                          l.meta.topic
                                        )} · L${l.meta.level}`}
                                      >
                                        {l.meta.title}
                                      </Link>
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    activeLessonInLevel && (
                      <ul className="mt-2 space-y-1 border-l pl-3">
                        <li>
                          <Link
                            to={`/lesson/${activeLessonInLevel.meta.id}`}
                            className="block rounded-md px-2 py-1 text-xs bg-zinc-50 dark:bg-zinc-900 text-primary"
                          >
                            {activeLessonInLevel.meta.title}
                          </Link>
                        </li>
                      </ul>
                    )
                  )}
                </section>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}

function capitalize(s: string) {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

function getCurrentLesson(pathname: string): Lesson | undefined {
  const m = pathname.match(/^\/lesson\/(.+)$/);
  if (!m) return undefined;
  const id = m[1];
  return lessonsIndex.find((l) => l.meta.id === id);
}

// Helpers for expand/collapse all within current mode
//
