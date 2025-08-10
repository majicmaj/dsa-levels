export function isZen(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("zen");
}

export function setZen(on: boolean) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (on) root.classList.add("zen");
  else root.classList.remove("zen");
  try {
    localStorage.setItem("zen", on ? "1" : "0");
  } catch {}
  try {
    window.dispatchEvent(new CustomEvent("zen-changed", { detail: on }));
  } catch {}
}

export function toggleZen() {
  setZen(!isZen());
}
