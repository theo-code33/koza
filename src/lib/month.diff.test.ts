// @vitest-environment node
import { describe, it, expect } from "vitest";
import { monthDiff } from "@/lib/month";

describe("monthDiff", () => {
  it("counts months from a to b, signed", () => {
    expect(monthDiff("2026-01", "2026-01")).toBe(0);
    expect(monthDiff("2026-01", "2026-04")).toBe(3);
    expect(monthDiff("2026-01", "2027-03")).toBe(14);
    expect(monthDiff("2026-05", "2026-02")).toBe(-3);
  });
});
