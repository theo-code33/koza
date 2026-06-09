import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Card } from "@/components/ui/card";

describe("Card", () => {
  it("renders children inside a .card element", () => {
    render(<Card>contenu</Card>);
    const el = screen.getByText("contenu");
    expect(el.className).toContain("card");
  });
});
