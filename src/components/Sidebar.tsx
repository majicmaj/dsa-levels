import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { lessonsIndex } from "@/content/loadLessons";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function Sidebar() {
  const location = useLocation();

  const { topicsAlpha, levelsAsc } = useMemo(() => {
    const topicCounts = new Map<string, number>();
    const levelCounts = new Map<number, number>();
    for (const l of lessonsIndex) {
      topicCounts.set(l.meta.topic, (topicCounts.get(l.meta.topic) ?? 0) + 1);
      levelCounts.set(l.meta.level, (levelCounts.get(l.meta.level) ?? 0) + 1);
    }
    const topicsAlpha = Array.from(topicCounts.entries()).sort((a, b) =>
      a[0].localeCompare(b[0])
    );
    const levelsAsc = Array.from(levelCounts.entries()).sort(
      (a, b) => a[0] - b[0]
    );
    return { topicsAlpha, levelsAsc };
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
                  const active = location.pathname.startsWith(href);
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
                  const active = location.pathname.startsWith(href);
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
