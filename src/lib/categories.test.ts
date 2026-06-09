import { describe, it, expect } from "vitest";
import { CATEGORIES, CATEGORY_ORDER } from "@/lib/categories";

describe("categories", () => {
  it("orders essential, leisure, savings", () => {
    expect(CATEGORY_ORDER).toEqual(["essential", "leisure", "savings"]);
  });

  it("maps each category to a French label and token classes", () => {
    expect(CATEGORIES.essential.label).toBe("Essentiels");
    expect(CATEGORIES.leisure.label).toBe("Loisirs");
    expect(CATEGORIES.savings.label).toBe("Épargne");
    expect(CATEGORIES.essential.dotClass).toBe("bg-essential");
    expect(CATEGORIES.leisure.bgClass).toBe("bg-leisure-bg");
    expect(CATEGORIES.savings.textClass).toBe("text-savings");
  });
});
