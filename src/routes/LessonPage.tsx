import { Link, useParams } from "react-router-dom";
import {
  lessonsIndex,
  type Lesson,
  type LessonCheck,
} from "@/content/loadLessons";
import LessonView from "@/components/LessonView";
import Quiz from "@/components/Quiz";
import { extractQuizSection, parseQuizFromSection } from "@/lib/quiz";
import { useMemo, useState, useEffect } from "react";

/** tiny local progress store (replace with your real store later) */
const KEY = "progress.completedIds";
function getCompleted(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(KEY) || "[]"));
  } catch {
    return new Set();
  }
}
function setCompleted(ids: Set<string>) {
  localStorage.setItem(KEY, JSON.stringify(Array.from(ids)));
}

export default function LessonPage() {
  const { id = "" } = useParams<{ id: string }>();
  const lesson = lessonsIndex.find((l) => l.meta.id === id);

  const [completed, setCompletedState] = useState<Set<string>>(getCompleted());

  useEffect(() => {
    setCompletedState(getCompleted());
  }, [id]);

  const prereqs = useMemo(() => {
    if (!lesson?.meta.prereqs?.length) return [];
    return lesson.meta.prereqs
      .map((pid) => lessonsIndex.find((l) => l.meta.id === pid))
      .filter(Boolean) as Lesson[];
  }, [lesson]);

  // Parse quiz from markdown if present in checks
  const { markdownWithoutQuiz, parsedQuiz } = useMemo(() => {
    if (!lesson)
      return {
        markdownWithoutQuiz: "",
        parsedQuiz: null as ReturnType<typeof parseQuizFromSection>,
      };

    const checks: LessonCheck[] | undefined = lesson.meta.checks;
    const quizCheck = checks?.find((c) => c.type === "quiz") as
      | { type: "quiz"; id?: string }
      | undefined;

    const { quizSection, stripped } = extractQuizSection(lesson.body);
    const parsed =
      quizSection && quizCheck
        ? parseQuizFromSection(quizSection, quizCheck.id || lesson.meta.id)
        : null;
    return { markdownWithoutQuiz: stripped || lesson.body, parsedQuiz: parsed };
  }, [lesson]);

  if (!lesson) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="font-display text-3xl">Lesson not found</h1>
        <Link to="/" className="mt-4 inline-block underline">
          ← Back
        </Link>
      </div>
    );
  }

  const unmet = prereqs.filter((p) => !completed.has(p.meta.id));
  const siblings = lessonsIndex
    .filter((l) => l.meta.topic === lesson.meta.topic)
    .sort(
      (a, b) =>
        a.meta.level - b.meta.level || a.meta.title.localeCompare(b.meta.title)
    );
  const idx = siblings.findIndex((s) => s.meta.id === id);
  const prev = idx > 0 ? siblings[idx - 1] : undefined;
  const next =
    idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : undefined;

  function toggleComplete() {
    const copy = new Set(completed);
    if (copy.has(id)) copy.delete(id);
    else copy.add(id);
    setCompleted(copy);
    setCompletedState(new Set(copy));
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      {/* breadcrumbs */}
      <nav className="mb-6 text-sm text-zinc-600">
        <Link to="/" className="underline">
          Home
        </Link>
        <span className="mx-2">/</span>
        <Link to={`/topic/${lesson.meta.topic}`} className="underline">
          {capitalize(lesson.meta.topic)}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-900 dark:text-zinc-100">
          {lesson.meta.title}
        </span>
      </nav>

      {/* meta header */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs text-accent-foreground">
          Level {lesson.meta.level}
        </span>
        <span className="text-xs text-zinc-500">
          {lesson.meta.est_minutes ?? 15}m
        </span>
        {lesson.meta.tags?.map((t) => (
          <span
            key={t}
            className="rounded-full border px-2 py-0.5 text-xs text-zinc-600"
          >
            {t}
          </span>
        ))}
        <button
          onClick={toggleComplete}
          className="ml-auto rounded-lg bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:opacity-90"
        >
          {completed.has(id) ? "✓ Marked Complete" : "Mark Complete"}
        </button>
      </div>

      {/* unmet prereqs callout */}
      {unmet.length > 0 && (
        <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950 dark:bg-amber-900/20 dark:text-amber-200">
          <p className="font-semibold">Prerequisites</p>
          <ul className="mt-2 list-inside list-disc">
            {unmet.map((p) => (
              <li key={p.meta.id}>
                <Link className="underline" to={`/lesson/${p.meta.id}`}>
                  {p.meta.title}
                </Link>
                <span className="ml-2 text-xs text-zinc-500">
                  ({capitalize(p.meta.topic)} · L{p.meta.level})
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* the lesson */}
      <LessonView
        lesson={lesson}
        markdown={markdownWithoutQuiz || lesson.body}
      />

      {/* quiz */}
      {parsedQuiz ? (
        <div className="mt-10">
          <Quiz quiz={parsedQuiz} />
        </div>
      ) : null}

      {/* pager */}
      <div className="mt-10 flex items-center justify-between">
        {prev ? (
          <Link
            to={`/lesson/${prev.meta.id}`}
            className="rounded-lg border px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-900"
          >
            ← {prev.meta.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            to={`/lesson/${next.meta.id}`}
            className="rounded-lg border px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-900"
          >
            {next.meta.title} →
          </Link>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}

function capitalize(s: string) {
  return s.slice(0, 1).toUpperCase() + s.slice(1);
}
