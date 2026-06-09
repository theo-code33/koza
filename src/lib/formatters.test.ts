import { describe, it, expect } from "vitest";
import { formatEUR } from "@/lib/formatters";

describe("formatEUR", () => {
  it("formats euros in French by default", () => {
    expect(formatEUR(1250).replace(/\s/g, " ")).toBe("1 250,00 €");
  });

  it("formats euros in English when asked", () => {
    expect(formatEUR(1250, "en")).toBe("€1,250.00");
  });
});
