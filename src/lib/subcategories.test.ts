import { describe, it, expect } from "vitest";
import { CATEGORY_ORDER } from "@/lib/categories";
import {
  SUBCATEGORIES,
  ALL_SUBCATEGORIES,
  SUBCATEGORY_KEYS,
  isValidSubcategory,
} from "@/lib/subcategories";

describe("subcategories", () => {
  it("tags every subcategory with its owning category", () => {
    for (const category of CATEGORY_ORDER) {
      for (const sub of SUBCATEGORIES[category]) {
        expect(sub.category).toBe(category);
      }
    }
  });

  it("has 17 unique keys across all categories", () => {
    expect(ALL_SUBCATEGORIES).toHaveLength(17);
    expect(SUBCATEGORY_KEYS.size).toBe(17);
  });

  it("validates a key against its own category", () => {
    expect(isValidSubcategory("essential", "housing")).toBe(true);
    expect(isValidSubcategory("savings", "etf")).toBe(true);
  });

  it("rejects a key from another category or an unknown key", () => {
    expect(isValidSubcategory("essential", "etf")).toBe(false);
    expect(isValidSubcategory("leisure", "does_not_exist")).toBe(false);
  });
});
