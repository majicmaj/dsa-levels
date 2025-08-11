// Attach Buffer polyfill to the window/globalThis for libraries expecting it
// This is safe in modern browsers; only defines if missing.
import { Buffer } from "buffer";

declare global {
  interface Window {
    Buffer?: typeof Buffer;
  }
}

if (typeof window !== "undefined" && !window.Buffer) {
  window.Buffer = Buffer;
}

// Assign to globalThis in environments that expect Node globals
declare const globalThis: typeof window & { Buffer?: typeof Buffer };
if (typeof globalThis !== "undefined" && !globalThis.Buffer) {
  (globalThis as unknown as { Buffer?: typeof Buffer }).Buffer = Buffer;
}
