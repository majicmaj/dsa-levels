import { MD } from "@/content/md";
import type { Lesson } from "@/content/loadLessons";

export default function LessonView({
  lesson,
  markdown,
}: {
  lesson: Lesson;
  markdown?: string;
}) {
  return (
    <article className="mx-auto sm:px-6 py-8 lg:px-10">
      <header className="mb-6">
        <h1 className="font-display text-3xl">{lesson.meta.title}</h1>
        <p className="text-sm opacity-70">
          {lesson.meta.topic} · Level {lesson.meta.level}
        </p>
      </header>
      <MD markdown={markdown ?? lesson.body} />
    </article>
  );
}
