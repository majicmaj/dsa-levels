import matter from "gray-matter";

// Load ALL markdown files under /lessons as raw strings at build time.
const rawFiles = import.meta.glob("/src/lessons/**/*.md", {
  as: "raw",
  eager: true,
}); // vite feature

// src/content/loadLessons.ts

export type LessonCheck =
  | { type: "quiz"; id?: string }
  | { type: "unit"; entry: string; tests: string };

export type LessonMeta = {
  id: string;
  title: string;
  topic: string;
  level: number;
  lesson?: string | number;
  prereqs?: string[];
  tags?: string[];
  est_minutes?: number;
  checks?: LessonCheck[];
  outcomes?: string[];
};

export type Lesson = {
  meta: LessonMeta;
  body: string;
  path: string;
};

export function loadLessons(): Lesson[] {
  return Object.entries(rawFiles).map(([path, raw]) => {
    const { data, content } = matter(raw as string);
    // infer id if missing: arrays/l2-core-apis/lesson.md -> arrays-l2-core-apis
    const id =
      (data.id as string) ??
      path
        .replace(/^\/src\/lessons\//, "")
        .replace(/\/lesson\.md$/, "")
        .replace(/\//g, "-");

    const meta: LessonMeta = {
      id,
      title: data.title ?? id,
      topic: data.topic ?? path.split("/")[3],
      level: Number(data.level ?? path.match(/\/l(\d)-/)?.[1] ?? 1),
      lesson: data.lesson ?? undefined,
      prereqs: data.prereqs ?? [],
      tags: data.tags ?? [],
      est_minutes: data.est_minutes ?? undefined,
      checks: data.checks ?? [],
      outcomes: Array.isArray(data.outcomes) ? data.outcomes : undefined,
    };

    return { meta, body: content, path };
  });
}

export const lessonsIndex = loadLessons();
