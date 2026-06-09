import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProgressBar } from "@/components/ui/progress-bar";

describe("ProgressBar", () => {
  it("clamps the fill width to 100% even when over budget", () => {
    render(<ProgressBar value={150} max={100} fillClass="bg-essential" />);
    const fill = screen.getByTestId("progress-fill");
    expect(fill.style.width).toBe("100%");
  });

  it("uses the soft over color when over budget, the category color otherwise", () => {
    const { rerender } = render(<ProgressBar value={50} max={100} fillClass="bg-essential" />);
    expect(screen.getByTestId("progress-fill").className).toContain("bg-essential");
    rerender(<ProgressBar value={120} max={100} fillClass="bg-essential" />);
    expect(screen.getByTestId("progress-fill").className).toContain("bg-over");
  });

  it("exposes progressbar semantics", () => {
    render(<ProgressBar value={40} max={100} fillClass="bg-leisure" />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "40");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
  });
});
