import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { openSearchPalette } from "@/lib/searchPalette";
import { Logo } from "@/components/Logo";
import { isZen, setZen } from "@/lib/zen";

type Props = {
  defaultHref: string;
  topics: [string, number][];
  levels: [number, number][];
  theme: "light" | "dark";
  onToggleTheme: () => void;
};

export function TopNav({
  defaultHref,
  topics,
  levels,
  theme,
  onToggleTheme,
}: Props) {
  const [hidden, setHidden] = useState(false);
  const [zenState, setZenState] = useState<boolean>(() => isZen());
  const lastY = useRef(0);

  useEffect(() => {
    function onScroll() {
      const y = window.scrollY;
      const goingDown = y > lastY.current;
      const past = y > 64; // only start hiding after small scroll
      setHidden(goingDown && past);
      lastY.current = y;
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    function onZenChanged(e: Event) {
      const detail = (e as CustomEvent<boolean>).detail;
      if (typeof detail === "boolean") setZenState(detail);
    }
    window.addEventListener("zen-changed", onZenChanged as EventListener);
    return () =>
      window.removeEventListener("zen-changed", onZenChanged as EventListener);
  }, []);

  return (
    <header
      className={
        "app-topnav sticky top-0 z-30 bg-background/80 backdrop-blur transition-transform duration-200 " +
        (hidden ? "-translate-y-full" : "translate-y-0")
      }
    >
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <Link
          to={defaultHref}
          className="text-xl items-center flex"
          title="DSA Levels"
        >
          <span className="mr-2 inline-flex h-6 w-6 items-center justify-center text-primary">
            <Logo className="h-6 w-6" />
          </span>
          DSA Levels
        </Link>

        {/* Left group: topic buttons (desktop) */}
        <nav className="hidden items-center gap-1 sm:flex">
          {topics.map(([t]) => (
            <Link
              key={t}
              to={`/topic/${t}`}
              className="rounded-md px-2 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900"
            >
              {capitalize(t)}
            </Link>
          ))}
        </nav>

        {/* Right group */}
        <div className="ml-auto flex items-center gap-2">
          <nav className="hidden items-center gap-1 sm:flex">
            {levels.map(([lvl, count]) => (
              <Link
                key={lvl}
                to={`/levels/${lvl}`}
                title={`${count} lesson(s)`}
                className="rounded-md px-2 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900"
              >
                L{lvl}
              </Link>
            ))}
          </nav>
          <button
            onClick={() => setZen(!zenState)}
            className="hidden rounded-md border px-3 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900 sm:inline-flex"
            aria-label="Toggle zen"
            title="Toggle zen mode"
          >
            {zenState ? "Exit Zen" : "Zen"}
          </button>

          <button
            onClick={() => openSearchPalette()}
            className="hidden rounded-md border px-3 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900 sm:inline-flex"
            aria-label="Open search"
          >
            Search (⌘K)
          </button>

          <button
            onClick={onToggleTheme}
            className="rounded-lg border px-3 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? "☀︎ Light" : "☾ Dark"}
          </button>
        </div>
      </div>
    </header>
  );
}

function capitalize(s: string) {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}
