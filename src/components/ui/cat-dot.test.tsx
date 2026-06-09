import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CatDot } from "@/components/ui/cat-dot";

describe("CatDot", () => {
  it("renders a dot tinted with the category color", () => {
    render(<CatDot category="savings" />);
    const dot = screen.getByTestId("cat-dot");
    expect(dot.className).toContain("bg-savings");
  });
});
