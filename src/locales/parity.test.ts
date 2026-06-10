// @vitest-environment node
import { describe, it, expect } from "vitest";
import fr from "@/locales/fr.json";
import en from "@/locales/en.json";

// Aplatit les clés imbriquées en chemins "a.b.c".
function keyPaths(obj: Record<string, unknown>, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return value && typeof value === "object" && !Array.isArray(value)
      ? keyPaths(value as Record<string, unknown>, path)
      : [path];
  });
}

describe("locale catalogs", () => {
  it("fr and en expose the exact same key set", () => {
    expect(keyPaths(fr).sort()).toEqual(keyPaths(en).sort());
  });
});
