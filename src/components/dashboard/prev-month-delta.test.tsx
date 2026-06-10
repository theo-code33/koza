import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PrevMonthDelta } from "@/components/dashboard/prev-month-delta";

describe("PrevMonthDelta", () => {
  it("says less when spending dropped", () => {
    render(<PrevMonthDelta current="400.00" previous="500.00" />);
    expect(screen.getByText(/de moins que le mois dernier/)).toBeInTheDocument();
  });

  it("says more when spending rose", () => {
    render(<PrevMonthDelta current="600.00" previous="500.00" />);
    expect(screen.getByText(/de plus que le mois dernier/)).toBeInTheDocument();
  });

  it("renders nothing when both totals are zero", () => {
    const { container } = render(<PrevMonthDelta current="0" previous="0" />);
    expect(container).toBeEmptyDOMElement();
  });
});
