import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

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

  return (
    <header
      className={
        "sticky top-0 z-30 border-b bg-background/80 backdrop-blur transition-transform duration-200 " +
        (hidden ? "-translate-y-full" : "translate-y-0")
      }
    >
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link
          to={defaultHref}
          className="font-display text-xl"
          title="DSA Levels"
        >
          <span className="mr-1">Σ</span>
          DSA Levels
        </Link>

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
          onClick={onToggleTheme}
          className="rounded-lg border px-3 py-1.5 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? "☀︎ Light" : "☾ Dark"}
        </button>
      </div>
    </header>
  );
}

function capitalize(s: string) {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}
