import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Pill } from "@/components/ui/pill";

describe("Pill", () => {
  it("renders its content with the given classes", () => {
    render(<Pill className="text-leisure bg-leisure-bg">Restaurant</Pill>);
    const el = screen.getByText("Restaurant");
    expect(el.className).toContain("text-leisure");
    expect(el.className).toContain("rounded-full");
  });
});
