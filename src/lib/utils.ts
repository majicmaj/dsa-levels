import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Lesson } from "@/content/loadLessons";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Compares two lessons using level asc, then numeric lesson order asc (supports
 * dotted notation like "1.2"), and finally title A→Z for stability.
 */
export function compareLessons(a: Lesson, b: Lesson): number {
  const levelDelta = a.meta.level - b.meta.level;
  if (levelDelta !== 0) return levelDelta;

  const aLesson = normalizeLessonOrder(a.meta.lesson);
  const bLesson = normalizeLessonOrder(b.meta.lesson);
  if (aLesson !== bLesson) return aLesson - bLesson;

  return a.meta.title.localeCompare(b.meta.title);
}

function normalizeLessonOrder(order: string | number | undefined): number {
  if (order === undefined) return Number.MAX_SAFE_INTEGER;
  if (typeof order === "number") return order;
  // Accept formats like "1.2", "3.10", etc.
  const parts = String(order)
    .trim()
    .split(/\./)
    .map((p) => Number(p));
  if (parts.some((n) => Number.isNaN(n))) return Number.MAX_SAFE_INTEGER;
  // Encode as major * 1000 + minor for stable numeric sort
  const major = parts[0] ?? 0;
  const minor = parts[1] ?? 0;
  const patch = parts[2] ?? 0;
  return major * 1_000_000 + minor * 1_000 + patch;
}
