import { MD } from "@/content/md";
import { lessonsIndex } from "@/content/loadLessons";
import type { Lesson } from "@/content/loadLessons";
import { Link } from "react-router-dom";

export default function LessonView({
  lesson,
  markdown,
}: {
  lesson: Lesson;
  markdown?: string;
}) {
  return (
    <article className="sm:px-6 py-8 lg:px-10 ">
      <header className="mb-6">
        <h1 className="font-display text-3xl">{lesson.meta.title}</h1>
        <p className="text-sm opacity-70">
          {lesson.meta.topic} · Level {lesson.meta.level}
        </p>
      </header>
      <MD markdown={markdown ?? lesson.body} />

      {lesson.meta.crosslinks && lesson.meta.crosslinks.length > 0 ? (
        <section className="mt-10">
          <h2 className="mb-2 text-sm font-semibold tracking-wide text-zinc-600">
            Crosslinks
          </h2>
          <ul className="space-y-2">
            {lesson.meta.crosslinks.map((cl) => {
              const target = lessonsIndex.find((l) => l.meta.id === cl.to);
              return (
                <li key={cl.to} className="text-sm">
                  <Link to={`/lesson/${cl.to}`} className="underline">
                    {target?.meta.title ?? cl.to}
                  </Link>
                  <span className="ml-2 text-xs text-zinc-500">
                    {target
                      ? `(${target.meta.topic} · L${target.meta.level}) — ${cl.why}`
                      : `— ${cl.why}`}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </article>
  );
}
