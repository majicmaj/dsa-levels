import { useOutlet } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { lessonsIndex } from "@/content/loadLessons";
import { Sidebar } from "@/components/Sidebar";
import { SearchPalette } from "@/components/SearchPalette";
import { TopNav } from "@/components/TopNav";
import { ZenToggle } from "@/components/ZenToggle";
import { LessonTOC } from "./components/LessonTOC";

export default function App() {
  const outlet = useOutlet();

  // simple dark-mode toggle using CSS variables defined in index.css
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    return (localStorage.getItem("theme") as "light" | "dark") || "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  // derive topics and levels directly from lessons in /lessons
  const { topics, levels, defaultHref } = useMemo(() => {
    const topicCounts = new Map<string, number>();
    const levelCounts = new Map<number, number>();
    for (const l of lessonsIndex) {
      topicCounts.set(l.meta.topic, (topicCounts.get(l.meta.topic) ?? 0) + 1);
      levelCounts.set(l.meta.level, (levelCounts.get(l.meta.level) ?? 0) + 1);
    }
    const topicsSorted = Array.from(topicCounts.entries()).sort((a, b) =>
      a[0].localeCompare(b[0])
    ); // [topic, count]
    const levelsSorted = Array.from(levelCounts.entries()).sort(
      (a, b) => a[0] - b[0]
    ); // [level, count]

    // choose a sensible default for the brand link (independent of any "home" route)
    const href = "/";
    // (levelsSorted[0] && `/levels/${levelsSorted[0][0]}`) ||
    // (topicsSorted[0] && `/topic/${topicsSorted[0][0]}`) ||
    // (lessonsIndex[0] && `/lesson/${lessonsIndex[0].meta.id}`) ||
    // "/";

    return { topics: topicsSorted, levels: levelsSorted, defaultHref: href };
  }, []);

  return (
    <div className="min-h-svh flex flex-col bg-background text-foreground">
      <TopNav
        defaultHref={defaultHref}
        topics={topics}
        levels={levels}
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
      />

      {/* Main with sidebar on large screens */}
      <main className="max-w-8xl px-4 py-8 flex-1">
        <div className="layout-grid grid gap-8 lg:grid-cols-[260px_1fr_260px]">
          <Sidebar />
          <div className="w-full">{outlet}</div>
          <div className="app-rightbar">
            {/* Mount a global TOC that reacts to lesson pages; when not on lesson, it will render nothing */}
            <LessonTOC markdown={getCurrentLessonBody() || ""} />
          </div>
        </div>
      </main>

      <footer className="border-t py-6 text-center text-sm opacity-70">
        Built with Vite · Tailwind v4 · shadcn/ui · React Router
      </footer>

      {/* Command Palette */}
      <SearchPalette />
      <ZenToggle />
    </div>
  );
}

/** Simple dropdown using <details> (no extra deps) */
//

function getCurrentLessonBody(): string | null {
  if (typeof window === "undefined") return null;
  const m = window.location.pathname.match(/^\/lesson\/(.+)$/);
  if (!m) return null;
  const id = decodeURIComponent(m[1]);
  const found = lessonsIndex.find((l) => l.meta.id === id);
  return found ? found.body : null;
}
