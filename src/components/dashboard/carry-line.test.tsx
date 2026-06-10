import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithIntl as render } from "@/test/render-with-intl";
import { CarryLine } from "@/components/dashboard/carry-line";

describe("CarryLine", () => {
  it("shows a positive carry from last month", () => {
    render(<CarryLine carryIn="600.00" />);
    expect(screen.getByText(/report du mois dernier/i)).toBeInTheDocument();
    expect(screen.getByText(/600,00/)).toBeInTheDocument();
  });

  it("shows a negative carry to absorb", () => {
    render(<CarryLine carryIn="-120.00" />);
    expect(screen.getByText(/à absorber/i)).toBeInTheDocument();
  });

  it("renders nothing when carry is zero", () => {
    const { container } = render(<CarryLine carryIn="0" />);
    expect(container).toBeEmptyDOMElement();
  });
});
