import { describe, it, expect } from "vitest";
import { CATEGORIES, CATEGORY_ORDER } from "@/lib/categories";

describe("categories", () => {
  it("orders essential, leisure, savings", () => {
    expect(CATEGORY_ORDER).toEqual(["essential", "leisure", "savings"]);
  });

  it("maps each category to its token classes and share", () => {
    expect(CATEGORIES.essential.share).toBe(0.5);
    expect(CATEGORIES.leisure.share).toBe(0.3);
    expect(CATEGORIES.savings.share).toBe(0.2);
    expect(CATEGORIES.essential.dotClass).toBe("bg-essential");
    expect(CATEGORIES.leisure.bgClass).toBe("bg-leisure-bg");
    expect(CATEGORIES.savings.textClass).toBe("text-savings");
  });
});
