import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Skeleton } from "@/components/ui/skeleton";

describe("Skeleton", () => {
  it("renders a decorative pulsing block and merges custom classes", () => {
    const { container } = render(<Skeleton className="h-8 w-40" />);
    const el = container.firstElementChild as HTMLElement;
    expect(el).toHaveAttribute("aria-hidden");
    expect(el.className).toContain("animate-pulse");
    expect(el.className).toContain("h-8");
    expect(el.className).toContain("w-40");
  });
});
