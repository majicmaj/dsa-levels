import { Link, useParams } from "react-router-dom";
import { useMemo } from "react";
import { lessonsIndex } from "@/content/loadLessons";
import { compareLessons } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

export default function TopicPage() {
  const { topic = "" } = useParams<{ topic: string }>();
  const completed = useMemo(() => getCompleted(), []);

  const lessons = lessonsIndex
    .filter((l) => l.meta.topic.toLowerCase() === topic.toLowerCase())
    .sort(compareLessons);

  if (lessons.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="font-display text-3xl">No lessons for “{topic}” yet</h1>
        <p className="mt-2 text-zinc-600">Check back soon.</p>
        <Link to="/" className="mt-6 inline-block underline">
          ← Back
        </Link>
      </div>
    );
  }

  const prettyTopic = capitalize(topic);
  const byLevel = groupBy(lessons, (l) => l.meta.level);
  const sortedLevels = Object.keys(byLevel)
    .map((n) => Number(n))
    .sort((a, b) => a - b);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <header className="mb-8">
        <h1 className="font-display text-3xl">{prettyTopic}</h1>
        <p className="text-zinc-600">
          Level 1 → 5 journey · {lessons.length} lessons
        </p>
      </header>

      <div className="space-y-10">
        {sortedLevels.map((lvl) => (
          <section key={lvl}>
            <h2 className="font-display text-2xl mb-3">Level {lvl}</h2>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {byLevel[lvl].map((l) => {
                const done = completed.has(l.meta.id);
                return (
                  <li
                    key={l.meta.id}
                    className="rounded-xl border bg-card text-card-foreground p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-2">
                        <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs text-accent-foreground">
                          L{l.meta.level}
                        </span>
                        <span className="text-sm text-zinc-500">
                          {l.meta.est_minutes ?? 15}m
                        </span>
                      </span>
                      {done ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                          <CheckCircle2 className="h-4 w-4" />
                          Done
                        </span>
                      ) : null}
                    </div>
                    <h3 className="mt-3 text-lg font-semibold">
                      <Link
                        className="hover:underline"
                        to={`/lesson/${l.meta.id}`}
                      >
                        {l.meta.title}
                      </Link>
                    </h3>
                    {l.meta.tags?.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {l.meta.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border px-2 py-0.5 text-xs text-zinc-600"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

function capitalize(s: string) {
  return s.slice(0, 1).toUpperCase() + s.slice(1);
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

const KEY = "progress.completedIds";
function getCompleted(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    return new Set(JSON.parse(localStorage.getItem(KEY) || "[]"));
  } catch {
    return new Set();
  }
}
