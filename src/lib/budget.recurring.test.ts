// @vitest-environment node
import { describe, it, expect } from "vitest";
import { isTriggerMonth } from "@/lib/budget";

describe("isTriggerMonth", () => {
  it("monthly triggers every month from the anchor", () => {
    const r = { frequency: "MONTHLY" as const, anchorMonth: "2026-01" };
    expect(isTriggerMonth(r, "2026-01")).toBe(true);
    expect(isTriggerMonth(r, "2026-02")).toBe(true);
    expect(isTriggerMonth(r, "2025-12")).toBe(false);
  });

  it("quarterly triggers every 3 months from the anchor", () => {
    const r = { frequency: "QUARTERLY" as const, anchorMonth: "2026-01" };
    expect(isTriggerMonth(r, "2026-01")).toBe(true);
    expect(isTriggerMonth(r, "2026-04")).toBe(true);
    expect(isTriggerMonth(r, "2026-03")).toBe(false);
  });

  it("yearly triggers every 12 months from the anchor", () => {
    const r = { frequency: "YEARLY" as const, anchorMonth: "2026-03" };
    expect(isTriggerMonth(r, "2026-03")).toBe(true);
    expect(isTriggerMonth(r, "2027-03")).toBe(true);
    expect(isTriggerMonth(r, "2026-09")).toBe(false);
  });
});
