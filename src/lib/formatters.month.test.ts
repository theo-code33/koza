// @vitest-environment node
import { describe, it, expect } from "vitest";
import { formatMonth } from "@/lib/formatters";

describe("formatMonth", () => {
  it("formats a YYYY-MM into a long French label", () => {
    const label = formatMonth("2026-06");
    expect(label.toLowerCase()).toContain("juin");
    expect(label).toContain("2026");
  });
});
