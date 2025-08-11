import { Link, useParams } from "react-router-dom";
import { useMemo } from "react";
import { lessonsIndex } from "@/content/loadLessons";
import { compareLessons } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

export default function LevelPage() {
  const { level = "1" } = useParams<{ level: string }>();
  const levelNum = Number(level);
  const completed = useMemo(() => getCompleted(), []);

  const lessons = lessonsIndex
    .filter((l) => l.meta.level === levelNum)
    .sort(
      (a, b) => a.meta.topic.localeCompare(b.meta.topic) || compareLessons(a, b)
    );

  const topics = groupBy(lessons, (l) => l.meta.topic);
  const sortedTopics = Object.keys(topics).sort((a, b) => a.localeCompare(b));

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-8">
        <h1 className="font-display text-3xl">Level {levelNum}</h1>
        <p className="text-zinc-600">All topics at this depth</p>
      </header>

      {Object.keys(topics).length === 0 ? (
        <div>
          <p className="text-zinc-600">No lessons at this level yet.</p>
          <Link to="/" className="mt-6 inline-block underline">
            ← Back
          </Link>
        </div>
      ) : (
        <div className="space-y-10">
          {sortedTopics.map((topic) => (
            <section key={topic}>
              <h2 className="font-display text-2xl mb-3">
                {capitalize(topic)}
              </h2>
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {topics[topic].map((l) => {
                  const done = completed.has(l.meta.id);
                  return (
                    <li
                      key={l.meta.id}
                      className="rounded-xl border bg-card text-card-foreground p-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs text-accent-foreground">
                          {capitalize(l.meta.topic)}
                        </span>
                        <span className="text-xs text-zinc-500">
                          {l.meta.est_minutes ?? 15}m
                        </span>
                      </div>
                      <h3 className="mt-3 font-semibold">
                        <Link
                          className="hover:underline"
                          to={`/lesson/${l.meta.id}`}
                        >
                          {l.meta.title}
                        </Link>
                      </h3>
                      {done ? (
                        <div className="mt-2 inline-flex items-center gap-1 text-xs text-emerald-600">
                          <CheckCircle2 className="h-4 w-4" /> Done
                        </div>
                      ) : null}
                      {l.meta.prereqs?.length ? (
                        <p className="mt-2 text-xs text-zinc-600">
                          {l.meta.prereqs.length} prereq(s)
                        </p>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function groupBy<T, K extends string | number>(
  arr: T[],
  key: (t: T) => K
): Record<K, T[]> {
  return arr.reduce((acc, item) => {
    const k = key(item);
    (acc[k] ||= []).push(item);
    return acc;
  }, {} as Record<K, T[]>);
}

function capitalize(s: string) {
  return s.slice(0, 1).toUpperCase() + s.slice(1);
}

const KEY = "progress.completedIds";
function getCompleted(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    return new Set(JSON.parse(localStorage.getItem(KEY) || "[]"));
  } catch {
    return new Set();
  }
}
