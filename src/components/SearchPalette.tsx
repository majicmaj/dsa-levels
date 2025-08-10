import { useEffect, useMemo, useState } from "react";
import { lessonsIndex } from "@/content/loadLessons";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useNavigate } from "react-router-dom";
import { toggleZen } from "@/lib/zen";

export function SearchPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    }
    function onOpen() {
      setOpen(true);
    }
    function onToggleZen() {
      toggleZen();
      setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("open-search-palette", onOpen as EventListener);
    window.addEventListener("toggle-zen", onToggleZen as EventListener);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(
        "open-search-palette",
        onOpen as EventListener
      );
      window.removeEventListener("toggle-zen", onToggleZen as EventListener);
    };
  }, []);

  const { titleMatches, contentMatches } = useMemo(() => {
    if (!query.trim()) return { titleMatches: [], contentMatches: [] };
    const q = query.toLowerCase();
    const titleMatches = lessonsIndex.filter((l) =>
      l.meta.title.toLowerCase().includes(q)
    );
    const contentMatches = lessonsIndex.filter(
      (l) => !titleMatches.includes(l) && l.body.toLowerCase().includes(q)
    );
    return { titleMatches, contentMatches };
  }, [query]);

  function onSelect(id: string) {
    setOpen(false);
    setQuery("");
    navigate(`/lesson/${id}`);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <Command>
          <CommandInput
            autoFocus
            placeholder="Search lessons… (⌘/Ctrl + K)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <CommandList>
            <CommandGroup heading="Actions">
              <CommandItem
                onClick={() =>
                  window.dispatchEvent(new CustomEvent("toggle-zen"))
                }
              >
                <span className="truncate">Toggle Zen Mode</span>
              </CommandItem>
            </CommandGroup>
            <CommandGroup heading="Title matches">
              {titleMatches.length === 0 ? (
                <div className="px-3 py-2 text-sm text-zinc-500">
                  No matches
                </div>
              ) : (
                titleMatches.map((l) => (
                  <CommandItem
                    key={l.meta.id}
                    onClick={() => onSelect(l.meta.id)}
                  >
                    <span className="truncate">{l.meta.title}</span>
                    <span className="text-xs text-zinc-500">
                      {l.meta.topic} · L{l.meta.level}
                    </span>
                  </CommandItem>
                ))
              )}
            </CommandGroup>
            <CommandGroup heading="Content matches">
              {contentMatches.length === 0 ? (
                <div className="px-3 py-2 text-sm text-zinc-500">
                  No matches
                </div>
              ) : (
                contentMatches.map((l) => (
                  <CommandItem
                    key={l.meta.id}
                    onClick={() => onSelect(l.meta.id)}
                  >
                    <span className="truncate">{l.meta.title}</span>
                    <span className="text-xs text-zinc-500">
                      {l.meta.topic} · L{l.meta.level}
                    </span>
                  </CommandItem>
                ))
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
