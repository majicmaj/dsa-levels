import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { lessonsIndex, type Lesson } from "@/content/loadLessons";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { compareLessons } from "@/lib/utils";

export function Sidebar() {
  const location = useLocation();

  const { topicsAlpha, levelsAsc, byLevel } = useMemo(() => {
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
    return { topicsAlpha, levelsAsc, byLevel };
  }, []);

  return (
    <aside className="hidden lg:block">
      <div className="sticky top-24">
        <Card>
          <CardHeader>
            <h2 className="font-display text-xl">Browse</h2>
          </CardHeader>
          <CardContent>
            <div>
              <h3 className="mb-2 text-sm font-semibold text-zinc-600">
                Topics
              </h3>
              <ul className="space-y-1">
                {topicsAlpha.map(([t, count]) => {
                  const href = `/topic/${t}`;
                  const current = getCurrentLesson(location.pathname);
                  const active =
                    location.pathname.startsWith(href) ||
                    current?.meta.topic === t;
                  // lessons list hidden for now to match current design
                  return (
                    <li key={t}>
                      <Link
                        to={href}
                        className={
                          "flex items-center justify-between rounded-lg border px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900 " +
                          (active ? "border-primary/50" : "")
                        }
                      >
                        <span>{capitalize(t)}</span>
                        <span className="text-xs text-zinc-500">{count}</span>
                      </Link>
                      {/* {active && lessons.length ? (
                        <ul className="mt-1 space-y-1 border-l pl-3">
                          {lessons.map((l) => {
                            const isActive = current?.meta.id === l.meta.id;
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
                                  title={`${capitalize(l.meta.topic)} · L${
                                    l.meta.level
                                  }`}
                                >
                                  {l.meta.title}
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      ) : null} */}
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="mt-6">
              <h3 className="mb-2 text-sm font-semibold text-zinc-600">
                Levels
              </h3>
              <ul className="grid grid-cols-5 gap-2">
                {levelsAsc.map(([lvl, count]) => {
                  const href = `/levels/${lvl}`;
                  const current = getCurrentLesson(location.pathname);
                  const active =
                    location.pathname.startsWith(href) ||
                    current?.meta.level === lvl;
                  return (
                    <li key={lvl}>
                      <Link
                        to={href}
                        title={`${count} lesson(s)`}
                        className={
                          "flex items-center justify-center rounded-lg border px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900 " +
                          (active ? "border-primary/50" : "")
                        }
                      >
                        L{lvl}
                      </Link>
                    </li>
                  );
                })}
              </ul>
              {(() => {
                const current = getCurrentLesson(location.pathname);
                const routeLevel =
                  location.pathname.match(/^\/levels\/(\d+)/)?.[1];
                const showLevel = routeLevel
                  ? Number(routeLevel)
                  : current?.meta.level;
                if (!showLevel) return null;
                const items = byLevel.get(showLevel) ?? [];
                return items.length ? (
                  <ul className="mt-3 space-y-1 border-l pl-3">
                    {items.map((l) => {
                      const isActive = current?.meta.id === l.meta.id;
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
                            title={`${capitalize(l.meta.topic)} · L${
                              l.meta.level
                            }`}
                          >
                            {capitalize(l.meta.topic)} — {l.meta.title}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                ) : null;
              })()}
            </div>
          </CardContent>
        </Card>
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
