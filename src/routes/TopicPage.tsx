import { Link, useParams } from "react-router-dom";
import { lessonsIndex } from "@/content/loadLessons";

export default function TopicPage() {
  const { topic = "" } = useParams<{ topic: string }>();

  const lessons = lessonsIndex
    .filter((l) => l.meta.topic.toLowerCase() === topic.toLowerCase())
    .sort(
      (a, b) =>
        a.meta.level - b.meta.level || a.meta.title.localeCompare(b.meta.title)
    );

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

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <header className="mb-8">
        <h1 className="font-display text-3xl">{prettyTopic}</h1>
        <p className="text-zinc-600">
          Level 1 → 5 journey · {lessons.length} lessons
        </p>
      </header>

      <ul className="grid gap-4 sm:grid-cols-2">
        {lessons.map((l) => (
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
            </div>

            <h3 className="mt-3 text-lg font-semibold">
              <Link className="hover:underline" to={`/lesson/${l.meta.id}`}>
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
        ))}
      </ul>
    </div>
  );
}

function capitalize(s: string) {
  return s.slice(0, 1).toUpperCase() + s.slice(1);
}
