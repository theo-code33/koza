import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// jsdom n'implémente pas matchMedia, requis par next-themes (détection système).
// Les tests en environnement node (routes API) n'ont pas de `window` : on garde le stub côté DOM.
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}
