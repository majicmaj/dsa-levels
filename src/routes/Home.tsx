import { useMemo } from "react";
import { Link } from "react-router-dom";
import { lessonsIndex } from "@/content/loadLessons";
import { Rocket, BookOpen, ListChecks, ChevronRight, Play } from "lucide-react";

const PROGRESS_KEY = "progress.completedIds";

function getCompletedIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY) || "[]");
  } catch {
    return [];
  }
}

function Home() {
  const {
    topicsAlpha, // [topic, count]
    levelsAsc, // [level, count]
    minLevel,
    topTopic,
    nextLesson,
    completedCount,
    totalLessons,
    totalTopics,
    totalLevels,
    recommended,
  } = useMemo(() => {
    // Topic + level counts
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

    const minLevel = levelsAsc.length ? levelsAsc[0][0] : null;

    // Featured topic = most lessons (break ties alphabetically)
    const topicsByCount = Array.from(topicCounts.entries()).sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0].localeCompare(b[0]);
    });
    const topTopic = topicsByCount[0]?.[0] ?? null;

    // Progress-aware recommendations
    const completedList = getCompletedIds();
    const completed = new Set(completedList);
    const unlocked = lessonsIndex.filter((l) => {
      const prereqs = l.meta.prereqs ?? [];
      const allMet = prereqs.every((id) => completed.has(id));
      return allMet && !completed.has(l.meta.id);
    });
    unlocked.sort(
      (a, b) =>
        a.meta.level - b.meta.level ||
        a.meta.topic.localeCompare(b.meta.topic) ||
        a.meta.title.localeCompare(b.meta.title)
    );
    const nextLesson = unlocked[0];
    const recommended = (unlocked.length ? unlocked : lessonsIndex)
      .slice(0, 3)
      .map((l) => l);

    return {
      topicsAlpha,
      levelsAsc,
      minLevel,
      topTopic,
      nextLesson,
      completedCount: completed.size,
      totalLessons: lessonsIndex.length,
      totalTopics: topicsAlpha.length,
      totalLevels: levelsAsc.length,
      recommended,
    };
  }, []);

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border bg-card p-7 sm:p-10">
        <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background:radial-gradient(60rem_60rem_at_10%_-10%,theme(colors.primary)_20%,transparent_60%)] dark:opacity-20" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1 text-xs">
            <span className="inline-flex h-2 w-2 rounded-full bg-primary" />
            <span className="text-zinc-600 dark:text-zinc-300">
              Interactive lessons · Clear mental models
            </span>
          </div>
          <h1 className="mt-4 font-display text-3xl sm:text-4xl">
            Master JS/TS data structures from first principles
          </h1>
          <p className="mt-2 max-w-prose text-zinc-600 dark:text-zinc-300">
            Learn arrays, objects, strings, numbers, sets, and maps. Compose
            methods, understand complexity, and solve real problems.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              to={minLevel ? `/levels/${minLevel}` : "/"}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:opacity-90"
            >
              <Rocket className="h-4 w-4" /> Start at Level {minLevel ?? "—"}
            </Link>
            {nextLesson ? (
              <Link
                to={`/lesson/${nextLesson.meta.id}`}
                className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-900"
              >
                <Play className="h-4 w-4" /> Continue ·{" "}
                {capitalize(nextLesson.meta.topic)} · L{nextLesson.meta.level}
              </Link>
            ) : null}
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative z-10 mt-8 grid grid-cols-2 gap-3 rounded-xl border bg-background/70 p-4 sm:grid-cols-4">
          <StatTile
            label="Lessons"
            value={totalLessons}
            icon={<BookOpen className="h-4 w-4" />}
          />
          <StatTile
            label="Topics"
            value={totalTopics}
            icon={<ChevronRight className="h-4 w-4" />}
          />
          <StatTile
            label="Levels"
            value={totalLevels}
            icon={<ChevronRight className="h-4 w-4" />}
          />
          <StatTile
            label="Completed"
            value={completedCount}
            icon={<ListChecks className="h-4 w-4" />}
          />
        </div>
      </section>

      {/* Recommendations */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl">Recommended next</h2>
          {topTopic ? (
            <Link
              to={`/topic/${topTopic}`}
              className="text-sm underline opacity-80 hover:opacity-100"
            >
              Deep-dive {capitalize(topTopic)} →
            </Link>
          ) : null}
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recommended.map((l) => (
            <li key={l.meta.id} className="rounded-xl border bg-card p-4">
              <div className="flex items-center justify-between text-xs text-zinc-600">
                <span className="inline-flex items-center gap-2">
                  <span className="rounded-full bg-accent/15 px-2 py-0.5 text-accent-foreground">
                    L{l.meta.level}
                  </span>
                  <span>{capitalize(l.meta.topic)}</span>
                </span>
                <span>{formatMinutes(l.meta.est_minutes ?? 15)}</span>
              </div>
              <h3 className="mt-3 font-semibold">
                <Link className="hover:underline" to={`/lesson/${l.meta.id}`}>
                  {l.meta.title}
                </Link>
              </h3>
              {l.meta.tags?.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {l.meta.tags.slice(0, 3).map((tag) => (
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
          ))}
        </ul>
      </section>

      {/* Browsing */}
      <section className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="font-display text-xl">Browse by Topic</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {topicsAlpha.map(([t, count]) => (
              <li key={t}>
                <Link
                  className="flex items-center justify-between rounded-lg border px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  to={`/topic/${t}`}
                >
                  <span>{capitalize(t)}</span>
                  <span className="text-xs text-zinc-500">{count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="font-display text-xl">Browse by Level</h2>
          <ul className="mt-3 grid grid-cols-5 gap-2">
            {levelsAsc.map(([lvl, count]) => (
              <li key={lvl}>
                <Link
                  className="flex items-center justify-center rounded-lg border px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  to={`/levels/${lvl}`}
                  title={`${count} lesson(s)`}
                >
                  L{lvl}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

export default Home;

function capitalize(s: string) {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

function formatMinutes(m: number) {
  return `${m}m`;
}

function StatTile({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2">
      <div className="grid h-8 w-8 place-items-center rounded-md bg-accent/30 text-accent-foreground">
        {icon}
      </div>
      <div>
        <div className="text-xs text-zinc-500">{label}</div>
        <div className="text-lg font-semibold">{value}</div>
      </div>
    </div>
  );
}
