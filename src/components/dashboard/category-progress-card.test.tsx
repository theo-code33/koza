import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CategoryProgressCard } from "@/components/dashboard/category-progress-card";

describe("CategoryProgressCard", () => {
  it("shows label, spent over target and a progress bar", () => {
    render(<CategoryProgressCard category="essential" spent="500.00" target="1000.00" />);
    expect(screen.getByText("Essentiels")).toBeInTheDocument();
    expect(screen.getByText(/500,00/)).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("uses the soft over tone when spent exceeds target", () => {
    render(<CategoryProgressCard category="leisure" spent="400.00" target="300.00" />);
    const ratio = screen.getByText(/400,00/);
    expect(ratio.className).toContain("text-over");
  });
});
