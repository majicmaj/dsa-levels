import { useEffect, useState } from "react";

export function ZenToggle() {
  const [zen, setZen] = useState<boolean>(() =>
    typeof document !== "undefined"
      ? document.documentElement.classList.contains("zen")
      : false
  );

  useEffect(() => {
    const root = document.documentElement;
    if (zen) root.classList.add("zen");
    else root.classList.remove("zen");
  }, [zen]);

  useEffect(() => {
    function onZenChanged(e: Event) {
      const detail = (e as CustomEvent<boolean>).detail;
      if (typeof detail === "boolean") setZen(detail);
    }
    window.addEventListener("zen-changed", onZenChanged as EventListener);
    return () => window.removeEventListener("zen-changed", onZenChanged as EventListener);
  }, []);

  if (!zen) return null;

  return (
    <button
      onClick={() => setZen(false)}
      title="Exit zen mode"
      className="fixed bottom-4 right-4 z-[9999] rounded-lg border bg-background/80 px-3 py-1.5 text-sm backdrop-blur hover:bg-zinc-50 dark:hover:bg-zinc-900"
    >
      Exit zen
    </button>
  );
}

export function ZenEnterButton() {
  const [zen, setZen] = useState<boolean>(() =>
    typeof document !== "undefined"
      ? document.documentElement.classList.contains("zen")
      : false
  );

  useEffect(() => {
    function onZenChanged(e: Event) {
      const detail = (e as CustomEvent<boolean>).detail;
      if (typeof detail === "boolean") setZen(detail);
    }
    window.addEventListener("zen-changed", onZenChanged as EventListener);
    return () => window.removeEventListener("zen-changed", onZenChanged as EventListener);
  }, []);

  if (zen) return null;
  return (
    <button
      onClick={() => setZen(true)}
      title="Enter zen mode"
      className="hidden rounded-lg border px-3 py-1.5 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900 lg:inline-flex"
    >
      Zen
    </button>
  );
}
