// @vitest-environment node
import { describe, it, expect } from "vitest";
import { formatMonth, formatMonthShort } from "@/lib/formatters";

describe("formatMonth", () => {
  it("formats a YYYY-MM into a long French label", () => {
    const label = formatMonth("2026-06");
    expect(label.toLowerCase()).toContain("juin");
    expect(label).toContain("2026");
  });
});

describe("formatMonthShort", () => {
  it("formats a month as a short localized label in FR", () => {
    expect(formatMonthShort("2026-01", "fr")).toMatch(/janv/i);
  });

  it("formats a month as a short localized label in EN", () => {
    expect(formatMonthShort("2026-01", "en")).toMatch(/jan/i);
  });
});
