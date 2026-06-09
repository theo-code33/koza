import { describe, it, expect } from "vitest";
import { subcategoryLabel } from "@/lib/subcategories";

describe("subcategoryLabel", () => {
  it("returns the French label of a known subcategory", () => {
    expect(subcategoryLabel("food")).toBe("Alimentation");
    expect(subcategoryLabel("etf")).toBe("ETF");
  });

  it("falls back to the key when unknown", () => {
    expect(subcategoryLabel("does_not_exist")).toBe("does_not_exist");
  });
});
