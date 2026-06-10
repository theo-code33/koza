// @vitest-environment node
import { describe, it, expect } from "vitest";
import { SUBCATEGORIES, isValidSubcategory, defaultSubcategory } from "@/lib/subcategories";

describe("subcategories", () => {
  it("validates membership by category", () => {
    expect(isValidSubcategory("essential", "housing")).toBe(true);
    expect(isValidSubcategory("leisure", "housing")).toBe(false);
  });

  it("returns the first key as default", () => {
    expect(defaultSubcategory("essential")).toBe("housing");
    expect(defaultSubcategory("savings")).toBe("savings_account");
  });

  it("every subcategory carries its parent category", () => {
    for (const [category, subs] of Object.entries(SUBCATEGORIES)) {
      for (const sub of subs) expect(sub.category).toBe(category);
    }
  });
});
