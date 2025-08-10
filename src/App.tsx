import { Link, useOutlet } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { lessonsIndex } from "@/content/loadLessons";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

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
    const href =
      (levelsSorted[0] && `/levels/${levelsSorted[0][0]}`) ||
      (topicsSorted[0] && `/topic/${topicsSorted[0][0]}`) ||
      (lessonsIndex[0] && `/lesson/${lessonsIndex[0].meta.id}`) ||
      "/";

    return { topics: topicsSorted, levels: levelsSorted, defaultHref: href };
  }, []);

  return (
    <div className="min-h-svh bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <Link
            to={defaultHref}
            className="font-display text-xl"
            title="DSA Levels"
          >
            <span className="mr-1">Σ</span>
            DSA Levels
          </Link>

          {/* Dynamic nav using shadcn Navigation Menu */}
          <div className="ml-auto hidden items-center gap-2 sm:flex">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Topics</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid min-w-64 gap-1 p-1">
                      {topics.length === 0 ? (
                        <span className="block px-3 py-2 text-sm text-zinc-500">
                          No topics
                        </span>
                      ) : (
                        topics.map(([t, count]) => (
                          <NavigationMenuLink asChild key={t}>
                            <Link
                              to={`/topic/${t}`}
                              className="flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900"
                            >
                              <span>{capitalize(t)}</span>
                              <span className="text-xs text-zinc-500">
                                {count}
                              </span>
                            </Link>
                          </NavigationMenuLink>
                        ))
                      )}
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuTrigger>Levels</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid min-w-44 grid-cols-5 gap-1 p-1">
                      {levels.length === 0 ? (
                        <span className="col-span-5 block px-3 py-2 text-sm text-zinc-500">
                          No levels
                        </span>
                      ) : (
                        levels.map(([lvl, count]) => (
                          <NavigationMenuLink asChild key={lvl}>
                            <Link
                              to={`/levels/${lvl}`}
                              className="flex items-center justify-center rounded-md px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900"
                              title={`${count} lesson(s)`}
                            >
                              L{lvl}
                            </Link>
                          </NavigationMenuLink>
                        ))
                      )}
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuIndicator />
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          <button
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
            className="rounded-lg border px-3 py-1.5 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? "☀︎ Light" : "☾ Dark"}
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-6xl px-4 py-8">{outlet}</main>

      <footer className="border-t py-6 text-center text-sm opacity-70">
        Built with Vite · Tailwind v4 · shadcn/ui · React Router
      </footer>
    </div>
  );
}

/** Simple dropdown using <details> (no extra deps) */
function capitalize(s: string) {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}
